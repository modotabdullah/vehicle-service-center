const express = require('express');
const router = express.Router();
const { query, withUserTransaction } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/invoices (List all invoices with job, customer and vehicle details)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { payment_status } = req.query;
    let sql = `
      SELECT i.*, 
             sj.job_date, sj.status AS job_status,
             v.license_plate, v.make, v.model,
             c.customer_id, c.full_name AS customer_name, c.phone AS customer_phone,
             COALESCE((SELECT SUM(amount_paid) FROM payment p WHERE p.invoice_id = i.invoice_id), 0) AS total_paid
      FROM invoice i
      JOIN service_job sj ON sj.job_id = i.job_id
      JOIN vehicle v ON v.vehicle_id = sj.vehicle_id
      JOIN customer c ON c.customer_id = v.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'customer') {
      params.push(req.user.customer_id);
      sql += ` AND c.customer_id = $${params.length}`;
    }

    if (payment_status) {
      params.push(payment_status);
      sql += ` AND i.payment_status = $${params.length}`;
    }

    sql += ' ORDER BY i.invoice_date DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List invoices error:', err);
    res.status(500).json({ message: 'Error retrieving invoices', error: err.message });
  }
});

// GET /api/invoices/:id (Detailed invoice view with line items & payments)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const invoiceRes = await query(
      `SELECT i.*, 
              sj.job_date, sj.status AS job_status, sj.total_labor_cost, sj.total_parts_cost,
              v.vin, v.license_plate, v.make, v.model, v.year,
              c.customer_id, c.full_name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, c.address AS customer_address,
              m.full_name AS mechanic_name
       FROM invoice i
       JOIN service_job sj ON sj.job_id = i.job_id
       JOIN vehicle v ON v.vehicle_id = sj.vehicle_id
       JOIN customer c ON c.customer_id = v.customer_id
       LEFT JOIN mechanic m ON m.mechanic_id = sj.mechanic_id
       WHERE i.invoice_id = $1`,
      [id]
    );

    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = invoiceRes.rows[0];

    if (req.user.role === 'customer' && invoice.customer_id !== req.user.customer_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch payments
    const paymentsRes = await query(
      'SELECT * FROM payment WHERE invoice_id = $1 ORDER BY payment_date DESC',
      [id]
    );

    // Fetch items and parts
    const [itemsRes, partsRes] = await Promise.all([
      query('SELECT * FROM service_item WHERE job_id = $1', [invoice.job_id]),
      query(
        `SELECT jpu.*, ip.part_name, ip.part_number
         FROM job_part_usage jpu
         JOIN inventory_part ip ON ip.part_id = jpu.part_id
         WHERE jpu.job_id = $1`,
        [invoice.job_id]
      ),
    ]);

    res.json({
      ...invoice,
      payments: paymentsRes.rows,
      items: itemsRes.rows,
      parts: partsRes.rows,
    });
  } catch (err) {
    console.error('Invoice details error:', err);
    res.status(500).json({ message: 'Error retrieving invoice details', error: err.message });
  }
});

// POST /api/invoices/generate/:jobId (Generates or finalizes an invoice for a completed/in_progress job)
router.post('/generate/:jobId', authenticateToken, requireRole('system_admin', 'service_advisor'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { tax_rate = 0.05 } = req.body; // default 5% tax

    // Check if invoice already exists
    const existing = await query('SELECT invoice_id FROM invoice WHERE job_id = $1', [jobId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'An invoice already exists for this job', invoice_id: existing.rows[0].invoice_id });
    }

    // Calculate subtotal using PostgreSQL function calculate_job_total
    const totalRes = await query('SELECT calculate_job_total($1) as subtotal', [jobId]);
    const subtotal = parseFloat(totalRes.rows[0].subtotal || 0);

    const tax_amount = Math.round(subtotal * parseFloat(tax_rate) * 100) / 100;
    const grand_total = subtotal + tax_amount;

    const result = await query(
      `INSERT INTO invoice (job_id, invoice_date, tax_amount, grand_total, payment_status)
       VALUES ($1, NOW(), $2, $3, 'unpaid')
       RETURNING *`,
      [jobId, tax_amount, grand_total]
    );

    res.status(201).json({
      message: 'Invoice generated successfully',
      invoice: result.rows[0],
    });
  } catch (err) {
    console.error('Generate invoice error:', err);
    res.status(500).json({ message: 'Error generating invoice', error: err.message });
  }
});

// POST /api/invoices/:id/payments (Record a payment using procedure process_invoice_payment & trigger audit)
router.post('/:id/payments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount_paid, payment_method } = req.body;

    if (!amount_paid || parseFloat(amount_paid) <= 0 || !payment_method) {
      return res.status(400).json({ message: 'Valid amount_paid and payment_method are required.' });
    }

    const validMethods = ['cash', 'card', 'bank_transfer', 'mobile_banking'];
    if (!validMethods.includes(payment_method)) {
      return res.status(400).json({ message: `Invalid payment method. Must be one of: ${validMethods.join(', ')}` });
    }

    // Run within user session context so trigger_audit_invoice_changes captures user_id!
    await withUserTransaction(req.user.user_id, async (client) => {
      // Call procedure process_invoice_payment(p_invoice_id, p_amount, p_method)
      await client.query('CALL process_invoice_payment($1, $2, $3)', [
        parseInt(id, 10),
        parseFloat(amount_paid),
        payment_method,
      ]);
    });

    // Fetch updated invoice
    const updatedInvoice = await query('SELECT * FROM invoice WHERE invoice_id = $1', [id]);

    res.status(201).json({
      message: 'Payment processed successfully',
      invoice: updatedInvoice.rows[0],
    });
  } catch (err) {
    console.error('Process payment error:', err);
    res.status(400).json({ message: err.message || 'Failed to process payment' });
  }
});

module.exports = router;

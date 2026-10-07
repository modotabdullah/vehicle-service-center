const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/jobs/active (Uses active_service_jobs_view)
router.get('/active', authenticateToken, async (req, res) => {
  try {
    let sql = 'SELECT * FROM active_service_jobs_view';
    const params = [];

    if (req.user.role === 'customer') {
      sql += ' WHERE customer_id = $1';
      params.push(req.user.customer_id);
    }

    sql += ' ORDER BY job_date DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Active jobs error:', err);
    res.status(500).json({ message: 'Error retrieving active jobs', error: err.message });
  }
});

// GET /api/jobs (List all with filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, mechanic_id, search } = req.query;
    let sql = `
      SELECT sj.job_id, sj.vehicle_id, sj.mechanic_id, sj.job_date, sj.status,
             sj.total_labor_cost, sj.total_parts_cost,
             (sj.total_labor_cost + sj.total_parts_cost) AS total_estimated_cost,
             v.vin, v.license_plate, v.make, v.model, v.year,
             c.customer_id, c.full_name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
             m.full_name AS mechanic_name, m.specialization,
             i.invoice_id, i.payment_status, i.grand_total
      FROM service_job sj
      JOIN vehicle v ON v.vehicle_id = sj.vehicle_id
      JOIN customer c ON c.customer_id = v.customer_id
      LEFT JOIN mechanic m ON m.mechanic_id = sj.mechanic_id
      LEFT JOIN invoice i ON i.job_id = sj.job_id
      WHERE 1=1
    `;
    const params = [];

    // Role-based restrictions
    if (req.user.role === 'customer') {
      params.push(req.user.customer_id);
      sql += ` AND c.customer_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND sj.status = $${params.length}`;
    }

    if (mechanic_id) {
      params.push(mechanic_id);
      sql += ` AND sj.mechanic_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (
        LOWER(v.license_plate) LIKE $${params.length} OR
        LOWER(v.make) LIKE $${params.length} OR
        LOWER(v.model) LIKE $${params.length} OR
        LOWER(c.full_name) LIKE $${params.length}
      )`;
    }

    sql += ' ORDER BY sj.job_date DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List jobs error:', err);
    res.status(500).json({ message: 'Error retrieving service jobs', error: err.message });
  }
});

// GET /api/jobs/:id (Detailed job view with items, parts and invoice)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch job header
    const jobResult = await query(
      `SELECT sj.*,
              v.vin, v.license_plate, v.make, v.model, v.year,
              c.customer_id, c.full_name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, c.address AS customer_address,
              m.mechanic_id, m.full_name AS mechanic_name, m.specialization, m.hourly_rate, m.phone AS mechanic_phone
       FROM service_job sj
       JOIN vehicle v ON v.vehicle_id = sj.vehicle_id
       JOIN customer c ON c.customer_id = v.customer_id
       LEFT JOIN mechanic m ON m.mechanic_id = sj.mechanic_id
       WHERE sj.job_id = $1`,
      [id]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ message: 'Service job not found' });
    }

    const job = jobResult.rows[0];

    // Customer check
    if (req.user.role === 'customer' && job.customer_id !== req.user.customer_id) {
      return res.status(403).json({ message: 'Access denied to this job record.' });
    }

    // 2. Fetch service items
    const itemsResult = await query(
      'SELECT * FROM service_item WHERE job_id = $1 ORDER BY item_id ASC',
      [id]
    );

    // 3. Fetch part usages
    const partsResult = await query(
      `SELECT jpu.*, ip.part_name, ip.part_number, ip.quantity_in_stock
       FROM job_part_usage jpu
       JOIN inventory_part ip ON ip.part_id = jpu.part_id
       WHERE jpu.job_id = $1
       ORDER BY jpu.usage_id ASC`,
      [id]
    );

    // 4. Fetch invoice if exists
    const invoiceResult = await query(
      `SELECT i.*, 
              COALESCE((SELECT json_agg(p.* ORDER BY p.payment_date DESC) FROM payment p WHERE p.invoice_id = i.invoice_id), '[]'::json) AS payments
       FROM invoice i
       WHERE i.job_id = $1`,
      [id]
    );

    res.json({
      ...job,
      items: itemsResult.rows,
      parts: partsResult.rows,
      invoice: invoiceResult.rows[0] || null,
    });
  } catch (err) {
    console.error('Job details error:', err);
    res.status(500).json({ message: 'Error retrieving job details', error: err.message });
  }
});

// POST /api/jobs (Create new service job using procedure or direct insert)
router.post('/', authenticateToken, requireRole('system_admin', 'service_advisor'), async (req, res) => {
  try {
    const { vehicle_id, customer_id, mechanic_id } = req.body;

    if (!vehicle_id || !customer_id) {
      return res.status(400).json({ message: 'vehicle_id and customer_id are required' });
    }

    // Call stored procedure create_service_job(p_vehicle_id, p_customer_id, p_mechanic_id, INOUT p_job_id)
    const procResult = await query(
      'CALL create_service_job($1, $2, $3, $4)',
      [vehicle_id, customer_id, mechanic_id || null, null]
    );

    const newJobId = procResult.rows[0]?.p_job_id;

    res.status(201).json({
      message: 'Service job created successfully',
      job_id: newJobId,
    });
  } catch (err) {
    console.error('Create job error:', err);
    res.status(400).json({ message: err.message || 'Failed to create service job' });
  }
});

// PATCH /api/jobs/:id/status (Update job status)
router.patch('/:id/status', authenticateToken, requireRole('system_admin', 'service_advisor', 'mechanic'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, mechanic_id } = req.body;

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    let updateFields = [];
    let params = [id];

    if (status) {
      params.push(status);
      updateFields.push(`status = $${params.length}`);
    }

    if (mechanic_id !== undefined) {
      params.push(mechanic_id);
      updateFields.push(`mechanic_id = $${params.length}`);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields provided to update.' });
    }

    const result = await query(
      `UPDATE service_job
       SET ${updateFields.join(', ')}
       WHERE job_id = $1
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service job not found' });
    }

    res.json({ message: 'Job status updated', job: result.rows[0] });
  } catch (err) {
    console.error('Update job status error:', err);
    res.status(500).json({ message: 'Error updating job status', error: err.message });
  }
});

// POST /api/jobs/:id/items (Add service item line)
router.post('/:id/items', authenticateToken, requireRole('system_admin', 'service_advisor', 'mechanic'), async (req, res) => {
  try {
    const { id } = req.params;
    const { description, labor_cost } = req.body;

    if (!description || labor_cost === undefined || labor_cost < 0) {
      return res.status(400).json({ message: 'Description and non-negative labor_cost are required.' });
    }

    // Insert service item
    const itemResult = await query(
      `INSERT INTO service_item (job_id, description, labor_cost)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, description, labor_cost]
    );

    // Update job total_labor_cost
    await query(
      `UPDATE service_job
       SET total_labor_cost = (SELECT COALESCE(SUM(labor_cost), 0) FROM service_item WHERE job_id = $1)
       WHERE job_id = $1`,
      [id]
    );

    res.status(201).json({
      message: 'Service item added successfully',
      item: itemResult.rows[0],
    });
  } catch (err) {
    console.error('Add item error:', err);
    res.status(500).json({ message: 'Error adding service item', error: err.message });
  }
});

// POST /api/jobs/:id/parts (Add part usage; triggers trg_update_part_stock)
router.post('/:id/parts', authenticateToken, requireRole('system_admin', 'service_advisor', 'mechanic'), async (req, res) => {
  try {
    const { id } = req.params;
    const { part_id, quantity_used, unit_price_applied } = req.body;

    if (!part_id || !quantity_used || quantity_used <= 0) {
      return res.status(400).json({ message: 'Valid part_id and positive quantity_used are required.' });
    }

    // Get current unit price and stock if not specified
    const partCheck = await query('SELECT unit_price, quantity_in_stock FROM inventory_part WHERE part_id = $1', [part_id]);
    if (partCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Inventory part not found' });
    }

    const availableStock = partCheck.rows[0].quantity_in_stock;
    if (availableStock < quantity_used) {
      return res.status(400).json({
        message: `Insufficient stock. Requested: ${quantity_used}, In stock: ${availableStock}`,
      });
    }

    const price = unit_price_applied !== undefined ? unit_price_applied : partCheck.rows[0].unit_price;
    const subtotal = quantity_used * price;

    // Inserting will automatically fire trigger trigger_update_part_stock to deduct stock!
    const usageResult = await query(
      `INSERT INTO job_part_usage (job_id, part_id, quantity_used, unit_price_applied, subtotal)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, part_id, quantity_used, price, subtotal]
    );

    // Update job total_parts_cost
    await query(
      `UPDATE service_job
       SET total_parts_cost = (SELECT COALESCE(SUM(subtotal), 0) FROM job_part_usage WHERE job_id = $1)
       WHERE job_id = $1`,
      [id]
    );

    res.status(201).json({
      message: 'Part allocated to job successfully (inventory auto-updated)',
      usage: usageResult.rows[0],
    });
  } catch (err) {
    console.error('Add part usage error:', err);
    res.status(500).json({ message: 'Error allocating part to job', error: err.message });
  }
});

module.exports = router;

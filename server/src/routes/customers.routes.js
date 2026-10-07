const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/customers (List customers with vehicle count and total spend)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;

    if (req.user.role === 'customer') {
      const result = await query(
        `SELECT c.*, get_customer_total_spend(c.customer_id) AS total_spent
         FROM customer c
         WHERE c.customer_id = $1`,
        [req.user.customer_id]
      );
      return res.json(result.rows);
    }

    let sql = `
      SELECT c.*,
             COUNT(DISTINCT v.vehicle_id) AS vehicle_count,
             get_customer_total_spend(c.customer_id) AS total_spent
      FROM customer c
      LEFT JOIN vehicle v ON v.customer_id = c.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (
        LOWER(c.full_name) LIKE $${params.length} OR
        LOWER(c.phone) LIKE $${params.length} OR
        LOWER(c.email) LIKE $${params.length}
      )`;
    }

    sql += ' GROUP BY c.customer_id ORDER BY c.customer_id ASC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List customers error:', err);
    res.status(500).json({ message: 'Error retrieving customers', error: err.message });
  }
});

// GET /api/customers/:id (Customer profile with vehicles and job history)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'customer' && parseInt(id, 10) !== req.user.customer_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const customerRes = await query(
      `SELECT c.*, get_customer_total_spend(c.customer_id) AS total_spent
       FROM customer c
       WHERE c.customer_id = $1`,
      [id]
    );

    if (customerRes.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get vehicles
    const vehiclesRes = await query(
      'SELECT * FROM vehicle WHERE customer_id = $1 ORDER BY year DESC',
      [id]
    );

    // Get service history
    const jobsRes = await query(
      `SELECT sj.*, v.license_plate, v.make, v.model, m.full_name AS mechanic_name, i.grand_total, i.payment_status
       FROM service_job sj
       JOIN vehicle v ON v.vehicle_id = sj.vehicle_id
       LEFT JOIN mechanic m ON m.mechanic_id = sj.mechanic_id
       LEFT JOIN invoice i ON i.job_id = sj.job_id
       WHERE v.customer_id = $1
       ORDER BY sj.job_date DESC`,
      [id]
    );

    res.json({
      ...customerRes.rows[0],
      vehicles: vehiclesRes.rows,
      service_jobs: jobsRes.rows,
    });
  } catch (err) {
    console.error('Customer details error:', err);
    res.status(500).json({ message: 'Error retrieving customer details', error: err.message });
  }
});

// POST /api/customers (Create new customer)
router.post('/', authenticateToken, requireRole('system_admin', 'service_advisor'), async (req, res) => {
  try {
    const { full_name, phone, email, address } = req.body;

    if (!full_name) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    const result = await query(
      `INSERT INTO customer (full_name, phone, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [full_name, phone || null, email || null, address || null]
    );

    res.status(201).json({ message: 'Customer created successfully', customer: result.rows[0] });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(400).json({ message: err.message || 'Error creating customer' });
  }
});

// PUT /api/customers/:id (Update customer)
router.put('/:id', authenticateToken, requireRole('system_admin', 'service_advisor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, email, address } = req.body;

    const result = await query(
      `UPDATE customer
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           address = COALESCE($4, address)
       WHERE customer_id = $5
       RETURNING *`,
      [full_name, phone, email, address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer updated successfully', customer: result.rows[0] });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ message: 'Error updating customer', error: err.message });
  }
});

module.exports = router;

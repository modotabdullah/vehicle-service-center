const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/vehicles (List all vehicles)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { customer_id, search } = req.query;
    let sql = `
      SELECT v.*, c.full_name AS customer_name, c.phone AS customer_phone, c.email AS customer_email
      FROM vehicle v
      JOIN customer c ON c.customer_id = v.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'customer') {
      params.push(req.user.customer_id);
      sql += ` AND v.customer_id = $${params.length}`;
    } else if (customer_id) {
      params.push(customer_id);
      sql += ` AND v.customer_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (
        LOWER(v.vin) LIKE $${params.length} OR
        LOWER(v.license_plate) LIKE $${params.length} OR
        LOWER(v.make) LIKE $${params.length} OR
        LOWER(v.model) LIKE $${params.length} OR
        LOWER(c.full_name) LIKE $${params.length}
      )`;
    }

    sql += ' ORDER BY v.vehicle_id ASC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List vehicles error:', err);
    res.status(500).json({ message: 'Error retrieving vehicles', error: err.message });
  }
});

// GET /api/vehicles/:id (Vehicle details with service history)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const vehicleRes = await query(
      `SELECT v.*, c.full_name AS customer_name, c.phone AS customer_phone, c.email AS customer_email
       FROM vehicle v
       JOIN customer c ON c.customer_id = v.customer_id
       WHERE v.vehicle_id = $1`,
      [id]
    );

    if (vehicleRes.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const vehicle = vehicleRes.rows[0];

    if (req.user.role === 'customer' && vehicle.customer_id !== req.user.customer_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Recent jobs
    const jobsRes = await query(
      `SELECT sj.*, m.full_name AS mechanic_name, i.grand_total, i.payment_status
       FROM service_job sj
       LEFT JOIN mechanic m ON m.mechanic_id = sj.mechanic_id
       LEFT JOIN invoice i ON i.job_id = sj.job_id
       WHERE sj.vehicle_id = $1
       ORDER BY sj.job_date DESC`,
      [id]
    );

    res.json({
      ...vehicle,
      jobs: jobsRes.rows,
    });
  } catch (err) {
    console.error('Vehicle details error:', err);
    res.status(500).json({ message: 'Error retrieving vehicle details', error: err.message });
  }
});

// POST /api/vehicles (Create new vehicle)
router.post('/', authenticateToken, requireRole('system_admin', 'service_advisor'), async (req, res) => {
  try {
    const { vin, license_plate, make, model, year, customer_id } = req.body;

    if (!vin || !license_plate || !make || !model || !year || !customer_id) {
      return res.status(400).json({ message: 'All vehicle fields including customer_id are required.' });
    }

    const result = await query(
      `INSERT INTO vehicle (vin, license_plate, make, model, year, customer_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [vin.trim().toUpperCase(), license_plate.trim().toUpperCase(), make, model, parseInt(year, 10), parseInt(customer_id, 10)]
    );

    res.status(201).json({ message: 'Vehicle registered successfully', vehicle: result.rows[0] });
  } catch (err) {
    console.error('Create vehicle error:', err);
    res.status(400).json({ message: err.message || 'Error registering vehicle' });
  }
});

module.exports = router;

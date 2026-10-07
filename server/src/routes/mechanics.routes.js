const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/mechanics (List mechanics with active job workload count)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT m.*,
             COUNT(sj.job_id) FILTER (WHERE sj.status IN ('pending', 'in_progress')) AS active_jobs_count,
             COUNT(sj.job_id) FILTER (WHERE sj.status = 'completed') AS completed_jobs_count
      FROM mechanic m
      LEFT JOIN service_job sj ON sj.mechanic_id = m.mechanic_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      sql += ` AND m.status = $${params.length}`;
    }

    sql += ' GROUP BY m.mechanic_id ORDER BY m.mechanic_id ASC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List mechanics error:', err);
    res.status(500).json({ message: 'Error retrieving mechanics', error: err.message });
  }
});

// GET /api/mechanics/:id (Mechanic profile and jobs)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const mechanicRes = await query('SELECT * FROM mechanic WHERE mechanic_id = $1', [id]);
    if (mechanicRes.rows.length === 0) {
      return res.status(404).json({ message: 'Mechanic not found' });
    }

    const jobsRes = await query(
      `SELECT sj.*, v.license_plate, v.make, v.model, c.full_name AS customer_name
       FROM service_job sj
       JOIN vehicle v ON v.vehicle_id = sj.vehicle_id
       JOIN customer c ON c.customer_id = v.customer_id
       WHERE sj.mechanic_id = $1
       ORDER BY sj.job_date DESC`,
      [id]
    );

    res.json({
      ...mechanicRes.rows[0],
      jobs: jobsRes.rows,
    });
  } catch (err) {
    console.error('Mechanic details error:', err);
    res.status(500).json({ message: 'Error retrieving mechanic details', error: err.message });
  }
});

// POST /api/mechanics (Add new mechanic)
router.post('/', authenticateToken, requireRole('system_admin', 'service_advisor'), async (req, res) => {
  try {
    const { full_name, specialization, phone, hourly_rate, status } = req.body;

    if (!full_name || !hourly_rate) {
      return res.status(400).json({ message: 'full_name and positive hourly_rate are required.' });
    }

    const result = await query(
      `INSERT INTO mechanic (full_name, specialization, phone, hourly_rate, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [full_name, specialization || null, phone || null, parseFloat(hourly_rate), status || 'active']
    );

    res.status(201).json({ message: 'Mechanic added successfully', mechanic: result.rows[0] });
  } catch (err) {
    console.error('Add mechanic error:', err);
    res.status(400).json({ message: err.message || 'Error adding mechanic' });
  }
});

// PATCH /api/mechanics/:id (Update mechanic details or status)
router.patch('/:id', authenticateToken, requireRole('system_admin', 'service_advisor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, specialization, phone, hourly_rate, status } = req.body;

    let updates = [];
    let params = [id];

    if (full_name) {
      params.push(full_name);
      updates.push(`full_name = $${params.length}`);
    }
    if (specialization !== undefined) {
      params.push(specialization);
      updates.push(`specialization = $${params.length}`);
    }
    if (phone !== undefined) {
      params.push(phone);
      updates.push(`phone = $${params.length}`);
    }
    if (hourly_rate !== undefined) {
      params.push(parseFloat(hourly_rate));
      updates.push(`hourly_rate = $${params.length}`);
    }
    if (status) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const result = await query(
      `UPDATE mechanic
       SET ${updates.join(', ')}
       WHERE mechanic_id = $1
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Mechanic not found' });
    }

    res.json({ message: 'Mechanic updated successfully', mechanic: result.rows[0] });
  } catch (err) {
    console.error('Update mechanic error:', err);
    res.status(500).json({ message: 'Error updating mechanic', error: err.message });
  }
});

module.exports = router;

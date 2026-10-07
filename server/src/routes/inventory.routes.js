const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/inventory/low-stock (Uses low_stock_parts_view)
router.get('/low-stock', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM low_stock_parts_view ORDER BY quantity_in_stock ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Low stock parts error:', err);
    res.status(500).json({ message: 'Error fetching low stock parts', error: err.message });
  }
});

// GET /api/inventory (List all parts with optional search)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM inventory_part';
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ' WHERE LOWER(part_name) LIKE $1 OR LOWER(part_number) LIKE $1';
    }

    sql += ' ORDER BY part_name ASC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List inventory error:', err);
    res.status(500).json({ message: 'Error retrieving inventory', error: err.message });
  }
});

// POST /api/inventory (Add new part)
router.post('/', authenticateToken, requireRole('system_admin', 'service_advisor'), async (req, res) => {
  try {
    const { part_name, part_number, unit_price, quantity_in_stock, reorder_level } = req.body;

    if (!part_name || !part_number || !unit_price) {
      return res.status(400).json({ message: 'part_name, part_number, and unit_price are required.' });
    }

    const result = await query(
      `INSERT INTO inventory_part (part_name, part_number, unit_price, quantity_in_stock, reorder_level)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        part_name,
        part_number,
        parseFloat(unit_price),
        parseInt(quantity_in_stock || 0, 10),
        parseInt(reorder_level || 0, 10),
      ]
    );

    res.status(201).json({ message: 'Part added successfully', part: result.rows[0] });
  } catch (err) {
    console.error('Create part error:', err);
    res.status(400).json({ message: err.message || 'Error creating inventory part' });
  }
});

// PATCH /api/inventory/:id (Update part details or stock)
router.patch('/:id', authenticateToken, requireRole('system_admin', 'service_advisor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { part_name, unit_price, quantity_in_stock, reorder_level } = req.body;

    let updates = [];
    let params = [id];

    if (part_name !== undefined) {
      params.push(part_name);
      updates.push(`part_name = $${params.length}`);
    }
    if (unit_price !== undefined) {
      params.push(parseFloat(unit_price));
      updates.push(`unit_price = $${params.length}`);
    }
    if (quantity_in_stock !== undefined) {
      params.push(parseInt(quantity_in_stock, 10));
      updates.push(`quantity_in_stock = $${params.length}`);
    }
    if (reorder_level !== undefined) {
      params.push(parseInt(reorder_level, 10));
      updates.push(`reorder_level = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    const result = await query(
      `UPDATE inventory_part
       SET ${updates.join(', ')}
       WHERE part_id = $1
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Part not found' });
    }

    res.json({ message: 'Part updated successfully', part: result.rows[0] });
  } catch (err) {
    console.error('Update part error:', err);
    res.status(500).json({ message: 'Error updating inventory part', error: err.message });
  }
});

module.exports = router;

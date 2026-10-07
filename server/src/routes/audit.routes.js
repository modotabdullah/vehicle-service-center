const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/audit (Admin only audit log trail)
router.get('/', authenticateToken, requireRole('system_admin'), async (req, res) => {
  try {
    const { table_name, operation, limit = 50 } = req.query;
    let sql = `
      SELECT al.*, ua.username, ua.role
      FROM audit_log al
      LEFT JOIN user_account ua ON ua.user_id = al.user_id
      WHERE 1=1
    `;
    const params = [];

    if (table_name) {
      params.push(table_name);
      sql += ` AND al.table_name = $${params.length}`;
    }

    if (operation) {
      params.push(operation);
      sql += ` AND al.operation = $${params.length}`;
    }

    params.push(parseInt(limit, 10));
    sql += ` ORDER BY al.action_timestamp DESC LIMIT $${params.length}`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ message: 'Error retrieving audit logs', error: err.message });
  }
});

module.exports = router;

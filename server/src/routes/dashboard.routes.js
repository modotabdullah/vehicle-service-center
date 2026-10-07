const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const isCustomer = req.user.role === 'customer';
    const customerId = req.user.customer_id;

    if (isCustomer) {
      // Customer specific stats
      const [vehicleCount, activeJobs, totalSpent, pendingInvoices] = await Promise.all([
        query('SELECT COUNT(*) FROM vehicle WHERE customer_id = $1', [customerId]),
        query(
          `SELECT COUNT(*) FROM service_job sj
           JOIN vehicle v ON v.vehicle_id = sj.vehicle_id
           WHERE v.customer_id = $1 AND sj.status IN ('pending', 'in_progress')`,
          [customerId]
        ),
        query('SELECT get_customer_total_spend($1) as total_spent', [customerId]),
        query(
          `SELECT COUNT(*) FROM invoice i
           JOIN service_job sj ON sj.job_id = i.job_id
           JOIN vehicle v ON v.vehicle_id = sj.vehicle_id
           WHERE v.customer_id = $1 AND i.payment_status IN ('unpaid', 'partial')`,
          [customerId]
        ),
      ]);

      return res.json({
        totalVehicles: parseInt(vehicleCount.rows[0].count, 10),
        activeJobs: parseInt(activeJobs.rows[0].count, 10),
        totalSpent: parseFloat(totalSpent.rows[0].total_spent || 0),
        pendingInvoices: parseInt(pendingInvoices.rows[0].count, 10),
      });
    }

    // Staff / Admin stats
    const [
      activeJobsRes,
      lowStockRes,
      revenueRes,
      pendingInvoicesRes,
      customerCountRes,
      vehicleCountRes,
      mechanicCountRes,
      recentJobsRes,
    ] = await Promise.all([
      query("SELECT COUNT(*) FROM service_job WHERE status IN ('pending', 'in_progress')"),
      query('SELECT COUNT(*) FROM low_stock_parts_view'),
      query('SELECT COALESCE(SUM(amount_paid), 0) AS total_revenue FROM payment'),
      query("SELECT COUNT(*) FROM invoice WHERE payment_status IN ('unpaid', 'partial')"),
      query('SELECT COUNT(*) FROM customer'),
      query('SELECT COUNT(*) FROM vehicle'),
      query("SELECT COUNT(*) FROM mechanic WHERE status = 'active'"),
      query(
        `SELECT sj.job_id, sj.status, sj.job_date, sj.total_labor_cost, sj.total_parts_cost,
                v.license_plate, v.make, v.model,
                c.full_name AS customer_name,
                m.full_name AS mechanic_name
         FROM service_job sj
         JOIN vehicle v ON v.vehicle_id = sj.vehicle_id
         JOIN customer c ON c.customer_id = v.customer_id
         LEFT JOIN mechanic m ON m.mechanic_id = sj.mechanic_id
         ORDER BY sj.job_date DESC
         LIMIT 6`
      ),
    ]);

    res.json({
      activeJobs: parseInt(activeJobsRes.rows[0].count, 10),
      lowStockParts: parseInt(lowStockRes.rows[0].count, 10),
      totalRevenue: parseFloat(revenueRes.rows[0].total_revenue || 0),
      pendingInvoices: parseInt(pendingInvoicesRes.rows[0].count, 10),
      totalCustomers: parseInt(customerCountRes.rows[0].count, 10),
      totalVehicles: parseInt(vehicleCountRes.rows[0].count, 10),
      activeMechanics: parseInt(mechanicCountRes.rows[0].count, 10),
      recentJobs: recentJobsRes.rows,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Error retrieving dashboard statistics', error: err.message });
  }
});

module.exports = router;

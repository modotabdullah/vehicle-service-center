const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'vehicle_service_prod',
});

// Helper for standard queries
const query = (text, params) => pool.query(text, params);

/**
 * Execute a transaction with user context set for PostgreSQL session.
 * This ensures triggers like trg_audit_invoice_changes capture the acting user's ID
 * via current_setting('app.current_user_id', true).
 */
const withUserTransaction = async (userId, callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (userId) {
      // Set session variable for the current transaction
      await client.query(`SET LOCAL app.current_user_id = '${parseInt(userId, 10)}'`);
    }
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  withUserTransaction,
};

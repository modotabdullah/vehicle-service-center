const { pool } = require('./db');

async function testConnection() {
  console.log('Testing connection to PostgreSQL database...\n');
  try {
    const timeRes = await pool.query('SELECT NOW() as current_time, current_database() as db_name;');
    console.log('Connection Successful!');
    console.log(`Connected to: ${timeRes.rows[0].db_name}`);
    console.log(`Server Time:  ${timeRes.rows[0].current_time}\n`);

    console.log('Checking database table counts:');
    const tables = [
      'customer',
      'vehicle',
      'mechanic',
      'service_job',
      'service_item',
      'inventory_part',
      'job_part_usage',
      'invoice',
      'payment',
      'user_account',
      'audit_log'
    ];

    for (const table of tables) {
      try {
        const countRes = await pool.query(`SELECT COUNT(*) FROM ${table};`);
        console.log(`  - ${table.padEnd(16)}: ${countRes.rows[0].count} rows`);
      } catch (err) {
        console.log(`  - ${table.padEnd(16)}: Error (${err.message})`);
      }
    }

    console.log('\nAll checks complete!');
  } catch (err) {
    console.error('\nDatabase Connection Failed!');
    console.error('Error message:', err.message);
    console.error('\nPlease verify your DB_PASSWORD in server/.env and make sure PostgreSQL is running.');
  } finally {
    await pool.end();
  }
}

testConnection();

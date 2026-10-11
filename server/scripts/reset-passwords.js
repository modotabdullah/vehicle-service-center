const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

async function resetPasswords() {
  console.log('Generating secure bcrypt hash for "password123"...');
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    console.log(`Hash generated: ${hash}`);
    console.log('Updating user_account table in database...');

    const res = await pool.query('UPDATE user_account SET password_hash = $1 RETURNING username, role;', [hash]);

    console.log(`\nSuccessfully updated ${res.rowCount} user accounts!`);
    console.log('\nYou can now log in with password: password123');
    console.log('Available accounts:');
    res.rows.forEach(u => {
      console.log(`  - ${u.username.padEnd(14)} (${u.role})`);
    });
  } catch (err) {
    console.error('Error resetting passwords:', err.message);
  } finally {
    await pool.end();
  }
}

resetPasswords();

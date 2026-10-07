const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const result = await query(
      `SELECT u.user_id, u.username, u.password_hash, u.role, u.customer_id,
              c.full_name, c.email, c.phone
       FROM user_account u
       LEFT JOIN customer c ON c.customer_id = u.customer_id
       WHERE u.username = $1`,
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        customer_id: user.customer_id,
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        customer_id: user.customer_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.user_id, u.username, u.role, u.customer_id,
              c.full_name, c.email, c.phone, c.address
       FROM user_account u
       LEFT JOIN customer c ON c.customer_id = u.customer_id
       WHERE u.user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Fetch me error:', err);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// POST /api/auth/register (For customer signup)
router.post('/register', async (req, res) => {
  try {
    const { username, password, full_name, email, phone, address } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ message: 'Username, password, and full name are required.' });
    }

    // Check if username already exists
    const userExists = await query('SELECT user_id FROM user_account WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    // 1. Create customer entry
    const custResult = await query(
      `INSERT INTO customer (full_name, phone, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING customer_id`,
      [full_name, phone || null, email || null, address || null]
    );
    const customerId = custResult.rows[0].customer_id;

    // 2. Hash password & create user_account
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userResult = await query(
      `INSERT INTO user_account (username, password_hash, role, customer_id)
       VALUES ($1, $2, 'customer', $3)
       RETURNING user_id, username, role, customer_id`,
      [username, passwordHash, customerId]
    );

    const newUser = userResult.rows[0];
    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        ...newUser,
        full_name,
        email,
        phone,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
});

module.exports = router;

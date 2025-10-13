const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Register user (HR or Candidate)
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // check if email already exists
    const [existing] = await pool.query("SELECT * FROM auth_users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // hash password
    const hashed = await bcrypt.hash(password, 10);

    // insert into auth_users
    await pool.query(
      "INSERT INTO auth_users (email, password_hash, role) VALUES (?, ?, ?)",
      [email, hashed, role || 'candidate']
    );

    res.json({ message: "✅ User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM auth_users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: '✅ Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

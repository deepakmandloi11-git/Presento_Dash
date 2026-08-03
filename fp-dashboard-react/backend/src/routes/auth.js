// ============================================================
//  routes/auth.js — login with rate limiting
// ============================================================

const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { JWT_SECRET } = require('../middleware/auth');
const auditLog = require('../utils/auditLog');

const router = express.Router();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

const ROLE_PASSWORDS = {
  admin:    process.env.ADMIN_PASSWORD    || 'admin123',
  operator: process.env.OPERATOR_PASSWORD || 'operator123',
  viewer:   process.env.VIEWER_PASSWORD   || 'viewer123',
};

// Rate limit: max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login  { password }
router.post('/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  const role = Object.keys(ROLE_PASSWORDS).find(r => ROLE_PASSWORDS[r] === password);
  if (!role) {
    auditLog.record('login_failed', { ip: req.ip });
    return res.status(401).json({ error: 'Incorrect password' });
  }
  const token = jwt.sign({ role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  auditLog.record('login_success', { role, ip: req.ip });
  res.json({ token, role, expiresIn: JWT_EXPIRES_IN });
});

module.exports = router;

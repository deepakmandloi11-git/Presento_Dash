// ============================================================
//  middleware/auth.js — JWT verification + role permissions
// ============================================================

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const PERMISSIONS = {
  admin:    { view: true, register: true, edit: true, delete: true, systemReset: true, viewAudit: true },
  operator: { view: true, register: true, edit: true, delete: false, systemReset: false, viewAudit: false },
  viewer:   { view: true, register: false, edit: false, delete: false, systemReset: false, viewAudit: false },
};

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    req.permissions = PERMISSIONS[payload.role] || PERMISSIONS.viewer;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requirePermission(action) {
  return (req, res, next) => {
    if (!req.permissions?.[action]) {
      return res.status(403).json({ error: `Role '${req.user?.role}' cannot perform: ${action}` });
    }
    next();
  };
}

module.exports = { requireAuth, requirePermission, JWT_SECRET, PERMISSIONS };

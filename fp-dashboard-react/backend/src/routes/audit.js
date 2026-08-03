// ============================================================
//  routes/audit.js — admin only
// ============================================================

const express = require('express');
const auditLog = require('../utils/auditLog');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);
router.use(requirePermission('viewAudit'));

router.get('/', (req, res) => {
  res.json(auditLog.readAll(req.query.limit ? +req.query.limit : 200));
});

module.exports = router;

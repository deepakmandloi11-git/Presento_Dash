// ============================================================
//  routes/candidates.js — async version for PostgreSQL
// ============================================================

const express = require('express');
const candidateService = require('../services/candidateService');
const mqttClient = require('../mqtt/mqttClient');
const auditLog = require('../utils/auditLog');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try { res.json(await candidateService.getAll(req.query.deviceId)); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requirePermission('register'), async (req, res) => {
  try {
    const candidate = await candidateService.create(req.body);
    try { mqttClient.publishEnroll(candidate.device_id, candidate.id); } catch {}
    auditLog.record('candidate_registered', { device_id: candidate.device_id, id: candidate.id, name: candidate.name }, req.user.role);
    res.json({ success: true, candidate });
  } catch(err) { res.status(err.status||500).json({ error: err.message||'Failed' }); }
});

router.put('/:deviceId/:id', requirePermission('edit'), async (req, res) => {
  try {
    const candidate = await candidateService.update(req.params.deviceId, req.params.id, req.body);
    auditLog.record('candidate_updated', { device_id: req.params.deviceId, id: req.params.id }, req.user.role);
    res.json({ success: true, candidate });
  } catch(err) { res.status(err.status||500).json({ error: err.message||'Failed' }); }
});

router.delete('/:deviceId/:id', requirePermission('delete'), async (req, res) => {
  const { password } = req.body;
  if (password !== (process.env.ADMIN_PASSWORD || 'admin123'))
    return res.status(403).json({ error: 'Admin password required to delete' });
  await candidateService.deactivate(req.params.deviceId, req.params.id);
  try { mqttClient.publishDelete(req.params.deviceId, req.params.id); } catch {}
  auditLog.record('candidate_deleted', { device_id: req.params.deviceId, id: req.params.id }, req.user.role);
  res.json({ success: true });
});

module.exports = router;

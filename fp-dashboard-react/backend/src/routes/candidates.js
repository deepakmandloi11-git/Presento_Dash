// ============================================================
//  routes/candidates.js
// ============================================================

const express = require('express');
const candidateService = require('../services/candidateService');
const mqttClient = require('../mqtt/mqttClient');
const auditLog = require('../utils/auditLog');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  res.json(candidateService.getAll(req.query.deviceId));
});

router.post('/', requirePermission('register'), (req, res) => {
  try {
    const candidate = candidateService.create(req.body);
    try { mqttClient.publishEnroll(candidate.device_id, candidate.id); }
    catch (e) { console.warn('[MQTT] Enroll publish failed:', e.message); }
    auditLog.record('candidate_registered', { device_id: candidate.device_id, id: candidate.id, name: candidate.name }, req.user.role);
    res.json({ success: true, candidate });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed' });
  }
});

router.put('/:deviceId/:id', requirePermission('edit'), (req, res) => {
  try {
    const candidate = candidateService.update(req.params.deviceId, req.params.id, req.body);
    auditLog.record('candidate_updated', { device_id: req.params.deviceId, id: req.params.id }, req.user.role);
    res.json({ success: true, candidate });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed' });
  }
});

router.delete('/:deviceId/:id', requirePermission('delete'), (req, res) => {
  const { password } = req.body;
  if (password !== (process.env.ADMIN_PASSWORD || 'admin123'))
    return res.status(403).json({ error: 'Admin password required to delete' });
  candidateService.deactivate(req.params.deviceId, req.params.id);
  try { mqttClient.publishDelete(req.params.deviceId, req.params.id); } catch {}
  auditLog.record('candidate_deleted', { device_id: req.params.deviceId, id: req.params.id }, req.user.role);
  res.json({ success: true });
});

module.exports = router;

// ============================================================
//  routes/devices.js — async version
// ============================================================

const express = require('express');
const deviceService = require('../services/deviceService');
const mqttClient = require('../mqtt/mqttClient');
const auditLog = require('../utils/auditLog');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try { res.json(await deviceService.getAll()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:deviceId/sensor/wipe', requirePermission('systemReset'), async (req, res) => {
  try {
    mqttClient.publishDeleteRange(req.params.deviceId, 1, 127);
    auditLog.record('sensor_wipe_all', { device_id: req.params.deviceId }, req.user.role);
    res.json({ success: true });
  } catch(err) { res.status(503).json({ error: err.message }); }
});

module.exports = router;

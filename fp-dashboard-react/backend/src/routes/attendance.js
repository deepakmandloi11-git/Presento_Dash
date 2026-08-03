// ============================================================
//  routes/attendance.js — async version
// ============================================================

const express = require('express');
const attendanceService = require('../services/attendanceService');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { date, deviceId, candidateId, limit } = req.query;
    res.json(await attendanceService.getLog({ date, deviceId, candidateId, limit }));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', async (req, res) => {
  try { res.json(await attendanceService.getStats(req.query.deviceId)); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

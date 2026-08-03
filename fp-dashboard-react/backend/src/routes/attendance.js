// ============================================================
//  routes/attendance.js
// ============================================================

const express = require('express');
const attendanceService = require('../services/attendanceService');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { date, deviceId, candidateId, limit } = req.query;
  res.json(attendanceService.getLog({ date, deviceId, candidateId, limit }));
});

router.get('/stats', (req, res) => {
  res.json(attendanceService.getStats(req.query.deviceId));
});

module.exports = router;

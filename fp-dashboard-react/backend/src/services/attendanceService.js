// ============================================================
//  services/attendanceService.js
// ============================================================

const store = require('../db/jsonStore');
const candidateService = require('./candidateService');

function nowISO() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }

function recordAttendance({ fp_id, device, epoch, date, time }) {
  const db = store.load();
  const row = {
    id: db.log.length ? db.log[0].id + 1 : 1,
    fp_id: fp_id || 0,
    device: device || '',
    epoch: epoch || 0,
    date: date || new Date().toISOString().slice(0, 10),
    time: time || '',
    logged_at: nowISO(),
  };
  db.log.unshift(row);
  if (db.log.length > 5000) db.log = db.log.slice(0, 5000);
  store.save(db);
  const candidate = candidateService.findForAttendance(row.device, row.fp_id);
  return {
    row: { ...row, name: candidate?.name || null, department: candidate?.department || '' },
    duplicate: false,
  };
}

function getLog({ date, deviceId, candidateId, limit = 200 } = {}) {
  const db = store.load();
  let rows = db.log;
  if (date)        rows = rows.filter(r => r.date === date);
  if (deviceId)     rows = rows.filter(r => r.device === deviceId);
  if (candidateId)  rows = rows.filter(r => String(r.fp_id) === String(candidateId));
  rows = rows.slice(0, +limit || 200);
  return rows.map(r => {
    const c = candidateService.findForAttendance(r.device, r.fp_id);
    return { ...r, name: c?.name || null, department: c?.department || '' };
  });
}

function getStats(deviceId) {
  const db = store.load();
  const today = new Date().toISOString().slice(0, 10);
  let candidates = Object.values(db.candidates).filter(c => c.active);
  let logs = db.log;
  if (deviceId) {
    candidates = candidates.filter(c => c.device_id === deviceId);
    logs = logs.filter(r => r.device === deviceId);
  }
  const todayLogs = logs.filter(r => r.date === today);
  return {
    total_candidates: candidates.length,
    today_count: todayLogs.length,
    today_unique: new Set(todayLogs.map(r => r.fp_id)).size,
    device_count: deviceId ? 1 : Object.keys(db.devices).length,
  };
}

module.exports = { recordAttendance, getLog, getStats };

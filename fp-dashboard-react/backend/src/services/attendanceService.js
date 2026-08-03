// ============================================================
//  services/attendanceService.js — PostgreSQL version
// ============================================================

const db = require('../db/pgStore');
const candidateService = require('./candidateService');

function nowISO() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }

async function recordAttendance({ fp_id, device, epoch, date, time }) {
  const row = {
    fp_id:     fp_id  || 0,
    device:    device || '',
    epoch:     epoch  || 0,
    date:      date   || new Date().toISOString().slice(0, 10),
    time:      time   || '',
    logged_at: nowISO(),
  };
  await db.addAttendance(row);
  const candidate = await candidateService.findForAttendance(row.device, row.fp_id);
  return {
    row: { ...row, name: candidate?.name || null, department: candidate?.department || '' },
    duplicate: false,
  };
}

async function getLog(params) {
  const rows = await db.getAttendance(params);
  return Promise.all(rows.map(async r => {
    const c = await candidateService.findForAttendance(r.device, r.fp_id);
    return { ...r, name: c?.name || null, department: c?.department || '' };
  }));
}

async function getStats(deviceId) {
  return db.getStats(deviceId);
}

module.exports = { recordAttendance, getLog, getStats };

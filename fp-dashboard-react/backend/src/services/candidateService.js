// ============================================================
//  services/candidateService.js — PostgreSQL version
// ============================================================

const db = require('../db/pgStore');

function nowISO() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }
function key(deviceId, slotId) { return `${deviceId}:${slotId}`; }

async function getAll(deviceId) {
  return db.getCandidates(deviceId);
}

async function create({ device_id, id, name, department = '', email = '', phone = '' }) {
  if (!device_id) throw { status: 400, message: 'device_id is required' };
  if (!id || !name) throw { status: 400, message: 'id and name are required' };
  if (+id < 1 || +id > 127) throw { status: 400, message: 'id must be 1–127' };
  const k = key(device_id, +id);
  const existing = await db.getCandidate(device_id, +id);
  if (existing && existing.active)
    throw { status: 409, message: `Slot ${id} on device ${device_id} is already registered` };
  const candidate = { id: +id, device_id, name, department, email, phone, enrolled_at: nowISO(), active: true };
  await db.saveCandidate(k, candidate);
  return candidate;
}

async function update(deviceId, slotId, { name, department = '', email = '', phone = '' }) {
  const c = await db.getCandidate(deviceId, slotId);
  if (!c) throw { status: 404, message: 'Candidate not found' };
  const updated = { ...c, name: name || c.name, department, email, phone };
  await db.saveCandidate(key(deviceId, slotId), updated);
  return updated;
}

async function deactivate(deviceId, slotId) {
  const c = await db.getCandidate(deviceId, slotId);
  if (c) await db.saveCandidate(key(deviceId, slotId), { ...c, active: false });
  return true;
}

async function findForAttendance(deviceId, slotId) {
  return db.getCandidate(deviceId, slotId);
}

module.exports = { getAll, create, update, deactivate, findForAttendance };

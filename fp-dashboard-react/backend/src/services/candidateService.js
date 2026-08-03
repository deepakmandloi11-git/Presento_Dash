// ============================================================
//  services/candidateService.js
// ============================================================

const store = require('../db/jsonStore');

function nowISO() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }
function key(deviceId, slotId) { return `${deviceId}:${slotId}`; }

function getAll(deviceId) {
  const db = store.load();
  let list = Object.values(db.candidates).filter(c => c.active);
  if (deviceId) list = list.filter(c => c.device_id === deviceId);
  return list.sort((a, b) => a.id - b.id);
}

function create({ device_id, id, name, department = '', email = '', phone = '' }) {
  if (!device_id) throw { status: 400, message: 'device_id is required' };
  if (!id || !name) throw { status: 400, message: 'id and name are required' };
  if (+id < 1 || +id > 127) throw { status: 400, message: 'id must be 1–127' };
  const db = store.load();
  const k = key(device_id, +id);
  if (db.candidates[k] && db.candidates[k].active)
    throw { status: 409, message: `Slot ${id} on device ${device_id} is already registered` };
  db.candidates[k] = { id: +id, device_id, name, department, email, phone, enrolled_at: nowISO(), active: true };
  store.save(db);
  return db.candidates[k];
}

function update(deviceId, slotId, { name, department = '', email = '', phone = '' }) {
  const db = store.load();
  const k = key(deviceId, slotId);
  const c = db.candidates[k];
  if (!c) throw { status: 404, message: 'Candidate not found' };
  Object.assign(c, { name: name || c.name, department, email, phone });
  store.save(db);
  return c;
}

function deactivate(deviceId, slotId) {
  const db = store.load();
  const k = key(deviceId, slotId);
  if (db.candidates[k]) { db.candidates[k].active = false; store.save(db); }
  return true;
}

function findForAttendance(deviceId, slotId) {
  const db = store.load();
  return db.candidates[key(deviceId, slotId)] || null;
}

module.exports = { getAll, create, update, deactivate, findForAttendance };

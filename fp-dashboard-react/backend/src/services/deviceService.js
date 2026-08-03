// ============================================================
//  services/deviceService.js
// ============================================================

const store = require('../db/jsonStore');

function nowISO() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }

function recordHeartbeat({ device, ip, rssi, uptime, battery }) {
  const db = store.load();
  db.devices[device] = { client_id: device, ip: ip || '', rssi: rssi || 0, uptime: uptime || 0, battery: battery ?? null, last_seen: nowISO() };
  store.save(db);
  return db.devices[device];
}

function getAll() {
  const db = store.load();
  return Object.values(db.devices)
    .map(d => ({ ...d, online: isOnline(d.last_seen) }))
    .sort((a, b) => (b.last_seen || '').localeCompare(a.last_seen || ''));
}

function isOnline(lastSeenStr, thresholdSec = 90) {
  if (!lastSeenStr) return false;
  return (Date.now() - new Date(lastSeenStr).getTime()) / 1000 < thresholdSec;
}

module.exports = { recordHeartbeat, getAll, isOnline };

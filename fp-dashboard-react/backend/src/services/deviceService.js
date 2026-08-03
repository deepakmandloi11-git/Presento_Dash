// ============================================================
//  services/deviceService.js — PostgreSQL version
// ============================================================

const db = require('../db/pgStore');

function nowISO() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }

function isOnline(lastSeenStr, thresholdSec = 90) {
  if (!lastSeenStr) return false;
  return (Date.now() - new Date(lastSeenStr).getTime()) / 1000 < thresholdSec;
}

async function recordHeartbeat({ device, ip, rssi, uptime, battery }) {
  const entry = {
    client_id: device,
    ip:        ip      || '',
    rssi:      rssi    || 0,
    uptime:    uptime  || 0,
    battery:   battery ?? null,
    last_seen: nowISO(),
  };
  await db.saveDevice(entry);
  return entry;
}

async function getAll() {
  const list = await db.getDevices();
  return list
    .map(d => ({ ...d, online: isOnline(d.last_seen) }))
    .sort((a, b) => (b.last_seen || '').localeCompare(a.last_seen || ''));
}

module.exports = { recordHeartbeat, getAll, isOnline };

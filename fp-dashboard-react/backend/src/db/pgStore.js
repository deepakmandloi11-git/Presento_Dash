// ============================================================
//  db/pgStore.js — PostgreSQL persistent database
//  Replaces jsonStore.js for production on Render
//  Free PostgreSQL from Render: render.com/docs/databases
//
//  Falls back to in-memory if DATABASE_URL not set (local dev)
// ============================================================

const { Pool } = require('pg');

const USE_PG = !!process.env.DATABASE_URL;

// ── In-memory fallback for local development ────────────────
const _mem = { candidates: {}, log: [], devices: {} };

// ── PostgreSQL pool ─────────────────────────────────────────
let pool = null;

async function getPool() {
  if (!pool && USE_PG) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await initTables();
  }
  return pool;
}

async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS candidates (
      key         TEXT PRIMARY KEY,
      data        JSONB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attendance_log (
      id          SERIAL PRIMARY KEY,
      fp_id       INTEGER NOT NULL,
      device      TEXT NOT NULL,
      epoch       BIGINT DEFAULT 0,
      date        TEXT DEFAULT '',
      time        TEXT DEFAULT '',
      logged_at   TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS devices (
      client_id   TEXT PRIMARY KEY,
      data        JSONB NOT NULL
    );
  `);
  console.log('[DB] PostgreSQL tables ready');
}

// ── Candidates ──────────────────────────────────────────────
async function getCandidates(deviceId) {
  if (!USE_PG) {
    const list = Object.values(_mem.candidates).filter(c => c.active);
    return deviceId ? list.filter(c => c.device_id === deviceId) : list;
  }
  const db = await getPool();
  const q = deviceId
    ? `SELECT data FROM candidates WHERE data->>'device_id'=$1 AND data->>'active'='true'`
    : `SELECT data FROM candidates WHERE data->>'active'='true'`;
  const res = deviceId ? await db.query(q, [deviceId]) : await db.query(q);
  return res.rows.map(r => r.data).sort((a, b) => a.id - b.id);
}

async function getCandidate(deviceId, slotId) {
  const key = `${deviceId}:${slotId}`;
  if (!USE_PG) return _mem.candidates[key] || null;
  const db = await getPool();
  const res = await db.query(`SELECT data FROM candidates WHERE key=$1`, [key]);
  return res.rows[0]?.data || null;
}

async function saveCandidate(key, data) {
  if (!USE_PG) { _mem.candidates[key] = data; return; }
  const db = await getPool();
  await db.query(
    `INSERT INTO candidates(key,data) VALUES($1,$2)
     ON CONFLICT(key) DO UPDATE SET data=$2`,
    [key, JSON.stringify(data)]
  );
}

// ── Attendance ──────────────────────────────────────────────
async function addAttendance(row) {
  if (!USE_PG) {
    _mem.log.unshift(row);
    if (_mem.log.length > 5000) _mem.log = _mem.log.slice(0, 5000);
    return;
  }
  const db = await getPool();
  await db.query(
    `INSERT INTO attendance_log(fp_id,device,epoch,date,time,logged_at)
     VALUES($1,$2,$3,$4,$5,$6)`,
    [row.fp_id, row.device, row.epoch, row.date, row.time, row.logged_at]
  );
}

async function getAttendance({ date, deviceId, candidateId, limit = 200 } = {}) {
  if (!USE_PG) {
    let rows = _mem.log;
    if (date)        rows = rows.filter(r => r.date === date);
    if (deviceId)     rows = rows.filter(r => r.device === deviceId);
    if (candidateId)  rows = rows.filter(r => String(r.fp_id) === String(candidateId));
    return rows.slice(0, +limit);
  }
  const db = await getPool();
  const conditions = ['1=1'];
  const params = [];
  if (date)       { params.push(date);      conditions.push(`date=$${params.length}`); }
  if (deviceId)    { params.push(deviceId);  conditions.push(`device=$${params.length}`); }
  if (candidateId) { params.push(+candidateId); conditions.push(`fp_id=$${params.length}`); }
  params.push(+limit);
  const res = await db.query(
    `SELECT * FROM attendance_log WHERE ${conditions.join(' AND ')}
     ORDER BY id DESC LIMIT $${params.length}`,
    params
  );
  return res.rows;
}

async function getStats(deviceId) {
  const today = new Date().toISOString().slice(0, 10);
  if (!USE_PG) {
    let candidates = Object.values(_mem.candidates).filter(c => c.active);
    let logs = _mem.log;
    if (deviceId) { candidates = candidates.filter(c => c.device_id === deviceId); logs = logs.filter(r => r.device === deviceId); }
    const todayLogs = logs.filter(r => r.date === today);
    return { total_candidates: candidates.length, today_count: todayLogs.length, today_unique: new Set(todayLogs.map(r => r.fp_id)).size, device_count: Object.keys(_mem.devices).length };
  }
  const db = await getPool();
  const candQ = deviceId
    ? `SELECT COUNT(*) FROM candidates WHERE data->>'active'='true' AND data->>'device_id'=$1`
    : `SELECT COUNT(*) FROM candidates WHERE data->>'active'='true'`;
  const candRes = deviceId ? await db.query(candQ, [deviceId]) : await db.query(candQ);

  const logCond = deviceId ? `date=$2 AND device=$1` : `date=$1`;
  const logParams = deviceId ? [deviceId, today] : [today];
  const todayRes = await db.query(`SELECT fp_id FROM attendance_log WHERE ${logCond}`, logParams);
  const devRes   = await db.query(`SELECT COUNT(*) FROM devices`);

  return {
    total_candidates: +candRes.rows[0].count,
    today_count:      todayRes.rows.length,
    today_unique:     new Set(todayRes.rows.map(r => r.fp_id)).size,
    device_count:     +devRes.rows[0].count,
  };
}

// ── Devices ─────────────────────────────────────────────────
async function saveDevice(data) {
  if (!USE_PG) { _mem.devices[data.client_id] = data; return; }
  const db = await getPool();
  await db.query(
    `INSERT INTO devices(client_id,data) VALUES($1,$2)
     ON CONFLICT(client_id) DO UPDATE SET data=$2`,
    [data.client_id, JSON.stringify(data)]
  );
}

async function getDevices() {
  if (!USE_PG) return Object.values(_mem.devices);
  const db = await getPool();
  const res = await db.query(`SELECT data FROM devices ORDER BY data->>'last_seen' DESC`);
  return res.rows.map(r => r.data);
}

module.exports = {
  getCandidates, getCandidate, saveCandidate,
  addAttendance, getAttendance, getStats,
  saveDevice, getDevices,
  getPool,
};

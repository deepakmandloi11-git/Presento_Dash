// ============================================================
//  utils/auditLog.js — append-only audit trail
// ============================================================

const fs = require('fs');
const path = require('path');

const DB_DIR = process.env.DB_FILE
  ? path.dirname(process.env.DB_FILE)
  : path.join(__dirname, '../../data');
const AUDIT_FILE = path.join(DB_DIR, 'audit.log');

function record(action, details = {}, user = 'system') {
  const entry = { ts: new Date().toISOString(), user, action, details };
  try {
    fs.mkdirSync(path.dirname(AUDIT_FILE), { recursive: true });
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n');
  } catch (e) {
    console.error('[AUDIT] Write failed:', e.message);
  }
}

function readAll(limit = 200) {
  if (!fs.existsSync(AUDIT_FILE)) return [];
  const lines = fs.readFileSync(AUDIT_FILE, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit).reverse().map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

module.exports = { record, readAll };

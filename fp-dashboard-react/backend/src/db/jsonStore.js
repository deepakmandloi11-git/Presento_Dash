// ============================================================
//  db/jsonStore.js — Plain JSON file database
//  On Railway: set DB_FILE=/data/dashboard_data.json
//  and mount a Railway persistent volume at /data
// ============================================================

const fs = require('fs');
const path = require('path');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '../../data/dashboard_data.json');

function emptyDb() {
  return { candidates: {}, log: [], devices: {} };
}

function load() {
  if (!fs.existsSync(DB_FILE)) return emptyDb();
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return emptyDb(); }
}

let _saveTimer = null;
function save(db) {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }, 250);
}

function saveSync(db) {
  clearTimeout(_saveTimer);
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

module.exports = { load, save, saveSync, emptyDb, DB_FILE };

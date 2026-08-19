// ============================================================
//  server.js — Production entry point
//
//  In production (Railway):
//    - Serves built React frontend as static files from ../frontend/dist
//    - All /api/* routes are the REST API
//    - WebSocket on the same port for live events
//    - MQTT bridge to HiveMQ Cloud (TLS)
//
//  In development:
//    - Run backend (port 4000) and frontend dev server (port 5173) separately
//    - Vite proxies /api calls to localhost:4000
// ============================================================

require('dotenv').config();

const express   = require('express');
const http      = require('http');
const path      = require('path');
const fs        = require('fs');
const WebSocket = require('ws');
const cors      = require('cors');
const helmet    = require('helmet');

const authRoutes       = require('./routes/auth');
const candidateRoutes  = require('./routes/candidates');
const attendanceRoutes = require('./routes/attendance');
const deviceRoutes     = require('./routes/devices');
const auditRoutes      = require('./routes/audit');
const mqttClient       = require('./mqtt/mqttClient');

const PORT         = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const IS_PROD      = process.env.NODE_ENV === 'production';

const app    = express();
const server = http.createServer(app);

// ── Security headers (helmet)
app.use(helmet({
  contentSecurityPolicy: false,  // disabled — React app handles its own CSP
  crossOriginEmbedderPolicy: false,
}));

// ── CORS — only allow your frontend URL
app.use(cors({
  origin: IS_PROD ? FRONTEND_URL : ['http://localhost:5173', 'http://localhost:4000'],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// ── REST API routes
app.use('/api/auth',       authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/devices',    deviceRoutes);
app.use('/api/audit',      auditRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mqtt: mqttClient.isConnected(), env: IS_PROD ? 'production' : 'development' });
});

// ── Serve built React frontend in production
const DIST = path.join(__dirname, '../../frontend/dist');
if (IS_PROD && fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  // All non-API routes return index.html (React Router handles them)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(DIST, 'index.html'));
    }
  });
  console.log(`[Server] Serving React frontend from ${DIST}`);
} else if (IS_PROD) {
  console.warn('[Server] WARNING: frontend/dist not found. Run npm run build first.');
}

// ── WebSocket — live push to browser
const wss = new WebSocket.Server({ server });

function broadcast(type, data) {
  const msg = JSON.stringify({ type, data, ts: Date.now() });
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(msg);
  });
}

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'connected', data: {} }));
});

// ── MQTT bridge — HiveMQ Cloud (TLS) or public broker
mqttClient.connect({
  broker:   process.env.MQTT_BROKER || 'ws://broker.emqx.io',
  port:     process.env.MQTT_PORT   ? +process.env.MQTT_PORT : 8083,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
}, broadcast);

// ── Start
server.listen(PORT, () => {
  console.log(`\n✅  Server running on port ${PORT}`);
  if (IS_PROD) {
    console.log(`🌐  Public URL: ${FRONTEND_URL}`);
  } else {
    console.log(`🔧  API:       http://localhost:${PORT}/api`);
    console.log(`🔧  Frontend:  http://localhost:5173 (run npm run dev in /frontend)`);
  }
  console.log(`📡  MQTT:      ${process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com'}\n`);
});

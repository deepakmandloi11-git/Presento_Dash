// ============================================================
//  mqtt/mqttClient.js — async version for PostgreSQL services
// ============================================================

const mqtt = require('mqtt');
const attendanceService = require('../services/attendanceService');
const deviceService = require('../services/deviceService');

const TOPIC_LOG    = 'attendance/log';
const TOPIC_STATUS = 'attendance/status';
const TOPIC_ENROLL = 'attendance/enroll';
const TOPIC_DELETE = 'attendance/delete';

let client = null;
let broadcastFn = () => {};

function connect({ broker, port, username, password }, onBroadcast) {
  broadcastFn = onBroadcast || broadcastFn;
  const opts = { reconnectPeriod: 5000, connectTimeout: 10000,rejectUnauthorized: false };
  if (username) { opts.username = username; opts.password = password; }
  console.log(`[MQTT] Connecting to ${broker}:${port || 1883}…`);
  const wsUrl = broker.replace('mqtt://', 'ws://').replace('mqtts://', 'wss://');
  
  client = mqtt.connect(wsUrl.includes('://') ? wsUrl : `ws://${wsUrl}`, { 
    ...opts, 
    port: port || 8083 
  });
  client.on('connect', () => {
    console.log('[MQTT] Connected');
    client.subscribe([TOPIC_LOG, TOPIC_STATUS]);
    broadcastFn('mqtt_status', { connected: true });
  });
  client.on('error', err => { console.error('[MQTT] Error FULL:', JSON.stringify(err), err.message, err.code);broadcastFn('mqtt_status', { connected: false, error: err.message });});
  client.on('offline',  ()  => broadcastFn('mqtt_status', { connected: false }));
  client.on('reconnect',()  => console.log('[MQTT] Reconnecting…'));
 
  client.on('message', async (topic, payload) => {
    console.log(`[MQTT] ${topic}: ${payload.toString().slice(0, 150)}`); 
    let msg;
    try { msg = JSON.parse(payload.toString()); } catch { return; }

    if (topic === TOPIC_LOG) {
      try {
        const { row, duplicate } = await attendanceService.recordAttendance(msg);
        if (!duplicate) broadcastFn('attendance', row);
      } catch(e) { console.error('[MQTT] attendance save error:', e.message); }

    } else if (topic === TOPIC_STATUS) {
      if (msg.device) {
        try {
          const dev = await deviceService.recordHeartbeat(msg);
          broadcastFn('device_status', { ...dev, online: true });
        } catch(e) { console.error('[MQTT] device save error:', e.message); }
      }
      if ('success' in msg) broadcastFn('enroll_ack', msg);
    }
  });

  return client;
}

function publishEnroll(deviceId, slotId) {
  if (!client?.connected) throw new Error('MQTT not connected');
  client.publish(TOPIC_ENROLL, JSON.stringify({ id: +slotId, device_id: deviceId }));
}

function publishDelete(deviceId, slotId) {
  if (!client?.connected) throw new Error('MQTT not connected');
  client.publish(TOPIC_DELETE, JSON.stringify({ id: +slotId, device_id: deviceId }));
}

function publishDeleteRange(deviceId, start, end, delayMs = 80) {
  if (!client?.connected) throw new Error('MQTT not connected');
  let delay = 0;
  for (let id = start; id <= end; id++) {
    setTimeout(() => client.publish(TOPIC_DELETE, JSON.stringify({ id, device_id: deviceId })), delay);
    delay += delayMs;
  }
}

function isConnected() { return !!(client?.connected); }

module.exports = { connect, publishEnroll, publishDelete, publishDeleteRange, isConnected };


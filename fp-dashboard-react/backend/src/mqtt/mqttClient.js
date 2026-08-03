// ============================================================
//  mqtt/mqttClient.js — MQTT bridge
//
//  Supports both:
//    mqtt://  (plain, for local/public brokers)
//    mqtts:// (TLS, for HiveMQ Cloud free tier)
//
//  HiveMQ Cloud free tier: mqtts://your-cluster.s1.eu.hivemq.cloud:8883
//  Update MQTT_BROKER, MQTT_USER, MQTT_PASS in .env / Railway vars
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

  const opts = {
    reconnectPeriod: 5000,
    connectTimeout: 10000,
  };

  // Add credentials for HiveMQ Cloud or any auth-required broker
  if (username) {
    opts.username = username;
    opts.password = password;
  }

  // TLS is handled automatically by the mqtts:// URL scheme in mqtt.js v5
  console.log(`[MQTT] Connecting to ${broker}:${port || 1883}…`);
  client = mqtt.connect(broker, { ...opts, port: port || undefined });

  client.on('connect', () => {
    console.log(`[MQTT] Connected`);
    client.subscribe([TOPIC_LOG, TOPIC_STATUS]);
    broadcastFn('mqtt_status', { connected: true });
  });

  client.on('error', err => {
    console.error('[MQTT] Error:', err.message);
    broadcastFn('mqtt_status', { connected: false, error: err.message });
  });

  client.on('offline', () => broadcastFn('mqtt_status', { connected: false }));
  client.on('reconnect', () => console.log('[MQTT] Reconnecting…'));

  client.on('message', (topic, payload) => {
    let msg;
    try { msg = JSON.parse(payload.toString()); } catch { return; }

    if (topic === TOPIC_LOG) {
      const { row, duplicate } = attendanceService.recordAttendance(msg);
      if (!duplicate) broadcastFn('attendance', row);
    } else if (topic === TOPIC_STATUS) {
      if (msg.device) {
        const dev = deviceService.recordHeartbeat(msg);
        broadcastFn('device_status', dev);
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

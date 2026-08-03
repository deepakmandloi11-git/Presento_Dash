# FP Attendance Dashboard — Production Ready

React + Node.js fingerprint attendance dashboard. Deploys to Railway in one git push.

## Quick start (local dev)

```bash
# Backend
cd backend && cp .env.example .env
npm install && npm start        # http://localhost:4000

# Frontend (separate terminal)
cd frontend && npm install
npm run dev                     # http://localhost:5173
```

Login with `admin123` (change in `.env` before going live).

## Deploy to production

See **DEPLOY.md** for the complete step-by-step Railway deployment guide.

## Project structure

```
fp-dashboard-react/
├── railway.toml          ← Railway build + start config
├── DEPLOY.md             ← Full deployment guide
├── backend/
│   ├── src/
│   │   ├── server.js     ← Entry point (serves React + API + WebSocket)
│   │   ├── routes/       ← auth, candidates, attendance, devices, audit
│   │   ├── services/     ← business logic (candidate, attendance, device)
│   │   ├── db/           ← jsonStore.js (swap this for a real DB later)
│   │   ├── mqtt/         ← MQTT bridge (supports TLS for HiveMQ Cloud)
│   │   ├── middleware/   ← JWT auth + role permission checks
│   │   └── utils/        ← audit log
│   ├── .env.example      ← copy to .env for local dev
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── pages/        ← Login, Overview, AttendanceLog, Candidates, etc.
    │   ├── components/   ← Topbar, Sidebar, DeviceSelector, LiveFeed
    │   ├── hooks/        ← useWebSocket, useToast
    │   ├── context/      ← AuthContext (roles), DeviceContext (selected device)
    │   ├── services/     ← api.js (all REST calls)
    │   └── styles/       ← globals.css, layout.css, components.css
    └── package.json
```

## Roles

| Password env var | Role | Permissions |
|---|---|---|
| `ADMIN_PASSWORD` | Admin | Everything |
| `OPERATOR_PASSWORD` | Operator | View + register/edit (no delete/reset) |
| `VIEWER_PASSWORD` | Viewer | View only |

## MQTT topics

| Topic | Direction | Purpose |
|---|---|---|
| `attendance/log` | Device → Dashboard | Attendance event |
| `attendance/status` | Device → Dashboard | Heartbeat + enroll/delete ack |
| `attendance/enroll` | Dashboard → Device | Trigger enrollment |
| `attendance/delete` | Dashboard → Device | Delete fingerprint slot |

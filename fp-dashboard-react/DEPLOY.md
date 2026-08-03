# Deployment Guide — Railway (Free Tier)

## Before you deploy

### Step 1 — HiveMQ Cloud free MQTT broker (replaces broker.hivemq.com)

1. Go to https://www.hivemq.com/mqtt-cloud-broker/ and click **Start Free**
2. Sign up → you get a free cluster (e.g. `abc123.s1.eu.hivemq.cloud`)
3. Go to **Access Management** → create a username + password
4. Note down:
   - Cluster URL: `mqtts://abc123.s1.eu.hivemq.cloud`
   - Port: `8883`
   - Username and Password
5. Update your ESP32 NVS config using the Python GUI:
   - MQTT Broker: `abc123.s1.eu.hivemq.cloud`
   - MQTT Port: `8883`
   - Reboot the ESP32

### Step 2 — Generate a strong JWT secret

Run this in any terminal that has Node.js:
```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Copy the output — this is your `JWT_SECRET`.

### Step 3 — Create a Git repository

```bash
cd fp-dashboard-react
git init
git add .
git commit -m "Initial commit"
```

Push to GitHub:
```bash
# Create a repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/fp-dashboard-react.git
git push -u origin main
```

---

## Deploy to Railway

### Step 4 — Create Railway account

Go to https://railway.app and sign up (free, no credit card needed for hobby plan).

### Step 5 — Create a new project

1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Connect your GitHub account → select `fp-dashboard-react`
4. Railway detects `railway.toml` automatically

### Step 6 — Add a Persistent Volume (critical for JSON database)

Without this, your data is wiped on every deploy.

1. In your Railway project, click **+ Add** → **Volume**
2. Mount path: `/data`
3. Railway will attach this volume to your service

### Step 7 — Set environment variables

In Railway dashboard → your service → **Variables** tab, add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `MQTT_BROKER` | `mqtts://your-cluster.s1.eu.hivemq.cloud` |
| `MQTT_PORT` | `8883` |
| `MQTT_USER` | your HiveMQ username |
| `MQTT_PASS` | your HiveMQ password |
| `ADMIN_PASSWORD` | (choose a strong password) |
| `OPERATOR_PASSWORD` | (choose a strong password) |
| `VIEWER_PASSWORD` | (choose a strong password) |
| `JWT_SECRET` | (the hex string from Step 2) |
| `JWT_EXPIRES_IN` | `12h` |
| `DB_FILE` | `/data/dashboard_data.json` |
| `FRONTEND_URL` | (set AFTER deploy — your `.railway.app` URL) |

### Step 8 — Deploy

Railway auto-deploys when you push to GitHub. The build process:
1. Installs frontend deps and builds React → `frontend/dist/`
2. Installs backend deps
3. Starts `node src/server.js` which serves everything on port 4000

Watch the build logs in the Railway dashboard. Build takes 2–3 minutes.

### Step 9 — Get your URL

After deploy succeeds:
1. Go to your service → **Settings** → **Networking** → **Generate Domain**
2. You get a URL like `https://fp-dashboard-react-production.railway.app`
3. Go back to Variables → set `FRONTEND_URL` = that URL
4. Redeploy (Railway redeploys on env var changes automatically)

### Step 10 — Test

Open your Railway URL in a browser. You should see the login screen.
- Try logging in with your `ADMIN_PASSWORD`
- Check `/api/health` — should show `{"status":"ok","mqtt":true}`

---

## After deployment — update ESP32

Your ESP32 is still connecting to the old public broker. Update via the Python GUI:

1. Connect ESP32 to PC via USB
2. Open `configurator_gui.py`
3. Update MQTT Broker to your HiveMQ Cloud URL
4. Update MQTT Port to `8883`
5. Save → reboot ESP32

---

## Local development (unchanged)

```bash
# Terminal 1 — backend
cd backend && cp .env.example .env
# edit .env with your passwords and MQTT settings
npm install && npm start

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

---

## Free tier limits

| Resource | Railway Free | Enough for? |
|---|---|---|
| Execution hours | 500 hrs/month | ~21 days continuous — sufficient for a pilot |
| Memory | 512 MB | Fine for this app |
| Storage volume | 1 GB | Fine for JSON file |
| HiveMQ Cloud | 100 connected devices, 10 GB traffic/month | Plenty |

When ready to go paid: Railway Hobby plan is $5/month for unlimited hours.

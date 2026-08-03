// ============================================================
//  pages/index.jsx — all page components exported from one file
//  Import individually: import { Login } from './pages'
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../hooks/useToast';
import { StatCard, LiveFeed } from '../components/SharedComponents';

// ── LOGIN ─────────────────────────────────────────────────────
export function Login() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true);
    try { await login(password); navigate('/'); }
    catch(err) { toast(err.message,'error'); }
    finally { setLoading(false); }
  }
  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="logo">FP<em>/</em>ATTENDANCE <em>// DASHBOARD</em></div>
        <div className="fg">
          <label>PASSWORD</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoFocus/>
          <div className="hint">Your role (Admin / Operator / Viewer) is determined by your password.</div>
        </div>
        <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:8}} disabled={loading}>
          {loading?'Signing in…':'Sign In'}
        </button>
      </form>
    </div>
  );
}

// ── OVERVIEW ──────────────────────────────────────────────────
export function Overview({ liveEvents }) {
  const { selectedDevice } = useDevice();
  const [stats, setStats] = useState({});
  const [recentLog, setRecentLog] = useState([]);
  async function loadStats() { try { setStats(await api.getStats(selectedDevice)); } catch {} }
  async function loadRecent() { try { setRecentLog(await api.getAttendance({deviceId:selectedDevice,limit:30})); } catch {} }
  useEffect(() => {
    if (!selectedDevice) return;
    loadStats(); loadRecent();
    const id = setInterval(loadStats, 30000);
    return () => clearInterval(id);
  }, [selectedDevice]);
  const liveForDevice = liveEvents.filter(e=>e.device===selectedDevice);
  const combined = [...liveForDevice,...recentLog].slice(0,50);
  if (!selectedDevice) return <p className="mono" style={{color:'var(--muted)'}}>Select a device above to view its data.</p>;
  return (
    <div>
      <div className="stat-grid">
        <StatCard label="CANDIDATES" value={stats.total_candidates} sub="registered"/>
        <StatCard label="TODAY CHECK-INS" value={stats.today_count} sub="total scans" color="blue"/>
        <StatCard label="UNIQUE TODAY" value={stats.today_unique} sub="distinct people" color="warn"/>
        <StatCard label="DEVICES" value={stats.device_count} sub="ESP32 units" color="gray"/>
      </div>
      <div className="sec-head">
        <div className="sec-title">LIVE FEED <b>// {selectedDevice}</b></div>
        <button className="btn btn-ghost btn-sm" onClick={loadRecent}>Refresh</button>
      </div>
      <LiveFeed rows={combined}/>
    </div>
  );
}

// ── ATTENDANCE LOG ─────────────────────────────────────────────
export function AttendanceLog() {
  const { selectedDevice } = useDevice();
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState('');
  async function load(d=date) {
    if (!selectedDevice) return;
    setRows(await api.getAttendance({deviceId:selectedDevice,...(d?{date:d}:{})}));
  }
  useEffect(()=>{ load(''); },[selectedDevice]);
  function exportCSV() {
    const hdr=['slot','name','department','date','time','device'];
    const lines=rows.map(r=>[r.fp_id,r.name||'',r.department||'',r.date,r.time,r.device]);
    const csv=[hdr,...lines].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const a=document.createElement('a');
    a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    a.download=`attendance_${selectedDevice}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }
  if (!selectedDevice) return <p className="mono" style={{color:'var(--muted)'}}>Select a device above.</p>;
  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        <input type="date" value={date} onChange={e=>{setDate(e.target.value);load(e.target.value);}} style={{background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:6,padding:'7px 10px',color:'var(--text)'}}/>
        <button className="btn btn-ghost btn-sm" onClick={()=>{setDate('');load('');}}>Show All</button>
        <button className="btn btn-ghost btn-sm" onClick={exportCSV}>Export CSV</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>SLOT</th><th>NAME</th><th>DEPT</th><th>DATE</th><th>TIME</th><th>DEVICE</th></tr></thead>
          <tbody>
            {!rows.length&&<tr><td colSpan={6} style={{textAlign:'center',color:'var(--muted)',padding:28}} className="mono">No records</td></tr>}
            {rows.map(r=>(
              <tr key={r.id}>
                <td><span className="badge badge-blue">#{r.fp_id}</span></td>
                <td style={{fontWeight:500}}>{r.name||<span style={{color:'var(--muted)'}}>Unknown</span>}</td>
                <td>{r.department||'—'}</td>
                <td className="mono">{r.date}</td>
                <td className="mono">{r.time}</td>
                <td className="mono" style={{fontSize:10}}>{r.device}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── DEVICES ───────────────────────────────────────────────────
export function Devices() {
  const [devices, setDevices] = useState([]);
  async function load() { setDevices(await api.getDevices()); }
  useEffect(()=>{ load(); const id=setInterval(load,30000); return()=>clearInterval(id); },[]);
  return (
    <div>
      <div className="sec-head">
        <div className="sec-title">ESP32 DEVICES <b>// heartbeat</b></div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>
      {!devices.length&&<p className="mono" style={{color:'var(--muted)'}}>No devices seen yet. Power on your ESP32.</p>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12}}>
        {devices.map(d=>{
          const upH=Math.floor(d.uptime/3600),upM=Math.floor((d.uptime%3600)/60);
          return (
            <div key={d.client_id} className="card">
              <div className="mono" style={{color:'var(--accent)',fontSize:12,marginBottom:10}}>{d.client_id}</div>
              {[['Status',<span className={`badge ${d.online?'badge-green':'badge-red'}`}>{d.online?'ONLINE':'OFFLINE'}</span>],
                ['IP',d.ip||'—'],['RSSI',`${d.rssi} dBm`],['Uptime',`${upH}h ${upM}m`],
                d.battery!=null&&['Battery',`${d.battery}%`],
                ['Last seen',(d.last_seen||'').slice(11,19)]
              ].filter(Boolean).map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5,color:'var(--muted)'}}>
                  <span>{l}</span><span style={{fontFamily:'var(--mono)',color:'var(--text)'}}>{v}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CANDIDATES ────────────────────────────────────────────────
export function Candidates() {
  const [list, setList] = useState([]);
  const toast = useToast();
  const { can } = useAuth();
  const { selectedDevice } = useDevice();
  async function load() { if (selectedDevice) setList(await api.getCandidates(selectedDevice)); }
  useEffect(()=>{ load(); },[selectedDevice]);
  async function handleReEnroll(c) {
    if (!confirm(`Re-enroll fingerprint for ${c.name} (slot #${c.id})?`)) return;
    try { await api.createCandidate({device_id:c.device_id,id:c.id,name:c.name,department:c.department,email:c.email,phone:c.phone}); toast(`Re-enroll sent for slot #${c.id}`,'info'); }
    catch(err){ toast(err.message,'error'); }
  }
  async function handleDelete(c) {
    const password=prompt(`Enter ADMIN password to delete ${c.name} (slot #${c.id}):`);
    if (!password) return;
    try { await api.deleteCandidate(c.device_id,c.id,password); toast(`${c.name} deleted`,'info'); load(); }
    catch(err){ toast(err.message,'error'); }
  }
  function exportCSV() {
    const hdr=['slot','name','department','email','phone','enrolled_at','device'];
    const lines=list.map(c=>[c.id,c.name,c.department,c.email,c.phone,c.enrolled_at,c.device_id]);
    const csv=[hdr,...lines].map(r=>r.map(v=>`"${v??''}"`).join(',')).join('\n');
    const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    a.download=`candidates_${selectedDevice}.csv`; a.click();
  }
  if (!selectedDevice) return <p className="mono" style={{color:'var(--muted)'}}>Select a device above.</p>;
  return (
    <div>
      <div className="sec-head">
        <div className="sec-title">CANDIDATES <b>// {selectedDevice}</b></div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>Export CSV</button>
          {can('register')&&<Link to="/register" className="btn btn-primary btn-sm">+ Register New</Link>}
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>SLOT</th><th>NAME</th><th>DEPARTMENT</th><th>EMAIL</th><th>PHONE</th><th>ENROLLED</th>{(can('register')||can('delete'))&&<th>ACTIONS</th>}</tr></thead>
          <tbody>
            {!list.length&&<tr><td colSpan={7} style={{textAlign:'center',color:'var(--muted)',padding:28}} className="mono">No candidates on this device yet</td></tr>}
            {list.map(c=>(
              <tr key={c.id}>
                <td><span className="badge badge-green">#{c.id}</span></td>
                <td style={{fontWeight:500}}>{c.name}</td>
                <td>{c.department||'—'}</td>
                <td>{c.email||'—'}</td>
                <td>{c.phone||'—'}</td>
                <td className="mono">{(c.enrolled_at||'').slice(0,10)}</td>
                {(can('register')||can('delete'))&&(
                  <td><div style={{display:'flex',gap:5}}>
                    {can('register')&&<button className="btn btn-ghost btn-sm" onClick={()=>handleReEnroll(c)}>Re-enroll</button>}
                    {can('delete')&&<button className="btn btn-danger btn-sm" onClick={()=>handleDelete(c)}>Delete</button>}
                  </div></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── REGISTER ──────────────────────────────────────────────────
const EMPTY={id:'',name:'',department:'',email:'',phone:''};
export function Register() {
  const [form,setForm]=useState(EMPTY);
  const [enrolling,setEnrolling]=useState(null);
  const toast=useToast();
  const {selectedDevice}=useDevice();
  function set(f,v){ setForm(p=>({...p,[f]:v})); }
  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedDevice){ toast('Select a device first','error'); return; }
    if (!form.id||!form.name){ toast('Slot ID and Name are required','error'); return; }
    try {
      await api.createCandidate({...form,id:+form.id,device_id:selectedDevice});
      setEnrolling({id:form.id,name:form.name}); setForm(EMPTY);
      toast(`${form.name} registered — waiting for finger…`,'info');
    } catch(err){ toast(err.message,'error'); }
  }
  return (
    <div>
      {!selectedDevice&&<div className="card" style={{borderColor:'rgba(255,71,87,.3)'}}><span style={{color:'var(--danger)'}}>Select a device in the topbar first.</span></div>}
      {enrolling&&(
        <div className="card" style={{borderColor:'rgba(255,165,2,.3)',background:'rgba(255,165,2,.07)',display:'flex',alignItems:'center',gap:12}}>
          <div className="spinner"/>
          <div>
            <div style={{fontWeight:500,color:'var(--warn)'}}>Enrolling {enrolling.name} (slot #{enrolling.id}) on {selectedDevice}…</div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>Place candidate's finger on sensor TWICE</div>
          </div>
        </div>
      )}
      <div className="card">
        <div className="sec-title" style={{marginBottom:16}}>NEW CANDIDATE <b>// {selectedDevice||'no device selected'}</b></div>
        <form onSubmit={handleSubmit}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="fg">
              <label>FINGER SLOT ID (1–127) *</label>
              <input type="number" min="1" max="127" value={form.id} onChange={e=>set('id',e.target.value)} placeholder="e.g. 3"/>
              <div className="hint">Check Candidates page for used slots.</div>
            </div>
            <div className="fg"><label>FULL NAME *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Candidate full name"/></div>
            <div className="fg"><label>DEPARTMENT / CLASS</label><input value={form.department} onChange={e=>set('department',e.target.value)} placeholder="e.g. Class 10-A"/></div>
            <div className="fg"><label>EMAIL</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="name@example.com"/></div>
            <div className="fg"><label>PHONE</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 98765 43210"/></div>
          </div>
          <div style={{marginTop:16,display:'flex',alignItems:'center',gap:12}}>
            <button type="submit" className="btn btn-primary" disabled={!selectedDevice}>Register &amp; Enroll Finger</button>
            <span style={{fontSize:12,color:'var(--muted)'}}>ESP32 must be online</span>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── RESET SYSTEM ──────────────────────────────────────────────
export function ResetSystem() {
  const [wiping,setWiping]=useState(false);
  const toast=useToast();
  const {can}=useAuth();
  const {selectedDevice}=useDevice();
  if (!can('systemReset')) return <p className="mono" style={{color:'var(--danger)'}}>Permission denied.</p>;
  async function handleWipe() {
    if (!selectedDevice){ toast('Select a device first','error'); return; }
    if (!confirm(`Send delete command for ALL 127 slots on ${selectedDevice}?`)) return;
    setWiping(true);
    try {
      await api.wipeSensor(selectedDevice);
      setTimeout(()=>{ setWiping(false); toast(`Sensor wipe complete on ${selectedDevice}`,'success'); },13000);
    } catch(err){ setWiping(false); toast(err.message,'error'); }
  }
  return (
    <div className="card" style={{borderColor:'rgba(255,71,87,.3)',maxWidth:560}}>
      <div className="sec-title" style={{color:'var(--danger)',marginBottom:12}}>SENSOR RESET <b style={{color:'var(--muted)'}}>// {selectedDevice||'no device'}</b></div>
      <p style={{fontSize:13,color:'var(--muted)',lineHeight:1.8,marginBottom:16}}>Sends delete for all 127 fingerprint slots on the selected device. Device must be online. Takes ~13 seconds.</p>
      <button className="btn btn-danger" onClick={handleWipe} disabled={wiping||!selectedDevice}>
        {wiping?'Sending delete commands…':'Wipe All Fingerprints from Sensor'}
      </button>
    </div>
  );
}

// ── AUDIT LOG ─────────────────────────────────────────────────
export function AuditLog() {
  const [entries,setEntries]=useState([]);
  const {can}=useAuth();
  useEffect(()=>{ if (can('viewAudit')) api.getAuditLog().then(setEntries).catch(()=>{}); },[]);
  if (!can('viewAudit')) return <p className="mono" style={{color:'var(--danger)'}}>Permission denied.</p>;
  return (
    <div>
      <div className="sec-head"><div className="sec-title">AUDIT TRAIL</div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>TIME</th><th>ROLE</th><th>ACTION</th><th>DETAILS</th></tr></thead>
          <tbody>
            {!entries.length&&<tr><td colSpan={4} style={{textAlign:'center',color:'var(--muted)',padding:28}} className="mono">No audit entries yet</td></tr>}
            {entries.map((e,i)=>(
              <tr key={i}>
                <td className="mono" style={{fontSize:11}}>{e.ts}</td>
                <td><span className="badge badge-blue">{e.user}</span></td>
                <td>{e.action}</td>
                <td className="mono" style={{fontSize:11}}>{JSON.stringify(e.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

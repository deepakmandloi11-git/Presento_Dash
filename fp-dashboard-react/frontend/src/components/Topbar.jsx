import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DeviceSelector from './DeviceSelector';
const ROLE_COLORS = { admin:'var(--accent)', operator:'var(--accent2)', viewer:'var(--muted)' };
export default function Topbar({ mqttConnected }) {
  const [clock, setClock] = useState('');
  const { logout, role } = useAuth();
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-IN',{hour12:false}));
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id);
  },[]);
  return (
    <div className="topbar">
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        <div className="logo">FP<em>/</em>ATTENDANCE <em>// DASHBOARD</em></div>
        <DeviceSelector/>
      </div>
      <div className="status-row">
        <div className="pill"><div className={'dot'+(mqttConnected?' on':'')}/><span>{mqttConnected?'MQTT ✓':'MQTT ✗'}</span></div>
        <span className="mono" style={{color:ROLE_COLORS[role]||'var(--muted)',textTransform:'uppercase'}}>{role}</span>
        <span className="mono">{clock}</span>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

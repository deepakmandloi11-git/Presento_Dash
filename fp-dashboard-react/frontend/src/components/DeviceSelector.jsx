import { useDevice } from '../context/DeviceContext';
export default function DeviceSelector() {
  const { devices, selectedDevice, selectDevice } = useDevice();
  if (!devices.length) return <span className="mono" style={{color:'var(--muted)'}}>No devices</span>;
  return (
    <select value={selectedDevice} onChange={e => selectDevice(e.target.value)}
      style={{background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:6,padding:'6px 10px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:12}}>
      {devices.map(d => <option key={d.client_id} value={d.client_id}>{d.client_id} {d.online?'● online':'○ offline'}</option>)}
    </select>
  );
}

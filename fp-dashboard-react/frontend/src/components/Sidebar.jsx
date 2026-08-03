import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const ICONS = {
  overview:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  attendance:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  devices:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1"/></svg>,
  candidates:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  register:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  reset:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>,
  audit:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>,
};
function Item({to,icon,label,danger}){
  return <NavLink to={to} className={({isActive})=>'nav-item'+(isActive?' active':'')} style={danger?{color:'var(--danger)'}:undefined}>{ICONS[icon]}{label}</NavLink>;
}
export default function Sidebar(){
  const {can}=useAuth();
  return (
    <nav className="sidebar">
      <div className="nav-label">MONITOR</div>
      <Item to="/" icon="overview" label="Overview"/>
      <Item to="/attendance" icon="attendance" label="Attendance Log"/>
      <Item to="/devices" icon="devices" label="Devices"/>
      <div className="nav-label">MANAGE</div>
      <Item to="/candidates" icon="candidates" label="Candidates"/>
      {can('register')&&<Item to="/register" icon="register" label="Register New"/>}
      {(can('systemReset')||can('viewAudit'))&&<div className="nav-label">SYSTEM</div>}
      {can('systemReset')&&<Item to="/reset" icon="reset" label="Reset System" danger/>}
      {can('viewAudit')&&<Item to="/audit" icon="audit" label="Audit Log"/>}
    </nav>
  );
}

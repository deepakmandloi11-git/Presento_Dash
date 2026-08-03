import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DeviceProvider } from './context/DeviceContext';
import { useWebSocket } from './hooks/useWebSocket';
import { useToast } from './hooks/useToast';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { Login, Overview, AttendanceLog, Devices, Candidates, Register, ResetSystem, AuditLog } from './pages';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function DashboardShell() {
  const [mqttConnected, setMqttConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const toast = useToast();
  useWebSocket(msg => {
    if (msg.type === 'mqtt_status') setMqttConnected(!!msg.data.connected);
    if (msg.type === 'attendance') {
      setLiveEvents(p => [msg.data, ...p].slice(0, 50));
      toast(`✓ ${msg.data.name || 'Slot #'+msg.data.fp_id} — ${msg.data.time} (${msg.data.device})`, 'success');
    }
    if (msg.type === 'enroll_ack')
      toast(msg.data.success ? `Finger enrolled for slot #${msg.data.id}` : 'Enrollment failed — try again', msg.data.success ? 'success' : 'error');
  });
  return (
    <DeviceProvider>
      <Topbar mqttConnected={mqttConnected}/>
      <div className="shell">
        <Sidebar/>
        <main className="main">
          <Routes>
            <Route path="/" element={<Overview liveEvents={liveEvents}/>}/>
            <Route path="/attendance" element={<AttendanceLog/>}/>
            <Route path="/devices" element={<Devices/>}/>
            <Route path="/candidates" element={<Candidates/>}/>
            <Route path="/register" element={<Register/>}/>
            <Route path="/reset" element={<ResetSystem/>}/>
            <Route path="/audit" element={<AuditLog/>}/>
          </Routes>
        </main>
      </div>
    </DeviceProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login/>}/>
      <Route path="/*" element={<RequireAuth><DashboardShell/></RequireAuth>}/>
    </Routes>
  );
}

import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';

const DeviceContext = createContext(null);

export function DeviceProvider({ children }) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(() => localStorage.getItem('fp_device') || '');

  async function refreshDevices() {
    try {
      const list = await api.getDevices();
      setDevices(list);
      if (!selectedDevice && list.length > 0) selectDevice(list[0].client_id);
    } catch {}
  }

  useEffect(() => {
    refreshDevices();
    const id = setInterval(refreshDevices, 30000);
    return () => clearInterval(id);
  }, []);

  function selectDevice(id) {
    setSelectedDevice(id);
    localStorage.setItem('fp_device', id);
  }

  return (
    <DeviceContext.Provider value={{ devices, selectedDevice, selectDevice, refreshDevices }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error('useDevice must be inside DeviceProvider');
  return ctx;
}

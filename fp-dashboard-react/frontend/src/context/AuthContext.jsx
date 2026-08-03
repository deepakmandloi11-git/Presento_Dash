import { createContext, useContext, useState, useCallback } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

const PERMISSIONS = {
  admin:    { view: true, register: true, edit: true, delete: true, systemReset: true, viewAudit: true },
  operator: { view: true, register: true, edit: true, delete: false, systemReset: false, viewAudit: false },
  viewer:   { view: true, register: false, edit: false, delete: false, systemReset: false, viewAudit: false },
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('fp_token'));
  const [role,  setRole]  = useState(() => localStorage.getItem('fp_role'));

  const login = useCallback(async (password) => {
    const res = await api.login(password);
    localStorage.setItem('fp_token', res.token);
    localStorage.setItem('fp_role',  res.role);
    setToken(res.token);
    setRole(res.role);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fp_token');
    localStorage.removeItem('fp_role');
    setToken(null); setRole(null);
  }, []);

  const can = useCallback((action) => !!PERMISSIONS[role]?.[action], [role]);

  return (
    <AuthContext.Provider value={{ token, role, isAuthenticated: !!token, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

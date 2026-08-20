import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatbotWidget from './ChatbotWidget';
import { User, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SECTORES_AUBASA } from '../lib/sectoresAubasa';

const Layout = () => {
  const { userRole, setUserRole } = useAuth();
  return (
    <div className="app-container">
      <Sidebar />
      <ChatbotWidget />
      <main className="main-content">
        <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Simulador de Roles (Para Pruebas):</span>
            <select 
              className="form-control" 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)}
              style={{ width: 'auto', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-color)' }}
            >
              {SECTORES_AUBASA.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="user-profile glass" style={{ border: '1px solid var(--accent-color)' }}>
            <div className="avatar" style={{ background: 'var(--accent-color)' }}><Shield size={14} color="white" /></div>
            <span style={{ fontWeight: 600 }}>{userRole}</span>
          </div>
        </header>
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

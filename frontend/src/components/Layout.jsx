import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatbotWidget from './ChatbotWidget';
import { User, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SECTORES_AUBASA } from '../lib/sectoresAubasa';

const Layout = () => {
  const { user, userRole, userSector, logout } = useAuth();
  
  return (
    <div className="app-container">
      <Sidebar />
      <ChatbotWidget />
      <main className="main-content">
        <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>
              Hola, {user?.email}
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--accent-color)' }}>
              Perfil: {userRole} | Sector: {userSector}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="user-profile glass" style={{ border: '1px solid var(--accent-color)' }}>
              <div className="avatar" style={{ background: 'var(--accent-color)' }}><Shield size={14} color="white" /></div>
              <span style={{ fontWeight: 600 }}>{userRole}</span>
            </div>
            
            <button 
              onClick={logout}
              style={{
                background: 'transparent',
                border: '1px solid var(--danger-color)',
                color: 'var(--danger-color)',
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
              className="hover-scale"
            >
              Cerrar Sesión
            </button>
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

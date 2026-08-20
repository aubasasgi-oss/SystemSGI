import React, { useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatbotWidget from './ChatbotWidget';
import { Shield, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// 15 minutos en milisegundos
const IDLE_TIMEOUT = 15 * 60 * 1000;

const Layout = () => {
  const { user, userRole, userSector, logout } = useAuth();
  
  // Timer para inactividad
  const resetTimer = useCallback(() => {
    if (window.idleTimer) clearTimeout(window.idleTimer);
    window.idleTimer = setTimeout(() => {
      alert("Tu sesión ha expirado por inactividad. Por favor, vuelve a iniciar sesión.");
      logout();
    }, IDLE_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    // Iniciar timer
    resetTimer();

    // Eventos que resetean el timer
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    
    const handleActivity = () => resetTimer();
    
    events.forEach(e => window.addEventListener(e, handleActivity));
    
    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (window.idleTimer) clearTimeout(window.idleTimer);
    };
  }, [resetTimer]);

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

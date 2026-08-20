import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Risks from './pages/Risks';
import SectorMetrics from './pages/SectorMetrics';
import FlotaControl from './pages/FlotaControl';
import ManagementReview from './pages/ManagementReview';
import Whistleblowing from './pages/Whistleblowing';
import InternalAudits from './pages/InternalAudits';
import Indicators from './pages/Indicators';
import Context from './pages/Context';
import DocumentManager from './pages/DocumentManager';
import ControlDocumental from './pages/ControlDocumental';

const LoginScreen = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
        console.error(e);
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <div className="glass animate-fade-in" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '2rem', marginBottom: '8px' }}>AUBASA</h2>
        <p style={{ color: 'var(--accent-color)', marginBottom: '2rem', fontWeight: 600 }}>SISTEMA DE GESTIÓN INTEGRAL</p>
        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Por favor, inicie sesión con su cuenta corporativa para acceder al sistema.</p>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogin}>
          Iniciar Sesión con Microsoft
        </button>
      </div>
    </div>
  );
};

import { AuthProvider } from './contexts/AuthContext';

const MODO_PRUEBA = true; // Cambiar a false cuando IT entregue el Client ID

function App() {
  const AppContent = (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="metrics" element={<SectorMetrics />} />
            <Route path="flota" element={<FlotaControl />} />
            <Route path="management-review" element={<ManagementReview />} />
            <Route path="internal-audits" element={<InternalAudits />} />
            <Route path="indicators" element={<Indicators />} />
            <Route path="documents" element={<DocumentManager />} />
            <Route path="control-documental" element={<ControlDocumental />} />
            <Route path="context" element={<Context />} />
            <Route path="risks" element={<Risks />} />
            <Route path="whistleblowing" element={<Whistleblowing />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );

  if (MODO_PRUEBA) {
    return AppContent;
  }

  return (
    <>
      <UnauthenticatedTemplate>
        <LoginScreen />
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        {AppContent}
      </AuthenticatedTemplate>
    </>
  );
}

export default App;

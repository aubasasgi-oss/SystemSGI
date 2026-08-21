import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import Login from './pages/Login';
import AdminUsers from './pages/AdminUsers';
import OtherApps from './pages/OtherApps';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="apps" element={<OtherApps />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="risks" element={<Risks />} />
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
}

export default App;

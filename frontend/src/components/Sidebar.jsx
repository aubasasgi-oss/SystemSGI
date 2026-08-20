import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, FileText, AlertTriangle, MessageSquare, Home, Target, LayoutDashboard, Globe, BarChart2, BookOpen, FileSignature, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { userRole } = useAuth();
  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-logo">
        <span className="logo-aubasa">AUBASA</span>
        <span className="logo-sgi">SGI</span>
      </div>
      
      <nav className="nav-menu">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        {userRole === 'SGI' && (
          <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            <span>Gestor de Usuarios</span>
          </NavLink>
        )}

        <NavLink to="/indicators" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Target size={20} />
          <span>Objetivos y Metas</span>
        </NavLink>
        
        <NavLink to="/documents" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Gestor Documental</span>
        </NavLink>
        

        <NavLink to="/internal-audits" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShieldAlert size={20} />
          <span>Auditorías Internas</span>
        </NavLink>

        <NavLink to="/context" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Globe size={18} />
          <span>Contexto (Estratégico)</span>
        </NavLink>
        <NavLink to="/metrics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart2 size={18} />
          <span>Indicadores del SGI</span>
        </NavLink>

        <NavLink to="/risks" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={20} />
          <span>Matriz de Riesgos</span>
        </NavLink>
        
        <NavLink to="/management-review" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span>Revisión Dirección</span>
        </NavLink>

      </nav>
    </aside>
  );
};

export default Sidebar;

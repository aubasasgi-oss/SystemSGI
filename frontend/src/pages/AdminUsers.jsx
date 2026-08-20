import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, Shield, Save, Plus, Loader, Mail, Lock } from 'lucide-react';
import { SECTORES_AUBASA } from '../lib/sectoresAubasa';

export default function AdminUsers() {
  const { userRole, checkPermission } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // Formulario Nuevo Usuario
  const [showNewUser, setShowNewUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (userRole !== 'SGI') return;
    fetchProfiles();
  }, [userRole]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar perfiles: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (id, newRole) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, role: newRole } : p));
  };

  const handleSectorChange = (id, newSector) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, sector: newSector } : p));
  };

  const saveProfile = async (id, role, sector) => {
    setSaveStatus('Guardando...');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role, sector })
        .eq('id', id);

      if (error) throw error;
      setSaveStatus('¡Guardado!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error(err);
      alert('Error guardando perfil: ' + err.message);
      setSaveStatus('');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await fetch('/api/createUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error desconocido al crear usuario');
      }

      alert('Usuario creado exitosamente. Ya puedes asignarle un sector en la tabla.');
      setNewEmail('');
      setNewPassword('');
      setShowNewUser(false);
      fetchProfiles();
    } catch (err) {
      console.error(err);
      alert('Error al crear usuario: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  if (userRole !== 'SGI') {
    return (
      <div className="glass" style={{ padding: '32px', textAlign: 'center', marginTop: '40px' }}>
        <Shield size={48} color="var(--danger-color)" style={{ marginBottom: '16px' }} />
        <h2>Acceso Denegado</h2>
        <p>Esta área es exclusiva para administradores del SGI.</p>
      </div>
    );
  }

  return (
    <div className="module-container">
      <div className="module-header animate-fade-in">
        <div>
          <h2>Gestión de Usuarios</h2>
          <p>Asigna sectores y roles a los miembros de la organización.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewUser(!showNewUser)} style={{ height: 'fit-content' }}>
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      {showNewUser && (
        <div className="glass animate-fade-in delay-1" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid var(--accent-color)' }}>
          <h3 style={{ marginTop: 0 }}>Registrar Nuevo Empleado</h3>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
                <input type="email" required className="form-control" style={{ paddingLeft: '36px' }} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="usuario@aubasa.com.ar" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Contraseña Temporal</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
                <input type="password" required className="form-control" style={{ paddingLeft: '36px' }} value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} placeholder="Mínimo 6 caracteres" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? <Loader size={16} className="spin" /> : 'Registrar'}
            </button>
          </form>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>* El usuario será creado inmediatamente. Luego, encuéntralo en la tabla inferior y asígnale su sector correspondiente.</p>
        </div>
      )}

      <div className="glass table-container animate-fade-in delay-1">
        {error && <div style={{ color: 'red', padding: '16px' }}>{error}</div>}
        
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>Cargando usuarios...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol (Nivel de Acceso)</th>
                <th>Sector Asignado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(prof => (
                <tr key={prof.id}>
                  <td style={{ fontWeight: '500' }}>{prof.email}</td>
                  <td>
                    <select 
                      className="form-control" 
                      value={prof.role} 
                      onChange={(e) => handleRoleChange(prof.id, e.target.value)}
                      style={{ padding: '6px', fontSize: '13px' }}
                    >
                      <option value="Sector">Sector (Limitado)</option>
                      <option value="SGI">SGI (Administrador)</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      className="form-control" 
                      value={prof.sector} 
                      onChange={(e) => handleSectorChange(prof.id, e.target.value)}
                      style={{ padding: '6px', fontSize: '13px' }}
                    >
                      <option value="Pendiente de Asignación">-- Pendiente de Asignación --</option>
                      <option value="SGI">SGI</option>
                      {SECTORES_AUBASA.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => saveProfile(prof.id, prof.role, prof.sector)}
                      style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Save size={14} /> Guardar
                    </button>
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '32px' }}>No hay usuarios registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        
        {saveStatus && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'var(--success-color)', color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} /> {saveStatus}
          </div>
        )}
      </div>
    </div>
  );
}

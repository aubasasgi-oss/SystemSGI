import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { Users, Shield, Save, Plus, Loader, Mail, Lock, KeyRound, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { SECTORES_AUBASA } from '../lib/sectoresAubasa';

export default function AdminUsers() {
  const { userRole } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // Formulario Nuevo Usuario
  const [showNewUser, setShowNewUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Modal Blanquear Contraseña
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [newPasswordReset, setNewPasswordReset] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

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

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserForReset || !newPasswordReset) return;

    if (newPasswordReset.length < 6) {
      setResetError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setResetting(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await fetch('/api/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserForReset.id,
          email: selectedUserForReset.email,
          newPassword: newPasswordReset
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al blanquear la contraseña');
      }

      setResetSuccess(`¡Contraseña blanqueada con éxito para ${selectedUserForReset.email}! Ya puede ingresar con esta nueva clave.`);
      setTimeout(() => {
        setResetModalOpen(false);
        setResetSuccess('');
        setNewPasswordReset('');
        setSelectedUserForReset(null);
      }, 2500);
    } catch (err) {
      console.error(err);
      setResetError(err.message || 'Error al blanquear contraseña.');
    } finally {
      setResetting(false);
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
          <p>Asigna sectores y roles a los miembros de la organización y gestiona sus contraseñas de acceso.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewUser(!showNewUser)} style={{ height: 'fit-content' }}>
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      {showNewUser && (
        <div className="glass animate-fade-in delay-1" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid var(--accent-color)' }}>
          <h3 style={{ marginTop: 0 }}>Registrar Nuevo Empleado</h3>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: '1 1 240px' }}>
              <label className="form-label">Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
                <input type="email" required className="form-control" style={{ paddingLeft: '36px' }} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="usuario@aubasa.com.ar" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
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
                <th style={{ textAlign: 'center', width: '220px' }}>Acciones</th>
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
                      <option value="Pendiente de Asignación">Pendiente de Asignación</option>
                      {SECTORES_AUBASA.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => saveProfile(prof.id, prof.role, prof.sector)}
                        style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        title="Guardar cambios de rol y sector"
                      >
                        <Save size={14} /> Guardar
                      </button>
                      <button 
                        className="btn" 
                        onClick={() => {
                          setSelectedUserForReset(prof);
                          setNewPasswordReset('');
                          setResetError('');
                          setResetSuccess('');
                          setResetModalOpen(true);
                        }}
                        style={{ 
                          padding: '6px 12px', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          backgroundColor: '#f59e0b',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        title="Blanquear contraseña y definir una nueva clave de acceso"
                      >
                        <KeyRound size={14} /> Blanquear
                      </button>
                    </div>
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

      {/* MODAL BLANQUEAR CONTRASEÑA */}
      {resetModalOpen && selectedUserForReset && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass animate-fade-in" style={{ width: '450px', padding: '28px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ backgroundColor: '#fef3c7', padding: '6px', borderRadius: '8px', color: '#d97706' }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Blanquear Contraseña</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Asignar nueva clave de acceso</span>
                </div>
              </div>
              <button 
                onClick={() => setResetModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {resetError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Usuario a Blanquear:</label>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  {selectedUserForReset.email}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Nueva Contraseña Provisional:</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newPasswordReset}
                    onChange={(e) => setNewPasswordReset(e.target.value)}
                    placeholder="Ej: Aubasa2026! o clave provisional"
                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '6px', border: '1px solid var(--border-color)', boxSizing: 'border-box', fontSize: '13px' }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  * Al guardarla, la contraseña se actualiza de inmediato en Supabase y el usuario podrá entrar al instante.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setResetModalOpen(false)}
                  disabled={resetting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#d97706', borderColor: '#d97706' }}
                  disabled={resetting}
                >
                  {resetting ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Loader size={16} className="spin" /> Blanqueando...</div> : 'Confirmar y Blanquear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

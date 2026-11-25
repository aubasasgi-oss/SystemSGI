import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Loader, Shield, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, HelpCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Modos de pantalla: 'login' | 'forgot' | 'update_password'
  const [mode, setMode] = useState('login');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Detectar si el usuario ingresó mediante un enlace de recuperación de contraseña de Supabase
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
      setMode('update_password');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update_password');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Credenciales inválidas o error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa tu correo corporativo.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/login',
      });

      if (resetErr) throw resetErr;

      setSuccessMsg(`Te enviamos las instrucciones de restablecimiento a ${email}. Revisa tu casilla de entrada o correo no deseado (spam).`);
    } catch (err) {
      console.warn('Error enviando reset de password:', err);
      // Mensaje orientador claro tanto para éxito como si el servidor SMTP no está configurado
      setError('No se pudo enviar el correo automático. Si tu usuario fue creado por el administrador, puedes pedirle a SGI (sgiaubasa@gmail.com) que blanquee tu clave en el Gestor de Usuarios.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateErr) throw updateErr;

      setSuccessMsg('¡Contraseña actualizada con éxito! Ya puedes ingresar.');
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: 'var(--bg-color)',
      backgroundImage: 'radial-gradient(circle at top right, rgba(18, 168, 179, 0.08), transparent 45%)'
    }}>
      <div className="glass animate-fade-in" style={{ 
        padding: '2.5rem 2.2rem', 
        textAlign: 'center', 
        maxWidth: '430px', 
        width: '100%',
        margin: '20px',
        borderTop: '4px solid var(--accent-color)',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(18, 168, 179, 0.12)', padding: '16px', borderRadius: '50%' }}>
            {mode === 'login' ? (
              <Shield size={38} color="var(--accent-color)" />
            ) : (
              <KeyRound size={38} color="var(--accent-color)" />
            )}
          </div>
        </div>

        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.9rem', marginBottom: '4px', fontWeight: 'bold' }}>
          AUBASA
        </h2>
        <p style={{ color: 'var(--accent-color)', marginBottom: '1.8rem', fontWeight: 700, letterSpacing: '1px', fontSize: '0.85rem' }}>
          SISTEMA DE GESTIÓN INTEGRAL (SGI)
        </p>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid var(--danger-color)', 
            color: 'var(--danger-color)', 
            padding: '12px 14px', 
            borderRadius: '8px',
            marginBottom: '18px',
            fontSize: '13px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            lineHeight: 1.4
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ 
            background: 'rgba(34, 197, 94, 0.12)', 
            border: '1px solid #16a34a', 
            color: '#15803d', 
            padding: '12px 14px', 
            borderRadius: '8px',
            marginBottom: '18px',
            fontSize: '13px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            lineHeight: 1.4
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODO 1: FORMULARIO DE LOGIN NORMAL */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                className="form-control" 
                placeholder="Correo corporativo" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                className="form-control" 
                placeholder="Contraseña" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessMsg('');
                  setMode('forgot');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-color)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '2px 0'
                }}
              >
                ¿Olvidaste o necesitas restablecer tu contraseña?
              </button>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }} 
              disabled={loading}
            >
              {loading ? <div style={{ animation: 'spin 1s linear infinite' }}><Loader size={20} /></div> : 'Ingresar al SGI'}
            </button>
          </form>
        )}

        {/* MODO 2: SOLICITAR RESTABLECIMIENTO DE CONTRASEÑA */}
        {mode === 'forgot' && (
          <form onSubmit={handleResetRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Restablecer Contraseña
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Ingresa tu correo institucional registrado para enviarte un enlace de recuperación.
              </p>
            </div>

            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                className="form-control" 
                placeholder="Correo corporativo (ej: nombre@aubasa.com.ar)" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }} 
              disabled={loading}
            >
              {loading ? <div style={{ animation: 'spin 1s linear infinite' }}><Loader size={20} /></div> : 'Enviar enlace de recuperación'}
            </button>

            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '12px', 
              fontSize: '12px', 
              color: '#475569',
              lineHeight: 1.45
            }}>
              <strong>¿Problemas para acceder?</strong><br />
              Si no recuerdas tu correo o requieres asistencia inmediata, contacta al administrador del SGI (<strong>sgiaubasa@gmail.com</strong>) para blanquear tu acceso desde el Gestor de Usuarios.
            </div>

            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccessMsg('');
                setMode('login');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 600,
                marginTop: '4px'
              }}
            >
              <ArrowLeft size={16} /> Volver a iniciar sesión
            </button>
          </form>
        )}

        {/* MODO 3: DEFINIR NUEVA CONTRASEÑA (DESDE ENLACE DE RECUPERACIÓN) */}
        {mode === 'update_password' && (
          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Crear Nueva Contraseña
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Ingresa y confirma tu nueva contraseña de acceso al SGI.
              </p>
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                className="form-control" 
                placeholder="Nueva contraseña (mínimo 6 caracteres)" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                className="form-control" 
                placeholder="Confirmar nueva contraseña" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }} 
              disabled={loading}
            >
              {loading ? <div style={{ animation: 'spin 1s linear infinite' }}><Loader size={20} /></div> : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}

        <p style={{ marginTop: '2rem', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Acceso corporativo protegido para el personal de AUBASA.
        </p>
      </div>
    </div>
  );
}

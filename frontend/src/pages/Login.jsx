import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Loader, Shield } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Credenciales inválidas o error de conexión.');
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
      backgroundImage: 'radial-gradient(circle at top right, rgba(18, 168, 179, 0.05), transparent 40%)'
    }}>
      <div className="glass animate-fade-in" style={{ 
        padding: '3rem 2.5rem', 
        textAlign: 'center', 
        maxWidth: '420px', 
        width: '100%',
        margin: '20px',
        borderTop: '4px solid var(--accent-color)'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(18, 168, 179, 0.1)', padding: '16px', borderRadius: '50%' }}>
            <Shield size={40} color="var(--accent-color)" />
          </div>
        </div>

        <h2 style={{ color: 'var(--text-primary)', fontSize: '2rem', marginBottom: '8px', fontWeight: 'bold' }}>AUBASA</h2>
        <p style={{ color: 'var(--accent-color)', marginBottom: '2rem', fontWeight: 600, letterSpacing: '1px' }}>
          SISTEMA DE GESTIÓN INTEGRAL
        </p>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid var(--danger-color)', 
            color: 'var(--danger-color)', 
            padding: '12px', 
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} 
            disabled={loading}
          >
            {loading ? <div style={{ animation: 'spin 1s linear infinite' }}><Loader size={20} /></div> : 'Ingresar al SGI'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Acceso restringido únicamente para personal autorizado de AUBASA.
        </p>
      </div>
    </div>
  );
}

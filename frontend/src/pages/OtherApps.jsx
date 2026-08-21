import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ExternalLink, Grid, ShieldAlert } from 'lucide-react';

const APPS_LIST = [
  {
    id: 'gestion-sgi',
    name: 'Gestión SGI',
    description: 'Plataforma principal de gestión interna SGI.',
    url: 'https://gestion-sgi.netlify.app/',
    allowedSectors: ['SGI'],
    requiresSGI: true,
    color: '#0ea5e9' // sky-500
  },
  {
    id: 'formacion',
    name: 'Formación y Competencia',
    description: 'Portal de capacitación y evaluación de competencias.',
    url: 'https://formacion-y-competencia.vercel.app/',
    allowedSectors: ['ALL'],
    requiresSGI: false,
    color: '#8b5cf6' // violet-500
  },
  {
    id: 'mantenimiento',
    name: 'SGI Mantenimiento',
    description: 'Gestión de mantenimiento y operaciones.',
    url: 'https://sgi-mantenimiento.onrender.com',
    allowedSectors: ['SGI', 'Operaciones SPP'],
    requiresSGI: false,
    color: '#f59e0b' // amber-500
  },
  {
    id: 'proveedores',
    name: 'Proveedores Compras',
    description: 'Portal de gestión y evaluación de proveedores.',
    url: 'https://proveedores-compras.onrender.com',
    allowedSectors: ['ALL'],
    requiresSGI: false,
    color: '#10b981' // emerald-500
  }
];

export default function OtherApps() {
  const { userRole, userSector } = useAuth();

  // Filtrar aplicaciones según permisos del usuario
  const visibleApps = APPS_LIST.filter(app => {
    if (userRole === 'SGI') return true; // SGI ve todo
    if (app.allowedSectors.includes('ALL')) return true; // Todos ven las públicas
    return app.allowedSectors.includes(userSector); // Filtro por sector
  });

  return (
    <div className="module-container">
      <div className="module-header animate-fade-in">
        <div>
          <h2>Otras Aplicaciones</h2>
          <p>Acceso directo a las diferentes plataformas del ecosistema SGI.</p>
        </div>
        <div style={{ padding: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <ShieldAlert size={16} />
          Solo ves las apps autorizadas para tu sector
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px',
        marginTop: '24px'
      }} className="animate-fade-in delay-1">
        {visibleApps.map(app => (
          <a
            key={app.id}
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              borderTop: `4px solid ${app.color}`
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                backgroundColor: `${app.color}15`,
                color: app.color,
                padding: '12px',
                borderRadius: '12px'
              }}>
                <Grid size={24} />
              </div>
              <ExternalLink size={20} color="var(--text-secondary)" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '18px' }}>{app.name}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                {app.description}
              </p>
            </div>
            <div style={{ 
              marginTop: 'auto', 
              paddingTop: '16px', 
              borderTop: '1px solid var(--border-color)',
              fontSize: '12px',
              color: app.color,
              fontWeight: '500'
            }}>
              Abrir aplicación →
            </div>
          </a>
        ))}
      </div>
      
      {visibleApps.length === 0 && (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', marginTop: '24px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No tienes aplicaciones asignadas para tu sector.</p>
        </div>
      )}
    </div>
  );
}

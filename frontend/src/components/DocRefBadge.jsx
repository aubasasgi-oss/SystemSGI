import React from 'react';

const ESTADO_BADGE_CLASS = {
  borrador: 'badge-neutral',
  en_revision: 'badge-warning',
  para_firma: 'badge-primary',
  vigente: 'badge-success',
  obsoleto: 'badge-danger'
};

const ESTADO_LABEL = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  para_firma: 'Para firma',
  vigente: 'Vigente',
  obsoleto: 'Obsoleto'
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
function formatearFecha(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2, '0')}.${MESES[d.getMonth()]}.${d.getFullYear()}`;
}

// Badge de referencia documental (código / revisión / fecha / estado), estilo
// glass del proyecto, para fijar en el costado de las pantallas de Control Documental.
export default function DocRefBadge({ codigo, version }) {
  if (!version) return null;
  return (
    <div className="glass" style={{ padding: '16px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'sticky', top: '16px' }}>
      <div style={{ fontWeight: 700, color: 'var(--accent-color)', fontFamily: 'monospace', fontSize: '14px' }}>{codigo}</div>
      <div>Revisión: <strong>Rev. {String(version.numero_revision).padStart(2, '0')}</strong></div>
      <div>Fecha: <strong>{formatearFecha(version.fecha_revision)}</strong></div>
      <span className={`badge ${ESTADO_BADGE_CLASS[version.estado] || 'badge-neutral'}`} style={{ marginTop: '4px', alignSelf: 'flex-start' }}>
        {ESTADO_LABEL[version.estado] || version.estado}
      </span>
    </div>
  );
}

export { ESTADO_BADGE_CLASS, ESTADO_LABEL, formatearFecha };

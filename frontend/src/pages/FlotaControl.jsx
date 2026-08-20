import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Save, CheckCircle, BarChart2 } from 'lucide-react';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const TIPOS_MTO = ['Preventivo', 'Correctivo'];
const SI_NO = ['Si', 'No'];

const emptyRow = () => ({
  id: null, id_ingreso: '', fecha: '', numero_patente: '',
  tipo_mantenimiento: 'Preventivo', falla_sistema_critico: 'No',
  detalle_falla: '', doc_y_equipamiento: 'Si', muertos_heridos_graves: 0,
});

/* ── Semi-circle Gauge ─────────────────────────────────────────── */
const SemiGauge = ({ value, color = '#3b82f6', size = 160 }) => {
  const r = 58, cx = size / 2, cy = size / 2 + 10;
  const circ = Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.62}`} style={{ overflow: 'visible' }}>
      <path d={`M ${cx-r},${cy} A ${r},${r} 0 0 1 ${cx+r},${cy}`} fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round"/>
      <path d={`M ${cx-r},${cy} A ${r},${r} 0 0 1 ${cx+r},${cy}`} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} style={{ transition: 'stroke-dasharray 0.8s ease' }}/>
      <text x={cx} y={cy-8} textAnchor="middle" fontSize="22" fontWeight="800" fill={color}>
        {value.toFixed(1).replace('.',',')}%
      </text>
      <text x={cx-r+4} y={cy+18} fontSize="10" fill="#94a3b8">0,0%</text>
      <text x={cx+r-4} y={cy+18} fontSize="10" fill="#94a3b8" textAnchor="end">100,0%</text>
    </svg>
  );
};

/* ── Bar Chart ─────────────────────────────────────────────────── */
const BarChart = ({ data }) => {
  const maxVal = Math.max(1, ...data.map(d => d.value));
  const BAR_H = 90;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${BAR_H + 32}px`, padding: '4px 0 0' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          {d.value > 0 && <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af' }}>{d.value}</span>}
          <div style={{
            width: '100%', height: `${Math.max(4, (d.value / maxVal) * BAR_H)}px`,
            background: 'linear-gradient(180deg, #3b82f6, #1e40af)',
            borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease',
          }} />
          <span style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Horizontal Bar (Siniestros por Unidad) ────────────────────── */
const HBarChart = ({ data, max }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
    {data.map((d, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
        <span style={{ width: '56px', color: '#475569', textAlign: 'right', flexShrink: 0 }}>{d.label}</span>
        <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '4px', height: '16px', overflow: 'hidden' }}>
          <div style={{
            width: `${max > 0 ? (d.value / max) * 100 : 0}%`, height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            borderRadius: '4px', transition: 'width 0.6s ease',
          }} />
        </div>
        <span style={{ width: '20px', fontWeight: 700, color: '#1e40af', fontSize: '12px' }}>{d.value}</span>
      </div>
    ))}
  </div>
);

/* ════════════════════════════════════════════════════════════════ */
export default function FlotaControl() {
  const { userRole } = useAuth();
  const isSGI = userRole === 'SGI';

  const [tab, setTab] = useState('dashboard');
  const [mes, setMes] = useState(MESES[new Date().getMonth()]);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [newRows, setNewRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchRecords = useCallback(() => {
    fetch(`http://localhost:5001/api/vehicles?mes=${mes}&anio=${anio}`)
      .then(r => r.json()).then(d => setRecords(Array.isArray(d) ? d : [])).catch(() => setRecords([]));
  }, [mes, anio]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => {
    fetch(`http://localhost:5001/api/vehicles?anio=${anio}`)
      .then(r => r.json()).then(d => setAllRecords(Array.isArray(d) ? d : [])).catch(() => setAllRecords([]));
  }, [anio]);

  /* Métricas */
  const total = records.length;
  const totalConDoc   = records.filter(r => r.doc_y_equipamiento === 'Si').length;
  const totalConFalla = records.filter(r => r.falla_sistema_critico === 1).length;
  const totalPreventivos = records.filter(r => r.tipo_mantenimiento === 'Preventivo').length;
  const totalMuertos  = records.reduce((a, r) => a + (r.muertos_heridos_graves || 0), 0);
  const pctConformidad = total > 0 ? (totalConDoc / total) * 100 : 0;
  const pctFallas      = total > 0 ? (totalConFalla / total) * 100 : 0;

  /* Bar data */
  const barData = MESES.map(m => ({
    label: m.slice(0, 3),
    value: allRecords.filter(r => r.mes === m && r.tipo_mantenimiento === 'Preventivo').length,
  }));

  /* Siniestros por patente */
  const sinByPatente = Object.entries(
    records.reduce((acc, r) => {
      if (r.falla_sistema_critico) acc[r.numero_patente] = (acc[r.numero_patente] || 0) + 1;
      return acc;
    }, {})
  ).map(([p, v]) => ({ label: p, value: v }))
    .sort((a, b) => b.value - a.value).slice(0, 5);
  const maxSin = sinByPatente.length > 0 ? sinByPatente[0].value : 1;

  /* Row helpers */
  const updateRow = (i, f, v) => setNewRows(prev => prev.map((r, idx) => idx === i ? { ...r, [f]: v } : r));
  const addRow    = () => setNewRows(prev => [...prev, emptyRow()]);
  const removeRow = (i) => setNewRows(prev => prev.filter((_, idx) => idx !== i));

  const deleteRecord = async (id) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    await fetch(`http://localhost:5001/api/vehicles/${id}`, { method: 'DELETE' });
    fetchRecords();
  };

  const handleSave = async () => {
    const valid = newRows.filter(r => r.fecha && r.numero_patente);
    if (!valid.length) return;
    setSaving(true);
    for (const row of valid) {
      await fetch('http://localhost:5001/api/vehicles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...row, mes, anio }),
      });
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setNewRows([emptyRow()]); fetchRecords();
  };

  /* ── Shared styles ── */
  const card = (extra = {}) => ({
    background: 'white', borderRadius: '14px', padding: '20px',
    border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', ...extra,
  });
  const label12 = { fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e40af' };
  const sub10   = { fontSize: '10px', color: '#94a3b8', marginTop: '2px', lineHeight: '1.4' };
  const TH = { background: '#1e3a8a', color: 'white', padding: '10px 8px', fontSize: '11px', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' };
  const TD = { padding: '9px 8px', fontSize: '12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' };

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header animate-fade-in" style={{ marginBottom: '20px' }}>
        <div>
          <h2>Factores de Desempeño – Seguridad Vial</h2>
          <p>Control de Flota · Mantenimiento Preventivo · Conformidad Legal</p>
        </div>
      </div>

      {/* Tabs + Filtros */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isSGI && (
            <button onClick={() => setTab('carga')} style={{
              padding: '9px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              background: tab === 'carga' ? '#1e40af' : '#f1f5f9', color: tab === 'carga' ? 'white' : '#475569',
            }}>✏️ Carga de Registros</button>
          )}
          <button onClick={() => setTab('dashboard')} style={{
            padding: '9px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
            background: tab === 'dashboard' ? '#1e40af' : '#f1f5f9', color: tab === 'dashboard' ? 'white' : '#475569',
          }}>📊 Dashboard</button>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select className="form-control" value={mes} onChange={e => setMes(e.target.value)} style={{ width: '150px' }}>
              {MESES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input type="number" className="form-control" value={anio} onChange={e => setAnio(e.target.value)} style={{ width: '90px' }} />
          </div>
        </div>
      </div>

      {/* ═══ TAB CARGA ═══ */}
      {tab === 'carga' && isSGI && (
        <div className="glass animate-fade-in" style={{ padding: '28px' }}>
          <h3 style={{ color: 'var(--accent-color)', marginBottom: '20px', fontSize: '16px' }}>
            Nuevos Registros — {mes} {anio}
          </h3>
          <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '900px' }}>
              <thead>
                <tr>
                  {['ID Ingreso','Fecha','Patente','Tipo Mto.','Falla Sist. Crítico','Detalle','Doc y Equip.','Muertos/H.G.',''].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {newRows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                    <td style={TD}><input className="form-control" style={{ width: '80px', fontSize: '11px', padding: '5px' }} placeholder="M-001" value={row.id_ingreso} onChange={e => updateRow(i, 'id_ingreso', e.target.value)} /></td>
                    <td style={TD}><input type="date" className="form-control" style={{ width: '135px', fontSize: '11px', padding: '5px' }} value={row.fecha} onChange={e => updateRow(i, 'fecha', e.target.value)} /></td>
                    <td style={TD}><input className="form-control" style={{ width: '100px', fontSize: '11px', padding: '5px' }} placeholder="AA000BB" value={row.numero_patente} onChange={e => updateRow(i, 'numero_patente', e.target.value.toUpperCase())} /></td>
                    <td style={TD}>
                      <select className="form-control" style={{ width: '110px', fontSize: '11px', padding: '5px' }} value={row.tipo_mantenimiento} onChange={e => updateRow(i, 'tipo_mantenimiento', e.target.value)}>
                        {TIPOS_MTO.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </td>
                    <td style={TD}>
                      <select className="form-control" style={{ width: '80px', fontSize: '11px', padding: '5px' }} value={row.falla_sistema_critico} onChange={e => updateRow(i, 'falla_sistema_critico', e.target.value)}>
                        {SI_NO.map(v => <option key={v}>{v}</option>)}
                      </select>
                    </td>
                    <td style={TD}><input className="form-control" style={{ width: '150px', fontSize: '11px', padding: '5px' }} placeholder="Sin novedades" value={row.detalle_falla} onChange={e => updateRow(i, 'detalle_falla', e.target.value)} /></td>
                    <td style={TD}>
                      <select className="form-control" style={{ width: '70px', fontSize: '11px', padding: '5px' }} value={row.doc_y_equipamiento} onChange={e => updateRow(i, 'doc_y_equipamiento', e.target.value)}>
                        {SI_NO.map(v => <option key={v}>{v}</option>)}
                      </select>
                    </td>
                    <td style={TD}><input type="number" className="form-control" style={{ width: '60px', fontSize: '11px', padding: '5px' }} min="0" value={row.muertos_heridos_graves} onChange={e => updateRow(i, 'muertos_heridos_graves', Number(e.target.value))} /></td>
                    <td style={TD}>{newRows.length > 1 && <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={addRow} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><Plus size={14} /> Agregar fila</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              {saved ? <><CheckCircle size={14} /> Guardado</> : <><Save size={14} /> {saving ? 'Guardando...' : 'Guardar registros'}</>}
            </button>
          </div>

          {records.length > 0 && (
            <div style={{ marginTop: '36px' }}>
              <h4 style={{ color: '#475569', marginBottom: '12px', fontSize: '14px' }}>
                Registros guardados — {mes} {anio} <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', marginLeft: '8px' }}>{records.length}</span>
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr>{['Patente','Fecha','Tipo','Falla Crítica','Detalle','Doc/Equip','M.H.G.',''].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ ...TD, fontWeight: 700 }}>{r.numero_patente}</td>
                        <td style={TD}>{r.fecha}</td>
                        <td style={TD}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', background: r.tipo_mantenimiento === 'Preventivo' ? '#dbeafe' : '#fef3c7', color: r.tipo_mantenimiento === 'Preventivo' ? '#1e40af' : '#92400e' }}>{r.tipo_mantenimiento}</span></td>
                        <td style={TD}><span style={{ color: r.falla_sistema_critico ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{r.falla_sistema_critico ? '⚠ SÍ' : '✓ No'}</span></td>
                        <td style={{ ...TD, color: '#64748b', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.detalle_falla || '—'}</td>
                        <td style={TD}><span style={{ color: r.doc_y_equipamiento === 'Si' ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{r.doc_y_equipamiento === 'Si' ? '✓' : '✗'}</span></td>
                        <td style={{ ...TD, color: r.muertos_heridos_graves > 0 ? '#dc2626' : '#64748b', fontWeight: r.muertos_heridos_graves > 0 ? 700 : 400 }}>{r.muertos_heridos_graves || 0}</td>
                        <td style={TD}><button onClick={() => deleteRecord(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB DASHBOARD ═══ */}
      {tab === 'dashboard' && (
        <div className="animate-fade-in">

          {/* Header banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%)',
            borderRadius: '16px', padding: '20px 28px', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 4px 20px rgba(30,64,175,0.3)',
          }}>
            <div>
              <h2 style={{ margin: 0, color: 'white', fontWeight: 800, fontSize: '18px', letterSpacing: '1.5px' }}>
                FACTORES DE DESEMPEÑO – SEGURIDAD VIAL
              </h2>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                {mes} {anio} · {total} registros cargados
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 20px', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginBottom: '2px' }}>Año</div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '20px' }}>{anio}</div>
            </div>
          </div>

          {/* Fila 1 – 3 stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Vehículos */}
            <div style={{ ...card(), borderTop: '4px solid #3b82f6' }}>
              <div style={{ ...label12, color: '#3b82f6' }}>Total Vehículos</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Ingresados al taller</div>
              <div style={{ fontSize: '48px', fontWeight: 900, color: '#1e3a8a', lineHeight: 1 }}>{total}</div>
            </div>
            {/* Preventivos */}
            <div style={{ ...card(), borderTop: '4px solid #22c55e' }}>
              <div style={{ ...label12, color: '#16a34a' }}>Preventivos</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Mantenimiento programado</div>
              <div style={{ fontSize: '48px', fontWeight: 900, color: '#15803d', lineHeight: 1 }}>{totalPreventivos}</div>
            </div>
            {/* Muertos */}
            <div style={{
              ...card(),
              borderTop: `4px solid ${totalMuertos > 0 ? '#ef4444' : '#22c55e'}`,
              background: totalMuertos > 0 ? '#fff5f5' : 'white',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#475569', lineHeight: '1.3' }}>
                ESTADÍSTICO FINAL<br/>Muertos y Heridos Graves
              </div>
              <div style={{ fontSize: '56px', fontWeight: 900, color: totalMuertos > 0 ? '#dc2626' : '#16a34a', lineHeight: 1.1, marginTop: '6px' }}>
                {totalMuertos}
              </div>
            </div>
          </div>

          {/* Fila 2 – Gauges + Barras + Siniestros */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '16px', marginBottom: '16px' }}>
            {/* Conformidad */}
            <div style={card()}>
              <div style={label12}>INTERMEDIO</div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e3a8a', margin: '4px 0 2px' }}>
                % Conformidad Legal y Equipamiento
              </div>
              <div style={sub10}>Control de VTV, Seguro, Cédula, Matafuegos y Kit de Emergencia</div>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 4px' }}>
                <SemiGauge value={pctConformidad} color="#3b82f6" size={180} />
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                {totalConDoc} / {total} vehículos en regla
              </div>
            </div>

            {/* Fallas */}
            <div style={card()}>
              <div style={label12}>INTERMEDIO</div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e3a8a', margin: '4px 0 2px' }}>
                % Tasa de Fallas en Sistemas Críticos
              </div>
              <div style={sub10}>Frenos, Dirección, Neumáticos, Suspensión e Iluminación</div>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 4px' }}>
                <SemiGauge value={pctFallas} color={pctFallas > 10 ? '#ef4444' : '#3b82f6'} size={180} />
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                {totalConFalla} vehículos con falla
              </div>
            </div>

            {/* Volumen preventivo (barras) */}
            <div style={card()}>
              <div style={label12}>INTERMEDIO</div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e3a8a', margin: '4px 0 2px' }}>
                Volumen de Mantenimiento Preventivo
              </div>
              <div style={sub10}>Total de vehículos ingresados al taller para control de la flota — {anio}</div>
              <div style={{ marginTop: '16px' }}>
                <BarChart data={barData} />
              </div>
            </div>
          </div>

          {/* Fila 3 – Siniestros por unidad + detalle tabla */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
            {/* Siniestros por unidad */}
            <div style={card()}>
              <div style={label12}>EXPOSICIÓN</div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e3a8a', margin: '4px 0 10px' }}>
                Fallas por Unidad (Ranking)
              </div>
              {sinByPatente.length > 0 ? (
                <HBarChart data={sinByPatente} max={maxSin} />
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', padding: '24px 0' }}>Sin fallas registradas</div>
              )}
            </div>

            {/* Tabla detalle */}
            <div style={card()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={label12}>Detalle de Registros</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{mes} {anio}</div>
                </div>
                <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>{total} registros</span>
              </div>
              {records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                  <BarChart2 size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p style={{ fontSize: '13px' }}>Sin registros para {mes} {anio}</p>
                  {isSGI && <p style={{ fontSize: '12px' }}>Usá la pestaña <strong>"Carga de Registros"</strong></p>}
                </div>
              ) : (
                <div style={{ overflowX: 'auto', maxHeight: '260px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead style={{ position: 'sticky', top: 0 }}>
                      <tr>{['Patente','Fecha','Tipo','Falla','Doc/Equip','M.H.G.'].map(h => <th key={h} style={{ ...TH, background: '#1e3a8a', padding: '8px 6px' }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {records.map((r, i) => (
                        <tr key={r.id} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                          <td style={{ ...TD, fontWeight: 700, padding: '7px 6px' }}>{r.numero_patente}</td>
                          <td style={{ ...TD, padding: '7px 6px' }}>{r.fecha}</td>
                          <td style={{ ...TD, padding: '7px 6px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', background: r.tipo_mantenimiento === 'Preventivo' ? '#dbeafe' : '#fef3c7', color: r.tipo_mantenimiento === 'Preventivo' ? '#1e40af' : '#92400e' }}>{r.tipo_mantenimiento}</span>
                          </td>
                          <td style={{ ...TD, padding: '7px 6px', color: r.falla_sistema_critico ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{r.falla_sistema_critico ? '⚠ Sí' : '✓'}</td>
                          <td style={{ ...TD, padding: '7px 6px', color: r.doc_y_equipamiento === 'Si' ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{r.doc_y_equipamiento === 'Si' ? '✓ Ok' : '✗'}</td>
                          <td style={{ ...TD, padding: '7px 6px', color: r.muertos_heridos_graves > 0 ? '#dc2626' : '#94a3b8', fontWeight: r.muertos_heridos_graves > 0 ? 700 : 400 }}>{r.muertos_heridos_graves || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Save, Pencil, Trash2, X, PlusCircle } from 'lucide-react';
import { listarCcmMetrics, guardarCcmMetric, eliminarCcmMetric } from '../lib/ccmMetricsApi';

const pct = (num, den) => (den ? ((Number(num) || 0) / Number(den) * 100) : null);
const fmtPct = (v) => v === null || v === undefined || isNaN(v) ? '-' : v.toFixed(2).replace('.', ',') + '%';
const fmtNum = (v) => v === null || v === undefined || v === '' || isNaN(v) ? '-' : Number(v).toFixed(2).replace('.', ',');

// Las metas son fijas (las mismas que ya tenía definidas cada KPI), no un
// dato que carga el sector — se muestran solo para comparar.
const cumpleBadge = (texto, ok) => (
  <span style={{ color: ok === null ? 'inherit' : (ok ? '#16a34a' : '#dc2626'), fontWeight: ok === null ? 400 : 700 }}>
    {texto}{ok === null ? '' : (ok ? ' ✓' : ' ✗')}
  </span>
);

const TIPOS = {
  contingencias: {
    label: 'Contingencias, Detección y Atención',
    campos: [
      { id: 'liberacion_ok', label: 'Liberación de calzada por obstáculos ≤ 30 min', type: 'number' },
      { id: 'total_eventos', label: 'Cantidad de eventos', type: 'number' },
    ],
    columnas: (d) => {
      const ind = pct(d.liberacion_ok, d.total_eventos);
      return [fmtNum(d.liberacion_ok), fmtNum(d.total_eventos), cumpleBadge(fmtPct(ind), ind === null ? null : ind >= 85), 'Meta ≥ 85%'];
    },
    headers: ['Liberación ≤30min OK', 'Total Eventos', 'Indicador', 'Meta'],
  },
  gestion_transito: {
    label: 'Gestión Tránsito',
    campos: [
      { id: 'detectadas', label: 'Cant. contingencias detectadas por el CCM', type: 'number' },
      { id: 'reportadas', label: 'Cant. contingencias reportadas', type: 'number' },
      { id: 'hs_fuera_cam', label: 'Hs fuera de servicio Cámaras', type: 'number' },
      { id: 'hs_totales_cam', label: 'Cant. de horas totales (Cámaras)', type: 'number' },
      { id: 'hs_fuera_pmv', label: 'Hs fuera de servicio PMV', type: 'number' },
      { id: 'hs_totales_pmv', label: 'Cant. de horas totales (PMV)', type: 'number' },
    ],
    columnas: (d) => {
      const indDet = pct(d.detectadas, d.reportadas);
      const indCam = d.hs_totales_cam ? ((Number(d.hs_totales_cam) - (Number(d.hs_fuera_cam) || 0)) / Number(d.hs_totales_cam)) * 100 : null;
      const indPmv = d.hs_totales_pmv ? ((Number(d.hs_totales_pmv) - (Number(d.hs_fuera_pmv) || 0)) / Number(d.hs_totales_pmv)) * 100 : null;
      return [
        fmtNum(d.detectadas), fmtNum(d.reportadas), cumpleBadge(fmtPct(indDet), indDet === null ? null : indDet >= 65), 'Meta ≥ 65%',
        fmtNum(d.hs_fuera_cam), fmtNum(d.hs_totales_cam), cumpleBadge(fmtPct(indCam), indCam === null ? null : indCam >= 90), 'Meta ≥ 90%',
        fmtNum(d.hs_fuera_pmv), fmtNum(d.hs_totales_pmv), cumpleBadge(fmtPct(indPmv), indPmv === null ? null : indPmv >= 90), 'Meta ≥ 90%',
      ];
    },
    headers: [
      'Detectadas', 'Reportadas', 'Ind. Detección CCM', 'Meta',
      'Hs Fuera (Cám.)', 'Hs Totales (Cám.)', 'Ind. Disp. Cámaras', 'Meta',
      'Hs Fuera (PMV)', 'Hs Totales (PMV)', 'Ind. Disp. PMV', 'Meta',
    ],
  },
};

const emptyForm = (tipoKey) => {
  const base = { fecha: '' };
  TIPOS[tipoKey].campos.forEach(c => { base[c.id] = ''; });
  return base;
};

const CcmMetricsForms = () => {
  const [tipoActivo, setTipoActivo] = useState('contingencias');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm('contingencias'));
  const [saveMsg, setSaveMsg] = useState('');

  const cargarFilas = (tipoKey) => {
    setLoading(true);
    listarCcmMetrics(tipoKey)
      .then(setRows)
      .catch(err => { console.error(err); setRows([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarFilas(tipoActivo);
    setEditingId(null);
    setForm(emptyForm(tipoActivo));
  }, [tipoActivo]);

  const handleChange = (campoId, value) => {
    setForm(prev => ({ ...prev, [campoId]: value }));
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({ fecha: row.fecha, ...row.data });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm(tipoActivo));
  };

  const handleDelete = (row) => {
    if (!window.confirm('¿Eliminar esta carga? Esta acción no se puede deshacer.')) return;
    eliminarCcmMetric(row.id)
      .then(() => cargarFilas(tipoActivo))
      .catch(err => alert('Error al eliminar: ' + err.message));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fecha) return;

    const { fecha, ...resto } = form;
    const data = {};
    TIPOS[tipoActivo].campos.forEach(c => {
      data[c.id] = c.type === 'number' ? (resto[c.id] === '' ? null : Number(resto[c.id])) : resto[c.id];
    });

    guardarCcmMetric(tipoActivo, editingId, fecha, data)
      .then(() => {
        setSaveMsg(editingId ? 'Carga actualizada.' : 'Carga guardada.');
        setTimeout(() => setSaveMsg(''), 2500);
        handleCancelEdit();
        cargarFilas(tipoActivo);
      })
      .catch(err => alert('Error al guardar: ' + err.message));
  };

  const config = TIPOS[tipoActivo];

  return (
    <div className="module-container">
      <div className="module-header animate-fade-in">
        <div>
          <h2>Carga de Métricas - Centro de Control y Monitoreo (CCM)</h2>
          <p>Cada carga es un registro independiente que se puede editar o eliminar.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {Object.entries(TIPOS).map(([key, t]) => (
          <button
            key={key}
            type="button"
            className={tipoActivo === key ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setTipoActivo(key)}
            style={{ fontSize: '13px' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="glass animate-fade-in delay-1" style={{ padding: '32px', marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {editingId ? <Pencil size={18} /> : <PlusCircle size={18} />}
          {editingId ? 'Editar carga' : 'Nueva carga'} — {config.label}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '160px' }}>
              <label className="form-label">Fecha</label>
              <input
                type="date"
                className="form-control"
                value={form.fecha || ''}
                onChange={e => handleChange('fecha', e.target.value)}
                required
              />
            </div>

            {config.campos.map(campo => (
              <div key={campo.id} className="form-group" style={{ marginBottom: 0, minWidth: '180px', flex: '1 1 180px' }}>
                <label className="form-label">{campo.label}</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="Valor..."
                  value={form[campo.id] !== undefined ? form[campo.id] : ''}
                  onChange={e => handleChange(campo.id, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={handleCancelEdit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <X size={16} /> Cancelar
              </button>
            )}
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> {editingId ? 'Guardar cambios' : 'Guardar carga'}
            </button>
          </div>

          {saveMsg && (
            <div style={{ padding: '10px', background: '#f0fdf4', color: '#16a34a', borderRadius: '8px', textAlign: 'right' }}>
              {saveMsg}
            </div>
          )}
        </form>
      </div>

      <div className="glass table-container animate-fade-in delay-1" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>Cargando...</div>
        ) : (
          <table className="data-table" style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th>Fecha</th>
                {config.headers.map((h, i) => <th key={i}>{h}</th>)}
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td>{row.fecha}</td>
                  {config.columnas(row.data).map((val, i) => <td key={i}>{val}</td>)}
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', marginRight: '6px' }} onClick={() => handleEdit(row)} title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', color: '#dc2626' }} onClick={() => handleDelete(row)} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={config.headers.length + 2} style={{ textAlign: 'center', padding: '32px' }}>
                    No hay cargas todavía para {config.label}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CcmMetricsForms;

import React, { useState, useEffect } from 'react';
import { Save, Pencil, Trash2, X, PlusCircle } from 'lucide-react';
import { listarMantenimientoMetrics, guardarMantenimientoMetric, eliminarMantenimientoMetric } from '../lib/mantenimientoMetricsApi';

const pct = (num, den) => (den ? ((Number(num) || 0) / Number(den) * 100) : null);
const fmtPct = (v) => v === null || v === undefined || isNaN(v) ? '-' : v.toFixed(2).replace('.', ',') + '%';
const fmtNum = (v) => v === null || v === undefined || v === '' || isNaN(v) ? '-' : Number(v).toFixed(2).replace('.', ',');

// La meta es fija (la misma que ya tenía definida cada KPI), no un dato que
// carga el sector — se muestra solo para comparar.
const cumpleBadge = (texto, ok) => (
  <span style={{ color: ok === null ? 'inherit' : (ok ? '#16a34a' : '#dc2626'), fontWeight: ok === null ? 400 : 700 }}>
    {texto}{ok === null ? '' : (ok ? ' ✓' : ' ✗')}
  </span>
);

const TIPOS = {
  pmp: {
    label: 'Cumplimiento PMP (Preventivo)',
    campos: [
      { id: 'prev_realizados', label: 'Cant. trabajos de mantenimiento preventivos realizados', type: 'number' },
      { id: 'prev_planificados', label: 'Cant. trabajos de mantenimiento preventivos planificados', type: 'number' },
    ],
    columnas: (d) => {
      const ind = pct(d.prev_realizados, d.prev_planificados);
      return [fmtNum(d.prev_realizados), fmtNum(d.prev_planificados), cumpleBadge(fmtPct(ind), ind === null ? null : ind >= 95), 'Meta ≥ 95%'];
    },
    headers: ['Realizados', 'Planificados', 'Indicador', 'Meta'],
  },
  mc: {
    label: 'Cumplimiento MC (Correctivo)',
    campos: [
      { id: 'corr_realizados', label: 'Cant. trabajos de mantenimiento correctivos realizados', type: 'number' },
      { id: 'corr_solicitados', label: 'Cant. trabajos de mantenimiento correctivos solicitados', type: 'number' },
    ],
    columnas: (d) => {
      const ind = pct(d.corr_realizados, d.corr_solicitados);
      return [fmtNum(d.corr_realizados), fmtNum(d.corr_solicitados), cumpleBadge(fmtPct(ind), ind === null ? null : ind >= 90), 'Meta ≥ 90%'];
    },
    headers: ['Realizados', 'Solicitados', 'Indicador', 'Meta'],
  },
};

const emptyForm = (tipoKey) => {
  const base = { fecha: '' };
  TIPOS[tipoKey].campos.forEach(c => { base[c.id] = ''; });
  return base;
};

const MantenimientoMetricsForms = () => {
  const [tipoActivo, setTipoActivo] = useState('pmp');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm('pmp'));
  const [saveMsg, setSaveMsg] = useState('');

  const cargarFilas = (tipoKey) => {
    setLoading(true);
    listarMantenimientoMetrics(tipoKey)
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
    eliminarMantenimientoMetric(row.id)
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

    guardarMantenimientoMetric(tipoActivo, editingId, fecha, data)
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
          <h2>Carga de Métricas - Ger. Mantenimiento (Taller Mecánico)</h2>
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
              <div key={campo.id} className="form-group" style={{ marginBottom: 0, minWidth: '180px', flex: '1 1 220px' }}>
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
          <table className="data-table" style={{ minWidth: '700px' }}>
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

export default MantenimientoMetricsForms;

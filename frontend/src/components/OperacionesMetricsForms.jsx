import React, { useState, useEffect } from 'react';
import { Save, Pencil, Trash2, X, PlusCircle } from 'lucide-react';
import { listarOperacionesMetrics, guardarOperacionesMetric, eliminarOperacionesMetric } from '../lib/operacionesMetricsApi';

const SITIOS = ['Dock Sud', 'Hudson', 'Bernal', 'Quilmes', 'Berazategui', 'Samborombón', 'Maipú', 'La Huella', 'Mar Chiquita', 'Gral. Madariaga'];
const META_SPP = 4.0; // Meta ≤ 4,00% (igual que el KPI definido en Indicadores)

const fmtNum = (v) => v === null || v === undefined || v === '' || isNaN(v) ? '-' : Number(v).toFixed(2).replace('.', ',');
const pct = (num, den) => (den ? ((Number(num) || 0) / Number(den)) * 100 : null);

const cumpleBadge = (texto, ok) => (
  <span style={{ color: ok === null ? 'inherit' : (ok ? '#16a34a' : '#dc2626'), fontWeight: ok === null ? 400 : 700 }}>
    {texto}{ok === null ? '' : (ok ? ' ✓' : ' ✗')}
  </span>
);

const emptyForm = () => ({ fecha: '', sitio: '', horas_fuera: '', horas_mensuales: '' });

const OperacionesMetricsForms = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saveMsg, setSaveMsg] = useState('');

  const cargarFilas = () => {
    setLoading(true);
    listarOperacionesMetrics()
      .then(setRows)
      .catch(err => { console.error(err); setRows([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarFilas();
  }, []);

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
    setForm(emptyForm());
  };

  const handleDelete = (row) => {
    if (!window.confirm('¿Eliminar esta carga? Esta acción no se puede deshacer.')) return;
    eliminarOperacionesMetric(row.id)
      .then(() => cargarFilas())
      .catch(err => alert('Error al eliminar: ' + err.message));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fecha) return;

    const { fecha, ...resto } = form;
    const data = {
      sitio: resto.sitio || null,
      horas_fuera: resto.horas_fuera === '' ? null : Number(resto.horas_fuera),
      horas_mensuales: resto.horas_mensuales === '' ? null : Number(resto.horas_mensuales),
    };

    guardarOperacionesMetric(editingId, fecha, data)
      .then(() => {
        setSaveMsg(editingId ? 'Carga actualizada.' : 'Carga guardada.');
        setTimeout(() => setSaveMsg(''), 2500);
        handleCancelEdit();
        cargarFilas();
      })
      .catch(err => alert('Error al guardar: ' + err.message));
  };

  return (
    <div className="module-container">
      <div className="module-header animate-fade-in">
        <div>
          <h2>Carga de Métricas - Sistema de Percepción de Peaje (SPP)</h2>
          <p>Cada carga es un registro independiente (por fecha y sitio) que se puede editar o eliminar.</p>
        </div>
      </div>

      <div className="glass animate-fade-in delay-1" style={{ padding: '32px', marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {editingId ? <Pencil size={18} /> : <PlusCircle size={18} />}
          {editingId ? 'Editar carga' : 'Nueva carga'}
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

            <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
              <label className="form-label">Sitio</label>
              <select
                className="form-control"
                value={form.sitio || ''}
                onChange={e => handleChange('sitio', e.target.value)}
                required
              >
                <option value="">Seleccionar...</option>
                {SITIOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0, minWidth: '180px', flex: '1 1 180px' }}>
              <label className="form-label">Horas fuera de servicio</label>
              <input
                type="number"
                step="any"
                className="form-control"
                placeholder="Valor..."
                value={form.horas_fuera !== undefined ? form.horas_fuera : ''}
                onChange={e => handleChange('horas_fuera', e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0, minWidth: '180px', flex: '1 1 180px' }}>
              <label className="form-label">Horas Mensuales</label>
              <input
                type="number"
                step="any"
                className="form-control"
                placeholder="Valor..."
                value={form.horas_mensuales !== undefined ? form.horas_mensuales : ''}
                onChange={e => handleChange('horas_mensuales', e.target.value)}
                required
              />
            </div>
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
          <table className="data-table" style={{ minWidth: '760px' }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Sitio</th>
                <th>Horas fuera de servicio</th>
                <th>Horas Mensuales</th>
                <th>Indicador SPP</th>
                <th>Meta</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const ind = pct(row.data?.horas_fuera, row.data?.horas_mensuales);
                return (
                  <tr key={row.id}>
                    <td>{row.fecha}</td>
                    <td>{row.data?.sitio || '-'}</td>
                    <td>{fmtNum(row.data?.horas_fuera)}</td>
                    <td>{fmtNum(row.data?.horas_mensuales)}</td>
                    <td>{cumpleBadge(ind === null ? '-' : ind.toFixed(2).replace('.', ',') + '%', ind === null ? null : ind <= META_SPP)}</td>
                    <td>≤ {META_SPP.toFixed(2).replace('.', ',')} %</td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', marginRight: '6px' }} onClick={() => handleEdit(row)} title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', color: '#dc2626' }} onClick={() => handleDelete(row)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                    No hay cargas todavía para el SPP.
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

export default OperacionesMetricsForms;

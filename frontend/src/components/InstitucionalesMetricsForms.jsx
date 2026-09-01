import React, { useState, useEffect } from 'react';
import { Save, Pencil, Trash2, X, PlusCircle } from 'lucide-react';
import { listarInstitucionalesMetrics, guardarInstitucionalesMetric, eliminarInstitucionalesMetric } from '../lib/institucionalesMetricsApi';

const pct = (num, den) => (den ? ((Number(num) || 0) / Number(den) * 100) : null);
const fmtPct = (v) => v === null || v === undefined || isNaN(v) ? '-' : v.toFixed(2).replace('.', ',') + '%';
const fmtNum = (v) => v === null || v === undefined || v === '' || isNaN(v) ? '-' : Number(v).toFixed(2).replace('.', ',');

const cumpleBadge = (texto, ok) => (
  <span style={{ color: ok === null ? 'inherit' : (ok ? '#16a34a' : '#dc2626'), fontWeight: ok === null ? 400 : 700 }}>
    {texto}{ok === null ? '' : (ok ? ' ✓' : ' ✗')}
  </span>
);

const CAMPOS = [
  { id: 'num', label: 'Eventos publicados', type: 'number' },
  { id: 'den', label: 'Eventos sucedidos', type: 'number' },
];

const emptyForm = () => ({ fecha: '', num: '', den: '' });

const InstitucionalesMetricsForms = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saveMsg, setSaveMsg] = useState('');

  const cargarFilas = () => {
    setLoading(true);
    listarInstitucionalesMetrics()
      .then(setRows)
      .catch(err => { console.error(err); setRows([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarFilas(); }, []);

  const handleChange = (campoId, value) => setForm(prev => ({ ...prev, [campoId]: value }));

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
    eliminarInstitucionalesMetric(row.id).then(cargarFilas).catch(err => alert('Error al eliminar: ' + err.message));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fecha) return;
    const { fecha, ...resto } = form;
    const data = { num: resto.num === '' ? null : Number(resto.num), den: resto.den === '' ? null : Number(resto.den) };
    guardarInstitucionalesMetric(editingId, fecha, data)
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
          <h2>Carga de Métricas - SubGerencia Relaciones Institucionales</h2>
          <p>Cada carga es un registro independiente que se puede editar o eliminar.</p>
        </div>
      </div>

      <div className="glass animate-fade-in delay-1" style={{ padding: '32px', marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {editingId ? <Pencil size={18} /> : <PlusCircle size={18} />}
          {editingId ? 'Editar carga' : 'Nueva carga'} — Efectividad de eventos publicados en RRSS
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '160px' }}>
              <label className="form-label">Fecha</label>
              <input type="date" className="form-control" value={form.fecha || ''} onChange={e => handleChange('fecha', e.target.value)} required />
            </div>
            {CAMPOS.map(campo => (
              <div key={campo.id} className="form-group" style={{ marginBottom: 0, minWidth: '180px', flex: '1 1 200px' }}>
                <label className="form-label">{campo.label}</label>
                <input type="number" step="any" className="form-control" placeholder="Valor..." value={form[campo.id] !== undefined ? form[campo.id] : ''} onChange={e => handleChange(campo.id, e.target.value)} required />
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
          {saveMsg && <div style={{ padding: '10px', background: '#f0fdf4', color: '#16a34a', borderRadius: '8px', textAlign: 'right' }}>{saveMsg}</div>}
        </form>
      </div>

      <div className="glass table-container animate-fade-in delay-1" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>Cargando...</div>
        ) : (
          <table className="data-table" style={{ minWidth: '500px' }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Eventos Publicados</th>
                <th>Eventos Sucedidos</th>
                <th>Indicador</th>
                <th>Meta</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const ind = pct(row.data?.num, row.data?.den);
                return (
                  <tr key={row.id}>
                    <td>{row.fecha}</td>
                    <td>{fmtNum(row.data?.num)}</td>
                    <td>{fmtNum(row.data?.den)}</td>
                    <td>{cumpleBadge(fmtPct(ind), ind === null ? null : ind >= 80)}</td>
                    <td>Meta ≥ 80%</td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', marginRight: '6px' }} onClick={() => handleEdit(row)} title="Editar"><Pencil size={14} /></button>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', color: '#dc2626' }} onClick={() => handleDelete(row)} title="Eliminar"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>No hay cargas todavía.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InstitucionalesMetricsForms;

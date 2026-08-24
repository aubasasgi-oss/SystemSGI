import React, { useState, useEffect } from 'react';
import { Save, Pencil, Trash2, X, PlusCircle } from 'lucide-react';
import { listarComercialMetrics, guardarComercialMetric, eliminarComercialMetric } from '../lib/comercialMetricsApi';

const CONCESIONES = ['BALP', 'SVIA'];
const SITIOS = ['Dock Sud', 'Hudson', 'Bernal', 'Quilmes', 'Berazategui', 'Samborombón', 'Maipú', 'La Huella', 'Mar Chiquita', 'Gral. Madariaga'];

const pct = (num, den) => (den ? ((Number(num) || 0) / Number(den) * 100) : null);
const fmtPct = (v) => v === null || v === undefined || isNaN(v) ? '-' : v.toFixed(2).replace('.', ',') + '%';
const fmtNum = (v) => v === null || v === undefined || isNaN(v) ? '-' : Number(v).toFixed(2).replace('.', ',');

const TIPOS = {
  quejas_reclamos: {
    label: 'Quejas y Reclamos',
    campos: [
      { id: 'concesion', label: 'Concesion', type: 'select', options: CONCESIONES },
      { id: 'sitio', label: 'Sitio', type: 'select', options: SITIOS },
      { id: 'transito', label: 'Tránsito', type: 'number' },
      { id: 'quejas', label: 'Cantidad de Quejas', type: 'number' },
      { id: 'objetivo_quejas', label: 'Objetivo quejas ≤', type: 'number' },
      { id: 'reclamos', label: 'Cantidad de Reclamos', type: 'number' },
      { id: 'objetivo_reclamos', label: 'Objetivo reclamos ≤', type: 'number' },
    ],
    columnas: (d) => [
      d.concesion, d.sitio, fmtNum(d.transito), fmtNum(d.quejas),
      fmtPct(d.transito ? (Number(d.quejas || 0) / d.transito * 100000) : null).replace('%', ''),
      fmtNum(d.objetivo_quejas), fmtNum(d.reclamos),
      fmtPct(d.transito ? (Number(d.reclamos || 0) / d.transito * 100000) : null).replace('%', ''),
      fmtNum(d.objetivo_reclamos),
    ],
    headers: ['Concesion', 'Sitio', 'Tránsito', 'Quejas', 'Ind. Quejas', 'Obj. Quejas ≤', 'Reclamos', 'Ind. Reclamos', 'Obj. Reclamos ≤'],
  },
  telepase: {
    label: 'TelePASE',
    campos: [
      { id: 'concesion', label: 'Concesion', type: 'select', options: CONCESIONES },
      { id: 'transito_telepase', label: 'Cantidad de Tránsito con TelePASE', type: 'number' },
      { id: 'transito_total', label: 'Tránsito Total Pagante', type: 'number' },
      { id: 'objetivo_telepase', label: 'Objetivo TelePASE ≥', type: 'number' },
    ],
    columnas: (d) => [
      d.concesion, fmtNum(d.transito_telepase), fmtNum(d.transito_total),
      fmtPct(pct(d.transito_telepase, d.transito_total)),
      fmtNum(d.objetivo_telepase),
    ],
    headers: ['Concesion', 'Tránsito TelePASE', 'Tránsito Total', 'Indicador TelePASE', 'Objetivo TelePASE ≥'],
  },
  atencion: {
    label: 'Atención Telefónica y Correos',
    campos: [
      { id: 'llamadas_atendidas', label: 'Cantidad de llamadas atendidas', type: 'number' },
      { id: 'llamadas_totales', label: 'Cantidad total de llamadas', type: 'number' },
      { id: 'objetivo_llamadas', label: 'Objetivo llamadas ≥', type: 'number' },
      { id: 'correos_respondidos', label: 'Cant. de correos respondidos', type: 'number' },
      { id: 'correos_totales', label: 'Total de correos recibidos', type: 'number' },
      { id: 'objetivo_correos', label: 'Objetivo correos ≥', type: 'number' },
    ],
    columnas: (d) => [
      fmtNum(d.llamadas_atendidas), fmtNum(d.llamadas_totales),
      fmtPct(pct(d.llamadas_atendidas, d.llamadas_totales)), fmtNum(d.objetivo_llamadas),
      fmtNum(d.correos_respondidos), fmtNum(d.correos_totales),
      fmtPct(pct(d.correos_respondidos, d.correos_totales)), fmtNum(d.objetivo_correos),
    ],
    headers: ['Llamadas Atendidas', 'Llamadas Totales', 'Ind. Llamadas', 'Obj. Llamadas ≥', 'Correos Respondidos', 'Correos Totales', 'Ind. Correos', 'Obj. Correos ≥'],
  },
  tiempo_respuesta: {
    label: 'Tiempo de Respuesta QyR',
    campos: [
      { id: 'concesion', label: 'Concesion', type: 'select', options: CONCESIONES },
      { id: 'tipo_reclamo', label: 'Tipo', type: 'select', options: ['Quejas', 'Reclamos'] },
      { id: 'respuestas_ok', label: 'Cantidad de respuestas con tiempo ≤ 9 días', type: 'number' },
      { id: 'respuestas_total', label: 'Cantidad Total de respuestas', type: 'number' },
      { id: 'objetivo', label: 'Objetivo ≥', type: 'number' },
    ],
    columnas: (d) => [
      d.concesion, d.tipo_reclamo, fmtNum(d.respuestas_ok), fmtNum(d.respuestas_total),
      fmtPct(pct(d.respuestas_ok, d.respuestas_total)), fmtNum(d.objetivo),
    ],
    headers: ['Concesion', 'Tipo', 'Respuestas ≤ 9 días', 'Respuestas Totales', 'Indicador', 'Objetivo ≥'],
  },
};

const emptyForm = (tipoKey) => {
  const base = { fecha: '' };
  TIPOS[tipoKey].campos.forEach(c => { base[c.id] = ''; });
  return base;
};

const ComercialMetricsForms = () => {
  const [tipoActivo, setTipoActivo] = useState('quejas_reclamos');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm('quejas_reclamos'));
  const [saveMsg, setSaveMsg] = useState('');

  const cargarFilas = (tipoKey) => {
    setLoading(true);
    listarComercialMetrics(tipoKey)
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
    eliminarComercialMetric(row.id)
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

    guardarComercialMetric(tipoActivo, editingId, fecha, data)
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
          <h2>Carga de Métricas - Gerencia Comercial</h2>
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
              <div key={campo.id} className="form-group" style={{ marginBottom: 0, minWidth: '180px', flex: campo.type === 'select' ? '0 1 200px' : '1 1 180px' }}>
                <label className="form-label">{campo.label}</label>
                {campo.type === 'select' ? (
                  <select
                    className="form-control"
                    value={form[campo.id] || ''}
                    onChange={e => handleChange(campo.id, e.target.value)}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {campo.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Valor..."
                    value={form[campo.id] !== undefined ? form[campo.id] : ''}
                    onChange={e => handleChange(campo.id, e.target.value)}
                    required
                  />
                )}
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
                {config.headers.map(h => <th key={h}>{h}</th>)}
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

export default ComercialMetricsForms;
export { TIPOS as TIPOS_COMERCIAL, pct as calcularIndicador };

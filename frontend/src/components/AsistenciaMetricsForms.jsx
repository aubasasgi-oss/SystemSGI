import React, { useState, useEffect } from 'react';
import { Save, Pencil, Trash2, X, PlusCircle } from 'lucide-react';
import { listarAsistenciaMetrics, guardarAsistenciaMetric, eliminarAsistenciaMetric } from '../lib/asistenciaMetricsApi';

const SITIOS = ['Dock Sud', 'Hudson', 'Bernal', 'Quilmes', 'Berazategui', 'Samborombón', 'Maipú', 'La Huella', 'Mar Chiquita', 'Gral. Madariaga'];
const MOVILES = ['Móvil 1', 'Móvil 2', 'Móvil 3', 'Móvil 4', 'Móvil 5'];

const pct = (num, den) => (den ? ((Number(num) || 0) / Number(den) * 100) : null);
const fmtPct = (v) => v === null || v === undefined || isNaN(v) ? '-' : v.toFixed(2).replace('.', ',') + '%';
const fmtNum = (v) => v === null || v === undefined || v === '' || isNaN(v) ? '-' : Number(v).toFixed(2).replace('.', ',');

const TIPOS = {
  gestion_av1: {
    label: 'Gestión AV1',
    campos: [
      { id: 'eventos_15min_ok', label: 'Cant. eventos ≤ 15 min (Toda la Autopista)', type: 'number' },
      { id: 'eventos_15min_total', label: 'Cant. eventos ante contingencia', type: 'number' },
      { id: 'objetivo_15min', label: 'Objetivo ≥', type: 'number' },
      { id: 'eventos_23min_ok', label: 'Cant. eventos ≤ 23 min (Troncal PR 42+000-52+000 Desc.)', type: 'number' },
      { id: 'eventos_23min_total', label: 'Cant. eventos ante contingencia (troncal)', type: 'number' },
      { id: 'objetivo_23min', label: 'Objetivo1 ≥', type: 'number' },
      { id: 'aux_mec_ok', label: 'Cant. Resp. Auxilio Mecánico ≤ 55 min', type: 'number' },
      { id: 'aux_mec_total', label: 'Cant. de Respuesta Auxilio Mecánico', type: 'number' },
      { id: 'objetivo_aux_mec', label: 'Objetivo2 ≥', type: 'number' },
      { id: 'sanit_ok', label: 'Cant. Resp. Sanitaria (≤15 min _ Tolerancia +25 min)', type: 'number' },
      { id: 'sanit_total', label: 'Cant. de Respuesta Sanitaria ante Contingencia', type: 'number' },
      { id: 'objetivo_sanit', label: 'Objetivo sanitario =', type: 'number' },
    ],
    columnas: (d) => [
      fmtNum(d.eventos_15min_ok), fmtNum(d.eventos_15min_total), fmtPct(pct(d.eventos_15min_ok, d.eventos_15min_total)), fmtNum(d.objetivo_15min),
      fmtNum(d.eventos_23min_ok), fmtNum(d.eventos_23min_total), fmtPct(pct(d.eventos_23min_ok, d.eventos_23min_total)), fmtNum(d.objetivo_23min),
      fmtNum(d.aux_mec_ok), fmtNum(d.aux_mec_total), fmtPct(pct(d.aux_mec_ok, d.aux_mec_total)), fmtNum(d.objetivo_aux_mec),
      fmtNum(d.sanit_ok), fmtNum(d.sanit_total), fmtPct(pct(d.sanit_ok, d.sanit_total)), fmtNum(d.objetivo_sanit),
    ],
    headers: [
      'Eventos ≤15min OK', 'Eventos ≤15min Total', 'Ind. ≤15min', 'Obj. ≥',
      'Eventos ≤23min OK (Troncal)', 'Eventos ≤23min Total', 'Ind. ≤23min', 'Obj.1 ≥',
      'Aux. Mecánico OK', 'Aux. Mecánico Total', 'Ind. Aux. Mecánico', 'Obj.2 ≥',
      'Sanitaria OK', 'Sanitaria Total', 'Ind. Sanitaria', 'Obj. Sanitario =',
    ],
  },
  factor_desempeno: {
    label: 'Factor de Desempeño',
    campos: [
      { id: 'movil', label: 'Móvil', type: 'select', options: MOVILES },
      { id: 'accidentes_movil', label: 'Accidentes por móvil', type: 'number' },
      { id: 'km_recorridos', label: 'Km recorridos por móvil', type: 'number' },
      { id: 'objetivo_factor', label: 'Objetivo Factor de Desempeño (ej: ≤ 1)', type: 'text' },
      { id: 'cant_accidentes', label: 'Cantidad de accidentes', type: 'number' },
      { id: 'cant_asistencias', label: 'Cantidad de asistencias', type: 'number' },
      { id: 'objetivo_exposicion', label: 'Objetivo Exposición accidentes viales (ej: < 1%)', type: 'text' },
    ],
    columnas: (d) => [
      d.movil,
      fmtNum(d.accidentes_movil), fmtNum(d.km_recorridos),
      d.km_recorridos ? fmtNum((Number(d.accidentes_movil) || 0) / Number(d.km_recorridos)) : '-',
      d.objetivo_factor || '-',
      fmtNum(d.cant_accidentes), fmtNum(d.cant_asistencias),
      fmtPct(pct(d.cant_accidentes, d.cant_asistencias)),
      d.objetivo_exposicion || '-',
    ],
    headers: [
      'Móvil', 'Accidentes', 'Km Recorridos', 'Ind. Factor Desempeño', 'Obj. Factor Desempeño',
      'Cant. Accidentes', 'Cant. Asistencias', 'Ind. Exposición', 'Obj. Exposición',
    ],
  },
  serv_1er_aux: {
    label: 'Servicio 1° Auxilio',
    campos: [
      { id: 'base', label: 'Base', type: 'select', options: SITIOS },
      { id: 'indicador_equipamiento', label: 'Indicador Equipamiento y Condiciones Grales. Ambulancia', type: 'number' },
      { id: 'objetivo_equipamiento', label: 'Objetivo Equipamiento y Condiciones Grales. ≤', type: 'number' },
    ],
    columnas: (d) => [d.base, fmtNum(d.indicador_equipamiento), fmtNum(d.objetivo_equipamiento)],
    headers: ['Base', 'Indicador Equipamiento', 'Obj. Equipamiento ≤'],
  },
  serv_aux_mecanico: {
    label: 'Servicio Auxilio Mecánico',
    campos: [
      { id: 'conformidades', label: 'Cantidad de Conformidades', type: 'number' },
      { id: 'disconformidades', label: 'Cantidad de Disconformidades', type: 'number' },
      { id: 'objetivo_conformidad', label: 'Objetivo Conformidad AM ≥', type: 'number' },
    ],
    columnas: (d) => {
      const total = (Number(d.conformidades) || 0) + (Number(d.disconformidades) || 0);
      return [
        fmtNum(d.conformidades), fmtNum(d.disconformidades),
        total > 0 ? fmtPct((Number(d.conformidades) / total) * 100) : '-',
        fmtNum(d.objetivo_conformidad),
      ];
    },
    headers: ['Conformidades', 'Disconformidades', 'Ind. Conformidad AM', 'Obj. Conformidad AM ≥'],
  },
};

const emptyForm = (tipoKey) => {
  const base = { fecha: '' };
  TIPOS[tipoKey].campos.forEach(c => { base[c.id] = ''; });
  return base;
};

const AsistenciaMetricsForms = () => {
  const [tipoActivo, setTipoActivo] = useState('gestion_av1');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm('gestion_av1'));
  const [saveMsg, setSaveMsg] = useState('');

  const cargarFilas = (tipoKey) => {
    setLoading(true);
    listarAsistenciaMetrics(tipoKey)
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
    eliminarAsistenciaMetric(row.id)
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

    guardarAsistenciaMetric(tipoActivo, editingId, fecha, data)
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
          <h2>Carga de Métricas - Asistencia Vial</h2>
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
                    type={campo.type === 'text' ? 'text' : 'number'}
                    step={campo.type === 'text' ? undefined : 'any'}
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

export default AsistenciaMetricsForms;

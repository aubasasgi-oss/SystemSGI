import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { Target, Search, Edit2, Lock, Plus, History, CheckCircle, Clock } from 'lucide-react';
import { listarIndicadores, actualizarMetaIndicador, listarHistorialIndicadores, agregarHistorialIndicador, insertarIndicador } from '../lib/indicadoresApi';

const NUEVO_INDICADOR_VACIO = {
  anio: new Date().getFullYear(), documento: 'BALP', obj_num: '', norma: 'ISO 9001',
  proceso: '', indicador: '', meta: '', tipo: 'Maximizar', frecuencia: 'Mensual',
  algoritmo: '', responsable: '', estrategia: '', vigencia: ''
};

const Indicators = () => {
  const { checkPermission, userRole, userSector } = useAuth();

  // App state
  const [indicators, setIndicators] = useState([]);
  const [loadingIndicators, setLoadingIndicators] = useState(true);
  const [historyLog, setHistoryLog] = useState([]);

  const cargarIndicadores = () => {
    setLoadingIndicators(true);
    listarIndicadores()
      .then(setIndicators)
      .catch(err => { console.error(err); setIndicators([]); })
      .finally(() => setLoadingIndicators(false));
  };

  const cargarHistorial = () => {
    listarHistorialIndicadores()
      .then(setHistoryLog)
      .catch(err => { console.error(err); setHistoryLog([]); });
  };

  useEffect(() => {
    cargarIndicadores();
    cargarHistorial();
  }, []);

  // Modals state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [newIndicatorModalOpen, setNewIndicatorModalOpen] = useState(false);
  const [newIndicatorForm, setNewIndicatorForm] = useState(NUEVO_INDICADOR_VACIO);
  const [savingNewIndicator, setSavingNewIndicator] = useState(false);
  const [activeInd, setActiveInd] = useState(null);
  const [newMeta, setNewMeta] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnio, setFilterAnio] = useState('');
  const [filterDoc, setFilterDoc] = useState('');
  const [filterNorma, setFilterNorma] = useState('');
  const [filterProceso, setFilterProceso] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // Pendiente vs Revisado

  const procesos = useMemo(() => [...new Set(indicators.map(i => i.proceso))].sort(), [indicators]);
  const sectores = useMemo(() => [...new Set(indicators.map(i => i.responsable))].sort(), [indicators]);

  const reviewedIds = useMemo(() => [...new Set(historyLog.map(h => h.indicador_id))], [historyLog]);

  const filteredIndicators = indicators.filter(ind => {
    if (filterAnio && ind.anio.toString() !== filterAnio) return false;
    if (filterDoc && ind.documento !== filterDoc) return false;
    if (filterNorma && !ind.norma.includes(filterNorma)) return false;
    if (filterProceso && ind.proceso !== filterProceso) return false;
    if (filterSector && ind.responsable !== filterSector) return false;
    if (filterTipo && ind.tipo !== filterTipo) return false;
    
    if (filterStatus === 'Revisado' && !reviewedIds.includes(ind.id)) return false;
    if (filterStatus === 'Pendiente' && reviewedIds.includes(ind.id)) return false;
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (
        !ind.indicador.toLowerCase().includes(q) &&
        !ind.responsable.toLowerCase().includes(q) &&
        !ind.proceso.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const openReview = (ind) => {
    setActiveInd(ind);
    setNewMeta(ind.meta);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const [savingReview, setSavingReview] = useState(false);

  const saveReview = () => {
    if (!activeInd) return;
    setSavingReview(true);

    const usuario = userRole === 'SGI' ? 'SGI Admin' : userSector;
    const texto = `Meta revisada. Valor: ${newMeta}. ${reviewComment ? 'Nota: ' + reviewComment : ''}`;

    actualizarMetaIndicador(activeInd.id, newMeta)
      .then(() => agregarHistorialIndicador(activeInd.id, usuario, texto))
      .then(() => {
        cargarIndicadores();
        cargarHistorial();
        setReviewModalOpen(false);
      })
      .catch(err => alert('Error al guardar la revisión: ' + err.message))
      .finally(() => setSavingReview(false));
  };

  const openNewIndicator = () => {
    setNewIndicatorForm(NUEVO_INDICADOR_VACIO);
    setNewIndicatorModalOpen(true);
  };

  const saveNewIndicator = () => {
    if (!newIndicatorForm.proceso || !newIndicatorForm.indicador || !newIndicatorForm.responsable) {
      alert('Completá al menos Proceso, Indicador y Responsable.');
      return;
    }
    setSavingNewIndicator(true);
    insertarIndicador({ ...newIndicatorForm, anio: Number(newIndicatorForm.anio), obj_num: newIndicatorForm.obj_num ? Number(newIndicatorForm.obj_num) : null })
      .then(() => {
        cargarIndicadores();
        setNewIndicatorModalOpen(false);
      })
      .catch(err => alert('Error al crear el indicador: ' + err.message))
      .finally(() => setSavingNewIndicator(false));
  };

  return (
    <div>
      <div className="module-header animate-fade-in">
        <div>
          <h1 className="page-title">Objetivos y Metas (KPIs)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Revisión anual obligatoria. Solo puedes modificar los indicadores asignados a tu sector: <strong>{userRole === 'SGI' ? 'SGI (Control Total)' : userSector}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setHistoryModalOpen(true)} style={{ height: 'fit-content' }}>
            <History size={16} /> Historial Global
          </button>
          {checkPermission('SGI') && (
            <button className="btn btn-primary" style={{ height: 'fit-content' }} onClick={openNewIndicator}>
              <Plus size={16} /> Nuevo Indicador
            </button>
          )}
        </div>
      </div>

      <div className="glass table-container animate-fade-in delay-1" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar indicador o responsable..." 
              style={{ paddingLeft: '40px', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select className="form-control" value={filterAnio} onChange={e => setFilterAnio(e.target.value)} style={{ flex: '1 1 100px' }}>
            <option value="">Año (Todos)</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>

          <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: '1 1 120px' }}>
            <option value="">Estado (Todos)</option>
            <option value="Pendiente">Pendientes de Revisión</option>
            <option value="Revisado">Revisados</option>
          </select>

          <select className="form-control" value={filterDoc} onChange={e => setFilterDoc(e.target.value)} style={{ flex: '1 1 120px' }}>
            <option value="">Doc (Todos)</option>
            <option value="BALP">BALP</option>
            <option value="SVIA">SVIA</option>
          </select>

          <select className="form-control" value={filterNorma} onChange={e => setFilterNorma(e.target.value)} style={{ flex: '1 1 120px' }}>
            <option value="">Norma (Todas)</option>
            <option value="ISO 9001">ISO 9001</option>
            <option value="ISO 39001">ISO 39001</option>
          </select>

          <select className="form-control" value={filterProceso} onChange={e => setFilterProceso(e.target.value)} style={{ flex: '1 1 180px' }}>
            <option value="">Proceso (Todos)</option>
            {procesos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select className="form-control" value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{ flex: '1 1 180px' }}>
            <option value="">Sector (Todos)</option>
            {sectores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ padding: '8px 24px', fontSize: '13px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
          Mostrando <strong>{filteredIndicators.length}</strong> indicadores
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Año/Doc</th>
                <th>Estado</th>
                <th>Norma</th>
                <th>Proceso</th>
                <th>Indicador</th>
                <th>Meta</th>
                <th>Responsable</th>
                <th style={{ textAlign: 'center' }}>Revisión Anual</th>
              </tr>
            </thead>
            <tbody>
              {loadingIndicators && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>Cargando indicadores...</td></tr>
              )}
              {!loadingIndicators && filteredIndicators.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No se encontraron indicadores para los filtros seleccionados.</td></tr>
              )}
              {filteredIndicators.map(ind => {
                const canEdit = checkPermission(ind.responsable);
                const isReviewed = reviewedIds.includes(ind.id);
                
                return (
                  <tr key={ind.id} className="hover-row">
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {ind.anio} {ind.documento}
                    </td>
                    <td>
                      {isReviewed ? 
                        <span className="badge" style={{ background: 'var(--success-color)', color: 'white', fontSize: '10px' }}><CheckCircle size={10} style={{ marginRight: '4px' }}/>Revisado</span> : 
                        <span className="badge" style={{ background: '#f59e0b', color: 'white', fontSize: '10px' }}><Clock size={10} style={{ marginRight: '4px' }}/>Pendiente</span>
                      }
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`badge ${ind.norma.includes('39001') ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '11px' }}>
                        {ind.norma}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px' }}>{ind.proceso}</td>
                    <td style={{ fontWeight: '500', color: 'var(--text-primary)', maxWidth: '250px' }}>{ind.indicador}</td>
                    <td style={{ color: 'var(--success-color)', fontWeight: '600', whiteSpace: 'nowrap' }}>{ind.meta}</td>
                    <td style={{ fontSize: '13px' }}>{ind.responsable}</td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {canEdit ? (
                        <button className="btn" onClick={() => openReview(ind)} style={{ padding: '6px 12px', background: isReviewed ? 'var(--bg-color)' : 'var(--accent-color)', color: isReviewed ? 'var(--text-secondary)' : 'white', border: isReviewed ? '1px solid var(--border-color)' : 'none' }} title="Revisar Meta">
                          <Edit2 size={14} style={{ marginRight: '6px' }} /> {isReviewed ? 'Ajustar' : 'Revisar'}
                        </button>
                      ) : (
                        <button className="btn" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'not-allowed' }} title="Solo Lectura (Bloqueado por Rol)" disabled>
                          <Lock size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && activeInd && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass animate-fade-in" style={{ width: '500px', padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '16px' }}>Revisión Anual de Meta</h3>
            
            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
              <strong>Indicador:</strong> {activeInd.indicador}<br/>
              <strong>Proceso:</strong> {activeInd.proceso}<br/>
              <strong>Responsable:</strong> {activeInd.responsable}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Meta Actual (Aprobar o Modificar):</label>
              <input type="text" className="form-control" value={newMeta} onChange={e => setNewMeta(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Comentario de Revisión:</label>
              <textarea className="form-control" rows="3" value={reviewComment} onChange={e => setReviewComment(e.target.value)} style={{ width: '100%' }} placeholder="Ej: Meta validada para el próximo ciclo..."></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setReviewModalOpen(false)} disabled={savingReview}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveReview} disabled={savingReview}>{savingReview ? 'Guardando...' : 'Guardar Revisión'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* History Modal */}
      {historyModalOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass animate-fade-in" style={{ width: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '16px' }}>Historial de Revisiones (Auditoría)</h3>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {historyLog.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No hay cambios registrados.</p>
              ) : (
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>Fecha</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>Usuario</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>Indicador Modificado</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLog.map(log => {
                      const indRef = indicators.find(i => i.id === log.indicador_id);
                      return (
                        <tr key={log.id}>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{log.fecha}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{log.usuario}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{indRef?.indicador || `ID: ${log.indicador_id}`}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{log.texto}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setHistoryModalOpen(false)}>Cerrar Historial</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* New Indicator Modal */}
      {newIndicatorModalOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: '40px 0' }}>
          <div className="glass animate-fade-in" style={{ width: '600px', maxWidth: '90vw', padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '16px' }}>Nuevo Indicador</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Año</label>
                <input type="number" className="form-control" value={newIndicatorForm.anio} onChange={e => setNewIndicatorForm({ ...newIndicatorForm, anio: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Documento (Concesión)</label>
                <select className="form-control" value={newIndicatorForm.documento} onChange={e => setNewIndicatorForm({ ...newIndicatorForm, documento: e.target.value })}>
                  <option value="BALP">BALP</option>
                  <option value="SVIA">SVIA</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>N° de Objetivo</label>
                <input type="number" className="form-control" value={newIndicatorForm.obj_num} onChange={e => setNewIndicatorForm({ ...newIndicatorForm, obj_num: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Norma</label>
                <select className="form-control" value={newIndicatorForm.norma} onChange={e => setNewIndicatorForm({ ...newIndicatorForm, norma: e.target.value })}>
                  <option value="ISO 9001">ISO 9001</option>
                  <option value="ISO 39001">ISO 39001</option>
                  <option value="ISO 9001 / ISO 39001">ISO 9001 / ISO 39001</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Proceso</label>
                <input type="text" className="form-control" value={newIndicatorForm.proceso} onChange={e => setNewIndicatorForm({ ...newIndicatorForm, proceso: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Indicador</label>
                <input type="text" className="form-control" value={newIndicatorForm.indicador} onChange={e => setNewIndicatorForm({ ...newIndicatorForm, indicador: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Meta</label>
                <input type="text" className="form-control" placeholder="Ej: ≥ 80%" value={newIndicatorForm.meta} onChange={e => setNewIndicatorForm({ ...newIndicatorForm, meta: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tipo</label>
                <select className="form-control" value={newIndicatorForm.tipo} onChange={e => setNewIndicatorForm({ ...newIndicatorForm, tipo: e.target.value })}>
                  <option value="Maximizar">Maximizar</option>
                  <option value="Minimizar">Minimizar</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Frecuencia</label>
                <input type="text" className="form-control" placeholder="Mensual, Trimestral..." value={newIndicatorForm.frecuencia} onChange={e => setNewIndicatorForm({ ...newIndicatorForm, frecuencia: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Responsable (sector)</label>
                <input type="text" className="form-control" value={newIndicatorForm.responsable} onChange={e => setNewIndicatorForm({ ...newIndicatorForm, responsable: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Algoritmo de cálculo</label>
                <input type="text" className="form-control" value={newIndicatorForm.algoritmo} onChange={e => setNewIndicatorForm({ ...newIndicatorForm, algoritmo: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Estrategia</label>
                <textarea className="form-control" rows="2" value={newIndicatorForm.estrategia} onChange={e => setNewIndicatorForm({ ...newIndicatorForm, estrategia: e.target.value })}></textarea>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Vigencia</label>
                <input type="text" className="form-control" placeholder="Ej: Ene.2026–Dic.2026" value={newIndicatorForm.vigencia} onChange={e => setNewIndicatorForm({ ...newIndicatorForm, vigencia: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setNewIndicatorModalOpen(false)} disabled={savingNewIndicator}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveNewIndicator} disabled={savingNewIndicator}>{savingNewIndicator ? 'Guardando...' : 'Crear Indicador'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Indicators;

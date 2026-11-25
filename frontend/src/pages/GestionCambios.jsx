import React, { useState, useEffect } from 'react';
import { 
  GitBranch, Plus, Search, Eye, Edit2, Trash2, Printer, 
  ArrowLeft, CheckCircle2, AlertCircle, Clock, ShieldCheck, 
  Building2, FileText, Check, X, Save
} from 'lucide-react';
import { listarCambios, guardarCambio, eliminarCambio, CAMBIO_SEEDED_WHATSAPP } from '../lib/cambiosApi';
import { useAuth } from '../contexts/AuthContext';

export default function GestionCambios() {
  const { userRole } = useAuth();
  const isSGI = userRole === 'SGI';

  const [cambios, setCambios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  // Modos: 'list', 'form', 'view'
  const [viewMode, setViewMode] = useState('list');
  const [selectedCambio, setSelectedCambio] = useState(null);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarLista();
  }, []);

  const cargarLista = async () => {
    setLoading(true);
    try {
      const items = await listarCambios();
      setCambios(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevo = () => {
    const nuevo = {
      id: `CAMBIO_${Date.now()}`,
      codigoDoc: 'PAU/04-A4',
      revision: '2',
      fechaEmisionDoc: '20.Feb.2026',
      fechaEvaluacion: new Date().toISOString().split('T')[0],
      areaProceso: '',
      responsableProceso: '',
      descripcionCambio: '',
      origen: {
        cambioResponsabilidades: false,
        auditorias: false,
        evaluacionDesempeno: false,
        incorporacionTics: false,
        cambioNecesidadesUsuario: false,
        analisisNoConformidades: false,
        cambiosContexto: false,
        servicioNoConforme: false,
      },
      proposito: '',
      objetivos: {
        mejoraServicio: false,
        mejoraEficacia: false,
        mejoraEficiencia: false,
        reasignacionResp: false,
        mejoraGeneralProceso: false,
      },
      accionPropuesta: '',
      cumplimientoLegal: {
        cumplimientoGeneral: 'Cumple',
        contratoConcesion: true,
        reglamentoExplotacion: true,
        reglamentoUsuario: true,
        matrizLegal: true,
      },
      recursos: {
        nuevasCompetencias: '',
        incorporacionPersonal: '',
        reasignacionResponsabilidades: '',
        informatico: '',
        vehiculos: 'No',
        comunicaciones: '',
        mobiliario: '',
        modificacionInfraestructura: '',
      },
      impactoSGI: {
        analisisRiesgosOportunidades: 'SÍ',
        impactaClientesProveedores: 'SÍ',
        documentosModificar: 'NO',
        documentosModificarDetalle: '',
        comunicacionInterna: '',
        comunicacionExterna: '',
      },
      aprobacion: {
        estado: 'En Evaluación',
        comunicoAprobacion: 'SÍ',
        criteriosNoAprobado: '',
        firmaSGI: 'SGI AUBASA',
        firmaResponsable: '',
      },
    };
    setFormData(nuevo);
    setViewMode('form');
  };

  const handleEditar = (item) => {
    setFormData(JSON.parse(JSON.stringify(item)));
    setViewMode('form');
  };

  const handleVerOficial = (item) => {
    setSelectedCambio(item);
    setViewMode('view');
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este registro de Gestión del Cambio?')) return;
    await eliminarCambio(id);
    await cargarLista();
    if (selectedCambio?.id === id) {
      setViewMode('list');
      setSelectedCambio(null);
    }
  };

  const handleGuardarForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await guardarCambio(formData);
      await cargarLista();
      setViewMode('list');
      setFormData(null);
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredCambios = cambios.filter(c => {
    const desc = (c.descripcionCambio || '').toLowerCase();
    const area = (c.areaProceso || '').toLowerCase();
    const resp = (c.responsableProceso || '').toLowerCase();
    const st = (c.aprobacion?.estado || '').toLowerCase();
    const q = searchTerm.toLowerCase();

    const matchesSearch = desc.includes(q) || area.includes(q) || resp.includes(q);
    const matchesStatus = statusFilter === 'Todos' || c.aprobacion?.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Estadísticas KPI
  const total = cambios.length;
  const aprobados = cambios.filter(c => c.aprobacion?.estado === 'Aprobado').length;
  const enEvaluacion = cambios.filter(c => c.aprobacion?.estado === 'En Evaluación').length;
  const tics = cambios.filter(c => c.origen?.incorporacionTics).length;

  return (
    <div className="module-container">
      {/* Estilos para impresión del documento oficial */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .pau04-print-document, .pau04-print-document * {
            visibility: visible !important;
          }
          .pau04-print-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>

      {/* HEADER DE MÓDULO */}
      <div className="module-header animate-fade-in no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', background: '#e0f2fe', color: '#0369a1', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
              PAU/04-A4
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ISO 9001 / ISO 39001 — Requisito 6.3 y 8.1</span>
          </div>
          <h2 style={{ margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitBranch size={26} color="var(--accent-color)" />
            Gestión del Cambio — Formulario de Evaluación
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
            Planificación, evaluación de impacto, cumplimiento legal y aprobación de cambios en los procesos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {viewMode !== 'list' && (
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setViewMode('list')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Volver al listado
            </button>
          )}

          {viewMode === 'list' && isSGI && (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleNuevo}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
            >
              <Plus size={18} /> Nuevo Registro PAU/04-A4
            </button>
          )}
        </div>
      </div>

      {/* VISTA 1: LISTADO Y KPIs */}
      {viewMode === 'list' && (
        <div className="animate-fade-in">
          {/* Tarjetas KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-panel" style={{ padding: '18px 24px', borderRadius: '12px', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total de Cambios Registrados</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>{total}</div>
              <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>Procedimiento PAU/04</div>
            </div>

            <div className="glass-panel" style={{ padding: '18px 24px', borderRadius: '12px', borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Cambios Aprobados</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>{aprobados}</div>
              <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>Implementación autorizada</div>
            </div>

            <div className="glass-panel" style={{ padding: '18px 24px', borderRadius: '12px', borderLeft: '4px solid #eab308' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>En Evaluación / Análisis</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#ca8a04', marginTop: '4px' }}>{enEvaluacion}</div>
              <div style={{ fontSize: '11px', color: '#ca8a04', marginTop: '2px' }}>Pendientes de dictamen</div>
            </div>

            <div className="glass-panel" style={{ padding: '18px 24px', borderRadius: '12px', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Incorporación de TICs / IA</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#8b5cf6', marginTop: '4px' }}>{tics}</div>
              <div style={{ fontSize: '11px', color: '#8b5cf6', marginTop: '2px' }}>Innovación tecnológica</div>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Buscar por descripción, proceso o responsable..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '38px', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Estado:</span>
              {['Todos', 'Aprobado', 'En Evaluación', 'No Aprobado'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: statusFilter === st ? '#0284c7' : '#f1f5f9',
                    color: statusFilter === st ? 'white' : '#475569'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla / Tarjetas de Cambios */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando registros...</div>
          ) : filteredCambios.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', borderRadius: '12px' }}>
              <GitBranch size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)' }}>No se encontraron registros de Gestión del Cambio.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredCambios.map(item => {
                const isAprobado = item.aprobacion?.estado === 'Aprobado';
                return (
                  <div 
                    key={item.id} 
                    className="glass-panel slide-in" 
                    style={{ padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: '320px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: 800, fontSize: '12px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                            {item.codigoDoc || 'PAU/04-A4'} (Rev. {item.revision || '2'})
                          </span>
                          <span style={{ background: '#ecfdf5', color: '#047857', fontWeight: 700, fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>
                            📅 {item.fechaEvaluacion || item.fechaEmisionDoc}
                          </span>
                          <span style={{ background: '#f0f9ff', color: '#0369a1', fontWeight: 700, fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>
                            🏢 {item.areaProceso}
                          </span>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 800,
                            background: isAprobado ? '#dcfce7' : '#fef9c3',
                            color: isAprobado ? '#15803d' : '#a16207',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {isAprobado ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                            {item.aprobacion?.estado || 'En Evaluación'}
                          </span>
                        </div>

                        <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 800, color: '#0f172a', lineHeight: '1.4' }}>
                          {item.descripcionCambio}
                        </h3>

                        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#475569', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.proposito}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Origen:</span>
                          {item.origen?.incorporacionTics && (
                            <span style={{ fontSize: '11px', background: '#ede9fe', color: '#6d28d9', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                              💻 Incorporación TICs
                            </span>
                          )}
                          {item.origen?.cambioNecesidadesUsuario && (
                            <span style={{ fontSize: '11px', background: '#fef3c7', color: '#b45309', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                              👥 Necesidades Usuario
                            </span>
                          )}
                          {item.origen?.analisisNoConformidades && (
                            <span style={{ fontSize: '11px', background: '#fee2e2', color: '#b91c1c', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                              ⚠️ Análisis No Conformidades
                            </span>
                          )}
                          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>
                            Resp.: <strong>{item.responsableProceso}</strong>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleVerOficial(item)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, color: '#0284c7', borderColor: '#0284c7' }}
                          title="Ver Formulario Oficial AUBASA"
                        >
                          <Eye size={16} /> Ver Oficial / PDF
                        </button>
                        
                        {isSGI && (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleEditar(item)}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', fontSize: '13px' }}
                              title="Editar Formulario"
                            >
                              <Edit2 size={15} /> Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleEliminar(item.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 10px', fontSize: '13px', color: '#dc2626' }}
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: FORMULARIO OFICIAL PARA IMPRIMIR / DESCARGAR PDF */}
      {viewMode === 'view' && selectedCambio && (
        <div className="animate-fade-in">
          {/* Barra de acción para imprimir */}
          <div className="no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
              Vista previa oficial del registro: {selectedCambio.codigoDoc} Rev. {selectedCambio.revision}
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, background: '#0284c7' }}
              >
                <Printer size={18} /> Imprimir / Guardar como PDF
              </button>
              {isSGI && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleEditar(selectedCambio)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit2 size={16} /> Editar datos
                </button>
              )}
            </div>
          </div>

          {/* CONTENEDOR DOCUMENTO IMPRIMIBLE (PÁGINA 1 Y 2) */}
          <div className="pau04-print-document" style={{ maxWidth: '900px', margin: '0 auto', background: 'white', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: '8px', fontFamily: 'Arial, sans-serif', color: '#1e293b' }}>
            
            {/* ===================== HOJA 1 ===================== */}
            <div style={{ border: '2px solid #000', padding: '0', marginBottom: '40px' }}>
              
              {/* ENCABEZADO AUBASA */}
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 180px', borderBottom: '2px solid #000' }}>
                <div style={{ padding: '12px', borderRight: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: '#0ea5e9', letterSpacing: '-1px' }}>AUBASA</span>
                </div>
                <div style={{ padding: '10px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>{selectedCambio.codigoDoc}</div>
                  <div style={{ fontStyle: 'italic', fontSize: '13px', marginTop: '4px', fontWeight: 600 }}>“Gestión del cambio - Formulario de evaluación”</div>
                  <div style={{ fontWeight: 900, fontSize: '14px', marginTop: '6px', textTransform: 'uppercase' }}>GESTIÓN DEL CAMBIO - FORMULARIO DE EVALUACIÓN</div>
                </div>
                <div style={{ padding: '6px 10px', borderLeft: '2px solid #000', fontSize: '11px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
                  <div><strong>Código:</strong> {selectedCambio.codigoDoc}</div>
                  <div><strong>Revisión:</strong> {selectedCambio.revision}</div>
                  <div><strong>Fecha:</strong> {selectedCambio.fechaEmisionDoc}</div>
                  <div><strong>Página:</strong> 1 de 2</div>
                </div>
              </div>

              {/* METADATOS BÁSICOS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #000', fontSize: '12px' }}>
                <div style={{ padding: '6px 12px', borderRight: '1px solid #000' }}>
                  <strong>Fecha de Evaluación:</strong> {selectedCambio.fechaEvaluacion}
                </div>
                <div style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700, fontStyle: 'italic' }}>
                  MARCAR CON "X" LAS OPCIONES QUE APLICAN
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000', fontSize: '12px' }}>
                <div style={{ padding: '6px 12px', borderRight: '1px solid #000' }}>
                  <strong>Áreas de Proceso:</strong> {selectedCambio.areaProceso}
                </div>
                <div style={{ padding: '6px 12px' }}>
                  <strong>Responsable del Proceso:</strong> {selectedCambio.responsableProceso}
                </div>
              </div>

              {/* DESCRIPCIÓN DEL CAMBIO */}
              <div style={{ backgroundColor: '#cbd5e1', padding: '4px 10px', fontWeight: 900, fontSize: '12px', borderBottom: '1px solid #000' }}>
                DESCRIPCIÓN DEL CAMBIO
              </div>
              <div style={{ padding: '8px 12px', fontSize: '12px', borderBottom: '2px solid #000', minHeight: '36px', lineHeight: '1.4' }}>
                {selectedCambio.descripcionCambio}
              </div>

              {/* ORIGEN DEL CAMBIO */}
              <div style={{ backgroundColor: '#cbd5e1', padding: '4px 10px', fontWeight: 900, fontSize: '12px', borderBottom: '1px solid #000' }}>
                ORIGEN DEL CAMBIO
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', fontSize: '11px', borderBottom: '2px solid #000', textAlign: 'center' }}>
                {[
                  { label: 'Cambio responsabilidades', val: selectedCambio.origen?.cambioResponsabilidades },
                  { label: 'Auditorías', val: selectedCambio.origen?.auditorias },
                  { label: 'Evaluación de Desempeño', val: selectedCambio.origen?.evaluacionDesempeno },
                  { label: 'Incorporación TICs', val: selectedCambio.origen?.incorporacionTics },
                  { label: 'Cambio necesidades Usuario', val: selectedCambio.origen?.cambioNecesidadesUsuario },
                  { label: 'Análisis No Conformidades', val: selectedCambio.origen?.analisisNoConformidades },
                  { label: 'Cambios en el Contexto', val: selectedCambio.origen?.cambiosContexto },
                  { label: 'Servicio No Conforme', val: selectedCambio.origen?.servicioNoConforme },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', borderBottom: idx < 4 ? '1px solid #000' : 'none', borderRight: (idx % 4 !== 3) ? '1px solid #000' : 'none' }}>
                    <div style={{ flex: 1, padding: '6px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.label}
                    </div>
                    <div style={{ width: '32px', borderLeft: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px' }}>
                      {item.val ? 'X' : ''}
                    </div>
                  </div>
                ))}
              </div>

              {/* PROPÓSITO DEL CAMBIO */}
              <div style={{ backgroundColor: '#cbd5e1', padding: '4px 10px', fontWeight: 900, fontSize: '12px', borderBottom: '1px solid #000' }}>
                PROPÓSITO DEL CAMBIO (¿Por qué se va a realizar el cambio?)
              </div>
              <div style={{ padding: '10px 12px', fontSize: '11.5px', borderBottom: '2px solid #000', whiteSpace: 'pre-line', lineHeight: '1.45', textAlign: 'justify' }}>
                {selectedCambio.proposito}
              </div>

              {/* OBJETIVOS */}
              <div style={{ backgroundColor: '#cbd5e1', padding: '4px 10px', fontWeight: 900, fontSize: '12px', borderBottom: '1px solid #000' }}>
                OBJETIVOS (¿Qué se pretende con el cambio?)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', fontSize: '11px', borderBottom: '2px solid #000' }}>
                {[
                  { label: 'Mejora del servicio', val: selectedCambio.objetivos?.mejoraServicio },
                  { label: 'Mejora eficacia', val: selectedCambio.objetivos?.mejoraEficacia },
                  { label: 'Mejora de la eficiencia', val: selectedCambio.objetivos?.mejoraEficiencia },
                  { label: 'Reasignación Resp.', val: selectedCambio.objetivos?.reasignacionResp },
                  { label: 'Mejora general proceso', val: selectedCambio.objetivos?.mejoraGeneralProceso },
                  { label: '', val: false },
                  { label: '', val: false },
                  { label: '', val: false },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', borderBottom: idx < 4 ? '1px solid #000' : 'none', borderRight: (idx % 4 !== 3) ? '1px solid #000' : 'none' }}>
                    <div style={{ flex: 1, padding: '5px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '26px' }}>
                      {item.label}
                    </div>
                    <div style={{ width: '32px', borderLeft: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px' }}>
                      {item.val ? 'X' : ''}
                    </div>
                  </div>
                ))}
              </div>

              {/* DESCRIPCIÓN DE LA ACCIÓN PROPUESTA */}
              <div style={{ backgroundColor: '#cbd5e1', padding: '4px 10px', fontWeight: 900, fontSize: '12px', borderBottom: '1px solid #000' }}>
                DESCRIPCIÓN DE LA ACCIÓN PROPUESTA PARA IMPLEMENTAR
              </div>
              <div style={{ padding: '10px 12px', fontSize: '11.5px', whiteSpace: 'pre-line', lineHeight: '1.45', textAlign: 'justify' }}>
                {selectedCambio.accionPropuesta}
              </div>

            </div>

            {/* SALTO DE PÁGINA PARA IMPRESIÓN */}
            <div className="page-break" style={{ height: '30px' }}></div>

            {/* ===================== HOJA 2 ===================== */}
            <div style={{ border: '2px solid #000', padding: '0' }}>

              {/* ENCABEZADO HOJA 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000', fontSize: '12px', backgroundColor: '#cbd5e1', fontWeight: 900, padding: '5px 12px' }}>
                <div>Cumplimiento de los requisitos EXTERNOS y LEGALES</div>
                <div style={{ textAlign: 'right' }}>
                  Cumplimiento General: <u>{selectedCambio.cumplimientoLegal?.cumplimientoGeneral || 'Cumple'}</u> / <span style={{ textDecoration: 'line-through' }}>No Cumple</span>
                </div>
              </div>

              {/* REQUISITOS EXTERNOS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000', fontSize: '11.5px' }}>
                <div style={{ borderRight: '1px solid #000' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                    <div style={{ flex: 1, padding: '6px 12px' }}>Contrato de Concesión</div>
                    <div style={{ width: '40px', borderLeft: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                      {selectedCambio.cumplimientoLegal?.contratoConcesion ? 'X' : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flex: 1, padding: '6px 12px' }}>Reglamento del Usuario</div>
                    <div style={{ width: '40px', borderLeft: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                      {selectedCambio.cumplimientoLegal?.reglamentoUsuario ? 'X' : ''}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                    <div style={{ flex: 1, padding: '6px 12px' }}>Reglamento de Explotación</div>
                    <div style={{ width: '40px', borderLeft: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                      {selectedCambio.cumplimientoLegal?.reglamentoExplotacion ? 'X' : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flex: 1, padding: '6px 12px' }}>Matriz Legal</div>
                    <div style={{ width: '40px', borderLeft: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                      {selectedCambio.cumplimientoLegal?.matrizLegal ? 'X' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* RECURSOS REQUERIDOS */}
              <div style={{ backgroundColor: '#cbd5e1', padding: '5px 12px', fontWeight: 900, fontSize: '12px', borderBottom: '1px solid #000', textAlign: 'center' }}>
                Detallar los recursos requeridos (Humanos, Equipos, Infraestructura)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000', fontSize: '11px' }}>
                <div style={{ borderRight: '1px solid #000' }}>
                  <div style={{ padding: '6px 12px', borderBottom: '1px solid #000' }}>
                    <strong>Nuevas competencias:</strong><br/>
                    {selectedCambio.recursos?.nuevasCompetencias || '-'}
                  </div>
                  <div style={{ padding: '6px 12px', borderBottom: '1px solid #000' }}>
                    <strong>Incorporacion de personal:</strong><br/>
                    {selectedCambio.recursos?.incorporacionPersonal || '-'}
                  </div>
                  <div style={{ padding: '6px 12px' }}>
                    <strong>Reasignación de responsabilidades:</strong><br/>
                    {selectedCambio.recursos?.reasignacionResponsabilidades || '-'}
                  </div>
                </div>

                <div>
                  <div style={{ padding: '6px 12px', borderBottom: '1px solid #000', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                      <strong>Informático:</strong><br/>
                      {selectedCambio.recursos?.informatico || '-'}
                    </div>
                    <div>
                      <strong>Mobiliario:</strong><br/>
                      {selectedCambio.recursos?.mobiliario || '-'}
                    </div>
                  </div>
                  <div style={{ padding: '6px 12px', borderBottom: '1px solid #000', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                      <strong>Vehículos:</strong><br/>
                      {selectedCambio.recursos?.vehiculos || '-'}
                    </div>
                    <div>
                      <strong>Modificación infraestructura:</strong><br/>
                      {selectedCambio.recursos?.modificacionInfraestructura || '-'}
                    </div>
                  </div>
                  <div style={{ padding: '6px 12px' }}>
                    <strong>Comunicaciones:</strong><br/>
                    {selectedCambio.recursos?.comunicaciones || '-'}
                  </div>
                </div>
              </div>

              {/* IMPACTO SGI / PROCESOS AFECTADOS */}
              <div style={{ backgroundColor: '#cbd5e1', padding: '5px 12px', fontWeight: 900, fontSize: '12px', borderBottom: '1px solid #000', textAlign: 'center' }}>
                Impacto SGI / Procesos afectados
              </div>
              <div style={{ fontSize: '11.5px', borderBottom: '2px solid #000' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', borderBottom: '1px solid #000', padding: '4px 12px' }}>
                  <div>¿Se analizaron los Riesgos y Oportunidades?</div>
                  <div style={{ textAlign: 'center', fontWeight: 700 }}>{selectedCambio.impactoSGI?.analisisRiesgosOportunidades || 'SÍ'}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', borderBottom: '1px solid #000', padding: '4px 12px' }}>
                  <div>¿Impacta a clientes, proveedores, entes reguladores?</div>
                  <div style={{ textAlign: 'center', fontWeight: 700 }}>{selectedCambio.impactoSGI?.impactaClientesProveedores || 'SÍ'}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 180px', borderBottom: '1px solid #000', padding: '4px 12px' }}>
                  <div>¿Documentos a modificar (Procedimientos, instructivos, registros)?</div>
                  <div style={{ textAlign: 'center', fontWeight: 700 }}>{selectedCambio.impactoSGI?.documentosModificar || 'SÍ'}</div>
                  <div style={{ textAlign: 'right', fontWeight: 600 }}>{selectedCambio.impactoSGI?.documentosModificarDetalle || ''}</div>
                </div>

                <div style={{ padding: '4px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <strong>Plan de comunicación (interna):</strong> {selectedCambio.impactoSGI?.comunicacionInterna || '-'}
                  </div>
                  <div>
                    <strong>Plan de comunicación (externa):</strong> {selectedCambio.impactoSGI?.comunicacionExterna || '-'}
                  </div>
                </div>
              </div>

              {/* APROBACIÓN DEL CAMBIO */}
              <div style={{ backgroundColor: '#cbd5e1', padding: '5px 12px', fontWeight: 900, fontSize: '12px', borderBottom: '1px solid #000', textAlign: 'center' }}>
                Aprobación del cambio: <u>{selectedCambio.aprobacion?.estado?.toLowerCase() || 'aprobado'}</u> / <span style={{ textDecoration: 'line-through' }}>no aprobado</span>
              </div>

              <div style={{ padding: '6px 12px', borderBottom: '1px solid #000', fontSize: '11.5px' }}>
                ¿Se comunico la aprobación? <strong>{selectedCambio.aprobacion?.comunicoAprobacion || 'SÍ'}</strong>
              </div>

              <div style={{ padding: '6px 12px', borderBottom: '2px solid #000', fontSize: '11.5px', minHeight: '26px' }}>
                Si el cambio <strong>no fue aprobado</strong>, ¿cuales son los criterios adoptados? {selectedCambio.aprobacion?.criteriosNoAprobado || '-'}
              </div>

              {/* FIRMAS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '120px', fontSize: '12px', alignItems: 'flex-end', padding: '16px 20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #000', width: '220px', margin: '0 auto', paddingTop: '6px', fontWeight: 700 }}>
                    Firma del SGI
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {selectedCambio.aprobacion?.firmaSGI || 'SGI AUBASA'}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    {/* Firma estilizada */}
                    <div style={{ fontFamily: 'cursive', fontSize: '24px', color: '#0369a1', transform: 'rotate(-5deg)', marginBottom: '4px' }}>
                      J.P. Dinámico
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #000', width: '220px', margin: '0 auto', paddingTop: '6px', fontWeight: 700 }}>
                    Firma de responsable del proceso
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {selectedCambio.responsableProceso}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* VISTA 3: FORMULARIO DE EDICIÓN / ALTA */}
      {viewMode === 'form' && formData && (
        <form onSubmit={handleGuardarForm} className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', background: 'white', marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit2 size={20} />
              {formData.id.includes('CAMBIO_2026') ? 'Editar Evaluación PAU/04-A4' : 'Nueva Evaluación de Gestión del Cambio'}
            </h3>

            {/* SECCIÓN 1: DATOS GENERALES */}
            <h4 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', color: '#334155', marginTop: '20px' }}>1. Identificación del Cambio</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Código Doc.</label>
                <input type="text" className="form-control" value={formData.codigoDoc} onChange={e => setFormData({...formData, codigoDoc: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Revisión</label>
                <input type="text" className="form-control" value={formData.revision} onChange={e => setFormData({...formData, revision: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha Emisión Doc.</label>
                <input type="text" className="form-control" value={formData.fechaEmisionDoc} onChange={e => setFormData({...formData, fechaEmisionDoc: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de Evaluación</label>
                <input type="date" className="form-control" value={formData.fechaEvaluacion} onChange={e => setFormData({...formData, fechaEvaluacion: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Área de Proceso</label>
                <input type="text" className="form-control" value={formData.areaProceso} onChange={e => setFormData({...formData, areaProceso: e.target.value})} required placeholder="Ej: Contact Center" />
              </div>
              <div className="form-group">
                <label className="form-label">Responsable del Proceso</label>
                <input type="text" className="form-control" value={formData.responsableProceso} onChange={e => setFormData({...formData, responsableProceso: e.target.value})} required placeholder="Ej: Jefatura de Peaje Dinámico (JPD)" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Descripción del Cambio</label>
              <textarea 
                className="form-control" 
                rows="2" 
                value={formData.descripcionCambio} 
                onChange={e => setFormData({...formData, descripcionCambio: e.target.value})}
                required
                placeholder="Breve título o descripción ejecutiva del cambio propuesto..."
              />
            </div>

            {/* SECCIÓN 2: ORIGEN DEL CAMBIO */}
            <h4 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', color: '#334155', marginTop: '24px' }}>2. Origen del Cambio (Opciones que aplican)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              {[
                { key: 'incorporacionTics', label: 'Incorporación TICs' },
                { key: 'cambioNecesidadesUsuario', label: 'Cambio necesidades Usuario' },
                { key: 'analisisNoConformidades', label: 'Análisis No Conformidades' },
                { key: 'cambioResponsabilidades', label: 'Cambio responsabilidades' },
                { key: 'auditorias', label: 'Auditorías' },
                { key: 'evaluacionDesempeno', label: 'Evaluación de Desempeño' },
                { key: 'cambiosContexto', label: 'Cambios en el Contexto' },
                { key: 'servicioNoConforme', label: 'Servicio No Conforme' },
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={!!formData.origen[item.key]} 
                    onChange={e => setFormData({
                      ...formData,
                      origen: { ...formData.origen, [item.key]: e.target.checked }
                    })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  {item.label}
                </label>
              ))}
            </div>

            {/* SECCIÓN 3: PROPÓSITO DEL CAMBIO */}
            <h4 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', color: '#334155', marginTop: '24px' }}>3. Propósito del Cambio (¿Por qué se va a realizar el cambio?)</h4>
            <div className="form-group">
              <textarea 
                className="form-control" 
                rows="6" 
                value={formData.proposito} 
                onChange={e => setFormData({...formData, proposito: e.target.value})}
                required
                placeholder="Detalle los motivos, causas, no conformidades vinculadas, contexto y necesidad del cambio..."
              />
            </div>

            {/* SECCIÓN 4: OBJETIVOS */}
            <h4 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', color: '#334155', marginTop: '24px' }}>4. Objetivos (¿Qué se pretende con el cambio?)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              {[
                { key: 'mejoraServicio', label: 'Mejora del servicio' },
                { key: 'mejoraEficacia', label: 'Mejora eficacia' },
                { key: 'mejoraEficiencia', label: 'Mejora de la eficiencia' },
                { key: 'mejoraGeneralProceso', label: 'Mejora general proceso' },
                { key: 'reasignacionResp', label: 'Reasignación Resp.' },
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={!!formData.objetivos[item.key]} 
                    onChange={e => setFormData({
                      ...formData,
                      objetivos: { ...formData.objetivos, [item.key]: e.target.checked }
                    })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  {item.label}
                </label>
              ))}
            </div>

            {/* SECCIÓN 5: ACCIÓN PROPUESTA */}
            <h4 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', color: '#334155', marginTop: '24px' }}>5. Descripción de la Acción Propuesta para Implementar</h4>
            <div className="form-group">
              <textarea 
                className="form-control" 
                rows="6" 
                value={formData.accionPropuesta} 
                onChange={e => setFormData({...formData, accionPropuesta: e.target.value})}
                required
                placeholder="Enumere los pasos, acciones a coordinar con proveedores, gerencias y áreas involucradas..."
              />
            </div>

            {/* SECCIÓN 6: CUMPLIMIENTO EXTERNO Y LEGAL */}
            <h4 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', color: '#334155', marginTop: '24px' }}>6. Requisitos Externos y Legales</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
              {[
                { key: 'contratoConcesion', label: 'Contrato de Concesión' },
                { key: 'reglamentoExplotacion', label: 'Reglamento de Explotación' },
                { key: 'reglamentoUsuario', label: 'Reglamento del Usuario' },
                { key: 'matrizLegal', label: 'Matriz Legal' },
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={!!formData.cumplimientoLegal[item.key]} 
                    onChange={e => setFormData({
                      ...formData,
                      cumplimientoLegal: { ...formData.cumplimientoLegal, [item.key]: e.target.checked }
                    })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  {item.label}
                </label>
              ))}
            </div>

            <div className="form-group" style={{ maxWidth: '300px' }}>
              <label className="form-label">Cumplimiento General</label>
              <select 
                className="form-control" 
                value={formData.cumplimientoLegal.cumplimientoGeneral} 
                onChange={e => setFormData({
                  ...formData,
                  cumplimientoLegal: { ...formData.cumplimientoLegal, cumplimientoGeneral: e.target.value }
                })}
              >
                <option value="Cumple">Cumple</option>
                <option value="No Cumple">No Cumple</option>
              </select>
            </div>

            {/* SECCIÓN 7: RECURSOS REQUERIDOS */}
            <h4 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', color: '#334155', marginTop: '24px' }}>7. Recursos Requeridos</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nuevas competencias</label>
                <input type="text" className="form-control" value={formData.recursos.nuevasCompetencias} onChange={e => setFormData({...formData, recursos: {...formData.recursos, nuevasCompetencias: e.target.value}})} />
              </div>
              <div className="form-group">
                <label className="form-label">Incorporación de personal</label>
                <input type="text" className="form-control" value={formData.recursos.incorporacionPersonal} onChange={e => setFormData({...formData, recursos: {...formData.recursos, incorporacionPersonal: e.target.value}})} />
              </div>
              <div className="form-group">
                <label className="form-label">Reasignación de responsabilidades</label>
                <input type="text" className="form-control" value={formData.recursos.reasignacionResponsabilidades} onChange={e => setFormData({...formData, recursos: {...formData.recursos, reasignacionResponsabilidades: e.target.value}})} />
              </div>
              <div className="form-group">
                <label className="form-label">Informático</label>
                <input type="text" className="form-control" value={formData.recursos.informatico} onChange={e => setFormData({...formData, recursos: {...formData.recursos, informatico: e.target.value}})} />
              </div>
              <div className="form-group">
                <label className="form-label">Vehículos</label>
                <input type="text" className="form-control" value={formData.recursos.vehiculos} onChange={e => setFormData({...formData, recursos: {...formData.recursos, vehiculos: e.target.value}})} />
              </div>
              <div className="form-group">
                <label className="form-label">Comunicaciones</label>
                <input type="text" className="form-control" value={formData.recursos.comunicaciones} onChange={e => setFormData({...formData, recursos: {...formData.recursos, comunicaciones: e.target.value}})} />
              </div>
              <div className="form-group">
                <label className="form-label">Mobiliario</label>
                <input type="text" className="form-control" value={formData.recursos.mobiliario} onChange={e => setFormData({...formData, recursos: {...formData.recursos, mobiliario: e.target.value}})} />
              </div>
              <div className="form-group">
                <label className="form-label">Modificación infraestructura</label>
                <input type="text" className="form-control" value={formData.recursos.modificacionInfraestructura} onChange={e => setFormData({...formData, recursos: {...formData.recursos, modificacionInfraestructura: e.target.value}})} />
              </div>
            </div>

            {/* SECCIÓN 8: IMPACTO SGI */}
            <h4 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', color: '#334155', marginTop: '24px' }}>8. Impacto SGI / Procesos Afectados</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">¿Se analizaron Riesgos y Oportunidades?</label>
                <select className="form-control" value={formData.impactoSGI.analisisRiesgosOportunidades} onChange={e => setFormData({...formData, impactoSGI: {...formData.impactoSGI, analisisRiesgosOportunidades: e.target.value}})}>
                  <option value="SÍ">SÍ</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">¿Impacta a clientes, proveedores, entes?</label>
                <select className="form-control" value={formData.impactoSGI.impactaClientesProveedores} onChange={e => setFormData({...formData, impactoSGI: {...formData.impactoSGI, impactaClientesProveedores: e.target.value}})}>
                  <option value="SÍ">SÍ</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">¿Documentos a modificar?</label>
                <select className="form-control" value={formData.impactoSGI.documentosModificar} onChange={e => setFormData({...formData, impactoSGI: {...formData.impactoSGI, documentosModificar: e.target.value}})}>
                  <option value="SÍ">SÍ</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Detalle documentos a modificar</label>
                <input type="text" className="form-control" value={formData.impactoSGI.documentosModificarDetalle} onChange={e => setFormData({...formData, impactoSGI: {...formData.impactoSGI, documentosModificarDetalle: e.target.value}})} placeholder="Ej: ITAU/04/02" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
              <div className="form-group">
                <label className="form-label">Plan de comunicación interna</label>
                <input type="text" className="form-control" value={formData.impactoSGI.comunicacionInterna} onChange={e => setFormData({...formData, impactoSGI: {...formData.impactoSGI, comunicacionInterna: e.target.value}})} placeholder="Ej: e-mails y capacitaciones" />
              </div>
              <div className="form-group">
                <label className="form-label">Plan de comunicación externa</label>
                <input type="text" className="form-control" value={formData.impactoSGI.comunicacionExterna} onChange={e => setFormData({...formData, impactoSGI: {...formData.impactoSGI, comunicacionExterna: e.target.value}})} placeholder="Ej: sitio web, redes sociales" />
              </div>
            </div>

            {/* SECCIÓN 9: APROBACIÓN */}
            <h4 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', color: '#334155', marginTop: '24px' }}>9. Dictamen y Aprobación</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Estado de Aprobación</label>
                <select className="form-control" value={formData.aprobacion.estado} onChange={e => setFormData({...formData, aprobacion: {...formData.aprobacion, estado: e.target.value}})}>
                  <option value="Aprobado">Aprobado</option>
                  <option value="En Evaluación">En Evaluación</option>
                  <option value="No Aprobado">No Aprobado</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">¿Se comunicó la aprobación?</label>
                <select className="form-control" value={formData.aprobacion.comunicoAprobacion} onChange={e => setFormData({...formData, aprobacion: {...formData.aprobacion, comunicoAprobacion: e.target.value}})}>
                  <option value="SÍ">SÍ</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Firma SGI</label>
                <input type="text" className="form-control" value={formData.aprobacion.firmaSGI} onChange={e => setFormData({...formData, aprobacion: {...formData.aprobacion, firmaSGI: e.target.value}})} />
              </div>
            </div>

            {formData.aprobacion.estado === 'No Aprobado' && (
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label">Criterios adoptados para el rechazo</label>
                <textarea className="form-control" rows="2" value={formData.aprobacion.criteriosNoAprobado} onChange={e => setFormData({...formData, aprobacion: {...formData.aprobacion, criteriosNoAprobado: e.target.value}})} />
              </div>
            )}

            {/* BOTONES ACCIÓN */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => { setViewMode('list'); setFormData(null); }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
              >
                <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Formulario'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

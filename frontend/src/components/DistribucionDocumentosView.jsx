import React, { useState, useEffect } from 'react';
import { 
  MapPin, Printer, Search, Plus, Eye, Edit3, Trash2, CheckCircle2, 
  Clock, FileText, ArrowLeft, Filter, Building2, ExternalLink
} from 'lucide-react';
import { 
  listarDistribucionDocumentos, guardarDistribucionDocumento, 
  DISTRIBUCION_SEED_POLITICA 
} from '../lib/distribucionApi';
import { useAuth } from '../contexts/AuthContext';

export default function DistribucionDocumentosView() {
  const { userRole } = useAuth();
  const isSGI = userRole === 'SGI';

  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'official', 'form'
  const [filtroConcesion, setFiltroConcesion] = useState('Todas');
  const [filtroRevision, setFiltroRevision] = useState('5'); // 'Todas', '5', '4'
  const [busqueda, setBusqueda] = useState('');

  // Modal para agregar nuevo receptor / ubicación
  const [modalReceptor, setModalReceptor] = useState(false);
  const [nuevoReceptor, setNuevoReceptor] = useState({
    nombre: '',
    lugar: '',
    concesion: 'BALP',
    tipoCopia: 'Física / Atención al Usuario',
    acuseRecibo: 'Confirmado',
    revisionNumero: '5'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const items = await listarDistribucionDocumentos();
      setDocumentos(items);
      if (items.length > 0 && !selectedDoc) {
        setSelectedDoc(items[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const doc = selectedDoc || DISTRIBUCION_SEED_POLITICA;

  // Aplanar filas de receptores para vista tabla interactiva
  const allReceptores = [];
  (doc.revisiones || []).forEach(rev => {
    (rev.receptores || []).forEach(r => {
      allReceptores.push({
        ...r,
        revNumero: rev.numero,
        revFecha: rev.fecha,
        revVigente: rev.vigente
      });
    });
  });

  const filteredReceptores = allReceptores.filter(r => {
    const matchesConc = filtroConcesion === 'Todas' || r.concesion === filtroConcesion;
    const matchesRev = filtroRevision === 'Todas' || String(r.revNumero) === filtroRevision;
    const q = busqueda.toLowerCase();
    const matchesQ = !q || (r.nombre || '').toLowerCase().includes(q) || (r.lugar || '').toLowerCase().includes(q);
    return matchesConc && matchesRev && matchesQ;
  });

  const handleAgregarReceptor = async (e) => {
    e.preventDefault();
    if (!nuevoReceptor.nombre || !nuevoReceptor.lugar) {
      alert('Por favor complete el nombre y la ubicación física.');
      return;
    }

    const docActual = JSON.parse(JSON.stringify(doc));
    const targetRev = docActual.revisiones.find(r => String(r.numero) === String(nuevoReceptor.revisionNumero));
    
    const nuevoObj = {
      id: `rec_${nuevoReceptor.revisionNumero}_${Date.now()}`,
      nombre: nuevoReceptor.nombre,
      lugar: nuevoReceptor.lugar,
      concesion: nuevoReceptor.concesion,
      tipoCopia: nuevoReceptor.tipoCopia,
      acuseRecibo: nuevoReceptor.acuseRecibo
    };

    if (targetRev) {
      targetRev.receptores = targetRev.receptores || [];
      targetRev.receptores.push(nuevoObj);
    } else {
      docActual.revisiones.push({
        numero: nuevoReceptor.revisionNumero,
        fecha: 'Actual',
        vigente: true,
        receptores: [nuevoObj]
      });
    }

    await guardarDistribucionDocumento(docActual);
    setSelectedDoc(docActual);
    await cargarDatos();
    setModalReceptor(false);
    setNuevoReceptor({
      nombre: '',
      lugar: '',
      concesion: 'BALP',
      tipoCopia: 'Física / Atención al Usuario',
      acuseRecibo: 'Confirmado',
      revisionNumero: '5'
    });
  };

  const handleEliminarReceptor = async (recId, revNum) => {
    if (!window.confirm('¿Está seguro de eliminar esta ubicación/receptor?')) return;
    const docActual = JSON.parse(JSON.stringify(doc));
    const rev = docActual.revisiones.find(r => String(r.numero) === String(revNum));
    if (rev && rev.receptores) {
      rev.receptores = rev.receptores.filter(r => r.id !== recId);
      await guardarDistribucionDocumento(docActual);
      setSelectedDoc(docActual);
      await cargarDatos();
    }
  };

  // KPIs
  const totalReceptoresVigentes = (doc.revisiones?.find(r => r.vigente)?.receptores || []).length;
  const receptoresBalp = (doc.revisiones?.find(r => r.vigente)?.receptores || []).filter(r => r.concesion === 'BALP').length;
  const receptoresSvia = (doc.revisiones?.find(r => r.vigente)?.receptores || []).filter(r => r.concesion === 'SVIA').length;

  return (
    <div className="animate-fade-in" style={{ marginTop: '16px' }}>
      
      {/* Encabezado de la Sección de Distribución */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', background: '#e0f2fe', color: '#0369a1', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
              {doc.codigoDoc || 'PAU/02 – A2'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Procedimiento PAU/02 — Requisito 7.5 (Control de la Información Documentada)</span>
          </div>
          <h2 style={{ margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px' }}>
            <MapPin size={24} color="#0284c7" />
            Distribución y Ubicación de Documentos del SGI
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Identificación de ubicaciones físicas y digitales, versiones vigentes, fechas y acuses de recibo en las trazas de AUBASA.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setViewMode(viewMode === 'official' ? 'table' : 'official')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, borderColor: '#0284c7', color: '#0284c7' }}
          >
            {viewMode === 'official' ? <ArrowLeft size={16} /> : <Eye size={16} />}
            {viewMode === 'official' ? 'Ver Tabla de Control' : 'Ver Formato Oficial PAU/02-A2'}
          </button>

          {viewMode === 'official' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, background: '#0284c7' }}
            >
              <Printer size={16} /> Imprimir / PDF
            </button>
          )}

          {isSGI && viewMode === 'table' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalReceptor(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <Plus size={16} /> Agregar Ubicación / Receptor
            </button>
          )}
        </div>
      </div>

      {/* VISTA 1: TABLA Y GESTIÓN INTERACTIVA */}
      {viewMode === 'table' && (
        <div>
          {/* Tarjetas KPI de Distribución */}
          <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', borderLeft: '4px solid #0284c7', background: 'white' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Documento Controlado</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '4px', lineHeight: '1.3' }}>{doc.documentoCodigo}</div>
              <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px' }}>Revisión Vigente: Rev. 05</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', borderLeft: '4px solid #10b981', background: 'white' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Ubicaciones en Concesión BALP</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#047857', marginTop: '4px' }}>{receptoresBalp}</div>
              <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>Dock Sud, Berazategui, Hudson</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', borderLeft: '4px solid #3b82f6', background: 'white' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Ubicaciones en Concesión SVIA</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#1d4ed8', marginTop: '4px' }}>{receptoresSvia}</div>
              <div style={{ fontSize: '11px', color: '#1d4ed8', marginTop: '2px' }}>Samborombón km 90</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', borderLeft: '4px solid #8b5cf6', background: 'white' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Acuse de Recibo Electrónico</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#7c3aed', marginTop: '4px' }}>100%</div>
              <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '2px' }}>Totalmente Concretados</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="glass-panel no-print" style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', background: 'white' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Buscar por receptor, peaje o km (ej: Dock Sud, km 30, Samborombón)..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ paddingLeft: '36px', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Concesión:</span>
              {['Todas', 'BALP', 'SVIA'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFiltroConcesion(c)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: filtroConcesion === c ? '#0284c7' : '#f1f5f9',
                    color: filtroConcesion === c ? 'white' : '#475569'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Revisión:</span>
              {[
                { val: '5', label: 'Rev. 5 (Jul 2025 - Vigente)' },
                { val: '4', label: 'Rev. 4 (Jul 2024)' },
                { val: 'Todas', label: 'Todas' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setFiltroRevision(opt.val)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: filtroRevision === opt.val ? '#334155' : '#f1f5f9',
                    color: filtroRevision === opt.val ? 'white' : '#475569'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Ubicaciones */}
          <div className="glass table-container" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', fontSize: '13px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Revisión / Fecha</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Receptor / Puesto</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Ubicación Física Detallada</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>Concesión</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Tipo de Copia</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>Acuse de Recibo</th>
                  {isSGI && <th style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredReceptores.length === 0 ? (
                  <tr>
                    <td colSpan={isSGI ? 7 : 6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      No se encontraron receptores con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredReceptores.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }} className="hover-row">
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontWeight: 800, color: r.revVigente ? '#047857' : '#64748b' }}>
                          Rev. {r.revNumero}
                        </span>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{r.revFecha}</div>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>
                        {r.nombre}
                      </td>
                      <td style={{ padding: '12px', color: '#334155' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} color="#0284c7" />
                          {r.lugar}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: r.concesion === 'SVIA' ? '#dbeafe' : '#dcfce7',
                          color: r.concesion === 'SVIA' ? '#1e40af' : '#166534'
                        }}>
                          {r.concesion}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#475569', fontSize: '12px' }}>
                        {r.tipoCopia}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#ecfdf5',
                          color: '#065f46'
                        }}>
                          <CheckCircle2 size={13} /> {r.acuseRecibo || 'Confirmado'}
                        </span>
                      </td>
                      {isSGI && (
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleEliminarReceptor(r.id, r.revNumero)}
                            style={{ padding: '4px 8px', border: 'none', color: '#dc2626' }}
                            title="Eliminar receptor"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, color: '#0284c7' }}>* Nota Oficial:</span>
            <span>{doc.notaPie}</span>
          </div>
        </div>
      )}

      {/* VISTA 2: FORMATO OFICIAL AUBASA IMPRIMIBLE (PAU/02 - A2) */}
      {viewMode === 'official' && (
        <div className="animate-fade-in">
          {/* Hoja oficial para imprimir */}
          <div className="pau02-print-container" style={{
            maxWidth: '1050px',
            margin: '0 auto',
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            fontFamily: 'Arial, sans-serif',
            color: '#000'
          }}>
            {/* TABLA PRINCIPAL OFICIAL */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', fontSize: '11.5px' }}>
              
              {/* ENCABEZADO AUBASA */}
              <thead>
                <tr>
                  <th style={{ width: '180px', borderRight: '2px solid #000', borderBottom: '2px solid #000', padding: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: '#00a3e0', letterSpacing: '-1px' }}>AUBASA</span>
                  </th>
                  <th style={{ borderRight: '2px solid #000', borderBottom: '2px solid #000', padding: '10px 16px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px' }}>{doc.codigoProcedimiento || 'PAU/02'}</div>
                    <div style={{ fontWeight: 900, fontSize: '14px', marginTop: '4px', textTransform: 'uppercase' }}>
                      {doc.titulo || 'ANEXO 2 DISTRIBUCION DE LA POLÍTICA DE GESTIÓN INTEGRADA'}
                    </div>
                  </th>
                  <th style={{ width: '180px', borderBottom: '2px solid #000', padding: '6px 10px', fontSize: '11px', textAlign: 'left', fontWeight: 'normal' }}>
                    <div><strong>Código:</strong> {doc.codigoDoc}</div>
                    <div><strong>Revisión:</strong> {doc.revisionDoc}</div>
                    <div><strong>Fecha:</strong> {doc.fechaEmisionDoc}</div>
                    <div><strong>Página:</strong> {doc.pagina || '1 de 1'}</div>
                  </th>
                </tr>

                {/* FILA DE COLUMNAS DE LA MATRIZ */}
                <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 900, textAlign: 'center', borderBottom: '2px solid #000' }}>
                  <th rowSpan={2} style={{ borderRight: '1px solid #000', padding: '8px', width: '220px' }}>
                    DOCUMENTO CÓDIGO
                  </th>
                  <th colSpan={2} style={{ borderRight: '1px solid #000', padding: '4px' }}>
                    REVISIÓN
                  </th>
                  <th rowSpan={2} style={{ padding: '8px', textAlign: 'center' }}>
                    RECEPTORES
                  </th>
                </tr>
                <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 900, textAlign: 'center', borderBottom: '2px solid #000' }}>
                  <th style={{ borderRight: '1px solid #000', padding: '4px', width: '45px' }}>Nº</th>
                  <th style={{ borderRight: '1px solid #000', padding: '4px', width: '90px' }}>Fecha</th>
                </tr>
              </thead>

              <tbody>
                {/* REVISIONES 0 A 3 */}
                {[0, 1, 2, 3].map(n => (
                  <tr key={n} style={{ borderBottom: '1px solid #000', minHeight: '26px' }}>
                    {n === 0 && (
                      <td rowSpan={6} style={{ borderRight: '1px solid #000', padding: '12px', fontWeight: 900, fontSize: '13px', verticalAlign: 'middle', textAlign: 'center', background: '#fafafa' }}>
                        {doc.documentoCodigo}
                      </td>
                    )}
                    <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 700 }}>
                      {n}
                    </td>
                    <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', color: '#666' }}>
                      -
                    </td>
                    <td style={{ padding: '6px', color: '#666', fontStyle: 'italic' }}>
                      (Versión histórica archivada)
                    </td>
                  </tr>
                ))}

                {/* REVISIÓN 4 */}
                {(() => {
                  const rev4 = doc.revisiones?.find(r => String(r.numero) === '4') || {};
                  return (
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td style={{ borderRight: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 900, fontSize: '13px' }}>
                        4
                      </td>
                      <td style={{ borderRight: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 700 }}>
                        {rev4.fecha || 'Julio 2024'}
                      </td>
                      <td style={{ padding: '10px 14px', lineHeight: '1.6' }}>
                        {(rev4.receptores || []).map((r, i) => (
                          <div key={i} style={{ marginBottom: '4px' }}>
                            • <strong>{r.nombre}:</strong> {r.lugar}
                          </div>
                        ))}
                      </td>
                    </tr>
                  );
                })()}

                {/* REVISIÓN 5 (VIGENTE) */}
                {(() => {
                  const rev5 = doc.revisiones?.find(r => String(r.numero) === '5') || {};
                  return (
                    <tr style={{ borderBottom: '2px solid #000', backgroundColor: '#faf5ff' }}>
                      <td style={{ borderRight: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 900, fontSize: '13px', color: '#047857' }}>
                        5 <span style={{ fontSize: '9px', display: 'block', color: '#047857' }}>(Vigente)</span>
                      </td>
                      <td style={{ borderRight: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 800, color: '#047857' }}>
                        {rev5.fecha || 'Julio 2025'}
                      </td>
                      <td style={{ padding: '10px 14px', lineHeight: '1.6' }}>
                        {(rev5.receptores || []).map((r, i) => (
                          <div key={i} style={{ marginBottom: '6px' }}>
                            • <strong>{r.nombre}:</strong> {r.lugar}
                            {r.concesion === 'SVIA' && (
                              <span style={{ marginLeft: '8px', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>
                                SVIA
                              </span>
                            )}
                          </div>
                        ))}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>

            {/* NOTA AL PIE */}
            <div style={{ marginTop: '10px', fontSize: '10.5px', fontStyle: 'italic', padding: '4px 6px' }}>
              {doc.notaPie}
            </div>

            {/* TABLA DE CONTROL DE CAMBIOS */}
            <div style={{ marginTop: '30px', maxWidth: '450px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, marginBottom: '4px' }}>
                Cambios en esta revisión respecto de la anterior
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11px' }}>
                <thead style={{ background: '#f1f5f9' }}>
                  <tr>
                    <th style={{ border: '1px solid #000', padding: '4px 8px', width: '80px', textAlign: 'center' }}>Revisión</th>
                    <th style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'left' }}>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {(doc.cambiosRevision || [{ revision: '02', descripcion: 'Se modifica el formato.' }]).map((c, i) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'center', fontWeight: 700 }}>{c.revision}</td>
                      <td style={{ border: '1px solid #000', padding: '4px 8px' }}>{c.descripcion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PARA AGREGAR NUEVO RECEPTOR */}
      {modalReceptor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass animate-fade-in" style={{ background: 'white', width: '520px', padding: '28px', borderRadius: '14px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} color="#0284c7" />
              Nueva Ubicación / Receptor de Documento
            </h3>

            <form onSubmit={handleAgregarReceptor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Revisión a la que aplica</label>
                <select 
                  className="form-control"
                  value={nuevoReceptor.revisionNumero}
                  onChange={e => setNuevoReceptor({...nuevoReceptor, revisionNumero: e.target.value})}
                >
                  <option value="5">Revisión 5 (Julio 2025 - Vigente)</option>
                  <option value="4">Revisión 4 (Julio 2024)</option>
                  <option value="6">Revisión 6 (Nueva)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del Receptor / Puesto</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={nuevoReceptor.nombre}
                  onChange={e => setNuevoReceptor({...nuevoReceptor, nombre: e.target.value})}
                  placeholder="Ej: CAU Samborombón, Asiento Gerencia Comercial, CAU Dock Sud..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ubicación Física Detallada</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={nuevoReceptor.lugar}
                  onChange={e => setNuevoReceptor({...nuevoReceptor, lugar: e.target.value})}
                  placeholder="Ej: BALP km 6,8 Sentido CABA / SVIA km 90 / 1er piso..."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Concesión</label>
                  <select 
                    className="form-control"
                    value={nuevoReceptor.concesion}
                    onChange={e => setNuevoReceptor({...nuevoReceptor, concesion: e.target.value})}
                  >
                    <option value="BALP">BALP (Autopista La Plata)</option>
                    <option value="SVIA">SVIA (Corredor Atlántico)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Copia</label>
                  <select 
                    className="form-control"
                    value={nuevoReceptor.tipoCopia}
                    onChange={e => setNuevoReceptor({...nuevoReceptor, tipoCopia: e.target.value})}
                  >
                    <option value="Física / Atención al Usuario">Física / Atención al Usuario</option>
                    <option value="Física / Cartelera">Física / Cartelera</option>
                    <option value="Copia Controlada Digital">Copia Controlada Digital</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Estado de Acuse de Recibo</label>
                <select 
                  className="form-control"
                  value={nuevoReceptor.acuseRecibo}
                  onChange={e => setNuevoReceptor({...nuevoReceptor, acuseRecibo: e.target.value})}
                >
                  <option value="Confirmado">Confirmado (Acuse Electrónico Recibido)</option>
                  <option value="Pendiente">Pendiente de Acuse</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setModalReceptor(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                >
                  Guardar Ubicación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

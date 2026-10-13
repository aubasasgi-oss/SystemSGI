import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Lock, ChevronRight, ChevronLeft, Save, Eye, Printer, Users } from 'lucide-react';
import { listarManagementReviews, guardarManagementReview } from '../lib/managementReviewApi';
import { listarContexto } from '../lib/contextoApi';

export default function ManagementReview() {
  const { userRole } = useAuth();
  const isSGI = userRole === 'SGI';

  const [activeTab, setActiveTab] = useState('actas'); // 'actas' o 'partes'
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'form', 'view'
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedReview, setSelectedReview] = useState(null);

  const cargarReviews = async () => {
    setLoadingReviews(true);
    try {
      const data = await listarManagementReviews();
      setReviews(data);
    } catch (err) {
      console.error('Error al cargar revisiones por la dirección:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    cargarReviews();
  }, []);

  // Partes Interesadas: se traen automáticamente del Análisis de Contexto (PAU/01)
  const [partesData, setPartesData] = useState([]); // [{ nombre, riesgos: [{id, riesgo, factorCritico, proceso, probabilidad, impacto}] }]
  const [loadingPartes, setLoadingPartes] = useState(false);
  const [checklistData, setChecklistData] = useState({
    year: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
    verificadas: {}, // { [nombreParteInteresada]: true }
    firmaJSGI: ''
  });
  const [checklistError, setChecklistError] = useState('');

  // Agrupa los factores del Análisis de Contexto por parte interesada.
  // El campo partesInteresadas puede traer varias separadas por coma.
  const agruparPorParteInteresada = (items) => {
    const mapa = new Map();
    (items || []).forEach(it => {
      const partes = String(it.partesInteresadas || '')
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);
      partes.forEach(nombre => {
        if (!mapa.has(nombre)) mapa.set(nombre, { nombre, riesgos: [] });
        mapa.get(nombre).riesgos.push({
          id: it.id,
          riesgo: it.riesgo,
          factorCritico: it.factorCritico,
          proceso: it.proceso,
          probabilidad: Number(it.probabilidad) || 0,
          impacto: Number(it.impacto) || 0,
        });
      });
    });
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  };

  const getNivelBadge = (p, i) => {
    const n = (Number(p) || 0) * (Number(i) || 0);
    if (n >= 15) return <span className="badge" style={{backgroundColor: '#fef2f2', color: '#ef4444'}}>🔴 {n} (Muy Alto)</span>;
    if (n >= 10) return <span className="badge" style={{backgroundColor: '#fff7ed', color: '#f97316'}}>🟠 {n} (Alto)</span>;
    if (n >= 6) return <span className="badge" style={{backgroundColor: '#fefce8', color: '#eab308'}}>🟡 {n} (Medio)</span>;
    return <span className="badge" style={{backgroundColor: '#f0fdf4', color: '#8dc63f'}}>🟢 {n} (Bajo)</span>;
  };

  useEffect(() => {
    if (activeTab !== 'partes') return;
    setLoadingPartes(true);
    listarContexto()
      .then(items => setPartesData(agruparPorParteInteresada(items)))
      .catch(err => { console.error('Error al cargar partes interesadas del contexto:', err); setPartesData([]); })
      .finally(() => setLoadingPartes(false));
  }, [activeTab]);

  const handleStartNew = () => {
    setSelectedReview({
      id: `RD-${new Date().getFullYear()}`,
      year: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
      status: 'Borrador',
      date: new Date().toISOString().split('T')[0],
      participants: '',
      data: {
        step1_acciones: '', step1_contexto: '',
        step2_satisfaccion: '', step2_objetivos: '', step2_procesos: '', step2_ncs: '', step2_seguimiento: '', step2_auditorias: '', step2_proveedores: '',
        step3_recursos: '', step3_riesgos: '', step3_mejoras: '', 
        step4_salidas_mejoras: '', step4_salidas_cambios: '', step4_salidas_recursos: ''
      }
    });
    setCurrentStep(1);
    setViewMode('form');
  };

  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await guardarManagementReview(selectedReview);
      await cargarReviews();
      setViewMode('list');
    } catch (err) {
      console.error('Error al guardar la revisión por la dirección:', err);
      alert('No se pudo guardar la revisión. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const updateData = (field, value) => {
    setSelectedReview({
      ...selectedReview,
      data: { ...selectedReview.data, [field]: value }
    });
  };

  const validateAndPrintChecklist = () => {
    if (partesData.length === 0) {
      setChecklistError('No hay partes interesadas cargadas en el Análisis de Contexto para verificar. Cargalas primero en Contexto (Estratégico).');
      return;
    }
    const pendientes = partesData.filter(p => !checklistData.verificadas[p.nombre]);
    if (pendientes.length > 0) {
      setChecklistError(`Debe verificar la retroalimentación de todas las partes interesadas (${pendientes.length} pendiente(s): ${pendientes.map(p => p.nombre).join(', ')}) antes de imprimir el anexo oficial.`);
      return;
    }
    if (!checklistData.firmaJSGI) {
      setChecklistError('Debe adjuntar la firma del JSGI para validar el checklist oficial.');
      return;
    }
    setChecklistError('');
    window.print();
  };

  const renderTabs = () => (
    <div className="no-print" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
      <button 
        onClick={() => { setActiveTab('actas'); setViewMode('list'); }}
        style={{
          padding: '12px 24px',
          backgroundColor: activeTab === 'actas' ? 'white' : 'transparent',
          border: activeTab === 'actas' ? '1px solid #e2e8f0' : 'none',
          borderBottom: activeTab === 'actas' ? '1px solid white' : 'none',
          marginBottom: '-1px',
          borderRadius: '8px 8px 0 0',
          fontWeight: activeTab === 'actas' ? 'bold' : 'normal',
          color: activeTab === 'actas' ? '#0f172a' : '#64748b',
          cursor: 'pointer'
        }}
      >
        Actas de Revisión por la Dirección
      </button>
      <button 
        onClick={() => { setActiveTab('partes'); setViewMode('list'); }}
        style={{
          padding: '12px 24px',
          backgroundColor: activeTab === 'partes' ? 'white' : 'transparent',
          border: activeTab === 'partes' ? '1px solid #e2e8f0' : 'none',
          borderBottom: activeTab === 'partes' ? '1px solid white' : 'none',
          marginBottom: '-1px',
          borderRadius: '8px 8px 0 0',
          fontWeight: activeTab === 'partes' ? 'bold' : 'normal',
          color: activeTab === 'partes' ? '#0f172a' : '#64748b',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <Users size={18} /> Partes Interesadas
      </button>
    </div>
  );

  const renderPartesTab = () => (
    <div className="animate-fade-in printable-doc">
      <div className="no-print module-header">
        <div>
          <h2>Partes Interesadas (Automático)</h2>
          <p>Partes interesadas y riesgos medidos traídos automáticamente del Análisis de Contexto (PAU/01) — Requisito 9.3.2 c.1.</p>
        </div>
        <button className="btn btn-primary" onClick={validateAndPrintChecklist}>
          <Printer size={18}/> Imprimir Anexo
        </button>
      </div>

      <div className="glass" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #0369a1', paddingBottom: '24px' }}>
          <h2 style={{ color: '#0369a1', margin: '0 0 8px 0' }}>ANEXO DE EVALUACIÓN AL REGISTRO PAU 09</h2>
          <h4 style={{ color: '#64748b', margin: 0 }}>Checklist de Verificación de Entradas (Partes Interesadas Externas)</h4>
        </div>
        
        <div className="no-print form-group" style={{ marginBottom: '32px' }}>
          <label className="form-label">Período de Revisión Correspondiente:</label>
          <input type="text" className="form-control" style={{maxWidth: '200px'}} value={checklistData.year} onChange={(e) => setChecklistData({...checklistData, year: e.target.value})} />
        </div>

        <p className="only-print" style={{ display: 'none', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6'}}>
          <strong>Período Analizado: {checklistData.year}</strong>
        </p>

        <p style={{marginBottom: '24px', fontSize: '14px', lineHeight: '1.6'}}>
          Se certifica por medio del presente anexo que, previo a la formalización del acta de Revisión por la Dirección correspondiente, se ha consolidado y evaluado formalmente la retroalimentación de las siguientes partes interesadas externas (Requisito 9.3.2 c.1), según surgen del Análisis de Contexto vigente:
        </p>

        <div className="no-print" style={{backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#1e40af'}}>
          Esta solapa se genera automáticamente desde el Análisis de Contexto (Estratégico). Para agregar o quitar una parte interesada, editala en los factores del módulo de Contexto.
        </div>

        {loadingPartes && (
          <p className="no-print" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>Cargando partes interesadas del Análisis de Contexto...</p>
        )}

        {!loadingPartes && partesData.length === 0 && (
          <div className="no-print" style={{backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '24px', marginBottom: '32px', color: '#92400e'}}>
            Aún no hay partes interesadas cargadas en el Análisis de Contexto. Cargá los factores en el módulo Contexto (Estratégico) para que aparezcan automáticamente acá.
          </div>
        )}

        <div className="no-print">
        {!loadingPartes && partesData.map(parte => (
          <div key={parte.nombre} style={{backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '24px', marginBottom: '24px'}}>
            <label style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer'}}>
              <input type="checkbox" style={{width: '20px', height: '20px'}} checked={!!checklistData.verificadas[parte.nombre]} onChange={(e) => setChecklistData({...checklistData, verificadas: {...checklistData.verificadas, [parte.nombre]: e.target.checked}})} />
              <span style={{fontSize: '16px'}}><strong>{parte.nombre}</strong> (Retroalimentación consolidada y evaluada)</span>
            </label>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Riesgo / Oportunidad (del Análisis de Contexto)</th>
                  <th>Factor Crítico</th>
                  <th>Proceso</th>
                  <th style={{textAlign:'center'}}>Prob</th>
                  <th style={{textAlign:'center'}}>Imp</th>
                  <th style={{textAlign:'center'}}>Nivel medido</th>
                </tr>
              </thead>
              <tbody>
                {parte.riesgos.map(r => (
                  <tr key={`${r.id}-${parte.nombre}`}>
                    <td>{r.riesgo}</td>
                    <td>{r.factorCritico}</td>
                    <td>{r.proceso}</td>
                    <td style={{textAlign:'center', fontWeight:'bold'}}>{r.probabilidad}</td>
                    <td style={{textAlign:'center', fontWeight:'bold'}}>{r.impacto}</td>
                    <td style={{textAlign:'center'}}>{getNivelBadge(r.probabilidad, r.impacto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        </div>

        <table className="only-print print-table" style={{width: '100%', marginBottom: '40px', display: 'none'}}>
          <tbody>
            {partesData.map(parte => (
              <React.Fragment key={`print-${parte.nombre}`}>
                <tr>
                  <td style={{width: '50px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px'}}>{checklistData.verificadas[parte.nombre] ? 'X' : ''}</td>
                  <td style={{fontSize: '14px'}}><strong>{parte.nombre}</strong> (Retroalimentación consolidada y evaluada)</td>
                </tr>
                {parte.riesgos.map(r => (
                  <tr key={`print-${r.id}-${parte.nombre}`}>
                    <td></td>
                    <td style={{fontSize: '12px', color: '#475569'}}>Riesgo: {r.riesgo} — Nivel medido: {r.probabilidad * r.impacto}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div style={{marginTop: '32px', paddingTop: '24px'}}>
          <h4 className="no-print" style={{margin: '0 0 16px 0'}}>Firma del Responsable (JSGI)</h4>
          {checklistData.firmaJSGI ? (
            <div style={{width: '300px'}}>
              <img src={checklistData.firmaJSGI} alt="Firma JSGI" style={{maxHeight: '100px', display: 'block', marginBottom: '8px'}} />
              <div style={{borderTop: '1px solid black', paddingTop: '8px', fontWeight: 'bold', fontSize: '14px'}}>Firma Responsable SGI</div>
              <button className="no-print btn btn-secondary" style={{marginTop: '12px'}} onClick={() => setChecklistData({...checklistData, firmaJSGI: ''})}>Eliminar Firma</button>
            </div>
          ) : (
            <label className="no-print btn btn-secondary" style={{cursor: 'pointer', display: 'inline-block'}}>
              Subir Firma Escaneada
              <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => handleImageUpload(e, (res) => setChecklistData({...checklistData, firmaJSGI: res}))} />
            </label>
          )}
        </div>
        {checklistError && <div className="no-print" style={{color: '#dc2626', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', marginTop: '16px', border: '1px solid #fecaca'}}>{checklistError}</div>}
      </div>
    </div>
  );

  const renderList = () => (
    <div className="animate-fade-in">
      <div className="module-header">
        <div>
          <h2>Actas de Revisión por la Dirección</h2>
          <p>Cumplimiento de Cláusula 9.3 (ISO 9001 / ISO 39001) - Formato PAU/09 Anexo 1</p>
        </div>
        {isSGI && (
          <button className="btn btn-primary" onClick={handleStartNew}>
            <Plus size={18} /> Nueva Revisión Anual
          </button>
        )}
      </div>

      {!isSGI && (
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Lock size={20} color="#64748b" />
          <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>Módulo de lectura. La Alta Dirección y el SGI son los responsables de emitir este documento.</p>
        </div>
      )}

      <div className="glass table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Revisión</th>
              <th>Período Analizado</th>
              <th>Fecha de Emisión</th>
              <th>Participantes Principales</th>
              <th>Estado</th>
              <th style={{textAlign: 'right'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loadingReviews ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Cargando revisiones...</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Aún no hay actas de revisión cargadas.</td></tr>
            ) : reviews.map(rev => (
              <tr key={rev.id}>
                <td style={{fontWeight: 'bold', color: 'var(--accent-color)'}}>{rev.id}</td>
                <td>{rev.year}</td>
                <td>{rev.date}</td>
                <td><span className="truncate" style={{maxWidth: '250px'}} title={rev.participants}>{rev.participants}</span></td>
                <td>
                  <span className="badge" style={{backgroundColor: rev.status === 'Aprobada' ? '#f0fdf4' : '#fff7ed', color: rev.status === 'Aprobada' ? '#16a34a' : '#f97316'}}>
                    {rev.status}
                  </span>
                </td>
                <td style={{textAlign: 'right'}}>
                  <button className="btn btn-icon" onClick={() => { setSelectedReview(rev); setViewMode('view'); }} title="Ver Documento">
                    <Eye size={18} color="#0369a1" />
                  </button>
                  {isSGI && rev.status === 'Borrador' && (
                    <button className="btn btn-icon" onClick={() => { setSelectedReview(rev); setViewMode('form'); setCurrentStep(1); }} title="Continuar Editando">
                      <Edit2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWizardStep = () => {
    const data = selectedReview.data;
    switch(currentStep) {
      case 1:
        return (
          <div className="animate-fade-in delay-1">
            <h3 style={{color: 'var(--accent-color)', marginBottom: '16px'}}>Paso 1: Entradas de la Revisión (Punto 9.3.2 a-b)</h3>
            <div className="form-group">
              <label className="form-label">Estado de Acciones Previas</label>
              <textarea className="form-control" rows="4" value={data.step1_acciones} onChange={e => updateData('step1_acciones', e.target.value)} placeholder="Ej: Se cerraron el 100% de las acciones de la revisión anterior..."></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Cambios en Cuestiones Externas e Internas (Contexto)</label>
              <textarea className="form-control" rows="4" value={data.step1_contexto} onChange={e => updateData('step1_contexto', e.target.value)} placeholder="Ej: Cambios normativos, inversiones, contexto macroeconómico..."></textarea>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-fade-in delay-1">
            <h3 style={{color: 'var(--accent-color)', marginBottom: '16px'}}>Paso 2: Información sobre Desempeño y Eficacia (9.3.2 c)</h3>
            <div className="form-group"><label className="form-label">c.1) La satisfacción del cliente y la retroalimentación de las partes interesadas pertinentes</label><textarea className="form-control" rows="3" value={data.step2_satisfaccion} onChange={e => updateData('step2_satisfaccion', e.target.value)}></textarea></div>
            <div className="form-group"><label className="form-label">c.2) El grado en que se han logrado los objetivos de la calidad</label><textarea className="form-control" rows="3" value={data.step2_objetivos} onChange={e => updateData('step2_objetivos', e.target.value)}></textarea></div>
            <div className="form-group"><label className="form-label">c.3) El desempeño de los procesos y conformidad de los productos y servicios</label><textarea className="form-control" rows="3" value={data.step2_procesos} onChange={e => updateData('step2_procesos', e.target.value)}></textarea></div>
            <div className="form-group"><label className="form-label">c.4) Las no conformidades y acciones correctivas</label><textarea className="form-control" rows="3" value={data.step2_ncs} onChange={e => updateData('step2_ncs', e.target.value)}></textarea></div>
            <div className="form-group"><label className="form-label">c.5) Los resultados de seguimiento y medición</label><textarea className="form-control" rows="3" value={data.step2_seguimiento} onChange={e => updateData('step2_seguimiento', e.target.value)}></textarea></div>
            <div className="form-group"><label className="form-label">c.6) Los resultados de las auditorías</label><textarea className="form-control" rows="3" value={data.step2_auditorias} onChange={e => updateData('step2_auditorias', e.target.value)}></textarea></div>
            <div className="form-group"><label className="form-label">c.7) El desempeño de los proveedores externos</label><textarea className="form-control" rows="3" value={data.step2_proveedores} onChange={e => updateData('step2_proveedores', e.target.value)}></textarea></div>
          </div>
        );
      case 3:
        return (
          <div className="animate-fade-in delay-1">
            <h3 style={{color: 'var(--accent-color)', marginBottom: '16px'}}>Paso 3: Adecuación de Recursos y Eficacia (9.3.2 d, e, f)</h3>
            <div className="form-group"><label className="form-label">d) La adecuación de los recursos</label><textarea className="form-control" rows="4" value={data.step3_recursos} onChange={e => updateData('step3_recursos', e.target.value)}></textarea></div>
            <div className="form-group"><label className="form-label">e) La eficacia de las acciones tomadas para abordar los riesgos y oportunidades (véase 6.1)</label><textarea className="form-control" rows="4" value={data.step3_riesgos} onChange={e => updateData('step3_riesgos', e.target.value)}></textarea></div>
            <div className="form-group"><label className="form-label">f) Las oportunidades de mejora</label><textarea className="form-control" rows="4" value={data.step3_mejoras} onChange={e => updateData('step3_mejoras', e.target.value)}></textarea></div>
          </div>
        );
      case 4:
        return (
          <div className="animate-fade-in delay-1">
            <h3 style={{color: 'var(--accent-color)', marginBottom: '16px'}}>Paso 4: Salidas de la Revisión por la Dirección (9.3.3)</h3>
            <p style={{color: 'var(--text-secondary)', marginBottom: '16px'}}>Las salidas deben incluir decisiones y acciones relacionadas con:</p>
            <div className="form-group"><label className="form-label">a) Las oportunidades de mejora</label><textarea className="form-control" rows="3" value={data.step4_salidas_mejoras} onChange={e => updateData('step4_salidas_mejoras', e.target.value)}></textarea></div>
            <div className="form-group"><label className="form-label">b) Cualquier necesidad de cambio en el sistema de gestión de la calidad</label><textarea className="form-control" rows="3" value={data.step4_salidas_cambios} onChange={e => updateData('step4_salidas_cambios', e.target.value)}></textarea></div>
            <div className="form-group"><label className="form-label">c) Las necesidades de recursos</label><textarea className="form-control" rows="3" value={data.step4_salidas_recursos} onChange={e => updateData('step4_salidas_recursos', e.target.value)}></textarea></div>
          </div>
        );
      case 5:
        return (
          <div className="animate-fade-in delay-1">
            <h3 style={{color: 'var(--accent-color)', marginBottom: '16px'}}>Paso 5: Aprobación y Finalización</h3>
            <p style={{color: '#334155', marginBottom: '24px'}}>Revisión completa. La organización debe conservar información documentada como evidencia de los resultados (Cláusula 9.3.3 final).</p>
            
            <div style={{marginTop: '24px', padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px'}}>
              <label className="form-label" style={{display: 'flex', alignItems: 'center', gap: '8px', margin: 0, cursor: 'pointer'}}>
                <input type="checkbox" onChange={(e) => setSelectedReview({...selectedReview, status: e.target.checked ? 'Aprobada' : 'Borrador'})} checked={selectedReview.status === 'Aprobada'} />
                <span>Marcar como "Aprobada por la Gerencia General" (Finalizar)</span>
              </label>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const renderForm = () => (
    <div className="glass animate-fade-in" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>Asistente de Revisión por la Dirección</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>Completando período {selectedReview.year}</p>
        </div>
        <div className="badge badge-neutral">Paso {currentStep} de 5</div>
      </div>
      
      {/* Progress Bar */}
      <div style={{width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '32px', overflow: 'hidden'}}>
        <div style={{width: `${(currentStep / 5) * 100}%`, height: '100%', backgroundColor: 'var(--accent-color)', transition: 'width 0.3s ease'}}></div>
      </div>

      {renderWizardStep()}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
        <button className="btn btn-secondary" onClick={() => setViewMode('list')} style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1' }}>Cancelar</button>
        <div style={{ display: 'flex', gap: '12px' }}>
          {currentStep > 1 && (
            <button className="btn btn-secondary" onClick={() => setCurrentStep(currentStep - 1)} style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1' }}>
              <ChevronLeft size={18} /> Anterior
            </button>
          )}
          {currentStep < 5 ? (
            <button className="btn btn-primary" onClick={() => setCurrentStep(currentStep + 1)}>
              Siguiente <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ backgroundColor: '#16a34a' }}>
              <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Revisión'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderView = () => (
    <div className="glass animate-fade-in" style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <div className="printable-doc" style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', backgroundColor: 'white' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #0369a1', paddingBottom: '24px' }}>
          <h1 style={{ color: '#0369a1', margin: '0 0 8px 0' }}>INFORME DE REVISIÓN POR LA DIRECCIÓN</h1>
          <h3 style={{ color: '#64748b', margin: 0 }}>Período Analizado: {selectedReview.year}</h3>
          <p className="no-print" style={{ marginTop: '16px', fontWeight: 'bold', color: selectedReview.status === 'Aprobada' ? '#16a34a' : '#f97316' }}>ESTADO: {selectedReview.status.toUpperCase()}</p>
        </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--accent-color)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>1. Entradas de la Revisión (9.3.2)</h3>
        <h4 style={{ marginTop: '16px' }}>a) Estado de las Acciones de Revisiones Previas</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{selectedReview.data.step1_acciones}</p>
        <h4 style={{ marginTop: '16px' }}>b) Cambios en las cuestiones externas e internas</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{selectedReview.data.step1_contexto}</p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--accent-color)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>2. Desempeño y Eficacia del SGI (9.3.2 c)</h3>
        <h4 style={{ marginTop: '16px' }}>c.1) Satisfacción del Usuario y Partes Interesadas</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{selectedReview.data.step2_satisfaccion}</p>
        <h4 style={{ marginTop: '16px' }}>c.2) Grado en que se lograron los Objetivos</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{selectedReview.data.step2_objetivos}</p>
        <h4 style={{ marginTop: '16px' }}>c.3) Desempeño de Procesos</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{selectedReview.data.step2_procesos}</p>
        <h4 style={{ marginTop: '16px' }}>c.4) No Conformidades y Acciones Correctivas</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{selectedReview.data.step2_ncs}</p>
        <h4 style={{ marginTop: '16px' }}>c.5) Resultados de Seguimiento y Medición</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{selectedReview.data.step2_seguimiento}</p>
        <h4 style={{ marginTop: '16px' }}>c.6) Resultados de Auditorías</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{selectedReview.data.step2_auditorias}</p>
        <h4 style={{ marginTop: '16px' }}>c.7) Desempeño de Proveedores Externos</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{selectedReview.data.step2_proveedores}</p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--accent-color)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>3. Adecuación de Recursos y Eficacia (9.3.2 d, e, f)</h3>
        <h4 style={{ marginTop: '16px' }}>d) Adecuación de Recursos</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{selectedReview.data.step3_recursos}</p>
        <h4 style={{ marginTop: '16px' }}>e) Eficacia de Acciones para Abordar Riesgos y Oportunidades</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{selectedReview.data.step3_riesgos}</p>
        <h4 style={{ marginTop: '16px' }}>f) Oportunidades de Mejora (Entradas)</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{selectedReview.data.step3_mejoras}</p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--accent-color)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>4. Salidas de la Revisión por la Dirección (9.3.3)</h3>
        <h4 style={{ marginTop: '16px' }}>a) Decisiones/acciones sobre Oportunidades de Mejora</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{selectedReview.data.step4_salidas_mejoras}</p>
        <div style={{ backgroundColor: '#f0f9ff', borderLeft: '4px solid #0ea5e9', padding: '16px', marginTop: '24px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#0369a1' }}>b) Decisiones sobre Cambios en el SGC</h4>
          <p style={{ margin: 0, color: '#0c4a6e', fontWeight: '500' }}>{selectedReview.data.step4_salidas_cambios}</p>
        </div>
        <div style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#b91c1c' }}>c) Necesidades de Recursos</h4>
          <p style={{ margin: 0, color: '#7f1d1d', fontWeight: '500' }}>{selectedReview.data.step4_salidas_recursos}</p>
        </div>
      </div>
    </div>

    <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', gap: '16px' }}>
      <button className="btn btn-secondary" onClick={() => setViewMode('list')} style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1' }}>Volver al Listado</button>
      <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18}/> Imprimir Reporte Completo</button>
    </div>
  </div>
  );

  return (
    <div className="module-container">
      {renderTabs()}
      
      {activeTab === 'actas' && (
        <>
          {viewMode === 'list' && renderList()}
          {viewMode === 'form' && renderForm()}
          {viewMode === 'view' && renderView()}
        </>
      )}
      
      {activeTab === 'partes' && renderPartesTab()}
    </div>
  );
}

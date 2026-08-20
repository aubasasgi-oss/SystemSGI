import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Lock, ChevronRight, ChevronLeft, Save, Eye, Printer, CheckSquare } from 'lucide-react';

export const mockReviews = [
  {
    id: 'RD-2026',
    year: '2025-2026',
    status: 'Aprobada',
    date: '2026-04-30',
    participants: 'Gerente General, SGI y Todas las Gerencias',
    data: {
      step1_acciones: 'Se verifica el estado de las 17 acciones de mejora surgidas de la RD N°1 2025. La totalidad fue cerrada exitosamente.',
      step1_contexto: 'Político: Elecciones 2027. Económico: Plan de Inversiones $363.614M ARS. Tecnológico: Free Flow.',
      step2_satisfaccion: 'Funcionamiento TelePASE 62,38%. Controles alcoholemia 92,04%. Oportunidad en señalización vial.',
      step2_objetivos: 'Atención telefónica 55,44% vs 75%. Tiempo respuesta SVIA 100%. Reclamos Bernal 2,05 c/100k.',
      step2_procesos: '0 víctimas fatales (ISO 39001). TelePASE 89% participación. Resiliencia ante fallas CCM.',
      step2_ncs: 'No se han generado nuevas No Conformidades en 2026. Arrastre de 5 observaciones IRAM 2025 (Samborombón, Taller, Base Hudson).',
      step2_seguimiento: 'La disponibilidad de PMV es del 88,54% y la liberación de calzada del 84,47%.',
      step2_auditorias: '167 puntos evaluados. 160 conformes. 0 NC. 7 Observaciones.',
      step2_proveedores: '45 proveedores críticos evaluados con nota promedio ≥4,2.',
      step3_recursos: 'Asignación para Free Flow Dock Sud. Consolidación SharePoint SGI. Incorporación Coordinador Auditoría.',
      step3_riesgos: 'De 14 procesos, 11 sin materialización. 3 con acciones correctivas gestionadas con eficacia (Taller, CCM).',
      step3_mejoras: 'Implementar nuevo protocolo de triaje en CCM y reforzar cartelería.',
      step4_salidas_mejoras: 'Plan de reconversión laboral omnicanal (Q3 2026). Regularizar calibración en Taller (Q2 2026).',
      step4_salidas_cambios: 'El SGI requiere adaptación del alcance para incluir el sistema Free Flow en Dock Sud.',
      step4_salidas_recursos: 'Asignar presupuesto extraordinario para infraestructura en Taller y sistemas de contingencia.'
    }
  }
];

export default function ManagementReview() {
  const { userRole } = useAuth();
  const isSGI = userRole === 'SGI';
  
  const [activeTab, setActiveTab] = useState('actas'); // 'actas' or 'checklist'
  const [reviews, setReviews] = useState(mockReviews);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'form', 'view'
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedReview, setSelectedReview] = useState(null);

  // Standalone Checklist State
  const [checklistData, setChecklistData] = useState({
    year: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
    sindicato: false,
    ministerio: false,
    municipios: false,
    otros: false,
    otrosDetalle: '',
    firmaJSGI: ''
  });
  const [checklistError, setChecklistError] = useState('');

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

  const handleSave = () => {
    if (selectedReview.status === 'Borrador') {
      const existing = reviews.find(r => r.id === selectedReview.id);
      if (existing) {
        setReviews(reviews.map(r => r.id === selectedReview.id ? selectedReview : r));
      } else {
        setReviews([selectedReview, ...reviews]);
      }
    }
    setViewMode('list');
  };

  const updateData = (field, value) => {
    setSelectedReview({
      ...selectedReview,
      data: { ...selectedReview.data, [field]: value }
    });
  };

  const validateAndPrintChecklist = () => {
    if (!checklistData.sindicato || !checklistData.ministerio || !checklistData.municipios) {
      setChecklistError('Debe verificar la retroalimentación de Sindicato, Ministerio y Municipios obligatoriamente antes de imprimir el anexo oficial.');
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
        onClick={() => { setActiveTab('checklist'); setViewMode('list'); }}
        style={{
          padding: '12px 24px',
          backgroundColor: activeTab === 'checklist' ? 'white' : 'transparent',
          border: activeTab === 'checklist' ? '1px solid #e2e8f0' : 'none',
          borderBottom: activeTab === 'checklist' ? '1px solid white' : 'none',
          marginBottom: '-1px',
          borderRadius: '8px 8px 0 0',
          fontWeight: activeTab === 'checklist' ? 'bold' : 'normal',
          color: activeTab === 'checklist' ? '#0f172a' : '#64748b',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <CheckSquare size={18} /> Checklist Anexo IRAM
      </button>
    </div>
  );

  const renderChecklistTab = () => (
    <div className="animate-fade-in printable-doc">
      <div className="no-print module-header">
        <div>
          <h2>Checklist de Verificación de Entradas (PAU 09 Anexo)</h2>
          <p>Documento obligatorio previo a la Revisión por la Dirección para certificar la consideración de Partes Interesadas Externas (Obs. IRAM 83).</p>
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
          Se certifica por medio del presente anexo que, previo a la formalización del acta de Revisión por la Dirección correspondiente, se ha consolidado y evaluado formalmente la retroalimentación de las siguientes partes interesadas externas (Requisito 9.3.2 c.1):
        </p>
        
        <div className="no-print" style={{backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '24px', marginBottom: '32px'}}>
          <label style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer'}}>
            <input type="checkbox" style={{width: '20px', height: '20px'}} checked={checklistData.sindicato} onChange={(e) => setChecklistData({...checklistData, sindicato: e.target.checked})} />
            <span style={{fontSize: '16px'}}>Sindicato (Retroalimentación consolidada y evaluada)</span>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer'}}>
            <input type="checkbox" style={{width: '20px', height: '20px'}} checked={checklistData.ministerio} onChange={(e) => setChecklistData({...checklistData, ministerio: e.target.checked})} />
            <span style={{fontSize: '16px'}}>Ministerio de Infraestructura (Retroalimentación consolidada y evaluada)</span>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer'}}>
            <input type="checkbox" style={{width: '20px', height: '20px'}} checked={checklistData.municipios} onChange={(e) => setChecklistData({...checklistData, municipios: e.target.checked})} />
            <span style={{fontSize: '16px'}}>Municipios Linderos (Retroalimentación consolidada y evaluada)</span>
          </label>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
            <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'}}>
              <input type="checkbox" style={{width: '20px', height: '20px'}} checked={checklistData.otros} onChange={(e) => setChecklistData({...checklistData, otros: e.target.checked})} />
              <span style={{fontSize: '16px'}}>Otros:</span>
            </label>
            {checklistData.otros && (
              <input type="text" className="form-control" style={{flex: 1}} placeholder="Ej: Usuarios, Proveedores..." value={checklistData.otrosDetalle} onChange={(e) => setChecklistData({...checklistData, otrosDetalle: e.target.value})} />
            )}
          </div>
        </div>

        <table className="only-print print-table" style={{width: '100%', marginBottom: '40px', display: 'none'}}>
          <tbody>
            <tr>
              <td style={{width: '50px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px'}}>{checklistData.sindicato ? 'X' : ''}</td>
              <td style={{fontSize: '14px'}}>Sindicato (Retroalimentación consolidada y evaluada)</td>
            </tr>
            <tr>
              <td style={{width: '50px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px'}}>{checklistData.ministerio ? 'X' : ''}</td>
              <td style={{fontSize: '14px'}}>Ministerio de Infraestructura (Retroalimentación consolidada y evaluada)</td>
            </tr>
            <tr>
              <td style={{width: '50px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px'}}>{checklistData.municipios ? 'X' : ''}</td>
              <td style={{fontSize: '14px'}}>Municipios Linderos (Retroalimentación consolidada y evaluada)</td>
            </tr>
            {checklistData.otros && (
              <tr>
                <td style={{width: '50px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px'}}>X</td>
                <td style={{fontSize: '14px'}}>Otros: {checklistData.otrosDetalle}</td>
              </tr>
            )}
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
            {reviews.map(rev => (
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
            <button className="btn btn-primary" onClick={handleSave} style={{ backgroundColor: '#16a34a' }}>
              <Save size={18} /> Guardar Revisión
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
      
      {activeTab === 'checklist' && renderChecklistTab()}
    </div>
  );
}

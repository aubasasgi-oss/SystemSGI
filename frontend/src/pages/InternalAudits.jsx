import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Save, Printer, ChevronLeft, Trash2, Image as ImageIcon } from 'lucide-react';

export default function InternalAudits() {
  const { userRole, checkPermission } = useAuth();
  const isSGI = checkPermission('SGI');
  
  const [activeTab, setActiveTab] = useState('programa'); // 'programa', 'informes'
  const [viewMode, setViewMode] = useState('general'); // 'general', 'sectorial'
  const [isEditing, setIsEditing] = useState(false);

  // State for Programa General
  const [programa, setPrograma] = useState({
    year: '2026',
    objetivo: 'Verificar la adecuada implementación y desempeño del Sistema de Gestión Integrado de AUBASA conforme los requisitos de las normas ISO 9001 e ISO 39001, a fin de validar el ciclo de mejora y en preparación para la auditoría de seguimiento N° 1 a cargo de IRAM.\nIdentificar Oportunidades de Mejora',
    alcance: 'Se auditan los procesos y actividades de las Gerencias de Operaciones, Gerencia Comercial, Jefatura del CCM, Jefatura de Asistencia Vial y los procesos de soporte de la empresa, de acuerdo con el alcance definido en el Ap. 3.0 del Manual de Gestión.',
    criterios: 'La auditoría interna se realizará considerando como criterios la norma IRAM-ISO 9001:2015 e IRAM-ISO 39001:2015, los procedimientos internos del Sistema de Gestión Integrado (SGI) de AUBASA, los requisitos legales y reglamentarios aplicables...',
    firmaJefeSGI: '',
    firmaGerenteGeneral: '',
    sectores: [
      {
        id: '1', ps: '1', sector: 'Gerencia de Recursos Humanos', fecha: '25/03/26 -- 10:00/13:30 hs',
        documentos: 'Manual de Gestión; PAU/02; PAU/03; PAU/04; PAU/05; PAU/07; PAU/08; ITAU/04/05.',
        planSectorial: {
          responsable: '', auditor: '',
          procesos: [], firmaAuditor: ''
        }
      }
    ]
  });

  const [selectedSectorId, setSelectedSectorId] = useState(null);

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

  const addSector = () => {
    const newId = Date.now().toString();
    setPrograma(prev => ({
      ...prev,
      sectores: [...prev.sectores, {
        id: newId, ps: '', sector: 'Nuevo Sector', fecha: '', documentos: '',
        planSectorial: { responsable: '', auditor: '', procesos: [], firmaAuditor: '' }
      }]
    }));
  };

  const removeSector = (id) => {
    setPrograma(prev => ({
      ...prev,
      sectores: prev.sectores.filter(s => s.id !== id)
    }));
  };

  const updateSector = (id, field, value) => {
    setPrograma(prev => ({
      ...prev,
      sectores: prev.sectores.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const openSectorial = (id) => {
    if (isEditing) return; // Prevent opening while editing general
    setSelectedSectorId(id);
    setViewMode('sectorial');
  };

  const closeSectorial = () => {
    setSelectedSectorId(null);
    setViewMode('general');
    setIsEditing(false);
  };

  // Sectorial functions
  const getSelectedSector = () => programa.sectores.find(s => s.id === selectedSectorId);

  const updatePlanSectorial = (field, value) => {
    setPrograma(prev => ({
      ...prev,
      sectores: prev.sectores.map(s => {
        if (s.id === selectedSectorId) {
          return { ...s, planSectorial: { ...s.planSectorial, [field]: value } };
        }
        return s;
      })
    }));
  };

  const addProceso = () => {
    setPrograma(prev => ({
      ...prev,
      sectores: prev.sectores.map(s => {
        if (s.id === selectedSectorId) {
          return {
            ...s,
            planSectorial: {
              ...s.planSectorial,
              procesos: [...s.planSectorial.procesos, { proceso: '', req9001: '', req39001: '', docs: '', participantes: '' }]
            }
          };
        }
        return s;
      })
    }));
  };

  const removeProceso = (index) => {
    setPrograma(prev => ({
      ...prev,
      sectores: prev.sectores.map(s => {
        if (s.id === selectedSectorId) {
          const newProcesos = [...s.planSectorial.procesos];
          newProcesos.splice(index, 1);
          return { ...s, planSectorial: { ...s.planSectorial, procesos: newProcesos } };
        }
        return s;
      })
    }));
  };

  const updateProceso = (index, field, value) => {
    setPrograma(prev => ({
      ...prev,
      sectores: prev.sectores.map(s => {
        if (s.id === selectedSectorId) {
          const newProcesos = [...s.planSectorial.procesos];
          newProcesos[index][field] = value;
          return { ...s, planSectorial: { ...s.planSectorial, procesos: newProcesos } };
        }
        return s;
      })
    }));
  };

  const renderEditableText = (value, onChange, placeholder = "", isTextarea = false) => {
    if (isEditing) {
      if (isTextarea) {
        return <textarea className="form-control" style={{width: '100%', fontSize: '13px'}} rows="4" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
      }
      return <input type="text" className="form-control" style={{width: '100%', fontSize: '13px'}} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
    }
    return <span style={{whiteSpace: 'pre-wrap'}}>{value || placeholder}</span>;
  };

  const renderProgramaGeneral = () => (
    <div className="animate-fade-in">
      {/* HEADER DE LA VISTA */}
      <div className="no-print module-header glass" style={{ padding: '24px', marginBottom: '32px' }}>
        <div>
          <h2 style={{color: 'var(--accent-color)', margin: '0 0 4px 0', fontSize: '24px'}}>Programa General de Auditorías</h2>
          <p style={{color: 'var(--text-secondary)', margin: 0}}>PAU/07 Anexo 2 - Visualización y Edición de Documento</p>
        </div>
        <div style={{display: 'flex', gap: '12px'}}>
          {isSGI && (
            <button className={`btn ${isEditing ? 'btn-success' : 'btn-secondary'}`} onClick={() => setIsEditing(!isEditing)} style={isEditing ? {backgroundColor: '#16a34a', color: 'white'} : {}}>
              {isEditing ? <><Save size={18}/> Guardar Cambios</> : <><Edit2 size={18}/> Activar Edición</>}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18}/> Imprimir Programa</button>
        </div>
      </div>

      {/* DOCUMENTO HOJA A4 */}
      <div className="printable-doc" style={{ background: 'white', padding: '50px 60px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', maxWidth: '1000px', margin: '0 auto', border: isEditing ? '2px dashed var(--accent-color)' : '1px solid #e2e8f0', color: '#1e293b' }}>
        
        {/* ENCABEZADO FORMAL */}
        <div className="print-header" style={{ display: 'flex', border: '1px solid #000', marginBottom: '32px' }}>
          <div className="print-logo" style={{ width: '25%', borderRight: '1px solid #000', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
             <h2 style={{margin: 0, color: 'var(--accent-color)', fontSize: '28px', fontWeight: 800, letterSpacing: '-1px'}}>AUBASA</h2>
             <small style={{fontSize: '10px', textAlign: 'center', fontWeight: 600, color: '#475569', marginTop: '4px'}}>AUTOPISTAS DE BUENOS AIRES S.A.</small>
          </div>
          <div className="print-title" style={{ width: '50%', borderRight: '1px solid #000', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <strong style={{fontSize: '14px', color: '#64748b'}}>ANEXO 2</strong>
             <strong style={{fontSize: '18px', color: '#0f172a', marginTop: '6px', lineHeight: '1.3'}}>PROGRAMA GENERAL DE AUDITORIAS INTERNAS PERIODICAS</strong>
          </div>
          <div className="print-meta" style={{ width: '25%', padding: '12px 16px', fontSize: '11px', lineHeight: '1.8', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <div style={{display:'flex', justifyContent:'space-between'}}><strong>Código:</strong> <span>PAU/07- A2</span></div>
             <div style={{display:'flex', justifyContent:'space-between'}}><strong>Revisión:</strong> <span>03</span></div>
             <div style={{display:'flex', justifyContent:'space-between'}}><strong>Fecha:</strong> <span>24.feb.2026</span></div>
             <div style={{display:'flex', justifyContent:'space-between'}}><strong>Página:</strong> <span>1 de 21</span></div>
          </div>
        </div>

        {/* CUERPO DEL DOCUMENTO */}
        <div className="print-section" style={{marginBottom: '40px'}}>
          <div style={{ fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '8px 12px', borderLeft: '4px solid var(--accent-color)', color: '#0f172a', marginBottom: '12px', fontSize: '14px' }}>OBJETIVO DEL PROGRAMA DE AUDITORIA</div>
          <div style={{ padding: '0 16px', fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '24px' }}>{renderEditableText(programa.objetivo, (val) => setPrograma({...programa, objetivo: val}), "Escriba el objetivo...", true)}</div>
          
          <div style={{ fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '8px 12px', borderLeft: '4px solid var(--accent-color)', color: '#0f172a', marginBottom: '12px', fontSize: '14px' }}>ALCANCE</div>
          <div style={{ padding: '0 16px', fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '24px' }}>{renderEditableText(programa.alcance, (val) => setPrograma({...programa, alcance: val}), "Escriba el alcance...", true)}</div>
          
          <div style={{ fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '8px 12px', borderLeft: '4px solid var(--accent-color)', color: '#0f172a', marginBottom: '12px', fontSize: '14px' }}>CRITERIOS</div>
          <div style={{ padding: '0 16px', fontSize: '14px', lineHeight: '1.7', color: '#334155' }}>{renderEditableText(programa.criterios, (val) => setPrograma({...programa, criterios: val}), "Escriba los criterios...", true)}</div>
        </div>

        {/* TABLA DE SECTORES */}
        <div style={{ fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '8px 12px', borderLeft: '4px solid var(--accent-color)', color: '#0f172a', marginBottom: '16px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>AGENDA DETALLADA POR SECTORES</span>
          {isEditing && <button className="btn btn-primary no-print" onClick={addSector} style={{padding: '4px 12px', fontSize: '12px'}}><Plus size={14}/> Agregar Sector</button>}
        </div>
        
        <table className="print-table" style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '13px'}}>
          <thead>
            <tr style={{backgroundColor: '#f1f5f9'}}>
              <th style={{border: '1px solid #cbd5e1', padding: '10px', width: '5%', textAlign: 'center', color: '#475569'}}>PS</th>
              <th style={{border: '1px solid #cbd5e1', padding: '10px', width: '25%', color: '#475569'}}>SECTOR</th>
              <th style={{border: '1px solid #cbd5e1', padding: '10px', width: '30%', color: '#475569'}}>FECHA Y HORA (INICIO-CIERRE)</th>
              <th style={{border: '1px solid #cbd5e1', padding: '10px', width: '35%', color: '#475569'}}>DOCUMENTOS APLICABLES</th>
              {isEditing && <th className="no-print" style={{border: '1px solid #cbd5e1', padding: '10px', width: '5%', textAlign: 'center'}}>X</th>}
            </tr>
          </thead>
          <tbody>
            {programa.sectores.map((s, idx) => (
              <tr key={s.id} onClick={() => openSectorial(s.id)} style={{cursor: isEditing ? 'default' : 'pointer', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc'}} className={!isEditing ? "hover-row" : ""}>
                <td style={{border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center'}}>{renderEditableText(s.ps, (v) => updateSector(s.id, 'ps', v), "1")}</td>
                <td style={{border: '1px solid #cbd5e1', padding: '10px'}}><strong>{renderEditableText(s.sector, (v) => updateSector(s.id, 'sector', v), "Gerencia...")}</strong></td>
                <td style={{border: '1px solid #cbd5e1', padding: '10px'}}>{renderEditableText(s.fecha, (v) => updateSector(s.id, 'fecha', v), "DD/MM/AA -- HH:MM")}</td>
                <td style={{border: '1px solid #cbd5e1', padding: '10px', fontSize: '12px', color: '#475569'}}>{renderEditableText(s.documentos, (v) => updateSector(s.id, 'documentos', v), "Docs...", true)}</td>
                {isEditing && (
                  <td className="no-print" style={{border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center'}}>
                    <button className="btn btn-icon" onClick={(e) => { e.stopPropagation(); removeSector(s.id); }} style={{color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer'}}><Trash2 size={16}/></button>
                  </td>
                )}
              </tr>
            ))}
            {!isEditing && programa.sectores.length === 0 && <tr><td colSpan="4" style={{border: '1px solid #cbd5e1', padding: '16px', textAlign:'center', color: '#94a3b8'}}>No hay sectores agregados.</td></tr>}
          </tbody>
        </table>

        {/* FIRMAS */}
        <div className="print-signatures" style={{marginTop: '60px', display: 'flex', justifyContent: 'space-around', padding: '0 20px'}}>
          <div style={{textAlign: 'center', width: '250px'}}>
            <div style={{height: '90px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '12px'}}>
              {programa.firmaJefeSGI ? (
                <div style={{position: 'relative'}}>
                  <img src={programa.firmaJefeSGI} alt="Firma SGI" style={{maxHeight: '80px', maxWidth: '200px'}} />
                  {isEditing && <button onClick={() => setPrograma({...programa, firmaJefeSGI: ''})} className="btn btn-icon no-print" style={{position: 'absolute', top: '-10px', right: '-20px', color: '#ef4444', background: 'white', borderRadius: '50%', padding: '2px'}} title="Eliminar Firma"><Trash2 size={14}/></button>}
                </div>
              ) : (isEditing || isSGI) ? (
                <label className="btn btn-secondary no-print" style={{fontSize: '12px', padding: '6px 12px', cursor: 'pointer', backgroundColor: '#f8fafc', border: '1px dashed #94a3b8', color: '#64748b'}}>
                  <ImageIcon size={14}/> Subir Firma <input type="file" accept="image/*" style={{display:'none'}} onChange={(e) => handleImageUpload(e, (res) => setPrograma({...programa, firmaJefeSGI: res}))} />
                </label>
              ) : <span style={{color: '#94a3b8', fontSize: '12px'}}>Firma Pendiente</span>}
            </div>
            <div style={{borderTop: '1px solid #334155', paddingTop: '12px', fontWeight: 600, fontSize: '13px'}}>Jefe de Sistema de Gestión<br/><span style={{color: '#64748b'}}>PROPONE</span></div>
          </div>

          <div style={{textAlign: 'center', width: '250px'}}>
            <div style={{height: '90px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '12px'}}>
              {programa.firmaGerenteGeneral ? (
                <div style={{position: 'relative'}}>
                  <img src={programa.firmaGerenteGeneral} alt="Firma GG" style={{maxHeight: '80px', maxWidth: '200px'}} />
                  {isEditing && <button onClick={() => setPrograma({...programa, firmaGerenteGeneral: ''})} className="btn btn-icon no-print" style={{position: 'absolute', top: '-10px', right: '-20px', color: '#ef4444', background: 'white', borderRadius: '50%', padding: '2px'}} title="Eliminar Firma"><Trash2 size={14}/></button>}
                </div>
              ) : (isEditing || isSGI) ? (
                <label className="btn btn-secondary no-print" style={{fontSize: '12px', padding: '6px 12px', cursor: 'pointer', backgroundColor: '#f8fafc', border: '1px dashed #94a3b8', color: '#64748b'}}>
                  <ImageIcon size={14}/> Subir Firma <input type="file" accept="image/*" style={{display:'none'}} onChange={(e) => handleImageUpload(e, (res) => setPrograma({...programa, firmaGerenteGeneral: res}))} />
                </label>
              ) : <span style={{color: '#cbd5e1', fontSize: '12px'}}>Firma Pendiente</span>}
            </div>
            <div style={{borderTop: '1px solid #334155', paddingTop: '12px', fontWeight: 600, fontSize: '13px'}}>Gerente General<br/><span style={{color: '#64748b'}}>AUTORIZA</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlanSectorial = () => {
    const sector = getSelectedSector();
    if (!sector) return null;
    const p = sector.planSectorial;
    
    return (
      <div className="animate-fade-in">
        <div className="no-print module-header glass" style={{ padding: '24px', marginBottom: '32px' }}>
          <div>
            <h2 style={{color: 'var(--accent-color)', margin: '0 0 4px 0', fontSize: '24px'}}>Plan Sectorial: {sector.sector}</h2>
            <p style={{color: 'var(--text-secondary)', margin: 0}}>PAU/07 Anexo 3 - Detalle de procesos a auditar</p>
          </div>
          <div style={{display: 'flex', gap: '12px'}}>
            <button className="btn btn-secondary" onClick={closeSectorial} disabled={isEditing}><ChevronLeft size={18}/> Volver al General</button>
            {isSGI && (
              <button className={`btn ${isEditing ? 'btn-success' : 'btn-secondary'}`} onClick={() => setIsEditing(!isEditing)} style={isEditing ? {backgroundColor: '#16a34a', color: 'white'} : {}}>
                {isEditing ? <><Save size={18}/> Guardar Cambios</> : <><Edit2 size={18}/> Activar Edición</>}
              </button>
            )}
            <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18}/> Imprimir Plan</button>
          </div>
        </div>

        <div className="printable-doc" style={{ background: 'white', padding: '50px 60px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', maxWidth: '1000px', margin: '0 auto', border: isEditing ? '2px dashed var(--accent-color)' : '1px solid #e2e8f0', color: '#1e293b' }}>
          
          <div className="print-header" style={{ display: 'flex', border: '1px solid #000', marginBottom: '32px' }}>
            <div className="print-logo" style={{ width: '25%', borderRight: '1px solid #000', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h2 style={{margin: 0, color: 'var(--accent-color)', fontSize: '28px', fontWeight: 800, letterSpacing: '-1px'}}>AUBASA</h2>
              <small style={{fontSize: '10px', textAlign: 'center', fontWeight: 600, color: '#475569', marginTop: '4px'}}>AUTOPISTAS DE BUENOS AIRES S.A.</small>
            </div>
            <div className="print-title" style={{ width: '50%', borderRight: '1px solid #000', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <strong style={{fontSize: '14px', color: '#64748b'}}>ANEXO 3</strong>
              <strong style={{fontSize: '18px', color: '#0f172a', marginTop: '6px', lineHeight: '1.3'}}>PLAN SECTORIAL DE AUDITORIA INTERNA</strong>
            </div>
            <div className="print-meta" style={{ width: '25%', padding: '12px 16px', fontSize: '11px', lineHeight: '1.8', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{display:'flex', justifyContent:'space-between'}}><strong>Código:</strong> <span>PAU/07- A3</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><strong>Revisión:</strong> <span>03</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><strong>Fecha:</strong> <span>{sector.fecha.split(' ')[0] || 'DD/MM/AA'}</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><strong>Página:</strong> <span>1 de 1</span></div>
            </div>
          </div>

          <div style={{backgroundColor: '#0f172a', color: 'white', padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px'}}>PLAN SECTORIAL DE AUDITORIA INTERNA</div>
          <div style={{backgroundColor: '#334155', color: 'white', padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', marginBottom: '16px'}}>PS {sector.ps} - SECTOR, RESPONSABLES, FECHA Y HORA</div>
          
          <table className="print-table" style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', marginBottom: '24px'}}>
            <tbody>
              <tr>
                <td style={{width: '33%', border: '1px solid #cbd5e1', padding: '12px'}}>
                  <strong style={{color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '4px'}}>Sector por auditar:</strong>
                  <span style={{fontSize: '14px', fontWeight: 600}}>{sector.sector}</span>
                </td>
                <td style={{width: '33%', border: '1px solid #cbd5e1', padding: '12px'}}>
                  <strong style={{color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '4px'}}>Responsable:</strong>
                  {renderEditableText(p.responsable, (v) => updatePlanSectorial('responsable', v), "Nombre del Responsable")}
                </td>
                <td style={{width: '34%', border: '1px solid #cbd5e1', padding: '12px'}}>
                  <strong style={{color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '4px'}}>Fecha/Hora:</strong>
                  <span style={{fontSize: '14px'}}>{sector.fecha}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{backgroundColor: '#334155', color: 'white', padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px'}}>EQUIPO AUDITOR</div>
          <div style={{border: '1px solid #cbd5e1', padding: '16px', marginBottom: '24px'}}>
            <strong style={{color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '4px'}}>Auditor Interno:</strong>
            {renderEditableText(p.auditor, (v) => updatePlanSectorial('auditor', v), "Nombres de los auditores")}
          </div>

          <div style={{backgroundColor: '#f8fafc', borderLeft: '4px solid var(--accent-color)', padding: '12px 16px', fontSize: '13px', color: '#475569', marginBottom: '24px'}}>
            Se auditan los procesos y actividades del Sistema de Gestión Integrado, de acuerdo con el alcance definido en el Ap. 3.0 del Manual de Gestión.
          </div>
          
          <div style={{backgroundColor: '#0f172a', color: 'white', padding: '8px', fontWeight: 'bold', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{marginLeft: '12px'}}>DETALLE DEL PLAN DE LA AUDITORIA</span>
            {isEditing && <button className="btn btn-primary no-print" onClick={addProceso} style={{padding: '4px 10px', fontSize: '12px', background: 'var(--accent-color)'}}><Plus size={14}/> Agregar Proceso</button>}
          </div>
          
          <table className="print-table" style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '12px', marginBottom: '32px'}}>
            <thead>
              <tr style={{backgroundColor: '#f1f5f9'}}>
                <th rowSpan="2" style={{border: '1px solid #cbd5e1', padding: '10px', width: '25%', color: '#475569'}}>PROCESO</th>
                <th colSpan="2" style={{border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#475569'}}>REQUISITO NORMATIVO</th>
                <th rowSpan="2" style={{border: '1px solid #cbd5e1', padding: '10px', width: '30%', color: '#475569'}}>DOCUMENTOS APLICABLES</th>
                <th rowSpan="2" style={{border: '1px solid #cbd5e1', padding: '10px', width: '20%', color: '#475569'}}>PARTICIPAN</th>
                {isEditing && <th rowSpan="2" className="no-print" style={{border: '1px solid #cbd5e1', width: '5%'}}>X</th>}
              </tr>
              <tr style={{backgroundColor: '#f1f5f9'}}>
                <th style={{border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#475569'}}>ISO 9001</th>
                <th style={{border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#475569'}}>ISO 39001</th>
              </tr>
            </thead>
            <tbody>
              {p.procesos.map((proc, idx) => (
                <tr key={idx} style={{backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc'}}>
                  <td style={{border: '1px solid #cbd5e1', padding: '10px'}}><strong>{renderEditableText(proc.proceso, (v) => updateProceso(idx, 'proceso', v), "Proceso...")}</strong></td>
                  <td style={{border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 'bold'}}>{renderEditableText(proc.req9001, (v) => updateProceso(idx, 'req9001', v), "4.1")}</td>
                  <td style={{border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 'bold'}}>{renderEditableText(proc.req39001, (v) => updateProceso(idx, 'req39001', v), "4.1")}</td>
                  <td style={{border: '1px solid #cbd5e1', padding: '10px', whiteSpace: 'pre-wrap'}}>{renderEditableText(proc.docs, (v) => updateProceso(idx, 'docs', v), "Documentos...", true)}</td>
                  <td style={{border: '1px solid #cbd5e1', padding: '10px', whiteSpace: 'pre-wrap'}}>{renderEditableText(proc.participantes, (v) => updateProceso(idx, 'participantes', v), "Participantes...", true)}</td>
                  {isEditing && (
                    <td className="no-print" style={{border: '1px solid #cbd5e1', textAlign: 'center'}}>
                      <button className="btn btn-icon" onClick={() => removeProceso(idx)} style={{color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer'}}><Trash2 size={16}/></button>
                    </td>
                  )}
                </tr>
              ))}
              {!isEditing && p.procesos.length === 0 && <tr><td colSpan="5" style={{border: '1px solid #cbd5e1', padding: '16px', textAlign:'center', color: '#94a3b8'}}>No hay procesos detallados.</td></tr>}
            </tbody>
          </table>

          <div style={{backgroundColor: '#334155', color: 'white', padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px'}}>DOCUMENTACIÓN BASE PARA AUDITORIA</div>
          <table className="print-table" style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '12px', marginBottom: '40px'}}>
            <tbody>
              <tr>
                <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', width: '50%'}}>Manual de Gestión</td>
                <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', width: '50%'}}>PAU/05</td>
              </tr>
              <tr style={{backgroundColor: '#f8fafc'}}>
                <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center'}}>PAU/01</td>
                <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center'}}>PAU/06</td>
              </tr>
              <tr>
                <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center'}}>PAU/02 a PAU/04</td>
                <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center'}}>PAU/07 a PAU/09</td>
              </tr>
            </tbody>
          </table>

          <div style={{display: 'flex', justifyContent: 'center'}}>
            <div style={{width: '300px'}}>
              <div style={{backgroundColor: '#0f172a', color: 'white', padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px'}}>APRUEBA</div>
              <div style={{border: '1px solid #cbd5e1', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '12px', position: 'relative', backgroundColor: '#f8fafc'}}>
                {p.firmaAuditor ? (
                  <div style={{position: 'absolute', bottom: '30px'}}>
                    <img src={p.firmaAuditor} alt="Firma Auditor" style={{maxHeight: '70px', maxWidth: '250px'}} />
                    {isEditing && <button onClick={() => updatePlanSectorial('firmaAuditor', '')} className="btn btn-icon no-print" style={{position: 'absolute', top: '-10px', right: '-20px', color: '#ef4444', background: 'white', borderRadius: '50%', padding: '2px'}} title="Eliminar Firma"><Trash2 size={14}/></button>}
                  </div>
                ) : (isEditing || isSGI) ? (
                  <label className="btn btn-secondary no-print" style={{fontSize: '12px', padding: '6px 12px', cursor: 'pointer', position: 'absolute', bottom: '40px', backgroundColor: '#ffffff', border: '1px dashed #94a3b8', color: '#64748b'}}>
                    <ImageIcon size={14}/> Subir Firma <input type="file" accept="image/*" style={{display:'none'}} onChange={(e) => handleImageUpload(e, (res) => updatePlanSectorial('firmaAuditor', res))} />
                  </label>
                ) : <span style={{color: '#94a3b8', fontSize: '12px', position: 'absolute', bottom: '40px'}}>Firma Pendiente</span>}
                <span style={{borderTop: '1px solid #334155', width: '250px', textAlign: 'center', paddingTop: '8px', fontWeight: 600, fontSize: '13px', color: '#1e293b'}}>AUDITOR - RESPONSABLE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="module-container">
      <div className="no-print">
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '32px' }}>
          <button 
            className={`tab-btn ${activeTab === 'programa' ? 'active' : ''}`}
            onClick={() => { setActiveTab('programa'); setViewMode('general'); setIsEditing(false); }}
            style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'programa' ? '2px solid var(--accent-color)' : '2px solid transparent', color: activeTab === 'programa' ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}
          >
            Programa Anual de Auditorías
          </button>
        </div>
      </div>

      {activeTab === 'programa' && viewMode === 'general' && renderProgramaGeneral()}
      {activeTab === 'programa' && viewMode === 'sectorial' && renderPlanSectorial()}
    </div>
  );
}

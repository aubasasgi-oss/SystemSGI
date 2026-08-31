import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Edit2, Lock, Plus, CheckCircle, AlertTriangle, AlertOctagon, Download, CheckSquare, Printer, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { listarRiesgos, guardarRiesgo, eliminarRiesgo } from '../lib/risksApi';

const SECTORES = [
  "Todos", "Gerencia de Operaciones", "Gerencia Comercial", "Asistencia Vial",
  "Mantenimiento", "SGI", "Recursos Humanos", "Sistemas", "Asuntos Legales", "Gerencia de Compras"
];

const CONCESIONES = ["BALP", "SVIA", "BALP-SVIA"];

const PROBABILIDAD_OPCIONES = [
  { value: 1, label: 'Improbable' },
  { value: 2, label: 'Muy Poco Probable' },
  { value: 3, label: 'Poco Probable' },
  { value: 4, label: 'Probable' },
  { value: 5, label: 'Muy Probable' },
];

const IMPACTO_OPCIONES = [
  { value: 1, label: 'Insignificante' },
  { value: 2, label: 'Menor' },
  { value: 3, label: 'Moderado' },
  { value: 4, label: 'Mayor' },
  { value: 5, label: 'Extremo' },
];

// Bloque de lectura para la vista de detalle (clic en una fila): agrupa
// campos relacionados en secciones con títulos, en vez del formulario de
// edición con inputs, para que se lea como una ficha y no como un form vacío.
const DetailSeccion = ({ titulo, children, ultima }) => (
  <div style={{ marginBottom: ultima ? 0 : '28px', paddingBottom: ultima ? 0 : '28px', borderBottom: ultima ? 'none' : '1px solid var(--border-color)' }}>
    <h4 style={{ color: '#64748b', marginBottom: '16px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{titulo}</h4>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
      {children}
    </div>
  </div>
);

const DetailCampo = ({ label, valor, ancho }) => (
  <div style={{ gridColumn: ancho === 'full' ? '1 / -1' : 'auto' }}>
    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{valor || <span style={{ color: '#cbd5e1' }}>-</span>}</div>
  </div>
);


export default function Risks() {
  const { userRole, userSector } = useAuth();
  const isSGI = userRole === 'SGI';
  const [activeTab, setActiveTab] = useState('matriz'); // 'matriz' or 'validacion'
  const [risks, setRisks] = useState([]);
  const [loadingRisks, setLoadingRisks] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [filterYear, setFilterYear] = useState(2026);
  // Si no es SGI, forzar el filtro a su propio sector
  const [filterSector, setFilterSector] = useState(isSGI ? "Todos" : userSector);
  const [closureAlert, setClosureAlert] = useState(false);

  // Validation Checklist State
  const [validationData, setValidationData] = useState({
    year: 2026,
    sindicato: false,
    usuarios: false,
    proveedores: false,
    emergencias: false,
    firmaJSGI: ''
  });
  const [validationError, setValidationError] = useState('');

  const cargarRiesgos = () => {
    setLoadingRisks(true);
    listarRiesgos()
      .then(setRisks)
      .catch(err => { console.error(err); setRisks([]); })
      .finally(() => setLoadingRisks(false));
  };

  useEffect(() => {
    cargarRiesgos();
  }, []);

  // Check closure alert
  useEffect(() => {
    const today = new Date();
    const isDecember = today.getMonth() === 11;
    if (isDecember && !isSGI) {
      const pendingClosure = risks.filter(r => r.año === filterYear && r.sector === userSector && !r.eficacia);
      if (pendingClosure.length > 0) {
        setClosureAlert(true);
      } else {
        setClosureAlert(false);
      }
    }
  }, [risks, filterYear, userSector, isSGI]);

  const filteredRisks = risks.filter(r => {
    const matchesSearch = r.riesgo.toLowerCase().includes(searchTerm.toLowerCase()) || (r.proceso || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = r.año === filterYear;
    const matchesSector = filterSector === "Todos" ? true : r.sector === filterSector;
    return matchesSearch && matchesYear && matchesSector;
  });

  const canEdit = (sector) => {
    if (userRole === 'SGI') return true;
    if (userSector === sector) return true;
    return false;
  };

  const [saving, setSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    guardarRiesgo(selectedRisk)
      .then(() => {
        cargarRiesgos();
        setViewMode('table');
      })
      .catch(err => alert('Error al guardar el riesgo: ' + err.message))
      .finally(() => setSaving(false));
  };

  const handleDelete = (risk) => {
    if (!window.confirm(`¿Eliminar el riesgo ${risk.id}? Esta acción no se puede deshacer.`)) return;
    eliminarRiesgo(risk.id)
      .then(cargarRiesgos)
      .catch(err => alert('Error al eliminar: ' + err.message));
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

  const validateAndPrintChecklist = () => {
    if (!validationData.sindicato || !validationData.usuarios || !validationData.proveedores || !validationData.emergencias) {
      setValidationError('Debe tildar todas las verificaciones para certificar que la matriz operativa cruzó variables estratégicas.');
      return;
    }
    if (!validationData.firmaJSGI) {
      setValidationError('Debe adjuntar la firma del JSGI para validar el checklist oficial.');
      return;
    }
    setValidationError('');
    window.print();
  };

  const getNivelBadge = (p, i) => {
    const n = p * i;
    let label = 'BAJA';
    let color = '#8dc63f';
    let bg = '#f0fdf4';
    if (n >= 15) { label = 'MUY ALTA'; color = '#ef4444'; bg = '#fef2f2'; }
    else if (n >= 10) { label = 'ALTA'; color = '#f97316'; bg = '#fff7ed'; }
    else if (n >= 6) { label = 'MEDIA'; color = '#eab308'; bg = '#fefce8'; }
    return <span className="badge" style={{backgroundColor: bg, color: color, fontSize: '11px'}}>{n} ({label})</span>;
  };
  
  const getReevaluarText = (p, i) => {
    const n = p * i;
    if (n > 9) return <span style={{color: '#dc2626', fontWeight: 'bold'}}>⚠️ REEVALUAR</span>;
    return <span style={{color: '#16a34a', fontWeight: '500'}}>NO REEVALUAR</span>;
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a3'); // A3 for massive columns
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 160); // Azul AUBASA
    doc.text(`AUBASA - Matriz de Riesgos Operativos (${filterYear})`, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha de exportación: ${new Date().toLocaleDateString()} | Sector: ${filterSector}`, 14, 30);

    const tableColumn = [
      "ID", "Riesgo", "Causas", "Consecuencias", "Inherente (PxI)", 
      "Decisión", "Plan de Acción", "Resp.", "Residual (PxI)", "Reevaluar", "¿Ocurrió?", "Eficacia"
    ];
    const tableRows = [];

    filteredRisks.forEach(item => {
      const inh = item.probabilidad * item.impacto;
      const res = item.probabilidadResidual * item.impactoResidual;
      
      const itemData = [
        item.id,
        item.riesgo,
        item.causas,
        item.consecuencias,
        `${inh}`,
        item.decision,
        item.planAccion,
        item.responsable,
        `${res}`,
        res > 9 ? 'REEVALUAR' : 'NO REEVALUAR',
        item.ocurrio,
        item.eficacia
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 160], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: {
        4: { fontStyle: 'bold', halign: 'center' }, // Inherente
        8: { fontStyle: 'bold', halign: 'center' }, // Residual
        9: { fontStyle: 'bold', halign: 'center' }, // Reevaluar
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 9) {
          if (data.cell.raw === 'REEVALUAR') { data.cell.styles.textColor = [239, 68, 68]; }
          else { data.cell.styles.textColor = [34, 197, 94]; }
        }
      }
    });

    doc.save('AUBASA_Matriz_Riesgos.pdf');
  };

  const renderTabs = () => (
    <div className="no-print" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
      <button 
        onClick={() => { setActiveTab('matriz'); setViewMode('table'); }}
        style={{
          padding: '12px 24px',
          backgroundColor: activeTab === 'matriz' ? 'white' : 'transparent',
          border: activeTab === 'matriz' ? '1px solid #e2e8f0' : 'none',
          borderBottom: activeTab === 'matriz' ? '1px solid white' : 'none',
          marginBottom: '-1px',
          borderRadius: '8px 8px 0 0',
          fontWeight: activeTab === 'matriz' ? 'bold' : 'normal',
          color: activeTab === 'matriz' ? '#0f172a' : '#64748b',
          cursor: 'pointer'
        }}
      >
        Matriz Operativa
      </button>
      <button 
        onClick={() => { setActiveTab('validacion'); }}
        style={{
          padding: '12px 24px',
          backgroundColor: activeTab === 'validacion' ? 'white' : 'transparent',
          border: activeTab === 'validacion' ? '1px solid #e2e8f0' : 'none',
          borderBottom: activeTab === 'validacion' ? '1px solid white' : 'none',
          marginBottom: '-1px',
          borderRadius: '8px 8px 0 0',
          fontWeight: activeTab === 'validacion' ? 'bold' : 'normal',
          color: activeTab === 'validacion' ? '#0f172a' : '#64748b',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <CheckSquare size={18} /> Validación Cruzada IRAM
      </button>
    </div>
  );

  const renderValidationTab = () => (
    <div className="animate-fade-in printable-doc">
      <div className="no-print module-header">
        <div>
          <h2>Protocolo de Revisión Cruzada Obligatoria</h2>
          <p>Checklist de validación de integridad para la Matriz de Riesgos Operativos (Obs. IRAM 85).</p>
        </div>
        <button className="btn btn-primary" onClick={validateAndPrintChecklist}>
          <Printer size={18}/> Imprimir Anexo
        </button>
      </div>

      <div className="glass" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #0369a1', paddingBottom: '24px' }}>
          <h2 style={{ color: '#0369a1', margin: '0 0 8px 0' }}>PROTOCOLO DE REVISIÓN CRUZADA DE RIESGOS</h2>
          <h4 style={{ color: '#64748b', margin: 0 }}>Anexo Complementario a la Matriz Operativa Anual</h4>
        </div>
        
        <div className="no-print form-group" style={{ marginBottom: '32px' }}>
          <label className="form-label">Período de la Matriz Validada:</label>
          <input type="number" className="form-control" style={{maxWidth: '200px'}} value={validationData.year} onChange={(e) => setValidationData({...validationData, year: Number(e.target.value)})} />
        </div>

        <p className="only-print" style={{ display: 'none', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6'}}>
          <strong>Matriz Analizada Correspondiente al Año: {validationData.year}</strong>
        </p>

        <p style={{marginBottom: '24px', fontSize: '14px', lineHeight: '1.6'}}>
          Con el fin de asegurar la integridad, coherencia y el análisis técnico completo en la matriz de gestión de riesgos operativos de los sectores (cláusula 6.1), se certifica por medio del presente documento que la Matriz Operativa ha contemplado debidamente lo siguiente:
        </p>
        
        <div className="no-print" style={{backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '24px', marginBottom: '32px'}}>
          <label style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer'}}>
            <input type="checkbox" style={{width: '20px', height: '20px'}} checked={validationData.sindicato} onChange={(e) => setValidationData({...validationData, sindicato: e.target.checked})} />
            <span style={{fontSize: '16px'}}>Riesgos operativos con impacto o relación al <strong>Sindicato</strong> evaluados.</span>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer'}}>
            <input type="checkbox" style={{width: '20px', height: '20px'}} checked={validationData.usuarios} onChange={(e) => setValidationData({...validationData, usuarios: e.target.checked})} />
            <span style={{fontSize: '16px'}}>Riesgos operativos con impacto o relación a los <strong>Usuarios</strong> evaluados.</span>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer'}}>
            <input type="checkbox" style={{width: '20px', height: '20px'}} checked={validationData.proveedores} onChange={(e) => setValidationData({...validationData, proveedores: e.target.checked})} />
            <span style={{fontSize: '16px'}}>Riesgos operativos con impacto o relación a los <strong>Proveedores</strong> evaluados.</span>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer'}}>
            <input type="checkbox" style={{width: '20px', height: '20px'}} checked={validationData.emergencias} onChange={(e) => setValidationData({...validationData, emergencias: e.target.checked})} />
            <span style={{fontSize: '16px'}}>Riesgos operativos críticos: <strong>Contingencia de derrame de sustancias peligrosas</strong> (Asistencia Vial) evaluado.</span>
          </label>
        </div>

        <table className="only-print print-table" style={{width: '100%', marginBottom: '40px', display: 'none'}}>
          <tbody>
            <tr>
              <td style={{width: '50px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px'}}>{validationData.sindicato ? 'X' : ''}</td>
              <td style={{fontSize: '14px'}}>Riesgos operativos con impacto o relación al Sindicato evaluados.</td>
            </tr>
            <tr>
              <td style={{width: '50px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px'}}>{validationData.usuarios ? 'X' : ''}</td>
              <td style={{fontSize: '14px'}}>Riesgos operativos con impacto o relación a los Usuarios evaluados.</td>
            </tr>
            <tr>
              <td style={{width: '50px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px'}}>{validationData.proveedores ? 'X' : ''}</td>
              <td style={{fontSize: '14px'}}>Riesgos operativos con impacto o relación a los Proveedores evaluados.</td>
            </tr>
            <tr>
              <td style={{width: '50px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px'}}>{validationData.emergencias ? 'X' : ''}</td>
              <td style={{fontSize: '14px'}}>Riesgos operativos críticos: Contingencia de derrame de sustancias peligrosas (Asistencia Vial) evaluado.</td>
            </tr>
          </tbody>
        </table>

        <div style={{marginTop: '32px', paddingTop: '24px'}}>
          <h4 className="no-print" style={{margin: '0 0 16px 0'}}>Firma del Responsable (JSGI)</h4>
          {validationData.firmaJSGI ? (
            <div style={{width: '300px'}}>
              <img src={validationData.firmaJSGI} alt="Firma JSGI" style={{maxHeight: '100px', display: 'block', marginBottom: '8px'}} />
              <div style={{borderTop: '1px solid black', paddingTop: '8px', fontWeight: 'bold', fontSize: '14px'}}>Firma Responsable SGI</div>
              <button className="no-print btn btn-secondary" style={{marginTop: '12px'}} onClick={() => setValidationData({...validationData, firmaJSGI: ''})}>Eliminar Firma</button>
            </div>
          ) : (
            <label className="no-print btn btn-secondary" style={{cursor: 'pointer', display: 'inline-block'}}>
              Subir Firma Escaneada
              <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => handleImageUpload(e, (res) => setValidationData({...validationData, firmaJSGI: res}))} />
            </label>
          )}
        </div>
        {validationError && <div className="no-print" style={{color: '#dc2626', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', marginTop: '16px', border: '1px solid #fecaca'}}>{validationError}</div>}
      </div>
    </div>
  );

  return (
    <div className="module-container">
      {renderTabs()}

      {activeTab === 'matriz' && (
        <>
          {viewMode === 'table' && (
            <>
              <div className="module-header animate-fade-in">
                <div>
                  <h2>Matriz de Riesgos Operativos</h2>
                  <p>Gestión de riesgos por procesos (Cláusula 6) - Criterio Riesgo Inherente y Residual</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button className="btn btn-secondary" onClick={exportPDF} style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', color: '#475569' }}>
                    <Download size={18} /> Exportar Matriz Completa
                  </button>
                  <select 
                    value={filterYear}
                    onChange={(e) => setFilterYear(Number(e.target.value))}
                    className="form-control"
                    style={{ width: '100px', fontWeight: 'bold' }}
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setSelectedRisk({
                        riesgo: '', causas: '', consecuencias: '', proceso: '', sector: userRole !== 'SGI' ? userSector : '', concesion: '',
                        probabilidad: 1, impacto: 1, decision: 'MITIGAR', accionDecision: '', planAccion: '', fechaImplementacion: '', responsable: '',
                        probabilidadResidual: 1, impactoResidual: 1, ocurrio: '', eficacia: '', motivoEficaz: '', fechaEficacia: '', responsableEficacia: '', año: filterYear
                      });
                      setViewMode('form');
                    }}
                  >
                    <Plus size={18} /> Nuevo Riesgo
                  </button>
                </div>
              </div>

              {closureAlert && (
                <div className="animate-fade-in" style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertOctagon size={24} color="#dc2626" />
                  <div>
                    <strong>¡Cierre de Año Obligatorio!</strong>
                    <p style={{ margin: 0, fontSize: '14px' }}>Tienes riesgos pendientes de evaluación de eficacia para el año {filterYear}. Por favor, ingresa a editarlos y completa la sección de medición antes del 31/12.</p>
                  </div>
                </div>
              )}
            
              <div className="glass table-container animate-fade-in delay-1" style={{overflowX: 'auto'}}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '250px' }}>
                    <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-secondary)' }} />
                    <input 
                      type="text" 
                      placeholder="Buscar riesgo..." 
                      className="form-control" 
                      style={{ paddingLeft: '36px' }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select className="form-control" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ width: '120px' }}>
                      <option value={2025}>Año 2025</option>
                      <option value={2026}>Año 2026</option>
                      <option value={2027}>Año 2027</option>
                    </select>
                    <select 
                      className="form-control" 
                      value={filterSector} 
                      onChange={e => setFilterSector(e.target.value)}
                      disabled={!isSGI}
                    >
                      {isSGI && <option value="Todos">Todos los Sectores</option>}
                      {!isSGI && <option value={userSector}>{userSector}</option>}
                      {isSGI && SECTORES.filter(s => s !== "Todos").map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                </div>
                
                <table className="data-table" style={{minWidth: '1500px'}}>
                  <thead>
                    <tr>
                      <th style={{width: '60px'}}>ID</th>
                      <th style={{width: '180px'}}>Riesgo</th>
                      <th style={{width: '180px'}}>Causas / Consecuencias</th>
                      <th style={{width: '140px'}}>Proceso / Sector / Concesión</th>
                      <th style={{textAlign:'center', width: '90px'}}>Inherente</th>
                      <th style={{width: '150px'}}>Decisión / Plan de Acción</th>
                      <th style={{textAlign:'center', width: '90px'}}>Residual</th>
                      <th style={{textAlign:'center', width: '100px'}}>Reevaluar?</th>
                      <th style={{textAlign:'center', width: '80px'}}>¿Ocurrió?</th>
                      <th style={{width: '100px'}}>Eficacia</th>
                      <th style={{textAlign:'right', width: '80px', position: 'sticky', right: 0, backgroundColor: 'white'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRisks.map(r => (
                      <tr key={r.id} onClick={() => { setSelectedRisk(r); setViewMode('detail'); }} style={{cursor: 'pointer'}}>
                        <td style={{fontWeight: 'bold', color: 'var(--accent-color)'}}>{r.id}</td>
                        <td><span style={{maxWidth: '180px', WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis'}} title={r.riesgo}>{r.riesgo}</span></td>
                        <td>
                          <div style={{fontSize: '12px', color: '#475569', marginBottom: '4px', maxWidth: '180px', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis'}} title={r.causas}><strong>Causas:</strong> {r.causas}</div>
                          <div style={{fontSize: '12px', color: '#64748b', maxWidth: '180px', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis'}} title={r.consecuencias}><strong>Consec:</strong> {r.consecuencias}</div>
                        </td>
                        <td>
                          <div style={{fontSize: '12px', marginBottom: '4px', maxWidth: '140px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}} title={r.proceso}>{r.proceso}</div>
                          <div style={{fontSize: '11px', color: '#475569'}}><strong>Sector:</strong> {r.sector}</div>
                          {r.concesion && <div style={{fontSize: '11px', color: '#64748b'}}><strong>Concesión:</strong> {r.concesion}</div>}
                        </td>
                        <td style={{textAlign:'center'}}>{getNivelBadge(r.probabilidad, r.impacto)}</td>
                        <td>
                          <div style={{fontSize: '12px', color: '#475569', fontWeight: 'bold', marginBottom: '4px'}}>{r.decision}</div>
                          <div style={{maxWidth: '150px', fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}} title={r.planAccion}>{r.planAccion}</div>
                        </td>
                        <td style={{textAlign:'center'}}>{getNivelBadge(r.probabilidadResidual, r.impactoResidual)}</td>
                        <td style={{textAlign:'center'}}>{getReevaluarText(r.probabilidadResidual, r.impactoResidual)}</td>
                        <td style={{textAlign:'center'}}>
                          {r.ocurrio === 'Sí' ? <span style={{color: '#dc2626', fontWeight: 'bold'}}>Sí</span> : r.ocurrio === 'No' ? <span style={{color: '#16a34a'}}>No</span> : '-'}
                        </td>
                        <td>
                          {r.eficacia === 'Eficaz' ? <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a'}}><CheckCircle size={14}/> Eficaz</span> : 
                           r.eficacia ? <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#eab308'}}><AlertTriangle size={14}/> {r.eficacia}</span> : '-'}
                        </td>
                        <td style={{textAlign:'right', position: 'sticky', right: 0, backgroundColor: 'white'}} onClick={e => e.stopPropagation()}>
                          {canEdit(r.sector) ? (
                            <>
                              <button className="btn btn-icon" onClick={() => { setSelectedRisk(r); setViewMode('form'); }}>
                                <Edit2 size={16} />
                              </button>
                              {isSGI && (
                                <button className="btn btn-icon" onClick={() => handleDelete(r)} title="Eliminar definitivamente">
                                  <Trash2 size={16} color="#dc2626" />
                                </button>
                              )}
                            </>
                          ) : (
                            <button className="btn btn-icon" disabled title="No tienes permisos para editar este sector">
                              <Lock size={16} color="#94a3b8" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!loadingRisks && filteredRisks.length === 0 && (
                      <tr>
                        <td colSpan="11" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                          No se encontraron riesgos para los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                    {loadingRisks && (
                      <tr>
                        <td colSpan="11" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                          Cargando riesgos...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {viewMode === 'form' && (
            <div className="glass animate-fade-in delay-1" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>{selectedRisk?.id ? `Editar Riesgo: ${selectedRisk.id}` : 'Nuevo Riesgo Operativo'}</h3>
                <div className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569', fontSize: '14px' }}>
                  Año Matriz: <strong>{selectedRisk?.año}</strong>
                </div>
              </div>
              <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', color: '#64748b' }}>Identificación del Riesgo</h4>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Riesgo (¿Qué puede pasar?)</label>
                  <textarea className="form-control" rows="2" value={selectedRisk?.riesgo} onChange={e => setSelectedRisk({...selectedRisk, riesgo: e.target.value})} required></textarea>
                </div>
                <div>
                  <label className="form-label">Causas (¿Por qué?)</label>
                  <textarea className="form-control" rows="3" value={selectedRisk?.causas} onChange={e => setSelectedRisk({...selectedRisk, causas: e.target.value})} required></textarea>
                </div>
                <div>
                  <label className="form-label">Consecuencias (¿Cuál es el Impacto?)</label>
                  <textarea className="form-control" rows="3" value={selectedRisk?.consecuencias} onChange={e => setSelectedRisk({...selectedRisk, consecuencias: e.target.value})} required></textarea>
                </div>
                <div>
                  <label className="form-label">Proceso Relacionado</label>
                  <input type="text" className="form-control" placeholder="Escribir el proceso..." value={selectedRisk?.proceso || ''} onChange={e => setSelectedRisk({...selectedRisk, proceso: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">Sector (controla quién puede ver/editar este riesgo)</label>
                  <select className="form-control" value={selectedRisk?.sector || ''} onChange={e => setSelectedRisk({...selectedRisk, sector: e.target.value})} required>
                    <option value="">Seleccionar...</option>
                    {SECTORES.filter(s => s !== 'Todos').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Concesión</label>
                  <select className="form-control" value={selectedRisk?.concesion || ''} onChange={e => setSelectedRisk({...selectedRisk, concesion: e.target.value})} required>
                    <option value="">Seleccionar...</option>
                    {CONCESIONES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', marginTop: '16px', color: '#64748b' }}>Evaluación del Riesgo Inherente</h4>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Probabilidad de Ocurrencia</label>
                    <select className="form-control" value={selectedRisk?.probabilidad || ''} onChange={e => setSelectedRisk({...selectedRisk, probabilidad: Number(e.target.value)})} required>
                      <option value="">Seleccionar...</option>
                      {PROBABILIDAD_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Impacto</label>
                    <select className="form-control" value={selectedRisk?.impacto || ''} onChange={e => setSelectedRisk({...selectedRisk, impacto: Number(e.target.value)})} required>
                      <option value="">Seleccionar...</option>
                      {IMPACTO_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Riesgo Inherente (PxI)</span>
                    {getNivelBadge(selectedRisk?.probabilidad || 0, selectedRisk?.impacto || 0)}
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', marginTop: '16px', color: '#64748b' }}>Decisión y Acciones de Control</h4>
                </div>

                <div>
                  <label className="form-label">Decisión Estratégica</label>
                  <select className="form-control" value={selectedRisk?.decision} onChange={e => setSelectedRisk({...selectedRisk, decision: e.target.value})} required>
                    <option value="MITIGAR">MITIGAR</option>
                    <option value="ACEPTAR">ACEPTAR</option>
                    <option value="EVITAR">EVITAR</option>
                    <option value="TRANSFERIR">TRANSFERIR</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Acción de la Decisión</label>
                  <input type="text" className="form-control" value={selectedRisk?.accionDecision} onChange={e => setSelectedRisk({...selectedRisk, accionDecision: e.target.value})} />
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Planificación e Implementación de acciones de control</label>
                  <textarea className="form-control" rows="2" value={selectedRisk?.planAccion} onChange={e => setSelectedRisk({...selectedRisk, planAccion: e.target.value})} required></textarea>
                </div>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Fecha Implementación</label>
                    <input type="date" className="form-control" value={selectedRisk?.fechaImplementacion} onChange={e => setSelectedRisk({...selectedRisk, fechaImplementacion: e.target.value})} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Responsable</label>
                    <input type="text" className="form-control" value={selectedRisk?.responsable} onChange={e => setSelectedRisk({...selectedRisk, responsable: e.target.value})} required />
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', marginTop: '16px', color: '#64748b' }}>Evaluación del Riesgo Residual</h4>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Prob. de Ocurrencia Residual</label>
                    <select className="form-control" value={selectedRisk?.probabilidadResidual || ''} onChange={e => setSelectedRisk({...selectedRisk, probabilidadResidual: Number(e.target.value)})} required>
                      <option value="">Seleccionar...</option>
                      {PROBABILIDAD_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Impacto Residual</label>
                    <select className="form-control" value={selectedRisk?.impactoResidual || ''} onChange={e => setSelectedRisk({...selectedRisk, impactoResidual: Number(e.target.value)})} required>
                      <option value="">Seleccionar...</option>
                      {IMPACTO_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Riesgo Residual (PxI)</span>
                      {getNivelBadge(selectedRisk?.probabilidadResidual || 0, selectedRisk?.impactoResidual || 0)}
                    </div>
                    <div>
                      {getReevaluarText(selectedRisk?.probabilidadResidual || 0, selectedRisk?.impactoResidual || 0)}
                    </div>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', marginTop: '16px', color: '#64748b' }}>Evaluación de la Eficacia</h4>
                </div>

                <div>
                  <label className="form-label">¿Sucedió el Riesgo?</label>
                  <select className="form-control" value={selectedRisk?.ocurrio} onChange={e => setSelectedRisk({...selectedRisk, ocurrio: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    <option value="Sí">Sí</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">¿Fueron eficaces las acciones tomadas?</label>
                  <select className="form-control" value={selectedRisk?.eficacia} onChange={e => setSelectedRisk({...selectedRisk, eficacia: e.target.value})}>
                    <option value="">Pendiente...</option>
                    <option value="Eficaz">Eficaz</option>
                    <option value="No Eficaz">No Eficaz</option>
                  </select>
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">En caso de que "SI", detallar los motivos de porqué fue eficaz</label>
                  <textarea className="form-control" rows="2" value={selectedRisk?.motivoEficaz} onChange={e => setSelectedRisk({...selectedRisk, motivoEficaz: e.target.value})}></textarea>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Fecha eval. eficacia</label>
                    <input type="date" className="form-control" value={selectedRisk?.fechaEficacia} onChange={e => setSelectedRisk({...selectedRisk, fechaEficacia: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Resp. eval. eficacia</label>
                    <input type="text" className="form-control" value={selectedRisk?.responsableEficacia} onChange={e => setSelectedRisk({...selectedRisk, responsableEficacia: e.target.value})} />
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setViewMode('table')}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Riesgo Operativo'}</button>
                </div>
              </form>
            </div>
          )}

          {viewMode === 'detail' && selectedRisk && (
            <div className="glass animate-fade-in delay-1" style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>{selectedRisk.id}</h3>
                    <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>Año {selectedRisk.año}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedRisk.proceso && <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>{selectedRisk.proceso}</span>}
                    {selectedRisk.sector && <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>Sector: {selectedRisk.sector}</span>}
                    {selectedRisk.concesion && <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>Concesión: {selectedRisk.concesion}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {canEdit(selectedRisk.sector) && (
                    <button className="btn btn-secondary" onClick={() => setViewMode('form')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Edit2 size={16} /> Editar
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={() => setViewMode('table')}>Cerrar</button>
                </div>
              </div>

              <DetailSeccion titulo="Riesgo">
                <DetailCampo label="¿Qué puede pasar?" valor={selectedRisk.riesgo} ancho="full" />
                <DetailCampo label="Causas (¿Por qué?)" valor={selectedRisk.causas} />
                <DetailCampo label="Consecuencias (¿Impacto?)" valor={selectedRisk.consecuencias} />
              </DetailSeccion>

              <DetailSeccion titulo="Evaluación del Riesgo Inherente">
                <DetailCampo label="Probabilidad" valor={PROBABILIDAD_OPCIONES.find(o => o.value === selectedRisk.probabilidad)?.label || selectedRisk.probabilidad} />
                <DetailCampo label="Impacto" valor={IMPACTO_OPCIONES.find(o => o.value === selectedRisk.impacto)?.label || selectedRisk.impacto} />
                <div style={{ gridColumn: '1 / -1' }}>{getNivelBadge(selectedRisk.probabilidad, selectedRisk.impacto)}</div>
              </DetailSeccion>

              <DetailSeccion titulo="Decisión y Acciones de Control">
                <DetailCampo label="Decisión Estratégica" valor={selectedRisk.decision} />
                <DetailCampo label="Acción de la Decisión" valor={selectedRisk.accionDecision} />
                <DetailCampo label="Planificación e Implementación" valor={selectedRisk.planAccion} ancho="full" />
                <DetailCampo label="Fecha Implementación" valor={selectedRisk.fechaImplementacion} />
                <DetailCampo label="Responsable" valor={selectedRisk.responsable} />
              </DetailSeccion>

              <DetailSeccion titulo="Evaluación del Riesgo Residual">
                <DetailCampo label="Probabilidad Residual" valor={PROBABILIDAD_OPCIONES.find(o => o.value === selectedRisk.probabilidadResidual)?.label || selectedRisk.probabilidadResidual} />
                <DetailCampo label="Impacto Residual" valor={IMPACTO_OPCIONES.find(o => o.value === selectedRisk.impactoResidual)?.label || selectedRisk.impactoResidual} />
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {getNivelBadge(selectedRisk.probabilidadResidual, selectedRisk.impactoResidual)}
                  {getReevaluarText(selectedRisk.probabilidadResidual, selectedRisk.impactoResidual)}
                </div>
              </DetailSeccion>

              <DetailSeccion titulo="Evaluación de la Eficacia" ultima>
                <DetailCampo label="¿Sucedió el riesgo?" valor={selectedRisk.ocurrio} />
                <DetailCampo label="¿Fueron eficaces las acciones?" valor={selectedRisk.eficacia} />
                <DetailCampo label="Motivo" valor={selectedRisk.motivoEficaz} ancho="full" />
                <DetailCampo label="Fecha eval. eficacia" valor={selectedRisk.fechaEficacia} />
                <DetailCampo label="Resp. eval. eficacia" valor={selectedRisk.responsableEficacia} />
              </DetailSeccion>
            </div>
          )}
        </>
      )}

      {activeTab === 'validacion' && renderValidationTab()}
    </div>
  );
}

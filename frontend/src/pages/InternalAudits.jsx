import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Edit2, Save, Printer, ChevronLeft, Trash2, Image as ImageIcon,
  FileText, CheckCircle2, AlertTriangle, Sparkles, Download,
  Search, ClipboardCheck, Eye, PenTool, Building2, Calendar, MapPin, Users, ShieldCheck
} from 'lucide-react';
import SignaturePad from 'signature_pad';
import {
  SECTORES_AUDITORIA,
  REQUISITOS_NORMATIVOS,
  INITIAL_PROGRAMA_2026,
  INITIAL_INFORMES,
  crearEvaluacionesVacias,
  calcularResumenInforme,
  generarPDFInformeAuditoria
} from '../lib/auditoriasData';

const STORAGE_KEY_PROGRAMA = 'sgi_aubasa_programa_auditorias_v2';
const STORAGE_KEY_INFORMES = 'sgi_aubasa_informes_auditorias_v2';
const STORAGE_KEY_SESSION_UI = 'sgi_aubasa_auditoria_ui_state_v2';

// Modal reutilizable para firmar dibujando en pantalla o subiendo imagen + Nombre y Apellido
function SignatureModal({ isOpen, onClose, onSave, currentImage, currentName, title }) {
  const [mode, setMode] = useState('draw'); // 'draw' | 'upload'
  const [name, setName] = useState(currentName || '');
  const [uploadedImg, setUploadedImg] = useState(currentImage || '');
  const canvasRef = useRef(null);
  const padRef = useRef(null);

  useEffect(() => {
    setName(currentName || '');
    setUploadedImg(currentImage || '');
  }, [currentName, currentImage, isOpen]);

  useEffect(() => {
    if (!isOpen || mode !== 'draw' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);

    const pad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: '#0f172a'
    });
    padRef.current = pad;
    return () => pad.off();
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setUploadedImg(reader.result);
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!name.trim()) {
      alert('Por favor ingresá el Nombre y Apellido de quien firma.');
      return;
    }
    let finalImg = uploadedImg;
    if (mode === 'draw') {
      if (padRef.current && !padRef.current.isEmpty()) {
        finalImg = padRef.current.toDataURL('image/png');
      } else if (!currentImage) {
        alert('Por favor dibujá tu firma en el recuadro o elegí la opción de subir imagen.');
        return;
      } else {
        finalImg = currentImage;
      }
    } else if (!uploadedImg) {
      alert('Por favor seleccioná una imagen de tu firma.');
      return;
    }
    onSave(finalImg, name.trim());
    onClose();
  };

  return (
    <div className="no-print" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px',
        padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '18px' }}>{title || 'Registrar Firma'}</h3>
        <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '13px' }}>
          Elegí si preferís dibujar tu firma en el recuadro o subir una imagen, e indicá tu nombre y apellido.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            Nombre y Apellido (Aclaración) *
          </label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Sergio Montes"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setMode('draw')}
            style={{
              padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: mode === 'draw' ? 'white' : 'transparent',
              color: mode === 'draw' ? 'var(--accent-color)' : '#64748b',
              boxShadow: mode === 'draw' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <PenTool size={15} /> Firmar Aquí
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            style={{
              padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: mode === 'upload' ? 'white' : 'transparent',
              color: mode === 'upload' ? 'var(--accent-color)' : '#64748b',
              boxShadow: mode === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <ImageIcon size={15} /> Subir Imagen
          </button>
        </div>

        {mode === 'draw' ? (
          <div>
            <div style={{ border: '2px dashed #94a3b8', borderRadius: '10px', background: '#f8fafc', overflow: 'hidden' }}>
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '150px', display: 'block', touchAction: 'none', cursor: 'crosshair' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Dibujá con el mouse o pantalla táctil</span>
              <button
                type="button"
                onClick={() => padRef.current?.clear()}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Limpiar trazo
              </button>
            </div>
          </div>
        ) : (
          <div style={{ border: '2px dashed #94a3b8', borderRadius: '10px', padding: '20px', textAlign: 'center', background: '#f8fafc' }}>
            {uploadedImg ? (
              <div>
                <img src={uploadedImg} alt="Vista previa firma" style={{ maxHeight: '95px', maxWidth: '100%', objectFit: 'contain', marginBottom: '10px' }} />
                <div>
                  <button
                    type="button"
                    onClick={() => setUploadedImg('')}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cambiar imagen
                  </button>
                </div>
              </div>
            ) : (
              <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#475569' }}>
                <ImageIcon size={28} color="var(--accent-color)" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Seleccionar archivo de imagen (PNG / JPG)</span>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>Guardar Firma</button>
        </div>
      </div>
    </div>
  );
}

export default function InternalAudits() {
  const { checkPermission } = useAuth();
  const isSGI = checkPermission('SGI');

  // Restaurar también la pantalla/informe que estaba abierto por si la página se refresca tras 2 hs
  const savedUiState = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SESSION_UI);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();

  const [activeTab, setActiveTab] = useState(savedUiState.activeTab || 'informes');
  const [viewMode, setViewMode] = useState(savedUiState.viewMode || 'general');
  const [isEditing, setIsEditing] = useState(false);

  // Estado del Programa Anual (PAU/07 A2 y A3) con persistencia inmediata
  const [programa, setPrograma] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRAMA);
      return saved ? JSON.parse(saved) : INITIAL_PROGRAMA_2026;
    } catch {
      return INITIAL_PROGRAMA_2026;
    }
  });

  // Estado de los Informes de Auditoría (PAU/07 A4 / Motor Auditorias) con persistencia inmediata
  const [informes, setInformes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INFORMES);
      return saved ? JSON.parse(saved) : INITIAL_INFORMES;
    } catch {
      return INITIAL_INFORMES;
    }
  });

  const [selectedSectorId, setSelectedSectorId] = useState(savedUiState.selectedSectorId || null);
  const [selectedInformeId, setSelectedInformeId] = useState(savedUiState.selectedInformeId || null);
  const [informeSubTab, setInformeSubTab] = useState(savedUiState.informeSubTab || 'checklist');

  // Indicador de autoguardado en tiempo real (evita pérdida en auditorías de +2 horas)
  const [lastSavedAt, setLastSavedAt] = useState(() => new Date().toLocaleTimeString('es-AR'));
  const [saveBanner, setSaveBanner] = useState('');

  // Filtros interactivos del Checklist
  const [capFilter, setCapFilter] = useState('TODOS');
  const [resFilter, setResFilter] = useState('TODOS');
  const [searchReq, setSearchReq] = useState('');

  // Modal de Firma
  const [sigModal, setSigModal] = useState({ open: false, title: '', currentImage: '', currentName: '', onSave: null });

  // Guardar automáticamente cada cambio de Programa, Informes y pestaña activa en el navegador
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRAMA, JSON.stringify(programa));
      setLastSavedAt(new Date().toLocaleTimeString('es-AR'));
    } catch (e) {
      console.error('Error guardando programa en localStorage:', e);
    }
  }, [programa]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INFORMES, JSON.stringify(informes));
      setLastSavedAt(new Date().toLocaleTimeString('es-AR'));
    } catch (e) {
      console.error('Error guardando informes en localStorage:', e);
    }
  }, [informes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSION_UI, JSON.stringify({
        activeTab,
        viewMode,
        selectedSectorId,
        selectedInformeId,
        informeSubTab
      }));
    } catch (e) {
      console.error('Error guardando estado de sesión UI:', e);
    }
  }, [activeTab, viewMode, selectedSectorId, selectedInformeId, informeSubTab]);

  const handleManualSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRAMA, JSON.stringify(programa));
      localStorage.setItem(STORAGE_KEY_INFORMES, JSON.stringify(informes));
      const now = new Date().toLocaleTimeString('es-AR');
      setLastSavedAt(now);
      setSaveBanner(`✓ Informe guardado de forma segura (${now}). Aunque pasen más de 2 horas o se recargue el navegador, tus datos no se pierden.`);
      setTimeout(() => setSaveBanner(''), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  const openSignatureModal = (title, currentImage, currentName, onSave) => {
    setSigModal({ open: true, title, currentImage, currentName, onSave });
  };

  // ============================================================================
  // FUNCIONES PROGRAMA ANUAL Y PLAN SECTORIAL (PAU/07 A2 y A3)
  // ============================================================================
  const addSector = () => {
    const newId = Date.now().toString();
    setPrograma(prev => ({
      ...prev,
      sectores: [...prev.sectores, {
        id: newId,
        ps: String(prev.sectores.length + 1),
        sector: 'Nuevo Sector',
        fecha: '',
        documentos: 'Manual de Gestión; PAU/02; PAU/07; PAU/08.',
        planSectorial: { responsable: '', auditor: 'Equipo Auditor SGI', procesos: [], firmaAuditor: '', nombreAuditor: '' }
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
    if (isEditing) return;
    setSelectedSectorId(id);
    setViewMode('sectorial');
  };

  const closeSectorial = () => {
    setSelectedSectorId(null);
    setViewMode('general');
    setIsEditing(false);
  };

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

  // ============================================================================
  // FUNCIONES INFORMES DE AUDITORÍA (PAU/07 A4 - MOTOR INTEGRADO)
  // ============================================================================
  const selectedInforme = informes.find(i => i.id === selectedInformeId) || null;

  const crearNuevoInforme = (sectorPreseleccionado = '') => {
    const nuevoId = `audit-${Date.now()}`;
    const num = String(informes.length + 1).padStart(3, '0');
    const hoy = new Date().toISOString().split('T')[0];
    const nuevo = {
      id: nuevoId,
      codigoInforme: `PAU/07-A4-${num}`,
      sector: sectorPreseleccionado || SECTORES_AUDITORIA[0],
      organizacion: 'Autopistas de Buenos Aires S.A. - AUBASA',
      anio: new Date().getFullYear(),
      tipo_auditoria: 'Interna del SGI (ISO 9001 / ISO 39001 / IRAM 3810)',
      fechas_auditoria: hoy,
      lugar: 'Sede Central / Operativa',
      estado: 'En Curso',
      auditor_responsable: 'Sergio Montes',
      auditor_2: '',
      auditor_3: '',
      experto_tecnico: '',
      veedores: '',
      personas_auditadas: '',
      conclusiones: 'La auditoría se desarrolló conforme al plan establecido, verificándose el grado de cumplimiento de los requisitos normativos y procedimientos del Sistema de Gestión Integrado.',
      firmaAuditor: '',
      nombreFirmaAuditor: 'Sergio Montes',
      firmaResponsableSector: '',
      nombreFirmaResponsable: '',
      fortalezas: [''],
      oportunidades: [''],
      evaluaciones: crearEvaluacionesVacias()
    };
    setInformes(prev => [nuevo, ...prev]);
    setSelectedInformeId(nuevoId);
    setInformeSubTab('datos');
    setActiveTab('informes');
  };

  const eliminarInforme = (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar este informe de auditoría?')) return;
    setInformes(prev => prev.filter(i => i.id !== id));
    if (selectedInformeId === id) setSelectedInformeId(null);
  };

  const updateInformeField = (field, value) => {
    setInformes(prev => prev.map(inf => inf.id === selectedInformeId ? { ...inf, [field]: value } : inf));
  };

  const updateEvaluacion = (codigoReq, field, value) => {
    setInformes(prev => prev.map(inf => {
      if (inf.id !== selectedInformeId) return inf;
      const actual = inf.evaluaciones?.[codigoReq] || { resultado: 'No Requiere', evidencia: '', detalle: '', oportunidad: '' };
      return {
        ...inf,
        evaluaciones: {
          ...inf.evaluaciones,
          [codigoReq]: { ...actual, [field]: value }
        }
      };
    }));
  };

  const marcarCapituloCumple = (cap) => {
    setInformes(prev => prev.map(inf => {
      if (inf.id !== selectedInformeId) return inf;
      const nuevasEv = { ...inf.evaluaciones };
      REQUISITOS_NORMATIVOS.forEach(r => {
        if (cap === 'TODOS' || r.capitulo === cap) {
          const prevEv = nuevasEv[r.codigo] || { evidencia: '', detalle: '', oportunidad: '' };
          if (!prevEv.resultado || prevEv.resultado === 'No Requiere') {
            nuevasEv[r.codigo] = { ...prevEv, resultado: 'Cumple' };
          }
        }
      });
      return { ...inf, evaluaciones: nuevasEv };
    }));
  };

  const renderEditableText = (value, onChange, placeholder = "", isTextarea = false) => {
    if (isEditing) {
      if (isTextarea) {
        return <textarea className="form-control" style={{ width: '100%', fontSize: '13px' }} rows="4" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
      }
      return <input type="text" className="form-control" style={{ width: '100%', fontSize: '13px' }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
    }
    return <span style={{ whiteSpace: 'pre-wrap' }}>{value || placeholder}</span>;
  };

  // ============================================================================
  // VISTA 1: PROGRAMA GENERAL DE AUDITORÍAS (PAU/07 ANEXO 2)
  // ============================================================================
  const renderProgramaGeneral = () => (
    <div className="animate-fade-in">
      <div className="no-print module-header glass" style={{ padding: '24px', marginBottom: '32px' }}>
        <div>
          <h2 style={{ color: 'var(--accent-color)', margin: '0 0 4px 0', fontSize: '24px' }}>Programa General de Auditorías {programa.year}</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>PAU/07 Anexo 2 — Hacé clic en cualquier sector para abrir su Plan Sectorial (Anexo 3) o iniciar su Auditoría</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isSGI && (
            <button
              type="button"
              className={`btn ${isEditing ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => setIsEditing(!isEditing)}
              style={isEditing ? { backgroundColor: '#16a34a', color: 'white' } : {}}
            >
              {isEditing ? <><Save size={18} /> Guardar Cambios</> : <><Edit2 size={18} /> Activar Edición</>}
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => window.print()}><Printer size={18} /> Imprimir Programa</button>
        </div>
      </div>

      <div className="printable-doc" style={{ background: 'white', padding: '50px 60px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', maxWidth: '1050px', margin: '0 auto', border: isEditing ? '2px dashed var(--accent-color)' : '1px solid #e2e8f0', color: '#1e293b' }}>
        <div className="print-header" style={{ display: 'flex', border: '1px solid #000', marginBottom: '32px' }}>
          <div className="print-logo" style={{ width: '25%', borderRight: '1px solid #000', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '28px', fontWeight: 800, letterSpacing: '-1px' }}>AUBASA</h2>
            <small style={{ fontSize: '10px', textAlign: 'center', fontWeight: 600, color: '#475569', marginTop: '4px' }}>AUTOPISTAS DE BUENOS AIRES S.A.</small>
          </div>
          <div className="print-title" style={{ width: '50%', borderRight: '1px solid #000', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <strong style={{ fontSize: '14px', color: '#64748b' }}>ANEXO 2</strong>
            <strong style={{ fontSize: '18px', color: '#0f172a', marginTop: '6px', lineHeight: '1.3' }}>PROGRAMA GENERAL DE AUDITORÍAS INTERNAS PERIÓDICAS</strong>
          </div>
          <div className="print-meta" style={{ width: '25%', padding: '12px 16px', fontSize: '11px', lineHeight: '1.8', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Código:</strong> <span>PAU/07- A2</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Revisión:</strong> <span>03</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Ciclo:</strong> <span>{programa.year}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Estado:</strong> <span>Vigente</span></div>
          </div>
        </div>

        <div className="print-section" style={{ marginBottom: '36px' }}>
          <div style={{ fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '8px 12px', borderLeft: '4px solid var(--accent-color)', color: '#0f172a', marginBottom: '12px', fontSize: '14px' }}>OBJETIVO DEL PROGRAMA DE AUDITORÍA</div>
          <div style={{ padding: '0 16px', fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '24px' }}>{renderEditableText(programa.objetivo, (val) => setPrograma({ ...programa, objetivo: val }), "Escriba el objetivo...", true)}</div>

          <div style={{ fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '8px 12px', borderLeft: '4px solid var(--accent-color)', color: '#0f172a', marginBottom: '12px', fontSize: '14px' }}>ALCANCE</div>
          <div style={{ padding: '0 16px', fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '24px' }}>{renderEditableText(programa.alcance, (val) => setPrograma({ ...programa, alcance: val }), "Escriba el alcance...", true)}</div>

          <div style={{ fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '8px 12px', borderLeft: '4px solid var(--accent-color)', color: '#0f172a', marginBottom: '12px', fontSize: '14px' }}>CRITERIOS</div>
          <div style={{ padding: '0 16px', fontSize: '14px', lineHeight: '1.7', color: '#334155' }}>{renderEditableText(programa.criterios, (val) => setPrograma({ ...programa, criterios: val }), "Escriba los criterios...", true)}</div>
        </div>

        <div style={{ fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '8px 12px', borderLeft: '4px solid var(--accent-color)', color: '#0f172a', marginBottom: '16px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>AGENDA DETALLADA POR SECTORES</span>
          {isEditing && <button type="button" className="btn btn-primary no-print" onClick={addSector} style={{ padding: '4px 12px', fontSize: '12px' }}><Plus size={14} /> Agregar Sector</button>}
        </div>

        <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <th style={{ border: '1px solid #cbd5e1', padding: '10px', width: '6%', textAlign: 'center', color: '#475569' }}>PS</th>
              <th style={{ border: '1px solid #cbd5e1', padding: '10px', width: '26%', color: '#475569' }}>SECTOR</th>
              <th style={{ border: '1px solid #cbd5e1', padding: '10px', width: '24%', color: '#475569' }}>FECHA Y HORA</th>
              <th style={{ border: '1px solid #cbd5e1', padding: '10px', width: '30%', color: '#475569' }}>DOCUMENTOS APLICABLES</th>
              <th className="no-print" style={{ border: '1px solid #cbd5e1', padding: '10px', width: '14%', textAlign: 'center', color: '#475569' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {programa.sectores.map((s, idx) => (
              <tr key={s.id} onClick={() => openSectorial(s.id)} style={{ cursor: isEditing ? 'default' : 'pointer', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }} className={!isEditing ? "hover-row" : ""}>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>{renderEditableText(s.ps, (v) => updateSector(s.id, 'ps', v), "1")}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}><strong>{renderEditableText(s.sector, (v) => updateSector(s.id, 'sector', v), "Gerencia...")}</strong></td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>{renderEditableText(s.fecha, (v) => updateSector(s.id, 'fecha', v), "DD/MM/AA -- HH:MM")}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', fontSize: '12px', color: '#475569' }}>{renderEditableText(s.documentos, (v) => updateSector(s.id, 'documentos', v), "Docs...", true)}</td>
                <td className="no-print" style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => openSectorial(s.id)}
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      title="Ver Plan Sectorial (Anexo 3)"
                    >
                      Plan A3
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        const existing = informes.find(inf => inf.sector.toLowerCase() === s.sector.toLowerCase());
                        if (existing) {
                          setSelectedInformeId(existing.id);
                          setActiveTab('informes');
                        } else {
                          crearNuevoInforme(s.sector);
                        }
                      }}
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      title="Abrir o Crear Informe de Auditoría (Anexo 4)"
                    >
                      Auditar
                    </button>
                    {isEditing && (
                      <button type="button" className="btn btn-icon" onClick={() => removeSector(s.id)} style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}><Trash2 size={15} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* FIRMAS DEL PROGRAMA CON NOMBRE Y APELLIDO + DIBUJO/IMAGEN */}
        <div className="print-signatures" style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-around', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', width: '260px' }}>
            <div style={{ height: '105px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '8px' }}>
              {programa.firmaJefeSGI ? (
                <div style={{ position: 'relative' }}>
                  <img src={programa.firmaJefeSGI} alt="Firma SGI" style={{ maxHeight: '70px', maxWidth: '200px', objectFit: 'contain' }} />
                  {programa.nombreJefeSGI && <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{programa.nombreJefeSGI}</div>}
                  {(isEditing || isSGI) && (
                    <button
                      type="button"
                      onClick={() => openSignatureModal('Firma Jefe de SGI', programa.firmaJefeSGI, programa.nombreJefeSGI, (img, nom) => setPrograma({ ...programa, firmaJefeSGI: img, nombreJefeSGI: nom }))}
                      className="no-print"
                      style={{ position: 'absolute', top: '-8px', right: '-24px', color: 'var(--accent-color)', background: 'white', border: '1px solid #cbd5e1', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
                      title="Editar Firma"
                    >
                      <PenTool size={12} />
                    </button>
                  )}
                </div>
              ) : (isEditing || isSGI) ? (
                <button
                  type="button"
                  className="btn btn-secondary no-print"
                  onClick={() => openSignatureModal('Firma Jefe de SGI', programa.firmaJefeSGI, programa.nombreJefeSGI, (img, nom) => setPrograma({ ...programa, firmaJefeSGI: img, nombreJefeSGI: nom }))}
                  style={{ fontSize: '12px', padding: '8px 14px', backgroundColor: '#f8fafc', border: '1px dashed #94a3b8', color: '#334155' }}
                >
                  <PenTool size={14} /> Firmar o Subir Imagen
                </button>
              ) : <span style={{ color: '#94a3b8', fontSize: '12px' }}>Firma Pendiente</span>}
            </div>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '10px', fontWeight: 600, fontSize: '13px' }}>
              Jefe de Sistema de Gestión<br />
              <span style={{ color: '#64748b', fontSize: '11px' }}>PROPONE</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', width: '260px' }}>
            <div style={{ height: '105px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '8px' }}>
              {programa.firmaGerenteGeneral ? (
                <div style={{ position: 'relative' }}>
                  <img src={programa.firmaGerenteGeneral} alt="Firma GG" style={{ maxHeight: '70px', maxWidth: '200px', objectFit: 'contain' }} />
                  {programa.nombreGerenteGeneral && <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{programa.nombreGerenteGeneral}</div>}
                  {(isEditing || isSGI) && (
                    <button
                      type="button"
                      onClick={() => openSignatureModal('Firma Gerente General', programa.firmaGerenteGeneral, programa.nombreGerenteGeneral, (img, nom) => setPrograma({ ...programa, firmaGerenteGeneral: img, nombreGerenteGeneral: nom }))}
                      className="no-print"
                      style={{ position: 'absolute', top: '-8px', right: '-24px', color: 'var(--accent-color)', background: 'white', border: '1px solid #cbd5e1', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
                      title="Editar Firma"
                    >
                      <PenTool size={12} />
                    </button>
                  )}
                </div>
              ) : (isEditing || isSGI) ? (
                <button
                  type="button"
                  className="btn btn-secondary no-print"
                  onClick={() => openSignatureModal('Firma Gerente General', programa.firmaGerenteGeneral, programa.nombreGerenteGeneral, (img, nom) => setPrograma({ ...programa, firmaGerenteGeneral: img, nombreGerenteGeneral: nom }))}
                  style={{ fontSize: '12px', padding: '8px 14px', backgroundColor: '#f8fafc', border: '1px dashed #94a3b8', color: '#334155' }}
                >
                  <PenTool size={14} /> Firmar o Subir Imagen
                </button>
              ) : <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Firma Pendiente</span>}
            </div>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '10px', fontWeight: 600, fontSize: '13px' }}>
              Gerente General<br />
              <span style={{ color: '#64748b', fontSize: '11px' }}>AUTORIZA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // VISTA 1.B: PLAN SECTORIAL (PAU/07 ANEXO 3)
  // ============================================================================
  const renderPlanSectorial = () => {
    const sector = getSelectedSector();
    if (!sector) return null;
    const p = sector.planSectorial;

    return (
      <div className="animate-fade-in">
        <div className="no-print module-header glass" style={{ padding: '24px', marginBottom: '32px' }}>
          <div>
            <h2 style={{ color: 'var(--accent-color)', margin: '0 0 4px 0', fontSize: '24px' }}>Plan Sectorial: {sector.sector}</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>PAU/07 Anexo 3 — Detalle de procesos a auditar</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={closeSectorial} disabled={isEditing}><ChevronLeft size={18} /> Volver al Programa</button>
            {isSGI && (
              <button type="button" className={`btn ${isEditing ? 'btn-success' : 'btn-secondary'}`} onClick={() => setIsEditing(!isEditing)} style={isEditing ? { backgroundColor: '#16a34a', color: 'white' } : {}}>
                {isEditing ? <><Save size={18} /> Guardar Cambios</> : <><Edit2 size={18} /> Activar Edición</>}
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => window.print()}><Printer size={18} /> Imprimir Plan</button>
          </div>
        </div>

        <div className="printable-doc" style={{ background: 'white', padding: '50px 60px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', maxWidth: '1000px', margin: '0 auto', border: isEditing ? '2px dashed var(--accent-color)' : '1px solid #e2e8f0', color: '#1e293b' }}>
          <div className="print-header" style={{ display: 'flex', border: '1px solid #000', marginBottom: '32px' }}>
            <div className="print-logo" style={{ width: '25%', borderRight: '1px solid #000', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '28px', fontWeight: 800, letterSpacing: '-1px' }}>AUBASA</h2>
              <small style={{ fontSize: '10px', textAlign: 'center', fontWeight: 600, color: '#475569', marginTop: '4px' }}>AUTOPISTAS DE BUENOS AIRES S.A.</small>
            </div>
            <div className="print-title" style={{ width: '50%', borderRight: '1px solid #000', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <strong style={{ fontSize: '14px', color: '#64748b' }}>ANEXO 3</strong>
              <strong style={{ fontSize: '18px', color: '#0f172a', marginTop: '6px', lineHeight: '1.3' }}>PLAN SECTORIAL DE AUDITORÍA INTERNA</strong>
            </div>
            <div className="print-meta" style={{ width: '25%', padding: '12px 16px', fontSize: '11px', lineHeight: '1.8', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Código:</strong> <span>PAU/07- A3</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Revisión:</strong> <span>03</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Fecha:</strong> <span>{sector.fecha.split(' ')[0] || 'DD/MM/AA'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Página:</strong> <span>1 de 1</span></div>
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>PLAN SECTORIAL DE AUDITORÍA INTERNA</div>
          <div style={{ backgroundColor: '#334155', color: 'white', padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', marginBottom: '16px' }}>PS {sector.ps} - SECTOR, RESPONSABLES, FECHA Y HORA</div>

          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', marginBottom: '24px' }}>
            <tbody>
              <tr>
                <td style={{ width: '33%', border: '1px solid #cbd5e1', padding: '12px' }}>
                  <strong style={{ color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Sector por auditar:</strong>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{sector.sector}</span>
                </td>
                <td style={{ width: '33%', border: '1px solid #cbd5e1', padding: '12px' }}>
                  <strong style={{ color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Responsable:</strong>
                  {renderEditableText(p.responsable, (v) => updatePlanSectorial('responsable', v), "Nombre del Responsable")}
                </td>
                <td style={{ width: '34%', border: '1px solid #cbd5e1', padding: '12px' }}>
                  <strong style={{ color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Fecha/Hora:</strong>
                  <span style={{ fontSize: '14px' }}>{sector.fecha}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ backgroundColor: '#334155', color: 'white', padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>EQUIPO AUDITOR</div>
          <div style={{ border: '1px solid #cbd5e1', padding: '16px', marginBottom: '24px' }}>
            <strong style={{ color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Auditor Interno:</strong>
            {renderEditableText(p.auditor, (v) => updatePlanSectorial('auditor', v), "Nombres de los auditores")}
          </div>

          <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '8px', fontWeight: 'bold', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ marginLeft: '12px' }}>DETALLE DEL PLAN DE LA AUDITORÍA</span>
            {isEditing && <button type="button" className="btn btn-primary no-print" onClick={addProceso} style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--accent-color)' }}><Plus size={14} /> Agregar Proceso</button>}
          </div>

          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '12px', marginBottom: '32px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th rowSpan="2" style={{ border: '1px solid #cbd5e1', padding: '10px', width: '25%', color: '#475569' }}>PROCESO</th>
                <th colSpan="2" style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#475569' }}>REQUISITO NORMATIVO</th>
                <th rowSpan="2" style={{ border: '1px solid #cbd5e1', padding: '10px', width: '30%', color: '#475569' }}>DOCUMENTOS APLICABLES</th>
                <th rowSpan="2" style={{ border: '1px solid #cbd5e1', padding: '10px', width: '20%', color: '#475569' }}>PARTICIPAN</th>
                {isEditing && <th rowSpan="2" className="no-print" style={{ border: '1px solid #cbd5e1', width: '5%' }}>X</th>}
              </tr>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#475569' }}>ISO 9001</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#475569' }}>ISO 39001 / 3810</th>
              </tr>
            </thead>
            <tbody>
              {p.procesos.map((proc, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}><strong>{renderEditableText(proc.proceso, (v) => updateProceso(idx, 'proceso', v), "Proceso...")}</strong></td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{renderEditableText(proc.req9001, (v) => updateProceso(idx, 'req9001', v), "4.1")}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{renderEditableText(proc.req39001, (v) => updateProceso(idx, 'req39001', v), "4.1")}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '10px', whiteSpace: 'pre-wrap' }}>{renderEditableText(proc.docs, (v) => updateProceso(idx, 'docs', v), "Documentos...", true)}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '10px', whiteSpace: 'pre-wrap' }}>{renderEditableText(proc.participantes, (v) => updateProceso(idx, 'participantes', v), "Participantes...", true)}</td>
                  {isEditing && (
                    <td className="no-print" style={{ border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      <button type="button" className="btn btn-icon" onClick={() => removeProceso(idx)} style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </td>
                  )}
                </tr>
              ))}
              {!isEditing && p.procesos.length === 0 && <tr><td colSpan="5" style={{ border: '1px solid #cbd5e1', padding: '16px', textAlign: 'center', color: '#94a3b8' }}>No hay procesos detallados.</td></tr>}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '320px' }}>
              <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>APRUEBA</div>
              <div style={{ border: '1px solid #cbd5e1', height: '135px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '12px', position: 'relative', backgroundColor: '#f8fafc' }}>
                {p.firmaAuditor ? (
                  <div style={{ marginBottom: '6px', textAlign: 'center', position: 'relative' }}>
                    <img src={p.firmaAuditor} alt="Firma Auditor" style={{ maxHeight: '65px', maxWidth: '220px', objectFit: 'contain' }} />
                    {p.nombreAuditor && <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{p.nombreAuditor}</div>}
                    {(isEditing || isSGI) && (
                      <button
                        type="button"
                        onClick={() => openSignatureModal('Firma Auditor Responsable', p.firmaAuditor, p.nombreAuditor, (img, nom) => {
                          updatePlanSectorial('firmaAuditor', img);
                          updatePlanSectorial('nombreAuditor', nom);
                        })}
                        className="no-print"
                        style={{ position: 'absolute', top: '-6px', right: '-24px', color: 'var(--accent-color)', background: 'white', border: '1px solid #cbd5e1', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
                      >
                        <PenTool size={12} />
                      </button>
                    )}
                  </div>
                ) : (isEditing || isSGI) ? (
                  <button
                    type="button"
                    className="btn btn-secondary no-print"
                    onClick={() => openSignatureModal('Firma Auditor Responsable', p.firmaAuditor, p.nombreAuditor, (img, nom) => {
                      updatePlanSectorial('firmaAuditor', img);
                      updatePlanSectorial('nombreAuditor', nom);
                    })}
                    style={{ fontSize: '12px', padding: '6px 12px', marginBottom: '18px', backgroundColor: '#ffffff', border: '1px dashed #94a3b8', color: '#334155' }}
                  >
                    <PenTool size={14} /> Firmar o Subir Imagen
                  </button>
                ) : <span style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '20px' }}>Firma Pendiente</span>}
                <span style={{ borderTop: '1px solid #334155', width: '250px', textAlign: 'center', paddingTop: '8px', fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>AUDITOR - RESPONSABLE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // VISTA 2: EJECUCIÓN E INFORMES DE AUDITORÍA (INTEGRACIÓN DE AUDITORIAS.GIT)
  // ============================================================================
  const renderListaInformes = () => {
    let totalCumple = 0;
    let totalOB = 0;
    let totalNC = 0;
    let totalOM = 0;
    informes.forEach(inf => {
      const r = calcularResumenInforme(inf);
      totalCumple += r.cumple;
      totalOB += r.ob;
      totalNC += r.nc;
      totalOM += r.oportunidadesCount;
    });

    return (
      <div className="animate-fade-in">
        <div className="module-header glass" style={{ padding: '24px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: 'var(--accent-color)', margin: '0 0 4px 0', fontSize: '24px' }}>
              Ejecución e Informes de Auditoría Interna (PAU/07 Anexo 4)
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13.5px' }}>
              Autoguardado instantáneo en cada clic/tecla — diseñado para auditorías extensas (+2 hs) sin riesgo de desconexión ni pérdida al generar el PDF.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => crearNuevoInforme()}>
            <Plus size={18} /> Nueva Auditoría Interna
          </button>
        </div>

        {/* KPIs Globales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div className="glass" style={{ padding: '18px 20px', borderLeft: '4px solid var(--accent-color)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Informes Registrados</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{informes.length}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Sectores auditados / en curso</div>
          </div>
          <div className="glass" style={{ padding: '18px 20px', borderLeft: '4px solid #16a34a' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Requisitos conformes</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{totalCumple}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Calificados como Cumple</div>
          </div>
          <div className="glass" style={{ padding: '18px 20px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Observaciones / NC</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{totalOB} OB / {totalNC} NC</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Detectadas para seguimiento</div>
          </div>
          <div className="glass" style={{ padding: '18px 20px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Oportunidades de Mejora</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>{totalOM}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Propuestas de mejora continua</div>
          </div>
        </div>

        {/* Grilla de Informes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {informes.map(inf => {
            const res = calcularResumenInforme(inf);
            return (
              <div
                key={inf.id}
                className="glass"
                onClick={() => { setSelectedInformeId(inf.id); setInformeSubTab('checklist'); }}
                style={{
                  padding: '22px', cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
                      backgroundColor: '#e0f2fe', color: '#0369a1'
                    }}>
                      {inf.codigoInforme || 'PAU/07-A4'} • {inf.anio}
                    </span>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
                      backgroundColor: inf.estado === 'Cerrada' ? '#dcfce7' : '#fef3c7',
                      color: inf.estado === 'Cerrada' ? '#15803d' : '#b45309'
                    }}>
                      {inf.estado}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{inf.sector}</h3>

                  <div style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Fecha: <strong>{inf.fechas_auditoria || '-'}</strong></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> Lugar: <strong>{inf.lugar || '-'}</strong></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> Auditor: <strong>{inf.auditor_responsable || '-'}</strong></div>
                  </div>

                  {/* Barra de avance del checklist */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      <span>Requisitos evaluados: {res.evaluados} / {res.totalRequisitos}</span>
                      <span>{res.porcentajeAvance}%</span>
                    </div>
                    <div style={{ width: '100%', height: '7px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${res.porcentajeAvance}%`, height: '100%', backgroundColor: 'var(--accent-color)' }} />
                    </div>
                  </div>

                  {/* Badges de resultados */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#dcfce7', color: '#166534' }}>
                      ✓ {res.cumple} Cumple
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#fef3c7', color: '#92400e' }}>
                      ⚠ {res.ob} OB
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#fee2e2', color: '#991b1b' }}>
                      ✕ {res.nc} NC
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#f3e8ff', color: '#6b21a8' }}>
                      ★ {res.fortalezasCount} FO / {res.oportunidadesCount} OM
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={(e) => { e.stopPropagation(); generarPDFInformeAuditoria(inf); }}
                    style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={14} /> Descargar PDF
                  </button>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {isSGI && (
                      <button
                        type="button"
                        onClick={(e) => eliminarInforme(inf.id, e)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                        title="Eliminar Informe"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--accent-color)' }}>Abrir Auditoría →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ============================================================================
  // EDITOR / EJECUTOR INTERACTIVO DE UN INFORME DE AUDITORÍA
  // ============================================================================
  const renderDetalleInforme = () => {
    if (!selectedInforme) return null;
    const res = calcularResumenInforme(selectedInforme);

    const requisitosFiltrados = REQUISITOS_NORMATIVOS.filter(req => {
      const ev = selectedInforme.evaluaciones?.[req.codigo] || { resultado: 'No Requiere' };
      if (capFilter !== 'TODOS' && req.capitulo !== capFilter) return false;
      if (resFilter === 'HALLAZGOS' && ev.resultado !== 'Observación (OB)' && ev.resultado !== 'No Conformidad (NC)') return false;
      if (resFilter === 'CUMPLE' && ev.resultado !== 'Cumple') return false;
      if (resFilter === 'PENDIENTES' && ev.resultado !== 'No Requiere') return false;
      if (searchReq.trim()) {
        const q = searchReq.toLowerCase();
        return (
          req.codigo.toLowerCase().includes(q) ||
          req.descripcion.toLowerCase().includes(q) ||
          req.pregunta.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return (
      <div className="animate-fade-in">
        {/* Banner de confirmación si el usuario toca "Guardar Informe" */}
        {saveBanner && (
          <div className="no-print" style={{
            backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534',
            padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', fontWeight: 600, fontSize: '13.5px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <ShieldCheck size={18} /> {saveBanner}
          </div>
        )}

        {/* Barra Superior del Informe */}
        <div className="no-print glass" style={{ padding: '20px 24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedInformeId(null)} style={{ padding: '8px 12px' }}>
                <ChevronLeft size={18} /> Volver
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '21px', color: '#0f172a' }}>{selectedInforme.sector}</h2>
                  <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: '#e0f2fe', color: '#0369a1' }}>
                    {selectedInforme.codigoInforme}
                  </span>
                  <span style={{
                    fontSize: '11.5px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                    background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                    display: 'inline-flex', alignItems: 'center', gap: '5px'
                  }}>
                    <ShieldCheck size={13} /> Autoguardado activo ({lastSavedAt})
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  Fecha: {selectedInforme.fechas_auditoria} • Lugar: {selectedInforme.lugar} • Auditor: {selectedInforme.auditor_responsable}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={selectedInforme.estado}
                onChange={(e) => updateInformeField('estado', e.target.value)}
                style={{
                  padding: '8px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '13px',
                  border: '1px solid #cbd5e1', background: selectedInforme.estado === 'Cerrada' ? '#dcfce7' : '#fef3c7',
                  color: selectedInforme.estado === 'Cerrada' ? '#166534' : '#92400e'
                }}
              >
                <option value="En Curso">Estado: En Curso</option>
                <option value="Cerrada">Estado: Cerrada / Finalizada</option>
              </select>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleManualSave}
                style={{ backgroundColor: '#16a34a', color: 'white', borderColor: '#16a34a' }}
              >
                <Save size={16} /> Guardar Informe
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setInformeSubTab('documento')}>
                <Eye size={16} /> Vista A4
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleManualSave();
                  generarPDFInformeAuditoria(selectedInforme);
                }}
              >
                <Download size={16} /> Generar y Descargar PDF
              </button>
            </div>
          </div>

          {/* Sub-pestañas del motor de auditoría */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'datos', label: '1. Datos y Equipo Auditor', icon: <Building2 size={15} /> },
                { id: 'checklist', label: `2. Checklist Normativo (${res.evaluados}/${res.totalRequisitos})`, icon: <ClipboardCheck size={15} /> },
                { id: 'hallazgos', label: `3. Fortalezas, OM y Firmas (${res.fortalezasCount + res.oportunidadesCount})`, icon: <Sparkles size={15} /> },
                { id: 'documento', label: '4. Informe Oficial A4 (PAU/07 A4)', icon: <FileText size={15} /> }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setInformeSubTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px',
                    border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                    background: informeSubTab === t.id ? 'var(--accent-color)' : '#f1f5f9',
                    color: informeSubTab === t.id ? 'white' : '#475569'
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: 700 }}>
              <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#dcfce7', color: '#166534' }}>Cumple: {res.cumple}</span>
              <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#fef3c7', color: '#92400e' }}>OB: {res.ob}</span>
              <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#fee2e2', color: '#991b1b' }}>NC: {res.nc}</span>
            </div>
          </div>
        </div>

        {/* SUB-PESTAÑA 1: DATOS GENERALES Y EQUIPO AUDITOR */}
        {informeSubTab === 'datos' && (
          <div className="glass" style={{ padding: '28px' }}>
            <h3 style={{ margin: '0 0 18px 0', color: '#0f172a', fontSize: '17px', borderLeft: '4px solid var(--accent-color)', paddingLeft: '10px' }}>
              1. Información General de la Auditoría
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Sector Auditado</label>
                <select
                  className="form-control"
                  value={selectedInforme.sector}
                  onChange={(e) => updateInformeField('sector', e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  {SECTORES_AUDITORIA.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Código de Informe</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedInforme.codigoInforme || ''}
                  onChange={(e) => updateInformeField('codigoInforme', e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Año</label>
                <input
                  type="number"
                  className="form-control"
                  value={selectedInforme.anio || 2026}
                  onChange={(e) => updateInformeField('anio', Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Fecha(s) de Auditoría</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedInforme.fechas_auditoria || ''}
                  onChange={(e) => updateInformeField('fechas_auditoria', e.target.value)}
                  placeholder="Ej: 2026-03-26 o 26/03/2026"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Lugar / Estación / Sede</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedInforme.lugar || ''}
                  onChange={(e) => updateInformeField('lugar', e.target.value)}
                  placeholder="Ej: Samborombón / Sede Central La Plata"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Tipo de Auditoría</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedInforme.tipo_auditoria || ''}
                  onChange={(e) => updateInformeField('tipo_auditoria', e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <h3 style={{ margin: '0 0 18px 0', color: '#0f172a', fontSize: '17px', borderLeft: '4px solid var(--accent-color)', paddingLeft: '10px' }}>
              2. Equipo Auditor y Personal Contactado
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Auditor Responsable</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedInforme.auditor_responsable || ''}
                  onChange={(e) => updateInformeField('auditor_responsable', e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Auditor Integrante 2</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedInforme.auditor_2 || ''}
                  onChange={(e) => updateInformeField('auditor_2', e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Auditor Integrante 3</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedInforme.auditor_3 || ''}
                  onChange={(e) => updateInformeField('auditor_3', e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Experto Técnico / Veedores</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedInforme.experto_tecnico || ''}
                  onChange={(e) => updateInformeField('experto_tecnico', e.target.value)}
                  placeholder="Opcional"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Personas Auditadas / Entrevistadas en el Sector</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedInforme.personas_auditadas || ''}
                  onChange={(e) => updateInformeField('personas_auditadas', e.target.value)}
                  placeholder="Ej: Mariano, Estela, Cristian, Alberto..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-primary" onClick={() => setInformeSubTab('checklist')}>
                Continuar al Checklist Normativo →
              </button>
            </div>
          </div>
        )}

        {/* SUB-PESTAÑA 2: CHECKLIST NORMATIVO INTEGRADO (28 REQUISITOS DE AUDITORIAS.GIT) */}
        {informeSubTab === 'checklist' && (
          <div>
            {/* Barra de Filtros por Capítulo ISO y Buscador */}
            <div className="glass" style={{ padding: '18px 22px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'TODOS', label: 'Todos los Capítulos (28)' },
                    { id: '4', label: 'Cap. 4 Contexto' },
                    { id: '5', label: 'Cap. 5 Liderazgo' },
                    { id: '6', label: 'Cap. 6 Planificación' },
                    { id: '7', label: 'Cap. 7 Apoyo' },
                    { id: '8', label: 'Cap. 8 Operación' },
                    { id: '9', label: 'Cap. 9 Desempeño' },
                    { id: '10', label: 'Cap. 10 Mejora' }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCapFilter(c.id)}
                      style={{
                        padding: '6px 12px', borderRadius: '999px', border: '1px solid',
                        borderColor: capFilter === c.id ? 'var(--accent-color)' : '#cbd5e1',
                        background: capFilter === c.id ? '#e0f2fe' : 'white',
                        color: capFilter === c.id ? '#0369a1' : '#475569',
                        fontWeight: 600, fontSize: '12px', cursor: 'pointer'
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => marcarCapituloCumple(capFilter)}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  title="Marca como 'Cumple' los requisitos de la vista actual que aún estén como 'No Requiere'"
                >
                  <CheckCircle2 size={14} /> Marcar pendientes del filtro como Cumple
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={searchReq}
                    onChange={(e) => setSearchReq(e.target.value)}
                    placeholder="Buscar por código (ej. 7.2, 8.1, 39001), requisito o pregunta guía..."
                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <select
                  value={resFilter}
                  onChange={(e) => setResFilter(e.target.value)}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
                >
                  <option value="TODOS">Ver todas las calificaciones</option>
                  <option value="HALLAZGOS">Solo Hallazgos (NC + OB)</option>
                  <option value="CUMPLE">Solo Cumple</option>
                  <option value="PENDIENTES">No Requiere / Sin Evaluar</option>
                </select>
              </div>
            </div>

            {/* Tarjetas de Evaluación Normativa */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {requisitosFiltrados.map(req => {
                const ev = selectedInforme.evaluaciones?.[req.codigo] || { resultado: 'No Requiere', evidencia: '', detalle: '', oportunidad: '' };
                const isNC = ev.resultado === 'No Conformidad (NC)';
                const isOB = ev.resultado === 'Observación (OB)';
                const isCumple = ev.resultado === 'Cumple';
                const isEvaluated = ev.resultado !== 'No Requiere';

                let borderColor = '#e2e8f0';
                if (isNC) borderColor = '#ef4444';
                else if (isOB) borderColor = '#f59e0b';
                else if (isCumple) borderColor = '#22c55e';

                return (
                  <div
                    key={req.codigo}
                    className="glass"
                    style={{
                      padding: '20px',
                      borderLeft: `5px solid ${borderColor}`,
                      backgroundColor: isNC ? '#fffafb' : isOB ? '#fffdf7' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ flex: '1', minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', background: '#f1f5f9', padding: '3px 9px', borderRadius: '6px' }}>
                            {req.codigo}
                          </span>
                          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>{req.tituloCapitulo}</span>
                          {req.normas.map(n => (
                            <span key={n} style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: '#e0f2fe', color: '#0369a1' }}>
                              {n}
                            </span>
                          ))}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                          {req.descripcion}
                        </div>
                        <div style={{ fontSize: '13px', color: '#0369a1', background: '#f0f9ff', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' }}>
                          <strong>Pregunta guía:</strong> {req.pregunta}
                        </div>
                      </div>

                      {/* Botonera de Calificación Directa */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                          { val: 'Cumple', label: 'Cumple', bg: '#dcfce7', activeBg: '#16a34a', color: '#166534' },
                          { val: 'Observación (OB)', label: 'Observación (OB)', bg: '#fef3c7', activeBg: '#d97706', color: '#92400e' },
                          { val: 'No Conformidad (NC)', label: 'No Conformidad (NC)', bg: '#fee2e2', activeBg: '#dc2626', color: '#991b1b' },
                          { val: 'No Requiere', label: 'No Aplica / S/E', bg: '#f1f5f9', activeBg: '#475569', color: '#475569' }
                        ].map(opt => {
                          const active = ev.resultado === opt.val;
                          return (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => updateEvaluacion(req.codigo, 'resultado', opt.val)}
                              style={{
                                padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                                border: active ? `2px solid ${opt.activeBg}` : '1px solid #cbd5e1',
                                backgroundColor: active ? opt.activeBg : 'white',
                                color: active ? 'white' : opt.color,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Campos de Evidencia, Detalle del Hallazgo y Oportunidad de Mejora */}
                    {isEvaluated && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            Evidencia Objetiva Verificada (Documentos, registros, entrevistas)
                          </label>
                          <textarea
                            rows="2"
                            value={ev.evidencia || ''}
                            onChange={(e) => updateEvaluacion(req.codigo, 'evidencia', e.target.value)}
                            placeholder="Ej: Se verificó matriz FODA, registros de capacitación, legajos..."
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                          />
                        </div>

                        {(isNC || isOB) ? (
                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: isNC ? '#dc2626' : '#d97706', marginBottom: '4px' }}>
                              Detalle del Hallazgo ({ev.resultado}) *
                            </label>
                            <textarea
                              rows="2"
                              value={ev.detalle || ''}
                              onChange={(e) => updateEvaluacion(req.codigo, 'detalle', e.target.value)}
                              placeholder="Describa el desvío u observación detectada con precisión..."
                              style={{
                                width: '100%', padding: '8px 10px', borderRadius: '8px', fontSize: '12.5px',
                                border: `1px solid ${isNC ? '#fca5a5' : '#fcd34d'}`,
                                backgroundColor: isNC ? '#fef2f2' : '#fffbeb'
                              }}
                            />
                          </div>
                        ) : (
                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#6b21a8', marginBottom: '4px' }}>
                              Oportunidad de Mejora asociada al requisito (Opcional)
                            </label>
                            <textarea
                              rows="2"
                              value={ev.oportunidad || ''}
                              onChange={(e) => updateEvaluacion(req.codigo, 'oportunidad', e.target.value)}
                              placeholder="Si identificó una mejora para este punto, anótela aquí..."
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUB-PESTAÑA 3: FORTALEZAS, OPORTUNIDADES DE MEJORA, CONCLUSIONES Y FIRMAS */}
        {informeSubTab === 'hallazgos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
              {/* Fortalezas (FO) */}
              <div className="glass" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Fortalezas Detectadas (FO)</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Aspectos destacados positivamente en el sector auditado</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => updateInformeField('fortalezas', [...(selectedInforme.fortalezas || []), ''])}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <Plus size={14} /> Agregar Fortaleza
                  </button>
                </div>
                {(selectedInforme.fortalezas || []).map((f, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <textarea
                      rows="2"
                      value={f}
                      onChange={(e) => {
                        const nuevas = [...(selectedInforme.fortalezas || [])];
                        nuevas[idx] = e.target.value;
                        updateInformeField('fortalezas', nuevas);
                      }}
                      placeholder="Describa la fortaleza identificada..."
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nuevas = (selectedInforme.fortalezas || []).filter((_, i) => i !== idx);
                        updateInformeField('fortalezas', nuevas);
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Oportunidades de Mejora Generales (OM) */}
              <div className="glass" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Oportunidades de Mejora (OM)</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Recomendaciones para optimizar procesos del SGI</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => updateInformeField('oportunidades', [...(selectedInforme.oportunidades || []), ''])}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <Plus size={14} /> Agregar OM
                  </button>
                </div>
                {(selectedInforme.oportunidades || []).map((o, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <textarea
                      rows="2"
                      value={o}
                      onChange={(e) => {
                        const nuevas = [...(selectedInforme.oportunidades || [])];
                        nuevas[idx] = e.target.value;
                        updateInformeField('oportunidades', nuevas);
                      }}
                      placeholder="Describa la oportunidad de mejora..."
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nuevas = (selectedInforme.oportunidades || []).filter((_, i) => i !== idx);
                        updateInformeField('oportunidades', nuevas);
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Conclusiones y Firmas del Informe */}
            <div className="glass" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0f172a' }}>Conclusiones Generales de la Auditoría</h3>
              <textarea
                rows="3"
                value={selectedInforme.conclusiones || ''}
                onChange={(e) => updateInformeField('conclusiones', e.target.value)}
                placeholder="Síntesis de las conclusiones del equipo auditor..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', marginBottom: '24px' }}
              />

              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Firmas de Conformidad del Informe (Dibujo en pantalla o Subida de Imagen + Nombre y Apellido)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {/* Firma Auditor */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', textAlign: 'center', background: '#f8fafc' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px' }}>POR EL EQUIPO AUDITOR SGI</div>
                  {selectedInforme.firmaAuditor ? (
                    <div style={{ marginBottom: '12px' }}>
                      <img src={selectedInforme.firmaAuditor} alt="Firma Auditor" style={{ maxHeight: '75px', maxWidth: '220px', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{ height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>
                      Sin firma registrada
                    </div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', marginBottom: '10px' }}>
                    {selectedInforme.nombreFirmaAuditor || selectedInforme.auditor_responsable || 'Nombre y Apellido'}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openSignatureModal(
                      'Firma del Auditor Responsable',
                      selectedInforme.firmaAuditor,
                      selectedInforme.nombreFirmaAuditor || selectedInforme.auditor_responsable,
                      (img, nom) => {
                        updateInformeField('firmaAuditor', img);
                        updateInformeField('nombreFirmaAuditor', nom);
                      }
                    )}
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    <PenTool size={14} /> {selectedInforme.firmaAuditor ? 'Cambiar Firma / Nombre' : 'Firmar o Subir Imagen'}
                  </button>
                </div>

                {/* Firma Sector Auditado */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', textAlign: 'center', background: '#f8fafc' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px' }}>POR EL SECTOR AUDITADO</div>
                  {selectedInforme.firmaResponsableSector ? (
                    <div style={{ marginBottom: '12px' }}>
                      <img src={selectedInforme.firmaResponsableSector} alt="Firma Sector" style={{ maxHeight: '75px', maxWidth: '220px', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{ height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>
                      Sin firma registrada
                    </div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', marginBottom: '10px' }}>
                    {selectedInforme.nombreFirmaResponsable || 'Responsable del Sector'}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openSignatureModal(
                      'Firma del Responsable del Sector Auditado',
                      selectedInforme.firmaResponsableSector,
                      selectedInforme.nombreFirmaResponsable,
                      (img, nom) => {
                        updateInformeField('firmaResponsableSector', img);
                        updateInformeField('nombreFirmaResponsable', nom);
                      }
                    )}
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    <PenTool size={14} /> {selectedInforme.firmaResponsableSector ? 'Cambiar Firma / Nombre' : 'Firmar o Subir Imagen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-PESTAÑA 4: DOCUMENTO OFICIAL IMPRIMIBLE A4 (PAU/07 ANEXO 4) */}
        {informeSubTab === 'documento' && (
          <div className="printable-doc" style={{ background: 'white', padding: '45px 55px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', maxWidth: '1000px', margin: '0 auto', border: '1px solid #e2e8f0', color: '#1e293b' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => window.print()}><Printer size={16} /> Imprimir Hoja A4</button>
              <button type="button" className="btn btn-primary" onClick={() => { handleManualSave(); generarPDFInformeAuditoria(selectedInforme); }}><Download size={16} /> Exportar PDF Directo</button>
            </div>

            <div className="print-header" style={{ display: 'flex', border: '1px solid #000', marginBottom: '28px' }}>
              <div style={{ width: '25%', borderRight: '1px solid #000', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h2 style={{ margin: 0, color: '#006d77', fontSize: '28px', fontWeight: 800 }}>AUBASA</h2>
                <small style={{ fontSize: '10px', textAlign: 'center', fontWeight: 600, color: '#475569', marginTop: '4px' }}>AUTOPISTAS DE BUENOS AIRES S.A.</small>
              </div>
              <div style={{ width: '50%', borderRight: '1px solid #000', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <strong style={{ fontSize: '13px', color: '#006d77' }}>PAU/07 - ANEXO 4</strong>
                <strong style={{ fontSize: '16px', color: '#0f172a', marginTop: '4px', lineHeight: '1.3' }}>INFORME DE AUDITORÍA INTERNA DEL SISTEMA DE GESTIÓN INTEGRADO</strong>
              </div>
              <div style={{ width: '25%', padding: '12px 16px', fontSize: '11px', lineHeight: '1.8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Informe:</strong> <span>{selectedInforme.codigoInforme}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Fecha:</strong> <span>{selectedInforme.fechas_auditoria}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Normas:</strong> <span>9001/39001/3810</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Estado:</strong> <span>{selectedInforme.estado}</span></div>
              </div>
            </div>

            {/* 1. Datos Generales */}
            <div style={{ backgroundColor: '#006d77', color: 'white', padding: '7px 12px', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
              1. INFORMACIÓN GENERAL Y EQUIPO AUDITOR
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '12.5px', marginBottom: '22px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', width: '50%' }}><strong>Sector Auditado:</strong> {selectedInforme.sector}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', width: '50%' }}><strong>Lugar / Sede:</strong> {selectedInforme.lugar}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}><strong>Auditor Responsable:</strong> {selectedInforme.auditor_responsable} {selectedInforme.auditor_2 ? `/ ${selectedInforme.auditor_2}` : ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}><strong>Personas Contactadas:</strong> {selectedInforme.personas_auditadas || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* 2. Hallazgos Categorizados */}
            <div style={{ backgroundColor: '#006d77', color: 'white', padding: '7px 12px', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
              2. RESUMEN DE HALLAZGOS (FORTALEZAS, OPORTUNIDADES, OBSERVACIONES Y NO CONFORMIDADES)
            </div>
            <div style={{ border: '1px solid #cbd5e1', padding: '14px', fontSize: '12.5px', marginBottom: '22px', lineHeight: '1.6' }}>
              {(selectedInforme.fortalezas || []).filter(f => f.trim()).length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#0f766e' }}>• Fortalezas (FO):</strong>
                  <ul style={{ margin: '4px 0 0 20px' }}>
                    {selectedInforme.fortalezas.filter(f => f.trim()).map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
              {((selectedInforme.oportunidades || []).filter(o => o.trim()).length > 0 || res.listaOMReq.length > 0) && (
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#6b21a8' }}>• Oportunidades de Mejora (OM):</strong>
                  <ul style={{ margin: '4px 0 0 20px' }}>
                    {selectedInforme.oportunidades.filter(o => o.trim()).map((o, i) => <li key={`g-${i}`}>{o}</li>)}
                    {res.listaOMReq.map((om, i) => <li key={`r-${i}`}><strong>[{om.codigo}]</strong> {om.texto}</li>)}
                  </ul>
                </div>
              )}
              {res.listaOB.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#b45309' }}>• Observaciones (OB):</strong>
                  <ul style={{ margin: '4px 0 0 20px' }}>
                    {res.listaOB.map((ob, i) => <li key={i}><strong>[{ob.codigo} - {ob.descripcion}]:</strong> {ob.detalle}</li>)}
                  </ul>
                </div>
              )}
              {res.listaNC.length > 0 && (
                <div>
                  <strong style={{ color: '#dc2626' }}>• No Conformidades (NC):</strong>
                  <ul style={{ margin: '4px 0 0 20px' }}>
                    {res.listaNC.map((nc, i) => <li key={i}><strong>[{nc.codigo} - {nc.descripcion}]:</strong> {nc.detalle}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* 3. Tabla de Requisitos Evaluados */}
            <div style={{ backgroundColor: '#006d77', color: 'white', padding: '7px 12px', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
              3. DETALLE DE REQUISITOS EVALUADOS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '11.5px', marginBottom: '24px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ border: '1px solid #cbd5e1', padding: '7px', width: '20%' }}>Cláusula</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '7px', width: '30%' }}>Requisito</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '7px', width: '15%', textAlign: 'center' }}>Calificación</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '7px', width: '35%' }}>Evidencia / Detalle</th>
                </tr>
              </thead>
              <tbody>
                {REQUISITOS_NORMATIVOS.filter(r => {
                  const ev = selectedInforme.evaluaciones?.[r.codigo];
                  return ev && (ev.resultado !== 'No Requiere' || ev.evidencia || ev.detalle);
                }).map(r => {
                  const ev = selectedInforme.evaluaciones[r.codigo];
                  return (
                    <tr key={r.codigo}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 700 }}>{r.codigo}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>{r.descripcion}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', fontWeight: 700 }}>{ev.resultado}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>
                        {ev.evidencia}
                        {ev.detalle ? <div style={{ color: '#b91c1c', marginTop: '3px' }}><strong>Hallazgo:</strong> {ev.detalle}</div> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Firmas en Hoja A4 */}
            <div style={{ marginTop: '45px', display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center', width: '240px' }}>
                <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '6px' }}>
                  {selectedInforme.firmaAuditor && <img src={selectedInforme.firmaAuditor} alt="Firma Auditor" style={{ maxHeight: '70px', maxWidth: '200px' }} />}
                </div>
                <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px', fontWeight: 700, fontSize: '12.5px' }}>
                  {selectedInforme.nombreFirmaAuditor || selectedInforme.auditor_responsable || 'Firma Auditor'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>AUDITOR SGI</div>
              </div>

              <div style={{ textAlign: 'center', width: '240px' }}>
                <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '6px' }}>
                  {selectedInforme.firmaResponsableSector && <img src={selectedInforme.firmaResponsableSector} alt="Firma Sector" style={{ maxHeight: '70px', maxWidth: '200px' }} />}
                </div>
                <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px', fontWeight: 700, fontSize: '12.5px' }}>
                  {selectedInforme.nombreFirmaResponsable || 'Responsable Sector Auditado'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>SECTOR AUDITADO</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // VISTA 3: TABLERO CONSOLIDADO DE HALLAZGOS (PAU/08)
  // ============================================================================
  const renderTableroHallazgos = () => {
    const todosHallazgos = [];
    informes.forEach(inf => {
      const res = calcularResumenInforme(inf);
      res.listaNC.forEach(nc => {
        todosHallazgos.push({
          informeId: inf.id,
          sector: inf.sector,
          fecha: inf.fechas_auditoria,
          tipo: 'No Conformidad (NC)',
          clausula: nc.codigo,
          requisito: nc.descripcion,
          descripcion: nc.detalle || nc.evidencia || 'Sin detalle',
          colorBg: '#fee2e2',
          colorText: '#991b1b'
        });
      });
      res.listaOB.forEach(ob => {
        todosHallazgos.push({
          informeId: inf.id,
          sector: inf.sector,
          fecha: inf.fechas_auditoria,
          tipo: 'Observación (OB)',
          clausula: ob.codigo,
          requisito: ob.descripcion,
          descripcion: ob.detalle || ob.evidencia || 'Sin detalle',
          colorBg: '#fef3c7',
          colorText: '#92400e'
        });
      });
      res.listaOMReq.forEach(om => {
        todosHallazgos.push({
          informeId: inf.id,
          sector: inf.sector,
          fecha: inf.fechas_auditoria,
          tipo: 'Oportunidad de Mejora (OM)',
          clausula: om.codigo,
          requisito: om.descripcion,
          descripcion: om.texto,
          colorBg: '#f3e8ff',
          colorText: '#6b21a8'
        });
      });
      (inf.oportunidades || []).filter(o => o.trim()).forEach(o => {
        todosHallazgos.push({
          informeId: inf.id,
          sector: inf.sector,
          fecha: inf.fechas_auditoria,
          tipo: 'Oportunidad de Mejora (OM)',
          clausula: 'General SGI',
          requisito: 'Mejora Continua',
          descripcion: o,
          colorBg: '#f3e8ff',
          colorText: '#6b21a8'
        });
      });
    });

    return (
      <div className="animate-fade-in">
        <div className="module-header glass" style={{ padding: '24px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: 'var(--accent-color)', margin: '0 0 4px 0', fontSize: '24px' }}>
              Matriz Consolidada de Hallazgos de Auditoría (PAU/07 y PAU/08)
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13.5px' }}>
              Consolidado automático de todas las No Conformidades (NC), Observaciones (OB) y Oportunidades de Mejora (OM) relevadas en los informes.
            </p>
          </div>
        </div>

        <div className="glass" style={{ padding: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Tipo de Hallazgo</th>
                <th style={{ padding: '12px' }}>Sector Auditado</th>
                <th style={{ padding: '12px' }}>Fecha</th>
                <th style={{ padding: '12px' }}>Cláusula / Ref.</th>
                <th style={{ padding: '12px' }}>Descripción del Hallazgo / Mejora</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Informe</th>
              </tr>
            </thead>
            <tbody>
              {todosHallazgos.map((h, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', backgroundColor: h.colorBg, color: h.colorText }}>
                      {h.tipo}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{h.sector}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{h.fecha}</td>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#334155' }}>{h.clausula}</td>
                  <td style={{ padding: '12px', color: '#1e293b', maxWidth: '420px' }}>{h.descripcion}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => { setSelectedInformeId(h.informeId); setInformeSubTab('checklist'); setActiveTab('informes'); }}
                      style={{ padding: '5px 10px', fontSize: '11.5px' }}
                    >
                      Ver Informe
                    </button>
                  </td>
                </tr>
              ))}
              {todosHallazgos.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No hay hallazgos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="module-container">
      {/* Pestañas principales del módulo */}
      <div className="no-print">
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '28px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'informes' ? 'active' : ''}`}
            onClick={() => { setActiveTab('informes'); setIsEditing(false); }}
            style={{
              padding: '12px 20px', background: 'transparent', border: 'none',
              borderBottom: activeTab === 'informes' ? '3px solid var(--accent-color)' : '3px solid transparent',
              color: activeTab === 'informes' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: 700, cursor: 'pointer', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <ClipboardCheck size={18} /> Ejecución e Informes de Auditoría (PAU/07 A4)
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'programa' ? 'active' : ''}`}
            onClick={() => { setActiveTab('programa'); setViewMode('general'); setIsEditing(false); }}
            style={{
              padding: '12px 20px', background: 'transparent', border: 'none',
              borderBottom: activeTab === 'programa' ? '3px solid var(--accent-color)' : '3px solid transparent',
              color: activeTab === 'programa' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: 700, cursor: 'pointer', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Calendar size={18} /> Programa Anual y Planes Sectoriales (PAU/07 A2 y A3)
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'hallazgos' ? 'active' : ''}`}
            onClick={() => { setActiveTab('hallazgos'); setIsEditing(false); }}
            style={{
              padding: '12px 20px', background: 'transparent', border: 'none',
              borderBottom: activeTab === 'hallazgos' ? '3px solid var(--accent-color)' : '3px solid transparent',
              color: activeTab === 'hallazgos' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: 700, cursor: 'pointer', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <AlertTriangle size={18} /> Matriz de Hallazgos (NC / OB / OM)
          </button>
        </div>
      </div>

      {activeTab === 'informes' && (!selectedInformeId ? renderListaInformes() : renderDetalleInforme())}
      {activeTab === 'programa' && viewMode === 'general' && renderProgramaGeneral()}
      {activeTab === 'programa' && viewMode === 'sectorial' && renderPlanSectorial()}
      {activeTab === 'hallazgos' && renderTableroHallazgos()}

      <SignatureModal
        isOpen={sigModal.open}
        title={sigModal.title}
        currentImage={sigModal.currentImage}
        currentName={sigModal.currentName}
        onSave={sigModal.onSave}
        onClose={() => setSigModal({ ...sigModal, open: false })}
      />
    </div>
  );
}

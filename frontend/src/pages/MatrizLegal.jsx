import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scale, FileText, UploadCloud, Search, Filter, Calendar, Users, 
  CheckCircle2, AlertCircle, ArrowUpRight, Plus, RefreshCw, Printer, 
  ChevronRight, Download, BookOpen, Layers, ShieldCheck, Tag
} from 'lucide-react';
import { obtenerMatrizLegal, guardarMatrizLegal, procesarExcelMatriz } from '../lib/matrizLegalApi';

export default function MatrizLegal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matriz'); // 'matriz' | 'cambios' | 'partes' | 'subir' | 'imprimir'

  // Filtros de la Matriz
  const [busqueda, setBusqueda] = useState('');
  const [filtroMateria, setFiltroMateria] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroAlcance, setFiltroAlcance] = useState('todos');

  // Selector de período de cambios
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');

  // Estado para subida de Excel
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [resultadoSubida, setResultadoSubida] = useState(null);
  const [errorSubida, setErrorSubida] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardadoExito, setGuardadoExito] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await obtenerMatrizLegal();
      setData(res);
      // Seleccionar por defecto la revisión más reciente
      if (res && res.revisiones) {
        const revKeys = Object.keys(res.revisiones);
        if (revKeys.length > 0) {
          setPeriodoSeleccionado(revKeys[revKeys.length - 1]);
        }
      }
    } catch (err) {
      console.error('Error cargando matriz legal:', err);
    } finally {
      setLoading(false);
    }
  };

  // Opciones únicas para filtros
  const materiasUnicas = useMemo(() => {
    if (!data || !data.normas) return [];
    const set = new Set(data.normas.map(n => n.referencia).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const tiposUnicos = useMemo(() => {
    if (!data || !data.normas) return [];
    const set = new Set(data.normas.map(n => n.tipo).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const alcancesUnicos = useMemo(() => {
    if (!data || !data.normas) return [];
    const set = new Set(data.normas.map(n => n.alcance).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  // Normas filtradas
  const normasFiltradas = useMemo(() => {
    if (!data || !data.normas) return [];
    return data.normas.filter(n => {
      const matchBusqueda = !busqueda || 
        (n.materia && n.materia.toLowerCase().includes(busqueda.toLowerCase())) ||
        (n.nro && n.nro.toLowerCase().includes(busqueda.toLowerCase())) ||
        (n.tipo && n.tipo.toLowerCase().includes(busqueda.toLowerCase())) ||
        (n.referencia && n.referencia.toLowerCase().includes(busqueda.toLowerCase())) ||
        (n.partesInteresadas && n.partesInteresadas.toLowerCase().includes(busqueda.toLowerCase()));

      const matchMateria = filtroMateria === 'todas' || n.referencia === filtroMateria;
      const matchTipo = filtroTipo === 'todos' || n.tipo === filtroTipo;
      const matchAlcance = filtroAlcance === 'todos' || n.alcance === filtroAlcance;

      return matchBusqueda && matchMateria && matchTipo && matchAlcance;
    });
  }, [data, busqueda, filtroMateria, filtroTipo, filtroAlcance]);

  // Manejo de carga de archivo Excel
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoArchivo(true);
    setErrorSubida(null);
    setResultadoSubida(null);

    try {
      const parsed = await procesarExcelMatriz(file);
      setResultadoSubida({
        nombreArchivo: file.name,
        totalNormas: parsed.normas.length,
        totalPI: parsed.partesInteresadas.length,
        revisionesEncontradas: Object.keys(parsed.revisiones),
        datos: parsed
      });
    } catch (err) {
      console.error(err);
      setErrorSubida('Error al leer el archivo Excel. Asegúrate de que tenga el formato de Matriz Legal de AUBASA.');
    } finally {
      setSubiendoArchivo(false);
    }
  };

  // Confirmar y aplicar nueva versión del Excel
  const handleAplicarExcel = async () => {
    if (!resultadoSubida || !resultadoSubida.datos) return;
    setGuardando(true);
    try {
      const nuevoData = {
        codigo: 'PAU-02 Anexo 3.1 & 3.2',
        titulo: 'Matriz Legal y Control de Documentación Externa',
        normas: resultadoSubida.datos.normas.length > 0 ? resultadoSubida.datos.normas : data.normas,
        partesInteresadas: resultadoSubida.datos.partesInteresadas.length > 0 ? resultadoSubida.datos.partesInteresadas : data.partesInteresadas,
        revisiones: {
          ...data.revisiones,
          ...resultadoSubida.datos.revisiones
        },
        ultimaActualizacion: new Date().toISOString().split('T')[0]
      };

      await guardarMatrizLegal(nuevoData);
      setData(nuevoData);
      setGuardadoExito(true);
      setTimeout(() => {
        setGuardadoExito(false);
        setResultadoSubida(null);
        setActiveTab('matriz');
      }, 2000);
    } catch (err) {
      console.error(err);
      setErrorSubida('Error al persistir los cambios en la base de datos.');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748b' }}>
        <RefreshCw className="animate-spin" size={40} style={{ color: '#0284c7', marginBottom: 16 }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Cargando Matriz Legal AUBASA...</h3>
        <p style={{ fontSize: '0.9rem' }}>Recuperando registros vigentes y revisiones periódicas</p>
      </div>
    );
  }

  const revisionesKeys = data?.revisiones ? Object.keys(data.revisiones) : [];
  const cambiosActuales = data?.revisiones && periodoSeleccionado ? (data.revisiones[periodoSeleccionado] || []) : [];

  return (
    <div className="matriz-legal-container" style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', color: '#0f172a' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ backgroundColor: '#e0f2fe', padding: 8, borderRadius: 10, color: '#0284c7' }}>
              <Scale size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, backgroundColor: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                  PAU-02 / Anexo 3.1 & 3.2
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Rev. Vigente: Octubre 2026</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Matriz Legal y Control Documental Externo
              </h1>
            </div>
          </div>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem' }}>
            Identificación, evaluación de cumplimiento y seguimiento mensual de normativa legal y técnica del Sistema de Gestión Integrado (ISO 9001 / ISO 39001).
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('subir')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
              transition: 'background 0.2s'
            }}
          >
            <UploadCloud size={18} />
            Actualizar con Excel Mensual
          </button>
          
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#ffffff',
              color: '#475569',
              border: '1px solid #cbd5e1',
              padding: '10px 16px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <Printer size={18} />
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
            <span>TOTAL NORMAS VIGENTES</span>
            <Scale size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{data?.normas?.length || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={14} /> 100% evaluadas y catalogadas
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
            <span>MATERIAS Y ÁMBITOS</span>
            <Layers size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{materiasUnicas.length}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
            Contractuales, Tarifas, Tránsito, SST, Ambiental
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
            <span>PARTES INTERESADAS (A-3.2)</span>
            <Users size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{data?.partesInteresadas?.length || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
            Mapeo ISO 9001 / ISO 39001
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
            <span>HISTORIAL DE REVISIONES</span>
            <Calendar size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{revisionesKeys.length} meses</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
            Último control: Octubre 2026
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', marginBottom: 20, gap: 8 }}>
        <button
          onClick={() => setActiveTab('matriz')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'matriz' ? '3px solid #0284c7' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'matriz' ? '#0284c7' : '#64748b',
            fontWeight: activeTab === 'matriz' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          <Scale size={18} />
          Matriz Legal Vigente ({data?.normas?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('cambios')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'cambios' ? '3px solid #0284c7' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'cambios' ? '#0284c7' : '#64748b',
            fontWeight: activeTab === 'cambios' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={18} />
          Registro de Cambios Mensuales
        </button>

        <button
          onClick={() => setActiveTab('partes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'partes' ? '3px solid #0284c7' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'partes' ? '#0284c7' : '#64748b',
            fontWeight: activeTab === 'partes' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          <Users size={18} />
          Partes Interesadas (Anexo 3.2)
        </button>

        <button
          onClick={() => setActiveTab('subir')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'subir' ? '3px solid #0284c7' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'subir' ? '#0284c7' : '#64748b',
            fontWeight: activeTab === 'subir' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          <UploadCloud size={18} />
          Subir Excel Mensual
        </button>
      </div>

      {/* CONTENIDO TAB 1: MATRIZ LEGAL VIGENTE */}
      {activeTab === 'matriz' && (
        <div>
          {/* BARRA DE BÚSQUEDA Y FILTROS */}
          <div style={{ backgroundColor: '#ffffff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 280px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Buscar por número, tipo, materia, parte interesada..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={filtroMateria}
                onChange={e => setFiltroMateria(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', outline: 'none' }}
              >
                <option value="todas">Todas las materias ({materiasUnicas.length})</option>
                {materiasUnicas.map(m => (
                  <option key={m} value={m}>{m.replace(/\n/g, ' ')}</option>
                ))}
              </select>

              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', outline: 'none' }}
              >
                <option value="todos">Todos los tipos</option>
                {tiposUnicos.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                value={filtroAlcance}
                onChange={e => setFiltroAlcance(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', outline: 'none' }}
              >
                <option value="todos">Todos los alcances</option>
                {alcancesUnicos.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>

              {(busqueda || filtroMateria !== 'todas' || filtroTipo !== 'todos' || filtroAlcance !== 'todos') && (
                <button
                  onClick={() => {
                    setBusqueda('');
                    setFiltroMateria('todas');
                    setFiltroTipo('todos');
                    setFiltroAlcance('todos');
                  }}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* TABLA DE NORMAS */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px', width: '160px' }}>Referencia / Materia</th>
                    <th style={{ padding: '12px 14px', width: '130px' }}>Norma (Tipo y N°)</th>
                    <th style={{ padding: '12px 10px', width: '80px' }}>Año/Fecha</th>
                    <th style={{ padding: '12px 12px', width: '100px' }}>Alcance</th>
                    <th style={{ padding: '12px 16px' }}>Descripción / Objeto</th>
                    <th style={{ padding: '12px 16px', width: '180px' }}>Partes Interesadas</th>
                    <th style={{ padding: '12px 12px', width: '100px', textAlign: 'center' }}>Estado</th>
                    <th style={{ padding: '12px 14px', width: '90px', textAlign: 'center' }}>Consulta</th>
                  </tr>
                </thead>
                <tbody>
                  {normasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                        No se encontraron normas legales con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    normasFiltradas.map((norma, idx) => (
                      <tr 
                        key={norma.id || idx}
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0369a1', verticalAlign: 'top' }}>
                          {norma.referencia ? norma.referencia.replace(/\n/g, ' ') : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{norma.tipo}</span>
                          {norma.nro && (
                            <span style={{ display: 'block', color: '#475569', fontSize: '0.8rem' }}>
                              N° {norma.nro}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px', color: '#64748b', verticalAlign: 'top' }}>
                          {norma.fecha || '—'}
                        </td>
                        <td style={{ padding: '12px 12px', verticalAlign: 'top' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: norma.alcance?.toLowerCase().includes('nacional') ? '#eff6ff' : norma.alcance?.toLowerCase().includes('prov') ? '#f0fdf4' : '#f8fafc',
                            color: norma.alcance?.toLowerCase().includes('nacional') ? '#1d4ed8' : norma.alcance?.toLowerCase().includes('prov') ? '#15803d' : '#475569'
                          }}>
                            {norma.alcance || 'Nacional'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#334155', verticalAlign: 'top', lineHeight: 1.45 }}>
                          {norma.materia}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.8rem', verticalAlign: 'top' }}>
                          {norma.partesInteresadas ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {norma.partesInteresadas.split('\n').filter(Boolean).map((pi, piIdx) => (
                                <span key={piIdx} style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                                  {pi.replace(/"/g, '')}
                                </span>
                              ))}
                            </div>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'center', verticalAlign: 'top' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: '#dcfce7',
                            color: '#15803d'
                          }}>
                            <CheckCircle2 size={12} />
                            Vigente
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'top' }}>
                          {(norma.sitioWeb || norma.boletin) ? (
                            <a
                              href={norma.sitioWeb?.startsWith('http') ? norma.sitioWeb : (norma.boletin?.startsWith('http') ? norma.boletin : `https://www.google.com/search?q=${encodeURIComponent(`${norma.tipo} ${norma.nro} ${norma.alcance || ''}`)}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Consultar texto oficial"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, backgroundColor: '#f0f9ff', color: '#0284c7', textDecoration: 'none' }}
                            >
                              <ArrowUpRight size={16} />
                            </a>
                          ) : (
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(`${norma.tipo} ${norma.nro} Argentina`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Buscar en Infoleg / GBA"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, backgroundColor: '#f8fafc', color: '#94a3b8', textDecoration: 'none' }}
                            >
                              <ArrowUpRight size={14} />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Mostrando {normasFiltradas.length} de {data?.normas?.length || 0} normas vigentes en el SGI</span>
              <span style={{ fontSize: '0.8rem' }}>Formato PAU-02 Anexo 3.1 Rev. 01</span>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 2: REGISTRO DE CAMBIOS MENSUALES */}
      {activeTab === 'cambios' && (
        <div>
          <div style={{ backgroundColor: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Control Periódico de Modificaciones, Altas y Bajas Normativas
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                  Selecciona el período mensual para revisar las resoluciones incorporadas, derogadas o reemplazadas por la Gerencia de Asuntos Legales.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Período evaluado:</span>
                <select
                  value={periodoSeleccionado}
                  onChange={e => setPeriodoSeleccionado(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid #0284c7',
                    backgroundColor: '#f0f9ff',
                    color: '#0369a1',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {revisionesKeys.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color="#0284c7" />
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Registro correspondiente a: {periodoSeleccionado}</span>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {cambiosActuales.length} movimiento(s) registrado(s)
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    <th style={{ padding: '12px 16px', width: '160px' }}>Materia / Referencia</th>
                    <th style={{ padding: '12px 14px', width: '140px' }}>Norma</th>
                    <th style={{ padding: '12px 10px', width: '90px' }}>Fecha</th>
                    <th style={{ padding: '12px 12px', width: '110px' }}>Acción</th>
                    <th style={{ padding: '12px 16px' }}>Materia / Contenido</th>
                    <th style={{ padding: '12px 16px' }}>Observación / Justificación Legal</th>
                  </tr>
                </thead>
                <tbody>
                  {cambiosActuales.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                        Sin novedades registradas para el período {periodoSeleccionado}.
                      </td>
                    </tr>
                  ) : (
                    cambiosActuales.map((item, idx) => (
                      <tr 
                        key={idx}
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: item.accion === 'Incorporada' ? '#f0fdf4' : item.accion === 'Eliminada / Baja' ? '#fef2f2' : '#ffffff'
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0369a1', verticalAlign: 'top' }}>
                          {item.referencia || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.tipo}</span>
                          {item.nro && (
                            <span style={{ display: 'block', color: '#475569', fontSize: '0.8rem' }}>
                              N° {item.nro}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px', color: '#64748b', verticalAlign: 'top' }}>
                          {item.fecha || '—'}
                        </td>
                        <td style={{ padding: '12px 12px', verticalAlign: 'top' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: item.accion === 'Incorporada' ? '#bbf7d0' : item.accion === 'Eliminada / Baja' ? '#fecaca' : '#fed7aa',
                            color: item.accion === 'Incorporada' ? '#14532d' : item.accion === 'Eliminada / Baja' ? '#991b1b' : '#9a3412'
                          }}>
                            {item.accion || 'Modificación'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#334155', verticalAlign: 'top', lineHeight: 1.45 }}>
                          {item.materia || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 500, verticalAlign: 'top', lineHeight: 1.45 }}>
                          {item.observacion || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 3: PARTES INTERESADAS (ANEXO 3.2) */}
      {activeTab === 'partes' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#059669', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>
                PAU/02 ANEXO 3.2
              </span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Rev. 0 | Emisión: 03.May.2026</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Identificación de Partes Interesadas y Requisitos del SGI
            </h3>
            <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Matriz de necesidades, expectativas y requisitos pertinentes aplicables a ISO 9001:2015 e ISO 39001:2015.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 16px', width: '180px' }}>Parte Interesada</th>
                  <th style={{ padding: '12px 12px', width: '100px' }}>Tipo</th>
                  <th style={{ padding: '12px 16px' }}>Necesidad / Expectativa</th>
                  <th style={{ padding: '12px 16px' }}>Requisito Pertinente</th>
                  <th style={{ padding: '12px 12px', width: '110px' }}>Aplica a ISO</th>
                  <th style={{ padding: '12px 16px', width: '160px' }}>Proceso Impactado</th>
                </tr>
              </thead>
              <tbody>
                {data?.partesInteresadas?.map((pi, idx) => (
                  <tr 
                    key={pi.id || idx}
                    style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', verticalAlign: 'top' }}>
                      {pi.parteInteresada}
                    </td>
                    <td style={{ padding: '14px 12px', verticalAlign: 'top' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: pi.tipo?.toLowerCase().includes('externa') ? '#f0fdf4' : '#eff6ff',
                        color: pi.tipo?.toLowerCase().includes('externa') ? '#166534' : '#1e40af'
                      }}>
                        {pi.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155', verticalAlign: 'top', lineHeight: 1.45 }}>
                      {pi.necesidadExpectativa}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', verticalAlign: 'top', lineHeight: 1.45 }}>
                      {pi.requisitoPertinente}
                    </td>
                    <td style={{ padding: '14px 12px', verticalAlign: 'top' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: '#f1f5f9',
                        color: '#334155'
                      }}>
                        {pi.aplicaISO}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#0369a1', fontWeight: 600, verticalAlign: 'top' }}>
                      {pi.procesoImpactado}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 4: SUBIR EXCEL MENSUAL */}
      {activeTab === 'subir' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', padding: 16, borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0284c7', marginBottom: 12 }}>
                <UploadCloud size={40} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', color: '#0f172a' }}>
                Actualización Mensual de la Matriz Legal
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto' }}>
                Sube la planilla Excel (.xlsx) que entrega Asuntos Legales cada mes. El sistema leerá automáticamente la matriz vigente, las partes interesadas y la hoja de cambios del período.
              </p>
            </div>

            {/* ZONA DE DROPZONE */}
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              border: '2px dashed #93c5fd',
              borderRadius: 12,
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: 20
            }}>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <FileText size={36} color="#0284c7" style={{ marginBottom: 12 }} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: 4 }}>
                {subiendoArchivo ? 'Procesando archivo...' : 'Haz clic o arrastra aquí tu archivo Excel'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Formatos compatibles: .xlsx, .xls, .csv (Ej: Matriz_Legal_Revisión_Legales_octubre_2026.xlsx)
              </span>
            </label>

            {errorSubida && (
              <div style={{ padding: 14, borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <AlertCircle size={18} />
                <span>{errorSubida}</span>
              </div>
            )}

            {resultadoSubida && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#166534', fontWeight: 700, fontSize: '0.95rem', marginBottom: 12 }}>
                  <CheckCircle2 size={20} />
                  <span>Archivo interpretado con éxito: {resultadoSubida.nombreArchivo}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div style={{ backgroundColor: '#fff', padding: 12, borderRadius: 8, border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Normas en Matriz</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d' }}>{resultadoSubida.totalNormas}</div>
                  </div>
                  <div style={{ backgroundColor: '#fff', padding: 12, borderRadius: 8, border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Partes Interesadas</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d' }}>{resultadoSubida.totalPI}</div>
                  </div>
                  <div style={{ backgroundColor: '#fff', padding: 12, borderRadius: 8, border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Meses de Historial</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d' }}>{resultadoSubida.revisionesEncontradas.length}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#14532d', marginBottom: 16 }}>
                  <strong>Hojas de revisión detectadas: </strong> 
                  {resultadoSubida.revisionesEncontradas.slice(0, 6).join(', ')}... y {resultadoSubida.revisionesEncontradas.length - 6} más.
                </div>

                <button
                  onClick={handleAplicarExcel}
                  disabled={guardando}
                  style={{
                    width: '100%',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: guardando ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      Guardando y sincronizando con base de datos...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Confirmar y Actualizar Matriz Legal en SGI
                    </>
                  )}
                </button>
              </div>
            )}

            {guardadoExito && (
              <div style={{ padding: 16, borderRadius: 8, backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', textAlign: 'center', fontWeight: 700 }}>
                ¡Matriz Legal actualizada y sincronizada en Supabase con éxito! Redirigiendo...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

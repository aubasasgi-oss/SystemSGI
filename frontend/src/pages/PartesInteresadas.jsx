import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, AlertTriangle, ShieldCheck, Printer, Search, Filter, 
  Plus, CheckCircle2, ChevronDown, ChevronRight, Layers, Table, 
  Eye, RefreshCw, X, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { listarContexto, guardarContexto } from '../lib/contextoApi';
import { 
  PARTES_INTERESADAS_CATALOGO, 
  unificarPartesInteresadasConRiesgos 
} from '../lib/partesInteresadasData';
import { getNivelBadge, nivelTexto } from '../lib/partesContexto';

export default function PartesInteresadas() {
  const { userRole } = useAuth();
  const isSGI = userRole === 'SGI';

  const [loading, setLoading] = useState(true);
  const [itemsContexto, setItemsContexto] = useState([]);
  const [periodo, setPeriodo] = useState(`${new Date().getFullYear() - 1}-${new Date().getFullYear()}`);
  const [firma, setFirma] = useState('');

  // Modos de vista: 'integral' (sábana plana) | 'agrupada' (tarjetas por parte interesada)
  const [viewMode, setViewMode] = useState('integral');

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroISO, setFiltroISO] = useState('todas');
  const [filtroNivel, setFiltroNivel] = useState('todos');

  // Acordeón para vista agrupada
  const [partesAbiertas, setPartesAbiertas] = useState(
    PARTES_INTERESADAS_CATALOGO.reduce((acc, p) => ({ ...acc, [p.id]: true }), {})
  );

  // Modal para agregar/vincular riesgo
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoRiesgo, setNuevoRiesgo] = useState({
    parteInteresadaId: 'PI_01',
    riesgo: '',
    factorCritico: '',
    proceso: 'Operaciones',
    probabilidad: 3,
    impacto: 3,
    planAccion: '',
    responsable: ''
  });
  const [guardandoRiesgo, setGuardandoRiesgo] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const items = await listarContexto();
      setItemsContexto(items || []);
    } catch (err) {
      console.error('Error al cargar contexto/riesgos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Unificación oficial: las 13 Partes Interesadas con sus riesgos vinculados
  const partesUnificadas = useMemo(() => {
    return unificarPartesInteresadasConRiesgos(itemsContexto);
  }, [itemsContexto]);

  // Lista plana de filas para la Matriz Integral
  const filasMatrizIntegral = useMemo(() => {
    const filas = [];
    partesUnificadas.forEach(parte => {
      parte.riesgos.forEach(r => {
        const pxi = r.probabilidad * r.impacto;
        filas.push({
          parteId: parte.id,
          parteNombre: parte.nombre,
          tipo: parte.tipo,
          necesidad: parte.necesidadExpectativa,
          requisito: parte.requisitoPertinente,
          aplicaISO: parte.aplicaISO,
          procesoImpactado: parte.procesoImpactado,
          riesgoId: r.id,
          riesgo: r.riesgo,
          factorCritico: r.factorCritico,
          proceso: r.proceso || parte.procesoImpactado,
          probabilidad: r.probabilidad,
          impacto: r.impacto,
          pxi: pxi,
          nivel: nivelTexto(r.probabilidad, r.impacto),
          planAccion: r.planAccion,
          responsable: r.responsable,
          esDinamico: r.esDinamico
        });
      });
    });
    return filas;
  }, [partesUnificadas]);

  // Filtrado de la Matriz Integral
  const filasFiltradas = useMemo(() => {
    return filasMatrizIntegral.filter(f => {
      const matchBusqueda = !busqueda ||
        f.parteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.riesgo.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.factorCritico.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.necesidad.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.proceso.toLowerCase().includes(busqueda.toLowerCase());

      const matchTipo = filtroTipo === 'todos' || f.tipo.toLowerCase() === filtroTipo.toLowerCase();

      const matchISO = filtroISO === 'todas' || 
        (filtroISO === '9001' && f.aplicaISO.includes('9001')) ||
        (filtroISO === '39001' && f.aplicaISO.includes('39001')) ||
        (filtroISO === 'ambas' && f.aplicaISO.toLowerCase().includes('ambas'));

      const matchNivel = filtroNivel === 'todos' ||
        (filtroNivel === 'muy_alto' && f.pxi >= 15) ||
        (filtroNivel === 'alto' && f.pxi >= 10 && f.pxi < 15) ||
        (filtroNivel === 'medio' && f.pxi >= 6 && f.pxi < 10) ||
        (filtroNivel === 'bajo' && f.pxi < 6);

      return matchBusqueda && matchTipo && matchISO && matchNivel;
    });
  }, [filasMatrizIntegral, busqueda, filtroTipo, filtroISO, filtroNivel]);

  // Totales
  const totalRiesgos = filasMatrizIntegral.length;
  const riesgosAltos = filasMatrizIntegral.filter(f => f.pxi >= 10).length;

  const toggleParte = (id) => {
    setPartesAbiertas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const abrirModalNuevoRiesgo = (parteId = 'PI_01') => {
    const parteSel = PARTES_INTERESADAS_CATALOGO.find(p => p.id === parteId) || PARTES_INTERESADAS_CATALOGO[0];
    setNuevoRiesgo({
      parteInteresadaId: parteSel.id,
      riesgo: '',
      factorCritico: '',
      proceso: parteSel.procesoImpactado.split('/')[0].trim(),
      probabilidad: 3,
      impacto: 3,
      planAccion: '',
      responsable: ''
    });
    setModalAbierto(true);
  };

  const handleGuardarNuevoRiesgo = async (e) => {
    e.preventDefault();
    if (!nuevoRiesgo.riesgo || !nuevoRiesgo.factorCritico) return;

    setGuardandoRiesgo(true);
    try {
      const parteSel = PARTES_INTERESADAS_CATALOGO.find(p => p.id === nuevoRiesgo.parteInteresadaId);
      const payload = {
        año: new Date().getFullYear(),
        factorCritico: nuevoRiesgo.factorCritico,
        contexto: parteSel?.tipo === 'Interna' ? 'Interno' : 'Externo',
        riesgo: nuevoRiesgo.riesgo,
        proceso: nuevoRiesgo.proceso,
        partesInteresadas: parteSel?.nombre || 'Usuarios externos',
        probabilidad: Number(nuevoRiesgo.probabilidad),
        impacto: Number(nuevoRiesgo.impacto),
        planAccion: nuevoRiesgo.planAccion,
        responsable: nuevoRiesgo.responsable,
        cambioClimatico: 'No'
      };

      await guardarContexto(payload);
      await cargarDatos();
      setModalAbierto(false);
    } catch (err) {
      console.error('Error al guardar riesgo unificado:', err);
      alert('Error al guardar el riesgo en el sistema.');
    } finally {
      setGuardandoRiesgo(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFirma(reader.result);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748b' }}>
        <RefreshCw className="animate-spin" size={40} style={{ color: '#0284c7', marginBottom: 16 }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Cargando Matriz Unificada de Partes Interesadas y Riesgos...</h3>
        <p style={{ fontSize: '0.9rem' }}>Sincronizando criterios ISO 9001 / ISO 39001 (PAU-01 & PAU-02)</p>
      </div>
    );
  }

  return (
    <div className="module-container" style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', color: '#0f172a' }}>
      
      {/* HEADER PRINCIPAL */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ backgroundColor: '#e0f2fe', padding: 8, borderRadius: 10, color: '#0284c7' }}>
              <Users size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, backgroundColor: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>
                  PAU/01 & PAU/02 (ANEXO 4.2 & 3.2)
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Cláusula ISO 4.2 / Criterio Unificado AUBASA</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Matriz Unificada de Partes Interesadas y Riesgos del SGI
              </h1>
            </div>
          </div>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem' }}>
            Integración de necesidades, expectativas, requisitos pertinentes y evaluación de riesgos asociados conforme a ISO 9001:2015 e ISO 39001:2015.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {isSGI && (
            <button
              onClick={() => abrirModalNuevoRiesgo('PI_01')}
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
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
              }}
            >
              <Plus size={18} />
              Agregar Riesgo a Parte Interesada
            </button>
          )}

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
            Imprimir Anexo Oficial
          </button>
        </div>
      </div>

      {/* METRIC CARDS RESUMEN */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
            <span>PARTES INTERESADAS OFICIALES</span>
            <Users size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>13</div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={14} /> 100% de criterios unificados
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
            <span>RIESGOS IDENTIFICADOS</span>
            <AlertTriangle size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{totalRiesgos}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
            Enlazados a las partes pertinentes
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
            <span>RIESGOS ALTOS (PxI ≥ 10)</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444' }}>{riesgosAltos}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
            Con plan de mitigación prioritario
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
            <span>ALCANCE NORMATIVO</span>
            <ShieldCheck size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
            ISO 9001 & 39001
          </div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: 4 }}>
            Calidad y Seguridad Vial
          </div>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS: BÚSQUEDA, FILTROS Y TOGGLE DE VISTA */}
      <div className="no-print" style={{ backgroundColor: '#ffffff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: '1 1 360px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Buscar por parte interesada, riesgo, proceso o necesidad..."
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

          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', outline: 'none' }}
          >
            <option value="todos">Todos los tipos (Internas/Externas)</option>
            <option value="interna">Solo Internas (Personal / Alta Dirección)</option>
            <option value="externa">Solo Externas (Usuarios / Proveedores / etc.)</option>
          </select>

          <select
            value={filtroISO}
            onChange={e => setFiltroISO(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', outline: 'none' }}
          >
            <option value="todas">Todas las Normas ISO</option>
            <option value="9001">ISO 9001 (Calidad)</option>
            <option value="39001">ISO 39001 (Seguridad Vial)</option>
            <option value="ambas">Ambas Normas</option>
          </select>

          <select
            value={filtroNivel}
            onChange={e => setFiltroNivel(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', outline: 'none' }}
          >
            <option value="todos">Todos los niveles de riesgo</option>
            <option value="muy_alto">🔴 Muy Alto (15-25)</option>
            <option value="alto">🟠 Alto (10-14)</option>
            <option value="medio">🟡 Medio (6-9)</option>
            <option value="bajo">🟢 Bajo (1-5)</option>
          </select>

          {(busqueda || filtroTipo !== 'todos' || filtroISO !== 'todas' || filtroNivel !== 'todos') && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroTipo('todos');
                setFiltroISO('todas');
                setFiltroNivel('todos');
              }}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* TOGGLE MODO DE VISTA */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 8, gap: 4 }}>
          <button
            onClick={() => setViewMode('integral')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: viewMode === 'integral' ? '#ffffff' : 'transparent',
              color: viewMode === 'integral' ? '#0284c7' : '#64748b',
              fontWeight: viewMode === 'integral' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: viewMode === 'integral' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Table size={16} />
            Matriz Integral (Sábana Completa)
          </button>

          <button
            onClick={() => setViewMode('agrupada')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: viewMode === 'agrupada' ? '#ffffff' : 'transparent',
              color: viewMode === 'agrupada' ? '#0284c7' : '#64748b',
              fontWeight: viewMode === 'agrupada' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: viewMode === 'agrupada' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Layers size={16} />
            Fichas por Parte Interesada (13)
          </button>
        </div>
      </div>

      {/* VISTA 1: MATRIZ INTEGRAL UNIFICADA (TABLA COMPLETA) */}
      {viewMode === 'integral' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
              Matriz Única de Partes Interesadas, Requisitos y Riesgos del SGI
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Mostrando {filasFiltradas.length} de {totalRiesgos} riesgos evaluados
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 14px', width: '160px' }}>Parte Interesada</th>
                  <th style={{ padding: '12px 10px', width: '80px' }}>Tipo</th>
                  <th style={{ padding: '12px 16px', width: '220px' }}>Necesidad / Expectativa</th>
                  <th style={{ padding: '12px 16px', width: '220px' }}>Requisito Pertinente</th>
                  <th style={{ padding: '12px 12px', width: '100px' }}>Norma</th>
                  <th style={{ padding: '12px 16px' }}>Riesgo / Oportunidad Asociado</th>
                  <th style={{ padding: '12px 8px', width: '40px', textAlign: 'center' }}>P</th>
                  <th style={{ padding: '12px 8px', width: '40px', textAlign: 'center' }}>I</th>
                  <th style={{ padding: '12px 12px', width: '110px', textAlign: 'center' }}>Nivel PxI</th>
                  <th style={{ padding: '12px 16px', width: '240px' }}>Plan de Acción / Control</th>
                </tr>
              </thead>
              <tbody>
                {filasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                      No se encontraron registros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filasFiltradas.map((fila, idx) => (
                    <tr
                      key={`${fila.parteId}-${fila.riesgoId}-${idx}`}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        verticalAlign: 'top'
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0369a1' }}>
                        {fila.parteNombre}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: 8,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: fila.tipo.toLowerCase() === 'interna' ? '#eff6ff' : '#f0fdf4',
                          color: fila.tipo.toLowerCase() === 'interna' ? '#1d4ed8' : '#15803d'
                        }}>
                          {fila.tipo}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155', lineHeight: 1.4 }}>
                        {fila.necesidad}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', lineHeight: 1.4 }}>
                        {fila.requisito}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: '#f1f5f9',
                          color: '#334155'
                        }}>
                          {fila.aplicaISO.replace(' (9001 y 39001)', '')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a', lineHeight: 1.45 }}>
                        {fila.riesgo}
                        {fila.factorCritico && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 400, marginTop: 4 }}>
                            Factor: {fila.factorCritico}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700 }}>
                        {fila.probabilidad}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700 }}>
                        {fila.impacto}
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                        {getNivelBadge(fila.probabilidad, fila.impacto)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        {fila.planAccion || '—'}
                        {fila.responsable && (
                          <span style={{ display: 'block', color: '#0284c7', fontWeight: 600, marginTop: 4 }}>
                            Resp: {fila.responsable}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 2: AGRUPADA POR CADA UNA DE LAS 13 PARTES INTERESADAS */}
      {viewMode === 'agrupada' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {partesUnificadas.map(parte => {
            const abierta = partesAbiertas[parte.id];
            return (
              <div 
                key={parte.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                {/* CABECERA ACORDEÓN */}
                <div 
                  onClick={() => toggleParte(parte.id)}
                  style={{
                    padding: '16px 20px',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    borderBottom: abierta ? '1px solid #e2e8f0' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {abierta ? <ChevronDown size={20} color="#0284c7" /> : <ChevronRight size={20} color="#64748b" />}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                          {parte.nombre}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 10,
                          backgroundColor: parte.tipo.toLowerCase() === 'interna' ? '#eff6ff' : '#f0fdf4',
                          color: parte.tipo.toLowerCase() === 'interna' ? '#1d4ed8' : '#15803d'
                        }}>
                          {parte.tipo}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4, backgroundColor: '#f1f5f9', color: '#475569' }}>
                          {parte.aplicaISO}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                        Proceso: {parte.procesoImpactado}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '4px 10px', borderRadius: 12, backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                      {parte.riesgos.length} riesgo(s)
                    </span>
                    {isSGI && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirModalNuevoRiesgo(parte.id);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#0284c7',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        + Riesgo
                      </button>
                    )}
                  </div>
                </div>

                {/* DETALLE Y TABLA DE RIESGOS */}
                {abierta && (
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, fontSize: '0.85rem' }}>
                      <div>
                        <strong style={{ color: '#0f172a', display: 'block', marginBottom: 4 }}>Necesidad / Expectativa:</strong>
                        <span style={{ color: '#475569' }}>{parte.necesidadExpectativa}</span>
                      </div>
                      <div>
                        <strong style={{ color: '#0f172a', display: 'block', marginBottom: 4 }}>Requisito Pertinente del SGI:</strong>
                        <span style={{ color: '#475569' }}>{parte.requisitoPertinente}</span>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '8px 12px' }}>Riesgo / Oportunidad</th>
                            <th style={{ padding: '8px 12px', width: '180px' }}>Factor Crítico</th>
                            <th style={{ padding: '8px 10px', width: '140px' }}>Proceso</th>
                            <th style={{ padding: '8px 8px', width: '40px', textAlign: 'center' }}>P</th>
                            <th style={{ padding: '8px 8px', width: '40px', textAlign: 'center' }}>I</th>
                            <th style={{ padding: '8px 10px', width: '100px', textAlign: 'center' }}>Nivel PxI</th>
                            <th style={{ padding: '8px 12px', width: '280px' }}>Plan de Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parte.riesgos.map((r, rIdx) => (
                            <tr key={r.id || rIdx} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                              <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                                {r.riesgo}
                              </td>
                              <td style={{ padding: '10px 12px', color: '#475569' }}>
                                {r.factorCritico || '—'}
                              </td>
                              <td style={{ padding: '10px 10px', color: '#0369a1', fontWeight: 500 }}>
                                {r.proceso || parte.procesoImpactado}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700 }}>
                                {r.probabilidad}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700 }}>
                                {r.impacto}
                              </td>
                              <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                                {getNivelBadge(r.probabilidad, r.impacto)}
                              </td>
                              <td style={{ padding: '10px 12px', color: '#334155', fontSize: '0.8rem' }}>
                                {r.planAccion || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VERSIÓN IMPRIMIBLE OFICIAL DE AUDITORÍA (ONLY-PRINT) */}
      <div className="only-print" style={{ display: 'none', backgroundColor: '#ffffff', padding: 20 }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0369a1', paddingBottom: 16, marginBottom: 20 }}>
          <h2 style={{ color: '#0369a1', margin: '0 0 6px 0', fontSize: '18px' }}>
            AUTOPISTAS DE BUENOS AIRES S.A. (AUBASA)
          </h2>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
            ANEXO 4.2 / 3.2 — MATRIZ UNIFICADA DE PARTES INTERESADAS Y RIESGOS
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            Sistema de Gestión Integrado (ISO 9001:2015 / ISO 39001:2015 — Cláusula 4.2)
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
            <strong>Período evaluado: {periodo}</strong>
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ border: '1px solid #cbd5e1', padding: 6 }}>Parte Interesada</th>
              <th style={{ border: '1px solid #cbd5e1', padding: 6 }}>Tipo</th>
              <th style={{ border: '1px solid #cbd5e1', padding: 6 }}>Necesidad / Expectativa</th>
              <th style={{ border: '1px solid #cbd5e1', padding: 6 }}>Requisito Pertinente</th>
              <th style={{ border: '1px solid #cbd5e1', padding: 6 }}>Norma</th>
              <th style={{ border: '1px solid #cbd5e1', padding: 6 }}>Riesgo Identificado</th>
              <th style={{ border: '1px solid #cbd5e1', padding: 6, textAlign: 'center' }}>PxI</th>
              <th style={{ border: '1px solid #cbd5e1', padding: 6 }}>Plan de Acción / Control</th>
            </tr>
          </thead>
          <tbody>
            {filasMatrizIntegral.map((f, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #cbd5e1', padding: 5, fontWeight: 'bold' }}>{f.parteNombre}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: 5 }}>{f.tipo}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: 5 }}>{f.necesidad}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: 5 }}>{f.requisito}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: 5 }}>{f.aplicaISO}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: 5 }}>{f.riesgo}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: 5, textAlign: 'center', fontWeight: 'bold' }}>
                  {f.pxi} ({f.nivel})
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: 5 }}>{f.planAccion}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <div style={{ width: '240px', borderTop: '1px solid #000', paddingTop: 6, textAlign: 'center' }}>
            Firma Responsable SGI
          </div>
          <div style={{ width: '240px', borderTop: '1px solid #000', paddingTop: 6, textAlign: 'center' }}>
            Aprobación Alta Dirección — Fecha: ____/____/2026
          </div>
        </div>
      </div>

      {/* SECCIÓN DE FIRMA DIGITALIZADA EN PANTALLA */}
      <div className="no-print" style={{ marginTop: 32, padding: 24, backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
          Validación y Firma del Responsable del SGI
        </h4>
        {firma ? (
          <div style={{ width: 280 }}>
            <img src={firma} alt="Firma responsable" style={{ maxHeight: 90, display: 'block', marginBottom: 8 }} />
            <div style={{ borderTop: '1px solid #0f172a', paddingTop: 6, fontWeight: 700, fontSize: '0.85rem' }}>
              Gisela Salierno — Jefatura de SGI AUBASA
            </div>
            <button 
              onClick={() => setFirma('')}
              style={{ marginTop: 8, padding: '4px 10px', fontSize: '0.75rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer' }}
            >
              Eliminar Firma
            </button>
          </div>
        ) : (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            Subir Firma Digitalizada
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          </label>
        )}
      </div>

      {/* MODAL: AGREGAR RIESGO VINCULADO */}
      {modalAbierto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 28,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={22} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Vincular Nuevo Riesgo a Parte Interesada
                </h3>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevoRiesgo}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                    Parte Interesada Pertinente (Criterio Unificado):
                  </label>
                  <select
                    value={nuevoRiesgo.parteInteresadaId}
                    onChange={e => {
                      const sel = PARTES_INTERESADAS_CATALOGO.find(p => p.id === e.target.value);
                      setNuevoRiesgo({
                        ...nuevoRiesgo,
                        parteInteresadaId: e.target.value,
                        proceso: sel?.procesoImpactado.split('/')[0].trim() || 'Operaciones'
                      });
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #0284c7', fontSize: '0.9rem', outline: 'none', backgroundColor: '#f0f9ff', fontWeight: 700, color: '#0369a1' }}
                  >
                    {PARTES_INTERESADAS_CATALOGO.map(pi => (
                      <option key={pi.id} value={pi.id}>
                        {pi.nombre} ({pi.tipo} — {pi.aplicaISO})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                    Descripción del Riesgo u Oportunidad:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={nuevoRiesgo.riesgo}
                    onChange={e => setNuevoRiesgo({ ...nuevoRiesgo, riesgo: e.target.value })}
                    placeholder="Ej: Interrupción del servicio por eventos climáticos o medidas de fuerza..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                      Factor Crítico de Contexto:
                    </label>
                    <input
                      type="text"
                      required
                      value={nuevoRiesgo.factorCritico}
                      onChange={e => setNuevoRiesgo({ ...nuevoRiesgo, factorCritico: e.target.value })}
                      placeholder="Ej: Fluidez del tránsito"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                      Proceso Responsable:
                    </label>
                    <input
                      type="text"
                      required
                      value={nuevoRiesgo.proceso}
                      onChange={e => setNuevoRiesgo({ ...nuevoRiesgo, proceso: e.target.value })}
                      placeholder="Ej: Operaciones / Prevención"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* MATRIZ P x I */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                      Probabilidad (1 a 5):
                    </label>
                    <select
                      value={nuevoRiesgo.probabilidad}
                      onChange={e => setNuevoRiesgo({ ...nuevoRiesgo, probabilidad: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                    >
                      <option value={1}>1 - Improbable</option>
                      <option value={2}>2 - Muy Poco Probable</option>
                      <option value={3}>3 - Poco Probable</option>
                      <option value={4}>4 - Probable</option>
                      <option value={5}>5 - Muy Probable</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                      Impacto (1 a 5):
                    </label>
                    <select
                      value={nuevoRiesgo.impacto}
                      onChange={e => setNuevoRiesgo({ ...nuevoRiesgo, impacto: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                    >
                      <option value={1}>1 - Insignificante</option>
                      <option value={2}>2 - Menor</option>
                      <option value={3}>3 - Moderado</option>
                      <option value={4}>4 - Mayor</option>
                      <option value={5}>5 - Extremo</option>
                    </select>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Nivel Resultante</div>
                    <div style={{ marginTop: 4 }}>
                      {getNivelBadge(nuevoRiesgo.probabilidad, nuevoRiesgo.impacto)}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                    Plan de Acción / Control Operativo:
                  </label>
                  <textarea
                    rows={2}
                    value={nuevoRiesgo.planAccion}
                    onChange={e => setNuevoRiesgo({ ...nuevoRiesgo, planAccion: e.target.value })}
                    placeholder="Acciones preventivas, instructivos de trabajo o protocolos de respuesta..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                    Responsable de Seguimiento:
                  </label>
                  <input
                    type="text"
                    value={nuevoRiesgo.responsable}
                    onChange={e => setNuevoRiesgo({ ...nuevoRiesgo, responsable: e.target.value })}
                    placeholder="Ej: Jefatura de Peaje Dinámico / Gerencia Comercial"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoRiesgo}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: guardandoRiesgo ? 'not-allowed' : 'pointer'
                  }}
                >
                  {guardandoRiesgo ? 'Guardando...' : 'Guardar y Vincular Riesgo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

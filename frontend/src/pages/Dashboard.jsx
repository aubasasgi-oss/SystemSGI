import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, FileText, AlertTriangle, Car, BarChart2, Monitor, Wrench, Phone, Briefcase, Users, Server, BookOpen, TrendingUp, Maximize, Minimize, Scale, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart, Line, LineChart, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import Papa from 'papaparse';
import { obtenerMetricaMensual } from '../lib/metricsApi';
import { listarComercialMetricsMultiples } from '../lib/comercialMetricsApi';
import { listarAsistenciaMetricsMultiples } from '../lib/asistenciaMetricsApi';
import { listarOperacionesMetrics } from '../lib/operacionesMetricsApi';
import { listarCcmMetricsMultiples } from '../lib/ccmMetricsApi';
import { listarMantenimientoMetricsMultiples } from '../lib/mantenimientoMetricsApi';
import { listarRrhhMetricsMultiples } from '../lib/rrhhMetricsApi';
import { listarLegalesMetricsMultiples } from '../lib/legalesMetricsApi';
import { listarSistemasMetricsMultiples } from '../lib/sistemasMetricsApi';
import { listarInstitucionalesMetrics } from '../lib/institucionalesMetricsApi';

// Datos Mock
const dataOperaciones = [
  { name: 'Ene', horas: 216, disponibles: 50000 },
  { name: 'Feb', horas: 875, disponibles: 50000 },
  { name: 'Mar', horas: 1189, disponibles: 50000 },
  { name: 'Abr', horas: 646, disponibles: 50000 },
  { name: 'May', horas: 845, disponibles: 50000 },
  { name: 'Jun', horas: 1263, disponibles: 50000 },
];

const dataCCM = [
  { name: 'Ene', tasa: 100 },
  { name: 'Feb', tasa: 95 },
  { name: 'Mar', tasa: 98 },
  { name: 'Abr', tasa: 100 },
  { name: 'May', tasa: 96 },
];

const dataSistemas = [
  { name: 'Ene', realizados: 29, planificados: 30, indicador: 96 },
  { name: 'Feb', realizados: 25, planificados: 30, indicador: 83 },
  { name: 'Mar', realizados: 19, planificados: 30, indicador: 63 },
  { name: 'Abr', realizados: 16, planificados: 30, indicador: 53 },
  { name: 'May', realizados: 30, planificados: 30, indicador: 100 },
  { name: 'Jun', realizados: 30, planificados: 30, indicador: 100 },
];

const dataLegales = [
  { name: 'Ene', solicitudes: 81, tiempoRespuesta: 88 },
  { name: 'Feb', solicitudes: 42, tiempoRespuesta: 100 },
  { name: 'Mar', solicitudes: 51, tiempoRespuesta: 100 },
  { name: 'Abr', solicitudes: 49, tiempoRespuesta: 100 },
  { name: 'May', solicitudes: 24, tiempoRespuesta: 100 },
];

const Dashboard = () => {
  const [activeGerencia, setActiveGerencia] = useState(null);
  const [comercialRows, setComercialRows] = useState({ quejas_reclamos: [], telepase: [], atencion: [], tiempo_respuesta: [] });
  const [comercialView, setComercialView] = useState('home');
  const [comercialFiltroConcesion, setComercialFiltroConcesion] = useState('Todas');
  const [comercialFiltroAnio, setComercialFiltroAnio] = useState('Todos');
  const [comercialFiltroSitio, setComercialFiltroSitio] = useState('Todos');
  const [asistenciaRows, setAsistenciaRows] = useState({ gestion_av1: [], factor_desempeno: [], serv_1er_aux: [], serv_aux_mecanico: [] });
  const [asistenciaView, setAsistenciaView] = useState('home');
  const [asistenciaAnio, setAsistenciaAnio] = useState(new Date().getFullYear());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ccmMetrics, setCcmMetrics] = useState([]);
  const [ccmContingMetrics, setCcmContingMetrics] = useState([]);
  const [ccmAnio, setCcmAnio] = useState(new Date().getFullYear());
  const [ccmTrimestre, setCcmTrimestre] = useState(null); // null = todos
  const [mantenimientoMetrics, setMantenimientoMetrics] = useState([]);
  const [mantenimientoAnio, setMantenimientoAnio] = useState(new Date().getFullYear());
  const [mantenimientoTrimestre, setMantenimientoTrimestre] = useState(null);
  const [institucionalesMetrics, setInstitucionalesMetrics] = useState([]);
  const [institucionalesAnio, setInstitucionalesAnio] = useState(new Date().getFullYear());
  const [institucionalesMes, setInstitucionalesMes] = useState(null);
  const [legalesMetrics, setLegalesMetrics] = useState([]);
  const [legalesAnio, setLegalesAnio] = useState(new Date().getFullYear());
  const [legalesMes, setLegalesMes] = useState(null);
  const [sistemasMetrics, setSistemasMetrics] = useState([]);
  const [sistemasAnio, setSistemasAnio] = useState(new Date().getFullYear());
  const [sistemasMes, setSistemasMes] = useState(null);
  const [sistemasSitio, setSistemasSitio] = useState('Seleccionar todo');
  
  const [operacionesMetrics, setOperacionesMetrics] = useState([]);
  const [operacionesAnio, setOperacionesAnio] = useState(new Date().getFullYear());
  const [operacionesTrimestre, setOperacionesTrimestre] = useState(null);
  
  const [rrhhMetrics, setRrhhMetrics] = useState([]);
  const [rrhhAnio, setRrhhAnio] = useState(new Date().getFullYear());
  const [rrhhMes, setRrhhMes] = useState(null);

  const dashboardContentRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Solo el panel del tablero (module-content), no el sidebar ni el
      // encabezado de la app — por eso no se usa document.documentElement.
      (dashboardContentRef.current || document.documentElement).requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // ESC (u otra forma de salir de pantalla completa que no pase por el botón,
  // como la propia UI del navegador) dispara este evento nativo igual que el
  // botón — sin este listener, el ícono quedaba mostrando "Minimizar" aunque
  // ya se había salido de pantalla completa.
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (activeGerencia === 'comercial') {
      listarComercialMetricsMultiples(['quejas_reclamos', 'telepase', 'atencion', 'tiempo_respuesta'])
        .then(rows => {
          setComercialRows({
            quejas_reclamos: rows.filter(r => r.tipo === 'quejas_reclamos'),
            telepase: rows.filter(r => r.tipo === 'telepase'),
            atencion: rows.filter(r => r.tipo === 'atencion'),
            tiempo_respuesta: rows.filter(r => r.tipo === 'tiempo_respuesta'),
          });
        })
        .catch(console.error);
    } else if (activeGerencia === 'asistencia') {
      listarAsistenciaMetricsMultiples(['gestion_av1', 'factor_desempeno', 'serv_1er_aux', 'serv_aux_mecanico'])
        .then(rows => {
          setAsistenciaRows({
            gestion_av1: rows.filter(r => r.tipo === 'gestion_av1'),
            factor_desempeno: rows.filter(r => r.tipo === 'factor_desempeno'),
            serv_1er_aux: rows.filter(r => r.tipo === 'serv_1er_aux'),
            serv_aux_mecanico: rows.filter(r => r.tipo === 'serv_aux_mecanico'),
          });
        })
        .catch(console.error);
    }
  }, [activeGerencia]);

  useEffect(() => {
    if (activeGerencia === 'ccm') {
      const MESES_CCM = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const sum = (entries, field) => entries.reduce((a, e) => a + (Number(e[field]) || 0), 0);
      const bucketPorMes = (rows) => {
        const map = {};
        rows.forEach(r => {
          if (!r.fecha) return;
          const d = new Date(r.fecha + 'T00:00:00');
          if (d.getFullYear() !== ccmAnio) return;
          const mes = MESES_CCM[d.getMonth()];
          if (!map[mes]) map[mes] = [];
          map[mes].push(r.data || {});
        });
        return map;
      };

      listarCcmMetricsMultiples(['contingencias', 'gestion_transito'])
        .then(rows => {
          const gestionBucket = bucketPorMes(rows.filter(r => r.tipo === 'gestion_transito'));
          const contingBucket = bucketPorMes(rows.filter(r => r.tipo === 'contingencias'));

          const gestionArr = Object.entries(gestionBucket).map(([month, entries]) => ({
            month,
            data: {
              ccm_g1: { detectadas: sum(entries, 'detectadas'), reportadas: sum(entries, 'reportadas') },
              ccm_g2: { hs_fuera_cam: sum(entries, 'hs_fuera_cam'), hs_totales_cam: sum(entries, 'hs_totales_cam') },
              ccm_g3: { hs_fuera_pmv: sum(entries, 'hs_fuera_pmv'), hs_totales_pmv: sum(entries, 'hs_totales_pmv') },
            },
          }));
          const contingArr = Object.entries(contingBucket).map(([month, entries]) => ({
            month,
            data: { ccm_conting: { liberacion_ok: sum(entries, 'liberacion_ok'), total_eventos: sum(entries, 'total_eventos') } },
          }));

          setCcmMetrics(gestionArr);
          setCcmContingMetrics(contingArr);
        })
        .catch(() => { setCcmMetrics([]); setCcmContingMetrics([]); });
    }
  }, [activeGerencia, ccmAnio]);

  useEffect(() => {
    if (activeGerencia === 'mantenimiento') {
      const MESES_MANT = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const sum = (entries, field) => entries.reduce((a, e) => a + (Number(e[field]) || 0), 0);
      const bucketPorMes = (rows) => {
        const map = {};
        rows.forEach(r => {
          if (!r.fecha) return;
          const d = new Date(r.fecha + 'T00:00:00');
          if (d.getFullYear() !== mantenimientoAnio) return;
          const mes = MESES_MANT[d.getMonth()];
          if (!map[mes]) map[mes] = [];
          map[mes].push(r.data || {});
        });
        return map;
      };

      listarMantenimientoMetricsMultiples(['pmp', 'mc'])
        .then(rows => {
          const pmpBucket = bucketPorMes(rows.filter(r => r.tipo === 'pmp'));
          const mcBucket = bucketPorMes(rows.filter(r => r.tipo === 'mc'));
          const allMonths = new Set([...Object.keys(pmpBucket), ...Object.keys(mcBucket)]);

          const combined = Array.from(allMonths).map(month => ({
            month,
            data: {
              man1: { prev_realizados: sum(pmpBucket[month] || [], 'prev_realizados'), prev_planificados: sum(pmpBucket[month] || [], 'prev_planificados') },
              man2: { corr_realizados: sum(mcBucket[month] || [], 'corr_realizados'), corr_solicitados: sum(mcBucket[month] || [], 'corr_solicitados') },
            },
          }));

          setMantenimientoMetrics(combined);
        })
        .catch(() => setMantenimientoMetrics([]));
    }
  }, [activeGerencia, mantenimientoAnio]);

  useEffect(() => {
    if (activeGerencia === 'institucionales') {
      const MESES_INST = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const sum = (entries, field) => entries.reduce((a, e) => a + (Number(e[field]) || 0), 0);
      listarInstitucionalesMetrics()
        .then(rows => {
          const map = {};
          rows.forEach(r => {
            if (!r.fecha) return;
            const d = new Date(r.fecha + 'T00:00:00');
            if (d.getFullYear() !== institucionalesAnio) return;
            const mes = MESES_INST[d.getMonth()];
            if (!map[mes]) map[mes] = [];
            map[mes].push(r.data || {});
          });
          const arr = Object.entries(map).map(([month, entries]) => ({
            month,
            data: { inst1: { num: sum(entries, 'num'), den: sum(entries, 'den') } },
          }));
          setInstitucionalesMetrics(arr);
        })
        .catch(() => setInstitucionalesMetrics([]));
    }
  }, [activeGerencia, institucionalesAnio]);

  useEffect(() => {
    if (activeGerencia === 'legales') {
      const MESES_LEG = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const sum = (entries, field) => entries.reduce((a, e) => a + (Number(e[field]) || 0), 0);
      const bucketPorMes = (rows) => {
        const map = {};
        rows.forEach(r => {
          if (!r.fecha) return;
          const d = new Date(r.fecha + 'T00:00:00');
          if (d.getFullYear() !== legalesAnio) return;
          const mes = MESES_LEG[d.getMonth()];
          if (!map[mes]) map[mes] = [];
          map[mes].push(r.data || {});
        });
        return map;
      };
      listarLegalesMetricsMultiples(['respuestas_gc', 'matriz_legal'])
        .then(rows => {
          const respBucket = bucketPorMes(rows.filter(r => r.tipo === 'respuestas_gc'));
          const matrizBucket = bucketPorMes(rows.filter(r => r.tipo === 'matriz_legal'));
          const allMonths = new Set([...Object.keys(respBucket), ...Object.keys(matrizBucket)]);
          const arr = Array.from(allMonths).map(month => {
            const matrizEntries = matrizBucket[month] || [];
            const ultimaMatriz = matrizEntries.length ? matrizEntries[matrizEntries.length - 1].cumplimiento_matriz : undefined;
            return {
              month,
              data: {
                leg_respuestas: { resp_comunicadas: sum(respBucket[month] || [], 'resp_comunicadas'), resp_solicitadas: sum(respBucket[month] || [], 'resp_solicitadas') },
                leg_matriz: { cumplimiento_matriz: ultimaMatriz },
              },
            };
          });
          setLegalesMetrics(arr);
        })
        .catch(() => setLegalesMetrics([]));
    }
  }, [activeGerencia, legalesAnio]);

  useEffect(() => {
    if (activeGerencia === 'sistemas') {
      const MESES_SIS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const sum = (entries, field) => entries.reduce((a, e) => a + (Number(e[field]) || 0), 0);
      const bucketPorMes = (rows) => {
        const map = {};
        rows.forEach(r => {
          if (!r.fecha) return;
          const d = new Date(r.fecha + 'T00:00:00');
          if (d.getFullYear() !== sistemasAnio) return;
          const mes = MESES_SIS[d.getMonth()];
          if (!map[mes]) map[mes] = [];
          map[mes].push(r.data || {});
        });
        return map;
      };
      listarSistemasMetricsMultiples(['pmp', 'tickets'])
        .then(rows => {
          const pmpBucket = bucketPorMes(rows.filter(r => r.tipo === 'pmp'));
          const ticketsBucket = bucketPorMes(rows.filter(r => r.tipo === 'tickets'));
          const allMonths = new Set([...Object.keys(pmpBucket), ...Object.keys(ticketsBucket)]);
          const arr = Array.from(allMonths).map(month => {
            const pmpEntries = pmpBucket[month] || [];
            return {
              month,
              data: {
                sis_pmp: {
                  sitio: pmpEntries[0]?.sitio,
                  prev_realizados: sum(pmpEntries, 'prev_realizados'),
                  prev_planificados: sum(pmpEntries, 'prev_planificados'),
                },
                sis_tickets: {
                  tickets_realizados: sum(ticketsBucket[month] || [], 'tickets_realizados'),
                  tickets_solicitados: sum(ticketsBucket[month] || [], 'tickets_solicitados'),
                },
              },
            };
          });
          setSistemasMetrics(arr);
        })
        .catch(() => setSistemasMetrics([]));
    }
  }, [activeGerencia, sistemasAnio]);

  useEffect(() => {
    if (activeGerencia === 'operaciones_spp') {
      const MESES_IDX = { 0:'Enero',1:'Febrero',2:'Marzo',3:'Abril',4:'Mayo',5:'Junio',6:'Julio',7:'Agosto',8:'Septiembre',9:'Octubre',10:'Noviembre',11:'Diciembre' };
      listarOperacionesMetrics()
        .then(rows => {
          const mo = { Enero:1,Febrero:2,Marzo:3,Abril:4,Mayo:5,Junio:6,Julio:7,Agosto:8,Septiembre:9,Octubre:10,Noviembre:11,Diciembre:12 };
          const transformed = (Array.isArray(rows) ? rows : [])
            .filter(r => r.fecha)
            .map(r => {
              const d = new Date(r.fecha + 'T00:00:00');
              return {
                year: d.getFullYear(),
                month: MESES_IDX[d.getMonth()] || 'Enero',
                data: { op_spp: r.data || {} },
              };
            })
            .filter(r => r.year === operacionesAnio)
            .sort((a, b) => (mo[a.month]||0) - (mo[b.month]||0));
          setOperacionesMetrics(transformed);
        })
        .catch(() => setOperacionesMetrics([]));
    }
  }, [activeGerencia, operacionesAnio]);

  useEffect(() => {
    if (activeGerencia === 'rrhh') {
      const MESES_RRHH = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const sum = (entries, field) => entries.reduce((a, e) => a + (Number(e[field]) || 0), 0);

      listarRrhhMetricsMultiples(['tiempo_respuesta'])
        .then(rows => {
          const map = {};
          rows.forEach(r => {
            if (!r.fecha) return;
            const d = new Date(r.fecha + 'T00:00:00');
            if (d.getFullYear() !== rrhhAnio) return;
            const mes = MESES_RRHH[d.getMonth()];
            if (!map[mes]) map[mes] = [];
            map[mes].push(r.data || {});
          });

          const arr = Object.entries(map).map(([month, entries]) => ({
            month,
            data: { rh_ingresos: { ingresadas: sum(entries, 'ingresadas'), solicitadas: sum(entries, 'solicitadas') } },
          }));

          setRrhhMetrics(arr);
        })
        .catch(() => setRrhhMetrics([]));
    }
  }, [activeGerencia, rrhhAnio]);

  // Media luna de progreso dibujada en SVG puro (sin Recharts/Pie): evita el
  // truco de "cy=100% + recortar la mitad del canvas" que dependía del ancho
  // exacto de cada tarjeta y se rompía en tarjetas más anchas o angostas que
  // las que se usaron para calibrarlo. El viewBox escala solo, así que se ve
  // igual de bien sin importar cuán ancha sea la tarjeta que lo contiene.
  const SemiGauge = ({ value, fillValue, objetivo, color = '#16a34a', trackColor = '#e2e8f0', decimals = 0, scaleLabels }) => {
    const displayValue = Number(value) || 0;
    const fillPct = Math.max(0, Math.min(100, Number(fillValue ?? value) || 0));
    const W = 200, STROKE = 22;
    const R = (W - STROKE) / 2;
    const CY = W / 2;
    const H = W / 2 + STROKE / 2;
    const circumference = Math.PI * R;
    const offset = circumference * (1 - fillPct / 100);
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ textAlign: 'right', padding: '4px 10px 0', fontSize: '13px', fontWeight: 700, color: '#64748b', minHeight: '20px' }}>
          {objetivo != null && objetivo !== '' ? objetivo + ' %' : ''}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <path d={`M ${STROKE / 2} ${CY} A ${R} ${R} 0 0 1 ${W - STROKE / 2} ${CY}`} fill="none" stroke={trackColor} strokeWidth={STROKE} strokeLinecap="round" />
          <path d={`M ${STROKE / 2} ${CY} A ${R} ${R} 0 0 1 ${W - STROKE / 2} ${CY}`} fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div style={{ marginTop: '-6px', fontSize: '32px', fontWeight: 900, color, lineHeight: 1 }}>{displayValue.toFixed(decimals)} %</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px 10px', fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>
          <span>{scaleLabels ? scaleLabels[0] : '0 %'}</span><span>{scaleLabels ? scaleLabels[1] : '100 %'}</span>
        </div>
      </div>
    );
  };

  const renderPortal = () => {
    return (
      <div className="animate-fade-in" style={{
        backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.95)), url("https://images.unsplash.com/photo-1545042746-ec9e5a59b359?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: 'calc(100vh - 100px)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        position: 'relative',
        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        
        <div style={{ position: 'absolute', top: '50px', textAlign: 'center', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '12px 40px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '30px', boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '4px' }}>INDICADORES DE GESTIÓN</h2>
        </div>

        <button
          onClick={toggleFullscreen}
          style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Pantalla Completa"
        >
          {isFullscreen ? <Minimize size={20} color="white" /> : <Maximize size={20} color="white" />}
        </button>

        <div className="glass-panel" style={{ padding: '2px', borderRadius: '26px', marginBottom: '56px', marginTop: '60px', background: 'linear-gradient(135deg, #0ea5e9, #38bdf8, #0ea5e9)', boxShadow: '0 25px 60px -12px rgba(14, 165, 233, 0.45)' }}>
          <div style={{ padding: '40px 80px', borderRadius: '24px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.97)' }}>
            <h1 style={{ color: '#0ea5e9', fontSize: '72px', fontWeight: '900', margin: 0, letterSpacing: '-2px', lineHeight: '1', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>AUBASA</h1>
            <div style={{ width: '60px', height: '4px', background: '#0ea5e9', margin: '16px auto', borderRadius: '2px' }}></div>
            <p style={{ color: '#475569', margin: '0', fontSize: '15px', fontWeight: '700', letterSpacing: '2px' }}>AUTOPISTAS DE BUENOS AIRES S.A.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', width: '100%', maxWidth: '1000px', gap: '18px' }}>
          {[
            { key: 'comercial', label: 'GERENCIA COMERCIAL', Icon: Briefcase },
            { key: 'operaciones_spp', label: 'GERENCIA DE OPERACIONES', Icon: BarChart2 },
            { key: 'asistencia', label: 'ASISTENCIA VIAL', Icon: Car },
            { key: 'ccm', label: 'CENTRO DE CONTROL Y MONITOREO', Icon: Monitor },
            { key: 'mantenimiento', label: 'MANTENIMIENTO - TALLER MECÁNICO', Icon: Wrench },
            { key: 'institucionales', label: 'SUBGERENCIA RELACIONES INSTITUCIONALES', Icon: Building2 },
            { key: 'rrhh', label: 'GERENCIA DE RECURSOS HUMANOS', Icon: Users },
            { key: 'legales', label: 'GERENCIA DE ASUNTOS LEGALES', Icon: Scale },
            { key: 'sistemas', label: 'GERENCIA SISTEMAS - MANTENIMIENTO', Icon: Server },
          ].map(({ key, label, Icon }, i) => (
            <button
              key={key}
              onClick={() => setActiveGerencia(key)}
              className="btn-portal slide-in"
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <Icon size={22} style={{ flexShrink: 0, opacity: 0.9 }} />
              <span>{label}</span>
            </button>
          ))}
        </div>


        <style>{`
          .btn-portal {
            padding: 16px 22px;
            background: linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(8px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            gap: 14px;
            width: 100%;
            line-height: 1.3;
          }
          .btn-portal::before {
            content: '';
            position: absolute;
            top: 0; left: -100%; width: 50%; height: 100%;
            background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
            transform: skewX(-25deg);
            transition: all 0.5s ease;
          }
          .btn-portal:hover::before {
            left: 200%;
          }
          .btn-portal:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -5px rgba(14, 165, 233, 0.5);
            border-color: rgba(255, 255, 255, 0.6);
            background: linear-gradient(135deg, rgba(14, 165, 233, 1) 0%, rgba(37, 99, 235, 1) 100%);
          }
          .slide-in {
            opacity: 0;
            animation: slideInUp 0.6s ease-out forwards;
          }
          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  };

  const renderComercial = () => {
    const MESES_ES_COM = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const SITIOS_COMERCIAL = ['Dock Sud', 'Hudson', 'Bernal', 'Quilmes', 'Berazategui', 'Samborombón', 'Maipú', 'La Huella', 'Mar Chiquita', 'Gral. Madariaga'];

    const todasLasFilas = [...comercialRows.quejas_reclamos, ...comercialRows.telepase, ...comercialRows.atencion, ...comercialRows.tiempo_respuesta];
    const aniosDisponibles = Array.from(new Set(
      todasLasFilas.filter(r => r.fecha).map(r => new Date(r.fecha + 'T00:00:00').getFullYear())
    )).sort((a, b) => b - a);

    const filtrarFilas = (rows) => rows.filter(r => {
      if (!r.fecha) return false;
      if (comercialFiltroAnio !== 'Todos' && String(new Date(r.fecha + 'T00:00:00').getFullYear()) !== comercialFiltroAnio) return false;
      if (comercialFiltroConcesion !== 'Todas' && r.data?.concesion && r.data.concesion !== comercialFiltroConcesion) return false;
      if (comercialFiltroSitio !== 'Todos' && r.data?.sitio && r.data.sitio !== comercialFiltroSitio) return false;
      return true;
    });

    const bucketPorMes = (rows) => {
      const map = {};
      rows.forEach(r => {
        if (!r.fecha) return;
        const d = new Date(r.fecha + 'T00:00:00');
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!map[key]) map[key] = { anio: d.getFullYear(), mesIdx: d.getMonth(), entries: [] };
        map[key].entries.push(r.data || {});
      });
      return map;
    };

    const sum = (entries, field) => entries.reduce((acc, e) => acc + (Number(e[field]) || 0), 0);

    const qrBuckets = bucketPorMes(filtrarFilas(comercialRows.quejas_reclamos));
    const tpBuckets = bucketPorMes(filtrarFilas(comercialRows.telepase));
    const atBuckets = bucketPorMes(filtrarFilas(comercialRows.atencion));
    const trBuckets = bucketPorMes(filtrarFilas(comercialRows.tiempo_respuesta));

    const allKeys = Array.from(new Set([
      ...Object.keys(qrBuckets), ...Object.keys(tpBuckets), ...Object.keys(atBuckets), ...Object.keys(trBuckets)
    ])).sort((a, b) => {
      const [ay, am] = a.split('-').map(Number);
      const [by, bm] = b.split('-').map(Number);
      return ay - by || am - bm;
    });

    const chartData = allKeys.map(key => {
      const mesIdx = Number(key.split('-')[1]);
      const qrEntries = qrBuckets[key]?.entries || [];
      const tpEntries = tpBuckets[key]?.entries || [];
      const atEntries = atBuckets[key]?.entries || [];
      const trEntries = trBuckets[key]?.entries || [];

      const transitoQR = sum(qrEntries, 'transito');
      const quejasRaw = sum(qrEntries, 'quejas');
      const reclamosRaw = sum(qrEntries, 'reclamos');
      const transitoTelepase = sum(tpEntries, 'transito_telepase');
      const transitoTotal = sum(tpEntries, 'transito_total');
      const llamadasOk = sum(atEntries, 'llamadas_atendidas');
      const llamadasTot = sum(atEntries, 'llamadas_totales');
      const correosOk = sum(atEntries, 'correos_respondidos');
      const correosTot = sum(atEntries, 'correos_totales');
      const respOk = sum(trEntries, 'respuestas_ok');
      const respTot = sum(trEntries, 'respuestas_total');

      return {
        name: MESES_ES_COM[mesIdx].substring(0, 3),
        telepase: transitoTotal ? (transitoTelepase / transitoTotal) * 100 : null,
        telepaseRaw: transitoTelepase,
        transitoTotal,
        quejas: transitoQR ? (quejasRaw / transitoQR) * 100000 : null,
        reclamos: transitoQR ? (reclamosRaw / transitoQR) * 100000 : null,
        quejasRaw,
        reclamosRaw,
        transitoQR,
        tiempoResp: respTot ? (respOk / respTot) * 100 : null,
        atencionTel: llamadasTot ? (llamadasOk / llamadasTot) * 100 : null,
        llamadasOk,
        llamadasTot,
        correosOk,
        correosTot,
      };
    });

    const avgTelepase = chartData.reduce((acc, curr) => acc + (curr.telepase || 0), 0) / (chartData.filter(c => c.telepase).length || 1);
    const avgQuejas = chartData.reduce((acc, curr) => acc + (curr.quejas || 0), 0) / (chartData.filter(c => c.quejas).length || 1);
    const avgReclamos = chartData.reduce((acc, curr) => acc + (curr.reclamos || 0), 0) / (chartData.filter(c => c.reclamos).length || 1);
    const avgTiempo = chartData.reduce((acc, curr) => acc + (curr.tiempoResp || 0), 0) / (chartData.filter(c => c.tiempoResp).length || 1);
    const avgAtencion = chartData.reduce((acc, curr) => acc + (curr.atencionTel || 0), 0) / (chartData.filter(c => c.atencionTel).length || 1);

    const sumLlamadasOk = chartData.reduce((acc, curr) => acc + curr.llamadasOk, 0);
    const sumLlamadasTot = chartData.reduce((acc, curr) => acc + curr.llamadasTot, 0);
    const sumCorreosOk = chartData.reduce((acc, curr) => acc + curr.correosOk, 0);
    const sumCorreosTot = chartData.reduce((acc, curr) => acc + curr.correosTot, 0);

    const barDataLlamadas = [{ name: 'Llamadas', atendidas: sumLlamadasOk, totales: sumLlamadasTot }];
    const barDataCorreos = [{ name: 'Correos', respondidos: sumCorreosOk, totales: sumCorreosTot }];

    const bgStyle = {
       backgroundImage: 'linear-gradient(rgba(15, 45, 110, 0.85), rgba(15, 45, 110, 0.95)), url("https://images.unsplash.com/photo-1782754521601-19691d69c25f?q=80&w=2070&auto=format&fit=crop")',
       backgroundSize: 'cover',
       backgroundPosition: 'center',
       backgroundAttachment: 'fixed',
       borderRadius: '16px',
       minHeight: '600px',
       boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
       color: 'white'
    };

    if (comercialView === 'home') {
       return (
          <div className="animate-fade-in delay-1" style={{...bgStyle, position: 'relative', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
             <button onClick={() => setActiveGerencia(null)} style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', color: 'white', padding: '10px 18px', fontSize: '13px', fontWeight: 700, borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>← Volver al Portal</button>
             <div className="glass-panel" style={{ padding: '40px 80px', borderRadius: '24px', marginBottom: '60px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,1)' }}>
                 <h1 style={{ color: '#0ea5e9', fontSize: '72px', fontWeight: '900', margin: 0, letterSpacing: '-2px', lineHeight: '1', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>AUBASA</h1>
                 <div style={{ width: '60px', height: '4px', background: '#0ea5e9', margin: '16px auto', borderRadius: '2px' }}></div>
                 <p style={{ color: '#475569', margin: '0', fontSize: '15px', fontWeight: '700', letterSpacing: '2px' }}>AUTOPISTAS DE BUENOS AIRES S.A.</p>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '450px' }}>
                 <button onClick={() => setComercialView('quejas')} className="btn-powerbi slide-in" style={{ animationDelay: '0.1s' }}>Quejas y Reclamos</button>
                 <button onClick={() => setComercialView('atencion')} className="btn-powerbi slide-in" style={{ animationDelay: '0.2s' }}>Atención del Usuario</button>
                 <button onClick={() => setComercialView('encuestas')} className="btn-powerbi slide-in" style={{ animationDelay: '0.3s' }}>Conformación de Encuestas</button>
                 <button onClick={() => setComercialView('telepase')} className="btn-powerbi slide-in" style={{ animationDelay: '0.4s' }}>Gestión TelePASE</button>
             </div>
             
             <style>{`
               .btn-powerbi {
                 padding: 16px 24px;
                 background: linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%);
                 color: white;
                 border: 1px solid rgba(255, 255, 255, 0.2);
                 border-radius: 12px;
                 font-size: 16px;
                 font-weight: 800;
                 cursor: pointer;
                 transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                 backdrop-filter: blur(8px);
                 box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
                 text-align: center;
                 text-transform: uppercase;
                 letter-spacing: 1px;
                 position: relative;
                 overflow: hidden;
               }
               .btn-powerbi::before {
                 content: '';
                 position: absolute;
                 top: 0; left: -100%; width: 50%; height: 100%;
                 background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
                 transform: skewX(-25deg);
                 transition: all 0.5s ease;
               }
               .btn-powerbi:hover::before {
                 left: 200%;
               }
               .btn-powerbi:hover {
                 transform: translateY(-2px);
                 box-shadow: 0 10px 20px -5px rgba(14, 165, 233, 0.5);
                 border-color: rgba(255, 255, 255, 0.6);
                 background: linear-gradient(135deg, rgba(14, 165, 233, 1) 0%, rgba(37, 99, 235, 1) 100%);
               }
               .slide-in {
                 opacity: 0;
                 animation: slideInUp 0.6s ease-out forwards;
               }
               @keyframes slideInUp {
                 from { opacity: 0; transform: translateY(20px); }
                 to { opacity: 1; transform: translateY(0); }
               }
             `}</style>
          </div>
       );
    }

    const cardBg = { backgroundColor: 'rgba(255, 255, 255, 0.85)', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' };
    const titleColor = '#0f2d6e';

    const renderHeader = (title) => (
      <div style={{ backgroundColor: '#1e90ff', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
        {title}
      </div>
    );

    return (
      <div className="animate-fade-in delay-1" style={{...bgStyle, padding: '40px'}}>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', backdropFilter: 'blur(4px)' }}>
           <button onClick={() => setComercialView('home')} className="btn-portal" style={{ marginRight: 'auto', padding: '10px 20px', fontSize: '14px' }}>
             ← Volver al Menú
           </button>
           <button onClick={toggleFullscreen} className="btn-portal" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Pantalla Completa">
             {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
           </button>
           <select className="form-control" style={{ width: '200px', margin: 0, backgroundColor: 'rgba(255,255,255,0.9)' }} value={comercialFiltroConcesion} onChange={(e) => setComercialFiltroConcesion(e.target.value)}>
             <option value="Todas">Concesión: Todas</option>
             <option value="BALP">Concesión: BALP</option>
             <option value="SVIA">Concesión: SVIA</option>
           </select>
           <select className="form-control" style={{ width: '200px', margin: 0, backgroundColor: 'rgba(255,255,255,0.9)' }} value={comercialFiltroAnio} onChange={(e) => setComercialFiltroAnio(e.target.value)}>
             <option value="Todos">Año: Todos</option>
             {aniosDisponibles.map(a => <option key={a} value={String(a)}>Año: {a}</option>)}
           </select>
           <select className="form-control" style={{ width: '200px', margin: 0, backgroundColor: 'rgba(255,255,255,0.9)' }} value={comercialFiltroSitio} onChange={(e) => setComercialFiltroSitio(e.target.value)}>
             <option value="Todos">Sitio: Todos</option>
             {SITIOS_COMERCIAL.map(s => <option key={s} value={s}>{s}</option>)}
           </select>
        </div>

        {comercialView === 'atencion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Row 1: Tasa de Atención Telefónica y Line Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Tasa de Atención Telefónica')}
                <div style={{ position: 'relative', width: '100%', height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '20px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{value: avgAtencion || 0}, {value: 100 - (avgAtencion || 0)}]} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius={70} outerRadius={110} dataKey="value" stroke="none">
                        <Cell fill={avgAtencion >= 75 ? "#16a34a" : "#f59e0b"} />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', bottom: '30px', left: '0', right: '0', textAlign: 'center', fontSize: '42px', fontWeight: 'bold', color: avgAtencion >= 75 ? "#16a34a" : "#f59e0b" }}>
                    {(avgAtencion || 0).toFixed(0)}%
                  </div>
                  <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '24px', fontWeight: 'bold', color: '#0f2d6e' }}>
                    75 %
                  </div>
                </div>
              </div>

              <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Indicador Atención de llamadas (Cant. atendidas / Total entrantes) * 100')}
                <div style={{ flex: 1, padding: '20px', minHeight: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis domain={[50, 100]} axisLine={false} tickLine={false} tickFormatter={(val) => val + '%'} />
                      <Tooltip formatter={(val) => val.toFixed(1) + '%'} />
                      <Line type="monotone" dataKey="atencionTel" stroke="#1e90ff" strokeWidth={3} dot={{ r: 5, fill: '#1e90ff' }} label={{ position: 'top', formatter: (val) => val.toFixed(1) + '%', fill: '#0f2d6e', fontWeight: 'bold' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row 2: Barras Horizontales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Llamadas Atendidas vs Total Llamadas')}
                <div style={{ flex: 1, padding: '20px', minHeight: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={barDataLlamadas} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" hide />
                      <Tooltip />
                      <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                      <Bar dataKey="atendidas" name="Cantidad de llamadas atendidas" fill="#16a34a" barSize={35} label={{ position: 'inside', fill: 'white', fontWeight: 'bold' }} />
                      <Bar dataKey="totales" name="Cantidad total de llamadas" fill="#1e3a8a" barSize={35} label={{ position: 'inside', fill: 'white', fontWeight: 'bold' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Correos Respondidos vs Total Correos Recibidos')}
                <div style={{ flex: 1, padding: '20px', minHeight: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={barDataCorreos} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" hide />
                      <Tooltip />
                      <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                      <Bar dataKey="respondidos" name="Cant. de correos respondidos" fill="#3b82f6" barSize={35} label={{ position: 'inside', fill: 'white', fontWeight: 'bold' }} />
                      <Bar dataKey="totales" name="Total de correos recibidos" fill="#1e3a8a" barSize={35} label={{ position: 'inside', fill: 'white', fontWeight: 'bold' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row 3: Tasa de Respuesta de Correos y Line Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Tasa de Respuesta de Correos')}
                <div style={{ position: 'relative', width: '100%', height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '20px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{value: avgTiempo || 0}, {value: 100 - (avgTiempo || 0)}]} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius={70} outerRadius={110} dataKey="value" stroke="none">
                        <Cell fill={avgTiempo >= 95 ? "#eab308" : "#f97316"} />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', bottom: '30px', left: '0', right: '0', textAlign: 'center', fontSize: '42px', fontWeight: 'bold', color: avgTiempo >= 95 ? "#eab308" : "#f97316" }}>
                    {(avgTiempo || 0).toFixed(0)}%
                  </div>
                  <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '24px', fontWeight: 'bold', color: '#0f2d6e' }}>
                    95 %
                  </div>
                </div>
              </div>

              <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Indicador Respuesta de correos (Cant. respondidos / Total recibidos) * 100')}
                <div style={{ flex: 1, padding: '20px', minHeight: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tickFormatter={(val) => val + '%'} />
                      <Tooltip formatter={(val) => val.toFixed(1) + '%'} />
                      <Line type="monotone" dataKey="tiempoResp" stroke="#eab308" strokeWidth={3} dot={{ r: 5, fill: '#eab308' }} label={{ position: 'top', formatter: (val) => val.toFixed(1) + '%', fill: '#eab308', fontWeight: 'bold' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        )}

        {comercialView === 'quejas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* ROW 1: Quejas y Reclamos c/100k */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Cantidad de Quejas cada 100.000 vehículos (≤ 0,7)')}
                <div style={{ flex: 1, padding: '20px', minHeight: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip formatter={(val) => val.toFixed(2)} />
                      <ReferenceLine y={0.7} stroke="#0f2d6e" strokeWidth={2} label={{ position: 'top', value: 'Objetivo quejas', fill: '#0f2d6e', fontWeight: 'bold' }} />
                      <Bar dataKey="quejas" name="Quejas" fill="#f87171" barSize={40} label={{ position: 'top', fill: '#0f2d6e', fontWeight: 'bold', formatter: val => val.toFixed(2) }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Cantidad de Reclamos cada 100.000 vehículos (≤ 1,7)')}
                <div style={{ flex: 1, padding: '20px', minHeight: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip formatter={(val) => val.toFixed(2)} />
                      <ReferenceLine y={1.7} stroke="#0f2d6e" strokeWidth={2} label={{ position: 'top', value: 'Objetivo reclamos', fill: '#0f2d6e', fontWeight: 'bold' }} />
                      <Bar dataKey="reclamos" name="Reclamos" fill="#fbbf24" barSize={40} label={{ position: 'top', fill: '#0f2d6e', fontWeight: 'bold', formatter: val => val.toFixed(2) }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ROW 2: Distribución, Tránsito, % Respuestas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '16px' }}>
              <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Evolución de Quejas y Reclamos (Valores Reales)')}
                <div style={{ flex: 1, padding: '20px', minHeight: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                      <Line type="monotone" dataKey="quejasRaw" name="Quejas" stroke="#f87171" strokeWidth={3} dot={{ r: 4 }} label={{ position: 'top', fill: '#f87171', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="reclamosRaw" name="Reclamos" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4 }} label={{ position: 'bottom', fill: '#fbbf24', fontWeight: 'bold' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Cantidad de Tránsito Pasante')}
                <div style={{ flex: 1, padding: '20px', minHeight: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => (val/1000000).toFixed(1) + ' mill.'} />
                      <Tooltip formatter={(val) => val.toLocaleString() + ' veh.'} />
                      <Area type="monotone" dataKey="transitoQR" name="Tránsito" stroke="#3b82f6" fill="#93c5fd" label={{ position: 'top', formatter: (val) => (val/1000000).toFixed(1) + ' mill.', fill: '#0f2d6e', fontWeight: 'bold' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('% de respuestas al usuario ≤ 9 días')}
                <div style={{ flex: 1, padding: '20px', minHeight: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} hide />
                      <Tooltip formatter={(val) => val.toFixed(1) + '%'} />
                      <ReferenceLine y={90} stroke="#0f2d6e" strokeDasharray="3 3" label={{ position: 'top', value: 'Objetivo ≥ 90%', fill: '#0f2d6e', fontWeight: 'bold' }} />
                      <Bar dataKey="tiempoResp" name="% Respuestas" fill="#4ade80" barSize={30} label={{ position: 'center', fill: 'white', fontWeight: 'bold', formatter: val => val.toFixed(0) + '%' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GESTIÓN TELEPASE */}
        {comercialView === 'telepase' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* ROW 1: Indicador Anual & Cantidad por Año */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '16px' }}>
               <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                 {renderHeader('Indicador Anual TelePASE')}
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                   <p style={{ fontSize: '16px', color: '#64748b', margin: '0 0 10px 0', fontWeight: 'bold' }}>Objetivo &gt; 80%</p>
                   <div style={{ width: '120px', height: '180px', backgroundColor: '#e2e8f0', position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                     <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${avgTelepase}%`, backgroundColor: avgTelepase >= 80 ? '#4ade80' : '#fbbf24', transition: 'height 1s ease' }}></div>
                     <div style={{ position: 'absolute', top: '20%', left: 0, right: 0, borderTop: '2px dashed #0f2d6e', zIndex: 2 }}></div>
                     <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                       <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                         {avgTelepase.toFixed(1)}%
                       </span>
                     </div>
                   </div>
                   <p style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold', color: '#0f2d6e' }}>2024</p>
                 </div>
               </div>

               <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                 {renderHeader('Cantidad de tránsito con TelePASE vs. Tránsito total por Año')}
                 <div style={{ flex: 1, padding: '20px', minHeight: '250px' }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={[{ name: '2024', total: chartData.reduce((acc, c) => acc + c.transitoTotal, 0), telepase: chartData.reduce((acc, c) => acc + c.telepaseRaw, 0) }]} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} />
                       <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => (val/1000000).toFixed(0) + ' mill.'} />
                       <Tooltip formatter={(val) => val.toLocaleString()} />
                       <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                       <Bar dataKey="total" name="Tránsito Total Pagante" fill="#93c5fd" barSize={150} label={{ position: 'center', fill: 'white', fontWeight: 'bold', formatter: val => val.toLocaleString() }} />
                       <Line type="monotone" dataKey="telepase" name="Cantidad de Transito con TelePASE" stroke="#1e3a8a" strokeWidth={4} dot={{ r: 6, fill: '#1e3a8a' }} label={{ position: 'bottom', fill: '#1e3a8a', fontWeight: 'bold', formatter: val => val.toLocaleString(), dy: 15 }} />
                     </ComposedChart>
                   </ResponsiveContainer>
                 </div>
               </div>
            </div>

            {/* ROW 2: Indicador Trimestral & Cantidad por Mes/Trimestre */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '16px' }}>
               <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                 {renderHeader('Indicador Mensual de TelePASE')}
                 <div style={{ flex: 1, padding: '20px', minHeight: '250px' }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                       <XAxis type="number" domain={[0, 100]} hide />
                       <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={60} />
                       <Tooltip formatter={(val) => val.toFixed(1) + '%'} />
                       <ReferenceLine x={80} stroke="#0f2d6e" strokeDasharray="3 3" label={{ position: 'top', value: 'Obj. 80%', fill: '#0f2d6e', fontWeight: 'bold' }} />
                       <Bar dataKey="telepase" name="Participación TelePASE" fill="#60a5fa" barSize={20} label={{ position: 'insideRight', fill: '#0f2d6e', fontWeight: 'bold', formatter: val => val.toFixed(1) + '%' }}>
                         {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.telepase >= 80 ? '#4ade80' : (entry.telepase >= 70 ? '#fbbf24' : '#f87171')} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </div>

               <div className="glass" style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                 {renderHeader('Cantidad de tránsito con TelePASE vs. Tránsito total por Mes')}
                 <div style={{ flex: 1, padding: '20px', minHeight: '250px' }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} />
                       <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(val) => (val/1000000).toFixed(1) + ' mill.'} />
                       <YAxis yAxisId="right" orientation="right" domain={[50, 100]} axisLine={false} tickLine={false} tickFormatter={(val) => val + '%'} />
                       <Tooltip formatter={(val) => val.toLocaleString()} />
                       <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                       <Bar yAxisId="left" dataKey="telepaseRaw" name="Cantidad de Transito con TelePASE" fill="#3b82f6" barSize={25} />
                       <Bar yAxisId="left" dataKey="transitoTotal" name="Transito Total Pagante" fill="#1e3a8a" barSize={25} />
                       <Line yAxisId="right" type="monotone" dataKey="telepase" name="Promedio de Indicador TelePASE" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} label={{ position: 'top', fill: '#f97316', fontWeight: 'bold', formatter: val => val.toFixed(1) + '%' }} />
                     </ComposedChart>
                   </ResponsiveContainer>
                 </div>
               </div>
            </div>

          </div>
        )}

        {/* CONFORMACIÓN DE ENCUESTAS */}
        {comercialView === 'encuestas' && (
          <div className="glass" style={{ ...cardBg, padding: '64px', textAlign: 'center' }}>
            <FileText size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: titleColor }}>Módulo de Encuestas</h3>
            <p style={{ color: '#64748b' }}>Los datos de encuestas se están sincronizando con el sistema central.</p>
          </div>
        )}

      </div>
    );
  };

  const renderCCM = () => {
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const TRIM_MESES = { 1: ['Enero','Febrero','Marzo'], 2: ['Abril','Mayo','Junio'], 3: ['Julio','Agosto','Septiembre'], 4: ['Octubre','Noviembre','Diciembre'] };

    const filtered = ccmTrimestre ? ccmMetrics.filter(m => TRIM_MESES[ccmTrimestre]?.includes(m.month)) : ccmMetrics;
    const filteredConting = ccmTrimestre ? ccmContingMetrics.filter(m => TRIM_MESES[ccmTrimestre]?.includes(m.month)) : ccmContingMetrics;

    const totLiberOk = filteredConting.reduce((a, m) => a + Number(m.data?.ccm_conting?.liberacion_ok || 0), 0);
    const totLiberEventos = filteredConting.reduce((a, m) => a + Number(m.data?.ccm_conting?.total_eventos || 0), 0);
    const pctLiber = totLiberEventos > 0 ? (totLiberOk / totLiberEventos) * 100 : 0;

    const monthlyLiber = MESES.map(m => {
      const rec = ccmContingMetrics.find(r => r.month === m);
      const ok = Number(rec?.data?.ccm_conting?.liberacion_ok || 0);
      const tot = Number(rec?.data?.ccm_conting?.total_eventos || 0);
      return { name: m.slice(0,3), pct: tot > 0 ? Math.round((ok/tot)*100) : null };
    });

    const totDet = filtered.reduce((a, m) => a + Number(m.data?.ccm_g1?.detectadas || 0), 0);
    const totRep = filtered.reduce((a, m) => a + Number(m.data?.ccm_g1?.reportadas || 0), 0);
    const pctDet = totRep > 0 ? (totDet / totRep) * 100 : 0;
    const totHsCam = filtered.reduce((a, m) => a + Number(m.data?.ccm_g2?.hs_totales_cam || 0), 0);
    const totFuera = filtered.reduce((a, m) => a + Number(m.data?.ccm_g2?.hs_fuera_cam || 0), 0);
    const pctCam = totHsCam > 0 ? ((totHsCam - totFuera) / totHsCam) * 100 : 0;
    const totHsPmv = filtered.reduce((a, m) => a + Number(m.data?.ccm_g3?.hs_totales_pmv || 0), 0);
    const totFueraPmv = filtered.reduce((a, m) => a + Number(m.data?.ccm_g3?.hs_fuera_pmv || 0), 0);
    const pctPmv = totHsPmv > 0 ? ((totHsPmv - totFueraPmv) / totHsPmv) * 100 : 0;

    const monthlyDet = MESES.map(m => {
      const rec = ccmMetrics.find(r => r.month === m);
      const det = Number(rec?.data?.ccm_g1?.detectadas || 0);
      const rep = Number(rec?.data?.ccm_g1?.reportadas || 0);
      return { name: m.slice(0,3), pct: rep > 0 ? Math.round((det/rep)*100) : null };
    });

    const trimCam = [1,2,3,4].map(t => {
      const recs = ccmMetrics.filter(r => TRIM_MESES[t].includes(r.month));
      const hs = recs.reduce((a,r) => a + Number(r.data?.ccm_g2?.hs_totales_cam || 0), 0);
      const fu = recs.reduce((a,r) => a + Number(r.data?.ccm_g2?.hs_fuera_cam || 0), 0);
      return { name: `T${t}`, pct: hs > 0 ? Math.round(((hs-fu)/hs)*100) : 0 };
    });

    const trimPmv = [4,3,2,1].map(t => {
      const recs = ccmMetrics.filter(r => TRIM_MESES[t].includes(r.month));
      const hs = recs.reduce((a,r) => a + Number(r.data?.ccm_g3?.hs_totales_pmv || 0), 0);
      const fu = recs.reduce((a,r) => a + Number(r.data?.ccm_g3?.hs_fuera_pmv || 0), 0);
      return { trimestre: `T${t}`, pct: hs > 0 ? Math.round(((hs-fu)/hs)*100) : 0 };
    });

    const tableRows = [1,2,3,4].map(t => {
      const recs = ccmMetrics.filter(r => TRIM_MESES[t].includes(r.month));
      const det = recs.reduce((a,r) => a + Number(r.data?.ccm_g1?.detectadas || 0), 0);
      const rep = recs.reduce((a,r) => a + Number(r.data?.ccm_g1?.reportadas || 0), 0);
      return { trim: t, det, rep, pct: rep > 0 ? Math.round((det/rep)*100) : null };
    }).filter(r => r.rep > 0 || r.det > 0);

    const totalDet = tableRows.reduce((a,r) => a+r.det, 0);
    const totalRep = tableRows.reduce((a,r) => a+r.rep, 0);

    const card = { backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '4px', overflow: 'hidden' };
    const hdr = (t) => <div style={{ backgroundColor: '#3b82f6', color: 'white', padding: '9px 12px', textAlign: 'center', fontWeight: 700, fontSize: '12px', lineHeight: '1.4' }}>{t}</div>;

    // â”€â”€ Gauge con número DEBAJO del arco (sin superposición) â”€â”€
    const GaugeCCM = ({ value, label, objetivo, color }) => (
      <div style={{ ...card }}>
        {hdr(label)}
        <SemiGauge value={value} objetivo={objetivo} color={color} />
      </div>
    );

    return (
      <div className="animate-fade-in delay-1" style={{ backgroundColor: '#dbeafe', minHeight: '100vh', padding: '20px' }}>

        {/* Barra superior */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center', backgroundColor: '#1e3a8a', padding: '10px 20px', borderRadius: '4px' }}>
          <button onClick={() => setActiveGerencia(null)} style={{ backgroundColor: 'white', color: '#2563eb', padding: '7px 16px', fontSize: '13px', fontWeight: 700, borderRadius: '20px', border: 'none', cursor: 'pointer' }}>← Atrás</button>
          <div style={{ flex: 1, textAlign: 'center', color: 'white', fontWeight: 800, fontSize: '20px', letterSpacing: '2px' }}>GESTIÓN DEL TRÁNSITO — CCM</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[ccmAnio-1, ccmAnio, ccmAnio+1].map(y => (
              <button key={y} onClick={() => setCcmAnio(y)} style={{ padding: '5px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: y === ccmAnio ? 'white' : 'rgba(255,255,255,0.2)', color: y === ccmAnio ? '#1e40af' : 'white' }}>{y}</button>
            ))}
          </div>
          <button onClick={toggleFullscreen} style={{ backgroundColor: 'white', border: 'none', padding: '7px', borderRadius: '4px', cursor: 'pointer' }}>
            {isFullscreen ? <Minimize size={18} color="#2563eb" /> : <Maximize size={18} color="#2563eb" />}
          </button>
        </div>

        {/* Selector Trimestre */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', backgroundColor: '#2563eb', padding: '8px 20px', borderRadius: '4px', alignItems: 'center' }}>
          <span style={{ color: 'white', fontWeight: 600, fontSize: '13px', marginRight: '8px' }}>Trimestre:</span>
          {[null, 1, 2, 3, 4].map(t => (
            <button key={t ?? 'all'} onClick={() => setCcmTrimestre(t)}
              style={{ padding: '5px 18px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: ccmTrimestre === t ? 'white' : 'rgba(255,255,255,0.25)', color: ccmTrimestre === t ? '#1e40af' : 'white' }}>
              {t === null ? 'Todos' : t}
            </button>
          ))}
        </div>

        {/* Fila 0: Contingencias (liberación de calzada) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
          <GaugeCCM value={pctLiber} label="Liberación de Calzada por Obstáculos (≤ 30 min)" objetivo={85} color="#16a34a" />
          <div style={card}>
            {hdr('Liberación de Calzada por Obstáculos — mensual')}
            <div style={{ height: '190px', padding: '4px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyLiber} margin={{ top: 22, right: 28, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip formatter={v => v != null ? v + '%' : 'Sin datos'} />
                  <ReferenceLine y={85} stroke="#16a34a" strokeDasharray="5 3" label={{ position: 'insideTopRight', value: '≥ 85%', fill: '#16a34a', fontSize: 10 }} />
                  <Bar dataKey="pct" fill="#4ade80" barSize={16} radius={[3,3,0,0]} label={{ position: 'top', fontSize: 10, fontWeight: 700, fill: '#14532d', formatter: v => v != null ? v + '%' : '' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Fila 1: Gauges + Gráfico mensual */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '12px', marginBottom: '12px' }}>
          <GaugeCCM value={pctDet} label="Tasa de Visualización en detección de contingencias" objetivo={65} color="#3b82f6" />
          <GaugeCCM value={pctCam} label="Disponibilidad de Cámaras"                            objetivo={90} color="#eab308" />
          <GaugeCCM value={pctPmv} label="Funcionamiento Paneles de Mensajería Variable"         objetivo={90} color="#f97316" />
          <div style={card}>
            {hdr('Indicador Visualización de Contingencias mensual')}
            <div style={{ height: '190px', padding: '4px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyDet} margin={{ top: 22, right: 28, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip formatter={v => v != null ? v + '%' : 'Sin datos'} />
                  <ReferenceLine y={65} stroke="#16a34a" strokeDasharray="5 3" label={{ position: 'insideTopRight', value: '≥ 65%', fill: '#16a34a', fontSize: 10 }} />
                  <Bar dataKey="pct" fill="#eab308" barSize={16} radius={[3,3,0,0]} label={{ position: 'top', fontSize: 10, fontWeight: 700, fill: '#78350f', formatter: v => v != null ? v + '%' : '' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Fila 2: Tabla */}
        <div style={{ ...card, marginBottom: '12px' }}>
          {hdr('Visualización de Contingencias')}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#dbeafe' }}>
                {['Trimestre','Contingencias detectadas por el CCM','Contingencias reportadas','Indicador detección CCM'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#1e3a8a', borderBottom: '2px solid #93c5fd' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Sin datos para {ccmAnio}. Cargá métricas en "Métricas de Sector" → CCM Gestión Tránsito.</td></tr>
              ) : (
                <>
                  {tableRows.map((r, i) => (
                    <tr key={r.trim} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700 }}>{r.trim}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>{r.det.toLocaleString()}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>{r.rep.toLocaleString()}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: r.pct != null && r.pct >= 65 ? '#16a34a' : '#dc2626' }}>{r.pct != null ? r.pct + ' %' : '-'}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#1e40af' }}>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: 'white', fontWeight: 700 }}>Total</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: 'white', fontWeight: 700 }}>{totalDet.toLocaleString()}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: 'white', fontWeight: 700 }}>{totalRep.toLocaleString()}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: totalRep > 0 && (totalDet/totalRep)*100 >= 65 ? '#86efac' : '#fca5a5' }}>
                      {totalRep > 0 ? Math.round((totalDet/totalRep)*100) + ' %' : '-'}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Fila 3: Cámaras + PMV — altura fija explícita */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={card}>
            {hdr('Indicador Disponibilidad de Cámaras')}
            <div style={{ height: '230px', padding: '8px 8px 8px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trimCam} margin={{ top: 24, right: 10, left: 0, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false}
                    label={{ value: 'Trimestre', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => v + '%'} />
                  <ReferenceLine y={90} stroke="#16a34a" strokeDasharray="5 3"
                    label={{ position: 'insideTopLeft', value: 'Objetivo ≥ 90%', fill: '#16a34a', fontSize: 10 }} />
                  <Bar dataKey="pct" fill="#fb923c" barSize={50} radius={[4,4,0,0]}
                    label={{ position: 'top', fontSize: 12, fontWeight: 700, fill: '#7c2d12', formatter: v => v > 0 ? v + ' %' : '' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={card}>
            {hdr('Funcionamiento Paneles de Mensajería Variable')}
            <div style={{ height: '230px', padding: '8px 8px 8px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={trimPmv} margin={{ top: 8, right: 54, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="trimestre" type="category" tick={{ fontSize: 12, fontWeight: 700 }} width={30} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => v + '%'} />
                  <ReferenceLine x={90} stroke="#dc2626" strokeDasharray="4 2"
                    label={{ position: 'insideTopRight', value: 'Obj ≥ 90%', fill: '#dc2626', fontSize: 10 }} />
                  <Bar dataKey="pct" fill="#3b82f6" barSize={30} radius={[0,4,4,0]}
                    label={{ position: 'right', fontSize: 12, fontWeight: 700, fill: '#1e40af', formatter: v => v > 0 ? v + ' %' : '' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    );
  };

  const renderMantenimiento = () => {
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const TRIM_MESES = { 1: ['Enero','Febrero','Marzo'], 2: ['Abril','Mayo','Junio'], 3: ['Julio','Agosto','Septiembre'], 4: ['Octubre','Noviembre','Diciembre'] };

    const filtered = mantenimientoTrimestre ? mantenimientoMetrics.filter(m => TRIM_MESES[mantenimientoTrimestre]?.includes(m.month)) : mantenimientoMetrics;

    const prevRealizados = filtered.reduce((a, m) => a + Number(m.data?.man1?.prev_realizados || 0), 0);
    const prevPlanificados = filtered.reduce((a, m) => a + Number(m.data?.man1?.prev_planificados || 0), 0);
    const pctPrev = prevPlanificados > 0 ? (prevRealizados / prevPlanificados) * 100 : 0;

    const corrRealizados = filtered.reduce((a, m) => a + Number(m.data?.man2?.corr_realizados || 0), 0);
    const corrSolicitados = filtered.reduce((a, m) => a + Number(m.data?.man2?.corr_solicitados || 0), 0);
    const pctCorr = corrSolicitados > 0 ? (corrRealizados / corrSolicitados) * 100 : 0;

    const monthlyPrev = MESES.map(m => {
      const rec = mantenimientoMetrics.find(r => r.month === m);
      const realizados = Number(rec?.data?.man1?.prev_realizados || 0);
      const planificados = Number(rec?.data?.man1?.prev_planificados || 0);
      return { name: m, realizados: realizados > 0 ? realizados : null, planificados: planificados > 0 ? planificados : null };
    }).filter(d => d.realizados !== null || d.planificados !== null);

    const monthlyCorr = MESES.map(m => {
      const rec = mantenimientoMetrics.find(r => r.month === m);
      const realizados = Number(rec?.data?.man2?.corr_realizados || 0);
      const solicitados = Number(rec?.data?.man2?.corr_solicitados || 0);
      return { name: m, realizados: realizados > 0 ? realizados : null, solicitados: solicitados > 0 ? solicitados : null };
    }).filter(d => d.realizados !== null || d.solicitados !== null);

    const card = { backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' };
    const hdr = (t, color) => <div style={{ backgroundColor: color, color: 'white', padding: '9px 12px', textAlign: 'center', fontWeight: 700, fontSize: '13px', lineHeight: '1.4' }}>{t}</div>;

    const GaugeMant = ({ value, label, objetivo, color, trackColor }) => (
      <div style={{ ...card, border: `2px solid ${color}` }}>
        {hdr(label, '#0ea5e9')}
        <SemiGauge value={value} objetivo={objetivo} color={color} trackColor={trackColor} />
      </div>
    );

    return (
      <div className="animate-fade-in delay-1" style={{ backgroundColor: '#cbd5e1', minHeight: '100vh', padding: '16px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'stretch' }}>
          <div style={{ backgroundColor: '#f1f5f9', padding: '12px 24px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '320px' }}>
            <div style={{ flex: 1, textAlign: 'center', color: '#1e293b', fontWeight: 900, fontSize: '18px', lineHeight: '1.2' }}>TALLER MECANICO -<br/>GERENCIA MANTENIMIENTO</div>
            <button onClick={() => setActiveGerencia(null)} style={{ flexShrink: 0, backgroundColor: '#0ea5e9', color: 'white', width: '32px', height: '32px', borderRadius: '16px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>←</button>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '12px 24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <h1 style={{ color: '#00a3e0', fontSize: '36px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>AUBASA</h1>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', backgroundColor: '#0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 16px', color: 'white', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>Año</div>
              <div style={{ display: 'flex', flex: 1 }}>
                {[mantenimientoAnio, mantenimientoAnio-1, mantenimientoAnio-2].map(y => (
                  <button key={y} onClick={() => setMantenimientoAnio(y)} style={{ flex: 1, padding: '6px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: y === mantenimientoAnio ? '#334155' : '#93c5fd', color: y === mantenimientoAnio ? 'white' : '#1e293b' }}>{y}</button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', backgroundColor: '#0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 16px', color: 'white', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>Trimestre</div>
              <div style={{ display: 'flex', flex: 1 }}>
                {[1, 2, 3, 4].map(t => (
                  <button key={t} onClick={() => setMantenimientoTrimestre(mantenimientoTrimestre === t ? null : t)}
                    style={{ flex: 1, padding: '6px', border: 'none', borderLeft: '1px solid #64748b', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: mantenimientoTrimestre === t ? '#334155' : '#475569', color: 'white' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button onClick={toggleFullscreen} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isFullscreen ? <Minimize size={24} color="#0ea5e9" /> : <Maximize size={24} color="#0ea5e9" />}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <GaugeMant value={pctPrev} label="Cumplimiento Mantenimiento Preventivo" objetivo={95} color="#15803d" trackColor="#dcfce7" />
            <GaugeMant value={pctCorr} label="Cumplimiento Mantenimiento Correctivo" objetivo={90} color="#ef4444" trackColor="#fee2e2" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {hdr('Cumplimiento Mantenimiento Preventivo', '#0ea5e9')}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px', gap: '16px', fontSize: '13px', fontWeight: 800 }}>
                 <span style={{ color: '#b45309' }}>● Planificados</span>
                 <span style={{ color: '#1d4ed8' }}>● Realizados</span>
              </div>
              <div style={{ flex: 1, padding: '0 16px 16px', minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyPrev.length ? monthlyPrev : MESES.map(m=>({name: m}))} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="planificados" fill="#b45309" barSize={40} label={{ position: 'top', fontSize: 11, fontWeight: 700, fill: '#78350f', backgroundColor: 'white' }} />
                    <Line type="monotone" dataKey="realizados" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 4, fill: '#1d4ed8', stroke: 'white', strokeWidth: 2 }} label={{ position: 'bottom', fontSize: 11, fontWeight: 700, fill: '#1e3a8a' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {hdr('Cumplimiento Mantenimiento Correctivo', '#0ea5e9')}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px', gap: '16px', fontSize: '13px', fontWeight: 800 }}>
                 <span style={{ color: '#854d0e' }}>● Solicitados</span>
                 <span style={{ color: '#1d4ed8' }}>● Realizados</span>
              </div>
              <div style={{ flex: 1, padding: '0 16px 16px', minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyCorr.length ? monthlyCorr : MESES.map(m=>({name: m}))} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="solicitados" fill="#a16207" barSize={40} label={{ position: 'top', fontSize: 11, fontWeight: 700, fill: '#713f12' }} />
                    <Line type="monotone" dataKey="realizados" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 4, fill: '#1d4ed8', stroke: 'white', strokeWidth: 2 }} label={{ position: 'bottom', fontSize: 11, fontWeight: 700, fill: '#1e3a8a' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInstitucionales = () => {
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    const filtered = institucionalesMes ? institucionalesMetrics.filter(m => m.month === institucionalesMes) : institucionalesMetrics;

    const totPublicados = filtered.reduce((a, m) => a + Number(m.data?.inst1?.num || 0), 0);
    const totSucedidos = filtered.reduce((a, m) => a + Number(m.data?.inst1?.den || 0), 0);
    const pctGral = totSucedidos > 0 ? (totPublicados / totSucedidos) * 100 : 0;

    const monthlyData = MESES.map(m => {
      const rec = institucionalesMetrics.find(r => r.month === m);
      const pub = Number(rec?.data?.inst1?.num || 0);
      const suc = Number(rec?.data?.inst1?.den || 0);
      const pct = suc > 0 ? Math.round((pub / suc) * 100) : null;
      return { name: m, publicados: pub > 0 ? pub : null, sucedidos: suc > 0 ? suc : null, pct };
    }).filter(d => d.publicados !== null || d.sucedidos !== null);

    const card = { backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1' };
    const hdr = (t, color) => <div style={{ backgroundColor: color, color: 'white', padding: '9px 12px', textAlign: 'center', fontWeight: 700, fontSize: '13px', lineHeight: '1.4' }}>{t}</div>;

    const GaugeInst = ({ value, label, objetivo, color, trackColor }) => (
      <div style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {hdr(label, '#0ea5e9')}
        <SemiGauge value={value} objetivo={objetivo} color={color} trackColor={trackColor} />
      </div>
    );

    const fakeTable = [
      { id: 17, min: 0, estado: 'Publicado a tiempo' },
      { id: 19, min: 0, estado: 'Publicado a tiempo' },
      { id: 21, min: 0, estado: 'Publicado a tiempo' },
      { id: 22, min: 0, estado: 'Publicado a tiempo' },
      { id: 37, min: 0, estado: 'Publicado a tiempo' },
      { id: 39, min: 0, estado: 'Publicado a tiempo' },
      { id: 56, min: 0, estado: 'Publicado a tiempo' },
      { id: 57, min: 0, estado: 'Publicado a tiempo' },
      { id: 58, min: 0, estado: 'Publicado a tiempo' }
    ];

    return (
      <div className="animate-fade-in delay-1" style={{ backgroundColor: '#e2e8f0', minHeight: '100vh', padding: '16px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'stretch' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px 24px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '320px' }}>
            <button onClick={() => setActiveGerencia(null)} style={{ flexShrink: 0, backgroundColor: '#e2e8f0', color: '#0ea5e9', width: '32px', height: '32px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>🏠</button>
            <div style={{ flex: 1, textAlign: 'center', color: '#64748b', fontWeight: 900, fontSize: '18px', lineHeight: '1.2' }}>SUBGERENCIA DE RELACIONES<br/>INSTITUCIONALES</div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '12px 24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <h1 style={{ color: '#00a3e0', fontSize: '36px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>AUBASA</h1>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', backgroundColor: '#0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 16px', color: 'white', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>Año</div>
              <div style={{ display: 'flex', flex: 1 }}>
                {[institucionalesAnio, institucionalesAnio-1, institucionalesAnio-2].map(y => (
                  <button key={y} onClick={() => setInstitucionalesAnio(y)} style={{ flex: 1, padding: '6px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: y === institucionalesAnio ? '#334155' : '#93c5fd', color: y === institucionalesAnio ? 'white' : '#1e293b' }}>{y}</button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', backgroundColor: '#0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 16px', color: 'white', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>Trimestre</div>
              <div style={{ display: 'flex', flex: 1, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                <button onClick={() => setInstitucionalesMes(null)} style={{ padding: '6px 12px', border: 'none', borderLeft: '1px solid #64748b', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: !institucionalesMes ? '#334155' : '#475569', color: 'white' }}>Seleccionar ...</button>
                {MESES.map(m => (
                  <button key={m} onClick={() => setInstitucionalesMes(m)}
                    style={{ padding: '6px 12px', border: 'none', borderLeft: '1px solid #64748b', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: institucionalesMes === m ? '#334155' : '#475569', color: 'white' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button onClick={toggleFullscreen} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isFullscreen ? <Minimize size={24} color="#0ea5e9" /> : <Maximize size={24} color="#0ea5e9" />}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' }}>
          <GaugeInst value={pctGral} label="Eventos publicados en redes sociales respecto al total de eventos sucedidos" objetivo={80} color="#0284c7" trackColor="#e0f2fe" />

          <div style={{ backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {hdr('Seguimiento mensual de eventos publicados respecto al total de eventos sucedidos', '#0ea5e9')}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px', gap: '16px', fontSize: '13px', fontWeight: 800 }}>
                <span style={{ color: '#fca5a5' }}>● Eventos Publicados</span>
                <span style={{ color: '#818cf8' }}>● Total de Eventos que Afectan la calzada</span>
            </div>
            <div style={{ flex: 1, padding: '0 16px 16px', minHeight: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData.length ? monthlyData : MESES.map(m=>({name: m}))} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="publicados" fill="#fca5a5" barSize={36} label={{ position: 'center', fill: '#7f1d1d', fontSize: 12, fontWeight: 700 }} />
                  <Bar dataKey="sucedidos" fill="#818cf8" barSize={36} label={{ position: 'center', fill: '#312e81', fontSize: 12, fontWeight: 700 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          
          <div style={{ backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            {hdr('Cumplimiento mensual del Indicador', '#0ea5e9')}
            <div style={{ padding: '16px', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={[...monthlyData].reverse()} margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 700 }} width={60} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => v + '%'} />
                  <Bar dataKey="pct" fill="#4ade80" barSize={16} radius={[0,2,2,0]} label={{ position: 'center', fill: 'white', fontSize: 12, fontWeight: 700, formatter: v => v > 0 ? v + ' %' : '' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            {hdr('Tiempo de publicacion en X a partir del aviso en Telegram', '#0ea5e9')}
            <div style={{ height: '240px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#e2e8f0', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>N°</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>Tiempo de<br/>Publicacion (minutos)</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {fakeTable.map((r, i) => (
                    <tr key={i} style={{ backgroundColor: 'white' }}>
                      <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{r.id}</td>
                      <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #0ea5e9', borderRight: '1px solid #0ea5e9', color: '#64748b' }}>{r.min}</td>
                      <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', backgroundColor: '#22c55e', color: 'white', fontWeight: 600 }}>{r.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    );
  };

  const renderOperaciones = () => {
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const TRIM_MESES = { 1: ['Enero','Febrero','Marzo'], 2: ['Abril','Mayo','Junio'], 3: ['Julio','Agosto','Septiembre'], 4: ['Octubre','Noviembre','Diciembre'] };

    const filtered = operacionesTrimestre ? operacionesMetrics.filter(m => TRIM_MESES[operacionesTrimestre]?.includes(m.month)) : operacionesMetrics;

    const totFuera = filtered.reduce((a, m) => a + Number(m.data?.op_spp?.horas_fuera || 0), 0);
    const totMensuales = filtered.reduce((a, m) => a + Number(m.data?.op_spp?.horas_mensuales || 0), 0);
    const pctGral = totMensuales > 0 ? (totFuera / totMensuales) * 100 : 0;

    // Aggregate by site for the table
    const siteDataMap = {};
    filtered.forEach(m => {
      const s = m.data?.op_spp?.sitio;
      if (s) {
        if (!siteDataMap[s]) siteDataMap[s] = { sitio: s, horas_fuera: 0, horas_mensuales: 0 };
        siteDataMap[s].horas_fuera += Number(m.data.op_spp.horas_fuera || 0);
        siteDataMap[s].horas_mensuales += Number(m.data.op_spp.horas_mensuales || 0);
      }
    });
    const siteData = Object.values(siteDataMap).sort((a,b) => a.sitio.localeCompare(b.sitio));
    const tblTotalFuera = siteData.reduce((a, s) => a + s.horas_fuera, 0);
    const tblTotalMensuales = siteData.reduce((a, s) => a + s.horas_mensuales, 0);
    const tblTotalPct = tblTotalMensuales > 0 ? (tblTotalFuera / tblTotalMensuales) * 100 : 0;

    // Monthly aggregation
    const monthlyData = MESES.map(m => {
      const recs = operacionesMetrics.filter(r => r.month === m);
      const hf = recs.reduce((a, r) => a + Number(r.data?.op_spp?.horas_fuera || 0), 0);
      const hm = recs.reduce((a, r) => a + Number(r.data?.op_spp?.horas_mensuales || 0), 0);
      const pct = hm > 0 ? Number(((hf / hm) * 100).toFixed(2)) : null;
      return { name: m, horas_fuera: hf > 0 ? hf : null, horas_mensuales: hm > 0 ? hm : null, pct };
    }).filter(d => d.horas_fuera !== null || d.horas_mensuales !== null);

    const card = { backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1' };
    const hdr = (t, color) => <div style={{ backgroundColor: color, color: 'white', padding: '9px 12px', textAlign: 'center', fontWeight: 700, fontSize: '13px', lineHeight: '1.4' }}>{t}</div>;

    const getRowColor = (pct) => {
      if (pct <= 1.5) return '#65a30d'; // green
      if (pct <= 3.0) return '#eab308'; // yellow
      return '#ef4444'; // red
    };

    return (
      <div className="animate-fade-in delay-1" style={{ backgroundColor: '#e2e8f0', minHeight: '100vh', padding: '16px', display: 'flex', flexDirection: 'column' }}>

        {/* Top Header */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'stretch' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px 24px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '320px' }}>
            <button onClick={() => setActiveGerencia(null)} style={{ flexShrink: 0, backgroundColor: '#e2e8f0', color: '#0ea5e9', width: '32px', height: '32px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>🏠</button>
            <div style={{ flex: 1, textAlign: 'center', color: '#64748b', fontWeight: 900, fontSize: '18px', lineHeight: '1.2' }}>SISTEMA DE PERCEPCION<br/>DE PEAJE</div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '12px 24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <h1 style={{ color: '#00a3e0', fontSize: '36px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>AUBASA</h1>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', backgroundColor: '#0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 16px', color: 'white', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>Año</div>
              <div style={{ display: 'flex', flex: 1 }}>
                {[operacionesAnio-1, operacionesAnio, operacionesAnio+1].map(y => (
                  <button key={y} onClick={() => setOperacionesAnio(y)} style={{ flex: 1, padding: '6px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: y === operacionesAnio ? '#334155' : '#93c5fd', color: y === operacionesAnio ? 'white' : '#1e293b' }}>{y}</button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', backgroundColor: '#0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 16px', color: 'white', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>Trimestre</div>
              <div style={{ display: 'flex', flex: 1 }}>
                <button onClick={() => setOperacionesTrimestre(null)} style={{ padding: '6px 12px', border: 'none', borderLeft: '1px solid #64748b', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: !operacionesTrimestre ? '#334155' : '#475569', color: 'white' }}>Todos</button>
                {[1,2,3,4].map(t => (
                  <button key={t} onClick={() => setOperacionesTrimestre(t)}
                    style={{ flex: 1, padding: '6px 12px', border: 'none', borderLeft: '1px solid #64748b', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: operacionesTrimestre === t ? '#334155' : '#475569', color: 'white' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button onClick={toggleFullscreen} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isFullscreen ? <Minimize size={24} color="#0ea5e9" /> : <Maximize size={24} color="#0ea5e9" />}
          </button>
        </div>

        {/* Middle row */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', marginBottom: '16px' }}>
          
          <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
            {hdr('Indisponibilidad General de Vias de Cobro', '#0ea5e9')}
            <SemiGauge value={pctGral} fillValue={Math.min(pctGral, 10) * 10} decimals={1} color="#f43f5e" trackColor="#f1f5f9" scaleLabels={['4,0 %', '50,0 %']} />
          </div>

          <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
            {hdr('Indisponibilidad de vias de cobro por Peaje', '#0ea5e9')}
            <div style={{ flex: 1, padding: '0', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
                <thead style={{ backgroundColor: '#cbd5e1' }}>
                  <tr>
                    <th style={{ padding: '8px', color: '#475569' }}>Sitio</th>
                    <th style={{ padding: '8px', color: '#475569' }}>Horas fuera de servicio</th>
                    <th style={{ padding: '8px', color: '#475569' }}>Horas Mensuales</th>
                    <th style={{ padding: '8px', color: '#475569' }}>Indicador SPP</th>
                    <th style={{ padding: '8px', color: '#475569' }}>Objetivo ≤</th>
                  </tr>
                </thead>
                <tbody>
                  {siteData.map((row, i) => {
                    const pct = row.horas_mensuales > 0 ? (row.horas_fuera / row.horas_mensuales) * 100 : 0;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                        <td style={{ padding: '8px' }}>{row.sitio}</td>
                        <td style={{ padding: '8px' }}>{row.horas_fuera}</td>
                        <td style={{ padding: '8px' }}>{row.horas_mensuales}</td>
                        <td style={{ padding: '8px', backgroundColor: getRowColor(pct), color: 'white', fontWeight: 700 }}>
                          {pct.toFixed(1)} %
                        </td>
                        <td style={{ padding: '8px' }}>4,00 %</td>
                      </tr>
                    );
                  })}
                  <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 700 }}>
                    <td style={{ padding: '8px' }}>Total</td>
                    <td style={{ padding: '8px' }}>{tblTotalFuera}</td>
                    <td style={{ padding: '8px' }}>{tblTotalMensuales}</td>
                    <td style={{ padding: '8px', backgroundColor: getRowColor(tblTotalPct), color: 'white' }}>
                      {tblTotalPct.toFixed(1)} %
                    </td>
                    <td style={{ padding: '8px' }}>4,00 %</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '16px', flex: 1 }}>
          
          <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
            {hdr('Indisponibilidad de vias por mes', '#0ea5e9')}
            <div style={{ position: 'relative', flex: 1, padding: '16px', minHeight: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={[...monthlyData].reverse()} margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" />
                  <XAxis type="number" domain={[0, 4]} tickFormatter={v => v + ' %'} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} ticks={[0, 1, 2, 3, 4]} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontWeight: 700 }} width={60} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => v + ' %'} />
                  <Bar dataKey="pct" fill="#fca5a5" barSize={24} label={{ position: 'insideRight', fill: 'white', fontSize: 12, fontWeight: 700, formatter: v => v + ' %' }} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: 0, bottom: 20, right: 35, width: '2px', borderRight: '2px dashed #0f172a' }}></div>
              <div style={{ position: 'absolute', top: 16, right: 35, fontSize: '10px', fontWeight: 700, color: '#0f172a', transform: 'translateX(50%)' }}>Objetivo &lt;= 4,0 %</div>
            </div>
          </div>

          <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
            {hdr('Cantidad de horas fuera de servicio vs. Cantidad de horas disponibles totales', '#0ea5e9')}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px', gap: '16px', fontSize: '13px', fontWeight: 800 }}>
                <span style={{ color: '#fde047' }}>● Horas Mensuales</span>
                <span style={{ color: '#ef4444' }}>● Horas fuera de servicio</span>
            </div>
            <div style={{ flex: 1, padding: '0 16px 16px', minHeight: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#dc2626' }} axisLine={false} tickLine={false} domain={[0, 'dataMax']} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="horas_mensuales" fill="#fde047" barSize={60} />
                  <Line yAxisId="right" type="monotone" dataKey="horas_fuera" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} label={{ position: 'top', fontSize: 14, fontWeight: 900, fill: '#dc2626' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    );
  };

  const renderRRHH = () => {
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    const filtered = rrhhMes ? rrhhMetrics.filter(m => m.month === rrhhMes) : rrhhMetrics;

    const totIngresadas = filtered.reduce((a, m) => a + Number(m.data?.rh_ingresos?.ingresadas || 0), 0);
    const totSolicitadas = filtered.reduce((a, m) => a + Number(m.data?.rh_ingresos?.solicitadas || 0), 0);
    const pctGral = totSolicitadas > 0 ? (totIngresadas / totSolicitadas) * 100 : 0;

    const monthlyData = MESES.map(m => {
      const rec = rrhhMetrics.find(r => r.month === m);
      const ing = Number(rec?.data?.rh_ingresos?.ingresadas || 0);
      const sol = Number(rec?.data?.rh_ingresos?.solicitadas || 0);
      const pct = sol > 0 ? Math.round((ing / sol) * 100) : null;
      return { name: m, ingresadas: ing > 0 ? ing : null, solicitadas: sol > 0 ? sol : null, pct };
    }).filter(d => d.ingresadas !== null || d.solicitadas !== null);

    const card = { backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1' };
    const hdr = (t, color) => <div style={{ backgroundColor: color, color: 'white', padding: '9px 12px', textAlign: 'center', fontWeight: 700, fontSize: '13px', lineHeight: '1.4' }}>{t}</div>;

    return (
      <div className="animate-fade-in delay-1" style={{ backgroundColor: '#e2e8f0', minHeight: '100vh', padding: '16px', display: 'flex', flexDirection: 'column' }}>

        {/* Top Header */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'stretch' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px 24px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '320px' }}>
            <button onClick={() => setActiveGerencia(null)} style={{ flexShrink: 0, backgroundColor: '#e2e8f0', color: '#0ea5e9', width: '32px', height: '32px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>🏠</button>
            <div style={{ flex: 1, textAlign: 'center', color: '#64748b', fontWeight: 900, fontSize: '20px', lineHeight: '1.2' }}>GESTION DEL PERSONAL</div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '12px 24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <h1 style={{ color: '#00a3e0', fontSize: '36px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>AUBASA</h1>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', backgroundColor: '#0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 16px', color: 'white', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>Año</div>
              <div style={{ display: 'flex', flex: 1 }}>
                {[rrhhAnio, rrhhAnio-1, rrhhAnio-2].map(y => (
                  <button key={y} onClick={() => setRrhhAnio(y)} style={{ flex: 1, padding: '6px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: y === rrhhAnio ? '#334155' : '#93c5fd', color: y === rrhhAnio ? 'white' : '#1e293b' }}>{y}</button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', backgroundColor: '#0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 16px', color: 'white', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>Trimestre</div>
              <div style={{ display: 'flex', flex: 1, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                <button onClick={() => setRrhhMes(null)} style={{ padding: '6px 12px', border: 'none', borderLeft: '1px solid #64748b', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: !rrhhMes ? '#334155' : '#475569', color: 'white' }}>Seleccionar ...</button>
                {MESES.map(m => (
                  <button key={m} onClick={() => setRrhhMes(m)}
                    style={{ padding: '6px 12px', border: 'none', borderLeft: '1px solid #64748b', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: rrhhMes === m ? '#334155' : '#475569', color: 'white' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button onClick={toggleFullscreen} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isFullscreen ? <Minimize size={24} color="#0ea5e9" /> : <Maximize size={24} color="#0ea5e9" />}
          </button>
        </div>

        {/* Middle row */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', marginBottom: '16px' }}>
          
          <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
            {hdr('Cumplimiento del Tiempo de respuesta ante la solicitud de personal externo(% solicitudes con t ≤ 60 días)', '#0ea5e9')}
            <SemiGauge value={pctGral} objetivo="95,00" color="#16a34a" trackColor="#dcfce7" />
          </div>

          <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
            {hdr('Tiempo de respuesta - analisis mensual', '#0ea5e9')}
            <div style={{ position: 'relative', flex: 1, padding: '16px', minHeight: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis type="number" domain={[0, 100]} tickFormatter={v => v + ' %'} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} ticks={[0, 50, 100]} />
                  <Tooltip formatter={v => v + ' %'} />
                  <Bar dataKey="pct" fill="#0369a1" barSize={60} label={{ position: 'top', fill: '#0c4a6e', fontSize: 13, fontWeight: 900, formatter: v => v + ' %' }} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', left: '60px', right: '30px', top: '33px', borderTop: '2px dotted #ef4444' }}></div>
              <div style={{ position: 'absolute', left: '20px', top: '27px', fontSize: '10px', fontWeight: 700, color: '#ef4444' }}>95 %</div>
            </div>
          </div>
          
        </div>

        {/* Bottom row */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
          {hdr('Cantidad total de personas externas solicitadas por mes', '#0ea5e9')}
          <div style={{ height: '300px', padding: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={[...monthlyData].reverse()} margin={{ top: 0, right: 40, bottom: 0, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" />
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 700 }} width={60} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="solicitadas" fill="#7dd3fc" barSize={24} label={{ position: 'insideRight', fill: '#0f172a', fontSize: 14, fontWeight: 900 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    );
  };

  const renderSistemas = () => {
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const SITIOS = ['Dock Sud', 'Hudson', 'Berazategui', 'Bernal', 'Quilmes'];

    const filteredBySite = sistemasSitio === 'Seleccionar todo' ? sistemasMetrics : sistemasMetrics.filter(m => m.data?.sis_pmp?.sitio === sistemasSitio);
    const filteredByMonth = sistemasMes ? filteredBySite.filter(m => m.month === sistemasMes) : filteredBySite;

    // Gauges (filtered by both Month and Site)
    const prevPlanificados = filteredByMonth.reduce((a, m) => a + Number(m.data?.sis_pmp?.prev_planificados || 0), 0);
    const prevRealizados = filteredByMonth.reduce((a, m) => a + Number(m.data?.sis_pmp?.prev_realizados || 0), 0);
    const pctPrev = prevPlanificados > 0 ? (prevRealizados / prevPlanificados) * 100 : 0;

    const tickSolicitados = filteredByMonth.reduce((a, m) => a + Number(m.data?.sis_tickets?.tickets_solicitados || 0), 0);
    const tickRealizados = filteredByMonth.reduce((a, m) => a + Number(m.data?.sis_tickets?.tickets_realizados || 0), 0);
    const pctTick = tickSolicitados > 0 ? (tickRealizados / tickSolicitados) * 100 : 0;

    // Charts (filtered by Site only, showing all months)
    const monthlyData = MESES.map(m => {
      const rec = filteredBySite.find(r => r.month === m);
      const prPlan = Number(rec?.data?.sis_pmp?.prev_planificados || 0);
      const prReal = Number(rec?.data?.sis_pmp?.prev_realizados || 0);
      const tkSol = Number(rec?.data?.sis_tickets?.tickets_solicitados || 0);
      const tkReal = Number(rec?.data?.sis_tickets?.tickets_realizados || 0);
      
      const pctPr = prPlan > 0 ? Math.round((prReal / prPlan) * 100) : null;
      const pctTk = tkSol > 0 ? Math.round((tkReal / tkSol) * 100) : null;

      return {
        name: m,
        prPlan: prPlan > 0 ? prPlan : null,
        prReal: prReal > 0 ? prReal : null,
        pctPr,
        tkSol: tkSol > 0 ? tkSol : null,
        tkReal: tkReal > 0 ? tkReal : null,
        pctTk
      };
    }).filter(d => d.prPlan !== null || d.prReal !== null || d.tkSol !== null || d.tkReal !== null);

    const card = { backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' };
    const hdr = (t, color) => <div style={{ backgroundColor: color, color: 'white', padding: '9px 12px', textAlign: 'center', fontWeight: 700, fontSize: '13px', lineHeight: '1.4' }}>{t}</div>;

    const GaugeSis = ({ value, label, objetivo, color, trackColor }) => (
      <div style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column', border: `2px solid #94a3b8` }}>
        {hdr(label, '#0ea5e9')}
        <SemiGauge value={value} objetivo={objetivo} color={color} trackColor={trackColor} />
      </div>
    );

    return (
      <div className="animate-fade-in delay-1" style={{ backgroundColor: '#cbd5e1', minHeight: '100vh', padding: '16px', display: 'flex', flexDirection: 'column' }}>

        {/* Top Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'stretch' }}>
          <div style={{ backgroundColor: '#f1f5f9', padding: '12px 24px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '320px' }}>
            <button onClick={() => setActiveGerencia(null)} style={{ flexShrink: 0, backgroundColor: '#e2e8f0', color: '#0ea5e9', width: '32px', height: '32px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>🏠</button>
            <div style={{ flex: 1, textAlign: 'center', color: '#64748b', fontWeight: 900, fontSize: '18px', lineHeight: '1.2', textTransform: 'uppercase' }}>PLAN DE MANTENIMIENTO<br/>- GERENCIA DE SISTEMAS</div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '12px 24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <h1 style={{ color: '#00a3e0', fontSize: '36px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>AUBASA</h1>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', backgroundColor: '#0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 16px', color: 'white', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>Año</div>
              <div style={{ display: 'flex', flex: 1 }}>
                {[sistemasAnio, sistemasAnio-1, sistemasAnio-2].map(y => (
                  <button key={y} onClick={() => setSistemasAnio(y)} style={{ flex: 1, padding: '6px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: y === sistemasAnio ? '#334155' : '#93c5fd', color: y === sistemasAnio ? 'white' : '#1e293b' }}>{y}</button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', backgroundColor: '#0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 16px', color: 'white', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>Mes</div>
              <div style={{ display: 'flex', flex: 1, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                <button onClick={() => setSistemasMes(null)} style={{ padding: '6px 12px', border: 'none', borderLeft: '1px solid #64748b', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: !sistemasMes ? '#334155' : '#475569', color: 'white' }}>Seleccionar ...</button>
                {MESES.map(m => (
                  <button key={m} onClick={() => setSistemasMes(m)}
                    style={{ padding: '6px 12px', border: 'none', borderLeft: '1px solid #64748b', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: sistemasMes === m ? '#334155' : '#475569', color: 'white' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button onClick={toggleFullscreen} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isFullscreen ? <Minimize size={24} color="#0ea5e9" /> : <Maximize size={24} color="#0ea5e9" />}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', flex: 1 }}>
          
          {/* Left Column (Sitio + Gauges) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              {hdr('Sitio', '#0ea5e9')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '4px', backgroundColor: '#94a3b8' }}>
                <button 
                  onClick={() => setSistemasSitio('Seleccionar todo')}
                  style={{ padding: '20px 8px', border: 'none', backgroundColor: sistemasSitio === 'Seleccionar todo' ? '#334155' : '#475569', color: 'white', fontWeight: 600, fontSize: '11px', cursor: 'pointer', gridColumn: '1' }}
                >
                  Seleccionar todo
                </button>
                {SITIOS.map(s => (
                  <button 
                    key={s} 
                    onClick={() => setSistemasSitio(s)}
                    style={{ padding: '20px 8px', border: 'none', backgroundColor: sistemasSitio === s ? '#334155' : '#475569', color: 'white', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <GaugeSis value={pctPrev} label="Cumplimiento Mantenimiento Preventivo" objetivo={75} color="#10b981" trackColor="#d1fae5" />
            <GaugeSis value={pctTick} label="Cumplimiento Gestion de Tickets" objetivo={80} color="#f43f5e" trackColor="#ffe4e6" />
            
          </div>

          {/* Right Column (Charts) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Chart 1: Preventivo */}
            <div style={{ backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {hdr('Cumplimiento Mantenimiento Preventivo', '#0ea5e9')}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px', gap: '16px', fontSize: '13px', fontWeight: 800 }}>
                  <span style={{ color: '#0ea5e9' }}>● Trabajos realizados</span>
                  <span style={{ color: '#1e3a8a' }}>● Trabajos planificados</span>
                  <span style={{ color: '#f97316' }}>● Indicador</span>
              </div>
              <div style={{ flex: 1, padding: '0 16px 16px', minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyData.length ? monthlyData : MESES.map(m=>({name: m}))} margin={{ top: 20, right: 40, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v + '%'} domain={[0, 100]} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="prReal" fill="#38bdf8" barSize={36} label={{ position: 'top', fill: '#0369a1', fontSize: 12, fontWeight: 700, backgroundColor: 'white' }} />
                    <Bar yAxisId="left" dataKey="prPlan" fill="#1e3a8a" barSize={36} label={{ position: 'top', fill: '#172554', fontSize: 12, fontWeight: 700, backgroundColor: 'white' }} />
                    <Line yAxisId="right" type="monotone" dataKey="pctPr" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316', stroke: 'white', strokeWidth: 2 }} label={{ position: 'bottom', fontSize: 12, fontWeight: 700, fill: '#ea580c', formatter: v => v ? v + '%' : '' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Tickets */}
            <div style={{ backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {hdr('Cumplimiento Gestion de Tickets', '#0ea5e9')}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px', gap: '16px', fontSize: '13px', fontWeight: 800 }}>
                  <span style={{ color: '#16a34a' }}>● Cantidad de tickets realizados</span>
                  <span style={{ color: '#991b1b' }}>● Cantidad de tickets solicitados</span>
                  <span style={{ color: '#eab308' }}>● Indicador</span>
              </div>
              <div style={{ flex: 1, padding: '0 16px 16px', minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyData.length ? monthlyData : MESES.map(m=>({name: m}))} margin={{ top: 20, right: 40, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v + '%'} domain={[0, 100]} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="tkReal" fill="#16a34a" barSize={36} label={{ position: 'top', fill: '#14532d', fontSize: 12, fontWeight: 700 }} />
                    <Bar yAxisId="left" dataKey="tkSol" fill="#991b1b" barSize={36} label={{ position: 'top', fill: '#450a0a', fontSize: 12, fontWeight: 700 }} />
                    <Line yAxisId="right" type="monotone" dataKey="pctTk" stroke="#eab308" strokeWidth={3} dot={{ r: 4, fill: '#eab308', stroke: 'white', strokeWidth: 2 }} label={{ position: 'bottom', fontSize: 12, fontWeight: 700, fill: '#ca8a04', formatter: v => v ? v + '%' : '' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>

      </div>
    );
  };

  const renderLegales = () => {
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    const filtered = legalesMes ? legalesMetrics.filter(m => m.month === legalesMes) : legalesMetrics;

    const totComunicadas = filtered.reduce((a, m) => a + Number(m.data?.leg_respuestas?.resp_comunicadas || 0), 0);
    const totSolicitadas = filtered.reduce((a, m) => a + Number(m.data?.leg_respuestas?.resp_solicitadas || 0), 0);
    const pctGral = totSolicitadas > 0 ? (totComunicadas / totSolicitadas) * 100 : 0;

    const monthlyData = MESES.map(m => {
      const rec = legalesMetrics.find(r => r.month === m);
      const comunicadas = Number(rec?.data?.leg_respuestas?.resp_comunicadas || 0);
      const solicitadas = Number(rec?.data?.leg_respuestas?.resp_solicitadas || 0);
      const matriz = rec?.data?.leg_matriz?.cumplimiento_matriz;
      return { 
        name: m, 
        comunicadas: comunicadas > 0 ? comunicadas : null, 
        solicitadas: solicitadas > 0 ? solicitadas : null,
        matriz: matriz !== undefined && matriz !== '' ? Number(matriz) : null 
      };
    }).filter(d => d.comunicadas !== null || d.solicitadas !== null || d.matriz !== null);

    const card = { backgroundColor: '#f8fafc', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1' };
    const hdr = (t, color) => <div style={{ backgroundColor: color, color: 'white', padding: '9px 12px', textAlign: 'center', fontWeight: 700, fontSize: '13px', lineHeight: '1.4' }}>{t}</div>;

    const GaugeLegales = ({ value, label, objetivo, color, trackColor }) => (
      <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
        {hdr(label, '#0ea5e9')}
        <SemiGauge value={value} objetivo={objetivo} color={color} trackColor={trackColor} />
      </div>
    );

    return (
      <div className="animate-fade-in delay-1" style={{ backgroundColor: '#e2e8f0', minHeight: '100vh', padding: '16px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'stretch' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px 24px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '320px' }}>
            <button onClick={() => setActiveGerencia(null)} style={{ flexShrink: 0, backgroundColor: '#e2e8f0', color: '#0ea5e9', width: '32px', height: '32px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>🏠</button>
            <div style={{ flex: 1, textAlign: 'center', color: '#64748b', fontWeight: 900, fontSize: '18px', lineHeight: '1.2' }}>GERENCIA DE ASUNTOS<br/>LEGALES</div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '12px 24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <h1 style={{ color: '#00a3e0', fontSize: '36px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>AUBASA</h1>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', backgroundColor: '#0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 16px', color: 'white', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>Año</div>
              <div style={{ display: 'flex', flex: 1 }}>
                {[legalesAnio-1, legalesAnio, legalesAnio+1].map(y => (
                  <button key={y} onClick={() => setLegalesAnio(y)} style={{ flex: 1, padding: '6px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: y === legalesAnio ? '#334155' : '#93c5fd', color: y === legalesAnio ? 'white' : '#1e293b' }}>{y}</button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', backgroundColor: '#0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 16px', color: 'white', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>Trimestre</div>
              <div style={{ display: 'flex', flex: 1, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                <button onClick={() => setLegalesMes(null)} style={{ padding: '6px 12px', border: 'none', borderLeft: '1px solid #64748b', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: !legalesMes ? '#334155' : '#475569', color: 'white' }}>Seleccionar ...</button>
                {MESES.map(m => (
                  <button key={m} onClick={() => setLegalesMes(m)}
                    style={{ padding: '6px 12px', border: 'none', borderLeft: '1px solid #64748b', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: legalesMes === m ? '#334155' : '#475569', color: 'white' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button onClick={toggleFullscreen} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isFullscreen ? <Minimize size={24} color="#0ea5e9" /> : <Maximize size={24} color="#0ea5e9" />}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', marginBottom: '16px' }}>
          <GaugeLegales value={pctGral} label="Indicador de Respuestas a GC (% de solicitudes ≤ 7 días)" objetivo="95,00" color="#0ea5e9" trackColor="#e0f2fe" />

          <div style={{ backgroundColor: '#f8fafc', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #cbd5e1' }}>
            {hdr('Cumplimiento confección Matriz Legal (1 = Cumple / 0 = No Cumple)', '#0ea5e9')}
            <div style={{ flex: 1, padding: '16px', minHeight: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={monthlyData.filter(d => d.matriz !== null)} margin={{ top: 0, right: 30, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" />
                  <XAxis type="number" domain={[0, 1]} tickFormatter={v => v.toFixed(1)} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} ticks={[0, 0.5, 1]} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 700 }} width={60} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="matriz" fill="#4ade80" barSize={32} label={{ position: 'center', fill: 'white', fontSize: 12, fontWeight: 700 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#f8fafc', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column' }}>
          {hdr('Cumplimiento respuestas a la Gerencia Comercial', '#0ea5e9')}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px', gap: '16px', fontSize: '13px', fontWeight: 800 }}>
              <span style={{ color: '#7dd3fc' }}>● Cantidad de respuestas comunicadas dentro del plazo estipulado (≤ 7 días)</span>
              <span style={{ color: '#818cf8' }}>● Cantidad total de respuestas solicitadas</span>
          </div>
          <div style={{ height: '300px', padding: '0 16px 16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData.length ? monthlyData : MESES.map(m=>({name: m}))} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} ticks={[0, 0.5, 1]} domain={[0, 'dataMax']} />
                <Tooltip />
                <Bar dataKey="comunicadas" fill="#7dd3fc" barSize={100} label={{ position: 'center', fill: '#0369a1', fontSize: 14, fontWeight: 700 }} />
                <Bar dataKey="solicitadas" fill="#818cf8" barSize={100} label={{ position: 'center', fill: '#312e81', fontSize: 14, fontWeight: 700 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    );
  };

  const renderAsistencia = () => {
    const bgStyle = {
      backgroundColor: '#dbeafe',
      minHeight: '100vh',
      padding: '20px'
    };

    if (asistenciaView === 'home') {
       return (
          <div className="animate-fade-in delay-1" style={{...bgStyle, position: 'relative', backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.95)), url("https://images.unsplash.com/photo-1782754521601-19691d69c25f?q=80&w=2070&auto=format&fit=crop")', backgroundSize: 'cover', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
             <button onClick={() => setActiveGerencia(null)} style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', color: 'white', padding: '10px 18px', fontSize: '13px', fontWeight: 700, borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>← Volver al Portal</button>
             <div className="glass-panel" style={{ padding: '40px 80px', borderRadius: '24px', marginBottom: '60px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,1)' }}>
                 <h1 style={{ color: '#0ea5e9', fontSize: '72px', fontWeight: '900', margin: 0, letterSpacing: '-2px', lineHeight: '1', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>AUBASA</h1>
                 <div style={{ width: '60px', height: '4px', background: '#0ea5e9', margin: '16px auto', borderRadius: '2px' }}></div>
                 <p style={{ color: '#475569', margin: '0', fontSize: '15px', fontWeight: '700', letterSpacing: '2px' }}>GERENCIA DE ASISTENCIA VIAL</p>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '450px' }}>
                 <button onClick={() => setAsistenciaView('sv')} className="btn-powerbi slide-in" style={{ animationDelay: '0.1s' }}>Gestión de Seguridad Vial</button>
                 <button onClick={() => setAsistenciaView('desempeno')} className="btn-powerbi slide-in" style={{ animationDelay: '0.2s' }}>Factores de Desempeño</button>
                 <button onClick={() => setAsistenciaView('equipamiento')} className="btn-powerbi slide-in" style={{ animationDelay: '0.3s' }}>Ambulancia y Auxilio Mecánico</button>
             </div>

             <style>{`
               .btn-powerbi {
                 padding: 16px 24px;
                 background: linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%);
                 color: white;
                 border: 1px solid rgba(255, 255, 255, 0.2);
                 border-radius: 12px;
                 font-size: 16px;
                 font-weight: 800;
                 cursor: pointer;
                 transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                 backdrop-filter: blur(8px);
                 box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
                 text-align: center;
                 text-transform: uppercase;
                 letter-spacing: 1px;
                 position: relative;
                 overflow: hidden;
               }
               .btn-powerbi::before {
                 content: '';
                 position: absolute;
                 top: 0; left: -100%; width: 50%; height: 100%;
                 background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
                 transform: skewX(-25deg);
                 transition: all 0.5s ease;
               }
               .btn-powerbi:hover::before {
                 left: 200%;
               }
               .btn-powerbi:hover {
                 transform: translateY(-2px);
                 box-shadow: 0 10px 20px -5px rgba(14, 165, 233, 0.5);
                 border-color: rgba(255, 255, 255, 0.6);
                 background: linear-gradient(135deg, rgba(14, 165, 233, 1) 0%, rgba(37, 99, 235, 1) 100%);
               }
               .slide-in {
                 opacity: 0;
                 animation: slideInUp 0.6s ease-out forwards;
               }
               @keyframes slideInUp {
                 from { opacity: 0; transform: translateY(20px); }
                 to { opacity: 1; transform: translateY(0); }
               }
             `}</style>
          </div>
       );
    }

    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    const cardBg = { backgroundColor: 'white', border: '1px solid #bfdbe6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' };

    const renderHeader = (title) => (
      <div style={{ backgroundColor: '#3b82f6', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
        {title}
      </div>
    );

    const GaugeChart = ({ value, label, color, target }) => {
       const safe = Math.max(0, Math.min(100, Number(value) || 0));
       const data = [{ name: 'A', value: safe, fill: color }, { name: 'B', value: 100 - safe, fill: '#e2e8f0' }];
       return (
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: '100%', ...cardBg }}>
           <p style={{ color: 'white', backgroundColor: '#3b82f6', padding: '10px', margin: 0, width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: '13px', minHeight: '56px', display:'flex', alignItems:'center', justifyContent:'center' }}>{label}</p>
           {target != null && <div style={{ position: 'absolute', top: '70px', right: '20px', fontSize: '16px', fontWeight: 'bold', color: '#0f2d6e' }}>{target} %</div>}
           <div style={{ height: '120px', width: '100%', marginTop: '10px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius="70%" outerRadius="100%" dataKey="value" stroke="none" />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div style={{ textAlign: 'center', width: '100%', paddingTop: '5px' }}>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color }}>{Number(value || 0).toFixed(1)} %</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px 10px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', width: '100%' }}>
              <span>0,0 %</span>
              <span>100,0 %</span>
           </div>
         </div>
       );
    };

    const mesDeFecha = (fecha) => { const d = new Date(fecha + 'T00:00:00'); return d.getMonth(); };
    const anioDeFecha = (fecha) => new Date(fecha + 'T00:00:00').getFullYear();
    const sumField = (rows, field) => rows.reduce((a, r) => a + (Number(r.data?.[field]) || 0), 0);
    const pctOf = (num, den) => (den ? (num / den) * 100 : null);

    const enAnio = (rows) => (rows || []).filter(r => r.fecha && anioDeFecha(r.fecha) === asistenciaAnio);

    const g1 = enAnio(asistenciaRows.gestion_av1);
    const fd = enAnio(asistenciaRows.factor_desempeno);
    const s1a = enAnio(asistenciaRows.serv_1er_aux);
    const sam = enAnio(asistenciaRows.serv_aux_mecanico);

    const g1Monthly = MESES.map((m, idx) => {
      const rows = g1.filter(r => mesDeFecha(r.fecha) === idx);
      const e15ok = sumField(rows, 'eventos_15min_ok');
      const e15tot = sumField(rows, 'eventos_15min_total');
      const e23ok = sumField(rows, 'eventos_23min_ok');
      const e23tot = sumField(rows, 'eventos_23min_total');
      const aok = sumField(rows, 'aux_mec_ok');
      const atot = sumField(rows, 'aux_mec_total');
      const sok = sumField(rows, 'sanit_ok');
      const stot = sumField(rows, 'sanit_total');
      return {
        name: m.slice(0, 3),
        ind15: pctOf(e15ok, e15tot),
        ind23: pctOf(e23ok, e23tot),
        indAux: pctOf(aok, atot),
        indSan: pctOf(sok, stot),
      };
    });

    const ind15Gral = pctOf(sumField(g1, 'eventos_15min_ok'), sumField(g1, 'eventos_15min_total'));
    const ind23Gral = pctOf(sumField(g1, 'eventos_23min_ok'), sumField(g1, 'eventos_23min_total'));
    const indAuxGral = pctOf(sumField(g1, 'aux_mec_ok'), sumField(g1, 'aux_mec_total'));
    const indSanGral = pctOf(sumField(g1, 'sanit_ok'), sumField(g1, 'sanit_total'));

    const totalAccidentes = sumField(fd, 'cant_accidentes');
    const totalKm = sumField(fd, 'km_recorridos');
    const totalAsistencias = sumField(fd, 'cant_asistencias');
    const exposicion = pctOf(totalAccidentes, totalAsistencias);

    const porMovil = {};
    fd.forEach(r => {
      const movil = r.data?.movil;
      if (!movil) return;
      if (!porMovil[movil]) porMovil[movil] = { movil, accidentes: 0, km: 0 };
      porMovil[movil].accidentes += Number(r.data?.accidentes_movil || 0);
      porMovil[movil].km += Number(r.data?.km_recorridos || 0);
    });
    const factorPorMovil = Object.values(porMovil).map(m => ({
      ...m,
      factor: m.km ? m.accidentes / m.km : null,
    }));
    const siniestrosData = factorPorMovil.map(m => ({ movil: m.movil, siniestros: m.accidentes })).sort((a, b) => b.siniestros - a.siniestros);

    const equipPorBase = s1a.map(r => ({ base: r.data?.base || '—', valor: Number(r.data?.indicador_equipamiento) || 0 }));
    const indEquipGral = equipPorBase.length ? (equipPorBase.reduce((a, b) => a + b.valor, 0) / equipPorBase.length) : null;
    const conformidades = sumField(sam, 'conformidades');
    const disconformidades = sumField(sam, 'disconformidades');
    const indConfMec = pctOf(conformidades, conformidades + disconformidades);

    return (
      <div className="animate-fade-in delay-1" style={bgStyle}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center', backgroundColor: '#60a5fa', padding: '10px 20px', borderRadius: '4px' }}>
           <button onClick={() => setAsistenciaView('home')} className="btn-powerbi" style={{ backgroundColor: 'white', color: '#2563eb', padding: '8px 16px', fontSize: '14px', borderRadius: '20px' }}>
             ← Atrás
           </button>
           <h2 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', flex: 1, textAlign: 'center' }}>
             {asistenciaView === 'sv' ? 'Gestión de la Seguridad Vial' : asistenciaView === 'desempeno' ? 'Factores de Desempeño - Seguridad Vial' : 'Ambulancia y Auxilio Mecánico'}
           </h2>
           <div style={{ display: 'flex', gap: '6px', backgroundColor: '#1e40af', borderRadius: '4px', padding: '2px' }}>
             {[asistenciaAnio - 1, asistenciaAnio, asistenciaAnio + 1].map(y => (
               <button key={y} onClick={() => setAsistenciaAnio(y)} style={{ padding: '5px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: y === asistenciaAnio ? 'white' : 'transparent', color: y === asistenciaAnio ? '#1e40af' : 'white' }}>{y}</button>
             ))}
           </div>
           <button onClick={toggleFullscreen} style={{ backgroundColor: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }} title="Pantalla Completa">
             {isFullscreen ? <Minimize size={20} color="#2563eb" /> : <Maximize size={20} color="#2563eb" />}
           </button>
        </div>

        {asistenciaView === 'sv' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <GaugeChart value={ind15Gral || 0} label="Veloc. respuesta Móviles AV (eventos ≤ 15 min)" color="#b91c1c" target="85" />
              <GaugeChart value={ind23Gral || 0} label="Veloc. respuesta Móviles AV (eventos ≤ 23 min) troncal" color="#eab308" target="85" />
              <GaugeChart value={indAuxGral || 0} label="Veloc. respuesta Auxilio Mecánico (≤ 55 min)" color="#7f1d1d" target="85" />
              <GaugeChart value={indSanGral || 0} label="Veloc. respuesta Sanitaria (≤ 15 min + tolerancia)" color="#1e3a8a" target="100" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Velocidad de respuesta Móviles AV — mensual')}
                <div style={{ flex: 1, padding: '20px', minHeight: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={g1Monthly} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tickFormatter={v => v + '%'} axisLine={false} tickLine={false} />
                      <Tooltip formatter={v => v == null ? 'Sin datos' : v.toFixed(1) + '%'} />
                      <Legend verticalAlign="top" />
                      <ReferenceLine y={85} stroke="#0f2d6e" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Meta 85%', fill: '#0f2d6e', fontWeight: 'bold' }} />
                      <Bar dataKey="ind15" name="≤ 15 min (autopista)" fill="#f87171" barSize={20} />
                      <Bar dataKey="ind23" name="≤ 23 min (troncal)" fill="#fbbf24" barSize={20} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Velocidad de respuesta Aux. Mecánico y Sanitaria — mensual')}
                <div style={{ flex: 1, padding: '20px', minHeight: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={g1Monthly} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 110]} tickFormatter={v => v + '%'} axisLine={false} tickLine={false} />
                      <Tooltip formatter={v => v == null ? 'Sin datos' : v.toFixed(1) + '%'} />
                      <Legend verticalAlign="top" />
                      <ReferenceLine y={85} stroke="#0f2d6e" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Meta 85%', fill: '#0f2d6e', fontWeight: 'bold' }} />
                      <ReferenceLine y={100} stroke="#dc2626" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Meta 100%', fill: '#dc2626', fontWeight: 'bold' }} />
                      <Bar dataKey="indAux" name="Aux. Mecánico ≤ 55 min" fill="#f59e0b" barSize={20} />
                      <Bar dataKey="indSan" name="Sanitaria ≤ 15 min" fill="#38bdf8" barSize={20} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {asistenciaView === 'desempeno' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ ...cardBg, textAlign: 'center' }}>
                {renderHeader('Cantidad de Accidentes')}
                <div style={{ padding: '20px' }}>
                  <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#ef4444' }}>{totalAccidentes.toLocaleString()}</span>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Asistencias con accidente</p>
                </div>
              </div>
              <div style={{ ...cardBg, textAlign: 'center' }}>
                {renderHeader('Kilómetros recorridos')}
                <div style={{ padding: '20px' }}>
                  <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#b45309' }}>{totalKm.toLocaleString()}</span>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Móviles AV</p>
                </div>
              </div>
              <div style={{ ...cardBg, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {renderHeader('Exposición de Accidentes Viales')}
                <div style={{ padding: '20px' }}>
                  <span style={{ fontSize: '48px', fontWeight: 'bold', color: exposicion != null && exposicion < 1 ? '#22c55e' : '#ef4444' }}>{exposicion != null ? exposicion.toFixed(2) + '%' : '-'}</span>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Meta &lt; 1%</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Siniestros por Unidad')}
                <div style={{ flex: 1, padding: '20px', minHeight: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={siniestrosData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide allowDecimals={false} />
                      <YAxis dataKey="movil" type="category" tick={{ fontSize: 12, fontWeight: 'bold' }} width={70} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="siniestros" fill="#3b82f6" barSize={18} label={{ position: 'right', fill: '#0f2d6e', fontWeight: 'bold' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Factor de Desempeño por Móvil (accidentes / km) — Meta ≤ 1')}
                <div style={{ flex: 1, padding: '20px', minHeight: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={factorPorMovil} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="movil" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip formatter={v => v == null ? '-' : Number(v).toFixed(4)} />
                      <ReferenceLine y={1} stroke="#dc2626" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Meta ≤ 1', fill: '#dc2626', fontWeight: 'bold' }} />
                      <Bar dataKey="factor" name="Factor desempeño" fill="#f97316" barSize={30} label={{ position: 'top', fill: '#0f2d6e', fontWeight: 'bold', formatter: v => v == null ? '-' : Number(v).toFixed(2) }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {asistenciaView === 'equipamiento' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ ...cardBg, textAlign: 'center' }}>
                {renderHeader('Equipamiento Ambulancia (promedio)')}
                <div style={{ padding: '20px' }}>
                  <span style={{ fontSize: '48px', fontWeight: 'bold', color: indEquipGral != null && indEquipGral <= 0.25 ? '#22c55e' : '#ef4444' }}>{indEquipGral != null ? indEquipGral.toFixed(2).replace('.', ',') : '-'}</span>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Objetivo ≤ 0,25</p>
                </div>
              </div>
              <div style={{ ...cardBg, textAlign: 'center' }}>
                {renderHeader('Conformidad Auxilio Mecánico')}
                <div style={{ padding: '20px' }}>
                  <span style={{ fontSize: '48px', fontWeight: 'bold', color: indConfMec != null && indConfMec >= 95 ? '#22c55e' : '#b45309' }}>{indConfMec != null ? indConfMec.toFixed(1).replace('.', ',') + ' %' : '-'}</span>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Objetivo ≥ 95%</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Equipamiento Ambulancia por Base (Objetivo ≤ 0,25)')}
                <div style={{ flex: 1, padding: '20px', minHeight: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={equipPorBase} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="base" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <ReferenceLine y={0.25} stroke="#dc2626" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Objetivo ≤ 0,25', fill: '#dc2626', fontWeight: 'bold' }} />
                      <Bar dataKey="valor" name="Indicador" fill="#3b82f6" barSize={40} label={{ position: 'top', fill: '#0f2d6e', fontWeight: 'bold', formatter: v => Number(v).toFixed(2).replace('.', ',') }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ ...cardBg, display: 'flex', flexDirection: 'column' }}>
                {renderHeader('Conformidad Auxilio Mecánico (conformes vs disconformes)')}
                <div style={{ flex: 1, padding: '20px', minHeight: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{ name: 'Aux. Mecánico', conformes: conformidades, disconformes: disconformidades }]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Legend verticalAlign="top" />
                      <Bar dataKey="conformes" name="Conformidades" fill="#3b82f6" barSize={40} label={{ position: 'top', fill: '#0f2d6e', fontWeight: 'bold' }} />
                      <Bar dataKey="disconformes" name="Disconformidades" fill="#ef4444" barSize={40} label={{ position: 'top', fill: '#7f1d1d', fontWeight: 'bold' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCargaDatos = () => {
     const title = activeGerencia === 'carga_av' ? 'Ger. Prevención y Seguridad Integral - AV' : 'Ger. Prevención y Seguridad Integral - CCM y AV';
     
     const InputRow = ({ title, col1, col2, col3 }) => (
       <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#334155', fontSize: '18px' }}>{title}</h3>
          <div style={{ display: 'flex', gap: '24px' }}>
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#475569' }}>{col1}</label>
                <input type="text" placeholder="Valor..." style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
             </div>
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#475569' }}>{col2}</label>
                <input type="text" placeholder="Valor..." style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
             </div>
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#475569' }}>{col3}</label>
                <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#e2e8f0', color: '#3b82f6', fontWeight: 'bold' }}>-</div>
             </div>
          </div>
       </div>
     );

     return (
       <div className="animate-fade-in delay-1" style={{ backgroundColor: 'white', padding: '40px', minHeight: '100vh', maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ color: '#0284c7', fontSize: '24px', marginBottom: '32px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>{title}</h2>
          
          <InputRow title="Tasa de Visualización CCM (≥ 65%)" col1="Contingencias detectadas" col2="Total reportadas" col3="Resultado Calculado" />
          <InputRow title="Liberación de calzada (≤ 30 min) (≥ 85%)" col1="Eventos ≤30 min" col2="Total eventos" col3="Resultado Calculado" />
          <InputRow title="Velocidad Respuesta Móviles AV (≤ 15 min) (≥ 85%)" col1="Contingencias ≤15 min" col2="Total contingencias" col3="Resultado Calculado" />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px' }}>
            <button className="btn-powerbi" style={{ backgroundColor: '#94a3b8', padding: '12px 24px' }} onClick={() => setActiveGerencia(null)}>Cancelar</button>
            <button className="btn-powerbi" style={{ backgroundColor: '#0284c7', padding: '12px 24px' }} onClick={() => alert('Datos guardados exitosamente (Maqueta)')}>Guardar Datos</button>
          </div>
       </div>
     );
  };

  const renderSgi = () => {
    return (
      <div className="animate-fade-in delay-1" style={{ height: 'calc(100vh - 40px)', width: '100%', overflow: 'hidden', borderRadius: '8px', backgroundColor: 'white' }}>
        <iframe src="/objetivos.html" style={{ width: '100%', height: '100%', border: 'none' }} title="Objetivos y Metas SGI"></iframe>
      </div>
    );
  };

  return (
    <div className="module-container">
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Indicadores del Sistema de Gestión Integrado</h2>
          <p>Panel de visualización de indicadores clave de gestión</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {activeGerencia && (
            <button className="btn btn-secondary" onClick={() => setActiveGerencia(null)}>
              Inicio
            </button>
          )}
        </div>
      </div>

      <div className="module-content" ref={dashboardContentRef} style={{ backgroundColor: activeGerencia ? undefined : '#0f172a' }}>
        {!activeGerencia && renderPortal()}
        {activeGerencia === 'comercial' && renderComercial()}
        {activeGerencia === 'ccm' && renderCCM()}
        {activeGerencia === 'operaciones_spp' && renderOperaciones()}
        {activeGerencia === 'rrhh' && renderRRHH()}
        {activeGerencia === 'mantenimiento' && renderMantenimiento()}
        {activeGerencia === 'institucionales' && renderInstitucionales()}
        {activeGerencia === 'legales' && renderLegales()}
        {activeGerencia === 'sistemas' && renderSistemas()}
        {activeGerencia === 'asistencia' && renderAsistencia()}
        {(activeGerencia === 'carga_av' || activeGerencia === 'carga_ccm') && renderCargaDatos()}
        {activeGerencia === 'sgi' && renderSgi()}
      </div>
    </div>
  );
};

export default Dashboard;


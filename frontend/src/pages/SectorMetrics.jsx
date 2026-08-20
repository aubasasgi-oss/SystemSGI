import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Save, CheckCircle } from 'lucide-react';

const kpisBySector = {
  operaciones_spp: {
    title: 'Sist Perc Peaje (Gerencia de Operaciones)',
    kpis: [
      { 
        id: 'op_spp', 
        title: 'Indicador SPP (Meta ≤ 4,00%)', 
        selects: [
          {id: 'sitio', label: 'Sitio', options: ['Dock Sud', 'Hudson', 'Bernal', 'Quilmes', 'Berazategui', 'Samborombón', 'Maipú', 'La Huella', 'Mar Chiquita', 'Gral. Madariaga']}
        ],
        inputs: [
          {id: 'horas_fuera', label: 'Horas fuera de servicio'}, 
          {id: 'horas_mensuales', label: 'Horas Mensuales'}
        ],
        calc: (v) => v.horas_mensuales ? ((v.horas_fuera / v.horas_mensuales)*100).toFixed(2).replace('.', ',') + '%' : '-' 
      }
    ]
  },

  ccm: {
    title: 'Centro de Control y Monitoreo (CCM)',
    kpis: [
      { 
        id: 'ccm_conting', 
        title: 'Contingencias, Detección y Atención (Meta ≥ 85%)', 
        inputs: [
          {id: 'liberacion_ok', label: 'Liberación de la calzada por obstáculos cuyo tiempo es ≤ 30 minutos'}, 
          {id: 'total_eventos', label: 'Cantidad de eventos'}
        ], 
        calc: (v) => v.total_eventos ? ((v.liberacion_ok / v.total_eventos)*100).toFixed(2) + '%' : '-' 
      }
    ]
  },
  ccm_gestion: {
    title: 'Gestión Tránsito',
    kpis: [
      {
        id: 'ccm_g1',
        title: 'Detección CCM (Meta ≥ 65%)',
        inputs: [
          {id: 'detectadas', label: 'Cantidad de contingencias detectadas por el CCM'},
          {id: 'reportadas', label: 'Cantidad de contingencias reportadas'}
        ],
        calc: (v) => v.reportadas ? ((v.detectadas / v.reportadas) * 100).toFixed(2) + '%' : '-'
      },
      {
        id: 'ccm_g2',
        title: 'Disponibilidad Cámaras (Meta ≥ 90%)',
        inputs: [
          {id: 'hs_fuera_cam', label: 'Cantidad de hs fuera de servicio Camaras'},
          {id: 'hs_totales_cam', label: 'Cantidad de horas totales'}
        ],
        calc: (v) => v.hs_totales_cam ? (((v.hs_totales_cam - (v.hs_fuera_cam || 0)) / v.hs_totales_cam) * 100).toFixed(2) + '%' : '-'
      },
      {
        id: 'ccm_g3',
        title: 'Disponibilidad PMV (Meta ≥ 90%)',
        inputs: [
          {id: 'hs_fuera_pmv', label: 'Cantidad de hs fuera de servicio PMV'},
          {id: 'hs_totales_pmv', label: 'Cantidad de horas totales 1'}
        ],
        calc: (v) => v.hs_totales_pmv ? (((v.hs_totales_pmv - (v.hs_fuera_pmv || 0)) / v.hs_totales_pmv) * 100).toFixed(2) + '%' : '-'
      }
    ]
  },
  av: {
    title: 'Asistencia Vial (AV)',
    kpis: [
      { id: 'prev3', title: 'Velocidad Respuesta Móviles AV (≤ 15 min) (≥ 85%)', inputs: [{id: 'num', label: 'Contingencias ≤15 min'}, {id: 'den', label: 'Total contingencias'}], calc: (v) => v.den ? ((v.num/v.den)*100).toFixed(2) + '%' : '-' },
      { id: 'prev4', title: 'Velocidad Respuesta Sanitaria (≤ 15 min) (≥ 75%)', inputs: [{id: 'num', label: 'Eventos ≤15 min'}, {id: 'den', label: 'Total eventos'}], calc: (v) => v.den ? ((v.num/v.den)*100).toFixed(2) + '%' : '-' },
      { 
        id: 'av_factores', 
        title: 'Factores de Desempeño (Meta ≤ 1) y Exposición Accidentes Viales (Meta < 1%)', 
        selects: [
          {id: 'movil', label: 'Móvil', options: ['Móvil 1', 'Móvil 2', 'Móvil 3', 'Móvil 4', 'Móvil 5']}
        ],
        inputs: [
          {id: 'accidentes_movil', label: 'Accidentes por movil'}, 
          {id: 'km_recorridos', label: 'Km recorridos por Movil'},
          {id: 'cant_accidentes', label: 'Cantidad de accidentes'},
          {id: 'cant_asistencias', label: 'Cantidad de asistencias'}
        ], 
        calc: (v) => {
          const factor = v.km_recorridos ? (v.accidentes_movil / v.km_recorridos).toFixed(2) : '-';
          const exposicion = v.cant_asistencias ? ((v.cant_accidentes / v.cant_asistencias) * 100).toFixed(2) + '%' : '-';
          return `Factor: ${factor} | Exposición: ${exposicion}`;
        }
      },
    ]
  },
  av_gestion: {
    title: 'Gestión AV1',
    kpis: [
      {
        id: 'av_g1',
        title: 'Velocidad de Respuesta ante Contingencia Móviles AV Toda Autopista (Meta ≥ 85%)',
        inputs: [
          {id: 'eventos_15min', label: 'Cantidad de eventos ante una contingencia Moviles AV cuyo tiempo es ≤ 15 minuto Toda la Autopista'},
          {id: 'total_eventos', label: 'Cantidad de eventos ante una contingencia'}
        ],
        calc: (v) => v.total_eventos ? ((v.eventos_15min / v.total_eventos) * 100).toFixed(2) + '%' : '-'
      },
      {
        id: 'av_g2',
        title: 'Velocidad de Respuesta ante Contingencia Móviles AV Troncal (Meta ≥ 85%)',
        inputs: [
          {id: 'eventos_23min', label: 'Cantidad de eventos ante una contingencia Moviles AV cuyo tiempo es ≤ 23 minuto Troncal PR 42+000 a 52+000 Descendente'},
          {id: 'total_eventos_troncal', label: 'Cantidad de eventos ante una contingencia (troncal)'}
        ],
        calc: (v) => v.total_eventos_troncal ? ((v.eventos_23min / v.total_eventos_troncal) * 100).toFixed(2) + '%' : '-'
      },
      {
        id: 'av_g3',
        title: 'Velocidad de Respuesta Auxilio Mecánico (Meta ≥ 85%)',
        inputs: [
          {id: 'aux_55min', label: 'Cantidad de Respuesta Auxilio Mecánico cuyo tiempo es ≤ 55 minutos'},
          {id: 'total_aux', label: 'Cantidad de Respuesta Auxilio Mecánico'}
        ],
        calc: (v) => v.total_aux ? ((v.aux_55min / v.total_aux) * 100).toFixed(2) + '%' : '-'
      },
      {
        id: 'av_g4',
        title: 'Velocidad de Respuesta Sanitaria (Meta ≥ 100%)',
        inputs: [
          {id: 'sanit_15min', label: 'Cantidad de Respuesta Sanitaria ante una Contingencia (≤ 15 minutos _ Tolerancia + 25 minutos)'},
          {id: 'total_sanit', label: 'Cantidad de Respuesta Sanitaria ante una Contingencia'}
        ],
        calc: (v) => v.total_sanit ? ((v.sanit_15min / v.total_sanit) * 100).toFixed(2) + '%' : '-'
      }
    ]
  },
  av_aux1: {
    title: 'Serv 1° Aux (Ambulancias)',
    kpis: [
      {
        id: 'av_a1',
        title: 'Equipamiento y Condiciones Generales Ambulancia (Meta ≤ 0,25)',
        selects: [
          {id: 'base', label: 'Base', options: ['Dock Sud', 'Hudson', 'Bernal', 'Quilmes', 'Berazategui', 'Samborombón', 'Maipú', 'La Huella', 'Mar Chiquita', 'Gral. Madariaga']}
        ],
        inputs: [
          {id: 'ind_equip', label: 'Indicador Equipamiento y Condiciones generales de la Ambulancia'}
        ],
        calc: (v) => v.ind_equip !== undefined ? Number(v.ind_equip).toFixed(2).replace('.', ',') : '-'
      }
    ]
  },
  av_aux_mec: {
    title: 'Serv Aux Mecánico',
    kpis: [
      {
        id: 'av_am',
        title: 'Conformidad AM (Meta ≥ 95%)',
        inputs: [
          {id: 'conformidades', label: 'Cantidad de Conformidades'},
          {id: 'disconformidades', label: 'Cantidad de Disconformidades'}
        ],
        calc: (v) => {
          const total = (Number(v.conformidades) || 0) + (Number(v.disconformidades) || 0);
          return total > 0 ? ((Number(v.conformidades) / total) * 100).toFixed(2).replace('.', ',') + '%' : '-';
        }
      }
    ]
  },
  mantenimiento: {
    title: 'Ger. Mantenimiento (Taller Mecánico)',
    kpis: [
      { 
        id: 'man1', 
        title: 'Cumplimiento PMP - Taller (Meta ≥ 95%)', 
        inputs: [
          {id: 'prev_realizados', label: 'Cantidad de trabajos de mantenimiento preventivos realizados'}, 
          {id: 'prev_planificados', label: 'Cantidad de trabajos de mantenimiento preventivos planificados'}
        ], 
        calc: (v) => v.prev_planificados ? ((v.prev_realizados / v.prev_planificados)*100).toFixed(2) + '%' : '-' 
      },
      { 
        id: 'man2', 
        title: 'Cumplimiento MC - Taller (Meta ≥ 90%)', 
        inputs: [
          {id: 'corr_realizados', label: 'Cantidad de trabajos de mantenimiento correctivos realizados'}, 
          {id: 'corr_solicitados', label: 'Cantidad de trabajos de mantenimiento correctivos solicitados'}
        ], 
        calc: (v) => v.corr_solicitados ? ((v.corr_realizados / v.corr_solicitados)*100).toFixed(2) + '%' : '-' 
      },
    ]
  },
  rrhh: {
    title: 'Gerencia de Recursos Humanos',
    kpis: [
      {
        id: 'rh_ingresos',
        title: 'Tiempo de respuesta ante solicitud de personal (Meta ≥ 95%)',
        inputs: [
          {id: 'ingresadas', label: 'Cantidad de Personas ingresadas ante la solicitud de personal ≤ 60 días'},
          {id: 'solicitadas', label: 'Cantidad de Personas solicitadas'}
        ],
        calc: (v) => v.solicitadas ? ((v.ingresadas / v.solicitadas) * 100).toFixed(2) + '%' : '-'
      },
      {
        id: 'rh_obs',
        title: 'Observaciones',
        inputs: [
          {id: 'observaciones', label: 'Observacion', type: 'textarea', required: false}
        ],
        calc: () => ''
      }
    ]
  },
  compras: {
    title: 'Gerencia de Compras - Indicadores',
    kpis: [
      { id: 'com1', title: 'Proveedores Críticos Aprobados (= 100%)', inputs: [{id: 'num', label: 'Proveedores ≥4 puntos'}, {id: 'den', label: 'Total proveedores críticos'}], calc: (v) => v.den ? ((v.num/v.den)*100).toFixed(2) + '%' : '-' },
    ]
  },
  legales: {
    title: 'Gerencia de Asuntos Legales',
    kpis: [
      {
        id: 'leg_respuestas',
        title: 'Respuestas a GC (Meta ≥ 95%)',
        inputs: [
          {id: 'resp_comunicadas', label: 'Cantidad de respuestas comunicadas dentro del plazo estipulado (7 dias)'},
          {id: 'resp_solicitadas', label: 'Cantidad total de respuestas solicitadas'}
        ],
        calc: (v) => v.resp_solicitadas ? ((v.resp_comunicadas / v.resp_solicitadas) * 100).toFixed(2) + '%' : '-'
      },
      {
        id: 'leg_matriz',
        title: 'Cumplimiento confección Matriz Legal (Meta = 1)',
        inputs: [
          {id: 'cumplimiento_matriz', label: 'Cumplimiento confección Matriz Legal'}
        ],
        calc: (v) => v.cumplimiento_matriz !== undefined ? v.cumplimiento_matriz : '-'
      },
      {
        id: 'leg_obs',
        title: 'Observaciones',
        inputs: [
          {id: 'observaciones', label: 'Observaciones / Comentarios Adicionales', type: 'textarea', required: false}
        ],
        calc: () => ''
      }
    ]
  },
  comercial: {
    title: 'Gerencia Comercial - Indicadores de Control',
    kpis: [
      { 
        id: 'com_telepase', 
        title: 'Indicador TelePASE (Meta ≥ 80,00%)', 
        selects: [
          {id: 'concesion', label: 'Concesion', options: ['BALP', 'SVIA']}
        ],
        inputs: [
          {id: 'transito_telepase', label: 'Cantidad de Tránsito con TelePASE'}, 
          {id: 'transito_total', label: 'Tránsito Total Pagante'}
        ],
        calc: (v) => v.transito_total ? ((v.transito_telepase / v.transito_total) * 100).toFixed(2).replace('.', ',') + '%' : '-' 
      },
      { 
        id: 'com_quejas_reclamos', 
        title: 'Quejas y Reclamos (Meta Quejas ≤ 0,70 | Meta Reclamos ≤ 1,70)', 
        selects: [
          {id: 'concesion', label: 'Concesion', options: ['BALP', 'SVIA']},
          {id: 'sitio', label: 'Sitio', options: ['Dock Sud', 'Hudson', 'Bernal', 'Quilmes', 'Berazategui', 'Samborombón', 'Maipú', 'La Huella', 'Mar Chiquita', 'Gral. Madariaga']}
        ],
        inputs: [
          {id: 'transito', label: 'Tránsito'},
          {id: 'quejas', label: 'Cantidad de Quejas'},
          {id: 'reclamos', label: 'Cantidad de Reclamos'}
        ],
        calc: (v) => {
          if (!v.transito) return '-';
          const q = ((v.quejas || 0) / v.transito) * 100000;
          const r = ((v.reclamos || 0) / v.transito) * 100000;
          return `Ind. Quejas: ${q.toFixed(2).replace('.', ',')} | Ind. Reclamos: ${r.toFixed(2).replace('.', ',')}`;
        }
      },
      { 
        id: 'com_tiempo_resp', 
        title: 'Indicador (Cantidad de respuestas con tiempo ≤ 9 días / Cantidad Total de respuestas) (Meta ≥ 90,00%)', 
        selects: [
          {id: 'concesion', label: 'Concesion', options: ['BALP', 'SVIA']},
          {id: 'tipo', label: 'Tipo', options: ['Quejas', 'Reclamos']}
        ],
        inputs: [
          {id: 'resp_ok', label: 'Cantidad de respuestas con tiempo ≤ 9 días'}, 
          {id: 'resp_total', label: 'Cantidad Total de respuestas'}
        ],
        calc: (v) => v.resp_total ? ((v.resp_ok / v.resp_total) * 100).toFixed(2).replace('.', ',') + '%' : '-' 
      },
      { 
        id: 'com_atencion', 
        title: 'Atención Telefónica (Meta ≥ 75%) y Correos (Meta ≥ 95%)', 
        inputs: [
          {id: 'llamadas_atendidas', label: 'Cantidad de llamadas atendidas'}, 
          {id: 'llamadas_totales', label: 'Cantidad total de llamadas'},
          {id: 'correos_respondidos', label: 'Cant. de correos respondidos'}, 
          {id: 'correos_totales', label: 'Total de correos recibidos'}
        ],
        calc: (v) => {
          const t = v.llamadas_totales ? ((v.llamadas_atendidas / v.llamadas_totales)*100).toFixed(2)+'%' : '-';
          const c = v.correos_totales ? ((v.correos_respondidos / v.correos_totales)*100).toFixed(2)+'%' : '-';
          return `Ind. Llamadas: ${t} | Ind. Correos: ${c}`;
        }
      },
    ]
  },
  sistemas: {
    title: 'Gerencia de Tecnología y Sistemas',
    kpis: [
      {
        id: 'sis_pmp',
        title: 'Cumplimiento PMP - Sistemas (Meta ≥ 75%)',
        selects: [
          {id: 'sitio', label: 'Sitio', options: ['Dock Sud', 'Hudson', 'Bernal', 'Quilmes', 'Berazategui', 'Samborombón', 'Maipú', 'La Huella', 'Mar Chiquita', 'Gral. Madariaga']}
        ],
        inputs: [
          {id: 'prev_realizados', label: 'Cantidad de trabajos de mantenimiento preventivos realizados'},
          {id: 'prev_planificados', label: 'Cantidad de trabajos de mantenimiento preventivos planificados'}
        ],
        calc: (v) => v.prev_planificados ? ((v.prev_realizados / v.prev_planificados) * 100).toFixed(2).replace('.', ',') + '%' : '-'
      },
      {
        id: 'sis_tickets',
        title: 'Gestion de Ticket (Meta ≥ 80%)',
        inputs: [
          {id: 'tickets_realizados', label: 'Cantidad de tickets realizados'},
          {id: 'tickets_solicitados', label: 'Cantidad de tickets solicitados'}
        ],
        calc: (v) => v.tickets_solicitados ? ((v.tickets_realizados / v.tickets_solicitados) * 100).toFixed(2).replace('.', ',') + '%' : '-'
      }
    ]
  },
  institucionales: {
    title: 'Subgerencia Relaciones Institucionales',
    kpis: [
      { id: 'inst1', title: 'Efectividad de eventos publicados en RRSS (≥ 80%)', inputs: [{id: 'num', label: 'Eventos publicados'}, {id: 'den', label: 'Eventos sucedidos'}], calc: (v) => v.den ? ((v.num/v.den)*100).toFixed(2) + '%' : '-' },
    ]
  }
};

const SectorMetrics = () => {
  const { userRole, userSector } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const getSectorForm = () => {
    if (userRole === 'SGI') return 'sgi';
    
    switch (userSector) {
      case 'Gerencia de Operaciones':
      case 'Operaciones SPP': return 'operaciones_spp';
      case 'CCM':
        return 'ccm';
      case 'CCM Gestión Tránsito':
        return 'ccm_gestion';
      case 'Asistencia Vial': 
        return 'av';
      case 'Asistencia Vial Gestión':
        return 'av_gestion';
      case 'Asistencia Vial 1° Aux':
        return 'av_aux1';
      case 'Asistencia Vial Aux Mecánico':
        return 'av_aux_mec';
      case 'Gerencia de Mantenimiento-Taller Mecanico': 
      case 'Mantenimiento':
        return 'mantenimiento';
      case 'Gerencia de Recursos Humanos': return 'rrhh';
      case 'Gerencia de Compras': return 'compras';
      case 'Gerencia de Asuntos Legales': 
      case 'Asuntos Legales':
        return 'legales';
      case 'Gerencia Comercial': return 'comercial';
      case 'SubGerencia de Relaciones Institucionales': return 'institucionales';
      case 'Gerencia de Tecnologia y Sistemas': 
      case 'Sistemas':
        return 'sistemas';
      default: return 'none';
    }
  };

  const [activeForm, setActiveForm] = useState(getSectorForm() === 'sgi' ? 'comercial' : getSectorForm());

  React.useEffect(() => {
    const roleForm = getSectorForm();
    if (roleForm !== 'sgi') {
      setActiveForm(roleForm);
    }
  }, [userRole, userSector]);

  React.useEffect(() => {
    if (selectedMonth && selectedYear && activeForm !== 'none') {
      fetch(`http://localhost:5001/api/metrics?sector=${activeForm}&year=${selectedYear}&month=${selectedMonth}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setFormData(data[0].data || {});
          } else {
            setFormData({});
          }
        })
        .catch(err => console.error(err));
    }
  }, [activeForm, selectedMonth, selectedYear]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedMonth || !selectedYear) return;
    
    fetch('http://localhost:5001/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sector: activeForm,
        year: selectedYear,
        month: selectedMonth,
        data: formData
      })
    })
    .then(res => res.json())
    .then(data => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    })
    .catch(err => console.error(err));
  };

  const handleInputChange = (kpiId, field, value, isString = false) => {
    setFormData(prev => ({
      ...prev,
      [kpiId]: {
        ...prev[kpiId],
        [field]: isString ? value : (value === '' ? '' : Number(value))
      }
    }));
  };

  if (activeForm === 'none') {
    return (
      <div className="glass" style={{ padding: '32px', textAlign: 'center' }}>
        <h2>Sin Métricas Asignadas</h2>
        <p>Tu sector actual ({userSector}) no tiene un formulario de métricas asignado en este módulo.</p>
      </div>
    );
  }

  const currentSectorData = kpisBySector[activeForm];

  return (
    <div className="module-container">
      <div className="module-header animate-fade-in">
        <div>
          <h2>Carga de Métricas y KPIs Sectoriales</h2>
          <p>Módulo de recolección de datos para alimentar los paneles de Power BI.</p>
        </div>
      </div>

      <div className="glass animate-fade-in delay-1" style={{ padding: '32px', maxWidth: '1100px' }}>
        
        {userRole === 'SGI' && (
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
            <label className="form-label">Seleccionar Sector a Cargar (Modo SGI)</label>
            <select className="form-control" value={activeForm} onChange={(e) => setActiveForm(e.target.value)} style={{ width: '350px' }}>
              <option value="comercial">Gerencia Comercial</option>
              <option value="operaciones_spp">Gerencia de Operaciones (SPP)</option>
              <option value="ccm">Centro de Control y Monitoreo (Contingencias)</option>
              <option value="ccm_gestion">Centro de Control y Monitoreo (Gestión Tránsito)</option>
              <option value="av">Asistencia Vial (Factores)</option>
              <option value="av_gestion">Asistencia Vial (Gestión AV1)</option>
              <option value="av_aux1">Asistencia Vial (1° Auxilio)</option>
              <option value="av_aux_mec">Asistencia Vial (Auxilio Mecánico)</option>
              <option value="mantenimiento">Ger. Mantenimiento-Taller Mecánico</option>
              <option value="rrhh">Gerencia de Recursos Humanos</option>
              <option value="compras">Gerencia de Compras</option>
              <option value="legales">Gerencia de Asuntos Legales</option>
              <option value="sistemas">Gerencia de Tecnología y Sistemas</option>
              <option value="institucionales">SubGerencia Relaciones Institucionales</option>
            </select>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '400px' }}>
            <div className="form-group">
              <label className="form-label">Mes</label>
              <select className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} required>
                <option value="">Seleccionar...</option>
                <option value="Enero">Enero</option>
                <option value="Febrero">Febrero</option>
                <option value="Marzo">Marzo</option>
                <option value="Abril">Abril</option>
                <option value="Mayo">Mayo</option>
                <option value="Junio">Junio</option>
                <option value="Julio">Julio</option>
                <option value="Agosto">Agosto</option>
                <option value="Septiembre">Septiembre</option>
                <option value="Octubre">Octubre</option>
                <option value="Noviembre">Noviembre</option>
                <option value="Diciembre">Diciembre</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Año</label>
              <input type="number" className="form-control" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} required />
            </div>
          </div>

          <h3 style={{ marginTop: '16px', color: 'var(--accent-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px' }}>
            {currentSectorData?.title}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {currentSectorData?.kpis.map((kpi) => {
              const vals = formData[kpi.id] || {};
              const result = kpi.calc(vals);

              return (
                <div key={kpi.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 600, color: '#334155', marginBottom: '12px' }}>{kpi.title}</div>
                  
                  {/* Filtros Dropdown si existen */}
                  {kpi.selects && kpi.selects.length > 0 && (
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed #cbd5e1' }}>
                      {kpi.selects.map(sel => (
                        <div key={sel.id} className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
                          <label className="form-label" style={{ fontSize: '11px', color: '#64748b' }}>{sel.label}</label>
                          <select 
                            className="form-control" 
                            value={vals[sel.id] || ''}
                            onChange={(e) => handleInputChange(kpi.id, sel.id, e.target.value, true)}
                            required
                          >
                            <option value="">Seleccionar...</option>
                            {sel.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Campos Numéricos Inputs */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'end' }}>
                    
                    {kpi.inputs.map(inp => (
                      <div key={inp.id} className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: inp.type === 'textarea' ? '100%' : '150px' }}>
                        <label className="form-label" style={{ fontSize: '11px', color: '#64748b' }}>{inp.label}</label>
                        {inp.type === 'textarea' ? (
                          <textarea
                            className="form-control"
                            placeholder="Valor..."
                            value={vals[inp.id] !== undefined ? vals[inp.id] : ''}
                            onChange={(e) => handleInputChange(kpi.id, inp.id, e.target.value, true)}
                            required={inp.required !== false}
                            style={{ minHeight: '80px', resize: 'vertical' }}
                          />
                        ) : (
                          <input 
                            type={inp.type || "number"} 
                            step={inp.type === 'text' ? undefined : "any"}
                            className="form-control" 
                            placeholder="Valor..." 
                            value={vals[inp.id] !== undefined ? vals[inp.id] : ''}
                            onChange={(e) => handleInputChange(kpi.id, inp.id, e.target.value, inp.type === 'text')} 
                            required={inp.required !== false} 
                          />
                        )}
                      </div>
                    ))}

                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '180px' }}>
                      <label className="form-label" style={{ fontSize: '11px', color: '#64748b' }}>Resultado Calculado</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={result} 
                        style={{ fontWeight: 'bold', color: 'var(--sidebar-bg)' }}
                        disabled 
                        placeholder="-"
                      />
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Guardar Métricas del Mes
            </button>
          </div>

          {saveSuccess && (
            <div className="animate-fade-in" style={{ marginTop: '16px', padding: '12px', background: '#f0fdf4', color: '#16a34a', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} /> Los datos han sido guardados y enviados al Dashboard de Power BI exitosamente.
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default SectorMetrics;

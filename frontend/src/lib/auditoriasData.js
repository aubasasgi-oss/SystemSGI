import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../supabaseClient';

export const SECTORES_AUDITORIA = [
  "Gerencia de Recursos Humanos",
  "Gerencia de Compras",
  "Gerencia de Operaciones",
  "Subgerencia de Relaciones Institucionales",
  "Subgerencia de Seguridad Patrimonial",
  "Taller Mecánico (Gerencia de Mantenimiento)",
  "Gerencia de Comercial",
  "Centro de Control y Monitoreo",
  "Asistencia Vial",
  "Gerencia de Sistemas",
  "Gerencia de Asuntos Legales",
  "Gerencia General",
  "Sistema de Gestión Integrado"
];

export const CAPITULOS_ISO = [
  { id: '4', numero: 'Capítulo 4', nombre: 'Contexto de la Organización', corto: 'Cap. 4 Contexto' },
  { id: '5', numero: 'Capítulo 5', nombre: 'Liderazgo', corto: 'Cap. 5 Liderazgo' },
  { id: '6', numero: 'Capítulo 6', nombre: 'Planificación', corto: 'Cap. 6 Planificación' },
  { id: '7', numero: 'Capítulo 7', nombre: 'Apoyo y Recursos', corto: 'Cap. 7 Apoyo' },
  { id: '8', numero: 'Capítulo 8', nombre: 'Operación', corto: 'Cap. 8 Operación' },
  { id: '9', numero: 'Capítulo 9', nombre: 'Evaluación del Desempeño', corto: 'Cap. 9 Desempeño' },
  { id: '10', numero: 'Capítulo 10', nombre: 'Mejora', corto: 'Cap. 10 Mejora' }
];

export const REQUISITOS_NORMATIVOS = [
  {
    codigo: "9001-39001-3810-4.1",
    capitulo: "4",
    tituloCapitulo: "4. Contexto de la Organización",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Comprensión de la organización y su contexto.",
    pregunta: "¿Se identificaron las partes internas/externas relevantes y su contexto?"
  },
  {
    codigo: "9001-39001-3810-4.2",
    capitulo: "4",
    tituloCapitulo: "4. Contexto de la Organización",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Comprensión de las necesidades y expectativas de las partes interesadas.",
    pregunta: "¿Se identificaron partes interesadas y sus necesidades/expectativas?"
  },
  {
    codigo: "9001-39001-3810-4.3",
    capitulo: "4",
    tituloCapitulo: "4. Contexto de la Organización",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Determinación del alcance del SGI.",
    pregunta: "¿El alcance del SGI está definido y disponible como información documentada?"
  },
  {
    codigo: "9001-39001-3810-4.4",
    capitulo: "4",
    tituloCapitulo: "4. Contexto de la Organización",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Sistema de gestión de la calidad/SV y sus procesos.",
    pregunta: "¿Se determinan procesos del SGI y su interacción?"
  },
  {
    codigo: "9001-39001-3810-5.1",
    capitulo: "5",
    tituloCapitulo: "5. Liderazgo",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Liderazgo y compromiso del SGI.",
    pregunta: "¿La dirección demuestra liderazgo y compromiso con el SGI?"
  },
  {
    codigo: "9001-39001-3810-5.2",
    capitulo: "5",
    tituloCapitulo: "5. Liderazgo",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Política del SGI establecida y comunicada.",
    pregunta: "¿La política SGI está disponible y comunicada?"
  },
  {
    codigo: "9001-39001-3810-5.3",
    capitulo: "5",
    tituloCapitulo: "5. Liderazgo",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Roles, responsabilidades y autoridades del SGI.",
    pregunta: "¿Se asignan roles, responsabilidades y autoridades del SGI?"
  },
  {
    codigo: "9001-6.1-39001-6.2",
    capitulo: "6",
    tituloCapitulo: "6. Planificación",
    normas: ["ISO 9001", "ISO 39001"],
    descripcion: "Acciones para abordar riesgos y oportunidades.",
    pregunta: "¿Se abordan riesgos y oportunidades en el SGI?"
  },
  {
    codigo: "9001-6.2-39001-6.4",
    capitulo: "6",
    tituloCapitulo: "6. Planificación",
    normas: ["ISO 9001", "ISO 39001"],
    descripcion: "Objetivos del SGI y planificación para lograrlos.",
    pregunta: "¿Se establecen objetivos SGI medibles y se planifica su logro?"
  },
  {
    codigo: "9001-6.3",
    capitulo: "6",
    tituloCapitulo: "6. Planificación",
    normas: ["ISO 9001"],
    descripcion: "Gestión de los cambios relevantes.",
    pregunta: "¿Se planifican y controlan cambios relevantes?"
  },
  {
    codigo: "39001-6.3-3810-6.3",
    capitulo: "6",
    tituloCapitulo: "6. Planificación",
    normas: ["ISO 39001", "IRAM 3810"],
    descripcion: "Factores de desempeño de Seguridad Vial (SV).",
    pregunta: "¿Se determinan y gestionan factores de desempeño de seguridad vial?"
  },
  {
    codigo: "9001-7.1-39001-7.2-3810-7.1",
    capitulo: "7",
    tituloCapitulo: "7. Apoyo y Recursos",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Recursos adecuados para el SGI.",
    pregunta: "¿Se determinan y proporcionan recursos para el SGI?"
  },
  {
    codigo: "9001-7.2-39001-7.3-3810-7.2",
    capitulo: "7",
    tituloCapitulo: "7. Apoyo y Recursos",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Competencia y formación del personal.",
    pregunta: "¿Se asegura competencia del personal y se conserva evidencia?"
  },
  {
    codigo: "9001-7.3-39001-7.4-3810-7.3",
    capitulo: "7",
    tituloCapitulo: "7. Apoyo y Recursos",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Conciencia sobre la política y objetivos del SGI.",
    pregunta: "¿El personal toma conciencia de política, objetivos y su contribución?"
  },
  {
    codigo: "9001-7.4-39001-7.5-3810-7.4",
    capitulo: "7",
    tituloCapitulo: "7. Apoyo y Recursos",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Comunicación interna y externa del SGI.",
    pregunta: "¿Existe comunicación interna/externa del SGI definida?"
  },
  {
    codigo: "9001-7.5-39001-7.6-3810-7.6",
    capitulo: "7",
    tituloCapitulo: "7. Apoyo y Recursos",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Control de la información documentada.",
    pregunta: "¿Se controla la información documentada?"
  },
  {
    codigo: "9001-8.1-39001-8.1-3810-8.1",
    capitulo: "8",
    tituloCapitulo: "8. Operación",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Planificación y control operacional.",
    pregunta: "¿Se planifica y controla la operación (incluye criterios y controles)?"
  },
  {
    codigo: "9001-8.2-3810-8.2",
    capitulo: "8",
    tituloCapitulo: "8. Operación",
    normas: ["ISO 9001", "IRAM 3810"],
    descripcion: "Determinación de requisitos para productos y servicios.",
    pregunta: "¿Se determinan requisitos del servicio antes de su provisión?"
  },
  {
    codigo: "39001-8.2",
    capitulo: "8",
    tituloCapitulo: "8. Operación",
    normas: ["ISO 39001"],
    descripcion: "Preparación y respuesta ante emergencias.",
    pregunta: "¿Se implementan controles operacionales y respuesta ante emergencias viales?"
  },
  {
    codigo: "9001-8.4-3810-8.4",
    capitulo: "8",
    tituloCapitulo: "8. Operación",
    normas: ["ISO 9001", "IRAM 3810"],
    descripcion: "Control de los procesos, productos y servicios suministrados externamente.",
    pregunta: "¿Se controla a proveedores externos y servicios tercerizados?"
  },
  {
    codigo: "9001-8.5-3810-8.5",
    capitulo: "8",
    tituloCapitulo: "8. Operación",
    normas: ["ISO 9001", "IRAM 3810"],
    descripcion: "Producción y provisión del servicio.",
    pregunta: "¿Se controlan procesos de prestación del servicio?"
  },
  {
    codigo: "9001-8.7-3810-8.7",
    capitulo: "8",
    tituloCapitulo: "8. Operación",
    normas: ["ISO 9001", "IRAM 3810"],
    descripcion: "Control de salidas no conformes.",
    pregunta: "¿Se controlan salidas no conformes?"
  },
  {
    codigo: "9001-39001-9.1-3810-9.1",
    capitulo: "9",
    tituloCapitulo: "9. Evaluación del Desempeño",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Seguimiento, medición, análisis y evaluación del SGI.",
    pregunta: "¿Se hace seguimiento, medición, análisis y evaluación?"
  },
  {
    codigo: "39001-9.2-3810-9.2",
    capitulo: "9",
    tituloCapitulo: "9. Evaluación del Desempeño",
    normas: ["ISO 39001", "IRAM 3810"],
    descripcion: "Investigación de siniestros e incidentes viales.",
    pregunta: "¿Se investigan siniestros e incidentes viales?"
  },
  {
    codigo: "9001-9.2-39001-9.3-3810-5.10",
    capitulo: "9",
    tituloCapitulo: "9. Evaluación del Desempeño",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Auditoría interna del SGI.",
    pregunta: "¿Se audita el SGI internamente según un programa establecido?"
  },
  {
    codigo: "9001-9.3-39001-9.4-3810-4.2",
    capitulo: "9",
    tituloCapitulo: "9. Evaluación del Desempeño",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Revisión por la dirección.",
    pregunta: "¿Se hace revisión por la dirección con entradas/salidas claras?"
  },
  {
    codigo: "9001-10.2-39001-10.1-3810-10.1",
    capitulo: "10",
    tituloCapitulo: "10. Mejora",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Gestión de no conformidades y acciones correctivas.",
    pregunta: "¿Se gestionan no conformidades y se implementan acciones correctivas?"
  },
  {
    codigo: "9001-10.3-39001-10.2-3810-10.2",
    capitulo: "10",
    tituloCapitulo: "10. Mejora",
    normas: ["ISO 9001", "ISO 39001", "IRAM 3810"],
    descripcion: "Mejora continua del SGI.",
    pregunta: "¿El SGI impulsa la mejora continua?"
  }
];

export const crearEvaluacionesVacias = () => {
  const map = {};
  REQUISITOS_NORMATIVOS.forEach(req => {
    map[req.codigo] = {
      resultado: "No Requiere",
      evidencia: "",
      detalle: "",
      oportunidad: ""
    };
  });
  return map;
};

export const INITIAL_PROGRAMA_2026 = {
  year: '2026',
  objetivo: 'Verificar la adecuada implementación y desempeño del Sistema de Gestión Integrado de AUBASA conforme los requisitos de las normas ISO 9001, ISO 39001 e IRAM 3810, a fin de validar el ciclo de mejora y en preparación para la auditoría de seguimiento a cargo de IRAM.\nIdentificar Oportunidades de Mejora, Observaciones y No Conformidades.',
  alcance: 'Se auditan los procesos y actividades de las Gerencias de Operaciones, Gerencia Comercial, Jefatura del CCM, Jefatura de Asistencia Vial, Taller Mecánico (Mantenimiento) y los procesos de soporte de la empresa, de acuerdo con el alcance definido en el Ap. 3.0 del Manual de Gestión.',
  criterios: 'La auditoría interna se realizará considerando como criterios la norma IRAM-ISO 9001:2015, IRAM-ISO 39001:2015, IRAM 3810, los procedimientos internos del Sistema de Gestión Integrado (SGI) de AUBASA, y los requisitos legales y reglamentarios aplicables.',
  firmaJefeSGI: '',
  nombreJefeSGI: 'Sergio Montes',
  firmaGerenteGeneral: '',
  nombreGerenteGeneral: '',
  sectores: [
    {
      id: '1', ps: '1', sector: 'Gerencia de Recursos Humanos', fecha: '25/03/26 -- 10:00/13:30 hs',
      documentos: 'Manual de Gestión; PAU/02; PAU/03; PAU/04; PAU/05; PAU/07; PAU/08; ITAU/04/05.',
      planSectorial: {
        responsable: 'Gerente de RRHH', auditor: 'Equipo Auditor SGI',
        firmaAuditor: '', nombreAuditor: 'Sergio Montes',
        procesos: [
          { proceso: 'Competencia, Formación y Toma de Conciencia', req9001: '7.1.2 / 7.2 / 7.3', req39001: '7.2 / 7.3 / 7.4', docs: 'PAU/03; Perfiles de Puesto; Plan Anual de Capacitación', participantes: 'Equipo de RRHH' }
        ]
      }
    },
    {
      id: '2', ps: '2', sector: 'Gerencia de Comercial', fecha: '26/03/26 -- 09:30/13:00 hs',
      documentos: 'Manual de Gestión; PAU/02; PAU/06; PAU/08; Procedimientos de Atención al Usuario y Peaje.',
      planSectorial: {
        responsable: 'Mariano', auditor: 'Sergio Montes / Natalia',
        firmaAuditor: '', nombreAuditor: 'Sergio Montes',
        procesos: [
          { proceso: 'Atención al Usuario y Gestión de Reclamos', req9001: '8.2 / 8.5 / 9.1.2', req39001: '7.5 / 8.1', docs: 'Manual de Gestión; PAU/06; Registros de Reclamos y Encuestas', participantes: 'Mariano, Estela, Cristian, Alberto' }
        ]
      }
    },
    {
      id: '3', ps: '3', sector: 'Centro de Control y Monitoreo', fecha: '27/03/26 -- 10:00/14:00 hs',
      documentos: 'Manual de Gestión; PAU/05; PAU/08; Protocolos de Emergencia e Investigación de Siniestros.',
      planSectorial: {
        responsable: 'Jefe de CCM', auditor: 'Equipo Auditor SGI',
        firmaAuditor: '', nombreAuditor: 'Sergio Montes',
        procesos: [
          { proceso: 'Monitoreo, Gestión de Incidentes y Siniestros Viales', req9001: '8.1 / 8.5 / 9.1', req39001: '6.3 / 8.1 / 8.2 / 9.2', docs: 'PAU/05; Bitácora de Novedades; Informes de Siniestralidad', participantes: 'Jefatura y Operadores CCM' }
        ]
      }
    },
    {
      id: '4', ps: '4', sector: 'Asistencia Vial', fecha: '30/03/26 -- 09:30/13:30 hs',
      documentos: 'Manual de Gestión; PAU/05; IRAM 3810; Checklists de Móviles y Equipamiento.',
      planSectorial: {
        responsable: 'Jefe de Asistencia Vial', auditor: 'Equipo Auditor SGI',
        firmaAuditor: '', nombreAuditor: 'Sergio Montes',
        procesos: [
          { proceso: 'Operación de Móviles de Seguridad Vial y Auxilio', req9001: '7.1.3 / 8.1 / 8.5', req39001: '6.3 / 8.1 / 8.2', docs: 'Checklists diarios de flota; Planillas de asistencia en ruta', participantes: 'Jefatura y Supervisores AV' }
        ]
      }
    },
    {
      id: '5', ps: '5', sector: 'Taller Mecánico (Gerencia de Mantenimiento)', fecha: '31/03/26 -- 09:30/13:00 hs',
      documentos: 'Manual de Gestión; Plan de Mantenimiento Preventivo y Correctivo; IRAM 3810.',
      planSectorial: {
        responsable: 'Responsable de Taller', auditor: 'Equipo Auditor SGI',
        firmaAuditor: '', nombreAuditor: 'Sergio Montes',
        procesos: [
          { proceso: 'Mantenimiento Preventivo y Correctivo de Flota', req9001: '7.1.3 / 8.1', req39001: '6.3 / 8.1 (IRAM 3810)', docs: 'Órdenes de Trabajo; Historial de Mantenimiento de Unidades', participantes: 'Jefe de Taller y Personal Técnico' }
        ]
      }
    }
  ]
};

export const INITIAL_INFORMES = [
  {
    id: 'audit-comercial-2025',
    codigoInforme: 'PAU/07-A4-001',
    sector: 'Gerencia de Comercial',
    organizacion: 'Autopistas de Buenos Aires S.A. - AUBASA',
    anio: 2025,
    tipo_auditoria: 'Interna del SGI (ISO 9001 / ISO 39001 / IRAM 3810)',
    fechas_auditoria: '2025-06-04',
    lugar: 'Samborombón',
    estado: 'Cerrada',
    auditor_responsable: 'Sergio Montes',
    auditor_2: 'Natalia',
    auditor_3: '',
    experto_tecnico: '',
    veedores: '',
    personas_auditadas: 'Mariano, Estela, Cristian, Alberto',
    conclusiones: 'Se verificó el compromiso del equipo de la Gerencia Comercial en la estación de peaje Samborombón. La documentación operativa se encuentra disponible y el personal conoce la Política del SGI. Se identificaron oportunidades de mejora y una observación documental para fortalecer el seguimiento.',
    firmaAuditor: '',
    nombreFirmaAuditor: 'Sergio Montes',
    firmaResponsableSector: '',
    nombreFirmaResponsable: 'Mariano (Gerencia Comercial)',
    capitulosGuardados: { '4': '04/06/2025', '5': '04/06/2025', '6': '04/06/2025', '7': '04/06/2025', '8': '04/06/2025', '9': '04/06/2025', '10': '04/06/2025' },
    fortalezas: [
      'Compromiso activo y buena predisposición del personal auditado en estación Samborombón durante el relevamiento.',
      'Adecuado conocimiento de los canales de atención al usuario y gestión primaria de reclamos en vía.'
    ],
    oportunidades: [
      'Estandarizar el tablero digital de seguimiento de reclamos por estación para agilizar el análisis mensual de tendencias.',
      'Reforzar la cartelería informativa del SGI en las áreas comunes del personal de peaje.'
    ],
    evaluaciones: (() => {
      const ev = crearEvaluacionesVacias();
      ev['9001-39001-3810-4.1'] = { resultado: 'Cumple', evidencia: 'Se verificó matriz FODA y análisis de contexto actualizado del sector Comercial.', detalle: '', oportunidad: '' };
      ev['9001-39001-3810-4.2'] = { resultado: 'Cumple', evidencia: 'Partes interesadas identificadas (Usuarios, Órgano de Control, Sindicato).', detalle: '', oportunidad: '' };
      ev['9001-39001-3810-5.2'] = { resultado: 'Cumple', evidencia: 'Política del SGI exhibida en estación Samborombón y conocida por los entrevistados.', detalle: '', oportunidad: '' };
      ev['9001-6.1-39001-6.2'] = { resultado: 'Cumple', evidencia: 'Matriz de riesgos y oportunidades del proceso comercial revisada para el período vigente.', detalle: '', oportunidad: '' };
      ev['9001-7.2-39001-7.3-3810-7.2'] = { resultado: 'Observación (OB)', evidencia: 'Se revisaron legajos y registros de capacitación del personal de estación.', detalle: 'Se observó que 2 registros de inducción operativa recientes aún se encontraban pendientes de carga digital en la matriz sectorial.', oportunidad: 'Vincular automáticamente la firma del perfil y capacitación con el módulo de Competencia y Formación.' };
      ev['9001-7.5-39001-7.6-3810-7.6'] = { resultado: 'Cumple', evidencia: 'Procedimientos vigentes disponibles en versión controlada.', detalle: '', oportunidad: '' };
      ev['9001-8.2-3810-8.2'] = { resultado: 'Cumple', evidencia: 'Requisitos de atención al usuario y libro de quejas/reclamos verificados en peaje.', detalle: '', oportunidad: '' };
      ev['9001-8.5-3810-8.5'] = { resultado: 'Cumple', evidencia: 'Control de operación de cobro, gestión de vías y atención en estación Samborombón.', detalle: '', oportunidad: '' };
      ev['9001-39001-9.1-3810-9.1'] = { resultado: 'Cumple', evidencia: 'Indicadores de tiempos de espera, reclamos y tránsito monitoreados mensualmente.', detalle: '', oportunidad: '' };
      return ev;
    })()
  },
  {
    id: 'audit-sgi-2026',
    codigoInforme: 'PAU/07-A4-002',
    sector: 'Sistema de Gestión Integrado',
    organizacion: 'Autopistas de Buenos Aires S.A. - AUBASA',
    anio: 2026,
    tipo_auditoria: 'Seguimiento N° 1 / Revisión Integral SGI',
    fechas_auditoria: '2026-03-25',
    lugar: 'Sede Central La Plata / Estaciones Operativas',
    estado: 'En Curso',
    auditor_responsable: 'Equipo Auditor SGI',
    auditor_2: '',
    auditor_3: '',
    experto_tecnico: '',
    veedores: '',
    personas_auditadas: 'Representantes de Sectores SGI, Operaciones, CCM, Asistencia Vial y Soporte',
    conclusiones: 'Relevamiento integral conforme a los criterios de ISO 9001:2015, ISO 39001:2012 e IRAM 3810 en preparación para la auditoría externa de seguimiento.',
    firmaAuditor: '',
    nombreFirmaAuditor: 'Sergio Montes',
    firmaResponsableSector: '',
    nombreFirmaResponsable: '',
    capitulosGuardados: { '4': '25/03/2026', '6': '25/03/2026', '9': '25/03/2026' },
    fortalezas: [
      'Implementación del sistema digital integrado (SystemSGI) para la trazabilidad de riesgos, indicadores, control documental y auditorías.',
      'Actualización y digitalización de perfiles de puesto con firma electrónica en el módulo de Competencia y Formación.'
    ],
    oportunidades: [
      'Continuar integrando los tableros de seguimiento de hallazgos de auditorías internas y externas en tiempo real.'
    ],
    evaluaciones: (() => {
      const ev = crearEvaluacionesVacias();
      ev['9001-39001-3810-4.1'] = { resultado: 'Cumple', evidencia: 'Contexto organizacional y matriz FODA documentados en el módulo Contexto de la Organización.', detalle: '', oportunidad: '' };
      ev['9001-39001-3810-4.3'] = { resultado: 'Cumple', evidencia: 'Alcance definido en el Manual de Gestión Ap. 3.0.', detalle: '', oportunidad: '' };
      ev['9001-6.1-39001-6.2'] = { resultado: 'Cumple', evidencia: 'Matrices de Riesgos y Oportunidades actualizadas por sector.', detalle: '', oportunidad: '' };
      ev['9001-9.2-39001-9.3-3810-5.10'] = { resultado: 'Cumple', evidencia: 'Programa Anual PAU/07-A2 y Planes Sectoriales PAU/07-A3 planificados y en ejecución.', detalle: '', oportunidad: '' };
      ev['9001-9.3-39001-9.4-3810-4.2'] = { resultado: 'Cumple', evidencia: 'Informe de Revisión por la Dirección cargado y disponible.', detalle: '', oportunidad: '' };
      return ev;
    })()
  }
];

// Sincronización con Supabase para que todos los usuarios vean los PDFs/Informes guardados por SGI
export async function cargarDatosAuditoriasCloud() {
  try {
    const { data, error } = await supabase
      .from('sgi_management_reviews')
      .select('*')
      .like('id', 'AUDIT_%');
    if (error || !data) return null;

    const progRow = data.find(r => r.id === 'AUDIT_PROGRAMA_2026');
    const informesRows = data
      .filter(r => String(r.id).startsWith('AUDIT_INF_'))
      .map(r => r.data)
      .filter(Boolean);

    return {
      programa: progRow?.data || null,
      informes: informesRows.length > 0 ? informesRows : null
    };
  } catch (e) {
    console.warn('Fallback local para auditorías:', e);
    return null;
  }
}

export async function guardarInformeAuditoriaCloud(informe) {
  if (!informe?.id) return;
  try {
    await supabase
      .from('sgi_management_reviews')
      .upsert({
        id: `AUDIT_INF_${informe.id}`,
        year: String(informe.anio || '2026'),
        status: informe.estado || 'En Curso',
        date: informe.fechas_auditoria || new Date().toISOString().split('T')[0],
        participants: informe.sector || 'SGI',
        data: informe,
        updated_at: new Date().toISOString()
      });
  } catch (e) {
    console.warn('Guardado local mantenido, error sincronizando nube:', e);
  }
}

export async function eliminarInformeAuditoriaCloud(informeId) {
  try {
    await supabase
      .from('sgi_management_reviews')
      .delete()
      .eq('id', `AUDIT_INF_${informeId}`);
  } catch (e) {
    console.warn('Error eliminando en nube:', e);
  }
}

export async function guardarProgramaAuditoriaCloud(programa) {
  try {
    await supabase
      .from('sgi_management_reviews')
      .upsert({
        id: 'AUDIT_PROGRAMA_2026',
        year: String(programa.year || '2026'),
        status: 'Vigente',
        date: new Date().toISOString().split('T')[0],
        participants: 'Programa Anual SGI',
        data: programa,
        updated_at: new Date().toISOString()
      });
  } catch (e) {
    console.warn('Error sincronizando programa en nube:', e);
  }
}

export function calcularResumenInforme(informe) {
  let cumple = 0;
  let ob = 0;
  let nc = 0;
  let noRequiere = 0;
  const listaOB = [];
  const listaNC = [];
  const listaOMReq = [];
  const porCapitulo = {};

  CAPITULOS_ISO.forEach(c => {
    porCapitulo[c.id] = { total: 0, evaluados: 0, hallazgos: 0 };
  });

  REQUISITOS_NORMATIVOS.forEach(req => {
    const ev = informe.evaluaciones?.[req.codigo] || { resultado: 'No Requiere' };
    if (porCapitulo[req.capitulo]) {
      porCapitulo[req.capitulo].total++;
      if (ev.resultado !== 'No Requiere') porCapitulo[req.capitulo].evaluados++;
      if (ev.resultado === 'Observación (OB)' || ev.resultado === 'No Conformidad (NC)') {
        porCapitulo[req.capitulo].hallazgos++;
      }
    }

    if (ev.resultado === 'Cumple') cumple++;
    else if (ev.resultado === 'Observación (OB)') {
      ob++;
      listaOB.push({ codigo: req.codigo, descripcion: req.descripcion, ...ev });
    } else if (ev.resultado === 'No Conformidad (NC)') {
      nc++;
      listaNC.push({ codigo: req.codigo, descripcion: req.descripcion, ...ev });
    } else {
      noRequiere++;
    }
    if (ev.oportunidad && ev.oportunidad.trim()) {
      listaOMReq.push({ codigo: req.codigo, descripcion: req.descripcion, texto: ev.oportunidad.trim() });
    }
  });

  const evaluados = cumple + ob + nc;
  const totalRequisitos = REQUISITOS_NORMATIVOS.length;
  const porcentajeAvance = Math.round((evaluados / totalRequisitos) * 100);

  return {
    cumple,
    ob,
    nc,
    noRequiere,
    evaluados,
    totalRequisitos,
    porcentajeAvance,
    fortalezasCount: (informe.fortalezas || []).filter(f => f.trim()).length,
    oportunidadesCount: (informe.oportunidades || []).filter(o => o.trim()).length + listaOMReq.length,
    listaOB,
    listaNC,
    listaOMReq,
    porCapitulo
  };
}

export function generarPDFInformeAuditoria(informe) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const resumen = calcularResumenInforme(informe);

  const tealDark = [0, 109, 119];
  const slateDark = [15, 23, 42];

  // Encabezado Institucional AUBASA / PAU-07 A4
  doc.setFillColor(...tealDark);
  doc.rect(14, 12, 182, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PLAN E INFORME DE AUDITORÍA INTERNA DEL SGI', 105, 20, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`AUBASA — ISO 9001 | ISO 39001 | IRAM 3810   •   Código: ${informe.codigoInforme || 'PAU/07-A4'}`, 105, 28, { align: 'center' });

  // 1. Información General
  autoTable(doc, {
    startY: 38,
    head: [['1. INFORMACIÓN GENERAL DE LA AUDITORÍA', '']],
    body: [
      ['Organización', informe.organizacion || 'Autopistas de Buenos Aires S.A. - AUBASA'],
      ['Sector Auditado', informe.sector || '-'],
      ['Año / Tipo de Auditoría', `${informe.anio || ''} — ${informe.tipo_auditoria || 'Interna SGI'}`],
      ['Fecha(s) de Auditoría', informe.fechas_auditoria || '-'],
      ['Lugar / Sede', informe.lugar || '-'],
      ['Estado del Informe', informe.estado || 'En Curso']
    ],
    theme: 'grid',
    headStyles: { fillColor: tealDark, textColor: 255, fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, fillColor: [241, 245, 249] } }
  });

  // 2. Equipo Auditor y Personal Contactado
  const auditores = [
    informe.auditor_responsable ? `${informe.auditor_responsable} (Auditor Responsable)` : '',
    informe.auditor_2,
    informe.auditor_3
  ].filter(Boolean).join(' | ');

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    head: [['2. EQUIPO AUDITOR Y PERSONAL CONTACTADO', '']],
    body: [
      ['Equipo Auditor', auditores || '-'],
      ['Experto Técnico / Veedores', [informe.experto_tecnico, informe.veedores].filter(Boolean).join(' / ') || 'No aplica'],
      ['Personas Auditadas / Contactadas', informe.personas_auditadas || '-'],
      ['Resumen de Evaluación', `Cumple: ${resumen.cumple}  |  Observaciones (OB): ${resumen.ob}  |  No Conformidades (NC): ${resumen.nc}  |  Fortalezas: ${resumen.fortalezasCount}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: tealDark, textColor: 255, fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, fillColor: [241, 245, 249] } }
  });

  // 3. Requisitos Evaluados
  const reqRows = REQUISITOS_NORMATIVOS
    .map(req => {
      const ev = informe.evaluaciones?.[req.codigo] || { resultado: 'No Requiere' };
      return { req, ev };
    })
    .filter(item => item.ev.resultado !== 'No Requiere' || item.ev.evidencia || item.ev.detalle)
    .map(({ req, ev }) => [
      req.codigo,
      req.descripcion,
      ev.resultado,
      [ev.evidencia, ev.detalle ? `Hallazgo: ${ev.detalle}` : '', ev.oportunidad ? `OM: ${ev.oportunidad}` : ''].filter(Boolean).join('\n') || '-'
    ]);

  if (reqRows.length > 0) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      head: [['Código', 'Requisito Normativo', 'Calificación', 'Evidencia Objetiva / Detalle']],
      body: reqRows,
      theme: 'grid',
      headStyles: { fillColor: tealDark, textColor: 255, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.2, valign: 'top' },
      columnStyles: {
        0: { cellWidth: 34, fontStyle: 'bold' },
        1: { cellWidth: 46 },
        2: { cellWidth: 28, fontStyle: 'bold' },
        3: { cellWidth: 74 }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const val = data.cell.raw;
          if (val === 'No Conformidad (NC)') data.cell.styles.textColor = [220, 38, 38];
          else if (val === 'Observación (OB)') data.cell.styles.textColor = [217, 119, 6];
          else if (val === 'Cumple') data.cell.styles.textColor = [22, 163, 74];
        }
      }
    });
  }

  // 4. Hallazgos Categorizados (Fortalezas, Oportunidades, OB, NC)
  const hallazgosBody = [];
  (informe.fortalezas || []).filter(f => f.trim()).forEach(f => {
    hallazgosBody.push(['FORTALEZA (FO)', 'General', f]);
  });
  (informe.oportunidades || []).filter(o => o.trim()).forEach(o => {
    hallazgosBody.push(['OPORTUNIDAD DE MEJORA (OM)', 'General', o]);
  });
  resumen.listaOMReq.forEach(om => {
    hallazgosBody.push(['OPORTUNIDAD DE MEJORA (OM)', om.codigo, om.texto]);
  });
  resumen.listaOB.forEach(item => {
    hallazgosBody.push(['OBSERVACIÓN (OB)', item.codigo, `${item.detalle || ''}${item.evidencia ? ` (Evidencia: ${item.evidencia})` : ''}`]);
  });
  resumen.listaNC.forEach(item => {
    hallazgosBody.push(['NO CONFORMIDAD (NC)', item.codigo, `${item.detalle || ''}${item.evidencia ? ` (Evidencia: ${item.evidencia})` : ''}`]);
  });

  if (hallazgosBody.length > 0) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      head: [['Categoría de Hallazgo', 'Cláusula / Ref.', 'Descripción del Hallazgo']],
      body: hallazgosBody,
      theme: 'grid',
      headStyles: { fillColor: slateDark, textColor: 255, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 35, fontStyle: 'bold' },
        2: { cellWidth: 102 }
      }
    });
  }

  // Conclusiones y Firmas
  let finalY = (doc.lastAutoTable?.finalY || 120) + 10;
  if (finalY > 235) {
    doc.addPage();
    finalY = 20;
  }

  if (informe.conclusiones) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...tealDark);
    doc.text('CONCLUSIONES DE LA AUDITORÍA:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const splitConc = doc.splitTextToSize(informe.conclusiones, 180);
    doc.text(splitConc, 14, finalY + 5);
    finalY += 8 + splitConc.length * 4.5;
  }

  if (finalY > 240) {
    doc.addPage();
    finalY = 30;
  }

  const sigY = finalY + 12;
  if (informe.firmaAuditor) {
    try {
      doc.addImage(informe.firmaAuditor, 'PNG', 32, sigY - 10, 45, 18);
    } catch (_) {
      // ignore invalid image format
    }
  }
  if (informe.firmaResponsableSector) {
    try {
      doc.addImage(informe.firmaResponsableSector, 'PNG', 128, sigY - 10, 45, 18);
    } catch (_) {
      // ignore invalid image format
    }
  }

  doc.setDrawColor(100, 116, 139);
  doc.line(25, sigY + 12, 85, sigY + 12);
  doc.line(120, sigY + 12, 180, sigY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(informe.nombreFirmaAuditor || informe.auditor_responsable || 'Firma Auditor', 55, sigY + 17, { align: 'center' });
  doc.text(informe.nombreFirmaResponsable || 'Responsable Sector Auditado', 150, sigY + 17, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('POR EQUIPO AUDITOR SGI', 55, sigY + 21, { align: 'center' });
  doc.text('POR SECTOR AUDITADO', 150, sigY + 21, { align: 'center' });

  const safeSector = (informe.sector || 'Sector').replace(/\s+/g, '_');
  doc.save(`Informe_Auditoria_${safeSector}_${informe.fechas_auditoria || informe.anio}.pdf`);
}

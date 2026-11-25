/**
 * Catálogo Oficial y Unificado de Partes Interesadas del SGI AUBASA
 * Conforme a ISO 9001:2015 (Cláusula 4.2), ISO 39001:2015 (Cláusula 4.2),
 * PAU/01 (Análisis de Contexto) y PAU/02 Anexo 3.2.
 */

export const PARTES_INTERESADAS_CATALOGO = [
  {
    id: 'PI_01',
    nombre: 'Usuarios externos',
    tipo: 'Externa',
    necesidadExpectativa: 'Circulación segura y fluida, asistencia ágil ante contingencias, vías de cobro dinámicas y tarifas claras.',
    requisitoPertinente: 'Garantizar la disponibilidad de calzada, tiempos de respuesta de asistencia vial y calidad de atención.',
    aplicaISO: 'Ambas (9001 y 39001)',
    procesoImpactado: 'Operaciones / Comercial / Asistencia Vial / CCM',
    requisitosSGI: 'Sí',
    riesgosBase: [
      {
        riesgo: 'Interrupción o demoras severas en la circulación vial por siniestros viales o congestión extraordinaria.',
        factorCritico: 'Fluidez y Seguridad Vial en Traza',
        proceso: 'Asistencia Vial / Operaciones',
        probabilidad: 4,
        impacto: 3,
        planAccion: 'Protocolo de despeje rápido con móviles de auxilio, señalización preventiva y mensajes variables en paneles.',
        responsable: 'Gerencia de Prevención y Seguridad Vial'
      },
      {
        riesgo: 'Fallas o indisponibilidad en vías de cobro dinámico (Telepase) provocando demoras en estaciones de peaje.',
        factorCritico: 'Tecnología en Estaciones de Peaje',
        proceso: 'Operaciones / Sistemas',
        probabilidad: 3,
        impacto: 3,
        planAccion: 'Mantenimiento preventivo de antenas y barreras, contingencia de pase manual y soporte en sitio.',
        responsable: 'Gerencia de Operaciones / Sistemas'
      }
    ]
  },
  {
    id: 'PI_02',
    nombre: 'Proveedores',
    tipo: 'Externa',
    necesidadExpectativa: 'Claridad en las especificaciones técnicas, cumplimiento de plazos de pago y transparencia contractual.',
    requisitoPertinente: 'Asegurar el cumplimiento de los contratos de suministro, obras viales y servicios de mantenimiento.',
    aplicaISO: 'Ambas (9001 y 39001)',
    procesoImpactado: 'Compras / Mantenimiento / Administración',
    requisitosSGI: 'Sí',
    riesgosBase: [
      {
        riesgo: 'Incumplimiento de plazos de entrega de insumos críticos para mantenimiento vial o repuestos de flota.',
        factorCritico: 'Cadena de Suministro y Repuestos',
        proceso: 'Compras / Mantenimiento',
        probabilidad: 3,
        impacto: 3,
        planAccion: 'Evaluación y homologación periódica de proveedores; stock de seguridad de repuestos críticos.',
        responsable: 'Gerencia de Compras'
      }
    ]
  },
  {
    id: 'PI_03',
    nombre: 'Personal',
    tipo: 'Interna',
    necesidadExpectativa: 'Seguridad y salud en el trabajo, estabilidad laboral, elementos de protección y plan de formación continua.',
    requisitoPertinente: 'Condiciones de trabajo seguras, cumplimiento de CCT, ergonomía en cabinas y capacitación por puesto.',
    aplicaISO: 'Ambas (9001 y 39001)',
    procesoImpactado: 'Recursos Humanos / SST / Todas las Gerencias',
    requisitosSGI: 'Sí',
    riesgosBase: [
      {
        riesgo: 'Accidentes viales o laborales del personal que opera en calzada, cabinas de peaje o talleres.',
        factorCritico: 'Seguridad y Salud en el Trabajo',
        proceso: 'Recursos Humanos / SST',
        probabilidad: 3,
        impacto: 4,
        planAccion: 'Uso obligatorio de EPP de alta visibilidad, capacitaciones de manejo defensivo y mantenimiento de señalética.',
        responsable: 'Jefatura de Seguridad y Salud Ocupacional'
      }
    ]
  },
  {
    id: 'PI_04',
    nombre: 'Alta Dirección',
    tipo: 'Interna',
    necesidadExpectativa: 'Sostenibilidad operativa y financiera, cumplimiento de la Política de Gestión Integrada y liderazgo eficaz.',
    requisitoPertinente: 'Alineación de objetivos estratégicos, revisión periódica del SGI y optimización de recursos asignados.',
    aplicaISO: 'Ambas (9001 y 39001)',
    procesoImpactado: 'Dirección / SGI / Finanzas',
    requisitosSGI: 'Sí',
    riesgosBase: [
      {
        riesgo: 'Desvío en el cumplimiento de los Objetivos y Metas del SGI por variaciones presupuestarias o de contexto.',
        factorCritico: 'Alineación Estratégica y Recursos',
        proceso: 'Dirección / SGI',
        probabilidad: 2,
        impacto: 4,
        planAccion: 'Revisión trimestral de indicadores de gestión y ajuste dinámico del plan de inversiones.',
        responsable: 'Gerencia General / SGI'
      }
    ]
  },
  {
    id: 'PI_05',
    nombre: 'Autoridad de Control (Ministerio de Infraestructura PBA)',
    tipo: 'Externa',
    necesidadExpectativa: 'Cumplimiento estricto del Contrato de Concesión, mantenimiento del estado de las trazas y reporte transparente.',
    requisitoPertinente: 'Satisfacer los estándares de servicio contractuales, obras comprometidas y cuadros tarifarios vigentes.',
    aplicaISO: 'Ambas (9001 y 39001)',
    procesoImpactado: 'Legales / Operaciones / Mantenimiento / Comercial',
    requisitosSGI: 'Sí',
    riesgosBase: [
      {
        riesgo: 'Aplicación de penalidades o multas por desvíos en el índice de estado de calzada o demora en informes reglamentarios.',
        factorCritico: 'Cumplimiento Contractual y Regulatorio',
        proceso: 'Asuntos Legales / Mantenimiento',
        probabilidad: 2,
        impacto: 5,
        planAccion: 'Monitoreo mensual de la Matriz Legal y seguimiento estricto del plan de obras e informes al MIYSP.',
        responsable: 'Gerencia de Asuntos Legales'
      }
    ]
  },
  {
    id: 'PI_06',
    nombre: 'Servicios de Atención de Contingencias (Bomberos / Ambulancias)',
    tipo: 'Externa',
    necesidadExpectativa: 'Comunicación inmediata, libre paso en peajes ante emergencias y accesibilidad expedita a la traza vial.',
    requisitoPertinente: 'Coordinación operativa en tiempo real con el Centro de Control y Monitoreo (CCM) y asistencia médica.',
    aplicaISO: 'ISO 39001',
    procesoImpactado: 'CCM / Asistencia Vial / Operaciones',
    requisitosSGI: 'Sí',
    riesgosBase: [
      {
        riesgo: 'Demoras en el acceso y respuesta a siniestros con víctimas por congestión o falta de radioenlace integrado.',
        factorCritico: 'Tiempo de Respuesta en Emergencias Viales',
        proceso: 'CCM / Asistencia Vial',
        probabilidad: 2,
        impacto: 5,
        planAccion: 'Protocolo de apertura de vías de emergencia en peajes y despacho coordinado desde CCM con el SAME/Bomberos.',
        responsable: 'Centro de Control y Monitoreo (CCM)'
      }
    ]
  },
  {
    id: 'PI_07',
    nombre: 'Fuerzas de Seguridad (Policía Vial)',
    tipo: 'Externa',
    necesidadExpectativa: 'Coordinación de operativos de control vehicular, balizamiento conjunto y prevención del delito en la traza.',
    requisitoPertinente: 'Disponibilidad de información, cámaras de seguridad del CCM y apoyo logístico en siniestros y cortes.',
    aplicaISO: 'ISO 39001',
    procesoImpactado: 'Seguridad Patrimonial / Asistencia Vial / CCM',
    requisitosSGI: 'Sí',
    riesgosBase: [
      {
        riesgo: 'Falta de cobertura o demora policial ante incidentes de seguridad patrimonial o cortes no autorizados en calzada.',
        factorCritico: 'Seguridad Pública y Patrimonial',
        proceso: 'Seguridad Patrimonial / CCM',
        probabilidad: 3,
        impacto: 4,
        planAccion: 'Mesas operativas periódicas con Policía de Seguridad Vial y enlaces directos de monitoreo desde CCM.',
        responsable: 'Jefatura de Seguridad Patrimonial'
      }
    ]
  },
  {
    id: 'PI_08',
    nombre: 'Municipios linderos / vecinos',
    tipo: 'Externa',
    necesidadExpectativa: 'Canalización armónica del tránsito en bajadas y distribuidores, cuidado ambiental y coordinación en eventos climáticos.',
    requisitoPertinente: 'Gestión coordinada de desagües pluviales, accesos urbanos e impactos viales comunitarios.',
    aplicaISO: 'Ambas (9001 y 39001)',
    procesoImpactado: 'Relaciones Institucionales / Mantenimiento',
    requisitosSGI: 'Sí',
    riesgosBase: [
      {
        riesgo: 'Anegamientos o conflictos por desagües pluviales compartidos con municipios durante lluvias torrenciales.',
        factorCritico: 'Impacto Ambiental y Desagües Pluviales',
        proceso: 'Mantenimiento / Relaciones Institucionales',
        probabilidad: 3,
        impacto: 3,
        planAccion: 'Mantenimiento preventivo estacional de alcantarillas y articulación con defensas civiles municipales.',
        responsable: 'Gerencia de Mantenimiento'
      }
    ]
  },
  {
    id: 'PI_09',
    nombre: 'ART',
    tipo: 'Externa',
    necesidadExpectativa: 'Baja tasa de siniestralidad laboral, cumplimiento de normas de higiene y seguridad, e investigación de incidentes.',
    requisitoPertinente: 'Presentación oportuna de relevamientos de riesgos laborales (RGR) y protocolos ergonómicos.',
    aplicaISO: 'ISO 9001',
    procesoImpactado: 'Recursos Humanos / SST',
    requisitosSGI: 'Sí',
    riesgosBase: [
      {
        riesgo: 'Observaciones o intimaciones por desvíos en plazos de presentación de exámenes periódicos o denuncias de accidentes.',
        factorCritico: 'Gestión de Riesgos de Trabajo',
        proceso: 'Recursos Humanos / SST',
        probabilidad: 2,
        impacto: 4,
        planAccion: 'Seguimiento sistemático de investigaciones de accidentes con metodología causa raíz y cronograma de exámenes.',
        responsable: 'Recursos Humanos'
      }
    ]
  },
  {
    id: 'PI_10',
    nombre: 'Organismo de Certificación (IRAM)',
    tipo: 'Externa',
    necesidadExpectativa: 'Evidencia sólida de madurez, mejora continua y cumplimiento riguroso de las normas ISO 9001 e ISO 39001.',
    requisitoPertinente: 'Ejecución del programa anual de auditorías internas, tratamiento eficaz de no conformidades y revisión por la dirección.',
    aplicaISO: 'Ambas (9001 y 39001)',
    procesoImpactado: 'SGI / Todas las Gerencias',
    requisitosSGI: 'Sí',
    riesgosBase: [
      {
        riesgo: 'Detección de No Conformidades Mayores en auditorías de seguimiento que pongan en riesgo la certificación.',
        factorCritico: 'Conformidad del Sistema de Gestión Integrado',
        proceso: 'SGI',
        probabilidad: 2,
        impacto: 5,
        planAccion: 'Auditorías internas cruzadas con checklist exhaustivo por capítulo ISO y cierre oportuno de planes de acción.',
        responsable: 'Responsable del SGI'
      }
    ]
  },
  {
    id: 'PI_11',
    nombre: 'Sindicato (SUTPA)',
    tipo: 'Externa',
    necesidadExpectativa: 'Cumplimiento irrestricto de las condiciones laborales acordadas, diálogo paritario y resguardo de la seguridad del trabajador.',
    requisitoPertinente: 'Respetar los convenios colectivos, higiene en lugares de trabajo y canales de consulta abiertos.',
    aplicaISO: 'ISO 9001',
    procesoImpactado: 'Recursos Humanos / Operaciones',
    requisitosSGI: 'Sí',
    riesgosBase: [
      {
        riesgo: 'Medidas de fuerza gremiales que originen apertura de barreras de peaje o cese de actividades operativas.',
        factorCritico: 'Relaciones Laborales y Clima Gremial',
        proceso: 'Recursos Humanos / Operaciones',
        probabilidad: 3,
        impacto: 4,
        planAccion: 'Comisiones mixtas de higiene y seguridad, mesa permanente de diálogo laboral y cumplimiento de acuerdos CCT.',
        responsable: 'Gerencia de Recursos Humanos'
      }
    ]
  },
  {
    id: 'PI_12',
    nombre: 'Medios de Comunicación',
    tipo: 'Externa',
    necesidadExpectativa: 'Información veraz, oportuna y oficial sobre el estado de las rutas, tarifas y contingencias viales.',
    requisitoPertinente: 'Canales oficiales de prensa habilitados, partes informativos rápidos y protocolos de vocería ante siniestros.',
    aplicaISO: 'ISO 39001',
    procesoImpactado: 'Relaciones Institucionales / Comercial',
    requisitosSGI: 'Sí',
    riesgosBase: [
      {
        riesgo: 'Información distorsionada o daño reputacional ante siniestros viales graves en la traza por falta de vocería ágil.',
        factorCritico: 'Comunicación Externa y Reputación Institucional',
        proceso: 'Relaciones Institucionales',
        probabilidad: 3,
        impacto: 3,
        planAccion: 'Protocolo de crisis con reportes inmediatos desde CCM y gacetillas verificadas a medios masivos y redes sociales.',
        responsable: 'Subgerencia de Relaciones Institucionales'
      }
    ]
  },
  {
    id: 'PI_13',
    nombre: 'Concesionarias Vecinas',
    tipo: 'Externa',
    necesidadExpectativa: 'Coordinación operativa en nudos de empalme, interoperabilidad en telepase y gestión de flujos de tránsito concurrentes.',
    requisitoPertinente: 'Comunicaciones fluidas en empalmes de la traza (ej. Au. 25 de Mayo / Au. Riccheri / Corredores Viales).',
    aplicaISO: 'ISO 39001',
    procesoImpactado: 'Operaciones / CCM / Comercial',
    requisitosSGI: 'Sí',
    riesgosBase: [
      {
        riesgo: 'Efecto embudo y colapso de tránsito en empalmes con concesiones vecinas por obras no comunicadas o siniestros conjuntos.',
        factorCritico: 'Interconexión Vial y Coordinación de Tránsito',
        proceso: 'CCM / Operaciones',
        probabilidad: 2,
        impacto: 4,
        planAccion: 'Canal de comunicación operativo directo entre salas de control y preaviso obligatorio de trabajos en calzada.',
        responsable: 'Centro de Control y Monitoreo (CCM)'
      }
    ]
  }
];

/**
 * Función que toma los items de sgi_contexto y los mapea/unifica
 * con el catálogo oficial de las 13 Partes Interesadas.
 */
export function unificarPartesInteresadasConRiesgos(itemsContexto = []) {
  return PARTES_INTERESADAS_CATALOGO.map(cat => {
    // Buscar riesgos cargados en la base de datos de contexto que coincidan con esta parte interesada
    const nombreLower = cat.nombre.toLowerCase();
    
    const riesgosEncontrados = (itemsContexto || []).filter(it => {
      const piTexto = String(it.partesInteresadas || '').toLowerCase();
      // Mapeo flexible para considerar variantes históricas
      if (piTexto.includes(nombreLower)) return true;
      if (cat.id === 'PI_01' && (piTexto.includes('usuario') || piTexto.includes('cliente'))) return true;
      if (cat.id === 'PI_02' && piTexto.includes('proveedor')) return true;
      if (cat.id === 'PI_03' && (piTexto.includes('personal') || piTexto.includes('empleado') || piTexto.includes('trabajador'))) return true;
      if (cat.id === 'PI_04' && (piTexto.includes('dirección') || piTexto.includes('direccion') || piTexto.includes('gerencia'))) return true;
      if (cat.id === 'PI_05' && (piTexto.includes('concedente') || piTexto.includes('control') || piTexto.includes('ministerio') || piTexto.includes('estado'))) return true;
      if (cat.id === 'PI_06' && (piTexto.includes('bombero') || piTexto.includes('ambulancia') || piTexto.includes('emergencia') || piTexto.includes('same'))) return true;
      if (cat.id === 'PI_07' && (piTexto.includes('polic') || piTexto.includes('seguridad vial') || piTexto.includes('fuerza'))) return true;
      if (cat.id === 'PI_08' && (piTexto.includes('municip') || piTexto.includes('comunidad') || piTexto.includes('lindero'))) return true;
      if (cat.id === 'PI_09' && piTexto.includes('art')) return true;
      if (cat.id === 'PI_10' && (piTexto.includes('iram') || piTexto.includes('certifica'))) return true;
      if (cat.id === 'PI_11' && (piTexto.includes('sindicat') || piTexto.includes('sutpa') || piTexto.includes('gremio'))) return true;
      if (cat.id === 'PI_12' && (piTexto.includes('medio') || piTexto.includes('prensa') || piTexto.includes('periodis'))) return true;
      if (cat.id === 'PI_13' && (piTexto.includes('vecina') || piTexto.includes('corredor') || piTexto.includes('ausol'))) return true;
      return false;
    }).map(it => ({
      id: it.id,
      riesgo: it.riesgo,
      factorCritico: it.factorCritico || it.factor || '',
      proceso: it.proceso || '',
      probabilidad: Number(it.probabilidad) || 1,
      impacto: Number(it.impacto) || 1,
      planAccion: it.planAccion || it.plan || '',
      responsable: it.responsable || '',
      esDinamico: true
    }));

    // Combinar los riesgos base con los dinámicos creados por el usuario
    const todosRiesgos = [...riesgosEncontrados];
    
    // Si no tiene riesgos dinámicos, mostrar los riesgos base del catálogo oficial
    if (todosRiesgos.length === 0 && cat.riesgosBase) {
      cat.riesgosBase.forEach((rb, idx) => {
        todosRiesgos.push({
          id: `${cat.id}_BASE_${idx+1}`,
          ...rb,
          esDinamico: false
        });
      });
    }

    return {
      ...cat,
      riesgos: todosRiesgos,
      totalRiesgos: todosRiesgos.length,
      riesgosAltos: todosRiesgos.filter(r => (r.probabilidad * r.impacto) >= 10).length
    };
  });
}

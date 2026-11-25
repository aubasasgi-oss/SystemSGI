import { supabase } from '../supabaseClient';

export const CAMBIO_SEEDED_WHATSAPP = {
  id: 'CAMBIO_2026_01',
  codigoDoc: 'PAU/04-A4',
  revision: '2',
  fechaEmisionDoc: '20.Feb.2026',
  fechaEvaluacion: '2026-03-27',
  areaProceso: 'Contact Center',
  responsableProceso: 'Jefatura de Peaje Dinámico (JPD)',
  descripcionCambio: 'Integración de un nuevo canal de WhatsApp con solución de bot integrada en la Plataforma Web de Atención al Usuario (WiseCX).',
  origen: {
    cambioResponsabilidades: false,
    auditorias: false,
    evaluacionDesempeno: false,
    incorporacionTics: true,
    cambioNecesidadesUsuario: true,
    analisisNoConformidades: true,
    cambiosContexto: false,
    servicioNoConforme: false,
  },
  proposito: `Como parte de las acciones de mejora comprometidas en la NCm101, se indicó que el servicio de la Plataforma Web de Atención al Usuario (CRM) que había ingresado en proceso de selección de un nuevo contratista —a través de la modalidad de concurso de precios—, contenía en su pliego con las condiciones particulares la integración del un nuevo canal de WhatsApp para mejorar la calidad y cantidad de las interacciones que el Contact Center es capaz de gestionar.

La acción se encuentra vinculada con múltiples causas, no solo del análisis de no conformidades.

Existe un cambio cultural en el modo en el que los consumidores de bienes y servicios se manifiestan con los proveedores de ellos, donde las manifestaciones a través del servicio de mensajería de WhatsApp es protagonista en nuestro país. Es así que la incorporación de nuevas tecnologías de la comunicación se hace no solo deseable, sino necesaria en tanto existe un cambio en las necesidades de los usuarios.

La integración del nuevo canal de WhatsApp con un modelo de lenguaje (IA generativa que es capaz de sostener conversaciones naturales, no de formulario preseteado) permitirá resolver rápidamente consultas simples y, cuando el caso exceda las simples consultas, podrá ejecutar una gran cantidad de automatizaciones, recopilar información relevante del caso y ejecutar las transferencias a los agentes con competencias específicas.

Su integración, concomitantemente con el aumento de la dotación del personal al teléfono, hace esperable un aumento significativo de los tiempos de respuesta de la organización, en línea con los objetivos generales de la Política de Gestión Integrada.`,
  objetivos: {
    mejoraServicio: true,
    mejoraEficacia: true,
    mejoraEficiencia: true,
    reasignacionResp: false,
    mejoraGeneralProceso: true,
  },
  accionPropuesta: `Una vez que el camino con el proveedor quede allanado, la Gerencia Comercial se encargará de:

1. Generar la totalidad de las FAQs con las que se entrenará al modelo de lenguaje para que este provea las respuestas a los usuarios.
2. Gestionará el número telefónico que estará vinculado al canal.
3. Participará con la GS y la Subgerencias RR.II. de la habilitación del servicio seguro de Meta.
4. Definirá los grupos de gestión de casos entrantes (que excedan la capacidad de respuesta del bot), tipificaciones, etiquetado, reglas de automatización, etc.
5. Creará la base de conocimiento (respuestas prediseñadas) que los agentes utilizarán para interactuar con los usuarios.
6. Gestionará con el proveedor la capacitación de todos los puestos competentes (según su rol) en la herramienta omnicanal.`,
  cumplimientoLegal: {
    cumplimientoGeneral: 'Cumple',
    contratoConcesion: true,
    reglamentoExplotacion: true,
    reglamentoUsuario: true,
    matrizLegal: true,
  },
  recursos: {
    nuevasCompetencias: 'Sí, capacitaciones.',
    incorporacionPersonal: 'Sí, plan de reconversión',
    reasignacionResponsabilidades: 'Nuevos supervisores. Ampliación de horarios.',
    informatico: 'Nuevas PCs, conectividad',
    vehiculos: 'No',
    comunicaciones: 'Campañas de difusión en sitio web y redes sociales',
    mobiliario: 'Acorde al personal reconvertido',
    modificacionInfraestructura: 'Acorde al personal reconvertido',
  },
  impactoSGI: {
    analisisRiesgosOportunidades: 'SÍ',
    impactaClientesProveedores: 'SÍ',
    documentosModificar: 'SÍ',
    documentosModificarDetalle: 'ITAU/04/02',
    comunicacionInterna: 'e-mails y capacitaciones',
    comunicacionExterna: 'sitio web, redes sociales',
  },
  aprobacion: {
    estado: 'Aprobado',
    comunicoAprobacion: 'SÍ',
    criteriosNoAprobado: '',
    firmaSGI: 'Gisela Salierno (SGI AUBASA)',
    firmaResponsable: 'Jefatura de Peaje Dinámico (JPD)',
  },
};

const LOCAL_STORAGE_KEY = 'sgi_gestion_cambios_v1';

export async function listarCambios() {
  // 1. Intentar cargar desde Supabase
  try {
    const { data, error } = await supabase
      .from('sgi_management_reviews')
      .select('*')
      .like('id', 'CAMBIO_%');

    if (!error && data && data.length > 0) {
      const items = data.map(r => r.data).filter(Boolean);
      // Guardar copia local de respaldo
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
      return items;
    }
  } catch (e) {
    console.warn('Fallo consulta a Supabase para cambios, usando local:', e);
  }

  // 2. Respaldo LocalStorage
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
  }

  // 3. Semilla inicial si no hay registros
  const inicial = [CAMBIO_SEEDED_WHATSAPP];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inicial));
  // Intentar sincronizar a la nube de fondo
  guardarCambio(CAMBIO_SEEDED_WHATSAPP).catch(() => {});
  return inicial;
}

export async function guardarCambio(cambio) {
  if (!cambio.id) {
    cambio.id = `CAMBIO_${Date.now()}`;
  }

  // 1. Guardar en LocalStorage de inmediato
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    let items = local ? JSON.parse(local) : [CAMBIO_SEEDED_WHATSAPP];
    const idx = items.findIndex(i => i.id === cambio.id);
    if (idx >= 0) {
      items[idx] = cambio;
    } else {
      items.unshift(cambio);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error guardando en localStorage:', e);
  }

  // 2. Sincronizar en Supabase
  try {
    const year = cambio.fechaEvaluacion ? String(new Date(cambio.fechaEvaluacion).getFullYear()) : '2026';
    await supabase
      .from('sgi_management_reviews')
      .upsert({
        id: cambio.id.startsWith('CAMBIO_') ? cambio.id : `CAMBIO_${cambio.id}`,
        year,
        status: cambio.aprobacion?.estado || 'En Evaluación',
        date: cambio.fechaEvaluacion || new Date().toISOString().split('T')[0],
        participants: cambio.areaProceso || 'SGI',
        data: cambio,
        updated_at: new Date().toISOString(),
      });
  } catch (e) {
    console.warn('Error sincronizando cambio en Supabase (se mantiene local):', e);
  }

  return cambio;
}

export async function eliminarCambio(id) {
  // 1. Eliminar de LocalStorage
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      let items = JSON.parse(local);
      items = items.filter(i => i.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
  } catch (e) {
    console.error('Error eliminando de localStorage:', e);
  }

  // 2. Eliminar de Supabase
  try {
    const supaId = id.startsWith('CAMBIO_') ? id : `CAMBIO_${id}`;
    await supabase
      .from('sgi_management_reviews')
      .delete()
      .eq('id', supaId);
  } catch (e) {
    console.warn('Error eliminando cambio de Supabase:', e);
  }
}

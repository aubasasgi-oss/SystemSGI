import { supabase } from '../supabaseClient';

export const DISTRIBUCION_SEED_POLITICA = {
  id: 'DISTRIB_PAU02_A2',
  codigoProcedimiento: 'PAU/02',
  codigoDoc: 'PAU/02 – A2',
  revisionDoc: '2',
  fechaEmisionDoc: '04.may.2026',
  titulo: 'ANEXO 2 DISTRIBUCION DE LA POLÍTICA DE GESTIÓN INTEGRADA',
  documentoCodigo: 'Anexo V - Política de Gestión Integrada',
  pagina: '1 de 1',
  notaPie: '* El registro de la recepción se concreta con el Acuse de Recibo Electrónico que cada Receptor envía al Responsable de Proceso al recibir el documento',
  cambiosRevision: [
    { revision: '02', descripcion: 'Se modifica el formato.' }
  ],
  revisiones: [
    {
      numero: '0',
      fecha: 'Histórica',
      vigente: false,
      receptores: []
    },
    {
      numero: '1',
      fecha: 'Histórica',
      vigente: false,
      receptores: []
    },
    {
      numero: '2',
      fecha: 'Histórica',
      vigente: false,
      receptores: []
    },
    {
      numero: '3',
      fecha: 'Histórica',
      vigente: false,
      receptores: []
    },
    {
      numero: '4',
      fecha: 'Julio 2024',
      vigente: false,
      receptores: [
        {
          id: 'rec_4_1',
          nombre: 'Asiento Gerencia Comercial',
          lugar: 'Estación de peaje Dock Sud, 1er piso. BALP km 6,8. Sentido CABA',
          concesion: 'BALP',
          tipoCopia: 'Física / Cartelera',
          acuseRecibo: 'Confirmado'
        },
        {
          id: 'rec_4_2',
          nombre: 'CAU Dock Sud',
          lugar: 'BALP, km 6,8. Sentido CABA.',
          concesion: 'BALP',
          tipoCopia: 'Física / Atención al Usuario',
          acuseRecibo: 'Confirmado'
        },
        {
          id: 'rec_4_3',
          nombre: 'CAU Berazategui',
          lugar: 'BALP, km 27,5. Sentido La Plata.',
          concesion: 'BALP',
          tipoCopia: 'Física / Atención al Usuario',
          acuseRecibo: 'Confirmado'
        },
        {
          id: 'rec_4_4',
          nombre: 'CAU Hudson Ascendente',
          lugar: 'BALP, km 30. Sentido La Plata.',
          concesion: 'BALP',
          tipoCopia: 'Física / Atención al Usuario',
          acuseRecibo: 'Confirmado'
        },
        {
          id: 'rec_4_5',
          nombre: 'CAU Hudson Descendente',
          lugar: 'BALP, km 30. Sentido CABA.',
          concesion: 'BALP',
          tipoCopia: 'Física / Atención al Usuario',
          acuseRecibo: 'Confirmado'
        }
      ]
    },
    {
      numero: '5',
      fecha: 'Julio 2025',
      vigente: true,
      receptores: [
        {
          id: 'rec_5_1',
          nombre: 'Asiento Gerencia Comercial',
          lugar: 'Estación de peaje Dock Sud, 1er piso. BALP km 6,8. Sentido CABA',
          concesion: 'BALP',
          tipoCopia: 'Física / Cartelera',
          acuseRecibo: 'Confirmado'
        },
        {
          id: 'rec_5_2',
          nombre: 'CAU Dock Sud',
          lugar: 'BALP, km 6,8. Sentido CABA.',
          concesion: 'BALP',
          tipoCopia: 'Física / Atención al Usuario',
          acuseRecibo: 'Confirmado'
        },
        {
          id: 'rec_5_3',
          nombre: 'CAU Berazategui',
          lugar: 'BALP, km 27,5. Sentido La Plata.',
          concesion: 'BALP',
          tipoCopia: 'Física / Atención al Usuario',
          acuseRecibo: 'Confirmado'
        },
        {
          id: 'rec_5_4',
          nombre: 'CAU Hudson Ascendente',
          lugar: 'BALP, km 30. Sentido La Plata.',
          concesion: 'BALP',
          tipoCopia: 'Física / Atención al Usuario',
          acuseRecibo: 'Confirmado'
        },
        {
          id: 'rec_5_5',
          nombre: 'CAU Hudson Descendente',
          lugar: 'BALP, km 30. Sentido CABA.',
          concesion: 'BALP',
          tipoCopia: 'Física / Atención al Usuario',
          acuseRecibo: 'Confirmado'
        },
        {
          id: 'rec_5_6',
          nombre: 'CAU Samborombón',
          lugar: 'SVIA, km 90.',
          concesion: 'SVIA',
          tipoCopia: 'Física / Atención al Usuario',
          acuseRecibo: 'Confirmado'
        }
      ]
    }
  ]
};

const LOCAL_STORAGE_KEY = 'sgi_distribucion_documental_v1';

export async function listarDistribucionDocumentos() {
  // 1. Intentar cargar desde Supabase
  try {
    const { data, error } = await supabase
      .from('sgi_management_reviews')
      .select('*')
      .like('id', 'DISTRIB_%');

    if (!error && data && data.length > 0) {
      const items = data.map(r => r.data).filter(Boolean);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
      return items;
    }
  } catch (e) {
    console.warn('Fallo consulta a Supabase para distribución documental, usando local:', e);
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
  const inicial = [DISTRIBUCION_SEED_POLITICA];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inicial));
  guardarDistribucionDocumento(DISTRIBUCION_SEED_POLITICA).catch(() => {});
  return inicial;
}

export async function guardarDistribucionDocumento(doc) {
  if (!doc.id) {
    doc.id = `DISTRIB_${Date.now()}`;
  }

  // 1. LocalStorage
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    let items = local ? JSON.parse(local) : [DISTRIBUCION_SEED_POLITICA];
    const idx = items.findIndex(i => i.id === doc.id);
    if (idx >= 0) {
      items[idx] = doc;
    } else {
      items.push(doc);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error guardando distribución en local:', e);
  }

  // 2. Supabase
  try {
    await supabase
      .from('sgi_management_reviews')
      .upsert({
        id: doc.id.startsWith('DISTRIB_') ? doc.id : `DISTRIB_${doc.id}`,
        year: '2026',
        status: 'Vigente',
        date: doc.fechaEmisionDoc || new Date().toISOString().split('T')[0],
        participants: doc.documentoCodigo || 'SGI',
        data: doc,
        updated_at: new Date().toISOString(),
      });
  } catch (e) {
    console.warn('Error sincronizando distribución en Supabase:', e);
  }

  return doc;
}

export async function eliminarDistribucionDocumento(id) {
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      let items = JSON.parse(local);
      items = items.filter(i => i.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
  } catch (e) {
    console.error(e);
  }

  try {
    const supaId = id.startsWith('DISTRIB_') ? id : `DISTRIB_${id}`;
    await supabase
      .from('sgi_management_reviews')
      .delete()
      .eq('id', supaId);
  } catch (e) {
    console.warn(e);
  }
}

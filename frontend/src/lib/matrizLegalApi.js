import seedData from './matrizLegalData.json';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

const LOCAL_STORAGE_KEY = 'aubasa_matriz_legal_pau02_v1';
const SUPABASE_DOC_ID = 'MATRIZ_LEGAL_PAU02_A3';

/**
 * Obtener datos de Matriz Legal desde Supabase, con fallback a localStorage y al seed JSON
 */
export async function obtenerMatrizLegal() {
  // 1. Intentar cargar desde Supabase
  try {
    const { data, error } = await supabase
      .from('sgi_management_reviews')
      .select('*')
      .eq('id', SUPABASE_DOC_ID)
      .maybeSingle();

    if (!error && data && data.data && data.data.normas) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.data));
      return data.data;
    }
  } catch (err) {
    console.warn('Error consultando Supabase para Matriz Legal, recurriendo a local:', err);
  }

  // 2. Fallback a LocalStorage
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed && parsed.normas && parsed.normas.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parseando localStorage:', e);
    }
  }

  // 3. Fallback al seed JSON original
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seedData));
  guardarMatrizLegal(seedData).catch(() => {});
  return seedData;
}

/**
 * Guardar datos de Matriz Legal en Supabase y localStorage
 */
export async function guardarMatrizLegal(data) {
  // 1. Guardar de inmediato en LocalStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error guardando en localStorage:', e);
  }

  // 2. Sincronizar en Supabase
  try {
    const payload = {
      id: SUPABASE_DOC_ID,
      year: '2026',
      status: 'Vigente',
      date: data.ultimaActualizacion || new Date().toISOString().split('T')[0],
      participants: 'Gerencia de Asuntos Legales / SGI',
      data: data,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('sgi_management_reviews')
      .upsert(payload);

    if (error) {
      console.warn('Supabase upsert arrojó advertencia:', error);
    }
    return { success: true };
  } catch (err) {
    console.warn('Error sincronizando en Supabase (datos resguardados en local):', err);
    return { success: true, localOnly: true };
  }
}

/**
 * Parsea un archivo Excel (.xlsx / .xls / .csv) subido por el usuario
 * Extrae la Matriz, Partes Interesadas, y las Hojas de Revisiones Mensuales
 */
export async function procesarExcelMatriz(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        let parsedNormas = [];
        let parsedPI = [];
        let parsedRevisiones = {};

        // 1. Buscar hoja de Matriz
        const sheetMatrizName = workbook.SheetNames.find(n => 
          n.toLowerCase().includes('matriz') || n.toLowerCase().includes('legal')
        );

        if (sheetMatrizName) {
          const ws = workbook.Sheets[sheetMatrizName];
          const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

          // Buscar fila de encabezados
          let headerRowIdx = 1;
          for (let i = 0; i < Math.min(5, rawRows.length); i++) {
            const rowStr = rawRows[i].map(c => String(c).toLowerCase()).join(' ');
            if (rowStr.includes('referencia') && rowStr.includes('tipo')) {
              headerRowIdx = i;
              break;
            }
          }

          let curRef = '';
          for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
            const row = rawRows[r];
            if (!row || row.length === 0) continue;

            if (row[0] && String(row[0]).trim()) {
              curRef = String(row[0]).trim();
            }

            const tipo = String(row[1] || '').trim();
            const nro = String(row[2] || '').trim();
            const materia = String(row[5] || '').trim();

            if (!tipo && !nro && !materia) continue;

            const fechaRaw = row[3];
            let fecha = '';
            if (fechaRaw instanceof Date) {
              fecha = fechaRaw.toISOString().split('T')[0];
            } else {
              fecha = String(fechaRaw || '').split(' ')[0].trim();
            }

            const alcance = String(row[4] || '').trim();
            const pi = String(row[6] || '').trim();
            const vigencia = String(row[7] || '').split(' ')[0].trim();
            const ambito = String(row[18] || row[17] || '').trim();
            const sitioWeb = String(row[19] || '').trim();
            const boletin = String(row[20] || '').trim();

            parsedNormas.push({
              id: `NORM_${parsedNormas.length + 1}`,
              referencia: curRef,
              tipo,
              nro,
              fecha,
              alcance,
              materia,
              partesInteresadas: pi,
              vigencia,
              ambito,
              sitioWeb,
              boletin,
              estadoActual: 'Vigente'
            });
          }
        }

        // 2. Buscar hoja de Partes Interesadas
        const sheetPIName = workbook.SheetNames.find(n => 
          n.toLowerCase().includes('interesada') || n.toLowerCase().includes('partes')
        );

        if (sheetPIName) {
          const wsPI = workbook.Sheets[sheetPIName];
          const rawRowsPI = XLSX.utils.sheet_to_json(wsPI, { header: 1, defval: '' });

          for (let r = 0; r < rawRowsPI.length; r++) {
            const row = rawRowsPI[r];
            if (!row || row.length < 3) continue;

            const strRow = row.map(c => String(c).toLowerCase()).join(' ');
            if (strRow.includes('parte interesada') && strRow.includes('necesidad')) continue;

            const parte = String(row[1] || '').trim();
            const tipo = String(row[2] || '').trim();
            if (parte && (tipo.toLowerCase().includes('externa') || tipo.toLowerCase().includes('interna') || row[3])) {
              parsedPI.push({
                id: `PI_${parsedPI.length + 1}`,
                parteInteresada: parte,
                tipo: tipo,
                necesidadExpectativa: String(row[3] || '').trim(),
                requisitoPertinente: String(row[4] || '').trim(),
                aplicaISO: String(row[5] || '').trim(),
                procesoImpactado: String(row[6] || '').trim(),
                requisitosSGI: String(row[7] || '').trim()
              });
            }
          }
        }

        // 3. Buscar todas las hojas de Revisiones
        for (const sheetName of workbook.SheetNames) {
          if (!sheetName.toLowerCase().startsWith('rev')) continue;

          const wsRev = workbook.Sheets[sheetName];
          const rawRowsRev = XLSX.utils.sheet_to_json(wsRev, { header: 1, defval: '' });

          let revItems = [];
          let curRef = '';

          for (let r = 1; r < rawRowsRev.length; r++) {
            const row = rawRowsRev[r];
            if (!row || row.length === 0) continue;

            const col0 = String(row[0] || '').trim();
            if (col0.toLowerCase().includes('sin modificaciones')) {
              revItems.push({ observacion: 'Sin modificaciones en este período' });
              break;
            }
            if (col0) {
              curRef = col0;
            }

            const tipo = String(row[1] || '').trim();
            const nro = String(row[2] || '').trim();
            const materia = String(row[5] || '').trim();
            const obs = String(row[7] || row[6] || '').trim();

            if (!tipo && !nro && !materia && !obs) continue;

            let accion = 'Modificación';
            const obsLower = obs.toLowerCase();
            if (obsLower.includes('agrega') || obsLower.includes('incorpora')) {
              accion = 'Incorporada';
            } else if (obsLower.includes('elimina') || obsLower.includes('derogada') || obsLower.includes('baja')) {
              accion = 'Eliminada / Baja';
            }

            revItems.push({
              referencia: curRef,
              tipo,
              nro,
              fecha: String(row[3] || '').split('T')[0].split(' ')[0],
              alcance: String(row[4] || '').trim(),
              materia,
              partesInteresadas: String(row[6] || '').trim(),
              accion,
              observacion: obs
            });
          }

          parsedRevisiones[sheetName] = revItems;
        }

        resolve({
          normas: parsedNormas,
          partesInteresadas: parsedPI,
          revisiones: parsedRevisiones,
          sheetNames: workbook.SheetNames
        });

      } catch (err) {
        console.error('Error procesando Excel:', err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

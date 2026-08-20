import { supabase } from '../supabaseClient';
import { estamparFirmasEnNavegador } from './estampadoFirmasBrowser';

export const ROLES_FIRMA = ['redaccion_revision', 'aprobacion', 'liberacion'];
export const ROLES_FIRMA_LABEL = {
  redaccion_revision: 'Redacción / Revisión',
  aprobacion: 'Aprobación',
  liberacion: 'Liberación'
};

const BUCKET_VERSIONES = 'gd-versiones';
const BUCKET_FIRMAS = 'gd-firmas';

function puedeActuarPorSector(userRole, sector) {
  return userRole === 'SGI' || userRole === sector;
}

async function subirArchivo(bucket, file, prefijo) {
  const nombre = `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.name.split('.').pop()}`;
  const { error } = await supabase.storage.from(bucket).upload(nombre, file);
  if (error) throw new Error(`Error subiendo archivo: ${error.message}`);
  return nombre;
}

function urlPublica(bucket, path) {
  if (!path) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function urlVersion(path) { return urlPublica(BUCKET_VERSIONES, path); }
export function urlFirma(path) { return urlPublica(BUCKET_FIRMAS, path); }

// ---------------------------------------------------------------------------
// Documentos
// ---------------------------------------------------------------------------

export async function listarDocumentos(q = '') {
  let query = supabase.from('gd_documentos').select('*').order('codigo');
  if (q) query = query.or(`codigo.ilike.%${q}%,titulo.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) throw error;
  const documentos = data || [];

  const idsVigentes = documentos.map(d => d.version_vigente_id).filter(Boolean);
  let versionesPorId = {};
  if (idsVigentes.length) {
    const { data: versiones } = await supabase.from('gd_versiones').select('*').in('id', idsVigentes);
    versionesPorId = Object.fromEntries((versiones || []).map(v => [v.id, v]));
  }
  return documentos.map(d => ({ ...d, version_vigente: d.version_vigente_id ? versionesPorId[d.version_vigente_id] : null }));
}

export async function obtenerDocumento(id) {
  const { data, error } = await supabase.from('gd_documentos').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function obtenerVersionesDeDocumento(documentoId) {
  const { data, error } = await supabase
    .from('gd_versiones')
    .select('*')
    .eq('documento_id', documentoId)
    .order('numero_revision', { ascending: false });
  if (error) throw error;
  return data;
}

export async function obtenerVersion(id) {
  const { data, error } = await supabase.from('gd_versiones').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function crearDocumento({ codigo, titulo, tipo, sectorResponsable, fechaRevision, archivo, autor }) {
  const archivoPath = await subirArchivo(BUCKET_VERSIONES, archivo, codigo.replace(/[^a-zA-Z0-9]/g, '_'));

  const { data: documento, error: errDoc } = await supabase
    .from('gd_documentos')
    .insert({ codigo, titulo, tipo, sector_responsable: sectorResponsable || null })
    .select()
    .single();
  if (errDoc) throw new Error(errDoc.message.includes('duplicate') ? 'Ya existe un documento con ese código' : errDoc.message);

  const { data: version, error: errVer } = await supabase
    .from('gd_versiones')
    .insert({
      documento_id: documento.id,
      numero_revision: 0,
      fecha_revision: fechaRevision || new Date().toISOString().slice(0, 10),
      archivo_path: archivoPath,
      archivo_nombre_original: archivo.name,
      estado: 'borrador',
      autor,
      historial: [{ estado: 'borrador', usuario: autor, fecha: new Date().toISOString(), comentario: 'Versión inicial creada' }]
    })
    .select()
    .single();
  if (errVer) throw errVer;

  return { documento, version };
}

// ---------------------------------------------------------------------------
// Flujo de versión
// ---------------------------------------------------------------------------

export async function nuevaRevision(documentoId, autor) {
  const documento = await obtenerDocumento(documentoId);

  const { data: abiertas } = await supabase
    .from('gd_versiones')
    .select('id')
    .eq('documento_id', documentoId)
    .in('estado', ['borrador', 'en_revision', 'para_firma']);
  if (abiertas && abiertas.length > 0) throw new Error('Ya existe una revisión en curso para este documento');

  const base = documento.version_vigente_id
    ? await obtenerVersion(documento.version_vigente_id)
    : (await obtenerVersionesDeDocumento(documentoId))[0];
  if (!base) throw new Error('El documento no tiene ninguna versión de base');

  // Clonar el archivo dentro del mismo bucket
  const nuevoNombre = `${documento.codigo.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}-rev.docx`;
  const { error: errCopy } = await supabase.storage.from(BUCKET_VERSIONES).copy(base.archivo_path, nuevoNombre);
  if (errCopy) throw new Error(`Error clonando archivo: ${errCopy.message}`);

  const { data: version, error } = await supabase
    .from('gd_versiones')
    .insert({
      documento_id: documentoId,
      numero_revision: base.numero_revision + 1,
      fecha_revision: new Date().toISOString().slice(0, 10),
      archivo_path: nuevoNombre,
      archivo_nombre_original: base.archivo_nombre_original,
      estado: 'borrador',
      autor,
      historial: [{ estado: 'borrador', usuario: autor, fecha: new Date().toISOString(), comentario: `Nueva revisión a partir de Rev. ${String(base.numero_revision).padStart(2, '0')}` }]
    })
    .select()
    .single();
  if (error) throw error;
  return version;
}

export async function reemplazarArchivoVersion(versionId, archivo) {
  const version = await obtenerVersion(versionId);
  if (version.estado !== 'borrador') throw new Error('Solo se puede reemplazar el archivo de una versión en borrador');

  const nombre = `${version.documento_id}-${Date.now()}.docx`;
  const { error: errUp } = await supabase.storage.from(BUCKET_VERSIONES).upload(nombre, archivo);
  if (errUp) throw new Error(errUp.message);

  const { data, error } = await supabase
    .from('gd_versiones')
    .update({ archivo_path: nombre, archivo_nombre_original: archivo.name, updated_at: new Date().toISOString() })
    .eq('id', versionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function enviarARevision(versionId, sectores, autor, fechaRevision) {
  const version = await obtenerVersion(versionId);
  if (version.estado !== 'borrador') throw new Error('Solo se puede enviar a revisión una versión en borrador');
  if (!sectores || sectores.length === 0) throw new Error('Debe indicar al menos un sector');

  const sectoresAsignados = sectores.map(sector => ({ sector, estado: 'pendiente', observaciones: [] }));
  const historial = [...(version.historial || []), { estado: 'en_revision', usuario: autor, fecha: new Date().toISOString(), comentario: `Enviado a ${sectores.length} sector(es)` }];

  const { data, error } = await supabase
    .from('gd_versiones')
    .update({
      sectores_asignados: sectoresAsignados,
      estado: 'en_revision',
      historial,
      fecha_revision: fechaRevision || version.fecha_revision,
      updated_at: new Date().toISOString()
    })
    .eq('id', versionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function agregarObservacion(versionId, sector, texto, userRole) {
  const version = await obtenerVersion(versionId);
  if (version.estado !== 'en_revision') throw new Error('La versión no está en revisión');
  if (!puedeActuarPorSector(userRole, sector)) throw new Error('No pertenecés a ese sector');

  const sectoresAsignados = version.sectores_asignados.map(s => {
    if (s.sector !== sector) return s;
    return {
      ...s,
      estado: s.estado === 'pendiente' ? 'en_curso' : s.estado,
      observaciones: [...(s.observaciones || []), { usuario: userRole, texto, fecha: new Date().toISOString() }]
    };
  });

  const { data, error } = await supabase
    .from('gd_versiones')
    .update({ sectores_asignados: sectoresAsignados, updated_at: new Date().toISOString() })
    .eq('id', versionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completarSector(versionId, sector, userRole) {
  const version = await obtenerVersion(versionId);
  if (version.estado !== 'en_revision') throw new Error('La versión no está en revisión');
  if (!puedeActuarPorSector(userRole, sector)) throw new Error('No pertenecés a ese sector');

  const sectoresAsignados = version.sectores_asignados.map(s => s.sector === sector ? { ...s, estado: 'completado' } : s);

  const { data, error } = await supabase
    .from('gd_versiones')
    .update({ sectores_asignados: sectoresAsignados, updated_at: new Date().toISOString() })
    .eq('id', versionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function pasarAFirma(versionId, autor) {
  const version = await obtenerVersion(versionId);
  if (version.estado !== 'en_revision') throw new Error('La versión no está en revisión');
  const pendientes = version.sectores_asignados.filter(s => s.estado !== 'completado');
  if (pendientes.length > 0) throw new Error(`Faltan ${pendientes.length} sector(es) por completar su revisión`);

  const historial = [...(version.historial || []), { estado: 'para_firma', usuario: autor, fecha: new Date().toISOString() }];
  const { data, error } = await supabase
    .from('gd_versiones')
    .update({ estado: 'para_firma', historial, updated_at: new Date().toISOString() })
    .eq('id', versionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Firmas
// ---------------------------------------------------------------------------

// firmaInput: { rolFirma, tipoFirma: 'dibujada'|'imagen'|'electronica', nombre, archivo?: File|Blob }
export async function firmar(versionId, firmaInput) {
  const version = await obtenerVersion(versionId);
  if (version.estado !== 'para_firma') throw new Error('La versión no está lista para firma');
  if (version.firmas.some(f => f.rolFirma === firmaInput.rolFirma)) throw new Error('Ese bloque ya fue firmado');

  let imagenPath = null;
  if (firmaInput.tipoFirma !== 'electronica') {
    if (!firmaInput.archivo) throw new Error('Debe adjuntar la imagen de la firma');
    imagenPath = await subirArchivo(BUCKET_FIRMAS, firmaInput.archivo, `${versionId}-${firmaInput.rolFirma}`);
  }

  const nuevaFirma = {
    rolFirma: firmaInput.rolFirma,
    tipoFirma: firmaInput.tipoFirma,
    nombre: firmaInput.nombre,
    imagenPath,
    fecha: new Date().toISOString()
  };
  const firmas = [...version.firmas, nuevaFirma];

  let update = { firmas, updated_at: new Date().toISOString() };

  const faltantes = ROLES_FIRMA.filter(r => !firmas.some(f => f.rolFirma === r));
  if (faltantes.length === 0) {
    update = { ...update, ...(await construirActualizacionVigente(version, firmas, firmaInput.nombre)) };
  }

  const { data, error } = await supabase.from('gd_versiones').update(update).eq('id', versionId).select().single();
  if (error) throw error;

  if (faltantes.length === 0) {
    await marcarObsoletaAnterior(version.documento_id, version.id, firmaInput.nombre);
    await supabase.from('gd_documentos').update({ version_vigente_id: version.id }).eq('id', version.documento_id);
  }

  return data;
}

async function construirActualizacionVigente(version, firmas, autor) {
  // Descargar el .docx original, descargar cada imagen de firma, estampar y subir el resultado.
  const { data: archivoBlob, error: errDl } = await supabase.storage.from(BUCKET_VERSIONES).download(version.archivo_path);
  if (errDl) throw new Error(`No se pudo descargar el archivo original: ${errDl.message}`);
  const arrayBuffer = await archivoBlob.arrayBuffer();

  const firmasConImagen = await Promise.all(firmas.map(async f => {
    if (f.tipoFirma === 'electronica') return f;
    const { data: imgBlob, error } = await supabase.storage.from(BUCKET_FIRMAS).download(f.imagenPath);
    if (error) throw new Error(`No se pudo descargar la imagen de firma: ${error.message}`);
    const bytes = new Uint8Array(await imgBlob.arrayBuffer());
    return { ...f, imagenBytes: bytes };
  }));

  const blobFinal = estamparFirmasEnNavegador(arrayBuffer, {
    numeroRevision: version.numero_revision,
    fechaRevision: version.fecha_revision,
    firmas: firmasConImagen
  });

  const nombreFinal = `${version.documento_id}-${Date.now()}-firmado.docx`;
  const { error: errUp } = await supabase.storage.from(BUCKET_VERSIONES).upload(nombreFinal, blobFinal);
  if (errUp) throw new Error(`No se pudo subir el archivo firmado: ${errUp.message}`);

  const historial = [...(version.historial || []), { estado: 'vigente', usuario: autor, fecha: new Date().toISOString(), comentario: 'Firmas completas — documento vigente' }];
  return { archivo_firmado_path: nombreFinal, estado: 'vigente', historial };
}

async function marcarObsoletaAnterior(documentoId, versionNuevaId, autor) {
  const documento = await obtenerDocumento(documentoId);
  if (!documento.version_vigente_id || documento.version_vigente_id === versionNuevaId) return;

  const anterior = await obtenerVersion(documento.version_vigente_id);
  if (anterior.estado !== 'vigente') return;

  const historial = [...(anterior.historial || []), { estado: 'obsoleto', usuario: autor, fecha: new Date().toISOString(), comentario: 'Reemplazada por una nueva revisión firmada' }];
  await supabase.from('gd_versiones').update({ estado: 'obsoleto', historial, updated_at: new Date().toISOString() }).eq('id', anterior.id);
}

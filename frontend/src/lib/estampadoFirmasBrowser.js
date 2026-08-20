import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';

// Convención de tags esperada en la plantilla .docx (bloque de firma ISO de 3 columnas):
//   {%firma_redaccion_revision} / {firma_redaccion_revision_texto}
//   {%firma_aprobacion}         / {firma_aprobacion_texto}
//   {%firma_liberacion}         / {firma_liberacion_texto}
// más {numero_revision} y {fecha_revision}.
const ROL_TAG = {
  redaccion_revision: 'firma_redaccion_revision',
  aprobacion: 'firma_aprobacion',
  liberacion: 'firma_liberacion'
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
function formatearFecha(fecha) {
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2, '0')}.${MESES[d.getMonth()]}.${d.getFullYear()}`;
}

// PNG transparente 1x1 en base64, usado como imagen "vacía" para firmas electrónicas
// (no hay imagen real que insertar en el bloque de firma).
const PIXEL_TRANSPARENTE_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
function base64ToUint8Array(b64) {
  const binario = atob(b64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}
const PIXEL_TRANSPARENTE = base64ToUint8Array(PIXEL_TRANSPARENTE_B64);

/**
 * Estampa las firmas de una versión sobre el ArrayBuffer de su propio .docx y
 * devuelve un Blob con el resultado. Corre enteramente en el navegador.
 *
 * @param {ArrayBuffer} arrayBuffer - contenido del .docx original
 * @param {{ numeroRevision:number, fechaRevision:string, firmas: Array<{rolFirma:string, tipoFirma:string, nombre:string, fecha:string, imagenBytes?: Uint8Array}> }} version
 */
export function estamparFirmasEnNavegador(arrayBuffer, version) {
  const zip = new PizZip(arrayBuffer);

  const imageModule = new ImageModule({
    centered: false,
    getImage: (tagValue) => tagValue, // ya llega como Uint8Array
    getSize: () => [140, 60]
  });

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => ''
  });

  const datos = {
    numero_revision: `Rev. ${String(version.numeroRevision).padStart(2, '0')}`,
    fecha_revision: formatearFecha(version.fechaRevision)
  };

  for (const [rol, tag] of Object.entries(ROL_TAG)) {
    const firma = version.firmas.find(f => f.rolFirma === rol);
    if (!firma) {
      datos[tag] = PIXEL_TRANSPARENTE;
      datos[`${tag}_texto`] = '';
      continue;
    }
    const esElectronica = firma.tipoFirma === 'electronica';
    datos[tag] = esElectronica ? PIXEL_TRANSPARENTE : firma.imagenBytes;
    datos[`${tag}_texto`] = esElectronica
      ? `Firma Electrónica Autorizada — ${firma.nombre || ''} — ${formatearFecha(firma.fecha)}`
      : `${firma.nombre || ''} — ${formatearFecha(firma.fecha)}`;
  }

  doc.render(datos);
  return doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

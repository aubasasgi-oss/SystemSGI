// Config del editor embebido de OnlyOffice para un documento real del Gestor
// Documental. Si el documento activo es PDF, se edita como Word real (tablas,
// imágenes, formato completo) y al guardar se reconvierte a PDF — ver
// preparar-edicion/callback en backend/server.js. JWT está desactivado en
// esta primera integración (red interna) — ver docker-compose.yml.

function hashSimple(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

const backendUrl = () => import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// modo 'pdf': se edita el PDF real tal cual, sin conversión — sin riesgo de
//   fragmentar párrafos, pero más limitado para tablas/formato nuevo.
// modo 'word': se convierte a .docx (una sola vez, persistido como maestro)
//   para edición completa tipo Word — mejor para tablas, pero el PDF de
//   origen puede fragmentarse línea por línea según cómo esté armado.
export async function prepararEdicion(doc, modo = 'pdf') {
  if (modo === 'pdf') {
    const ext = (doc.pdf_url.split('.').pop() || 'pdf').split('?')[0].toLowerCase();
    return { editUrl: doc.pdf_url, fileType: ext, formatoFinal: ext };
  }

  const resp = await fetch(`${backendUrl()}/api/onlyoffice/preparar-edicion/${doc.id}`, { method: 'POST' });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || 'No se pudo preparar el documento para edición');
  }
  return resp.json(); // { editUrl, fileType, formatoFinal }
}

export function construirConfigOnlyOffice(doc, userRole, { editUrl, fileType, formatoFinal }) {
  // Importante: este callback lo llama el CONTENEDOR de OnlyOffice, no el
  // navegador — por eso no puede ser "localhost", tiene que ser una URL que
  // el contenedor pueda resolver hacia el host (Docker Desktop expone
  // host.docker.internal para eso).
  const callbackBase = import.meta.env.VITE_ONLYOFFICE_CALLBACK_BASE || 'http://host.docker.internal:5001';
  const secret = import.meta.env.VITE_ONLYOFFICE_CALLBACK_SECRET;

  return {
    document: {
      fileType,
      // La key debe cambiar cuando cambia el archivo para que OnlyOffice no
      // sirva una versión cacheada — editUrl ya incluye un timestamp nuevo
      // en cada preparación, así que alcanza con hashearla.
      key: hashSimple(`${doc.id}-${editUrl}`),
      title: `${doc.code} - ${doc.title}.${fileType}`,
      url: editUrl
    },
    documentType: fileType === 'docx' || fileType === 'doc' ? 'word' : 'pdf',
    editorConfig: {
      callbackUrl: `${callbackBase}/api/onlyoffice-callback/${doc.id}?secret=${secret}&formatoFinal=${formatoFinal}&fuente=${fileType}`,
      lang: 'es',
      mode: 'edit',
      user: { id: 'sgi', name: userRole || 'SGI' }
    }
  };
}

export function urlDocumentServer() {
  return import.meta.env.VITE_ONLYOFFICE_URL || 'http://localhost:8080';
}

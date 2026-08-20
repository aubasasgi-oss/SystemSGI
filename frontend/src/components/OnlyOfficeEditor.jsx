import React, { useEffect, useRef, useState } from 'react';
import { construirConfigOnlyOffice, prepararEdicion, urlDocumentServer } from '../lib/onlyoffice';

const CONTAINER_ID = 'onlyoffice-editor-container';

function cargarScript(src) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      script.onerror = reject;
      document.body.appendChild(script);
    }
    // api.js dispara "load" antes de terminar de inicializar window.DocsAPI
    // internamente — se espera activamente a que exista en vez de confiar
    // en el evento onload.
    const desde = Date.now();
    const chequear = () => {
      if (window.DocsAPI?.DocEditor) return resolve();
      if (Date.now() - desde > 15000) return reject(new Error('Timeout esperando DocsAPI'));
      setTimeout(chequear, 150);
    };
    chequear();
  });
}

// Editor real embebido sobre OnlyOffice Document Server.
// modo='pdf' (recomendado): edita el PDF real tal cual, sin conversión — sin
//   riesgo de fragmentar párrafos, pero más limitado para tablas nuevas.
// modo='word': convierte a .docx (una vez, persistido como maestro) para
//   edición completa tipo Word — mejor para tablas/formato, pero el texto
//   puede fragmentarse según cómo esté armado el PDF de origen.
export default function OnlyOfficeEditor({ doc, userRole, modo = 'pdf' }) {
  const [estado, setEstado] = useState(modo === 'word' ? 'convirtiendo' : 'cargando');
  const [error, setError] = useState('');
  const editorRef = useRef(null);

  useEffect(() => {
    let cancelado = false;
    async function iniciar() {
      try {
        const preparado = await prepararEdicion(doc, modo);
        if (cancelado) return;
        setEstado('cargando');

        await cargarScript(`${urlDocumentServer()}/web-apps/apps/api/documents/api.js`);
        if (cancelado) return;

        const config = construirConfigOnlyOffice(doc, userRole, preparado);
        editorRef.current = new window.DocsAPI.DocEditor(CONTAINER_ID, config);
        setEstado('listo');
      } catch (err) {
        console.error('Error abriendo el editor:', err);
        if (!cancelado) {
          setError(err.message || 'Error desconocido');
          setEstado('error');
        }
      }
    }
    iniciar();
    return () => {
      cancelado = true;
      editorRef.current?.destroyEditor?.();
    };
  }, [doc.id, doc.pdf_url, modo]);

  if (estado === 'error') {
    return (
      <div style={{ padding: '2rem', color: 'var(--danger-color)' }}>
        No se pudo abrir el editor: {error}
        <br />
        Verificá que OnlyOffice Document Server esté corriendo (<code>docker compose up -d</code>)
        y accesible en {urlDocumentServer()}.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {estado !== 'listo' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          {estado === 'convirtiendo' ? 'Convirtiendo a Word editable…' : 'Cargando editor…'}
        </div>
      )}
      <div id={CONTAINER_ID} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

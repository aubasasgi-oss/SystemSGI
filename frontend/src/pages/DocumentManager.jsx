import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Upload, CheckCircle, Edit, Edit3, Eye, FileSignature, AlertCircle, Image as ImageIcon, Folder, ArrowLeft, Copy, Plus, X, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import OnlyOfficeEditor from '../components/OnlyOfficeEditor';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const PREDEFINED_FOLDERS = [
  'Norma',
  'Manual de Gestión',
  'Instrucciones de Trabajo',
  'Procedimientos del Manual'
];

const SUB_FOLDERS = {
  'Procedimientos del Manual': [
    { title: 'PAU-01 Contexto de la Organización', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'PAU-02 Información Documentada', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'PAU-03 Liderazgo', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'PAU-04 Planificación', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'PAU-05 Soporte', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'PAU-06 Operación', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'PAU-07 Evaluación del Desempeño', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'PAU-08 Mejora', date: '29 de julio', resp: 'Salierno, Gisela' },
    { title: 'PAU-09 Revisión por la Dirección', date: '01/09/2025', resp: 'Montes, Sergio' }
  ],
  'Instrucciones de Trabajo': [
    { title: 'ITAU-04-01 Atención de consultas, sugerencias, quejas y reclamos', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'ITAU-04-02 Atención a los Usuarios - Telefonía y Redes Sociales', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'ITAU-04-03 Gestión Comercial, TelePASE y Exentos', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'ITAU-04-04 Detección de alertas y atención de contingencias', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'ITAU-04-05 Gestión de Seguridad Vial', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'ITAU-04-06 Gestión de la Asistencia Vial', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'ITAU-04-07 Gestión del Tránsito', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'ITAU-04-08 Gestión del Sistema de Percepción de Peaje', date: '01/09/2025', resp: 'Montes, Sergio' },
    { title: 'ITAU-04-09 Gestión del Sistema de percepcion de peaje SVIA', date: '01/09/2025', resp: 'Montes, Sergio' }
  ]
};

const DocumentCover = ({ title, version, date }) => (
  <div style={{ margin: '0 auto', backgroundColor: 'white', minHeight: '1122px', width: '794px', padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Arial, sans-serif', borderBottom: '1px dashed #ccc', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
    {/* AUBASA Logo Placeholder */}
    <div style={{ marginTop: '100px', marginBottom: '150px' }}>
      <h1 style={{ fontSize: '64px', fontWeight: 'bold', color: '#00a4b4', margin: 0, letterSpacing: '2px' }}>AUBASA</h1>
      <div style={{ fontSize: '12px', letterSpacing: '1px', color: '#666', textAlign: 'center', marginTop: '8px' }}>AUTOPISTAS DE BUENOS AIRES S.A.</div>
    </div>
    
    {/* Título y Recuadro Central */}
    <div style={{ width: '100%', border: '2px solid #000', padding: '60px 40px', textAlign: 'center', marginBottom: '60px' }}>
      <h2 style={{ fontSize: '32px', margin: '0 0 40px 0', fontWeight: 'normal' }}>Sistema de Gestión Integrado</h2>
      <div style={{ width: '100%', borderTop: '2px solid #000', marginBottom: '40px' }}></div>
      <h1 style={{ fontSize: '36px', margin: '0 0 30px 0', fontWeight: 'bold', textTransform: 'uppercase' }}>{title || 'TÍTULO DEL DOCUMENTO'}</h1>
      <h2 style={{ fontSize: '32px', color: '#0000ff', margin: 0 }}>{version}</h2>
    </div>

    {/* Fecha */}
    <div style={{ fontSize: '20px', color: '#0000ff', marginTop: '40px' }}>
      Fecha de {version}: {date ? date.split('T')[0] : 'DD/MM/AAAA'}
    </div>
  </div>
);

const DocumentHeader = ({ title, code, version, date }) => (
  <div className="print-header" style={{ display: 'flex', border: '1px solid #000', marginBottom: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: 'white' }}>
    <div style={{ width: '25%', borderRight: '1px solid #000', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ color: '#00a4b4', fontSize: '36px', margin: 0, fontWeight: '900', letterSpacing: '-1px' }}>AUBASA</h1>
      <span style={{ fontSize: '8px', color: '#666', marginTop: '2px', fontWeight: 'bold' }}>AUTOPISTAS DE BUENOS AIRES S.A.</span>
    </div>
    <div style={{ width: '50%', borderRight: '1px solid #000', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <h2 style={{ margin: 0, fontSize: '24px', color: '#000', fontWeight: 'normal' }}>{title || 'Título del Documento'}</h2>
    </div>
    <div style={{ width: '25%', padding: '0', display: 'flex', flexDirection: 'column', color: '#000' }}>
      <div style={{ borderBottom: '1px solid #000', padding: '8px 12px', fontSize: '12px', display: 'flex' }}>
        <span style={{ width: '60px' }}>Código</span> <span>{code}</span>
      </div>
      <div style={{ borderBottom: '1px solid #000', padding: '8px 12px', fontSize: '12px', display: 'flex' }}>
        <span style={{ width: '60px' }}>Revisión</span> <span>{version?.replace('Rev.', '') || '01'}</span>
      </div>
      <div style={{ borderBottom: '1px solid #000', padding: '8px 12px', fontSize: '12px', display: 'flex' }}>
        <span style={{ width: '60px' }}>Fecha</span> <span>{date ? date.split('T')[0] : ''}</span>
      </div>
      <div style={{ padding: '8px 12px', fontSize: '12px', display: 'flex' }}>
        <span style={{ width: '60px' }}>Página</span> <span>1 de X</span>
      </div>
    </div>
  </div>
);

const DocumentFooter = ({ status, assignee }) => {
  const isSigned = status === 'Firmado';
  const signatureStamp = isSigned ? (
    <div style={{ color: '#0f172a', fontStyle: 'italic', fontFamily: 'Georgia, serif', fontSize: '14px', marginTop: '4px' }}>
      Firma Electrónica Autorizada
    </div>
  ) : null;

  return (
    <div className="print-footer" style={{ display: 'flex', border: '1px solid #000', marginTop: '30px', fontFamily: 'Arial, sans-serif', fontSize: '11px', textAlign: 'center', color: '#000', backgroundColor: 'white' }}>
      <div style={{ width: '33.3%', borderRight: '1px solid #000' }}>
        <div style={{ borderBottom: '1px solid #000', padding: '4px', background: '#f1f5f9', fontWeight: 'bold' }}>REDACCIÓN - REVISIÓN</div>
        <div style={{ padding: '20px 10px 10px 10px', display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '60px', justifyContent: 'flex-end' }}>
          {signatureStamp}
          <span style={{ borderTop: '1px solid #ccc', paddingTop: '4px', marginTop: 'auto' }}>Firma Analista / Jefe de Sector</span>
        </div>
      </div>
      <div style={{ width: '33.3%', borderRight: '1px solid #000' }}>
        <div style={{ borderBottom: '1px solid #000', padding: '4px', background: '#f1f5f9', fontWeight: 'bold' }}>APROBACIÓN</div>
        <div style={{ padding: '20px 10px 10px 10px', display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '60px', justifyContent: 'flex-end' }}>
          {signatureStamp}
          <span style={{ borderTop: '1px solid #ccc', paddingTop: '4px', marginTop: 'auto' }}>Firma Jefe SGI</span>
        </div>
      </div>
      <div style={{ width: '33.4%' }}>
        <div style={{ borderBottom: '1px solid #000', padding: '4px', background: '#f1f5f9', fontWeight: 'bold' }}>LIBERACIÓN</div>
        <div style={{ padding: '20px 10px 10px 10px', display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '60px', justifyContent: 'flex-end' }}>
          {signatureStamp}
          <span style={{ borderTop: '1px solid #ccc', paddingTop: '4px', marginTop: 'auto' }}>Firma Gerente General</span>
        </div>
      </div>
    </div>
  );
};

const RUIDO_ENCABEZADO_PIE = [
  /REDACCIÓN - REVISIÓN APROBACIÓN LIBERACIÓN/gi,
  /Firma Ferraris Maria Amelia/gi,
  /Firma Sergio Montes/gi,
  /Firma Ceriani Pablo/gi,
  /Analista SGI/gi,
  /Jefe del SGI/gi,
  /Gerente General/gi,
  /Manual de Gestión/gi,
  /Código MG/gi,
  /Página \d+ de \d+/gi,
  /Fecha \d{2}\.[a-zA-Z]{3}\.\d{4}/gi,
  /Rev\.\d+/gi,
  /Revisión \d+/gi
];

// Punto numerado tipo "3.2.1" o "8.4.2.1" al inicio del párrafo (clave para
// reconocer la jerarquía de títulos/cláusulas de los manuales AUBASA).
const PATRON_NUMERACION = /^(\d+(?:\.\d+){0,4})\s+(.+)$/s;

// Arma un <p> Quill-friendly a partir de un fragmento de texto/HTML de una
// página, aplicando justificado y, si el párrafo arranca con numeración tipo
// "3.2.1", el indent nativo de Quill (ql-indent-1) para que se agrupe
// visualmente como en el documento original. Los estilos CSS arbitrarios
// (text-indent, padding, etc.) no sobreviven al importar HTML en Quill —
// solo los formatos que Quill reconoce nativamente (align, indent, bold).
// Importante: NO se fuerza negrita por heurística de longitud — eso hacía
// que fragmentos de tablas (ej. filas de "01", "6.2 Objetivos...") se vieran
// como falsos títulos. La negrita real la sigue marcando pdf.js según el
// font-family del PDF (ver extraerContenidoDePdf), no esta función.
function armarParrafo(fragmentoHtml) {
  const texto = fragmentoHtml.replace(/<[^>]+>/g, '').trim()
  if (!texto) return ''

  const esNumerado = PATRON_NUMERACION.test(texto)
  const clases = esNumerado ? 'ql-align-justify ql-indent-1' : 'ql-align-justify'
  return `<p class="${clases}">${fragmentoHtml.trim()}</p>`
}

// Extrae el texto de un PDF (vía pdf.js) reconstruyendo párrafos con
// justificado y agrupación de cláusulas numeradas, en vez de un bloque plano
// de texto — se usa tanto para "nueva revisión" como para "modificar".
async function extraerContenidoDePdf(pdfUrl) {
  const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      let pageText = '';
      let lastY = null;
      let lastX = null;
      let lastWidth = null;

      for (const item of textContent.items) {
        let text = item.str;
        const style = textContent.styles ? textContent.styles[item.fontName] : null;

        const isBold = (style && style.fontFamily && style.fontFamily.toLowerCase().includes('bold')) ||
                       item.fontName.toLowerCase().includes('bold');
        if (isBold) {
          text = `<strong>${text}</strong>`;
        }

        if (lastY !== null && Math.abs(lastY - item.transform[5]) > 4) {
          pageText += '\n\n';
        } else if (lastX !== null && lastWidth !== null && text.trim().length > 0) {
          const gap = item.transform[4] - (lastX + lastWidth);
          if (gap > 15) {
            pageText += '     ';
          } else if (gap > 5) {
            pageText += ' ';
          }
        }

        pageText += text;
        lastY = item.transform[5];
        lastX = item.transform[4];
        lastWidth = item.width;
      }

      for (const patron of RUIDO_ENCABEZADO_PIE) pageText = pageText.replace(patron, '');

      const parrafosPagina = pageText.split(/\n\n+/).map(armarParrafo).filter(Boolean).join('');
      fullText += parrafosPagina;
    } catch (err) {
      console.error('Error extracting page', i, err);
    }
  }

  return fullText;
}

// Convierte la página A4 visible en el editor (encabezado + contenido + pie de
// firmas) en un PDF real de varias páginas, en vez de guardar el HTML crudo.
// Así el documento "activo" siempre es un PDF de verdad, con el membrete oficial.
async function generarPdfDesdeElemento(el) {
  const toolbar = el.querySelector('.ql-toolbar');
  const toolbarDisplayPrevio = toolbar ? toolbar.style.display : null;
  if (toolbar) toolbar.style.display = 'none';

  // Importante: sin windowWidth/windowHeight explícitos, html2canvas recorta la
  // captura al viewport visible del navegador en vez de usar el alto real del
  // documento (que puede tener muchas páginas de contenido).
  let canvas;
  try {
    canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: el.scrollWidth,
      height: el.scrollHeight,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight
    });
  } finally {
    if (toolbar) toolbar.style.display = toolbarDisplayPrevio;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const anchoPagina = 210;
  const altoPagina = 297;
  const altoImagen = (canvas.height * anchoPagina) / canvas.width;
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  let alturaRestante = altoImagen;
  let posicion = 0;
  pdf.addImage(imgData, 'JPEG', 0, posicion, anchoPagina, altoImagen);
  alturaRestante -= altoPagina;

  while (alturaRestante > 0) {
    posicion = alturaRestante - altoImagen;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, posicion, anchoPagina, altoImagen);
    alturaRestante -= altoPagina;
  }

  return pdf.output('blob');
}

export default function DocumentManager() {
  const { user, userRole, userSector } = useAuth();
  const isSGI = userRole === 'SGI';
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewingPdf, setViewingPdf] = useState(false);
  const [uploadSigModal, setUploadSigModal] = useState(false);
  const [createDocModal, setCreateDocModal] = useState(false);
  const [editorModal, setEditorModal] = useState(false);
  const [guardandoPdf, setGuardandoPdf] = useState(false);
  const [onlyOfficeDoc, setOnlyOfficeDoc] = useState(null);
  const [onlyOfficeModo, setOnlyOfficeModo] = useState('pdf');
  const previewRef = useRef(null);

  // Folder state
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentSubFolder, setCurrentSubFolder] = useState(null);
  


  const getTodayString = () => new Date().toISOString().split('T')[0];

  // Formularios
  const [newDocForm, setNewDocForm] = useState({ title: '', code: '', folder_name: PREDEFINED_FOLDERS[0], sub_folder: '', version: 'Rev.01', date: getTodayString(), file: null });
  const [editorForm, setEditorForm] = useState({ id: null, title: '', code: '', version: '', folder_name: '', date: getTodayString(), content: '', assignee: 'SGI', status: 'Borrador', isNewRevision: false, editorMode: 'interactive', file: null });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sgi_documents')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Borrador': return <span className="badge" style={{ background: '#94a3b8', color: 'white' }}>Borrador</span>;
      case 'En Revisión': return <span className="badge" style={{ background: '#f59e0b', color: 'white' }}>En Revisión</span>;
      case 'Para Firma': return <span className="badge badge-warning" style={{ background: '#0284c7', color: 'white' }}>Para Firma</span>;
      case 'Firmado': return <span className="badge" style={{ background: 'var(--success-color)', color: 'white' }}>Vigente (Firmado)</span>;
      case 'Obsoleto': return <span className="badge" style={{ background: '#ef4444', color: 'white' }}>Obsoleto</span>;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    // Para compensar zonas horarias al crear dates a mano
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const finalDate = new Date(date.getTime() + userTimezoneOffset);
    return finalDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const uploadPdf = async (file, code, version) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${code}_${version}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage.from('sgi-pdfs').upload(fileName, file);
    if (error) throw new Error("Error en Storage de Supabase: " + error.message);
    
    const { data: publicUrlData } = supabase.storage.from('sgi-pdfs').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  // Devuelve false si el usuario cancela (cuando detecta códigos repetidos
  // entre documentos con títulos distintos, señal de que el código no es
  // realmente único y se está por obsoletar algo que no corresponde).
  const markOldVersionsObsolete = async (code, currentId, currentTitle) => {
    try {
      const { data: afectados, error: errSelect } = await supabase
        .from('sgi_documents')
        .select('id, title')
        .eq('code', code)
        .eq('status', 'Firmado')
        .neq('id', currentId);
      if (errSelect) { console.error("Error checking old versions:", errSelect); return true; }
      if (!afectados || afectados.length === 0) return true;

      const distintos = afectados.filter(d => d.title !== currentTitle);
      if (distintos.length > 0) {
        const lista = distintos.map(d => `- ${d.title}`).join('\n');
        const continuar = confirm(
          `El código "${code}" también lo tienen estos documentos con OTRO título:\n${lista}\n\n` +
          `Si seguís, se van a marcar como Obsoletos aunque no sean revisiones de este documento.\n` +
          `Si son documentos distintos, cancelá y usá un código único para cada uno.\n\n¿Continuar de todos modos?`
        );
        if (!continuar) return false;
      }

      const { error } = await supabase
        .from('sgi_documents')
        .update({ status: 'Obsoleto' })
        .eq('code', code)
        .eq('status', 'Firmado')
        .neq('id', currentId);

      if (error) console.error("Error archiving old versions:", error);
      return true;
    } catch (e) {
      console.error(e);
      return true;
    }
  };

  const handleAction = async (doc, actionType) => {
    let newStatus = doc.status;
    let newAssignee = doc.current_assignee;

    if (actionType === 'send_review') {
      newStatus = 'En Revisión';
      newAssignee = prompt('¿A qué Gerencia o Rol deseas enviar para revisión?', 'Gerencia de Operaciones');
      if (!newAssignee) return;
    } 
    else if (actionType === 'request_signature') {
      newStatus = 'Para Firma';
      newAssignee = prompt('¿Quién debe firmar este documento oficial?', 'Gerencia General');
      if (!newAssignee) return;
    }
    else if (actionType === 'sign_doc') {
      if (confirm('Al firmar este documento, estampas tu aprobación oficial según tu rol. ¿Continuar?')) {
        newStatus = 'Firmado';
        newAssignee = 'Ninguno';
      } else return;
    }
    else if (actionType === 'approve_direct') {
      if (confirm('¿Deseas aprobar y publicar directamente este documento histórico sin pasar por revisión?')) {
        newStatus = 'Firmado';
        newAssignee = 'Ninguno';
      } else return;
    }
    else if (actionType === 'upload_signature') {
      setSelectedDoc(doc);
      setUploadSigModal(true);
      return;
    }

    try {
      const { error } = await supabase
        .from('sgi_documents')
        .update({ status: newStatus, current_assignee: newAssignee })
        .eq('id', doc.id);

      if (error) throw error;
      
      if (newStatus === 'Firmado') {
         await markOldVersionsObsolete(doc.code, doc.id, doc.title);
      }
      
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error.message);
      alert('Hubo un error al actualizar el documento: ' + error.message);
    }
  };

  // Borra la fila (y sus archivos en Storage) para siempre — a diferencia del
  // resto del flujo, esto no pasa por "Obsoleto", desaparece del sistema.
  const handleDeletePermanent = async (doc) => {
    const confirmacion = prompt(
      `Esto borra "${doc.code} - ${doc.title}" (${doc.version}) PARA SIEMPRE, no queda en Archivo Obsoleto ni se puede deshacer.\n\nEscribí BORRAR para confirmar:`
    );
    if (confirmacion !== 'BORRAR') return;

    try {
      const nombresArchivo = [doc.pdf_url, doc.docx_url]
        .filter(Boolean)
        .map(url => url.split('/sgi-pdfs/')[1])
        .filter(Boolean)
        .map(nombre => decodeURIComponent(nombre));

      if (nombresArchivo.length > 0) {
        const { error: errStorage } = await supabase.storage.from('sgi-pdfs').remove(nombresArchivo);
        if (errStorage) console.warn('No se pudieron borrar todos los archivos de Storage:', errStorage.message);
      }

      const { error } = await supabase.from('sgi_documents').delete().eq('id', doc.id);
      if (error) throw error;

      fetchDocuments();
    } catch (error) {
      console.error('Error borrando documento:', error.message);
      alert('Hubo un error al borrar el documento: ' + error.message);
    }
  };

  const completeUploadSignature = async () => {
    try {
      const { error } = await supabase
        .from('sgi_documents')
        .update({ status: 'Firmado', current_assignee: 'Ninguno' })
        .eq('id', selectedDoc.id);

      if (error) throw error;
      
      await markOldVersionsObsolete(selectedDoc.code, selectedDoc.id, selectedDoc.title);
      
      alert("Imagen de firma cargada y aplicada exitosamente. El documento pasa a estado Firmado.");
      setUploadSigModal(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error al estampar firma:', error.message);
    }
  };

  const handleViewDoc = async (doc) => {
    setSelectedDoc(doc);
    setViewingPdf(true);
    if (doc.pdf_url && doc.pdf_url.endsWith('.html')) {
      try {
        const res = await fetch(doc.pdf_url);
        const html = await res.text();
        setSelectedDoc(prev => ({...prev, htmlCache: html}));
      } catch (e) {
        setSelectedDoc(prev => ({...prev, htmlCache: "<p>Error al cargar el contenido interactivo.</p>"}));
      }
    }
  };

  const openEditorForNewRevision = async (doc) => {
    const nextVersionNum = parseFloat(doc.version.replace('v', '').replace('Rev.', '').trim()) + 1.0;
    const nextVersionStr = isNaN(nextVersionNum) ? `${doc.version} (Nueva)` : `Rev.0${nextVersionNum}`;
    
    setEditorForm({
      id: null,
      title: doc.title,
      code: doc.code,
      folder_name: doc.folder_name,
      version: nextVersionStr,
      date: getTodayString(),
      assignee: 'SGI',
      status: 'Borrador',
      isNewRevision: true,
      file: null
    });
    setEditorModal(true);
  };

  const openEditorForModification = async (doc) => {
    setEditorForm({
      id: doc.id,
      title: doc.title,
      code: doc.code,
      folder_name: doc.folder_name,
      version: doc.version,
      date: doc.created_at.split('T')[0],
      assignee: doc.current_assignee,
      status: doc.status,
      isNewRevision: false,
      file: null
    });
    setEditorModal(true);
  };

  const saveEditorDocument = async () => {
    if(!editorForm.version || !editorForm.date) {
      alert("Por favor indica la versión y la fecha del documento.");
      return;
    }
    setGuardandoPdf(true);
    try {
      let docUrl = null;

      if (editorForm.file) {
        docUrl = await uploadPdf(editorForm.file, editorForm.code, editorForm.version);
      } else {
        // If editing an existing revision and no new file uploaded, keep existing url
        if (!editorForm.isNewRevision) {
           const existingDoc = documents.find(d => d.id === editorForm.id);
           docUrl = existingDoc ? existingDoc.pdf_url : null;
        }
      }
      
      const targetStatus = editorForm.assignee !== 'SGI' ? 'En Revisión' : 'Borrador';

      if (editorForm.isNewRevision) {
        // Insert new row
        const { error } = await supabase
          .from('sgi_documents')
          .insert([{ 
            title: editorForm.title, 
            code: editorForm.code, 
            version: editorForm.version,
            folder_name: editorForm.folder_name,
            pdf_url: docUrl,
            status: targetStatus,
            current_assignee: editorForm.assignee,
            created_at: new Date(editorForm.date).toISOString()
          }]);
        if (error) throw error;
        alert(`Documento guardado como ${targetStatus}.`);
      } else {
        // Update existing row
        const { error } = await supabase
          .from('sgi_documents')
          .update({ 
            version: editorForm.version,
            pdf_url: docUrl,
            status: targetStatus,
            current_assignee: editorForm.assignee,
            created_at: new Date(editorForm.date).toISOString()
          })
          .eq('id', editorForm.id);
        if (error) throw error;
        alert("Modificaciones guardadas correctamente.");
      }
      
      setEditorModal(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error.message);
      alert("Hubo un error al guardar el documento:\n" + error.message);
    } finally {
      setGuardandoPdf(false);
    }
  };

  const submitNewDocument = async () => {
    if(!newDocForm.code || !newDocForm.title || !newDocForm.folder_name || !newDocForm.file || !newDocForm.version || !newDocForm.date) {
      alert("Por favor completa todos los campos (incluyendo versión y fecha) y adjunta un archivo PDF.");
      return;
    }

    // El código tiene que ser único por documento — si ya existe con OTRO
    // título, al aprobar este nuevo se va a marcar obsoleto el anterior
    // aunque sea un documento totalmente distinto (ej. "NORMA" repetido en
    // varias normas ISO). Se avisa antes de crear, no después.
    const codigoRepetido = documents.find(d => d.code === newDocForm.code && d.title !== newDocForm.title);
    if (codigoRepetido) {
      const continuar = confirm(
        `El código "${newDocForm.code}" ya lo usa "${codigoRepetido.title}".\n\n` +
        `Si son el mismo documento, seguí. Si son documentos distintos (ej. otra norma), ` +
        `cancelá y usá un código único para este — si no, al aprobarlo va a marcar obsoleto al otro.`
      );
      if (!continuar) return;
    }

    try {
      // 1. Subir PDF a Storage
      const pdfUrl = await uploadPdf(newDocForm.file, newDocForm.code, newDocForm.version);

      // Si la carpeta elegida tiene subcarpetas, guardamos el nombre de la subcarpeta en la DB.
      // Si no, guardamos la carpeta principal.
      const finalFolderName = (newDocForm.sub_folder && SUB_FOLDERS[newDocForm.folder_name]) 
        ? newDocForm.sub_folder 
        : newDocForm.folder_name;

      const { error } = await supabase
        .from('sgi_documents')
        .insert([{ 
          title: newDocForm.title, 
          code: newDocForm.code, 
          version: newDocForm.version,
          folder_name: finalFolderName,
          pdf_url: pdfUrl,
          status: 'Borrador',
          current_assignee: 'SGI',
          created_at: new Date(newDocForm.date).toISOString()
        }]);
      if (error) throw new Error("Error en BD: " + error.message);
      
      setCreateDocModal(false);
      setNewDocForm({ title: '', code: '', folder_name: PREDEFINED_FOLDERS[0], sub_folder: '', version: 'Rev.01', date: getTodayString(), file: null });
      fetchDocuments();
      setCurrentFolder(newDocForm.folder_name);
      setCurrentSubFolder(newDocForm.sub_folder ? newDocForm.sub_folder : null);
    } catch (error) {
      console.error('Error creando documento:', error.message);
      alert("Fallo al crear el documento:\n" + error.message);
    }
  };

  const visibleDocuments = documents.filter(doc => {
    if (!currentFolder) return false;
    if (currentFolder === 'Archivo Obsoleto') return doc.status === 'Obsoleto';

    // Fuera del Archivo Obsoleto, los documentos obsoletos no se muestran —
    // solo viven en esa carpeta especial.
    if (doc.status === 'Obsoleto') return false;

    // Si estamos dentro de una subcarpeta
    if (currentSubFolder) {
      return doc.folder_name === currentSubFolder;
    }

    // Si estamos en una carpeta principal SIN subcarpetas
    if (!SUB_FOLDERS[currentFolder]) {
      return doc.folder_name === currentFolder;
    }

    return false; // Si estamos en carpeta principal CON subcarpetas, no mostramos documentos sueltos.
  });

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  return (
    <div>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          /* Visor print container */
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .print-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
          }
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
          }
          .print-body {
            margin-top: 150px;
            margin-bottom: 120px;
          }
        }
      `}</style>
      <div className="module-header animate-fade-in">
        <div>
          <h1 className="page-title">Gestor Documental (SGI)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            {currentFolder ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
                <span style={{ cursor: 'pointer' }} onClick={() => { setCurrentFolder(null); setCurrentSubFolder(null); }}>
                  <ArrowLeft size={14}/> Volver a Carpetas
                </span> 
                / 
                <span style={{ cursor: 'pointer' }} onClick={() => setCurrentSubFolder(null)}>
                  {currentFolder}
                </span>
                {currentSubFolder && (
                   <> / <span>{currentSubFolder}</span> </>
                )}
              </span>
            ) : "Navegación por carpetas y ciclo de revisiones oficiales."}
          </p>
        </div>
        {isSGI && (
          <button className="btn btn-primary" style={{ height: 'fit-content' }} onClick={() => setCreateDocModal(true)}>
            <Plus size={16} /> Nuevo Documento
          </button>
        )}
      </div>


      <div className="glass table-container animate-fade-in delay-1" style={{ minHeight: '300px' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando documentos desde la nube...</div>
        ) : !currentFolder ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', padding: '16px' }}>
            {PREDEFINED_FOLDERS.map(folder => {
              // Las carpetas con subcarpetas (Procedimientos del Manual,
              // Instrucciones de Trabajo) guardan los documentos con
              // folder_name = título de la subcarpeta, no el de la carpeta
              // padre — hay que sumarlos para que el conteo no dé siempre 0.
              const nombresValidos = SUB_FOLDERS[folder] ? SUB_FOLDERS[folder].map(s => s.title) : [folder];
              const cantidad = documents.filter(d => nombresValidos.includes(d.folder_name) && d.status !== 'Obsoleto').length;
              return (
                <div
                  key={folder}
                  onClick={() => setCurrentFolder(folder)}
                  className="hover-row"
                  style={{ padding: '24px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', background: 'var(--bg-color)', transition: 'all 0.2s' }}>
                  <Folder size={48} color="#eab308" style={{ margin: '0 auto 12px auto' }} />
                  <h3 style={{ fontSize: '14px', margin: 0, color: 'var(--text-primary)' }}>{folder}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {cantidad} docs vigentes
                  </p>
                </div>
              );
            })}
            
            {isSGI && (
               <div 
                 onClick={() => setCurrentFolder('Archivo Obsoleto')}
                 className="hover-row" 
                 style={{ padding: '24px', textAlign: 'center', border: '1px solid #fca5a5', borderRadius: '12px', cursor: 'pointer', background: '#fef2f2', transition: 'all 0.2s' }}>
                 <Folder size={48} color="#ef4444" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
                 <h3 style={{ fontSize: '14px', margin: 0, color: '#991b1b' }}>Archivo Obsoleto</h3>
                 <p style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>
                   {documents.filter(d => d.status === 'Obsoleto').length} revisiones
                 </p>
               </div>
            )}
          </div>
        ) : (!currentSubFolder && SUB_FOLDERS[currentFolder]) ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {SUB_FOLDERS[currentFolder].map(sub => (
              <div 
                key={sub.title} 
                className="hover-row" 
                onClick={() => setCurrentSubFolder(sub.title)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 24px', 
                  borderBottom: '1px solid var(--border-color)',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1', minWidth: '0' }}>
                  <Folder size={20} color="#eab308" fill="#fef08a" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sub.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : visibleDocuments.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            La carpeta "{currentSubFolder || currentFolder}" está vacía o no tiene documentos vigentes.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {visibleDocuments.map(doc => {
              const canAct = (doc.current_assignee === userSector || isSGI);
              
              return (
                <div key={doc.id} className="hover-row" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 24px', 
                  borderBottom: '1px solid var(--border-color)',
                  transition: 'background-color 0.2s',
                  cursor: 'default'
                }}>
                  {/* Izquierda: Icono y Título */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1', minWidth: '0' }}>
                    <Folder size={20} color="#eab308" fill="#fef08a" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.code} {doc.title}
                    </span>
                  </div>

                  {/* Centro-Derecha: Fecha y Asignado */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '64px', margin: '0 32px', flexShrink: 0 }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '80px' }}>
                      {formatDate(doc.created_at)}
                    </span>
                    <span style={{ 
                      fontSize: '12px', 
                      background: '#f1f5f9', 
                      color: 'var(--text-primary)', 
                      padding: '4px 16px', 
                      borderRadius: '16px',
                      minWidth: '120px',
                      textAlign: 'center',
                      fontWeight: '500'
                    }}>
                      {doc.current_assignee}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    
                    <div style={{ marginRight: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       {getStatusBadge(doc.status)}
                    </div>

                    {doc.status === 'Borrador' && isSGI && (
                      <>
                        <button className="btn" onClick={() => openEditorForModification(doc)} style={{ padding: '6px', background: '#3b82f6', color: 'white' }} title="Editar Redacción del Documento">
                          <Edit3 size={16} />
                        </button>
                        <button className="btn" onClick={() => handleAction(doc, 'approve_direct')} style={{ padding: '6px', background: '#10b981', color: 'white' }} title="Aprobar Histórico Directamente">
                          <CheckCircle size={16} />
                        </button>
                      </>
                    )}
                    
                    {doc.status === 'En Revisión' && canAct && (
                      <>
                        <button className="btn" onClick={() => openEditorForModification(doc)} style={{ padding: '6px', background: '#3b82f6', color: 'white' }} title="Modificar Documento">
                          <Edit3 size={16} />
                        </button>
                        <button className="btn" onClick={() => handleAction(doc, 'request_signature')} style={{ padding: '6px', background: '#0284c7', color: 'white' }} title="Solicitar Firma (Terminar Revisión)">
                          <FileSignature size={16} />
                        </button>
                      </>
                    )}

                    {doc.status === 'Para Firma' && doc.current_assignee === userRole && (
                      <button className="btn" onClick={() => handleAction(doc, 'sign_doc')} style={{ padding: '6px', background: 'var(--success-color)', color: 'white' }} title="Firmar Electrónicamente">
                        <CheckCircle size={16} />
                      </button>
                    )}

                    {doc.status === 'Para Firma' && isSGI && (
                      <button className="btn" onClick={() => handleAction(doc, 'upload_signature')} style={{ padding: '6px', background: '#8b5cf6', color: 'white' }} title="SGI: Subir imagen de firma (Física/Scaneada)">
                        <ImageIcon size={16} />
                      </button>
                    )}
                    
                    {doc.status === 'Firmado' && isSGI && (
                       <button className="btn" onClick={() => openEditorForNewRevision(doc)} style={{ padding: '6px', background: '#14b8a6', color: 'white' }} title="Crear nueva Revisión Interactiva">
                        <Copy size={16} />
                      </button>
                    )}

                    <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>

                    {/* Botón Ver PDF */}
                    <button className="btn" onClick={() => handleViewDoc(doc)} style={{ padding: '6px', background: 'transparent', color: '#ef4444' }} title="Ver Documento">
                      <FileText size={20} />
                    </button>

                    {doc.pdf_url && (
                      <>
                        <button className="btn" onClick={() => { setOnlyOfficeModo('pdf'); setOnlyOfficeDoc(doc); }} style={{ padding: '6px', background: '#0f766e', color: 'white' }} title="Editar el PDF real (sin conversión, recomendado)">
                          <Edit size={16} />
                        </button>
                        <button className="btn" onClick={() => { setOnlyOfficeModo('word'); setOnlyOfficeDoc(doc); }} style={{ padding: '6px', background: '#7c3aed', color: 'white' }} title="Editar como Word (convierte el PDF, mejor para tablas nuevas, puede fragmentar texto)">
                          <FileSignature size={16} />
                        </button>
                      </>
                    )}

                    {isSGI && (
                      <button className="btn" onClick={() => handleDeletePermanent(doc)} style={{ padding: '6px', background: '#dc2626', color: 'white' }} title="Eliminar definitivamente (no va a Obsoleto, no se puede deshacer)">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nuevo Documento */}
      {createDocModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass animate-fade-in" style={{ width: '500px', padding: '24px', borderRadius: '12px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Crear Nuevo Documento</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Ubicación (Carpeta)</label>
                <select 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  value={newDocForm.folder_name}
                  onChange={(e) => {
                    const newFolder = e.target.value;
                    const defaultSub = SUB_FOLDERS[newFolder] ? SUB_FOLDERS[newFolder][0].title : '';
                    setNewDocForm({...newDocForm, folder_name: newFolder, sub_folder: defaultSub});
                  }}
                >
                  {PREDEFINED_FOLDERS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {SUB_FOLDERS[newDocForm.folder_name] && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Sub-Carpeta</label>
                  <select 
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                    value={newDocForm.sub_folder}
                    onChange={(e) => setNewDocForm({...newDocForm, sub_folder: e.target.value})}
                  >
                    {SUB_FOLDERS[newDocForm.folder_name].map(sub => (
                      <option key={sub.title} value={sub.title}>{sub.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Código (Ej: P-SGI-01)</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  value={newDocForm.code}
                  onChange={(e) => setNewDocForm({...newDocForm, code: e.target.value})}
                  placeholder="P-SGI-01"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Título del Documento</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  value={newDocForm.title}
                  onChange={(e) => setNewDocForm({...newDocForm, title: e.target.value})}
                  placeholder="Procedimiento de Auditoría"
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Revisión (Ej: Rev.01)</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  value={newDocForm.version}
                  onChange={(e) => setNewDocForm({...newDocForm, version: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Fecha del Documento</label>
                <input 
                  type="date" 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  value={newDocForm.date}
                  onChange={(e) => setNewDocForm({...newDocForm, date: e.target.value})}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Archivo Original (Word o PDF)</label>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px dashed var(--primary-color)', background: '#f8fafc' }}
                onChange={(e) => setNewDocForm({...newDocForm, file: e.target.files[0]})}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setCreateDocModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={submitNewDocument}>Crear y Subir PDF</button>
            </div>
          </div>
        </div>
      )}


      {/* Modal Editor de Textos Interactivo */}
      {editorModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 1000, display: 'flex' }}>
          <div className="animate-fade-in" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white', overflow: 'hidden' }}>
            
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #ccc', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: '#334155', fontSize: '18px' }}>
                  {editorForm.isNewRevision ? 'Crear Nueva Revisión' : 'Modificar Documento'}: {editorForm.code} - {editorForm.title}
                </h2>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Sube el archivo original (Word) o el PDF final.</span>
                </div>
              </div>
              <button className="btn" onClick={() => setEditorModal(false)} style={{ background: 'transparent', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Versión</label>
                <input 
                  type="text" 
                  value={editorForm.version} 
                  onChange={e => setEditorForm({...editorForm, version: e.target.value})}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Fecha</label>
                <input 
                  type="date" 
                  value={editorForm.date} 
                  onChange={e => setEditorForm({...editorForm, date: e.target.value})}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Asignar Tarea a</label>
                <select 
                  value={editorForm.assignee}
                  onChange={e => setEditorForm({...editorForm, assignee: e.target.value})}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="SGI">SGI (Hacerlo yo mismo)</option>
                  <option value="Gerencia de Operaciones">Gerencia de Operaciones</option>
                  <option value="Gerencia General">Gerencia General</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" onClick={saveEditorDocument} disabled={guardandoPdf} style={{ width: '100%', padding: '8px' }}>
                  {guardandoPdf ? 'Generando PDF…' : 'Guardar Cambios'}
                </button>
              </div>
            </div>

              <div style={{ flex: 1, backgroundColor: '#f1f5f9', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '12px', background: 'white', maxWidth: '500px', width: '100%' }}>
                  <Upload size={48} color="var(--primary-color)" style={{ margin: '0 auto 16px auto' }} />
                  <h3 style={{ margin: '0 0 8px 0', color: '#334155' }}>Subir Documento (Word o PDF)</h3>
                  <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px' }}>
                    Sube el archivo de Microsoft Word (.docx) para que otro sector lo edite, o el PDF final si ya está listo para firma.
                  </p>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px dashed #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                    onChange={(e) => setEditorForm({...editorForm, file: e.target.files[0]})}
                  />
                  {editorForm.file && (
                    <div style={{ marginTop: '16px', color: 'var(--success-color)', fontSize: '13px', fontWeight: '500' }}>
                      ✓ Archivo seleccionado: {editorForm.file.name}
                    </div>
                  )}
                  {!editorForm.file && !editorForm.isNewRevision && (
                    <div style={{ marginTop: '16px', color: '#64748b', fontSize: '13px' }}>
                      Si no seleccionas un archivo, se mantendrá el PDF actual.
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Visor PDF/HTML */}
      {viewingPdf && selectedDoc && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass animate-fade-in" style={{ width: '95%', height: '95vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, color: '#334155' }}>
                Visor: {selectedDoc.code} - {selectedDoc.title} ({selectedDoc.version})
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedDoc.pdf_url && !selectedDoc.pdf_url.endsWith('.html') && (
                  <button className="btn btn-secondary" onClick={() => window.open(selectedDoc.pdf_url, '_blank')}>
                    <FileText size={16} /> Abrir PDF Original
                  </button>
                )}
                <button className="btn" onClick={() => setViewingPdf(false)} style={{ background: 'transparent', color: '#64748b' }}>
                  <X size={24} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#e2e8f0', display: 'flex', justifyContent: 'center', padding: '24px' }}>
              {selectedDoc.pdf_url && (selectedDoc.pdf_url.toLowerCase().endsWith('.doc') || selectedDoc.pdf_url.toLowerCase().endsWith('.docx')) ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                  <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '12px', background: 'white', maxWidth: '500px' }}>
                    <FileText size={64} color="#2563eb" style={{ margin: '0 auto 24px auto' }} />
                    <h3 style={{ margin: '0 0 16px 0', color: '#334155', fontSize: '24px' }}>Documento de Word</h3>
                    <p style={{ margin: '0 0 32px 0', color: '#64748b', fontSize: '16px', lineHeight: '1.5' }}>
                      Este archivo está en formato Microsoft Word ({selectedDoc.pdf_url.split('.').pop()}). 
                      Descárgalo a tu computadora para visualizarlo y editarlo cómodamente.
                    </p>
                    <button className="btn btn-primary" onClick={() => window.open(selectedDoc.pdf_url, '_blank')} style={{ padding: '16px 32px', fontSize: '16px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      Descargar Archivo Word
                    </button>
                  </div>
                </div>
              ) : (
                <iframe src={selectedDoc.pdf_url} style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} title="Visor de Documentos" />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Subir Firma Imagen */}
      {uploadSigModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass animate-fade-in" style={{ width: '400px', padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Subir Imagen de Firma</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Acción exclusiva del <strong>SGI</strong>. Sube una foto o imagen PNG de la firma de <strong>{selectedDoc?.current_assignee}</strong> para estamparla en el documento oficial.
            </p>
            
            <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '32px', textAlign: 'center', margin: '24px 0', cursor: 'pointer', background: 'rgba(0,0,0,0.02)' }}>
              <ImageIcon size={32} color="var(--text-secondary)" style={{ marginBottom: '8px' }}/>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Clic para seleccionar archivo</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>PNG, JPG con fondo transparente</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setUploadSigModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={completeUploadSignature}>Estampar Firma</button>
            </div>
          </div>
        </div>
      )}

      {/* Editor real (OnlyOffice) — abre el documento tal cual es, sin reconstrucción */}
      {onlyOfficeDoc && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 24px', borderBottom: '1px solid #ccc', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#334155', fontSize: '16px' }}>
              {onlyOfficeDoc.code} - {onlyOfficeDoc.title}
              <span style={{ marginLeft: '12px', fontSize: '12px', fontWeight: 'normal', color: onlyOfficeModo === 'word' ? '#7c3aed' : '#0f766e' }}>
                {onlyOfficeModo === 'word' ? 'modo Word (convertido)' : 'modo PDF real'}
              </span>
            </h2>
            <button className="btn" onClick={() => { setOnlyOfficeDoc(null); fetchDocuments(); }} style={{ background: 'transparent', color: '#64748b' }}>
              <X size={24} />
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <OnlyOfficeEditor doc={onlyOfficeDoc} userRole={userRole} modo={onlyOfficeModo} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};



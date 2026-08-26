import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader, FileText, Settings, Key } from 'lucide-react';
import { supabase } from '../supabaseClient';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createWorker } from 'tesseract.js';
import { rawData } from '../data/sgiData';
import { listarRiesgos } from '../lib/risksApi';
import { initialContext } from '../pages/Context';
import { mockReviews } from '../pages/ManagementReview';

// Si una página trae muy poco texto "real" (menos de este umbral), suele
// significar que el contenido es una imagen/mapa/plano sin texto embebido —
// ahí se recurre a OCR sobre un render de la página para poder leerlo igual.
const UMBRAL_TEXTO_MINIMO = 40;

// Configurar el worker de PDF.js para Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  

  
  // Documentos
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('all');
  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [docSearchOpen, setDocSearchOpen] = useState(false);
  const docSearchRef = useRef(null);

  // Estado del chat
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Hola. Soy el Asistente SGI con Inteligencia Artificial. Por favor, selecciona un documento en la parte superior y hazme una pregunta sobre él.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Cache de texto extraído
  const [pdfCache, setPdfCache] = useState({});

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const cerrarSiEsAfuera = (e) => {
      if (docSearchRef.current && !docSearchRef.current.contains(e.target)) {
        setDocSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', cerrarSiEsAfuera);
    return () => document.removeEventListener('mousedown', cerrarSiEsAfuera);
  }, []);

  const OPCIONES_ESPECIALES = [
    { id: 'global', label: 'Consultar: TODO EL SISTEMA (Base de Datos + Todos los PDFs)' },
    { id: 'all', label: 'Consultar: Solo Índice de Documentos (Rápido)' }
  ];

  const opcionSeleccionada = OPCIONES_ESPECIALES.find(o => o.id === selectedDocId)
    || documents.find(d => d.id.toString() === selectedDocId.toString());

  const etiquetaSeleccionada = opcionSeleccionada
    ? (opcionSeleccionada.label || `${opcionSeleccionada.code} - ${opcionSeleccionada.title}`)
    : 'Elegí un documento…';

  const textoFiltro = docSearchTerm.trim().toLowerCase();
  const especialesFiltradas = OPCIONES_ESPECIALES.filter(o => o.label.toLowerCase().includes(textoFiltro));
  const documentosFiltrados = documents.filter(d =>
    `${d.code} ${d.title}`.toLowerCase().includes(textoFiltro)
  );

  const elegirDocumento = (id) => {
    setSelectedDocId(id);
    setDocSearchOpen(false);
    setDocSearchTerm('');
  };

  useEffect(() => {
    // Al abrir el chat, buscar documentos vigentes
    if (isOpen && documents.length === 0) {
      fetchVigentes();
    }
  }, [isOpen]);

  const fetchVigentes = async () => {
    try {
      const { data, error } = await supabase
        .from('sgi_documents')
        .select('id, title, code, version, pdf_url')
        .eq('status', 'Firmado')
        .order('title');
      if (error) throw error;
      setDocuments(data || []);
    } catch (e) {
      console.error("Error fetching docs for chatbot:", e);
    }
  };



  // Renderiza una página de PDF a un canvas y le corre OCR — se usa cuando la
  // página no tiene texto real embebido (mapas, planos, escaneos).
  const ocrDePagina = async (page, worker) => {
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    const { data: { text } } = await worker.recognize(canvas);
    return text;
  };

  const extractTextFromPDF = async (url) => {
    // Si ya lo tenemos en caché, usarlo
    if (pdfCache[url]) return pdfCache[url];

    let worker = null;
    try {
      const loadingTask = pdfjsLib.getDocument({ url: url });
      const pdf = await loadingTask.promise;

      let fullText = '';
      // Extraer texto de las primeras 15 páginas para no saturar el token limit (ajustable)
      const maxPages = Math.min(pdf.numPages, 15);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let pageText = textContent.items.map(item => item.str).join(' ');

        // Página casi sin texto real (mapa/plano/imagen) -> OCR de respaldo
        if (pageText.trim().length < UMBRAL_TEXTO_MINIMO) {
          try {
            if (!worker) {
              worker = await createWorker('spa');
            }
            const textoOcr = await ocrDePagina(page, worker);
            if (textoOcr.trim()) {
              pageText += `\n[Texto detectado por OCR en imagen/mapa de esta página]:\n${textoOcr}`;
            }
          } catch (ocrError) {
            console.warn(`OCR falló en página ${i}:`, ocrError);
          }
        }

        fullText += `--- PÁGINA ${i} ---\n${pageText}\n\n`;
      }

      // Guardar en caché
      setPdfCache(prev => ({ ...prev, [url]: fullText }));
      return fullText;

    } catch (error) {
      console.error("Error extrayendo texto del PDF:", error);
      throw new Error(`No pude leer el contenido del PDF. Detalle: ${error.message}`);
    } finally {
      if (worker) await worker.terminate();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      let systemPrompt = "Eres el Asistente Experto del Sistema de Gestión Integrado (SGI) de AUBASA. Respondes preguntas de los usuarios basándote EXCLUSIVAMENTE en la información proporcionada.";
      let contextInfo = "";
      let sourceName = "";

      if (selectedDocId === 'global') {
        systemPrompt += " Actualmente tienes acceso a la base de datos GLOBAL del Sistema de Gestión Integrado. Esto incluye Indicadores, Riesgos, Contexto Organizacional, Revisiones por la Dirección y EL CONTENIDO COMPLETO DE TODOS LOS DOCUMENTOS VIGENTES. Usa toda esta información para cruzar datos y responder con máximo detalle.";
        
        const indContext = "INDICADORES:\n" + rawData.map(r => `- Proceso: ${r[4]}, Indicador: ${r[5]}, Meta: ${r[6]}, Responsable: ${r[10]}`).join('\n');
        const riesgosReales = await listarRiesgos().catch(() => []);
        const riskContext = "RIESGOS:\n" + (riesgosReales.length
          ? riesgosReales.map(r => `- Riesgo: ${r.riesgo}, Consecuencias: ${r.consecuencias}, Proceso: ${r.proceso}, Acción: ${r.accionDecision}`).join('\n')
          : '(sin riesgos cargados todavía)');
        const ctxContext = "CONTEXTO:\n" + initialContext.map(c => `- Factor: ${c.factorCritico}, Contexto: ${c.contexto}, Riesgo: ${c.riesgo}, Plan: ${c.planAccion}`).join('\n');
        const revContext = "REVISIONES POR LA DIRECCIÓN:\n" + mockReviews.map(m => `- Año: ${m.year}, Salidas/Mejoras: ${m.data.step4_salidas_mejoras}, Recursos: ${m.data.step4_salidas_recursos}`).join('\n');
        
        let allDocsText = "CONTENIDO DE LOS DOCUMENTOS DEL SISTEMA:\n";
        for (const doc of documents) {
          if (doc.pdf_url) {
            try {
              const text = await extractTextFromPDF(doc.pdf_url);
              allDocsText += `\n\n=== DOCUMENTO: ${doc.code} - ${doc.title} ===\n${text}`;
            } catch (e) {
               console.warn(`No se pudo extraer PDF de ${doc.title}`);
            }
          }
        }

        contextInfo = `${indContext}\n\n${riskContext}\n\n${ctxContext}\n\n${revContext}\n\n${allDocsText}`;
        sourceName = "Base de Datos Global + Todos los Documentos PDF";
      } else if (selectedDocId === 'all') {
        // Si es "Todos", solo damos el índice de documentos
        systemPrompt += " Actualmente no estás viendo ningún PDF por dentro, pero tienes acceso a este índice de documentos vigentes del SGI. Si el usuario te pregunta por algo específico, dile qué documento probablemente tenga la respuesta y pídele que lo seleccione en la lista desplegable.";
        const docIndex = documents.map(d => `- ${d.code}: ${d.title} (${d.version})`).join('\n');
        contextInfo = `ÍNDICE DE DOCUMENTOS VIGENTES:\n${docIndex}`;
        sourceName = "Índice General de Documentos";
      } else {
        // Leer el PDF seleccionado
        const doc = documents.find(d => d.id.toString() === selectedDocId.toString());
        if (!doc) throw new Error("Documento no encontrado");
        if (!doc.pdf_url) throw new Error("Este documento no tiene un archivo PDF adjunto para leer.");
        
        sourceName = `${doc.code} - ${doc.title} (${doc.version})`;
        
        // Extraer texto
        const extractedText = await extractTextFromPDF(doc.pdf_url);
        contextInfo = `DOCUMENTO DE REFERENCIA: ${sourceName}\n\nCONTENIDO DEL DOCUMENTO:\n${extractedText}`;
      }

      const systemPromptFull = systemPrompt + "\n\n" + contextInfo;
      const recentMessages = messages.slice(-4).filter(m => m.sender !== 'ai' || (!m.text.includes('Falta la Clave') && !m.text.includes('Ocurrió un error')));

      let aiResponseText = '';
      let providerUsed = '';

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPromptFull,
            recentMessages,
            currentInput
          })
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Error al comunicarse con la API de IA segura");
        }
        
        aiResponseText = data.aiResponseText;
        providerUsed = data.providerUsed;

      } catch (err) {
        console.error("Error llamando a la IA:", err);
        throw new Error(`Hubo un error contactando a la Inteligencia Artificial: ${err.message}`);
      }

      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: aiResponseText,
        source: sourceName,
        provider: providerUsed
      }]);

    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: `**Ocurrió un error:** ${error.message}` 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--accent-color)',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 20px rgba(18, 168, 179, 0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: 'transform 0.2s',
          }}
          className="hover-scale"
        >
          <MessageSquare size={28} />
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div 
          className="glass animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '400px',
            height: '600px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'var(--bg-color)'
          }}
        >
          {/* Header */}
          <div style={{
            background: 'rgba(18, 168, 179, 0.2)',
            padding: '16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--accent-color)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={16} color="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>Copilot SGI</h3>
                <span style={{ fontSize: '12px', color: 'var(--success-color)' }}>
                  Online (IA Multi-Motor Vercel Activada)
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Selector de Contexto (buscable) */}
          <div ref={docSearchRef} style={{ position: 'relative', padding: '10px 16px', background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={docSearchOpen ? docSearchTerm : etiquetaSeleccionada}
                onFocus={() => { setDocSearchOpen(true); setDocSearchTerm(''); }}
                onChange={(e) => setDocSearchTerm(e.target.value)}
                placeholder="Buscar documento por código o título…"
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', cursor: 'text', maxWidth: '100%' }}
              />
            </div>

            {docSearchOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                background: 'var(--bg-color)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)', maxHeight: '280px', overflowY: 'auto', zIndex: 50
              }}>
                {especialesFiltradas.map(o => (
                  <div
                    key={o.id}
                    onClick={() => elegirDocumento(o.id)}
                    className="hover-row"
                    style={{ padding: '10px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: 600, color: 'var(--accent-color)' }}
                  >
                    {o.label}
                  </div>
                ))}

                {especialesFiltradas.length > 0 && documentosFiltrados.length > 0 && (
                  <div style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    Documentos Vigentes
                  </div>
                )}

                {documentosFiltrados.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => elegirDocumento(doc.id)}
                    className="hover-row"
                    style={{ padding: '10px 14px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}
                  >
                    <strong>{doc.code}</strong> - {doc.title}
                  </div>
                ))}

                {especialesFiltradas.length === 0 && documentosFiltrados.length === 0 && (
                  <div style={{ padding: '14px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Sin resultados para "{docSearchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Área de Mensajes */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: msg.sender === 'user' ? 'var(--accent-color)' : 'rgba(30, 41, 59, 0.05)',
                  color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                  border: msg.sender === 'ai' ? '1px solid rgba(0,0,0,0.1)' : 'none'
                }}>
                  <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                </div>
                {msg.source && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '6px 12px', 
                    background: 'rgba(0,0,0,0.02)', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <FileText size={12} color="var(--primary-color)" />
                    <span>Leyendo: {msg.source}</span>
                  </div>
                )}
                {msg.provider && msg.provider !== 'Google Gemini' && (
                  <div style={{ 
                    marginTop: '4px', 
                    fontSize: '11px',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>⚠️ Respondido vía respaldo: {msg.provider}</span>
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <div style={{ animation: 'spin 2s linear infinite' }}><Loader size={14} /></div> Procesando y consultando IA...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid rgba(0,0,0,0.1)', display: 'flex', gap: '8px', background: '#f8fafc' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder={selectedDocId === 'all' ? "Pregunta sobre el índice..." : "Pregúntale al documento..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, border: '1px solid #cbd5e1' }}
              disabled={isTyping}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ padding: '0 16px' }}
              disabled={isTyping || !input.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;

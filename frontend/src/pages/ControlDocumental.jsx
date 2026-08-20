import React, { useEffect, useState } from 'react';
import { Plus, ArrowLeft, X, Download, Edit3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DocRefBadge, { ESTADO_BADGE_CLASS, ESTADO_LABEL, formatearFecha } from '../components/DocRefBadge';
import FirmaCanvas from '../components/FirmaCanvas';
import { SECTORES_AUBASA, SECTORES_REVISORES } from '../lib/sectoresAubasa';
import {
  ROLES_FIRMA, ROLES_FIRMA_LABEL,
  listarDocumentos, obtenerDocumento, obtenerVersionesDeDocumento, obtenerVersion,
  crearDocumento, nuevaRevision, reemplazarArchivoVersion,
  enviarARevision, agregarObservacion, completarSector, pasarAFirma, firmar,
  urlVersion
} from '../lib/gestionDocumentalApi';

const DOCX_ACCEPT = '.docx';

export default function ControlDocumental() {
  const { userRole } = useAuth();
  const [vista, setVista] = useState('lista'); // lista | documento | version
  const [documentoId, setDocumentoId] = useState(null);
  const [versionId, setVersionId] = useState(null);

  return (
    <div>
      <div className="module-header animate-fade-in">
        <div>
          <h1 className="page-title">Control Documental (.docx)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Alta, revisión por sector y firma de documentos Word con preservación de formato.
          </p>
        </div>
      </div>

      {vista === 'lista' && (
        <ListaDocumentos onAbrir={id => { setDocumentoId(id); setVista('documento'); }} />
      )}
      {vista === 'documento' && (
        <DetalleDocumento
          documentoId={documentoId}
          userRole={userRole}
          onVolver={() => setVista('lista')}
          onAbrirVersion={id => { setVersionId(id); setVista('version'); }}
        />
      )}
      {vista === 'version' && (
        <DetalleVersion
          versionId={versionId}
          userRole={userRole}
          onVolver={() => setVista('documento')}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ListaDocumentos({ onAbrir }) {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modalNuevo, setModalNuevo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { cargar(); }, []);

  async function cargar(query = '') {
    setLoading(true);
    setError('');
    try {
      setDocumentos(await listarDocumentos(query));
    } catch (e) {
      setError(e.message?.includes('gd_documentos')
        ? 'Falta correr el script sql/gestion_documental_setup.sql en Supabase (ver README).'
        : e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input
          className="form-control"
          placeholder="Buscar por código o título…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && cargar(q)}
          style={{ maxWidth: '360px' }}
        />
        <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }} onClick={() => cargar(q)}>Buscar</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setModalNuevo(true)}>
          <Plus size={16} /> Nuevo documento
        </button>
      </div>

      {error && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '16px', padding: '10px 16px' }}>{error}</div>}

      <div className="glass table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th><th>Título</th><th>Sector responsable</th><th>Revisión vigente</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map(doc => (
                <tr key={doc.id} className="hover-row" style={{ cursor: 'pointer' }} onClick={() => onAbrir(doc.id)}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent-color)', fontWeight: 600 }}>{doc.codigo}</td>
                  <td>{doc.titulo}</td>
                  <td>{doc.sector_responsable || '—'}</td>
                  <td>{doc.version_vigente ? `Rev. ${String(doc.version_vigente.numero_revision).padStart(2, '0')}` : 'Sin versión vigente'}</td>
                  <td>
                    {doc.version_vigente ? (
                      <span className={`badge ${ESTADO_BADGE_CLASS[doc.version_vigente.estado]}`}>{ESTADO_LABEL[doc.version_vigente.estado]}</span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
              {documentos.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay documentos cargados todavía.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalNuevo && <ModalNuevoDocumento onClose={() => setModalNuevo(false)} onCreado={() => { setModalNuevo(false); cargar(); }} />}
    </div>
  );
}

function ModalNuevoDocumento({ onClose, onCreado }) {
  const { userRole } = useAuth();
  const [form, setForm] = useState({ codigo: '', titulo: '', tipo: '', sectorResponsable: '', fechaRevision: new Date().toISOString().slice(0, 10) });
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function crear() {
    if (!form.codigo || !form.titulo || !archivo) return setError('Completá código, título y adjuntá el archivo .docx');
    setError('');
    setGuardando(true);
    try {
      await crearDocumento({ ...form, archivo, autor: userRole });
      onCreado();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass animate-fade-in" style={{ width: '480px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Nuevo documento</h3>
          <button className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }} onClick={onClose}><X size={20} /></button>
        </div>
        {error && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '16px' }}>{error}</div>}

        <div className="form-group">
          <label className="form-label">Código (ej. PAU/06-A01)</label>
          <input className="form-control" style={{ fontFamily: 'monospace' }} value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Título</label>
          <input className="form-control" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Tipo de documento</label>
          <input className="form-control" placeholder="Procedimiento, Anexo, Instructivo de Trabajo…" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Sector responsable</label>
          <select className="form-control" value={form.sectorResponsable} onChange={e => setForm({ ...form, sectorResponsable: e.target.value })}>
            <option value="">—</option>
            {SECTORES_AUBASA.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Fecha de revisión</label>
          <input type="date" className="form-control" value={form.fechaRevision} onChange={e => setForm({ ...form, fechaRevision: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Archivo .docx inicial</label>
          <input type="file" accept={DOCX_ACCEPT} className="form-control" onChange={e => setArchivo(e.target.files[0])} />
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={guardando} onClick={crear}>
          {guardando ? 'Creando…' : 'Crear documento'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function DetalleDocumento({ documentoId, userRole, onVolver, onAbrirVersion }) {
  const [documento, setDocumento] = useState(null);
  const [versiones, setVersiones] = useState([]);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => { cargar(); }, [documentoId]);

  async function cargar() {
    const [doc, vers] = await Promise.all([obtenerDocumento(documentoId), obtenerVersionesDeDocumento(documentoId)]);
    setDocumento(doc);
    setVersiones(vers);
  }

  async function crearNuevaRevision() {
    setError('');
    setCreando(true);
    try {
      const version = await nuevaRevision(documentoId, userRole);
      onAbrirVersion(version.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreando(false);
    }
  }

  if (!documento) return <div style={{ color: 'var(--text-secondary)' }}>Cargando…</div>;

  const versionVigente = versiones.find(v => v.id === documento.version_vigente_id);
  const hayRevisionEnCurso = versiones.some(v => ['borrador', 'en_revision', 'para_firma'].includes(v.estado));

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '24px', alignItems: 'start' }}>
      <div>
        <span style={{ cursor: 'pointer', color: 'var(--accent-color)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }} onClick={onVolver}>
          <ArrowLeft size={14} /> Volver al listado
        </span>
        <h2 style={{ margin: '0 0 4px 0' }}>{documento.titulo}</h2>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: '16px' }}>{documento.codigo} · {documento.tipo || 'Sin tipo'}</p>

        {error && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '16px' }}>{error}</div>}

        <button
          className="btn btn-primary"
          disabled={creando || hayRevisionEnCurso}
          title={hayRevisionEnCurso ? 'Ya hay una revisión en curso para este documento' : ''}
          style={{ marginBottom: '16px', opacity: hayRevisionEnCurso ? 0.4 : 1 }}
          onClick={crearNuevaRevision}
        >
          <Plus size={16} /> {creando ? 'Creando…' : 'Nueva revisión'}
        </button>

        <div className="glass table-container">
          <table>
            <thead><tr><th>Revisión</th><th>Fecha</th><th>Autor</th><th>Estado</th></tr></thead>
            <tbody>
              {versiones.map(v => (
                <tr key={v.id} className="hover-row" style={{ cursor: 'pointer' }} onClick={() => onAbrirVersion(v.id)}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-color)' }}>Rev. {String(v.numero_revision).padStart(2, '0')}</td>
                  <td>{formatearFecha(v.fecha_revision)}</td>
                  <td>{v.autor || '—'}</td>
                  <td><span className={`badge ${ESTADO_BADGE_CLASS[v.estado]}`}>{ESTADO_LABEL[v.estado]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DocRefBadge codigo={documento.codigo} version={versionVigente} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function DetalleVersion({ versionId, userRole, onVolver }) {
  const [version, setVersion] = useState(null);
  const [documento, setDocumento] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { cargar(); }, [versionId]);

  async function cargar() {
    const v = await obtenerVersion(versionId);
    setVersion(v);
    setDocumento(await obtenerDocumento(v.documento_id));
  }

  async function accion(fn) {
    setError('');
    try {
      await fn();
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!version || !documento) return <div style={{ color: 'var(--text-secondary)' }}>Cargando…</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '24px', alignItems: 'start' }}>
      <div>
        <span style={{ cursor: 'pointer', color: 'var(--accent-color)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }} onClick={onVolver}>
          <ArrowLeft size={14} /> {documento.codigo}
        </span>
        <h2 style={{ margin: '0 0 16px 0' }}>{documento.titulo}</h2>

        {error && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '16px' }}>{error}</div>}

        <a
          className="btn"
          style={{ background: 'transparent', border: '1px solid var(--border-color)', marginBottom: '20px' }}
          href={urlVersion(version.archivo_firmado_path || version.archivo_path)}
          target="_blank" rel="noreferrer"
        >
          <Download size={16} /> Descargar .docx
        </a>

        {version.estado === 'borrador' && <SeccionBorrador version={version} userRole={userRole} accion={accion} />}
        {version.estado === 'en_revision' && <SeccionRevision version={version} userRole={userRole} accion={accion} />}
        {version.estado === 'para_firma' && <SeccionFirma version={version} userRole={userRole} accion={accion} />}
        {['vigente', 'obsoleto'].includes(version.estado) && (
          <p style={{ color: 'var(--text-secondary)' }}>
            Esta revisión está {version.estado === 'vigente' ? 'vigente' : 'marcada como obsoleta'}. No admite más cambios.
          </p>
        )}
      </div>

      <DocRefBadge codigo={documento.codigo} version={version} />
    </div>
  );
}

function SeccionBorrador({ version, userRole, accion }) {
  const [archivo, setArchivo] = useState(null);
  const [sectores, setSectores] = useState([]);
  const [fechaRevision, setFechaRevision] = useState(version.fecha_revision);

  function toggleSector(v) {
    setSectores(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="glass" style={{ padding: '16px' }}>
        <h3 style={{ marginBottom: '12px' }}>Reemplazar archivo (tras editarlo en Word)</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="file" accept={DOCX_ACCEPT} className="form-control" onChange={e => setArchivo(e.target.files[0])} />
          <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}
            disabled={!archivo}
            onClick={() => accion(() => reemplazarArchivoVersion(version.id, archivo))}>
            Subir
          </button>
        </div>
      </div>

      <div className="glass" style={{ padding: '16px' }}>
        <h3 style={{ marginBottom: '12px' }}>Enviar a revisión por sector</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {SECTORES_REVISORES.map(s => (
            <label key={s.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input type="checkbox" checked={sectores.includes(s.value)} onChange={() => toggleSector(s.value)} />
              {s.label}
            </label>
          ))}
        </div>
        <div className="form-group">
          <label className="form-label">Fecha real de revisión</label>
          <input type="date" className="form-control" value={fechaRevision} onChange={e => setFechaRevision(e.target.value)} />
        </div>
        <button className="btn btn-primary" disabled={sectores.length === 0}
          onClick={() => accion(() => enviarARevision(version.id, sectores, userRole, fechaRevision))}>
          Enviar a {sectores.length || ''} sector(es)
        </button>
      </div>
    </div>
  );
}

function SeccionRevision({ version, userRole, accion }) {
  const [textos, setTextos] = useState({});
  const todosCompletados = version.sectores_asignados.every(s => s.estado === 'completado');
  const puedoActuar = (sector) => userRole === 'SGI' || userRole === sector;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {version.sectores_asignados.map(asig => (
        <div key={asig.sector} className="glass" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <strong>{asig.sector}</strong>
            <span className={`badge ${asig.estado === 'completado' ? 'badge-success' : asig.estado === 'en_curso' ? 'badge-warning' : 'badge-neutral'}`}>{asig.estado}</span>
          </div>
          {asig.observaciones.map((o, i) => (
            <div key={i} style={{ fontSize: '13px', background: '#f8fafc', borderRadius: '6px', padding: '8px', marginBottom: '6px' }}>
              <strong>{o.usuario}:</strong> {o.texto}
            </div>
          ))}
          {puedoActuar(asig.sector) && asig.estado !== 'completado' && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                className="form-control"
                placeholder="Agregar observación…"
                value={textos[asig.sector] || ''}
                onChange={e => setTextos({ ...textos, [asig.sector]: e.target.value })}
              />
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}
                onClick={() => { accion(() => agregarObservacion(version.id, asig.sector, textos[asig.sector], userRole)); setTextos({ ...textos, [asig.sector]: '' }); }}>
                Comentar
              </button>
              <button className="btn" style={{ background: 'var(--success-color)', color: 'white' }}
                onClick={() => accion(() => completarSector(version.id, asig.sector, userRole))}>
                Marcar completado
              </button>
            </div>
          )}
        </div>
      ))}
      <button className="btn btn-primary" disabled={!todosCompletados} style={{ alignSelf: 'flex-start' }}
        onClick={() => accion(() => pasarAFirma(version.id, userRole))}>
        Pasar a firma
      </button>
    </div>
  );
}

function SeccionFirma({ version, userRole, accion }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {ROLES_FIRMA.map(rol => (
        <BloqueFirma key={rol} rol={rol} version={version} userRole={userRole} accion={accion} />
      ))}
    </div>
  );
}

function BloqueFirma({ rol, version, userRole, accion }) {
  const [tipoFirma, setTipoFirma] = useState('dibujada');
  const [blobDibujado, setBlobDibujado] = useState(null);
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const firma = version.firmas.find(f => f.rolFirma === rol);
  if (firma) {
    return (
      <div className="glass" style={{ padding: '16px' }}>
        <h3 style={{ marginBottom: '4px' }}>{ROLES_FIRMA_LABEL[rol]}</h3>
        <span className="badge badge-success">Firmado — {firma.nombre} ({firma.tipoFirma})</span>
      </div>
    );
  }

  const puedeEnviar = tipoFirma === 'electronica' || (tipoFirma === 'dibujada' && blobDibujado) || (tipoFirma === 'imagen' && archivoImagen);

  async function firmarBloque() {
    setEnviando(true);
    try {
      const archivo = tipoFirma === 'dibujada' ? new File([blobDibujado], 'firma.png', { type: 'image/png' })
        : tipoFirma === 'imagen' ? archivoImagen : null;
      await accion(() => firmar(version.id, { rolFirma: rol, tipoFirma, nombre: userRole, archivo }));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="glass" style={{ padding: '16px' }}>
      <h3 style={{ marginBottom: '12px' }}>{ROLES_FIRMA_LABEL[rol]}</h3>
      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', marginBottom: '12px' }}>
        {['dibujada', 'imagen', 'electronica'].map(t => (
          <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input type="radio" name={`tipo-${rol}`} checked={tipoFirma === t} onChange={() => setTipoFirma(t)} />
            {t === 'dibujada' ? 'Firmar a mano' : t === 'imagen' ? 'Subir imagen de firma' : 'Firma electrónica'}
          </label>
        ))}
      </div>

      {tipoFirma === 'dibujada' && <FirmaCanvas onCambio={setBlobDibujado} />}
      {tipoFirma === 'imagen' && <input type="file" accept="image/*" className="form-control" onChange={e => setArchivoImagen(e.target.files[0])} />}

      <button className="btn btn-primary" style={{ marginTop: '12px' }} disabled={!puedeEnviar || enviando} onClick={firmarBloque}>
        {enviando ? 'Firmando…' : 'Firmar'}
      </button>
    </div>
  );
}

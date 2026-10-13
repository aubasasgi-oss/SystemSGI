import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Printer, Info } from 'lucide-react';
import { listarContexto } from '../lib/contextoApi';
import { agruparPorParteInteresada, getNivelBadge, nivelTexto } from '../lib/partesContexto';

export default function PartesInteresadas() {
  const { userRole } = useAuth();
  const [partesData, setPartesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(`${new Date().getFullYear() - 1}-${new Date().getFullYear()}`);
  const [firma, setFirma] = useState('');

  useEffect(() => {
    listarContexto()
      .then(items => setPartesData(agruparPorParteInteresada(items)))
      .catch(err => { console.error('Error al cargar partes interesadas:', err); setPartesData([]); })
      .finally(() => setLoading(false));
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFirma(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const totalRiesgos = partesData.reduce((acc, p) => acc + p.riesgos.length, 0);

  return (
    <div className="module-container">
      <div className="no-print module-header animate-fade-in">
        <div>
          <h2>Anexo 4.2 — Registro de Partes Interesadas</h2>
          <p>Partes interesadas y riesgos asociados según el Análisis de Contexto (PAU/01) — Cláusula 4.2</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={18} /> Imprimir Anexo
        </button>
      </div>

      <div className="glass animate-fade-in delay-1" style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', backgroundColor: 'white' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '2px solid #0369a1', paddingBottom: '24px' }}>
          <h2 style={{ color: '#0369a1', margin: '0 0 8px 0' }}>ANEXO 4.2 — REGISTRO DE PARTES INTERESADAS</h2>
          <h4 style={{ color: '#64748b', margin: 0 }}>Partes interesadas pertinentes y riesgos asociados (Análisis de Contexto PAU/01)</h4>
        </div>

        <div className="no-print form-group" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Período del registro:</label>
            <input type="text" className="form-control" style={{ maxWidth: '200px' }} value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', paddingBottom: '10px' }}>
            {partesData.length} parte(s) interesada(s) · {totalRiesgos} riesgo(s) asociado(s)
          </div>
        </div>

        <p className="only-print" style={{ display: 'none', marginBottom: '24px', fontSize: '14px' }}>
          <strong>Período: {periodo}</strong>
        </p>

        <div className="no-print" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#1e40af', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Info size={16} />
          Este registro se genera automáticamente desde el Análisis de Contexto (Estratégico). Para agregar o quitar una parte interesada, editala en los factores del módulo de Contexto. Rol actual: <strong>{userRole}</strong> (solo lectura).
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '32px' }}>Cargando partes interesadas del Análisis de Contexto...</p>
        )}

        {!loading && partesData.length === 0 && (
          <div style={{ backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '24px', color: '#92400e' }}>
            Aún no hay partes interesadas cargadas en el Análisis de Contexto. Cargá los factores en el módulo Contexto (Estratégico) para que aparezcan automáticamente en este registro.
          </div>
        )}

        {!loading && partesData.map(parte => (
          <div key={parte.nombre} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#f1f5f9', padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '17px' }}>{parte.nombre}</h3>
              <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>{parte.riesgos.length} riesgo(s)</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Riesgo / Oportunidad</th>
                  <th>Factor Crítico</th>
                  <th>Proceso Relacionado</th>
                  <th style={{ textAlign: 'center' }}>Prob</th>
                  <th style={{ textAlign: 'center' }}>Imp</th>
                  <th style={{ textAlign: 'center' }}>Nivel medido</th>
                </tr>
              </thead>
              <tbody>
                {parte.riesgos.map(r => (
                  <tr key={`${r.id}-${parte.nombre}`}>
                    <td>{r.riesgo}</td>
                    <td>{r.factorCritico}</td>
                    <td>{r.proceso}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{r.probabilidad}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{r.impacto}</td>
                    <td style={{ textAlign: 'center' }}>{getNivelBadge(r.probabilidad, r.impacto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Versión imprimible del anexo */}
        <div className="only-print" style={{ display: 'none' }}>
          {partesData.map(parte => (
            <div key={`print-${parte.nombre}`} style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#0369a1', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>{parte.nombre}</h3>
              <table className="print-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Riesgo / Oportunidad</th>
                    <th style={{ textAlign: 'left' }}>Factor Crítico</th>
                    <th style={{ textAlign: 'left' }}>Proceso</th>
                    <th>Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  {parte.riesgos.map(r => (
                    <tr key={`print-${r.id}-${parte.nombre}`}>
                      <td style={{ fontSize: '12px' }}>{r.riesgo}</td>
                      <td style={{ fontSize: '12px' }}>{r.factorCritico}</td>
                      <td style={{ fontSize: '12px' }}>{r.proceso}</td>
                      <td style={{ fontSize: '12px' }}>{r.probabilidad * r.impacto} ({nivelTexto(r.probabilidad, r.impacto)})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 16px 0' }}>Firma del Responsable</h4>
          {firma ? (
            <div style={{ width: '300px' }}>
              <img src={firma} alt="Firma responsable" style={{ maxHeight: '100px', display: 'block', marginBottom: '8px' }} />
              <div style={{ borderTop: '1px solid black', paddingTop: '8px', fontWeight: 'bold', fontSize: '14px' }}>Firma Responsable</div>
              <button className="no-print btn btn-secondary" style={{ marginTop: '12px' }} onClick={() => setFirma('')}>Eliminar Firma</button>
            </div>
          ) : (
            <label className="no-print btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
              Subir Firma Escaneada
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
          )}
          {!firma && (
            <div className="only-print" style={{ display: 'none', marginTop: '48px', width: '300px', borderTop: '1px solid black', paddingTop: '8px', fontSize: '14px' }}>
              Firma Responsable — Fecha: ____/____/____
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

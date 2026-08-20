import React from 'react';
import { AlertCircle, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

const RiskHeatmap = ({ risks }) => {
  // Matriz de conteo 5x5
  const matrixCount = {
    5: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    4: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    3: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    2: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    1: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };

  // Llenamos el conteo
  risks.forEach(r => {
    const prob = parseInt(r.probabilidad) || 0;
    const imp = parseInt(r.impacto) || 0;
    if (matrixCount[imp] && matrixCount[imp][prob] !== undefined) {
      matrixCount[imp][prob]++;
    }
  });

  const getCellColor = (prob, imp) => {
    const nivel = prob * imp;
    if (nivel >= 15) return '#ef4444'; // Muy Alto (Rojo)
    if (nivel >= 10) return '#f97316'; // Alto (Naranja)
    if (nivel >= 6) return '#eab308';  // Medio (Amarillo)
    return '#8dc63f'; // Bajo (Verde AUBASA)
  };

  const getLabelY = (imp) => {
    const labels = { 5: 'Extremo', 4: 'Mayor', 3: 'Moderado', 2: 'Menor', 1: 'Insignificante' };
    return labels[imp];
  };

  const getLabelX = (prob) => {
    const labels = { 1: 'Improbable', 2: 'Muy Poco Prob.', 3: 'Poco Probable', 4: 'Probable', 5: 'Muy Probable' };
    return labels[prob];
  };

  return (
    <div className="glass animate-fade-in" style={{ padding: '24px', marginTop: '24px', display: 'flex', gap: '32px' }}>
      
      {/* MAPA DE CALOR */}
      <div style={{ flex: '0 0 auto' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--accent-color)', marginBottom: '16px' }}>Mapa de Calor (Dinámico)</h3>
        
        <div style={{ display: 'flex' }}>
          {/* Eje Y: Impacto (Textos) */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', paddingRight: '8px', color: 'var(--text-secondary)', fontSize: '10px', textAlign: 'right', width: '80px' }}>
            <span>Extremo (5)</span>
            <span>Mayor (4)</span>
            <span>Moderado (3)</span>
            <span>Menor (2)</span>
            <span>Insignificante (1)</span>
          </div>
          
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', width: '250px', height: '250px' }}>
              {[5, 4, 3, 2, 1].map(imp => (
                [1, 2, 3, 4, 5].map(prob => {
                  const count = matrixCount[imp][prob];
                  const hasItems = count > 0;
                  return (
                    <div 
                      key={`${prob}-${imp}`}
                      style={{
                        backgroundColor: getCellColor(prob, imp),
                        opacity: hasItems ? 1 : 0.4,
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: hasItems ? 'white' : 'transparent',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        boxShadow: hasItems ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                        transition: 'all 0.3s'
                      }}
                      title={`Prob: ${getLabelX(prob)}, Imp: ${getLabelY(imp)} | Riesgos: ${count}`}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  )
                })
              ))}
            </div>
            {/* Eje X: Probabilidad */}
            <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '8px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 'bold' }}>
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center', marginLeft: '80px' }}>
          X: Probabilidad | Y: Impacto
        </div>
      </div>

      {/* LEYENDA Y ACCIONES */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--accent-color)', marginBottom: '16px' }}>Criterios de Evaluación y Acción</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
            <div style={{ background: '#ef4444', minWidth: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <AlertOctagon size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '14px', color: '#1e293b' }}>Riesgo MUY ALTO / Inaceptable (15 - 25)</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Requiere acción inmediata y prioritaria. Monitoreo MENSUAL.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
            <div style={{ background: '#f97316', minWidth: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '14px', color: '#1e293b' }}>Riesgo ALTO (10 - 14)</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Implementar medidas de mitigación adicionales. Monitoreo CUATRIMESTRAL.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
            <div style={{ background: '#eab308', minWidth: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '14px', color: '#1e293b' }}>Riesgo MEDIO (6 - 9)</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Tolerable con controles. Registrar acciones preventivas.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
            <div style={{ background: '#8dc63f', minWidth: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Info size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '14px', color: '#1e293b' }}>Riesgo BAJO / Aceptable (1 - 5)</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Los controles existentes son suficientes. Revisión ANUAL.</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default RiskHeatmap;

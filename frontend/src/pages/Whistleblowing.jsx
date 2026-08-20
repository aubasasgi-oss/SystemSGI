import React, { useState } from 'react';
import { Send, Lock } from 'lucide-react';

const Whistleblowing = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      <div className="module-header animate-fade-in">
        <h1 className="page-title">Canal de Denuncias (ISO 37001)</h1>
      </div>

      <div className="glass animate-fade-in delay-1" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Lock size={48} color="var(--accent-color)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Plataforma Segura y Confidencial</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Este canal está protegido con encriptación AES-256. Su reporte puede ser completamente anónimo y será tratado de acuerdo a los lineamientos de la Norma ISO 37001 y directivas Antisoborno.
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
            <h3 style={{ color: 'var(--success-color)', fontSize: '20px', marginBottom: '12px' }}>Denuncia Registrada con Éxito</h3>
            <p>Su código de seguimiento es: <strong>#AW-9021-XR</strong></p>
            <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Guarde este código para consultar el estado de la investigación de forma anónima.</p>
            <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => setSubmitted(false)}>Enviar otra denuncia</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tipo de Incidente</label>
              <select className="form-control" required>
                <option value="">Seleccione una opción...</option>
                <option value="soborno">Posible acto de soborno / corrupción</option>
                <option value="fraude">Fraude financiero</option>
                <option value="conflicto">Conflicto de interés no declarado</option>
                <option value="otro">Otro incumplimiento ético</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Descripción Detallada</label>
              <textarea className="form-control" rows="5" placeholder="Describa los hechos, fechas, y personas involucradas con el mayor detalle posible..." required></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">¿Desea mantener el anonimato?</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="anon" value="yes" defaultChecked /> Sí, reporte anónimo
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="anon" value="no" /> No, deseo proporcionar mis datos
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
              <Send size={18} /> Enviar Reporte Seguro
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Whistleblowing;

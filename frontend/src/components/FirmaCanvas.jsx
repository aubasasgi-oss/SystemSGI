import React, { useEffect, useRef } from 'react';
import SignaturePad from 'signature_pad';

// Canvas de firma manuscrita. Expone la firma actual como Blob PNG vía onCambio.
export default function FirmaCanvas({ onCambio }) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);

    const pad = new SignaturePad(canvas, { backgroundColor: 'rgb(255,255,255)' });
    pad.addEventListener('endStroke', () => {
      canvas.toBlob(blob => onCambio(blob), 'image/png');
    });
    padRef.current = pad;
    return () => pad.off();
  }, [onCambio]);

  function limpiar() {
    padRef.current?.clear();
    onCambio(null);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', width: '100%', height: '150px', background: 'white', touchAction: 'none' }}
      />
      <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '4px 0', fontWeight: 500 }} onClick={limpiar}>
        Limpiar firma
      </button>
    </div>
  );
}

import React from 'react';

// Agrupa los factores del Análisis de Contexto por parte interesada.
// El campo admite varias partes separadas por coma o por barra ("/"),
// que es como se cargan en la práctica: "Usuarios / Concedente / Comunidad".
export const agruparPorParteInteresada = (items) => {
  const mapa = new Map();
  (items || []).forEach(it => {
    const partes = String(it.partesInteresadas || '')
      .split(/[,/]/)
      .map(p => p.trim())
      .filter(Boolean);
    partes.forEach(nombre => {
      if (!mapa.has(nombre)) mapa.set(nombre, { nombre, riesgos: [] });
      mapa.get(nombre).riesgos.push({
        id: it.id,
        riesgo: it.riesgo,
        factorCritico: it.factorCritico,
        proceso: it.proceso,
        probabilidad: Number(it.probabilidad) || 0,
        impacto: Number(it.impacto) || 0,
      });
    });
  });
  return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
};

// Badge de nivel de riesgo PxI con el criterio AUBASA 5x5.
export const getNivelBadge = (p, i) => {
  const n = (Number(p) || 0) * (Number(i) || 0);
  if (n >= 15) return <span className="badge" style={{backgroundColor: '#fef2f2', color: '#ef4444'}}>🔴 {n} (Muy Alto)</span>;
  if (n >= 10) return <span className="badge" style={{backgroundColor: '#fff7ed', color: '#f97316'}}>🟠 {n} (Alto)</span>;
  if (n >= 6) return <span className="badge" style={{backgroundColor: '#fefce8', color: '#eab308'}}>🟡 {n} (Medio)</span>;
  return <span className="badge" style={{backgroundColor: '#f0fdf4', color: '#8dc63f'}}>🟢 {n} (Bajo)</span>;
};

export const nivelTexto = (p, i) => {
  const n = (Number(p) || 0) * (Number(i) || 0);
  if (n >= 15) return 'Muy Alto';
  if (n >= 10) return 'Alto';
  if (n >= 6) return 'Medio';
  return 'Bajo';
};

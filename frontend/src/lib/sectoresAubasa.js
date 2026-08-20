// Lista canónica de sectores/gerencias de AUBASA, compartida entre el
// simulador de roles (Layout.jsx) y el Control Documental.
export const SECTORES_AUBASA = [
  { value: 'SGI', label: 'SGI (Admin Global)' },
  { value: 'Gerencia Comercial', label: 'Gerencia Comercial' },
  { value: 'Ger. Prevención y Seguridad Integral', label: 'Ger. Prev. y Seg. Integral' },
  { value: 'Operaciones SPP', label: 'Gerencia de Operaciones (SPP)' },
  { value: 'Gerencia de Recursos Humanos', label: 'Gerencia de Recursos Humanos' },
  { value: 'Gerencia de Compras', label: 'Gerencia de Compras' },
  { value: 'CCM', label: 'CCM (Contingencias)' },
  { value: 'CCM Gestión Tránsito', label: 'CCM (Gestión Tránsito)' },
  { value: 'Mantenimiento', label: 'Gerencia de Mantenimiento-Taller Mecanico' },
  { value: 'Asistencia Vial', label: 'Asistencia Vial (Factores)' },
  { value: 'Asistencia Vial Gestión', label: 'Asistencia Vial (Gestión AV1)' },
  { value: 'Sistemas', label: 'Sistemas' },
  { value: 'Asuntos Legales', label: 'Asuntos Legales' }
];

// Sectores "revisores" válidos, sin SGI (que es el admin global que gestiona el documento).
export const SECTORES_REVISORES = SECTORES_AUBASA.filter(s => s.value !== 'SGI');

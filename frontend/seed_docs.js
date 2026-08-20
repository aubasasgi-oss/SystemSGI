const SUPABASE_URL = 'https://zkygkkoljphknwbcllec.supabase.co';
const SUPABASE_KEY = 'sb_publishable_u7Ct38S71i8XZic_M8PlxQ_YkGOKyg8';

const docsToInsert = [
  // PROCEDIMIENTOS DEL MANUAL
  { code: 'PAU-01', title: 'Contexto de la Organización', folder: 'Procedimientos del Manual', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'PAU-02', title: 'Información Documentada', folder: 'Procedimientos del Manual', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'PAU-03', title: 'Liderazgo', folder: 'Procedimientos del Manual', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'PAU-04', title: 'Planificación', folder: 'Procedimientos del Manual', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'PAU-05', title: 'Soporte', folder: 'Procedimientos del Manual', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'PAU-06', title: 'Operación', folder: 'Procedimientos del Manual', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'PAU-07', title: 'Evaluación del Desempeño', folder: 'Procedimientos del Manual', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'PAU-08', title: 'Mejora', folder: 'Procedimientos del Manual', date: '2024-07-29', assignee: 'Salierno, Gisela' },
  { code: 'PAU-09', title: 'Revisión por la Dirección', folder: 'Procedimientos del Manual', date: '2025-09-01', assignee: 'Montes, Sergio' },

  // INSTRUCCIONES DE TRABAJO
  { code: 'ITAU-04-01', title: 'Atención de consultas, sugerencias, quejas y reclamos', folder: 'Instrucciones de Trabajo', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'ITAU-04-02', title: 'Atención a los Usuarios - Telefonía y Redes Sociales', folder: 'Instrucciones de Trabajo', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'ITAU-04-03', title: 'Gestión Comercial, TelePASE y Exentos', folder: 'Instrucciones de Trabajo', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'ITAU-04-04', title: 'Detección de alertas y atención de contingencias', folder: 'Instrucciones de Trabajo', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'ITAU-04-05', title: 'Gestión de Seguridad Vial', folder: 'Instrucciones de Trabajo', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'ITAU-04-06', title: 'Gestión de la Asistencia Vial', folder: 'Instrucciones de Trabajo', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'ITAU-04-07', title: 'Gestión del Tránsito', folder: 'Instrucciones de Trabajo', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'ITAU-04-08', title: 'Gestión del Sistema de Percepción de Peaje', folder: 'Instrucciones de Trabajo', date: '2025-09-01', assignee: 'Montes, Sergio' },
  { code: 'ITAU-04-09', title: 'Gestión del Sistema de percepcion de peaje SVIA', folder: 'Instrucciones de Trabajo', date: '2025-09-01', assignee: 'Montes, Sergio' }
];

async function seed() {
  const payload = docsToInsert.map(doc => ({
    title: doc.title,
    code: doc.code,
    version: 'Rev.01',
    folder_name: doc.folder,
    status: 'Firmado',
    current_assignee: doc.assignee,
    created_at: new Date(doc.date).toISOString()
  }));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/sgi_documents`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Error seeding docs:', text);
  } else {
    console.log('Successfully seeded 18 documents.');
  }
}

seed();

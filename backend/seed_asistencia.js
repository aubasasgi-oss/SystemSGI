const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sofidya.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
        process.exit(1);
    }
});

const seedData = [
  { month: 'Enero', year: 2024 },
  { month: 'Febrero', year: 2024 },
  { month: 'Marzo', year: 2024 },
  { month: 'Abril', year: 2024 },
  { month: 'Mayo', year: 2024 },
  { month: 'Junio', year: 2024 },
  { month: 'Julio', year: 2024 },
  { month: 'Agosto', year: 2024 },
  { month: 'Septiembre', year: 2024 },
  { month: 'Octubre', year: 2024 },
  { month: 'Noviembre', year: 2024 },
  { month: 'Diciembre', year: 2024 }
].map((item, idx) => {
  const isPast = idx < 12; 
  // Generate slightly randomized data that generally matches the screenshots
  const rand = (min, max) => Math.random() * (max - min) + min;
  
  return {
    ...item,
    data: {
      // PANTALLA 1: GESTION DE SEGURIDAD VIAL
      lib_calzada: {
        ok: Math.floor(rand(50, 100)),
        tot: Math.floor(rand(100, 120))
      },
      moviles_av_15m: rand(80, 95),
      moviles_av_23m_troncal: rand(85, 98),
      aux_mec_55m: rand(90, 100),
      sanitaria_15m_tol: rand(90, 100),
      velocidad_amb: rand(80, 100),
      velocidad_mec: rand(85, 100),
      
      // PANTALLA 2: FACTORES DE DESEMPEÑO
      siniestros_unidad: [
        { movil: 'Móvil 2', siniestros: Math.floor(rand(0, 3)) },
        { movil: 'Móvil 1', siniestros: Math.floor(rand(0, 2)) },
        { movil: 'Móvil 4', siniestros: Math.floor(rand(0, 2)) },
        { movil: 'Móvil 3', siniestros: Math.floor(rand(0, 1)) },
        { movil: 'Móvil 5', siniestros: Math.floor(rand(0, 1)) },
      ],
      volumen_mantenimiento: Math.floor(rand(20, 40)),
      tasa_siniestralidad: rand(0, 0.2),
      riesgo_operativo: rand(0, 0.3),
      conformidad_legal: rand(95, 100),
      fallas_criticas: rand(0, 2),
      kpi_accidentes: Math.floor(rand(0, 6)),
      kpi_km: Math.floor(rand(200000, 250000)),
      kpi_muertos: 0,
      
      // PANTALLA 3: AMBULANCIA Y AUXILIO MECÁNICO
      equip_ambulancia: rand(0, 0.1),
      equip_amb_trimestre: rand(0, 0.1),
      equip_amb_base: [
        { base: 'Dock Sud', valor: 0.0 },
        { base: 'Hudson', valor: 0.0 }
      ],
      conformidad_aux_mec: rand(98, 100),
      conf_mec_conformidades: 100,
      conf_mec_disconformidades: 0,
      indicador_conf_mec: 100
    }
  };
});

db.serialize(() => {
    const stmt = db.prepare(`
        INSERT INTO Metrics (sector, year, month, data) 
        VALUES (?, ?, ?, ?) 
        ON CONFLICT(sector, year, month) 
        DO UPDATE SET data = excluded.data, updatedAt = CURRENT_TIMESTAMP
    `);

    seedData.forEach(item => {
        stmt.run('asistencia', item.year, item.month, JSON.stringify(item.data), (err) => {
            if (err) console.error('Error inserting row:', err.message);
            else console.log(`Inserted/Updated: Asistencia Vial - ${item.month} ${item.year}`);
        });
    });

    stmt.finalize(() => {
        db.close();
        console.log('Seeding completed.');
    });
});

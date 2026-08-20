const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'sofidya.db');
const db = new sqlite3.Database(dbPath);

const mdPath = path.resolve(__dirname, 'data', 'comercial_historico.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');

// A simple manual seeding based on the data we saw
const seedData = [
  { month: 'Junio', year: 2024, data: { com_telepase: { concesion: 'BALP', transito_telepase: 4831060, transito_total: 5865729 }, com_quejas_reclamos: { concesion: 'BALP', sitio: 'Hudson', transito: 1200000, quejas: 5, reclamos: 12 }, com_tiempo_resp: { resp_ok: 92, resp_total: 100 }, com_atencion: { llamadas_ok: 29805, llamadas_tot: 43853 } } },
  { month: 'Julio', year: 2024, data: { com_telepase: { concesion: 'BALP', transito_telepase: 4982127, transito_total: 6080700 }, com_quejas_reclamos: { concesion: 'BALP', sitio: 'Dock Sud', transito: 1500000, quejas: 7, reclamos: 15 }, com_tiempo_resp: { resp_ok: 89, resp_total: 100 }, com_atencion: { llamadas_ok: 31000, llamadas_tot: 45000 } } },
  { month: 'Agosto', year: 2024, data: { com_telepase: { concesion: 'BALP', transito_telepase: 5067321, transito_total: 5964314 }, com_quejas_reclamos: { concesion: 'BALP', sitio: 'Quilmes', transito: 800000, quejas: 4, reclamos: 10 }, com_tiempo_resp: { resp_ok: 95, resp_total: 100 }, com_atencion: { llamadas_ok: 30500, llamadas_tot: 42000 } } },
  { month: 'Septiembre', year: 2024, data: { com_telepase: { concesion: 'BALP', transito_telepase: 5085117, transito_total: 5908567 }, com_quejas_reclamos: { concesion: 'BALP', sitio: 'Hudson', transito: 1300000, quejas: 6, reclamos: 14 }, com_tiempo_resp: { resp_ok: 96, resp_total: 100 }, com_atencion: { llamadas_ok: 32000, llamadas_tot: 41000 } } },
  { month: 'Octubre', year: 2024, data: { com_telepase: { concesion: 'BALP', transito_telepase: 5366101, transito_total: 6226208 }, com_quejas_reclamos: { concesion: 'BALP', sitio: 'Dock Sud', transito: 1600000, quejas: 3, reclamos: 9 }, com_tiempo_resp: { resp_ok: 98, resp_total: 100 }, com_atencion: { llamadas_ok: 35000, llamadas_tot: 43000 } } },
  { month: 'Noviembre', year: 2024, data: { com_telepase: { concesion: 'BALP', transito_telepase: 5483227, transito_total: 6341680 }, com_quejas_reclamos: { concesion: 'BALP', sitio: 'Bernal', transito: 900000, quejas: 4, reclamos: 11 }, com_tiempo_resp: { resp_ok: 94, resp_total: 100 }, com_atencion: { llamadas_ok: 33000, llamadas_tot: 44000 } } },
  { month: 'Diciembre', year: 2024, data: { com_telepase: { concesion: 'BALP', transito_telepase: 5613933, transito_total: 6557611 }, com_quejas_reclamos: { concesion: 'BALP', sitio: 'Hudson', transito: 1400000, quejas: 2, reclamos: 8 }, com_tiempo_resp: { resp_ok: 99, resp_total: 100 }, com_atencion: { llamadas_ok: 36000, llamadas_tot: 46000 } } }
];

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS Metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector TEXT NOT NULL,
      year INTEGER NOT NULL,
      month TEXT NOT NULL,
      data TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(sector, year, month)
  )`);

  const stmt = db.prepare(`INSERT INTO Metrics (sector, year, month, data) 
                           VALUES (?, ?, ?, ?) 
                           ON CONFLICT(sector, year, month) DO UPDATE SET data = excluded.data`);

  seedData.forEach(row => {
    stmt.run('comercial', row.year, row.month, JSON.stringify(row.data));
  });

  stmt.finalize(() => {
    console.log("Seeded Comercial metrics into SQLite database.");
    db.close();
  });
});

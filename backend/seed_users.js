const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sofidya.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    // Create users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            sector TEXT NOT NULL,
            role TEXT NOT NULL
        )
    `);

    // Clear existing users for clean seed
    db.run(`DELETE FROM users`);

    // Insert dummy users based on the spreadsheet
    const insertStmt = db.prepare(`INSERT INTO users (email, password, sector, role) VALUES (?, ?, ?, ?)`);
    
    // Using simple emails for now (e.g. asistencia@aubasa.com.ar)
    insertStmt.run('compras@aubasa.com.ar', '6789', 'Compras', 'GCO');
    insertStmt.run('rrhh@aubasa.com.ar', '2222', 'Recursos Humanos', 'RRHH');
    insertStmt.run('sistemas@aubasa.com.ar', '3333', 'Sistemas', 'GS');
    insertStmt.run('operaciones@aubasa.com.ar', '4444', 'Operaciones', 'GO');
    insertStmt.run('comercial@aubasa.com.ar', '5555', 'Comercial', 'GC');
    insertStmt.run('ccm@aubasa.com.ar', '6666', 'Centro de Monitoreo', 'CCM');
    insertStmt.run('asistencia@aubasa.com.ar', '7777', 'Asistencia Vial', 'AV');
    insertStmt.run('sp@aubasa.com.ar', '8888', 'Seguridad Patrimonial', 'SP');
    insertStmt.run('legales@aubasa.com.ar', '9999', 'Legales', 'GAL');
    insertStmt.run('rrii@aubasa.com.ar', '1010', 'RRII', 'RRI');
    insertStmt.run('taller@aubasa.com.ar', '2020', 'Taller Mecanico', 'TM');
    insertStmt.run('admin@aubasa.com.ar', 'admin', 'Administración', 'ADMIN'); // extra for testing everything

    insertStmt.finalize();

    console.log('Users seeded successfully!');
});

db.close();

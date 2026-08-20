require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5001;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.resolve(__dirname, 'sofidya.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Create Documents table
        db.run(`CREATE TABLE IF NOT EXISTS Documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            documentType TEXT NOT NULL,
            version INTEGER DEFAULT 1,
            fileName TEXT NOT NULL,
            uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create Risks table
        db.run(`CREATE TABLE IF NOT EXISTS Risks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            title TEXT NOT NULL,
            likelihood INTEGER,
            impact INTEGER,
            status TEXT DEFAULT 'Open',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create Metrics table
        db.run(`CREATE TABLE IF NOT EXISTS Metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sector TEXT NOT NULL,
            year INTEGER NOT NULL,
            month TEXT NOT NULL,
            data TEXT NOT NULL,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(sector, year, month)
        )`);

        // Create VehicleRecords table
        db.run(`CREATE TABLE IF NOT EXISTS VehicleRecords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_ingreso TEXT,
            fecha TEXT NOT NULL,
            numero_patente TEXT NOT NULL,
            tipo_mantenimiento TEXT NOT NULL,
            falla_sistema_critico INTEGER NOT NULL DEFAULT 0,
            detalle_falla TEXT,
            doc_y_equipamiento TEXT NOT NULL DEFAULT 'Si',
            muertos_heridos_graves INTEGER DEFAULT 0,
            mes TEXT NOT NULL,
            anio INTEGER NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // Insert sample data if empty
        db.get('SELECT COUNT(*) as count FROM Documents', (err, row) => {
            if (row && row.count === 0) {
                db.run("INSERT INTO Documents (title, documentType, fileName) VALUES ('Política de Calidad', 'POL', 'politica_calidad.pdf')");
                db.run("INSERT INTO Documents (title, documentType, fileName) VALUES ('Procedimiento Auditoría', 'PROC', 'proc_auditoria.docx')");
            }
        });
        
        db.get('SELECT COUNT(*) as count FROM Risks', (err, row) => {
            if (row && row.count === 0) {
                db.run("INSERT INTO Risks (code, title, likelihood, impact) VALUES ('R-01', 'Riesgo Financiero', 2, 4)");
                db.run("INSERT INTO Risks (code, title, likelihood, impact) VALUES ('R-02', 'Riesgo Operativo', 3, 3)");
            }
        });
    });
}

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Sofidya Node.js API is running' });
});

// Documents Routes
app.get('/api/documents', (req, res) => {
    db.all('SELECT * FROM Documents', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/documents', (req, res) => {
    const { title, documentType, fileName } = req.body;
    db.run(
        'INSERT INTO Documents (title, documentType, fileName) VALUES (?, ?, ?)',
        [title, documentType, fileName],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, title, documentType, fileName });
        }
    );
});

// Auth Route
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Credenciales inválidas' });
        res.json(row);
    });
});

// Risks Routes
app.get('/api/risks', (req, res) => {
    db.all('SELECT * FROM Risks', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/risks', (req, res) => {
    const { code, title, likelihood, impact } = req.body;
    db.run(
        'INSERT INTO Risks (code, title, likelihood, impact) VALUES (?, ?, ?, ?)',
        [code, title, likelihood, impact],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, code, title, likelihood, impact });
        }
    );
});

// Metrics Routes
app.get('/api/metrics', (req, res) => {
    const { sector, year, month } = req.query;
    let query = 'SELECT * FROM Metrics WHERE 1=1';
    let params = [];
    if (sector) { query += ' AND sector = ?'; params.push(sector); }
    if (year) { query += ' AND year = ?'; params.push(year); }
    if (month) { query += ' AND month = ?'; params.push(month); }
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({...r, data: JSON.parse(r.data)})));
    });
});

app.post('/api/metrics', (req, res) => {
    const { sector, year, month, data } = req.body;
    const dataStr = JSON.stringify(data);
    
    db.run(
        `INSERT INTO Metrics (sector, year, month, data) 
         VALUES (?, ?, ?, ?) 
         ON CONFLICT(sector, year, month) 
         DO UPDATE SET data = excluded.data, updatedAt = CURRENT_TIMESTAMP`,
        [sector, year, month, dataStr],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID || this.changes });
        }
    );
});

// VehicleRecords Routes
app.get('/api/vehicles', (req, res) => {
    const { mes, anio } = req.query;
    let query = 'SELECT * FROM VehicleRecords WHERE 1=1';
    let params = [];
    if (mes) { query += ' AND mes = ?'; params.push(mes); }
    if (anio) { query += ' AND anio = ?'; params.push(anio); }
    query += ' ORDER BY createdAt DESC';
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/vehicles', (req, res) => {
    const { id_ingreso, fecha, numero_patente, tipo_mantenimiento, falla_sistema_critico, detalle_falla, doc_y_equipamiento, muertos_heridos_graves, mes, anio } = req.body;
    db.run(
        `INSERT INTO VehicleRecords (id_ingreso, fecha, numero_patente, tipo_mantenimiento, falla_sistema_critico, detalle_falla, doc_y_equipamiento, muertos_heridos_graves, mes, anio)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_ingreso, fecha, numero_patente, tipo_mantenimiento, falla_sistema_critico ? 1 : 0, detalle_falla, doc_y_equipamiento, muertos_heridos_graves || 0, mes, anio],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

app.put('/api/vehicles/:id', (req, res) => {
    const { id } = req.params;
    const { fecha, numero_patente, tipo_mantenimiento, falla_sistema_critico, detalle_falla, doc_y_equipamiento, muertos_heridos_graves } = req.body;
    db.run(
        `UPDATE VehicleRecords SET fecha=?, numero_patente=?, tipo_mantenimiento=?, falla_sistema_critico=?, detalle_falla=?, doc_y_equipamiento=?, muertos_heridos_graves=? WHERE id=?`,
        [fecha, numero_patente, tipo_mantenimiento, falla_sistema_critico ? 1 : 0, detalle_falla, doc_y_equipamiento, muertos_heridos_graves || 0, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.delete('/api/vehicles/:id', (req, res) => {
    db.run('DELETE FROM VehicleRecords WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Llama al conversor incluido en OnlyOffice Document Server (ConvertService)
// para pasar un archivo remoto de un formato a otro. Reintenta mientras el
// servicio devuelva endConvert:false (conversión todavía en curso).
async function convertirDocumento({ url, from, to }) {
    const key = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    for (let intento = 0; intento < 15; intento++) {
        const resp = await fetch(`${process.env.ONLYOFFICE_URL}/ConvertService.ashx`, {
            method: 'POST',
            // Sin "Accept: application/json" el servicio responde en XML aunque
            // el request sea JSON.
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ async: false, filetype: from, outputtype: to, key, title: `convert.${from}`, url })
        });
        const data = await resp.json();
        if (data.error) throw new Error(`Error de conversión OnlyOffice (código ${data.error})`);
        if (data.endConvert && data.fileUrl) return data.fileUrl;
        await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error('Timeout esperando la conversión de OnlyOffice');
}

// Antes de abrir el editor: se edita siempre el Word "maestro" persistido en
// docx_url. Si todavía no existe (primera vez que se edita este documento),
// se convierte una única vez desde el PDF y ese resultado queda guardado como
// maestro para siempre — las ediciones futuras nunca vuelven a re-derivar del
// PDF, así los arreglos manuales de formato (tablas, etc.) no se pierden.
app.post('/api/onlyoffice/preparar-edicion/:docId', async (req, res) => {
    try {
        const { data: doc, error: errDoc } = await supabase
            .from('sgi_documents')
            .select('*')
            .eq('id', req.params.docId)
            .single();
        if (errDoc) throw errDoc;

        // Formato en el que debe quedar pdf_url (el documento "activo") al guardar.
        const extActivo = (doc.pdf_url.split('.').pop() || 'pdf').split('?')[0].toLowerCase();

        if (doc.docx_url) {
            return res.json({ editUrl: doc.docx_url, fileType: 'docx', formatoFinal: extActivo });
        }

        if (extActivo === 'docx') {
            await supabase.from('sgi_documents').update({ docx_url: doc.pdf_url }).eq('id', doc.id);
            return res.json({ editUrl: doc.pdf_url, fileType: 'docx', formatoFinal: 'docx' });
        }

        const docxUrl = await convertirDocumento({ url: doc.pdf_url, from: extActivo, to: 'docx' });
        const buffer = Buffer.from(await (await fetch(docxUrl)).arrayBuffer());
        const nombre = `${doc.code}_${doc.version}_${Date.now()}_maestro.docx`;
        const { error: errUp } = await supabase.storage.from('sgi-pdfs').upload(nombre, buffer, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        if (errUp) throw errUp;

        const { data: urlData } = supabase.storage.from('sgi-pdfs').getPublicUrl(nombre);
        await supabase.from('sgi_documents').update({ docx_url: urlData.publicUrl }).eq('id', doc.id);

        res.json({ editUrl: urlData.publicUrl, fileType: 'docx', formatoFinal: extActivo });
    } catch (e) {
        console.error('[preparar-edicion] error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// OnlyOffice llama a este endpoint cuando el usuario guarda dentro del editor
// embebido. status 2 = MustSave, 6 = MustForceSave (documento listo para bajar
// de body.url). "fuente" indica qué se estaba editando:
//   - fuente=pdf (modo PDF directo, sin conversión): body.url ya es un PDF,
//     se sube tal cual como nuevo pdf_url. No toca docx_url.
//   - fuente=docx (modo Word): el Word editado se persiste SIEMPRE como el
//     nuevo docx_url maestro (para que la próxima edición en modo Word parta
//     de acá), y se regenera pdf_url convirtiéndolo.
app.post('/api/onlyoffice-callback/:docId', async (req, res) => {
    if (req.query.secret !== process.env.ONLYOFFICE_CALLBACK_SECRET) {
        return res.status(403).json({ error: 0 });
    }

    const body = req.body;
    if ((body.status === 2 || body.status === 6) && body.url) {
        try {
            const { data: doc, error: errDoc } = await supabase
                .from('sgi_documents')
                .select('*')
                .eq('id', req.params.docId)
                .single();
            if (errDoc) throw errDoc;

            const formatoFinal = (req.query.formatoFinal || 'pdf').toLowerCase();
            const fuente = (req.query.fuente || 'docx').toLowerCase();

            let update;
            if (fuente === 'pdf') {
                const bufferPdf = Buffer.from(await (await fetch(body.url)).arrayBuffer());
                const nombrePdf = `${doc.code}_${doc.version}_${Date.now()}_editado.pdf`;
                const { error: errUpPdf } = await supabase.storage.from('sgi-pdfs').upload(nombrePdf, bufferPdf, {
                    contentType: 'application/pdf'
                });
                if (errUpPdf) throw errUpPdf;
                const { data: urlPdfData } = supabase.storage.from('sgi-pdfs').getPublicUrl(nombrePdf);
                update = { pdf_url: urlPdfData.publicUrl };
            } else {
                const bufferDocx = Buffer.from(await (await fetch(body.url)).arrayBuffer());
                const nombreDocx = `${doc.code}_${doc.version}_${Date.now()}_maestro.docx`;
                const { error: errUpDocx } = await supabase.storage.from('sgi-pdfs').upload(nombreDocx, bufferDocx, {
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                });
                if (errUpDocx) throw errUpDocx;
                const { data: urlDocxData } = supabase.storage.from('sgi-pdfs').getPublicUrl(nombreDocx);

                update = { docx_url: urlDocxData.publicUrl };

                if (formatoFinal === 'docx') {
                    update.pdf_url = urlDocxData.publicUrl;
                } else {
                    const urlPdfConvertida = await convertirDocumento({ url: urlDocxData.publicUrl, from: 'docx', to: formatoFinal });
                    const bufferPdf = Buffer.from(await (await fetch(urlPdfConvertida)).arrayBuffer());
                    const nombrePdf = `${doc.code}_${doc.version}_${Date.now()}_editado.${formatoFinal}`;
                    const { error: errUpPdf } = await supabase.storage.from('sgi-pdfs').upload(nombrePdf, bufferPdf, {
                        contentType: 'application/pdf'
                    });
                    if (errUpPdf) throw errUpPdf;
                    const { data: urlPdfData } = supabase.storage.from('sgi-pdfs').getPublicUrl(nombrePdf);
                    update.pdf_url = urlPdfData.publicUrl;
                }
            }

            const { error: errUpd } = await supabase
                .from('sgi_documents')
                .update(update)
                .eq('id', req.params.docId);
            if (errUpd) throw errUpd;

            console.log(`[onlyoffice] documento ${req.params.docId} actualizado (fuente=${fuente}) -> ${Object.keys(update).join(', ')}`);
        } catch (e) {
            console.error('[onlyoffice-callback] error:', e.message);
        }
    }

    res.json({ error: 0 });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`- Health Check: http://localhost:${PORT}/api/health`);
    console.log(`- Documents: http://localhost:${PORT}/api/documents`);
    console.log(`- Risks: http://localhost:${PORT}/api/risks`);
    console.log(`- Vehicles: http://localhost:${PORT}/api/vehicles`);
});

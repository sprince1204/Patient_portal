const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { db, init } = require('./db');

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

init();

const app = express();
app.use(cors());
app.use(express.json());

// storage configuration (Multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_ ]/g, '');
    cb(null, `${uuidv4()}_${Date.now()}_${safeName}`);
  }
});

// Allowed File types
const allowedTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg"  // JPG/JPEG
];

// File type validation
const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, PNG, and JPG files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } 
}).single("file");


// Upload section
app.post('/documents/upload', (req, res) => {
  upload(req, res, err => {
    if (err) {
      
      const message = err.message || 'Upload error';
      return res.status(400).json({ success: false, message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const { originalname } = req.file;
    const filepath = req.file.path;
    const filesize = req.file.size;
    const createdAt = new Date().toISOString();

    const stmt = db.prepare('INSERT INTO documents (filename, filepath, filesize, created_at) VALUES (?, ?, ?, ?)');
    stmt.run(originalname, filepath, filesize, createdAt, function (dbErr) {
      if (dbErr) {
        console.error('DB insert error', dbErr);
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      res.json({ success: true, id: this.lastID, filename: originalname });
    });
    stmt.finalize();
  });
});

// List all documents
app.get('/documents', (req, res) => {
  db.all('SELECT id, filename, filepath, filesize, created_at FROM documents ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error' });
    
    const out = rows.map(r => ({
      id: r.id,
      filename: r.filename,
      filepath: path.basename(r.filepath),
      filesize: r.filesize,
      created_at: r.created_at
    }));
    res.json(out);
  });
});

// Download button
app.get('/documents/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error' });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    const fullPath = row.filepath;
    // to find whether file exists on disk or not

    if (!fs.existsSync(fullPath)) return res.status(404).json({ success: false, message: 'File not found on disk' });
    res.download(fullPath, row.filename, downloadErr => {
      if (downloadErr) console.error('Download error:', downloadErr);
    });
  });
});

// Delete function
app.delete('/documents/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error' });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    fs.unlink(row.filepath, fsErr => {
      if (fsErr && fsErr.code !== 'ENOENT') {
        console.error('FS delete error', fsErr);
        return res.status(500).json({ success: false, message: 'Could not delete file' });
      }
      db.run('DELETE FROM documents WHERE id = ?', [id], function (dbErr) {
        if (dbErr) return res.status(500).json({ success: false, message: 'DB delete error' });
        res.status(204).send();
      });
    });
  });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File must be under 10 MB" });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));

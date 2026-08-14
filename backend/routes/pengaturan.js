import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import db from '../db/init.js';

const router = express.Router();
const upload = multer({ dest: 'temp_uploads/' });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============ GET SEMUA PENGATURAN ============
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM pengaturan').all();
  const settings = {};
  rows.forEach(r => settings[r.key] = r.value);
  res.json({ success: true, data: settings });
});

// ============ SET PENGATURAN (mis: dark_mode) ============
router.put('/', (req, res) => {
  const { key, value } = req.body;
  db.prepare(`
    INSERT INTO pengaturan (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
  res.json({ success: true, message: 'Pengaturan disimpan.' });
});

// ============ BACKUP DATABASE ============
router.get('/backup', (req, res) => {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../db/dwirabpro.sqlite');
  const filename = `backup-dwirabpro-${new Date().toISOString().slice(0, 10)}.sqlite`;
  res.download(dbPath, filename);
});

// ============ RESTORE DATABASE ============
// PERHATIAN: proses ini mengganti seluruh database aktif dengan file backup yang diupload.
router.post('/restore', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File backup wajib diupload.' });

  const dbPath = process.env.DB_PATH || path.join(__dirname, '../db/dwirabpro.sqlite');

  try {
    // Salin file upload menimpa database aktif
    fs.copyFileSync(req.file.path, dbPath);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, message: 'Database berhasil direstore. Silakan restart server.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal restore: ' + err.message });
  }
});

export default router;

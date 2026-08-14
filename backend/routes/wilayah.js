import express from 'express';
import db from '../db/init.js';

const router = express.Router();

router.get('/provinsi', (req, res) => {
  const rows = db.prepare('SELECT * FROM provinsi ORDER BY nama').all();
  res.json({ success: true, data: rows });
});

router.post('/provinsi', (req, res) => {
  const { nama } = req.body;
  const result = db.prepare('INSERT INTO provinsi (nama) VALUES (?)').run(nama);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.get('/kabupaten/:provinsi_id', (req, res) => {
  const rows = db.prepare('SELECT * FROM kabupaten_kota WHERE provinsi_id = ? ORDER BY nama').all(req.params.provinsi_id);
  res.json({ success: true, data: rows });
});

router.post('/kabupaten', (req, res) => {
  const { nama, provinsi_id } = req.body;
  const result = db.prepare('INSERT INTO kabupaten_kota (nama, provinsi_id) VALUES (?, ?)').run(nama, provinsi_id);
  res.json({ success: true, id: result.lastInsertRowid });
});

export default router;

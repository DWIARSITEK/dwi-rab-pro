import express from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import db from '../db/init.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ============ LIST + SEARCH + FILTER + PAGINATION ============
// GET /api/materials?search=&kategori_id=&page=1&limit=50
router.get('/', (req, res) => {
  const { search = '', kategori_id, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE m.is_active = 1';
  const params = [];

  if (search) {
    where += ' AND (m.nama_material LIKE ? OR m.kode_material LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (kategori_id) {
    where += ' AND m.kategori_id = ?';
    params.push(kategori_id);
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM material m ${where}`).get(...params).c;

  const rows = db.prepare(`
    SELECT m.*, k.nama as kategori_nama
    FROM material m
    LEFT JOIN kategori_material k ON m.kategori_id = k.id
    ${where}
    ORDER BY m.nama_material ASC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ success: true, data: rows, total, page: parseInt(page), limit: parseInt(limit) });
});

// ============ DETAIL ============
router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM material WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Material tidak ditemukan.' });
  res.json({ success: true, data: item });
});

// ============ CREATE ============
router.post('/', (req, res) => {
  const { kode_material, nama_material, kategori_id, satuan, harga_satuan, spesifikasi } = req.body;
  if (!nama_material || !satuan) {
    return res.status(400).json({ success: false, message: 'Nama material dan satuan wajib diisi.' });
  }
  const result = db.prepare(`
    INSERT INTO material (kode_material, nama_material, kategori_id, satuan, harga_satuan, spesifikasi)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(kode_material || null, nama_material, kategori_id || null, satuan, harga_satuan || 0, spesifikasi || '');
  res.json({ success: true, id: result.lastInsertRowid, message: 'Material ditambahkan.' });
});

// ============ UPDATE ============
router.put('/:id', (req, res) => {
  const { kode_material, nama_material, kategori_id, satuan, harga_satuan, spesifikasi } = req.body;
  db.prepare(`
    UPDATE material SET kode_material=?, nama_material=?, kategori_id=?, satuan=?, harga_satuan=?, spesifikasi=?, updated_at=datetime('now')
    WHERE id=?
  `).run(kode_material, nama_material, kategori_id, satuan, harga_satuan, spesifikasi, req.params.id);
  res.json({ success: true, message: 'Material diperbarui.' });
});

// ============ DELETE (soft delete) ============
router.delete('/:id', (req, res) => {
  db.prepare(`UPDATE material SET is_active = 0 WHERE id = ?`).run(req.params.id);
  res.json({ success: true, message: 'Material dihapus.' });
});

// ============ IMPORT EXCEL ============
// Kolom yang diharapkan: kode_material | nama_material | kategori | satuan | harga_satuan | spesifikasi
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File Excel wajib diupload.' });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(req.file.buffer);
  const sheet = workbook.worksheets[0];

  const insert = db.prepare(`
    INSERT INTO material (kode_material, nama_material, kategori_id, satuan, harga_satuan, spesifikasi)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const findKategori = db.prepare('SELECT id FROM kategori_material WHERE nama = ?');
  const insertKategori = db.prepare('INSERT INTO kategori_material (nama) VALUES (?)');

  let count = 0;
  const errors = [];

  const rows = sheet.getRows(2, sheet.rowCount - 1) || [];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      const kode = row.getCell(1).value;
      const nama = row.getCell(2).value;
      const kategoriNama = row.getCell(3).value;
      const satuan = row.getCell(4).value;
      const harga = row.getCell(5).value;
      const spek = row.getCell(6).value;

      if (!nama || !satuan) continue;

      let kategoriId = null;
      if (kategoriNama) {
        const existing = findKategori.get(String(kategoriNama).trim());
        kategoriId = existing ? existing.id : insertKategori.run(String(kategoriNama).trim()).lastInsertRowid;
      }

      insert.run(kode ? String(kode) : null, String(nama), kategoriId, String(satuan), Number(harga) || 0, spek ? String(spek) : '');
      count++;
    }
  });

  try {
    insertMany(rows);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal import: ' + err.message });
  }

  res.json({ success: true, message: `${count} material berhasil diimport.`, count });
});

// ============ EXPORT EXCEL ============
router.get('/export/excel', async (req, res) => {
  const rows = db.prepare(`
    SELECT m.kode_material, m.nama_material, k.nama as kategori, m.satuan, m.harga_satuan, m.spesifikasi
    FROM material m LEFT JOIN kategori_material k ON m.kategori_id = k.id
    WHERE m.is_active = 1 ORDER BY m.nama_material
  `).all();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Database Material');
  sheet.columns = [
    { header: 'Kode Material', key: 'kode_material', width: 18 },
    { header: 'Nama Material', key: 'nama_material', width: 40 },
    { header: 'Kategori', key: 'kategori', width: 25 },
    { header: 'Satuan', key: 'satuan', width: 12 },
    { header: 'Harga Satuan', key: 'harga_satuan', width: 18 },
    { header: 'Spesifikasi', key: 'spesifikasi', width: 30 },
  ];
  sheet.addRows(rows);
  sheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=database-material.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

// ============ KATEGORI ============
router.get('/kategori/all', (req, res) => {
  const rows = db.prepare('SELECT * FROM kategori_material ORDER BY nama').all();
  res.json({ success: true, data: rows });
});

router.post('/kategori', (req, res) => {
  const { nama, parent_id } = req.body;
  const result = db.prepare('INSERT INTO kategori_material (nama, parent_id) VALUES (?, ?)').run(nama, parent_id || null);
  res.json({ success: true, id: result.lastInsertRowid });
});

export default router;

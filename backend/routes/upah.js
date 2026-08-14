import express from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import db from '../db/init.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ============ LIST + FILTER WILAYAH ============
router.get('/', (req, res) => {
  const { search = '', provinsi_id, kabupaten_id, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE u.is_active = 1';
  const params = [];

  if (search) {
    where += ' AND u.nama_pekerja LIKE ?';
    params.push(`%${search}%`);
  }
  if (provinsi_id) {
    where += ' AND u.provinsi_id = ?';
    params.push(provinsi_id);
  }
  if (kabupaten_id) {
    where += ' AND u.kabupaten_id = ?';
    params.push(kabupaten_id);
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM upah u ${where}`).get(...params).c;

  const rows = db.prepare(`
    SELECT u.*, p.nama as provinsi_nama, k.nama as kabupaten_nama
    FROM upah u
    LEFT JOIN provinsi p ON u.provinsi_id = p.id
    LEFT JOIN kabupaten_kota k ON u.kabupaten_id = k.id
    ${where}
    ORDER BY u.nama_pekerja ASC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ success: true, data: rows, total, page: parseInt(page), limit: parseInt(limit) });
});

// ============ CREATE ============
router.post('/', (req, res) => {
  const { kode_upah, nama_pekerja, satuan, harga_satuan, provinsi_id, kabupaten_id } = req.body;
  if (!nama_pekerja) return res.status(400).json({ success: false, message: 'Nama pekerja wajib diisi.' });

  const result = db.prepare(`
    INSERT INTO upah (kode_upah, nama_pekerja, satuan, harga_satuan, provinsi_id, kabupaten_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(kode_upah || null, nama_pekerja, satuan || 'OH', harga_satuan || 0, provinsi_id || null, kabupaten_id || null);

  res.json({ success: true, id: result.lastInsertRowid, message: 'Data upah ditambahkan.' });
});

// ============ UPDATE ============
router.put('/:id', (req, res) => {
  const { kode_upah, nama_pekerja, satuan, harga_satuan, provinsi_id, kabupaten_id } = req.body;
  db.prepare(`
    UPDATE upah SET kode_upah=?, nama_pekerja=?, satuan=?, harga_satuan=?, provinsi_id=?, kabupaten_id=?, updated_at=datetime('now')
    WHERE id=?
  `).run(kode_upah, nama_pekerja, satuan, harga_satuan, provinsi_id, kabupaten_id, req.params.id);
  res.json({ success: true, message: 'Data upah diperbarui.' });
});

// ============ DELETE ============
router.delete('/:id', (req, res) => {
  db.prepare(`UPDATE upah SET is_active = 0 WHERE id = ?`).run(req.params.id);
  res.json({ success: true, message: 'Data upah dihapus.' });
});

// ============ IMPORT EXCEL ============
// Kolom: kode_upah | nama_pekerja | satuan | harga_satuan | provinsi | kabupaten_kota
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File Excel wajib diupload.' });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(req.file.buffer);
  const sheet = workbook.worksheets[0];

  const findProvinsi = db.prepare('SELECT id FROM provinsi WHERE nama = ?');
  const insertProvinsi = db.prepare('INSERT INTO provinsi (nama) VALUES (?)');
  const findKabupaten = db.prepare('SELECT id FROM kabupaten_kota WHERE nama = ? AND provinsi_id = ?');
  const insertKabupaten = db.prepare('INSERT INTO kabupaten_kota (nama, provinsi_id) VALUES (?, ?)');
  const insert = db.prepare(`
    INSERT INTO upah (kode_upah, nama_pekerja, satuan, harga_satuan, provinsi_id, kabupaten_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const rows = sheet.getRows(2, sheet.rowCount - 1) || [];
  let count = 0;

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      const kode = row.getCell(1).value;
      const nama = row.getCell(2).value;
      const satuan = row.getCell(3).value;
      const harga = row.getCell(4).value;
      const provinsiNama = row.getCell(5).value;
      const kabupatenNama = row.getCell(6).value;

      if (!nama) continue;

      let provinsiId = null, kabupatenId = null;
      if (provinsiNama) {
        const p = findProvinsi.get(String(provinsiNama).trim());
        provinsiId = p ? p.id : insertProvinsi.run(String(provinsiNama).trim()).lastInsertRowid;
      }
      if (kabupatenNama && provinsiId) {
        const k = findKabupaten.get(String(kabupatenNama).trim(), provinsiId);
        kabupatenId = k ? k.id : insertKabupaten.run(String(kabupatenNama).trim(), provinsiId).lastInsertRowid;
      }

      insert.run(kode ? String(kode) : null, String(nama), satuan ? String(satuan) : 'OH', Number(harga) || 0, provinsiId, kabupatenId);
      count++;
    }
  });

  try {
    insertMany(rows);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal import: ' + err.message });
  }

  res.json({ success: true, message: `${count} data upah berhasil diimport.`, count });
});

// ============ EXPORT EXCEL ============
router.get('/export/excel', async (req, res) => {
  const rows = db.prepare(`
    SELECT u.kode_upah, u.nama_pekerja, u.satuan, u.harga_satuan, p.nama as provinsi, k.nama as kabupaten_kota
    FROM upah u
    LEFT JOIN provinsi p ON u.provinsi_id = p.id
    LEFT JOIN kabupaten_kota k ON u.kabupaten_id = k.id
    WHERE u.is_active = 1 ORDER BY u.nama_pekerja
  `).all();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Database Upah');
  sheet.columns = [
    { header: 'Kode Upah', key: 'kode_upah', width: 15 },
    { header: 'Nama Pekerja', key: 'nama_pekerja', width: 30 },
    { header: 'Satuan', key: 'satuan', width: 10 },
    { header: 'Harga Satuan', key: 'harga_satuan', width: 18 },
    { header: 'Provinsi', key: 'provinsi', width: 20 },
    { header: 'Kabupaten/Kota', key: 'kabupaten_kota', width: 20 },
  ];
  sheet.addRows(rows);
  sheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=database-upah.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

export default router;

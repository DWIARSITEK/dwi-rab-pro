import express from 'express';
import db from '../db/init.js';

const router = express.Router();

// ============ LIST AHSP ============
router.get('/', (req, res) => {
  const { search = '', jenis_rumah, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE a.is_active = 1';
  const params = [];

  if (search) {
    where += ' AND a.nama_pekerjaan LIKE ?';
    params.push(`%${search}%`);
  }
  if (jenis_rumah) {
    where += ' AND (a.jenis_rumah = ? OR a.jenis_rumah = ? OR a.jenis_rumah IS NULL)';
    params.push(jenis_rumah, 'Semua');
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM ahsp_pekerjaan a ${where}`).get(...params).c;

  const rows = db.prepare(`
    SELECT a.*, k.nama as kategori_nama
    FROM ahsp_pekerjaan a
    LEFT JOIN kategori_material k ON a.kategori_id = k.id
    ${where}
    ORDER BY a.nama_pekerjaan ASC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ success: true, data: rows, total, page: parseInt(page), limit: parseInt(limit) });
});

// ============ DETAIL AHSP + KOEFISIEN LENGKAP ============
router.get('/:id', (req, res) => {
  const ahsp = db.prepare('SELECT * FROM ahsp_pekerjaan WHERE id = ?').get(req.params.id);
  if (!ahsp) return res.status(404).json({ success: false, message: 'AHSP tidak ditemukan.' });

  const koefisien = db.prepare(`
    SELECT ak.*,
      m.nama_material, m.satuan as material_satuan, m.harga_satuan as material_harga,
      u.nama_pekerja, u.satuan as upah_satuan, u.harga_satuan as upah_harga
    FROM ahsp_koefisien ak
    LEFT JOIN material m ON ak.material_id = m.id
    LEFT JOIN upah u ON ak.upah_id = u.id
    WHERE ak.ahsp_id = ?
  `).all(req.params.id);

  res.json({ success: true, data: { ...ahsp, koefisien } });
});

// ============ CREATE AHSP (header + daftar koefisien sekaligus) ============
// body: { kode_ahsp, nama_pekerjaan, satuan, kategori_id, jenis_rumah, koefisien: [{tipe, material_id/upah_id, koefisien}] }
router.post('/', (req, res) => {
  const { kode_ahsp, nama_pekerjaan, satuan, kategori_id, jenis_rumah, koefisien } = req.body;

  if (!nama_pekerjaan || !satuan) {
    return res.status(400).json({ success: false, message: 'Nama pekerjaan dan satuan wajib diisi.' });
  }

  const insertAhsp = db.prepare(`
    INSERT INTO ahsp_pekerjaan (kode_ahsp, nama_pekerjaan, satuan, kategori_id, jenis_rumah)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertKoef = db.prepare(`
    INSERT INTO ahsp_koefisien (ahsp_id, tipe, material_id, upah_id, koefisien)
    VALUES (?, ?, ?, ?, ?)
  `);

  const trx = db.transaction(() => {
    const result = insertAhsp.run(kode_ahsp || null, nama_pekerjaan, satuan, kategori_id || null, jenis_rumah || 'Semua');
    const ahspId = result.lastInsertRowid;

    if (Array.isArray(koefisien)) {
      for (const k of koefisien) {
        insertKoef.run(
          ahspId,
          k.tipe,
          k.tipe === 'material' ? k.item_id : null,
          k.tipe === 'upah' ? k.item_id : null,
          k.koefisien
        );
      }
    }
    return ahspId;
  });

  const ahspId = trx();
  res.json({ success: true, id: ahspId, message: 'AHSP berhasil ditambahkan.' });
});

// ============ UPDATE AHSP (replace semua koefisien) ============
router.put('/:id', (req, res) => {
  const { kode_ahsp, nama_pekerjaan, satuan, kategori_id, jenis_rumah, koefisien } = req.body;

  const trx = db.transaction(() => {
    db.prepare(`
      UPDATE ahsp_pekerjaan SET kode_ahsp=?, nama_pekerjaan=?, satuan=?, kategori_id=?, jenis_rumah=?
      WHERE id=?
    `).run(kode_ahsp, nama_pekerjaan, satuan, kategori_id, jenis_rumah, req.params.id);

    db.prepare('DELETE FROM ahsp_koefisien WHERE ahsp_id = ?').run(req.params.id);

    const insertKoef = db.prepare(`
      INSERT INTO ahsp_koefisien (ahsp_id, tipe, material_id, upah_id, koefisien)
      VALUES (?, ?, ?, ?, ?)
    `);
    if (Array.isArray(koefisien)) {
      for (const k of koefisien) {
        insertKoef.run(
          req.params.id,
          k.tipe,
          k.tipe === 'material' ? k.item_id : null,
          k.tipe === 'upah' ? k.item_id : null,
          k.koefisien
        );
      }
    }
  });

  trx();
  res.json({ success: true, message: 'AHSP berhasil diperbarui.' });
});

// ============ DELETE AHSP ============
router.delete('/:id', (req, res) => {
  db.prepare(`UPDATE ahsp_pekerjaan SET is_active = 0 WHERE id = ?`).run(req.params.id);
  res.json({ success: true, message: 'AHSP dihapus.' });
});

export default router;

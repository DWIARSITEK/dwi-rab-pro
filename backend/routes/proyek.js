import express from 'express';
import db from '../db/init.js';

const router = express.Router();

// ============ LIST PROYEK ============
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT pr.*, p.nama as provinsi_nama, k.nama as kabupaten_nama
    FROM proyek pr
    LEFT JOIN provinsi p ON pr.provinsi_id = p.id
    LEFT JOIN kabupaten_kota k ON pr.kabupaten_id = k.id
    ORDER BY pr.created_at DESC
  `).all();

  res.json({
    success: true,
    data: rows
  });
});

// ============ DETAIL PROYEK (+ ringkasan BOQ) ============
router.get('/:id', (req, res) => {
  const proyek = db.prepare(
    'SELECT * FROM proyek WHERE id = ?'
  ).get(req.params.id);

  if (!proyek) {
    return res.status(404).json({
      success: false,
      message: 'Proyek tidak ditemukan.'
    });
  }

  const boqCount = db.prepare(`
    SELECT COUNT(*) as c
    FROM boq_item
    WHERE proyek_id = ?
  `).get(req.params.id).c;

  res.json({
    success: true,
    data: {
      ...proyek,
      jumlah_item_boq: boqCount
    }
  });
});

// ============ CREATE PROYEK ============
router.post('/', (req, res) => {
  const {
    nama_proyek,
    pemilik,
    alamat,
    provinsi_id,
    kabupaten_id,
    panjang,
    lebar,
    jumlah_lantai,
    jenis_rumah
  } = req.body;

  if (!nama_proyek || !panjang || !lebar) {
    return res.status(400).json({
      success: false,
      message: 'Nama proyek, panjang, dan lebar wajib diisi.'
    });
  }

  const luas = Number(panjang) * Number(lebar);

  const result = db.prepare(`
    INSERT INTO proyek (
      nama_proyek,
      pemilik,
      alamat,
      provinsi_id,
      kabupaten_id,
      panjang,
      lebar,
      luas,
      jumlah_lantai,
      jenis_rumah
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nama_proyek,
    pemilik || '',
    alamat || '',
    provinsi_id || null,
    kabupaten_id || null,
    panjang,
    lebar,
    luas,
    jumlah_lantai || 1,
    jenis_rumah || 'Minimalis'
  );

  res.json({
    success: true,
    id: result.lastInsertRowid,
    luas,
    message: 'Proyek berhasil dibuat.'
  });
});

// ============ UPDATE PROYEK ============
router.put('/:id', (req, res) => {
  const {
    nama_proyek,
    pemilik,
    alamat,
    provinsi_id,
    kabupaten_id,
    panjang,
    lebar,
    jumlah_lantai,
    jenis_rumah
  } = req.body;

  const luas = Number(panjang) * Number(lebar);

  db.prepare(`
    UPDATE proyek
    SET
      nama_proyek=?,
      pemilik=?,
      alamat=?,
      provinsi_id=?,
      kabupaten_id=?,
      panjang=?,
      lebar=?,
      luas=?,
      jumlah_lantai=?,
      jenis_rumah=?,
      updated_at=datetime('now')
    WHERE id=?
  `).run(
    nama_proyek,
    pemilik,
    alamat,
    provinsi_id,
    kabupaten_id,
    panjang,
    lebar,
    luas,
    jumlah_lantai,
    jenis_rumah,
    req.params.id
  );

  res.json({
    success: true,
    luas,
    message: 'Proyek diperbarui.'
  });
});

// ============ DELETE PROYEK ============
router.delete('/:id', (req, res) => {
  const proyekId = req.params.id;

  try {
    // Pastikan proyek ada
    const proyek = db.prepare(`
      SELECT id
      FROM proyek
      WHERE id = ?
    `).get(proyekId);

    if (!proyek) {
      return res.status(404).json({
        success: false,
        message: 'Proyek tidak ditemukan.'
      });
    }

    // Semua penghapusan dilakukan dalam satu transaksi.
    // Kalau salah satu gagal, semuanya dibatalkan.
    const hapusProyek = db.transaction(() => {

      // ==========================================
      // 1. Ambil semua BOQ ITEM milik proyek
      // ==========================================
      const boqItems = db.prepare(`
        SELECT id
        FROM boq_item
        WHERE proyek_id = ?
      `).all(proyekId);

      // ==========================================
      // 2. Hapus BOQ DETAIL
      //    Harus dilakukan sebelum boq_item
      // ==========================================
      const deleteBoqDetail = db.prepare(`
        DELETE FROM boq_detail
        WHERE boq_item_id = ?
      `);

      for (const item of boqItems) {
        deleteBoqDetail.run(item.id);
      }

      // ==========================================
      // 3. Hapus BOQ ITEM
      // ==========================================
      db.prepare(`
        DELETE FROM boq_item
        WHERE proyek_id = ?
      `).run(proyekId);

      // ==========================================
      // 4. Hapus riwayat laporan proyek
      // ==========================================
      db.prepare(`
        DELETE FROM laporan
        WHERE proyek_id = ?
      `).run(proyekId);

      // ==========================================
      // 5. Terakhir hapus proyek utama
      // ==========================================
      db.prepare(`
        DELETE FROM proyek
        WHERE id = ?
      `).run(proyekId);
    });

    // Jalankan transaksi
    hapusProyek();

    return res.json({
      success: true,
      message: 'Proyek dan seluruh data terkait berhasil dihapus.'
    });

  } catch (error) {
    console.error('Gagal menghapus proyek:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus proyek.',
      error: error.message
    });
  }
});

export default router;
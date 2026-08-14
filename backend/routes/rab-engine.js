import express from 'express';
import db from '../db/init.js';

const router = express.Router();

/**
 * MESIN HITUNG RAB
 * Prinsip: TIDAK ADA angka hardcode. Semua koefisien, harga material, dan harga upah
 * diambil murni dari database (ahsp_koefisien, material, upah).
 *
 * Alur kalkulasi:
 * 1. Ambil semua AHSP yang relevan dengan jenis_rumah proyek
 * 2. Untuk setiap AHSP, hitung volume pekerjaan (rumus volume disimpan per kategori,
 *    untuk versi awal ini pengguna bisa input volume manual per pekerjaan di step 2,
 *    atau sistem estimasi luas x koefisien luas per jenis pekerjaan jika sudah didefinisikan)
 * 3. Harga satuan pekerjaan = SUM(koefisien_material x harga_material) + SUM(koefisien_upah x harga_upah)
 * 4. Subtotal = volume x harga_satuan_pekerjaan
 * 5. Simpan ke boq_item + boq_detail agar bisa dibuka kembali di Daftar Proyek
 */

// Hitung harga satuan 1 pekerjaan AHSP berdasarkan koefisien di database
function hitungHargaSatuanAHSP(ahspId, provinsiId, kabupatenId) {
  const koefisien = db.prepare(`
    SELECT ak.tipe, ak.koefisien, ak.material_id, ak.upah_id
    FROM ahsp_koefisien ak
    WHERE ak.ahsp_id = ?
  `).all(ahspId);

  let total = 0;
  const rincian = [];

  for (const k of koefisien) {
    if (k.tipe === 'material') {
      const mat = db.prepare('SELECT * FROM material WHERE id = ?').get(k.material_id);
      if (!mat) continue;
      const subtotal = k.koefisien * mat.harga_satuan;
      total += subtotal;
      rincian.push({
        tipe: 'material', nama: mat.nama_material, satuan: mat.satuan,
        koefisien: k.koefisien, harga_satuan: mat.harga_satuan, subtotal
      });
    } else if (k.tipe === 'upah') {
      // Ambil harga upah sesuai wilayah proyek jika tersedia, fallback ke harga default upah tsb
      let upah = null;
      if (provinsiId && kabupatenId) {
        upah = db.prepare(`
          SELECT u2.* FROM upah u1
          JOIN upah u2 ON u2.nama_pekerja = u1.nama_pekerja
          WHERE u1.id = ? AND u2.provinsi_id = ? AND u2.kabupaten_id = ? AND u2.is_active = 1
          LIMIT 1
        `).get(k.upah_id, provinsiId, kabupatenId);
      }
      if (!upah) upah = db.prepare('SELECT * FROM upah WHERE id = ?').get(k.upah_id);
      if (!upah) continue;

      const subtotal = k.koefisien * upah.harga_satuan;
      total += subtotal;
      rincian.push({
        tipe: 'upah', nama: upah.nama_pekerja, satuan: upah.satuan,
        koefisien: k.koefisien, harga_satuan: upah.harga_satuan, subtotal
      });
    }
  }

  return { harga_satuan_pekerjaan: total, rincian };
}

// POST /api/rab/generate
// body: { proyek_id, jenis_rumah, pekerjaan: [{ ahsp_id, volume }] }
// "pekerjaan" adalah daftar item pekerjaan + volume yang dipilih pengguna di Mesin Hitung RAB
router.post('/generate', (req, res) => {
  const { proyek_id, pekerjaan } = req.body;

  if (!proyek_id || !Array.isArray(pekerjaan) || pekerjaan.length === 0) {
    return res.status(400).json({ success: false, message: 'proyek_id dan daftar pekerjaan wajib diisi.' });
  }

  const proyek = db.prepare('SELECT * FROM proyek WHERE id = ?').get(proyek_id);
  if (!proyek) return res.status(404).json({ success: false, message: 'Proyek tidak ditemukan.' });

  const insertBoqItem = db.prepare(`
    INSERT INTO boq_item (proyek_id, ahsp_id, nama_pekerjaan, satuan, volume, harga_satuan_pekerjaan, subtotal, kategori, urutan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertBoqDetail = db.prepare(`
    INSERT INTO boq_detail (boq_item_id, tipe, nama, satuan, koefisien, volume_kebutuhan, harga_satuan, subtotal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalMaterial = 0;
  let totalUpah = 0;
  let grandTotal = 0;

  const trx = db.transaction(() => {
    // Bersihkan BOQ lama untuk proyek ini (generate ulang = replace)
    db.prepare('DELETE FROM boq_item WHERE proyek_id = ?').run(proyek_id);

    let urutan = 0;
    for (const p of pekerjaan) {
      const ahsp = db.prepare('SELECT * FROM ahsp_pekerjaan WHERE id = ?').get(p.ahsp_id);
      if (!ahsp) continue;

      const { harga_satuan_pekerjaan, rincian } = hitungHargaSatuanAHSP(ahsp.id, proyek.provinsi_id, proyek.kabupaten_id);
      const volume = Number(p.volume) || 0;
      const subtotal = volume * harga_satuan_pekerjaan;

      const kategori = db.prepare('SELECT nama FROM kategori_material WHERE id = ?').get(ahsp.kategori_id);

      const boqResult = insertBoqItem.run(
        proyek_id, ahsp.id, ahsp.nama_pekerjaan, ahsp.satuan, volume,
        harga_satuan_pekerjaan, subtotal, kategori ? kategori.nama : 'Lainnya', urutan++
      );
      const boqItemId = boqResult.lastInsertRowid;

      for (const r of rincian) {
        const volumeKebutuhan = r.koefisien * volume;
        const subtotalDetail = volumeKebutuhan * r.harga_satuan;
        insertBoqDetail.run(boqItemId, r.tipe, r.nama, r.satuan, r.koefisien, volumeKebutuhan, r.harga_satuan, subtotalDetail);

        if (r.tipe === 'material') totalMaterial += subtotalDetail;
        else totalUpah += subtotalDetail;
      }

      grandTotal += subtotal;
    }

    db.prepare(`
      UPDATE proyek SET total_material = ?, total_upah = ?, grand_total = ?, status = 'Selesai', updated_at = datetime('now')
      WHERE id = ?
    `).run(totalMaterial, totalUpah, grandTotal, proyek_id);
  });

  trx();

  res.json({
    success: true,
    message: 'RAB berhasil digenerate.',
    ringkasan: { total_material: totalMaterial, total_upah: totalUpah, grand_total: grandTotal }
  });
});

// GET /api/rab/boq/:proyek_id  -> ambil BOQ + RAB lengkap suatu proyek
router.get('/boq/:proyek_id', (req, res) => {
  const items = db.prepare(`
    SELECT * FROM boq_item WHERE proyek_id = ? ORDER BY urutan ASC
  `).all(req.params.proyek_id);

  const itemsWithDetail = items.map(item => {
    const detail = db.prepare('SELECT * FROM boq_detail WHERE boq_item_id = ?').all(item.id);
    return { ...item, detail };
  });

  res.json({ success: true, data: itemsWithDetail });
});

export default router;

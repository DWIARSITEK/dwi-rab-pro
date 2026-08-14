import express from 'express';
import db from '../db/init.js';

const router = express.Router();

/**
 * MESIN RAB OTOMATIS
 * ====================================================================
 * Prinsip: pengguna cukup isi Nama Proyek, Panjang, Lebar, Model Rumah,
 * dan Jumlah Lantai. Sistem menghitung SEMUA volume pekerjaan secara
 * otomatis pakai rumus estimasi arsitektur standar, lalu mengalikan
 * dengan harga satuan pekerjaan (dari AHSP + Database Material/Upah)
 * untuk menghasilkan RAB yang detail — tanpa pengguna perlu pilih
 * pekerjaan satu-satu.
 *
 * CATATAN PENTING: rumus di bawah adalah ESTIMASI/ASUMSI STANDAR
 * (rule of thumb yang umum dipakai di tahap awal perencanaan), BUKAN
 * hasil perhitungan gambar kerja/DED yang sudah digambar detail oleh
 * arsitek. Untuk keperluan resmi (kontrak, pengajuan bank, dll),
 * tetap disarankan direview oleh arsitek/QS berlisensi.
 * ====================================================================
 */

// Asumsi standar yang dipakai dalam perhitungan
const ASUMSI = {
  tinggiLantai: 3.5,          // meter per lantai
  faktorBukaan: 0.75,          // 25% dinding adalah pintu/jendela (tidak dipasang bata penuh)
  faktorKemiringanAtap: 1.2,   // luas atap miring vs luas dasar bangunan
  kedalamanGalianPondasi: 0.8, // meter
  lebarGalianPondasi: 0.6,     // meter
  rasioBetonStruktur: 0.05,    // m3 beton struktur per m2 luas lantai
  rasioBetonDak: 0.12,         // m3 beton dak per m2 luas lantai (untuk lantai tambahan)
};

// Tentukan "tier" spesifikasi material berdasarkan model rumah yang dipilih
// standard = lebih hemat (bata merah, keramik 40x40, closet jongkok)
// modern   = lebih premium (bata ringan/hebel, keramik 60x60, closet duduk)
function getTier(modelRumah) {
  const modernTierModels = ['Modern', 'Premium', 'Japandi', 'Industrial', 'Kontemporer'];
  return modernTierModels.includes(modelRumah) ? 'modern' : 'standard';
}

// Hitung semua volume pekerjaan berdasarkan dimensi rumah
function hitungVolumePekerjaan({ panjang, lebar, jumlahLantai, modelRumah }) {
  const P = Number(panjang);
  const L = Number(lebar);
  const lantai = Number(jumlahLantai);
  const tier = getTier(modelRumah);

  const luasDasar = P * L;                       // luas 1 lantai
  const totalLuasLantai = luasDasar * lantai;     // total luas semua lantai
  const keliling = 2 * (P + L);
  const luasDindingKotor = keliling * ASUMSI.tinggiLantai * lantai;
  const luasDindingBersih = luasDindingKotor * ASUMSI.faktorBukaan;
  const luasAtap = luasDasar * ASUMSI.faktorKemiringanAtap; // hanya 1x (atap paling atas)
  const jumlahKM = Math.max(1, lantai); // asumsi 1 kamar mandi per lantai

  // volume[kode_ahsp] = angka volume pekerjaan
  const volume = {
    'AHSP-001': luasDasar,                                                  // Pembersihan Lahan
    'AHSP-002': keliling,                                                   // Bouwplank
    'AHSP-003': keliling * ASUMSI.kedalamanGalianPondasi * ASUMSI.lebarGalianPondasi, // Galian Tanah
    'AHSP-004': keliling * ASUMSI.kedalamanGalianPondasi * ASUMSI.lebarGalianPondasi * 0.3, // Urugan Kembali
    'AHSP-005': keliling * ASUMSI.lebarGalianPondasi * 0.1,                 // Urugan Pasir Pondasi
    'AHSP-006': keliling * ASUMSI.lebarGalianPondasi * 0.7,                 // Pasangan Pondasi Batu Kali
    'AHSP-007': keliling * ASUMSI.lebarGalianPondasi * 0.2,                 // Batu Kosong Anstamping
    'AHSP-008': totalLuasLantai * ASUMSI.rasioBetonStruktur,                // Beton Struktur (sloof/kolom/ring balok)
    'AHSP-009': lantai > 1 ? luasDasar * (lantai - 1) * ASUMSI.rasioBetonDak : 0, // Cor Dak (lantai 2+)

    // Dinding: pilih bata merah (standard) atau bata ringan (modern) sesuai tier
    ...(tier === 'standard'
      ? { 'AHSP-010': luasDindingBersih }
      : { 'AHSP-011': luasDindingBersih }),
    'AHSP-012': luasDindingBersih * 2,   // Plesteran (2 sisi)
    'AHSP-013': luasDindingBersih * 2,   // Acian (2 sisi)

    'AHSP-014': luasAtap,                // Rangka Atap Baja Ringan
    'AHSP-015': luasAtap,                // Penutup Genteng Metal
    'AHSP-016': Math.max(P, L),          // Nok Atap
    'AHSP-017': keliling,                // Lisplank GRC

    // Lantai: keramik 40x40 (standard) atau 60x60 (modern)
    ...(tier === 'standard'
      ? { 'AHSP-019': totalLuasLantai }
      : { 'AHSP-020': totalLuasLantai }),
    'AHSP-021': jumlahKM * 6,            // Keramik Dinding KM
    'AHSP-022': keliling * lantai * 0.8, // Plint Keramik

    'AHSP-023': totalLuasLantai,         // Plafon Gypsum
    'AHSP-024': jumlahKM * 4,            // Plafon GRC Area Basah
    'AHSP-025': keliling * lantai * 0.8, // List Profil Plafon

    'AHSP-026': totalLuasLantai * 0.15,  // Kusen Alumunium
    'AHSP-027': lantai + Math.round(luasDasar / 30), // Daun Pintu Panel Kayu
    'AHSP-028': jumlahKM,                // Daun Pintu PVC (KM)
    'AHSP-029': totalLuasLantai * 0.1,   // Kaca Jendela

    'AHSP-030': Math.round(totalLuasLantai / 9),  // Titik Lampu
    'AHSP-031': Math.round(totalLuasLantai / 12), // Titik Stop Kontak
    'AHSP-032': Math.round(totalLuasLantai / 15) + lantai, // Titik Saklar
    'AHSP-033': 1,                       // Panel Listrik

    'AHSP-034': keliling * lantai * 0.3, // Pipa Air Bersih
    'AHSP-035': keliling * lantai * 0.2, // Pipa Air Kotor

    // Sanitasi: closet jongkok (standard) atau closet duduk (modern)
    ...(tier === 'standard'
      ? { 'AHSP-037': jumlahKM }
      : { 'AHSP-036': jumlahKM }),
    'AHSP-038': jumlahKM,                // Wastafel
    'AHSP-039': 1,                       // Septic Tank Biofil

    'AHSP-040': luasDindingBersih,       // Cat Dinding Interior
    'AHSP-041': keliling * ASUMSI.tinggiLantai * lantai * ASUMSI.faktorBukaan, // Cat Dinding Eksterior
    'AHSP-042': totalLuasLantai,         // Cat Plafon
  };

  return { volume, ringkasan: { luasDasar, totalLuasLantai, keliling, luasDindingBersih, luasAtap, jumlahKM, tier } };
}

// Hitung harga satuan 1 pekerjaan AHSP dari koefisien di database (sama seperti rab-engine.js)
function hitungHargaSatuanAHSP(ahspId, provinsiId, kabupatenId) {
  const koefisien = db.prepare(`
    SELECT ak.tipe, ak.koefisien, ak.material_id, ak.upah_id
    FROM ahsp_koefisien ak WHERE ak.ahsp_id = ?
  `).all(ahspId);

  let total = 0;
  const rincian = [];

  for (const k of koefisien) {
    if (k.tipe === 'material') {
      const mat = db.prepare('SELECT * FROM material WHERE id = ?').get(k.material_id);
      if (!mat) continue;
      const subtotal = k.koefisien * mat.harga_satuan;
      total += subtotal;
      rincian.push({ tipe: 'material', nama: mat.nama_material, satuan: mat.satuan, koefisien: k.koefisien, harga_satuan: mat.harga_satuan, subtotal });
    } else if (k.tipe === 'upah') {
      let upah = null;
      if (provinsiId && kabupatenId) {
        upah = db.prepare(`
          SELECT u2.* FROM upah u1 JOIN upah u2 ON u2.nama_pekerja = u1.nama_pekerja
          WHERE u1.id = ? AND u2.provinsi_id = ? AND u2.kabupaten_id = ? AND u2.is_active = 1 LIMIT 1
        `).get(k.upah_id, provinsiId, kabupatenId);
      }
      if (!upah) upah = db.prepare('SELECT * FROM upah WHERE id = ?').get(k.upah_id);
      if (!upah) continue;
      const subtotal = k.koefisien * upah.harga_satuan;
      total += subtotal;
      rincian.push({ tipe: 'upah', nama: upah.nama_pekerja, satuan: upah.satuan, koefisien: k.koefisien, harga_satuan: upah.harga_satuan, subtotal });
    }
  }
  return { harga_satuan_pekerjaan: total, rincian };
}

// POST /api/rab/generate-otomatis
// body: { nama_proyek, pemilik, alamat, provinsi_id, kabupaten_id, panjang, lebar, jumlah_lantai, model_rumah }
router.post('/generate-otomatis', (req, res) => {
  const { nama_proyek, pemilik, alamat, provinsi_id, kabupaten_id, panjang, lebar, jumlah_lantai, model_rumah } = req.body;

  if (!nama_proyek || !panjang || !lebar || !jumlah_lantai || !model_rumah) {
    return res.status(400).json({ success: false, message: 'Nama proyek, panjang, lebar, jumlah lantai, dan model rumah wajib diisi.' });
  }

  const luas = Number(panjang) * Number(lebar);

  const trx = db.transaction(() => {
    // 1. Buat proyek baru
    const proyekResult = db.prepare(`
      INSERT INTO proyek (nama_proyek, pemilik, alamat, provinsi_id, kabupaten_id, panjang, lebar, luas, jumlah_lantai, jenis_rumah)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(nama_proyek, pemilik || '', alamat || '', provinsi_id || null, kabupaten_id || null, panjang, lebar, luas, jumlah_lantai, model_rumah);
    const proyekId = proyekResult.lastInsertRowid;

    // 2. Hitung volume otomatis
    const { volume, ringkasan } = hitungVolumePekerjaan({ panjang, lebar, jumlahLantai: jumlah_lantai, modelRumah: model_rumah });

    // 3. Generate BOQ dari volume otomatis
    const insertBoqItem = db.prepare(`
      INSERT INTO boq_item (proyek_id, ahsp_id, nama_pekerjaan, satuan, volume, harga_satuan_pekerjaan, subtotal, kategori, urutan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertBoqDetail = db.prepare(`
      INSERT INTO boq_detail (boq_item_id, tipe, nama, satuan, koefisien, volume_kebutuhan, harga_satuan, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let totalMaterial = 0, totalUpah = 0, grandTotal = 0, urutan = 0;

    for (const [kodeAhsp, vol] of Object.entries(volume)) {
      if (!vol || vol <= 0) continue;

      const ahsp = db.prepare('SELECT * FROM ahsp_pekerjaan WHERE kode_ahsp = ? AND is_active = 1').get(kodeAhsp);
      if (!ahsp) continue;

      const { harga_satuan_pekerjaan, rincian } = hitungHargaSatuanAHSP(ahsp.id, provinsi_id, kabupaten_id);
      const volumeBulat = Math.round(vol * 100) / 100;
      const subtotal = volumeBulat * harga_satuan_pekerjaan;

      const kategori = db.prepare('SELECT nama FROM kategori_material WHERE id = ?').get(ahsp.kategori_id);

      const boqResult = insertBoqItem.run(
        proyekId, ahsp.id, ahsp.nama_pekerjaan, ahsp.satuan, volumeBulat,
        harga_satuan_pekerjaan, subtotal, kategori ? kategori.nama : 'Lainnya', urutan++
      );
      const boqItemId = boqResult.lastInsertRowid;

      for (const r of rincian) {
        const volumeKebutuhan = r.koefisien * volumeBulat;
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
    `).run(totalMaterial, totalUpah, grandTotal, proyekId);

    return { proyekId, ringkasan, totalMaterial, totalUpah, grandTotal };
  });

  try {
    const result = trx();
    res.json({
      success: true,
      message: 'RAB berhasil digenerate otomatis.',
      proyek_id: result.proyekId,
      ringkasan: result.ringkasan,
      total: { total_material: result.totalMaterial, total_upah: result.totalUpah, grand_total: result.grandTotal }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal generate RAB otomatis: ' + err.message });
  }
});

export default router;

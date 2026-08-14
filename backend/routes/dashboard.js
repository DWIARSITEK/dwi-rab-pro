import express from 'express';
import db from '../db/init.js';

const router = express.Router();

router.get('/summary', (req, res) => {
  const jumlahProyek = db.prepare('SELECT COUNT(*) as c FROM proyek').get().c;
  const nilaiTotalRab = db.prepare('SELECT COALESCE(SUM(grand_total), 0) as t FROM proyek').get().t;
  const totalLuas = db.prepare('SELECT COALESCE(SUM(luas), 0) as t FROM proyek').get().t;
  const totalLaporan = db.prepare('SELECT COUNT(*) as c FROM laporan').get().c;

  // Statistik grafik: nilai RAB per bulan (6 bulan terakhir)
  const grafikBulanan = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as bulan, SUM(grand_total) as total, COUNT(*) as jumlah_proyek
    FROM proyek
    WHERE created_at >= datetime('now', '-6 months')
    GROUP BY bulan
    ORDER BY bulan ASC
  `).all();

  // Statistik jenis rumah
  const grafikJenisRumah = db.prepare(`
    SELECT jenis_rumah, COUNT(*) as jumlah
    FROM proyek
    GROUP BY jenis_rumah
  `).all();

  res.json({
    success: true,
    data: {
      jumlah_proyek: jumlahProyek,
      nilai_total_rab: nilaiTotalRab,
      total_luas_bangunan: totalLuas,
      total_laporan: totalLaporan,
      grafik_bulanan: grafikBulanan,
      grafik_jenis_rumah: grafikJenisRumah
    }
  });
});

export default router;

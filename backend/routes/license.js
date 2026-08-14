import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import db from '../db/init.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// Batasi percobaan aktivasi agar tidak brute-force kode lisensi
const activationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.' }
});

function logAttempt(kode, status, req) {
  db.prepare(
    `INSERT INTO license_logs (kode_lisensi, status, ip_address, user_agent) VALUES (?, ?, ?, ?)`
  ).run(kode, status, req.ip, req.headers['user-agent'] || '');
}

// POST /api/license/activate
router.post('/activate', activationLimiter, (req, res) => {
  const { kode_lisensi } = req.body;

  if (!kode_lisensi || kode_lisensi.trim() === '') {
    return res.status(400).json({ success: false, message: 'Kode lisensi wajib diisi.' });
  }

  const license = db.prepare('SELECT * FROM licenses WHERE kode_lisensi = ?').get(kode_lisensi.trim());

  if (!license) {
    logAttempt(kode_lisensi, 'failed', req);
    return res.status(404).json({ success: false, message: 'Kode lisensi tidak ditemukan.' });
  }

  if (license.status !== 'Aktif') {
    logAttempt(kode_lisensi, 'failed', req);
    return res.status(403).json({ success: false, message: 'Lisensi nonaktif. Silakan hubungi admin DWI ARSITEK.' });
  }

  if (license.tanggal_kedaluwarsa && new Date(license.tanggal_kedaluwarsa) < new Date()) {
    logAttempt(kode_lisensi, 'expired', req);
    return res.status(403).json({ success: false, message: 'Lisensi sudah kedaluwarsa. Silakan perpanjang lisensi Anda.' });
  }

  // Set tanggal aktivasi pertama kali jika belum ada
  if (!license.tanggal_aktivasi) {
    db.prepare('UPDATE licenses SET tanggal_aktivasi = datetime(\'now\') WHERE id = ?').run(license.id);
  }

  logAttempt(kode_lisensi, 'success', req);

  const token = jwt.sign(
    { kode_lisensi: license.kode_lisensi, nama_pemilik: license.nama_pemilik },
    JWT_SECRET,
    { expiresIn: '7d' } // token browser expire 7 hari, tapi status selalu dicek ulang ke DB tiap request
  );

  return res.json({
    success: true,
    message: 'Lisensi berhasil diaktivasi.',
    token,
    license: {
      nama_pemilik: license.nama_pemilik,
      status: license.status,
      tanggal_kedaluwarsa: license.tanggal_kedaluwarsa
    }
  });
});

// GET /api/license/status  (cek status pakai token yang tersimpan di frontend)
router.get('/status', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Tidak ada sesi aktif.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const license = db.prepare('SELECT * FROM licenses WHERE kode_lisensi = ?').get(decoded.kode_lisensi);

    if (!license) return res.status(404).json({ success: false, message: 'Lisensi tidak ditemukan.' });
    if (license.status !== 'Aktif') return res.status(403).json({ success: false, message: 'Lisensi nonaktif.' });
    if (license.tanggal_kedaluwarsa && new Date(license.tanggal_kedaluwarsa) < new Date()) {
      return res.status(403).json({ success: false, message: 'Lisensi kedaluwarsa.' });
    }

    return res.json({
      success: true,
      license: {
        nama_pemilik: license.nama_pemilik,
        status: license.status,
        tanggal_kedaluwarsa: license.tanggal_kedaluwarsa
      }
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Sesi tidak valid.' });
  }
});

export default router;

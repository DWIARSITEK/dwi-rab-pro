import jwt from 'jsonwebtoken';
import db from '../db/init.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// ============ MIDDLEWARE: Verifikasi token lisensi ============
// Dipakai untuk melindungi semua route selain /api/license/*
export function requireLicense(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token lisensi tidak ditemukan. Silakan aktivasi ulang.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verifikasi ulang status lisensi ke database (bukan hanya percaya token)
    const license = db.prepare('SELECT * FROM licenses WHERE kode_lisensi = ?').get(decoded.kode_lisensi);

    if (!license) {
      return res.status(401).json({ success: false, message: 'Lisensi tidak ditemukan.' });
    }
    if (license.status !== 'Aktif') {
      return res.status(403).json({ success: false, message: 'Lisensi nonaktif. Hubungi admin.' });
    }
    if (license.tanggal_kedaluwarsa && new Date(license.tanggal_kedaluwarsa) < new Date()) {
      return res.status(403).json({ success: false, message: 'Lisensi sudah kedaluwarsa. Silakan perpanjang.' });
    }

    req.license = license;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau kedaluwarsa.' });
  }
}

// ============ MIDDLEWARE: Verifikasi admin ============
export function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses admin ditolak.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bukan akun admin.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token admin tidak valid.' });
  }
}

export { JWT_SECRET };

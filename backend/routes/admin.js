import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from '../db/init.js';
import { JWT_SECRET, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ============ LOGIN ADMIN ============
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ success: false, message: 'Username atau password salah.' });
  }

  const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ success: true, token });
});

// Semua route di bawah ini wajib login admin
router.use(requireAdmin);

// ============ LIST SEMUA LISENSI ============
router.get('/licenses', (req, res) => {
  const licenses = db.prepare('SELECT * FROM licenses ORDER BY created_at DESC').all();
  res.json({ success: true, data: licenses });
});

// ============ BUAT LISENSI BARU ============
router.post('/licenses', (req, res) => {
  const { nama_pemilik, email, whatsapp, masa_berlaku_hari, catatan } = req.body;

  if (!nama_pemilik) {
    return res.status(400).json({ success: false, message: 'Nama pemilik wajib diisi.' });
  }

  const kode_lisensi = `DWIRAB-${nanoid(10).toUpperCase()}`;
  const hari = parseInt(masa_berlaku_hari) || 365;

  const stmt = db.prepare(`
    INSERT INTO licenses (kode_lisensi, nama_pemilik, email, whatsapp, status, tanggal_kedaluwarsa, catatan)
    VALUES (?, ?, ?, ?, 'Aktif', datetime('now', '+${hari} days'), ?)
  `);
  const result = stmt.run(kode_lisensi, nama_pemilik, email || '', whatsapp || '', catatan || '');

  res.json({ success: true, message: 'Lisensi berhasil dibuat.', kode_lisensi, id: result.lastInsertRowid });
});

// ============ AKTIFKAN LISENSI ============
router.put('/licenses/:id/activate', (req, res) => {
  db.prepare(`UPDATE licenses SET status = 'Aktif', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  res.json({ success: true, message: 'Lisensi diaktifkan.' });
});

// ============ NONAKTIFKAN LISENSI ============
router.put('/licenses/:id/deactivate', (req, res) => {
  db.prepare(`UPDATE licenses SET status = 'Nonaktif', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  res.json({ success: true, message: 'Lisensi dinonaktifkan.' });
});

// ============ PERPANJANG LISENSI ============
router.put('/licenses/:id/extend', (req, res) => {
  const { tambahan_hari } = req.body;
  const hari = parseInt(tambahan_hari) || 365;

  const license = db.prepare('SELECT * FROM licenses WHERE id = ?').get(req.params.id);
  if (!license) return res.status(404).json({ success: false, message: 'Lisensi tidak ditemukan.' });

  // Perpanjang dari tanggal kedaluwarsa lama jika masih berlaku, atau dari sekarang jika sudah lewat
  const baseDate = license.tanggal_kedaluwarsa && new Date(license.tanggal_kedaluwarsa) > new Date()
    ? `'${license.tanggal_kedaluwarsa}'`
    : `datetime('now')`;

  db.prepare(`
    UPDATE licenses
    SET tanggal_kedaluwarsa = datetime(${baseDate}, '+${hari} days'), status = 'Aktif', updated_at = datetime('now')
    WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true, message: 'Lisensi berhasil diperpanjang.' });
});

// ============ HAPUS LISENSI ============
router.delete('/licenses/:id', (req, res) => {
  db.prepare('DELETE FROM licenses WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Lisensi dihapus.' });
});

// ============ EDIT DATA LISENSI ============
router.put('/licenses/:id', (req, res) => {
  const { nama_pemilik, email, whatsapp, catatan } = req.body;
  db.prepare(`
    UPDATE licenses SET nama_pemilik = ?, email = ?, whatsapp = ?, catatan = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(nama_pemilik, email, whatsapp, catatan, req.params.id);
  res.json({ success: true, message: 'Data lisensi diperbarui.' });
});

export default router;

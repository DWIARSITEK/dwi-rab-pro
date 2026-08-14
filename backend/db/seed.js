import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from './init.js';

// ============ 1. BUAT ADMIN DEFAULT ============
const existingAdmin = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
if (!existingAdmin) {
  const passwordHash = bcrypt.hashSync('admin123', 10); // WAJIB DIGANTI setelah login pertama
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', passwordHash);
  console.log('✅ Admin default dibuat -> username: admin | password: admin123 (SEGERA GANTI!)');
} else {
  console.log('ℹ️  Admin sudah ada, dilewati.');
}

// ============ 2. BUAT LISENSI CONTOH UNTUK TESTING ============
const existingLicense = db.prepare('SELECT * FROM licenses WHERE kode_lisensi = ?').get('DWIRAB-DEMO0001');
if (!existingLicense) {
  db.prepare(`
    INSERT INTO licenses (kode_lisensi, nama_pemilik, email, whatsapp, status, tanggal_kedaluwarsa, catatan)
    VALUES (?, ?, ?, ?, 'Aktif', datetime('now', '+365 days'), ?)
  `).run(
    'DWIRAB-DEMO0001',
    'Pengguna Demo',
    'demo@dwiarsitek.com',
    '081234567890',
    'Lisensi contoh untuk testing'
  );

  console.log('✅ Lisensi demo dibuat -> kode: DWIRAB-DEMO0001 (berlaku 365 hari)');
} else {
  console.log('ℹ️  Lisensi demo sudah ada, dilewati.');
}

// ============ 3. LISENSI DWI ARSITEK 2026 ============
const lisensiDwiArsitek = db
  .prepare('SELECT * FROM licenses WHERE kode_lisensi = ?')
  .get('DWIRAB-ARSITEK2026');

if (!lisensiDwiArsitek) {
  db.prepare(`
    INSERT INTO licenses (
      kode_lisensi,
      nama_pemilik,
      email,
      whatsapp,
      status,
      tanggal_kedaluwarsa,
      catatan
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'DWIRAB-ARSITEK2026',
    'Pembeli Lisensi',
    '',
    '',
    'Aktif',
    '2027-08-14 05:39:07',
    'Lisensi DWI RAB PRO SNI 2026'
  );

  console.log('✅ Lisensi DWI ARSITEK 2026 berhasil dibuat.');
} else {
  console.log('ℹ️  Lisensi DWI ARSITEK 2026 sudah ada, dilewati.');
}

// ============ 4. SEED PROVINSI DASAR ============
const provinsiList = [
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'DI Yogyakarta',
  'Banten', 'Bali', 'Sumatera Utara', 'Sumatera Barat', 'Sumatera Selatan',
  'Kalimantan Timur', 'Sulawesi Selatan'
];

const insertProvinsi = db.prepare('INSERT OR IGNORE INTO provinsi (nama) VALUES (?)');
for (const p of provinsiList) insertProvinsi.run(p);
console.log(`✅ ${provinsiList.length} provinsi dasar disiapkan.`);

// ============ 5. SEED KATEGORI MATERIAL DASAR ============
const kategoriList = [
  'Pekerjaan Persiapan', 'Pekerjaan Tanah', 'Pekerjaan Pondasi', 'Pekerjaan Struktur',
  'Pekerjaan Dinding', 'Pekerjaan Atap', 'Pekerjaan Lantai', 'Pekerjaan Plafon',
  'Pekerjaan Pintu & Jendela', 'Pekerjaan Instalasi Listrik', 'Pekerjaan Instalasi Air & Sanitasi',
  'Pekerjaan Pengecatan', 'Material Pendukung (Paku, Sekrup, Baut, dll)'
];

const insertKategori = db.prepare('INSERT OR IGNORE INTO kategori_material (nama) VALUES (?)');

for (const k of kategoriList) {
  insertKategori.run(k);
}

console.log(`✅ ${kategoriList.length} kategori material dasar disiapkan.`);

console.log('\n🎉 Seeding selesai. Jalankan "npm run dev" untuk memulai server.');
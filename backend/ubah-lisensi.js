import db from './db/init.js';

const kodeLisensi = 'DWIRAB-ARSITEK2026';
const namaPemilikBaru = 'Pembeli Lisensi';

const license = db
  .prepare('SELECT * FROM licenses WHERE kode_lisensi = ?')
  .get(kodeLisensi);

if (!license) {
  console.log(`❌ Lisensi ${kodeLisensi} tidak ditemukan.`);
  db.close();
  process.exit(1);
}

db.prepare(`
  UPDATE licenses
  SET nama_pemilik = ?,
      updated_at = datetime('now')
  WHERE id = ?
`).run(namaPemilikBaru, license.id);

console.log('');
console.log('====================================');
console.log('✅ DATA LISENSI BERHASIL DIUBAH');
console.log('====================================');
console.log(`Kode    : ${kodeLisensi}`);
console.log(`Pemilik : ${namaPemilikBaru}`);
console.log(`Status  : ${license.status}`);
console.log(`Expired : ${license.tanggal_kedaluwarsa}`);
console.log('====================================');
console.log('');

db.close();
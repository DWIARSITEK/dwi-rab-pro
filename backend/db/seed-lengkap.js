import db from './init.js';

console.log('🚀 Memulai seeding database LENGKAP (material, upah, AHSP)...\n');
console.log('⚠️  CATATAN: Semua harga di bawah adalah HARGA UMUM/INDIKATIF hasil estimasi');
console.log('   pasar secara umum, BUKAN harga resmi HSPK Dinas PU per daerah.');
console.log('   Sesuaikan dengan harga wilayah Anda via menu Database Material & Upah.\n');

// ============================================================
// HELPER
// ============================================================
function getKategoriId(nama) {
  const row = db.prepare('SELECT id FROM kategori_material WHERE nama = ?').get(nama);
  if (!row) {
    const result = db.prepare('INSERT INTO kategori_material (nama) VALUES (?)').run(nama);
    return result.lastInsertRowid;
  }
  return row.id;
}

// ============================================================
// 1. DATABASE MATERIAL (harga umum/indikatif, dalam Rupiah)
// ============================================================
const materials = [
  // --- Pekerjaan Persiapan ---
  ['PST-001', 'Patok kayu 5/7', 'Pekerjaan Persiapan', 'Bh', 5000],
  ['PST-002', 'Benang nylon', 'Pekerjaan Persiapan', 'Rol', 8000],
  ['PST-003', 'Kayu bouwplank 2/20', 'Pekerjaan Persiapan', 'M', 25000],
  ['PST-004', 'Terpal plastik', 'Pekerjaan Persiapan', 'M2', 12000],

  // --- Pekerjaan Tanah ---
  ['TNH-001', 'Pasir urug', 'Pekerjaan Tanah', 'M3', 250000],

  // --- Pekerjaan Pondasi ---
  ['PDS-001', 'Batu kali / batu belah', 'Pekerjaan Pondasi', 'M3', 350000],
  ['PDS-002', 'Pasir pasang', 'Pekerjaan Pondasi', 'M3', 280000],
  ['PDS-003', 'Semen PC 40kg (Portland Composite)', 'Pekerjaan Pondasi', 'Sak', 68000],
  ['PDS-004', 'Batu kosong (anstamping)', 'Pekerjaan Pondasi', 'M3', 320000],

  // --- Pekerjaan Struktur ---
  ['STR-001', 'Besi beton polos diameter 8mm', 'Pekerjaan Struktur', 'Kg', 14500],
  ['STR-002', 'Besi beton polos diameter 10mm', 'Pekerjaan Struktur', 'Kg', 14000],
  ['STR-003', 'Besi beton ulir diameter 12mm', 'Pekerjaan Struktur', 'Kg', 14200],
  ['STR-004', 'Besi beton ulir diameter 13mm', 'Pekerjaan Struktur', 'Kg', 14200],
  ['STR-005', 'Besi beton ulir diameter 16mm', 'Pekerjaan Struktur', 'Kg', 14300],
  ['STR-006', 'Kawat bendrat', 'Pekerjaan Struktur', 'Kg', 22000],
  ['STR-007', 'Semen PC 40kg', 'Pekerjaan Struktur', 'Sak', 68000],
  ['STR-008', 'Pasir beton', 'Pekerjaan Struktur', 'M3', 300000],
  ['STR-009', 'Split / koral beton 1-2cm', 'Pekerjaan Struktur', 'M3', 350000],
  ['STR-010', 'Multiplek 12mm (bekisting)', 'Pekerjaan Struktur', 'Lbr', 165000],
  ['STR-011', 'Kayu kaso 5/7 (perancah)', 'Pekerjaan Struktur', 'M', 22000],
  ['STR-012', 'Paku bekisting 7-10cm', 'Pekerjaan Struktur', 'Kg', 20000],
  ['STR-013', 'Minyak bekisting', 'Pekerjaan Struktur', 'Ltr', 25000],

  // --- Pekerjaan Dinding ---
  ['DND-001', 'Bata merah press', 'Pekerjaan Dinding', 'Bh', 900],
  ['DND-002', 'Bata ringan / hebel 60x20x10', 'Pekerjaan Dinding', 'Bh', 12500],
  ['DND-003', 'Semen instan (mortar pasang bata ringan)', 'Pekerjaan Dinding', 'Sak', 75000],
  ['DND-004', 'Semen PC 40kg', 'Pekerjaan Dinding', 'Sak', 68000],
  ['DND-005', 'Pasir pasang', 'Pekerjaan Dinding', 'M3', 280000],

  // --- Pekerjaan Atap ---
  ['ATP-001', 'Baja ringan kanal C75.75 (kuda-kuda)', 'Pekerjaan Atap', 'M', 45000],
  ['ATP-002', 'Reng baja ringan', 'Pekerjaan Atap', 'M', 22000],
  ['ATP-003', 'Genteng metal pasir', 'Pekerjaan Atap', 'Lbr', 45000],
  ['ATP-004', 'Genteng beton', 'Pekerjaan Atap', 'Bh', 6500],
  ['ATP-005', 'Nok genteng metal', 'Pekerjaan Atap', 'M', 55000],
  ['ATP-006', 'Sekrup baja ringan', 'Pekerjaan Atap', 'Bh', 500],
  ['ATP-007', 'Lisplank GRC 20cm', 'Pekerjaan Atap', 'M', 65000],
  ['ATP-008', 'Talang air PVC/seng', 'Pekerjaan Atap', 'M', 85000],
  ['ATP-009', 'Waterproofing membran/coating dak', 'Pekerjaan Atap', 'M2', 95000],

  // --- Pekerjaan Lantai ---
  ['LTI-001', 'Keramik lantai 40x40 KW1', 'Pekerjaan Lantai', 'M2', 65000],
  ['LTI-002', 'Keramik lantai 60x60 KW1', 'Pekerjaan Lantai', 'M2', 95000],
  ['LTI-003', 'Keramik dinding KM 20x25', 'Pekerjaan Lantai', 'M2', 60000],
  ['LTI-004', 'Semen PC 40kg', 'Pekerjaan Lantai', 'Sak', 68000],
  ['LTI-005', 'Pasir pasang', 'Pekerjaan Lantai', 'M3', 280000],
  ['LTI-006', 'Nat keramik', 'Pekerjaan Lantai', 'Kg', 15000],
  ['LTI-007', 'Semen instan (tile adhesive)', 'Pekerjaan Lantai', 'Sak', 80000],
  ['LTI-008', 'Plint keramik', 'Pekerjaan Lantai', 'M', 25000],

  // --- Pekerjaan Plafon ---
  ['PLF-001', 'Gypsum board 9mm (120x240)', 'Pekerjaan Plafon', 'Lbr', 75000],
  ['PLF-002', 'Rangka hollow galvanis 2x4', 'Pekerjaan Plafon', 'Btg', 45000],
  ['PLF-003', 'Rangka hollow galvanis 4x4', 'Pekerjaan Plafon', 'Btg', 55000],
  ['PLF-004', 'Compound gypsum', 'Pekerjaan Plafon', 'Kg', 15000],
  ['PLF-005', 'Paper tape gypsum', 'Pekerjaan Plafon', 'Rol', 18000],
  ['PLF-006', 'Sekrup gypsum', 'Pekerjaan Plafon', 'Kg', 25000],
  ['PLF-007', 'List profil gypsum', 'Pekerjaan Plafon', 'M', 15000],
  ['PLF-008', 'GRC board 4mm (area basah)', 'Pekerjaan Plafon', 'Lbr', 85000],

  // --- Pekerjaan Pintu & Jendela ---
  ['PJD-001', 'Kusen alumunium 4 inch', 'Pekerjaan Pintu & Jendela', 'M', 85000],
  ['PJD-002', 'Daun pintu panel kayu engineering', 'Pekerjaan Pintu & Jendela', 'Bh', 850000],
  ['PJD-003', 'Daun pintu PVC (kamar mandi)', 'Pekerjaan Pintu & Jendela', 'Bh', 450000],
  ['PJD-004', 'Kaca bening 5mm', 'Pekerjaan Pintu & Jendela', 'M2', 145000],
  ['PJD-005', 'Engsel pintu', 'Pekerjaan Pintu & Jendela', 'Bh', 15000],
  ['PJD-006', 'Handle pintu + kunci tanam', 'Pekerjaan Pintu & Jendela', 'Set', 185000],
  ['PJD-007', 'Grendel jendela', 'Pekerjaan Pintu & Jendela', 'Bh', 12000],
  ['PJD-008', 'Kaca nako', 'Pekerjaan Pintu & Jendela', 'Bh', 18000],
  ['PJD-009', 'Sealant kaca', 'Pekerjaan Pintu & Jendela', 'Tube', 35000],

  // --- Pekerjaan Instalasi Listrik ---
  ['LST-001', 'Kabel NYM 2x1.5mm', 'Pekerjaan Instalasi Listrik', 'M', 8500],
  ['LST-002', 'Kabel NYM 3x2.5mm', 'Pekerjaan Instalasi Listrik', 'M', 13500],
  ['LST-003', 'Pipa conduit PVC 5/8', 'Pekerjaan Instalasi Listrik', 'M', 4500],
  ['LST-004', 'Saklar tunggal', 'Pekerjaan Instalasi Listrik', 'Bh', 25000],
  ['LST-005', 'Saklar ganda', 'Pekerjaan Instalasi Listrik', 'Bh', 35000],
  ['LST-006', 'Stop kontak', 'Pekerjaan Instalasi Listrik', 'Bh', 30000],
  ['LST-007', 'Fitting lampu', 'Pekerjaan Instalasi Listrik', 'Bh', 15000],
  ['LST-008', 'Lampu LED 10W', 'Pekerjaan Instalasi Listrik', 'Bh', 35000],
  ['LST-009', 'MCB 1 phase', 'Pekerjaan Instalasi Listrik', 'Bh', 45000],
  ['LST-010', 'Box panel listrik kecil', 'Pekerjaan Instalasi Listrik', 'Bh', 85000],
  ['LST-011', 'Isolasi listrik', 'Pekerjaan Instalasi Listrik', 'Rol', 8000],

  // --- Pekerjaan Instalasi Air & Sanitasi ---
  ['AIR-001', 'Pipa PVC 1/2 inch (air bersih)', 'Pekerjaan Instalasi Air & Sanitasi', 'M', 12000],
  ['AIR-002', 'Pipa PVC 3/4 inch', 'Pekerjaan Instalasi Air & Sanitasi', 'M', 15000],
  ['AIR-003', 'Pipa PVC 3 inch (air kotor)', 'Pekerjaan Instalasi Air & Sanitasi', 'M', 45000],
  ['AIR-004', 'Pipa PVC 4 inch (kloset)', 'Pekerjaan Instalasi Air & Sanitasi', 'M', 65000],
  ['AIR-005', 'Fitting PVC (knee/tee/sok campuran)', 'Pekerjaan Instalasi Air & Sanitasi', 'Bh', 6000],
  ['AIR-006', 'Lem pipa PVC', 'Pekerjaan Instalasi Air & Sanitasi', 'Klg', 25000],
  ['AIR-007', 'Kran air tembok', 'Pekerjaan Instalasi Air & Sanitasi', 'Bh', 45000],
  ['AIR-008', 'Kran wastafel', 'Pekerjaan Instalasi Air & Sanitasi', 'Bh', 85000],
  ['AIR-009', 'Closet jongkok', 'Pekerjaan Instalasi Air & Sanitasi', 'Bh', 350000],
  ['AIR-010', 'Closet duduk', 'Pekerjaan Instalasi Air & Sanitasi', 'Bh', 950000],
  ['AIR-011', 'Wastafel', 'Pekerjaan Instalasi Air & Sanitasi', 'Bh', 450000],
  ['AIR-012', 'Floor drain', 'Pekerjaan Instalasi Air & Sanitasi', 'Bh', 35000],
  ['AIR-013', 'Septic tank biofil', 'Pekerjaan Instalasi Air & Sanitasi', 'Unit', 4500000],
  ['AIR-014', 'Bak kontrol', 'Pekerjaan Instalasi Air & Sanitasi', 'Bh', 150000],

  // --- Pekerjaan Pengecatan ---
  ['CAT-001', 'Cat tembok interior', 'Pekerjaan Pengecatan', 'Kg', 32000],
  ['CAT-002', 'Cat tembok eksterior (weathershield)', 'Pekerjaan Pengecatan', 'Kg', 45000],
  ['CAT-003', 'Cat dasar / alkali resisting primer', 'Pekerjaan Pengecatan', 'Kg', 28000],
  ['CAT-004', 'Plamir tembok', 'Pekerjaan Pengecatan', 'Kg', 12000],
  ['CAT-005', 'Amplas', 'Pekerjaan Pengecatan', 'Lbr', 3000],
  ['CAT-006', 'Cat kayu/besi (meni + top coat)', 'Pekerjaan Pengecatan', 'Kg', 55000],

  // --- Material Pendukung ---
  ['SUP-001', 'Paku beton', 'Material Pendukung (Paku, Sekrup, Baut, dll)', 'Kg', 25000],
  ['SUP-002', 'Paku kayu 5cm', 'Material Pendukung (Paku, Sekrup, Baut, dll)', 'Kg', 20000],
  ['SUP-003', 'Paku kayu 7cm', 'Material Pendukung (Paku, Sekrup, Baut, dll)', 'Kg', 20000],
  ['SUP-004', 'Paku kayu 10cm', 'Material Pendukung (Paku, Sekrup, Baut, dll)', 'Kg', 21000],
  ['SUP-005', 'Sekrup gypsum', 'Material Pendukung (Paku, Sekrup, Baut, dll)', 'Kg', 25000],
  ['SUP-006', 'Sekrup baja ringan', 'Material Pendukung (Paku, Sekrup, Baut, dll)', 'Kg', 28000],
  ['SUP-007', 'Baut dynabolt', 'Material Pendukung (Paku, Sekrup, Baut, dll)', 'Bh', 3500],
  ['SUP-008', 'Mur baut', 'Material Pendukung (Paku, Sekrup, Baut, dll)', 'Bh', 2000],
  ['SUP-009', 'Kawat bendrat', 'Material Pendukung (Paku, Sekrup, Baut, dll)', 'Kg', 22000],
  ['SUP-010', 'Lem PVC/pipa', 'Material Pendukung (Paku, Sekrup, Baut, dll)', 'Klg', 25000],
  ['SUP-011', 'Lem kayu', 'Material Pendukung (Paku, Sekrup, Baut, dll)', 'Klg', 18000],
  ['SUP-012', 'Isolasi / lakban', 'Material Pendukung (Paku, Sekrup, Baut, dll)', 'Rol', 8000],
  ['SUP-013', 'Sealant / silicone', 'Material Pendukung (Paku, Sekrup, Baut, dll)', 'Tube', 35000],
];

const insertMaterial = db.prepare(`
  INSERT INTO material (kode_material, nama_material, kategori_id, satuan, harga_satuan)
  VALUES (?, ?, ?, ?, ?)
`);
const checkMaterial = db.prepare('SELECT id FROM material WHERE kode_material = ?');

let materialCount = 0;
const materialIds = {}; // nama_material -> id (untuk referensi AHSP)

const insertMaterials = db.transaction(() => {
  for (const [kode, nama, kategoriNama, satuan, harga] of materials) {
    const existing = checkMaterial.get(kode);
    if (existing) {
      materialIds[nama] = existing.id;
      continue;
    }
    const kategoriId = getKategoriId(kategoriNama);
    const result = insertMaterial.run(kode, nama, kategoriId, satuan, harga);
    materialIds[nama] = result.lastInsertRowid;
    materialCount++;
  }
});
insertMaterials();
console.log(`✅ ${materialCount} material baru ditambahkan (total referensi: ${materials.length}).`);

// ============================================================
// 2. DATABASE UPAH (harga umum/indikatif per Orang/Hari)
// ============================================================
const upahList = [
  ['UPH-001', 'Mandor', 'OH', 150000],
  ['UPH-002', 'Kepala Tukang Batu', 'OH', 130000],
  ['UPH-003', 'Tukang Batu', 'OH', 120000],
  ['UPH-004', 'Kepala Tukang Kayu', 'OH', 130000],
  ['UPH-005', 'Tukang Kayu', 'OH', 120000],
  ['UPH-006', 'Kepala Tukang Besi', 'OH', 130000],
  ['UPH-007', 'Tukang Besi', 'OH', 120000],
  ['UPH-008', 'Tukang Cat', 'OH', 115000],
  ['UPH-009', 'Tukang Listrik', 'OH', 130000],
  ['UPH-010', 'Tukang Pipa / Ledeng', 'OH', 125000],
  ['UPH-011', 'Tukang Atap / Baja Ringan', 'OH', 125000],
  ['UPH-012', 'Pekerja / Laden', 'OH', 100000],
];

const insertUpah = db.prepare(`
  INSERT INTO upah (kode_upah, nama_pekerja, satuan, harga_satuan)
  VALUES (?, ?, ?, ?)
`);
const checkUpah = db.prepare('SELECT id FROM upah WHERE kode_upah = ?');

let upahCount = 0;
const upahIds = {};

const insertUpahAll = db.transaction(() => {
  for (const [kode, nama, satuan, harga] of upahList) {
    const existing = checkUpah.get(kode);
    if (existing) {
      upahIds[nama] = existing.id;
      continue;
    }
    const result = insertUpah.run(kode, nama, satuan, harga);
    upahIds[nama] = result.lastInsertRowid;
    upahCount++;
  }
});
insertUpahAll();
console.log(`✅ ${upahCount} data upah baru ditambahkan (total referensi: ${upahList.length}).`);

// ============================================================
// 3. DATABASE AHSP + KOEFISIEN (koefisien acuan umum, per satuan pekerjaan)
// ============================================================
// Format: [kode, nama_pekerjaan, satuan, kategori, jenis_rumah, [ [tipe, nama_item, koefisien], ... ] ]
const ahspList = [
  // --- Persiapan ---
  ['AHSP-001', 'Pembersihan Lahan', 'M2', 'Pekerjaan Persiapan', 'Semua', [
    ['upah', 'Pekerja / Laden', 0.100],
  ]],
  ['AHSP-002', 'Pengukuran & Pemasangan Bouwplank', 'M', 'Pekerjaan Persiapan', 'Semua', [
    ['material', 'Kayu bouwplank 2/20', 1.000],
    ['material', 'Patok kayu 5/7', 0.400],
    ['material', 'Paku kayu 5cm', 0.020],
    ['upah', 'Tukang Kayu', 0.100],
    ['upah', 'Pekerja / Laden', 0.100],
  ]],

  // --- Tanah ---
  ['AHSP-003', 'Galian Tanah Pondasi', 'M3', 'Pekerjaan Tanah', 'Semua', [
    ['upah', 'Pekerja / Laden', 0.750],
    ['upah', 'Mandor', 0.025],
  ]],
  ['AHSP-004', 'Urugan Tanah Kembali', 'M3', 'Pekerjaan Tanah', 'Semua', [
    ['upah', 'Pekerja / Laden', 0.300],
  ]],
  ['AHSP-005', 'Urugan Pasir Bawah Pondasi', 'M3', 'Pekerjaan Tanah', 'Semua', [
    ['material', 'Pasir urug', 1.020],
    ['upah', 'Pekerja / Laden', 0.300],
  ]],

  // --- Pondasi ---
  ['AHSP-006', 'Pasangan Pondasi Batu Kali 1:5', 'M3', 'Pekerjaan Pondasi', 'Semua', [
    ['material', 'Batu kali / batu belah', 1.200],
    ['material', 'Semen PC 40kg (Portland Composite)', 2.500],
    ['material', 'Pasir pasang', 0.520],
    ['upah', 'Kepala Tukang Batu', 0.100],
    ['upah', 'Tukang Batu', 0.600],
    ['upah', 'Pekerja / Laden', 1.500],
    ['upah', 'Mandor', 0.075],
  ]],
  ['AHSP-007', 'Pasangan Batu Kosong (Anstamping)', 'M3', 'Pekerjaan Pondasi', 'Semua', [
    ['material', 'Batu kosong (anstamping)', 1.200],
    ['upah', 'Tukang Batu', 0.400],
    ['upah', 'Pekerja / Laden', 1.000],
  ]],

  // --- Struktur ---
  ['AHSP-008', 'Beton Bertulang Sloof/Kolom/Ring Balok K-175 (termasuk besi & bekisting)', 'M3', 'Pekerjaan Struktur', 'Semua', [
    ['material', 'Semen PC 40kg', 6.800],
    ['material', 'Pasir beton', 0.540],
    ['material', 'Split / koral beton 1-2cm', 0.810],
    ['material', 'Besi beton ulir diameter 12mm', 90.000],
    ['material', 'Kawat bendrat', 1.350],
    ['material', 'Multiplek 12mm (bekisting)', 0.350],
    ['material', 'Kayu kaso 5/7 (perancah)', 4.000],
    ['material', 'Paku bekisting 7-10cm', 0.400],
    ['material', 'Minyak bekisting', 0.500],
    ['upah', 'Kepala Tukang Batu', 0.150],
    ['upah', 'Tukang Batu', 1.650],
    ['upah', 'Kepala Tukang Besi', 0.100],
    ['upah', 'Tukang Besi', 1.100],
    ['upah', 'Kepala Tukang Kayu', 0.080],
    ['upah', 'Tukang Kayu', 0.900],
    ['upah', 'Pekerja / Laden', 3.500],
    ['upah', 'Mandor', 0.200],
  ]],
  ['AHSP-009', 'Cor Dak / Plat Lantai Beton Bertulang K-175', 'M3', 'Pekerjaan Struktur', 'Modern', [
    ['material', 'Semen PC 40kg', 6.800],
    ['material', 'Pasir beton', 0.540],
    ['material', 'Split / koral beton 1-2cm', 0.810],
    ['material', 'Besi beton ulir diameter 10mm', 100.000],
    ['material', 'Kawat bendrat', 1.500],
    ['material', 'Multiplek 12mm (bekisting)', 0.500],
    ['material', 'Kayu kaso 5/7 (perancah)', 6.000],
    ['upah', 'Tukang Batu', 1.800],
    ['upah', 'Tukang Besi', 1.200],
    ['upah', 'Tukang Kayu', 1.200],
    ['upah', 'Pekerja / Laden', 4.000],
    ['upah', 'Mandor', 0.220],
  ]],

  // --- Dinding ---
  ['AHSP-010', 'Pasangan Dinding Bata Merah 1/2 Batu (1:4)', 'M2', 'Pekerjaan Dinding', 'Semua', [
    ['material', 'Bata merah press', 70.000],
    ['material', 'Semen PC 40kg', 0.230],
    ['material', 'Pasir pasang', 0.043],
    ['upah', 'Kepala Tukang Batu', 0.030],
    ['upah', 'Tukang Batu', 0.300],
    ['upah', 'Pekerja / Laden', 0.600],
    ['upah', 'Mandor', 0.015],
  ]],
  ['AHSP-011', 'Pasangan Dinding Bata Ringan (Hebel)', 'M2', 'Pekerjaan Dinding', 'Semua', [
    ['material', 'Bata ringan / hebel 60x20x10', 8.500],
    ['material', 'Semen instan (mortar pasang bata ringan)', 0.120],
    ['upah', 'Tukang Batu', 0.200],
    ['upah', 'Pekerja / Laden', 0.300],
  ]],
  ['AHSP-012', 'Plesteran Dinding 1:4 Tebal 15mm', 'M2', 'Pekerjaan Dinding', 'Semua', [
    ['material', 'Semen PC 40kg', 0.130],
    ['material', 'Pasir pasang', 0.023],
    ['upah', 'Tukang Batu', 0.200],
    ['upah', 'Pekerja / Laden', 0.300],
  ]],
  ['AHSP-013', 'Acian Dinding', 'M2', 'Pekerjaan Dinding', 'Semua', [
    ['material', 'Semen PC 40kg', 0.040],
    ['upah', 'Tukang Batu', 0.150],
    ['upah', 'Pekerja / Laden', 0.150],
  ]],

  // --- Atap ---
  ['AHSP-014', 'Rangka Atap Baja Ringan', 'M2', 'Pekerjaan Atap', 'Semua', [
    ['material', 'Baja ringan kanal C75.75 (kuda-kuda)', 1.300],
    ['material', 'Reng baja ringan', 1.500],
    ['material', 'Sekrup baja ringan', 12.000],
    ['upah', 'Tukang Atap / Baja Ringan', 0.250],
    ['upah', 'Pekerja / Laden', 0.150],
  ]],
  ['AHSP-015', 'Penutup Atap Genteng Metal Pasir', 'M2', 'Pekerjaan Atap', 'Semua', [
    ['material', 'Genteng metal pasir', 1.050],
    ['upah', 'Tukang Atap / Baja Ringan', 0.150],
    ['upah', 'Pekerja / Laden', 0.100],
  ]],
  ['AHSP-016', 'Pasang Nok Atap', 'M', 'Pekerjaan Atap', 'Semua', [
    ['material', 'Nok genteng metal', 1.050],
    ['upah', 'Tukang Atap / Baja Ringan', 0.100],
  ]],
  ['AHSP-017', 'Pasang Lisplank GRC', 'M', 'Pekerjaan Atap', 'Semua', [
    ['material', 'Lisplank GRC 20cm', 1.050],
    ['material', 'Sekrup baja ringan', 6.000],
    ['upah', 'Tukang Kayu', 0.100],
    ['upah', 'Pekerja / Laden', 0.100],
  ]],
  ['AHSP-018', 'Waterproofing Atap Dak', 'M2', 'Pekerjaan Atap', 'Modern', [
    ['material', 'Waterproofing membran/coating dak', 1.100],
    ['upah', 'Tukang Cat', 0.100],
    ['upah', 'Pekerja / Laden', 0.100],
  ]],

  // --- Lantai ---
  ['AHSP-019', 'Pasang Keramik Lantai 40x40', 'M2', 'Pekerjaan Lantai', 'Semua', [
    ['material', 'Keramik lantai 40x40 KW1', 1.030],
    ['material', 'Semen PC 40kg', 0.180],
    ['material', 'Pasir pasang', 0.045],
    ['material', 'Nat keramik', 0.500],
    ['upah', 'Tukang Batu', 0.250],
    ['upah', 'Pekerja / Laden', 0.250],
  ]],
  ['AHSP-020', 'Pasang Keramik Lantai 60x60', 'M2', 'Pekerjaan Lantai', 'Modern', [
    ['material', 'Keramik lantai 60x60 KW1', 1.030],
    ['material', 'Semen instan (tile adhesive)', 0.150],
    ['material', 'Nat keramik', 0.400],
    ['upah', 'Tukang Batu', 0.280],
    ['upah', 'Pekerja / Laden', 0.250],
  ]],
  ['AHSP-021', 'Pasang Keramik Dinding Kamar Mandi 20x25', 'M2', 'Pekerjaan Lantai', 'Semua', [
    ['material', 'Keramik dinding KM 20x25', 1.030],
    ['material', 'Semen PC 40kg', 0.180],
    ['material', 'Pasir pasang', 0.040],
    ['material', 'Nat keramik', 0.500],
    ['upah', 'Tukang Batu', 0.300],
    ['upah', 'Pekerja / Laden', 0.250],
  ]],
  ['AHSP-022', 'Pasang Plint Keramik', 'M', 'Pekerjaan Lantai', 'Semua', [
    ['material', 'Plint keramik', 1.050],
    ['material', 'Semen PC 40kg', 0.030],
    ['upah', 'Tukang Batu', 0.100],
  ]],

  // --- Plafon ---
  ['AHSP-023', 'Rangka + Penutup Plafon Gypsum', 'M2', 'Pekerjaan Plafon', 'Semua', [
    ['material', 'Gypsum board 9mm (120x240)', 0.350],
    ['material', 'Rangka hollow galvanis 2x4', 0.600],
    ['material', 'Rangka hollow galvanis 4x4', 0.300],
    ['material', 'Sekrup gypsum', 0.100],
    ['material', 'Compound gypsum', 0.150],
    ['material', 'Paper tape gypsum', 0.050],
    ['upah', 'Tukang Kayu', 0.200],
    ['upah', 'Pekerja / Laden', 0.200],
  ]],
  ['AHSP-024', 'Pasang Plafon GRC Area Basah', 'M2', 'Pekerjaan Plafon', 'Semua', [
    ['material', 'GRC board 4mm (area basah)', 0.350],
    ['material', 'Rangka hollow galvanis 2x4', 0.600],
    ['material', 'Sekrup gypsum', 0.100],
    ['upah', 'Tukang Kayu', 0.200],
    ['upah', 'Pekerja / Laden', 0.150],
  ]],
  ['AHSP-025', 'Pasang List Profil Plafon', 'M', 'Pekerjaan Plafon', 'Semua', [
    ['material', 'List profil gypsum', 1.050],
    ['material', 'Compound gypsum', 0.050],
    ['upah', 'Tukang Kayu', 0.080],
  ]],

  // --- Pintu & Jendela ---
  ['AHSP-026', 'Pasang Kusen Alumunium', 'M', 'Pekerjaan Pintu & Jendela', 'Semua', [
    ['material', 'Kusen alumunium 4 inch', 1.050],
    ['upah', 'Tukang Kayu', 0.150],
    ['upah', 'Pekerja / Laden', 0.100],
  ]],
  ['AHSP-027', 'Pasang Daun Pintu Panel Kayu', 'Bh', 'Pekerjaan Pintu & Jendela', 'Semua', [
    ['material', 'Daun pintu panel kayu engineering', 1.000],
    ['material', 'Engsel pintu', 3.000],
    ['material', 'Handle pintu + kunci tanam', 1.000],
    ['upah', 'Tukang Kayu', 0.500],
    ['upah', 'Pekerja / Laden', 0.250],
  ]],
  ['AHSP-028', 'Pasang Daun Pintu PVC (Kamar Mandi)', 'Bh', 'Pekerjaan Pintu & Jendela', 'Semua', [
    ['material', 'Daun pintu PVC (kamar mandi)', 1.000],
    ['material', 'Engsel pintu', 2.000],
    ['upah', 'Tukang Kayu', 0.300],
  ]],
  ['AHSP-029', 'Pasang Kaca Jendela 5mm', 'M2', 'Pekerjaan Pintu & Jendela', 'Semua', [
    ['material', 'Kaca bening 5mm', 1.050],
    ['material', 'Sealant kaca', 0.100],
    ['upah', 'Tukang Kayu', 0.150],
  ]],

  // --- Instalasi Listrik ---
  ['AHSP-030', 'Instalasi Titik Lampu', 'Ttk', 'Pekerjaan Instalasi Listrik', 'Semua', [
    ['material', 'Kabel NYM 2x1.5mm', 6.000],
    ['material', 'Pipa conduit PVC 5/8', 3.000],
    ['material', 'Fitting lampu', 1.000],
    ['material', 'Lampu LED 10W', 1.000],
    ['material', 'Isolasi listrik', 0.100],
    ['upah', 'Tukang Listrik', 0.350],
  ]],
  ['AHSP-031', 'Instalasi Titik Stop Kontak', 'Ttk', 'Pekerjaan Instalasi Listrik', 'Semua', [
    ['material', 'Kabel NYM 3x2.5mm', 6.000],
    ['material', 'Pipa conduit PVC 5/8', 3.000],
    ['material', 'Stop kontak', 1.000],
    ['upah', 'Tukang Listrik', 0.350],
  ]],
  ['AHSP-032', 'Instalasi Titik Saklar', 'Ttk', 'Pekerjaan Instalasi Listrik', 'Semua', [
    ['material', 'Kabel NYM 2x1.5mm', 4.000],
    ['material', 'Pipa conduit PVC 5/8', 2.000],
    ['material', 'Saklar tunggal', 1.000],
    ['upah', 'Tukang Listrik', 0.300],
  ]],
  ['AHSP-033', 'Pasang Panel Listrik (MCB + Box)', 'Unit', 'Pekerjaan Instalasi Listrik', 'Semua', [
    ['material', 'Box panel listrik kecil', 1.000],
    ['material', 'MCB 1 phase', 2.000],
    ['upah', 'Tukang Listrik', 0.500],
  ]],

  // --- Instalasi Air & Sanitasi ---
  ['AHSP-034', 'Instalasi Pipa Air Bersih 1/2 inch', 'M', 'Pekerjaan Instalasi Air & Sanitasi', 'Semua', [
    ['material', 'Pipa PVC 1/2 inch (air bersih)', 1.050],
    ['material', 'Fitting PVC (knee/tee/sok campuran)', 0.500],
    ['material', 'Lem pipa PVC', 0.020],
    ['upah', 'Tukang Pipa / Ledeng', 0.150],
  ]],
  ['AHSP-035', 'Instalasi Pipa Air Kotor 3 inch', 'M', 'Pekerjaan Instalasi Air & Sanitasi', 'Semua', [
    ['material', 'Pipa PVC 3 inch (air kotor)', 1.050],
    ['material', 'Fitting PVC (knee/tee/sok campuran)', 0.300],
    ['material', 'Lem pipa PVC', 0.030],
    ['upah', 'Tukang Pipa / Ledeng', 0.150],
  ]],
  ['AHSP-036', 'Pasang Closet Duduk', 'Unit', 'Pekerjaan Instalasi Air & Sanitasi', 'Semua', [
    ['material', 'Closet duduk', 1.000],
    ['upah', 'Tukang Pipa / Ledeng', 0.500],
    ['upah', 'Pekerja / Laden', 0.250],
  ]],
  ['AHSP-037', 'Pasang Closet Jongkok', 'Unit', 'Pekerjaan Instalasi Air & Sanitasi', 'Semua', [
    ['material', 'Closet jongkok', 1.000],
    ['upah', 'Tukang Pipa / Ledeng', 0.400],
    ['upah', 'Pekerja / Laden', 0.200],
  ]],
  ['AHSP-038', 'Pasang Wastafel', 'Unit', 'Pekerjaan Instalasi Air & Sanitasi', 'Semua', [
    ['material', 'Wastafel', 1.000],
    ['material', 'Kran wastafel', 1.000],
    ['upah', 'Tukang Pipa / Ledeng', 0.300],
  ]],
  ['AHSP-039', 'Pasang Septic Tank Biofil', 'Unit', 'Pekerjaan Instalasi Air & Sanitasi', 'Semua', [
    ['material', 'Septic tank biofil', 1.000],
    ['upah', 'Pekerja / Laden', 2.000],
    ['upah', 'Tukang Pipa / Ledeng', 0.500],
  ]],

  // --- Pengecatan ---
  ['AHSP-040', 'Pengecatan Dinding Interior', 'M2', 'Pekerjaan Pengecatan', 'Semua', [
    ['material', 'Cat tembok interior', 0.260],
    ['material', 'Cat dasar / alkali resisting primer', 0.100],
    ['material', 'Plamir tembok', 0.100],
    ['upah', 'Tukang Cat', 0.100],
    ['upah', 'Pekerja / Laden', 0.070],
  ]],
  ['AHSP-041', 'Pengecatan Dinding Eksterior', 'M2', 'Pekerjaan Pengecatan', 'Semua', [
    ['material', 'Cat tembok eksterior (weathershield)', 0.260],
    ['material', 'Cat dasar / alkali resisting primer', 0.100],
    ['upah', 'Tukang Cat', 0.110],
    ['upah', 'Pekerja / Laden', 0.070],
  ]],
  ['AHSP-042', 'Pengecatan Plafon', 'M2', 'Pekerjaan Pengecatan', 'Semua', [
    ['material', 'Cat tembok interior', 0.200],
    ['upah', 'Tukang Cat', 0.080],
  ]],
];

const insertAhsp = db.prepare(`
  INSERT INTO ahsp_pekerjaan (kode_ahsp, nama_pekerjaan, satuan, kategori_id, jenis_rumah)
  VALUES (?, ?, ?, ?, ?)
`);
const checkAhsp = db.prepare('SELECT id FROM ahsp_pekerjaan WHERE kode_ahsp = ?');
const insertKoef = db.prepare(`
  INSERT INTO ahsp_koefisien (ahsp_id, tipe, material_id, upah_id, koefisien)
  VALUES (?, ?, ?, ?, ?)
`);

let ahspCount = 0;
let koefCount = 0;
const skippedRefs = [];

const insertAhspAll = db.transaction(() => {
  for (const [kode, nama, satuan, kategoriNama, jenisRumah, koefisienList] of ahspList) {
    const existing = checkAhsp.get(kode);
    if (existing) continue;

    const kategoriId = getKategoriId(kategoriNama);
    const result = insertAhsp.run(kode, nama, satuan, kategoriId, jenisRumah);
    const ahspId = result.lastInsertRowid;
    ahspCount++;

    for (const [tipe, namaItem, koefisien] of koefisienList) {
      const itemId = tipe === 'material' ? materialIds[namaItem] : upahIds[namaItem];
      if (!itemId) {
        skippedRefs.push(`${nama} -> ${namaItem}`);
        continue;
      }
      insertKoef.run(
        ahspId,
        tipe,
        tipe === 'material' ? itemId : null,
        tipe === 'upah' ? itemId : null,
        koefisien
      );
      koefCount++;
    }
  }
});
insertAhspAll();

console.log(`✅ ${ahspCount} AHSP baru ditambahkan (total referensi: ${ahspList.length}).`);
console.log(`✅ ${koefCount} baris koefisien material/upah ditambahkan.`);
if (skippedRefs.length > 0) {
  console.log(`⚠️  ${skippedRefs.length} referensi tidak ditemukan (dilewati):`, skippedRefs);
}

console.log('\n🎉 Seeding database lengkap selesai!');
console.log('   Silakan cek menu Database Material, Database Upah, dan Database AHSP di aplikasi.');
console.log('   INGAT: harga di atas adalah harga UMUM/INDIKATIF — sesuaikan dengan harga wilayah Anda.');

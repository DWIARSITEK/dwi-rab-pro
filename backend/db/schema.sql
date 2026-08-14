-- ============================================================
-- DWI RAB PRO SNI 2026 — DATABASE SCHEMA
-- ============================================================

-- ============ LISENSI ============
CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode_lisensi TEXT UNIQUE NOT NULL,
  nama_pemilik TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'Nonaktif', -- 'Aktif' / 'Nonaktif'
  tanggal_aktivasi TEXT,
  tanggal_kedaluwarsa TEXT,
  catatan TEXT,
  device_id TEXT,               -- opsional: mengikat lisensi ke 1 perangkat/browser
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Log setiap percobaan aktivasi (untuk audit & anti abuse)
CREATE TABLE IF NOT EXISTS license_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode_lisensi TEXT,
  status TEXT,          -- 'success' / 'failed' / 'expired'
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Admin (untuk mengelola lisensi)
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============ WILAYAH (untuk Upah & Proyek) ============
CREATE TABLE IF NOT EXISTS provinsi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS kabupaten_kota (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provinsi_id INTEGER NOT NULL,
  nama TEXT NOT NULL,
  FOREIGN KEY (provinsi_id) REFERENCES provinsi(id)
);

-- ============ PROYEK ============
CREATE TABLE IF NOT EXISTS proyek (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_proyek TEXT NOT NULL,
  pemilik TEXT,
  alamat TEXT,
  provinsi_id INTEGER,
  kabupaten_id INTEGER,
  panjang REAL NOT NULL,
  lebar REAL NOT NULL,
  luas REAL NOT NULL,          -- panjang * lebar (dihitung otomatis)
  jumlah_lantai INTEGER DEFAULT 1,
  jenis_rumah TEXT,            -- Minimalis / Modern / Premium
  total_material REAL DEFAULT 0,
  total_upah REAL DEFAULT 0,
  grand_total REAL DEFAULT 0,
  status TEXT DEFAULT 'Draft', -- Draft / Selesai
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (provinsi_id) REFERENCES provinsi(id),
  FOREIGN KEY (kabupaten_id) REFERENCES kabupaten_kota(id)
);

-- ============ KATEGORI MATERIAL ============
CREATE TABLE IF NOT EXISTS kategori_material (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT UNIQUE NOT NULL,           -- mis: Pekerjaan Tanah, Pekerjaan Struktur, Aksesoris Listrik, dll
  parent_id INTEGER,                   -- untuk sub-kategori
  FOREIGN KEY (parent_id) REFERENCES kategori_material(id)
);

-- ============ DATABASE MATERIAL (mendukung ribuan item) ============
CREATE TABLE IF NOT EXISTS material (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode_material TEXT UNIQUE,
  nama_material TEXT NOT NULL,
  kategori_id INTEGER,
  satuan TEXT NOT NULL,          -- Kg, Sak, M3, Bh, Ls, dll
  harga_satuan REAL NOT NULL DEFAULT 0,
  provinsi_id INTEGER,           -- harga bisa berbeda per wilayah (opsional)
  kabupaten_id INTEGER,
  spesifikasi TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (kategori_id) REFERENCES kategori_material(id),
  FOREIGN KEY (provinsi_id) REFERENCES provinsi(id),
  FOREIGN KEY (kabupaten_id) REFERENCES kabupaten_kota(id)
);
CREATE INDEX IF NOT EXISTS idx_material_nama ON material(nama_material);
CREATE INDEX IF NOT EXISTS idx_material_kategori ON material(kategori_id);

-- ============ DATABASE UPAH (per wilayah) ============
CREATE TABLE IF NOT EXISTS upah (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode_upah TEXT UNIQUE,
  nama_pekerja TEXT NOT NULL,     -- Mandor, Kepala Tukang, Tukang, Pekerja/Laden, dll
  satuan TEXT NOT NULL DEFAULT 'OH', -- Orang/Hari
  harga_satuan REAL NOT NULL DEFAULT 0,
  provinsi_id INTEGER,
  kabupaten_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (provinsi_id) REFERENCES provinsi(id),
  FOREIGN KEY (kabupaten_id) REFERENCES kabupaten_kota(id)
);
CREATE INDEX IF NOT EXISTS idx_upah_wilayah ON upah(provinsi_id, kabupaten_id);

-- ============ AHSP (Analisa Harga Satuan Pekerjaan) ============
-- Header pekerjaan, contoh: "Pemasangan 1 M2 Dinding Bata Merah 1/2 Batu"
CREATE TABLE IF NOT EXISTS ahsp_pekerjaan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode_ahsp TEXT UNIQUE,
  nama_pekerjaan TEXT NOT NULL,
  satuan TEXT NOT NULL,           -- M2, M3, Bh, Ttk, Ls, dll
  kategori_id INTEGER,            -- link ke kategori_material sebagai pengelompokan pekerjaan
  jenis_rumah TEXT,               -- Minimalis / Modern / Premium / Semua (untuk filter mesin RAB)
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (kategori_id) REFERENCES kategori_material(id)
);

-- Detail koefisien AHSP: setiap pekerjaan terdiri dari beberapa material & upah dengan koefisien
-- Ini yang menggantikan "angka hardcode" — semua koefisien tersimpan di DB
CREATE TABLE IF NOT EXISTS ahsp_koefisien (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ahsp_id INTEGER NOT NULL,
  tipe TEXT NOT NULL,             -- 'material' atau 'upah'
  material_id INTEGER,            -- diisi jika tipe = 'material'
  upah_id INTEGER,                -- diisi jika tipe = 'upah'
  koefisien REAL NOT NULL,        -- angka koefisien SNI, mis 0.02, 1.1, dst
  FOREIGN KEY (ahsp_id) REFERENCES ahsp_pekerjaan(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES material(id),
  FOREIGN KEY (upah_id) REFERENCES upah(id)
);
CREATE INDEX IF NOT EXISTS idx_ahsp_koef_ahsp ON ahsp_koefisien(ahsp_id);

-- ============ BOQ / RAB per Proyek ============
-- Baris BOQ: hasil generate mesin hitung RAB, tersimpan agar bisa dibuka lagi di Daftar Proyek
CREATE TABLE IF NOT EXISTS boq_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyek_id INTEGER NOT NULL,
  ahsp_id INTEGER,
  nama_pekerjaan TEXT NOT NULL,
  satuan TEXT NOT NULL,
  volume REAL NOT NULL,
  harga_satuan_pekerjaan REAL NOT NULL,   -- hasil kalkulasi AHSP x harga material/upah saat itu
  subtotal REAL NOT NULL,                  -- volume * harga_satuan_pekerjaan
  kategori TEXT,                           -- untuk pengelompokan tampilan RAB (Pek. Persiapan, Struktur, dst)
  urutan INTEGER DEFAULT 0,
  FOREIGN KEY (proyek_id) REFERENCES proyek(id) ON DELETE CASCADE,
  FOREIGN KEY (ahsp_id) REFERENCES ahsp_pekerjaan(id)
);
CREATE INDEX IF NOT EXISTS idx_boq_proyek ON boq_item(proyek_id);

-- Rincian material & upah per baris BOQ (untuk laporan detail & rekap kebutuhan material)
CREATE TABLE IF NOT EXISTS boq_detail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  boq_item_id INTEGER NOT NULL,
  tipe TEXT NOT NULL,              -- 'material' / 'upah'
  nama TEXT NOT NULL,
  satuan TEXT,
  koefisien REAL NOT NULL,
  volume_kebutuhan REAL NOT NULL,  -- koefisien * volume pekerjaan
  harga_satuan REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (boq_item_id) REFERENCES boq_item(id) ON DELETE CASCADE
);

-- ============ LAPORAN (riwayat export) ============
CREATE TABLE IF NOT EXISTS laporan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyek_id INTEGER,
  jenis TEXT,             -- 'PDF' / 'Excel'
  nama_file TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (proyek_id) REFERENCES proyek(id)
);

-- ============ PENGATURAN APLIKASI ============
CREATE TABLE IF NOT EXISTS pengaturan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT
);

# DWI RAB PRO SNI 2026

Website aplikasi (bukan landing page) untuk estimasi RAB (Rencana Anggaran Biaya) konstruksi rumah, dengan sistem lisensi berbayar, database material/upah/AHSP yang bisa dikembangkan, dan mesin hitung RAB otomatis tanpa angka hardcode.

**Developer: DWI ARSITEK**

---

## 📦 Struktur Project

```
dwi-rab-pro/
├── backend/          # Express API + SQLite
│   ├── db/           # schema.sql, init.js, seed.js
│   ├── middleware/   # auth.js (proteksi lisensi & admin)
│   ├── routes/       # semua endpoint API
│   └── server.js
└── frontend/         # React + Vite + Tailwind
    └── src/
        ├── api/
        ├── components/
        ├── context/
        ├── pages/
        └── routes/
```

## 🚀 Cara Menjalankan (Development)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env, ganti JWT_SECRET dan ADMIN_SECRET dengan nilai rahasia sendiri

npm run seed     # membuat admin default + lisensi demo + data awal
npm run dev      # jalan di http://localhost:5000
```

Setelah seed berhasil, catat outputnya:
- **Admin login**: username `admin`, password `admin123` (⚠️ WAJIB diganti setelah login pertama — saat ini ganti password harus lewat database langsung karena endpoint ganti password belum dibuat di versi awal ini, bisa ditambahkan di iterasi berikutnya)
- **Lisensi demo**: kode `DWIRAB-DEMO0001` (berlaku 365 hari) — pakai ini untuk testing aktivasi

### 2. Frontend

```bash
cd frontend
npm install
npm run dev      # jalan di http://localhost:3000
```

Buka browser ke `http://localhost:3000` — otomatis diarahkan ke halaman **Aktivasi Lisensi**.

Buka `http://localhost:3000/admin/login` untuk masuk ke panel admin kelola lisensi.

---

## 🔑 Alur Sistem Lisensi

1. User buka website → wajib ke `/aktivasi` dulu.
2. Masukkan kode lisensi → dikirim ke backend `/api/license/activate`.
3. Backend cek ke tabel `licenses` di database → kalau valid & aktif, kembalikan JWT token.
4. Token disimpan di `localStorage`, dipakai di setiap request API selanjutnya (`Authorization: Bearer <token>`).
5. Semua route API (kecuali `/api/license/*` dan `/api/admin/*`) diproteksi middleware `requireLicense` — status lisensi **selalu dicek ulang ke database** di setiap request, bukan hanya percaya isi token. Jadi kalau admin menonaktifkan lisensi, user langsung ter-blokir di request berikutnya.

## 🗄️ Prinsip "Tanpa Hardcode"

Semua koefisien perhitungan RAB tersimpan di tabel `ahsp_koefisien`, terhubung ke `material` dan `upah`. Mesin RAB (`backend/routes/rab-engine.js`) murni mengalikan koefisien × harga dari database — tidak ada angka konstanta yang ditulis langsung di kode. Ini artinya: **kalau Database Material/Upah/AHSP masih kosong, RAB yang dihasilkan juga akan kosong/nol** — sesuai spesifikasi awal, karena semua data harus diinput dulu melalui menu Database Material, Database Upah, dan Database AHSP (bisa manual satu-satu atau import Excel).

---

## ⚠️ STATUS PEMBANGUNAN — INI ADALAH FONDASI (FASE 1)

Mengingat besarnya scope project ini, yang sudah dibangun di fase pertama:

✅ Sistem lisensi lengkap (aktivasi, proteksi route, admin panel CRUD lisensi)
✅ Struktur database lengkap (lisensi, proyek, material, upah, AHSP + koefisien, BOQ, laporan)
✅ Dashboard dengan grafik statistik
✅ Proyek Baru & Daftar Proyek (CRUD + hitung luas otomatis)
✅ Mesin Hitung RAB (generate BOQ dari AHSP + material + upah, tanpa hardcode)
✅ Database Material — CRUD, import Excel, export Excel, pencarian
✅ Database Upah — CRUD per wilayah, import/export Excel
✅ Database AHSP — CRUD + builder koefisien material/upah
✅ BOQ — tampilan per proyek dikelompokkan per kategori
✅ Laporan — export PDF & Excel per proyek
✅ Pengaturan — dark mode, backup, restore database
✅ Halaman Tentang dengan disclaimer

### 🔜 Yang perlu dikembangkan lebih lanjut (belum sempurna / belum ada):
- Endpoint ganti password admin dari UI (saat ini masih perlu akses database langsung)
- Validasi input lebih ketat di semua form (mis: format email, nomor WA)
- Paginasi UI untuk Database Material/Upah/AHSP saat datanya sudah ribuan baris (backend sudah siap `page`/`limit`, tinggal disambungkan ke tombol next/prev di frontend)
- Fitur "rumus volume otomatis" berdasarkan luas bangunan (saat ini volume tiap pekerjaan diinput manual di Mesin Hitung RAB — bisa dikembangkan agar volume dinding/lantai/atap terhitung otomatis dari panjang x lebar x jumlah lantai)
- Halaman detail read-only laporan sebelum download
- Rate limiting & audit log yang lebih lengkap di sisi admin
- Deployment (Docker, atau panduan hosting VPS + Nginx untuk taruh backend & frontend production)

Karena ini web app besar, direkomendasikan dikembangkan bertahap per modul sambil dites — kabari kalau mau lanjut ke modul tertentu dulu (misalnya isi Database Material dengan data SNI riil, atau bikin fitur rumus volume otomatis).

---

## 🛠️ Build untuk Production

```bash
# Frontend
cd frontend
npm run build     # hasil di frontend/dist

# Backend tetap jalan sebagai API terpisah, atau serve frontend/dist via Express static
```

## 📄 Lisensi Kode

Kode ini milik DWI ARSITEK, dibangun khusus untuk produk DWI RAB PRO SNI 2026.

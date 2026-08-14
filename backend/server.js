import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import './db/init.js';
import { requireLicense } from './middleware/auth.js';

import licenseRoutes from './routes/license.js';
import adminRoutes from './routes/admin.js';
import proyekRoutes from './routes/proyek.js';
import materialRoutes from './routes/materials.js';
import upahRoutes from './routes/upah.js';
import ahspRoutes from './routes/ahsp.js';
import rabEngineRoutes from './routes/rab-engine.js';
import rabAutoRoutes from './routes/rab-auto.js';
import dashboardRoutes from './routes/dashboard.js';
import wilayahRoutes from './routes/wilayah.js';
import laporanRoutes from './routes/laporan.js';
import pengaturanRoutes from './routes/pengaturan.js';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ROUTE PUBLIK
// ============================================================

app.use('/api/license', licenseRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================
// ROUTE TERPROTEKSI LISENSI
// ============================================================

app.use('/api/proyek', requireLicense, proyekRoutes);
app.use('/api/materials', requireLicense, materialRoutes);
app.use('/api/upah', requireLicense, upahRoutes);
app.use('/api/ahsp', requireLicense, ahspRoutes);

app.use('/api/rab', requireLicense, rabEngineRoutes);
app.use('/api/rab', requireLicense, rabAutoRoutes);

app.use('/api/dashboard', requireLicense, dashboardRoutes);
app.use('/api/wilayah', requireLicense, wilayahRoutes);
app.use('/api/laporan', requireLicense, laporanRoutes);
app.use('/api/pengaturan', requireLicense, pengaturanRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DWI RAB PRO SNI 2026 API berjalan normal.'
  });
});

// ============================================================
// FRONTEND REACT
// ============================================================

const frontendPath = path.join(
  __dirname,
  '..',
  'frontend',
  'dist'
);

app.use(express.static(frontendPath));

// React Router
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'Endpoint tidak ditemukan.'
    });
  }

  res.sendFile(
    path.join(frontendPath, 'index.html')
  );
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server.'
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log('');
  console.log('==============================================');
  console.log('🚀 RAB PRO SNI 2026 BERHASIL DIJALANKAN');
  console.log('==============================================');
  console.log(`🌐 URL     : http://localhost:${PORT}`);
  console.log(`📡 API     : http://localhost:${PORT}/api`);
  console.log(`❤️ Health  : http://localhost:${PORT}/api/health`);
  console.log('==============================================');
  console.log('');
});
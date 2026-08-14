import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';

import LicenseActivation from './pages/LicenseActivation.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProyekBaru from './pages/ProyekBaru.jsx';
import DaftarProyek from './pages/DaftarProyek.jsx';
import MesinRAB from './pages/MesinRAB.jsx';
import DatabaseMaterial from './pages/DatabaseMaterial.jsx';
import DatabaseUpah from './pages/DatabaseUpah.jsx';
import DatabaseAHSP from './pages/DatabaseAHSP.jsx';
import BOQ from './pages/BOQ.jsx';
import Laporan from './pages/Laporan.jsx';
import Pengaturan from './pages/Pengaturan.jsx';
import Tentang from './pages/Tentang.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminLicenses from './pages/AdminLicenses.jsx';

export default function App() {
  return (
    <Routes>
      {/* Halaman pertama - wajib dilewati sebelum akses lainnya */}
      <Route path="/aktivasi" element={<LicenseActivation />} />

      {/* Admin - terpisah dari sistem lisensi pengguna */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/lisensi" element={<AdminLicenses />} />

      {/* Semua halaman berikut dilindungi Protected Route (wajib lisensi aktif) */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/proyek-baru" element={<ProyekBaru />} />
        <Route path="/daftar-proyek" element={<DaftarProyek />} />
        <Route path="/mesin-rab" element={<MesinRAB />} />
        <Route path="/database-material" element={<DatabaseMaterial />} />
        <Route path="/database-upah" element={<DatabaseUpah />} />
        <Route path="/database-ahsp" element={<DatabaseAHSP />} />
        <Route path="/boq" element={<BOQ />} />
        <Route path="/laporan" element={<Laporan />} />
        <Route path="/pengaturan" element={<Pengaturan />} />
        <Route path="/tentang" element={<Tentang />} />
      </Route>

      <Route path="/" element={<Navigate to="/aktivasi" replace />} />
      <Route path="*" element={<Navigate to="/aktivasi" replace />} />
    </Routes>
  );
}

import { useState } from 'react';
import { Moon, Download, Upload, LogOut } from 'lucide-react';
import { useLicense } from '../context/LicenseContext.jsx';
import apiClient from '../api/client.js';

export default function Pengaturan() {
  const { logout } = useLicense();
  const [restoreMsg, setRestoreMsg] = useState('');

  function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('dwirab_dark_mode', isDark);
  }

  function handleBackup() {
    window.open('/api/pengaturan/backup', '_blank');
  }

  async function handleRestore(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('Restore akan MENIMPA seluruh database aktif. Lanjutkan?')) return;

    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/pengaturan/restore', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setRestoreMsg(res.data.message);
    } catch (err) {
      setRestoreMsg('Gagal restore database.');
    }
    e.target.value = '';
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold mb-1">Pengaturan</h1>
      <p className="text-gray-400 text-sm mb-6">Kelola preferensi dan data aplikasi</p>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Moon size={20} className="text-gray-400" />
          <div>
            <p className="font-medium text-sm">Dark Mode</p>
            <p className="text-xs text-gray-400">Ubah tampilan gelap/terang</p>
          </div>
        </div>
        <button onClick={toggleDarkMode} className="px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium">
          Toggle
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Download size={20} className="text-gray-400" />
          <div>
            <p className="font-medium text-sm">Backup Database</p>
            <p className="text-xs text-gray-400">Unduh salinan database saat ini</p>
          </div>
        </div>
        <button onClick={handleBackup} className="px-4 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium">
          Backup
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3 mb-2">
          <Upload size={20} className="text-gray-400" />
          <div>
            <p className="font-medium text-sm">Restore Database</p>
            <p className="text-xs text-gray-400">Upload file backup (.sqlite) untuk memulihkan data</p>
          </div>
        </div>
        <label className="cursor-pointer inline-block px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium">
          Pilih File
          <input type="file" accept=".sqlite" className="hidden" onChange={handleRestore} />
        </label>
        {restoreMsg && <p className="text-xs text-primary-600 mt-2">{restoreMsg}</p>}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogOut size={20} className="text-red-400" />
          <div>
            <p className="font-medium text-sm">Keluar dari Lisensi</p>
            <p className="text-xs text-gray-400">Hapus sesi aktivasi di perangkat ini</p>
          </div>
        </div>
        <button onClick={logout} className="px-4 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
          Logout
        </button>
      </div>
    </div>
  );
}

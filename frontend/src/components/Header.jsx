import { useState, useEffect } from 'react';
import { Menu, Moon, Sun, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useLicense } from '../context/LicenseContext.jsx';

export default function Header({ onToggleSidebar, darkMode, onToggleDarkMode }) {
  const { license } = useLicense();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tanggal = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const jam = now.toLocaleTimeString('id-ID');

  const expDate = license?.tanggal_kedaluwarsa ? new Date(license.tanggal_kedaluwarsa) : null;
  const daysLeft = expDate ? Math.ceil((expDate - now) / (1000 * 60 * 60 * 24)) : null;

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <Menu size={20} />
        </button>
        <div className="hidden md:block">
          <p className="text-sm font-medium">Selamat Datang, {license?.nama_pemilik || 'Pengguna'}</p>
          <p className="text-xs text-gray-400">{tanggal} • {jam}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            daysLeft !== null && daysLeft <= 7
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}
        >
          {daysLeft !== null && daysLeft <= 7 ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
          Lisensi Aktif • {daysLeft !== null ? `${daysLeft} hari lagi` : ''}
        </div>

        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}

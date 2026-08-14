import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLicense } from '../context/LicenseContext.jsx';
import { ShieldCheck, KeyRound, Loader2 } from 'lucide-react';

export default function LicenseActivation() {
  const [kode, setKode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { activate } = useLicense();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await activate(kode.trim());
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan. Periksa koneksi ke server.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-primary-600 flex items-center justify-center mb-3">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <p className="text-sm text-gray-400 tracking-wide">DWI ARSITEK</p>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white text-center mt-1">
            DWI RAB PRO <span className="text-primary-600">SNI 2026</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Software Estimasi RAB Profesional</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Kode Lisensi
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                placeholder="DWIRAB-XXXXXXXXXX"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none tracking-wider font-mono text-sm"
                required
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
            {loading ? 'Memverifikasi...' : 'Aktivasi Lisensi'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Belum punya lisensi? Hubungi <span className="font-medium">DWI ARSITEK</span> untuk pembelian.
        </p>
      </div>
    </div>
  );
}

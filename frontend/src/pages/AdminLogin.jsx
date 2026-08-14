import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { adminClient } from '../api/client.js';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await adminClient.post('/login', { username, password });
      localStorage.setItem('dwirab_admin_token', res.data.token);
      navigate('/admin/lisensi');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center mb-3">
            <Lock className="text-white" size={24} />
          </div>
          <h1 className="font-bold text-lg">Admin Lisensi</h1>
          <p className="text-xs text-gray-400">DWI RAB PRO SNI 2026</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" />
          <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" />
          {error && <div className="bg-red-50 text-red-600 text-xs rounded-lg px-3 py-2">{error}</div>}
          <button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 rounded-lg text-sm">
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}

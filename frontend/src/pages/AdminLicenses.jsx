import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Power, PowerOff, RefreshCw, Trash2, Copy, X } from 'lucide-react';
import { adminClient } from '../api/client.js';

export default function AdminLicenses() {
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nama_pemilik: '', email: '', whatsapp: '', masa_berlaku_hari: 365, catatan: '' });
  const [newCode, setNewCode] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('dwirab_admin_token')) {
      navigate('/admin/login');
      return;
    }
    load();
  }, []);

  function load() {
    adminClient.get('/licenses').then(res => setLicenses(res.data.data)).catch(() => navigate('/admin/login'));
  }

  async function handleCreate(e) {
    e.preventDefault();
    const res = await adminClient.post('/licenses', form);
    setNewCode(res.data.kode_lisensi);
    load();
  }

  async function toggleStatus(item) {
    const endpoint = item.status === 'Aktif' ? 'deactivate' : 'activate';
    await adminClient.put(`/licenses/${item.id}/${endpoint}`);
    load();
  }

  async function extend(item) {
    const hari = prompt('Perpanjang berapa hari?', '365');
    if (!hari) return;
    await adminClient.put(`/licenses/${item.id}/extend`, { tambahan_hari: hari });
    load();
  }

  async function remove(item) {
    if (!confirm(`Hapus lisensi milik ${item.nama_pemilik}?`)) return;
    await adminClient.delete(`/licenses/${item.id}`);
    load();
  }

  function copyCode(kode) {
    navigator.clipboard.writeText(kode);
    alert('Kode lisensi disalin: ' + kode);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin — Kelola Lisensi</h1>
          <p className="text-gray-400 text-sm">DWI RAB PRO SNI 2026</p>
        </div>
        <button onClick={() => { setShowModal(true); setNewCode(''); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium">
          <Plus size={16} /> Buat Lisensi Baru
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <th className="py-3 px-4">Kode Lisensi</th>
              <th className="py-3 px-4">Pemilik</th>
              <th className="py-3 px-4">Kontak</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Kedaluwarsa</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {licenses.map(item => (
              <tr key={item.id} className="border-b border-gray-50 dark:border-gray-700/50">
                <td className="py-2.5 px-4 font-mono text-xs flex items-center gap-2">
                  {item.kode_lisensi}
                  <button onClick={() => copyCode(item.kode_lisensi)}><Copy size={13} className="text-gray-400" /></button>
                </td>
                <td className="py-2.5 px-4">{item.nama_pemilik}</td>
                <td className="py-2.5 px-4 text-gray-400">{item.email}<br />{item.whatsapp}</td>
                <td className="py-2.5 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${item.status === 'Aktif' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-gray-400">{item.tanggal_kedaluwarsa ? new Date(item.tanggal_kedaluwarsa).toLocaleDateString('id-ID') : '-'}</td>
                <td className="py-2.5 px-4 text-right whitespace-nowrap">
                  <button onClick={() => toggleStatus(item)} title={item.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mr-1">
                    {item.status === 'Aktif' ? <PowerOff size={15} /> : <Power size={15} />}
                  </button>
                  <button onClick={() => extend(item)} title="Perpanjang" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg mr-1">
                    <RefreshCw size={15} />
                  </button>
                  <button onClick={() => remove(item)} title="Hapus" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Buat Lisensi Baru</h2>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {newCode ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400 mb-2">Kode lisensi berhasil dibuat:</p>
                <p className="font-mono font-bold text-lg bg-gray-50 dark:bg-gray-700 rounded-lg py-3">{newCode}</p>
                <button onClick={() => copyCode(newCode)} className="mt-3 text-sm text-primary-600">Salin Kode</button>
                <button onClick={() => setShowModal(false)} className="w-full mt-4 bg-primary-600 text-white font-medium py-2.5 rounded-lg">Selesai</button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-3">
                <input required placeholder="Nama Pemilik" value={form.nama_pemilik}
                  onChange={e => setForm({ ...form, nama_pemilik: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" />
                <input placeholder="Email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" />
                <input placeholder="Nomor WhatsApp" value={form.whatsapp}
                  onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" />
                <input type="number" placeholder="Masa Berlaku (hari)" value={form.masa_berlaku_hari}
                  onChange={e => setForm({ ...form, masa_berlaku_hari: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" />
                <textarea placeholder="Catatan (opsional)" value={form.catatan}
                  onChange={e => setForm({ ...form, catatan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" rows={2} />
                <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg">
                  Buat Lisensi
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

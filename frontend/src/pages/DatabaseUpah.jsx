import { useState, useEffect } from 'react';
import { Plus, Search, Upload, Download, Pencil, Trash2, X } from 'lucide-react';
import apiClient from '../api/client.js';

const emptyForm = { kode_upah: '', nama_pekerja: '', satuan: 'OH', harga_satuan: '', provinsi_id: '', kabupaten_id: '' };

export default function DatabaseUpah() {
  const [data, setData] = useState([]);
  const [provinsiList, setProvinsiList] = useState([]);
  const [kabupatenList, setKabupatenList] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/wilayah/provinsi').then(res => setProvinsiList(res.data.data));
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (form.provinsi_id) {
      apiClient.get(`/wilayah/kabupaten/${form.provinsi_id}`).then(res => setKabupatenList(res.data.data));
    }
  }, [form.provinsi_id]);

  function load() {
    setLoading(true);
    apiClient.get('/upah', { params: { search, limit: 100 } })
      .then(res => setData(res.data.data))
      .finally(() => setLoading(false));
  }

  function openCreate() { setForm(emptyForm); setEditId(null); setShowModal(true); }
  function openEdit(item) {
    setForm({
      kode_upah: item.kode_upah || '', nama_pekerja: item.nama_pekerja, satuan: item.satuan,
      harga_satuan: item.harga_satuan, provinsi_id: item.provinsi_id || '', kabupaten_id: item.kabupaten_id || ''
    });
    setEditId(item.id);
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editId) await apiClient.put(`/upah/${editId}`, form);
    else await apiClient.post('/upah', form);
    setShowModal(false);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Hapus data upah ini?')) return;
    await apiClient.delete(`/upah/${id}`);
    load();
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    await apiClient.post('/upah/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    load();
    e.target.value = '';
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Database Upah</h1>
          <p className="text-gray-400 text-sm">Kelola harga upah tukang per provinsi & kabupaten/kota</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium hover:bg-gray-200">
            <Upload size={16} /> Import Excel
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={() => window.open('/api/upah/export/excel', '_blank')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium hover:bg-gray-200">
            <Download size={16} /> Export Excel
          </button>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
            <Plus size={16} /> Tambah Upah
          </button>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400 mb-4">
        ⚠️ Harga bawaan adalah <strong>harga umum/indikatif</strong>, bukan harga resmi HSPK daerah. Sesuaikan harga di bawah dengan kondisi pasar wilayah Anda.
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama pekerja..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <th className="py-3 px-4">Nama Pekerja</th>
              <th className="py-3 px-4">Satuan</th>
              <th className="py-3 px-4">Harga Satuan</th>
              <th className="py-3 px-4">Wilayah</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="py-6 text-center text-gray-400">Memuat...</td></tr>}
            {!loading && data.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-400">Belum ada data upah.</td></tr>}
            {data.map(item => (
              <tr key={item.id} className="border-b border-gray-50 dark:border-gray-700/50">
                <td className="py-2.5 px-4 font-medium">{item.nama_pekerja}</td>
                <td className="py-2.5 px-4">{item.satuan}</td>
                <td className="py-2.5 px-4">Rp {Number(item.harga_satuan).toLocaleString('id-ID')}</td>
                <td className="py-2.5 px-4">{item.provinsi_nama || '-'} {item.kabupaten_nama ? `/ ${item.kabupaten_nama}` : ''}</td>
                <td className="py-2.5 px-4 text-right">
                  <button onClick={() => openEdit(item)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mr-1"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
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
              <h2 className="font-bold">{editId ? 'Edit Upah' : 'Tambah Upah'}</h2>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Nama Pekerja (mis: Tukang Batu)" value={form.nama_pekerja}
                onChange={e => setForm({ ...form, nama_pekerja: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Satuan (OH)" value={form.satuan}
                  onChange={e => setForm({ ...form, satuan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" />
                <input required type="number" placeholder="Harga per Hari" value={form.harga_satuan}
                  onChange={e => setForm({ ...form, harga_satuan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" />
              </div>
              <select value={form.provinsi_id} onChange={e => setForm({ ...form, provinsi_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm">
                <option value="">Pilih Provinsi</option>
                {provinsiList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
              <select value={form.kabupaten_id} onChange={e => setForm({ ...form, kabupaten_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm">
                <option value="">Pilih Kabupaten/Kota</option>
                {kabupatenList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg">
                Simpan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

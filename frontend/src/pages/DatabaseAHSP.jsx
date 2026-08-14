import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, X, Trash } from 'lucide-react';
import apiClient from '../api/client.js';

const emptyForm = { kode_ahsp: '', nama_pekerjaan: '', satuan: '', kategori_id: '', jenis_rumah: 'Semua', koefisien: [] };

export default function DatabaseAHSP() {
  const [data, setData] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [materialList, setMaterialList] = useState([]);
  const [upahList, setUpahList] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/materials/kategori/all').then(res => setKategoriList(res.data.data));
    apiClient.get('/materials', { params: { limit: 1000 } }).then(res => setMaterialList(res.data.data));
    apiClient.get('/upah', { params: { limit: 1000 } }).then(res => setUpahList(res.data.data));
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search]);

  function load() {
    setLoading(true);
    apiClient.get('/ahsp', { params: { search, limit: 100 } })
      .then(res => setData(res.data.data))
      .finally(() => setLoading(false));
  }

  function openCreate() { setForm(emptyForm); setEditId(null); setShowModal(true); }

  async function openEdit(item) {
    const res = await apiClient.get(`/ahsp/${item.id}`);
    const detail = res.data.data;
    setForm({
      kode_ahsp: detail.kode_ahsp || '', nama_pekerjaan: detail.nama_pekerjaan, satuan: detail.satuan,
      kategori_id: detail.kategori_id || '', jenis_rumah: detail.jenis_rumah || 'Semua',
      koefisien: detail.koefisien.map(k => ({
        tipe: k.tipe, item_id: k.material_id || k.upah_id, koefisien: k.koefisien,
        nama: k.nama_material || k.nama_pekerja
      }))
    });
    setEditId(item.id);
    setShowModal(true);
  }

  function tambahKoefisien(tipe) {
    setForm(prev => ({ ...prev, koefisien: [...prev.koefisien, { tipe, item_id: '', koefisien: '', nama: '' }] }));
  }

  function updateKoefisien(idx, field, value) {
    setForm(prev => {
      const list = [...prev.koefisien];
      list[idx] = { ...list[idx], [field]: value };
      if (field === 'item_id') {
        const source = list[idx].tipe === 'material' ? materialList : upahList;
        const found = source.find(x => x.id === Number(value));
        list[idx].nama = found ? (found.nama_material || found.nama_pekerja) : '';
      }
      return { ...prev, koefisien: list };
    });
  }

  function hapusKoefisien(idx) {
    setForm(prev => ({ ...prev, koefisien: prev.koefisien.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editId) await apiClient.put(`/ahsp/${editId}`, form);
    else await apiClient.post('/ahsp', form);
    setShowModal(false);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Hapus AHSP ini?')) return;
    await apiClient.delete(`/ahsp/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Database AHSP</h1>
          <p className="text-gray-400 text-sm">Analisa Harga Satuan Pekerjaan — semua koefisien tersimpan di database, tanpa hardcode</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
          <Plus size={16} /> Tambah AHSP
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pekerjaan..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <th className="py-3 px-4">Kode</th>
              <th className="py-3 px-4">Nama Pekerjaan</th>
              <th className="py-3 px-4">Satuan</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Jenis Rumah</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="py-6 text-center text-gray-400">Memuat...</td></tr>}
            {!loading && data.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-400">Belum ada data AHSP.</td></tr>}
            {data.map(item => (
              <tr key={item.id} className="border-b border-gray-50 dark:border-gray-700/50">
                <td className="py-2.5 px-4 text-gray-400">{item.kode_ahsp || '-'}</td>
                <td className="py-2.5 px-4 font-medium">{item.nama_pekerjaan}</td>
                <td className="py-2.5 px-4">{item.satuan}</td>
                <td className="py-2.5 px-4">{item.kategori_nama || '-'}</td>
                <td className="py-2.5 px-4">{item.jenis_rumah}</td>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">{editId ? 'Edit AHSP' : 'Tambah AHSP'}</h2>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Kode AHSP (opsional)" value={form.kode_ahsp}
                  onChange={e => setForm({ ...form, kode_ahsp: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" />
                <select value={form.jenis_rumah} onChange={e => setForm({ ...form, jenis_rumah: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm">
                  <option value="Semua">Semua Jenis</option>
                  <option value="Minimalis">Minimalis</option>
                  <option value="Modern">Modern</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <input required placeholder="Nama Pekerjaan (mis: Pasangan 1m2 Dinding Bata Merah)" value={form.nama_pekerjaan}
                onChange={e => setForm({ ...form, nama_pekerjaan: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Satuan (M2, M3, Bh, dll)" value={form.satuan}
                  onChange={e => setForm({ ...form, satuan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" />
                <select value={form.kategori_id} onChange={e => setForm({ ...form, kategori_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm">
                  <option value="">Pilih Kategori</option>
                  {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Koefisien Material & Upah</h3>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => tambahKoefisien('material')} className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600">+ Material</button>
                    <button type="button" onClick={() => tambahKoefisien('upah')} className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-600">+ Upah</button>
                  </div>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {form.koefisien.map((k, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${k.tipe === 'material' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {k.tipe === 'material' ? 'Mat' : 'Upah'}
                      </span>
                      <select value={k.item_id} onChange={e => updateKoefisien(idx, 'item_id', e.target.value)}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-xs">
                        <option value="">Pilih {k.tipe === 'material' ? 'Material' : 'Upah'}</option>
                        {(k.tipe === 'material' ? materialList : upahList).map(x => (
                          <option key={x.id} value={x.id}>{x.nama_material || x.nama_pekerja}</option>
                        ))}
                      </select>
                      <input type="number" step="0.0001" placeholder="Koefisien" value={k.koefisien}
                        onChange={e => updateKoefisien(idx, 'koefisien', e.target.value)}
                        className="w-24 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-xs" />
                      <button type="button" onClick={() => hapusKoefisien(idx)} className="p-1 text-red-500"><Trash size={14} /></button>
                    </div>
                  ))}
                  {form.koefisien.length === 0 && <p className="text-xs text-gray-400 py-2">Belum ada koefisien ditambahkan.</p>}
                </div>
              </div>

              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg">
                Simpan AHSP
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Calculator, Download, Trash2 } from 'lucide-react';
import apiClient from '../api/client.js';

function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

export default function DaftarProyek() {
  const [proyekList, setProyekList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [boq, setBoq] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProyek();
  }, []);

  function loadProyek() {
    apiClient.get('/proyek')
      .then(res => setProyekList(res.data.data))
      .finally(() => setLoading(false));
  }

  function openDetail(proyek) {
    setSelected(proyek);
    apiClient.get(`/rab/boq/${proyek.id}`)
      .then(res => setBoq(res.data.data));
  }

  // =========================================================
  // HAPUS PROYEK
  // =========================================================
  async function hapusProyek(proyek) {
    const konfirmasi = window.confirm(
      `Yakin ingin menghapus proyek "${proyek.nama_proyek}"?\n\nProyek yang dihapus tidak dapat dikembalikan.`
    );

    if (!konfirmasi) return;

    try {
      await apiClient.delete(`/proyek/${proyek.id}`);

      // Hapus dari daftar proyek
      setProyekList(prev =>
        prev.filter(p => p.id !== proyek.id)
      );

      // Jika proyek yang sedang dibuka ikut dihapus
      if (selected?.id === proyek.id) {
        setSelected(null);
        setBoq([]);
      }

      alert('Proyek berhasil dihapus.');

    } catch (error) {
      console.error('Gagal menghapus proyek:', error);

      alert(
        error.response?.data?.message ||
        'Gagal menghapus proyek.'
      );
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">
        Daftar Proyek
      </h1>

      <p className="text-gray-400 text-sm mb-6">
        Semua proyek yang pernah dibuat
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* =====================================================
            LIST PROYEK
        ====================================================== */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 max-h-[70vh] overflow-y-auto">

          {loading && (
            <p className="p-4 text-sm text-gray-400">
              Memuat...
            </p>
          )}

          {!loading && proyekList.length === 0 && (
            <p className="p-4 text-sm text-gray-400">
              Belum ada proyek.{' '}
              <Link
                to="/proyek-baru"
                className="text-primary-600"
              >
                Buat proyek baru
              </Link>
            </p>
          )}

          {proyekList.map(p => (
            <div
              key={p.id}
              className={`flex items-center ${
                selected?.id === p.id
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : ''
              }`}
            >

              {/* =================================================
                  INFORMASI PROYEK
              ================================================== */}
              <button
                type="button"
                onClick={() => openDetail(p)}
                className="flex-1 min-w-0 text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <p className="font-medium text-sm">
                  {p.nama_proyek}
                </p>

                <p className="text-xs text-gray-400 mt-0.5">
                  {p.jenis_rumah} • {p.luas} m² • {p.status}
                </p>

                <p className="text-xs font-semibold text-primary-600 mt-1">
                  {formatRupiah(p.grand_total)}
                </p>
              </button>

              {/* =================================================
                  TOMBOL HAPUS
              ================================================== */}
              <button
                type="button"
                onClick={() => hapusProyek(p)}
                className="mr-3 p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                title="Hapus Proyek"
              >
                <Trash2 size={18} />
              </button>

            </div>
          ))}
        </div>

        {/* =====================================================
            DETAIL PROYEK
        ====================================================== */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">

          {!selected && (
            <div className="text-center text-gray-400 py-20">
              <Eye
                className="mx-auto mb-2"
                size={32}
              />

              <p>
                Pilih proyek di sebelah kiri untuk melihat detail RAB
              </p>
            </div>
          )}

          {selected && (
            <div>

              {/* =================================================
                  HEADER DETAIL
              ================================================== */}
              <div className="flex items-start justify-between mb-4">

                <div>
                  <h2 className="text-lg font-bold">
                    {selected.nama_proyek}
                  </h2>

                  <p className="text-sm text-gray-400">
                    {selected.pemilik} • {selected.alamat}
                  </p>
                </div>

                <div className="flex gap-2">

                  <Link
                    to="/mesin-rab"
                    className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100"
                    title="Hitung Ulang RAB"
                  >
                    <Calculator size={18} />
                  </Link>

                  <a
                    href={`/api/laporan/${selected.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
                    title="Download PDF"
                  >
                    <Download size={18} />
                  </a>

                </div>
              </div>

              {/* =================================================
                  RINGKASAN
              ================================================== */}
              <div className="grid grid-cols-3 gap-3 mb-5">

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">
                    Luas Bangunan
                  </p>

                  <p className="font-bold">
                    {selected.luas} m²
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">
                    Total Material
                  </p>

                  <p className="font-bold">
                    {formatRupiah(selected.total_material)}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">
                    Total Upah
                  </p>

                  <p className="font-bold">
                    {formatRupiah(selected.total_upah)}
                  </p>
                </div>

              </div>

              {/* =================================================
                  GRAND TOTAL
              ================================================== */}
              <div className="bg-primary-600 text-white rounded-lg p-4 mb-5">
                <p className="text-xs opacity-80">
                  Grand Total RAB
                </p>

                <p className="text-2xl font-bold">
                  {formatRupiah(selected.grand_total)}
                </p>
              </div>

              {/* =================================================
                  BOQ / RAB
              ================================================== */}
              <h3 className="font-semibold mb-2 text-sm">
                Rincian BOQ / RAB
              </h3>

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-700">

                      <th className="py-2 pr-2">
                        Uraian Pekerjaan
                      </th>

                      <th className="py-2 pr-2">
                        Volume
                      </th>

                      <th className="py-2 pr-2">
                        Satuan
                      </th>

                      <th className="py-2 pr-2">
                        Harga Satuan
                      </th>

                      <th className="py-2">
                        Jumlah
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {boq.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-gray-400"
                        >
                          Belum ada RAB. Gunakan Mesin Hitung RAB.
                        </td>
                      </tr>
                    )}

                    {boq.map(item => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 dark:border-gray-700/50"
                      >

                        <td className="py-2 pr-2">
                          {item.nama_pekerjaan}
                        </td>

                        <td className="py-2 pr-2">
                          {item.volume}
                        </td>

                        <td className="py-2 pr-2">
                          {item.satuan}
                        </td>

                        <td className="py-2 pr-2">
                          {formatRupiah(
                            item.harga_satuan_pekerjaan
                          )}
                        </td>

                        <td className="py-2 font-medium">
                          {formatRupiah(item.subtotal)}
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
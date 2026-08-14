import { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

export default function BOQ() {
  const [proyekList, setProyekList] = useState([]);
  const [proyekId, setProyekId] = useState('');
  const [boq, setBoq] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/proyek')
      .then(res => setProyekList(res.data.data || []));
  }, []);

  useEffect(() => {
    if (!proyekId) {
      setBoq([]);
      return;
    }

    setLoading(true);

    apiClient.get(`/rab/boq/${proyekId}`)
      .then(res => {
        setBoq(res.data.data || []);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [proyekId]);

  // =====================================================
  // GABUNGKAN SEMUA DETAIL DARI SELURUH ITEM BOQ
  // =====================================================
  const semuaDetail = boq.flatMap(item =>
    (item.detail || []).map(detail => ({
      ...detail,
      nama_pekerjaan: item.nama_pekerjaan,
      kategori: item.kategori,
      boq_item_id: item.id
    }))
  );

  // =====================================================
  // PISAH MATERIAL DAN UPAH
  // =====================================================
  const materialList = semuaDetail.filter(
    item => item.tipe === 'material'
  );

  const upahList = semuaDetail.filter(
    item => item.tipe === 'upah'
  );

  // =====================================================
  // TOTAL MATERIAL
  // =====================================================
  const totalMaterial = materialList.reduce(
    (total, item) => total + Number(item.subtotal || 0),
    0
  );

  // =====================================================
  // TOTAL UPAH
  // =====================================================
  const totalUpah = upahList.reduce(
    (total, item) => total + Number(item.subtotal || 0),
    0
  );

  // =====================================================
  // GRAND TOTAL
  // =====================================================
  const grandTotal = totalMaterial + totalUpah;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">
        Bill of Quantity (BOQ)
      </h1>

      <p className="text-gray-400 text-sm mb-6">
        Rincian kebutuhan material dan tenaga kerja proyek
      </p>

      {/* PILIH PROYEK */}
      <select
        value={proyekId}
        onChange={e => setProyekId(e.target.value)}
        className="w-full max-w-sm mb-6 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm"
      >
        <option value="">-- Pilih Proyek --</option>

        {proyekList.map(p => (
          <option key={p.id} value={p.id}>
            {p.nama_proyek}
          </option>
        ))}
      </select>

      {!proyekId && (
        <p className="text-gray-400 text-sm">
          Pilih proyek untuk melihat BOQ.
        </p>
      )}

      {loading && (
        <p className="text-gray-400 text-sm">
          Memuat data BOQ...
        </p>
      )}

      {proyekId && !loading && (
        <>
          {/* =====================================================
              RINGKASAN
          ===================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-400 mb-1">
                Total Material
              </p>

              <p className="text-xl font-bold">
                {formatRupiah(totalMaterial)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-400 mb-1">
                Total Upah
              </p>

              <p className="text-xl font-bold">
                {formatRupiah(totalUpah)}
              </p>
            </div>

            <div className="bg-primary-600 text-white rounded-xl p-4">
              <p className="text-xs opacity-80 mb-1">
                Grand Total
              </p>

              <p className="text-xl font-bold">
                {formatRupiah(grandTotal)}
              </p>
            </div>

          </div>

          {/* =====================================================
              TABEL MATERIAL
          ===================================================== */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden">

            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-sm">
                TABEL MATERIAL
              </h2>

              <p className="text-xs text-gray-400 mt-0.5">
                Rincian kebutuhan dan biaya material
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-700">

                    <th className="py-3 px-4">
                      Material
                    </th>

                    <th className="py-3 px-4">
                      Volume
                    </th>

                    <th className="py-3 px-4">
                      Satuan
                    </th>

                    <th className="py-3 px-4 text-right">
                      Harga Satuan
                    </th>

                    <th className="py-3 px-4 text-right">
                      Jumlah
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {materialList.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-gray-400"
                      >
                        Belum ada data material.
                      </td>
                    </tr>
                  )}

                  {materialList.map((item, index) => (
                    <tr
                      key={`${item.boq_item_id}-material-${index}`}
                      className="border-b border-gray-50 dark:border-gray-700/50"
                    >

                      <td className="py-2.5 px-4 font-medium">
                        {item.nama}
                      </td>

                      <td className="py-2.5 px-4">
                        {item.volume_kebutuhan}
                      </td>

                      <td className="py-2.5 px-4 text-gray-400">
                        {item.satuan}
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        {formatRupiah(item.harga_satuan)}
                      </td>

                      <td className="py-2.5 px-4 text-right font-medium">
                        {formatRupiah(item.subtotal)}
                      </td>

                    </tr>
                  ))}

                </tbody>

                {materialList.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">

                      <td
                        colSpan={4}
                        className="py-3 px-4 text-right font-semibold"
                      >
                        TOTAL MATERIAL
                      </td>

                      <td className="py-3 px-4 text-right font-bold">
                        {formatRupiah(totalMaterial)}
                      </td>

                    </tr>
                  </tfoot>
                )}

              </table>
            </div>
          </div>

          {/* =====================================================
              TABEL UPAH
          ===================================================== */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden">

            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-sm">
                TABEL UPAH
              </h2>

              <p className="text-xs text-gray-400 mt-0.5">
                Rincian kebutuhan dan biaya tenaga kerja
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-700">

                    <th className="py-3 px-4">
                      Tenaga Kerja
                    </th>

                    <th className="py-3 px-4">
                      Volume
                    </th>

                    <th className="py-3 px-4">
                      Satuan
                    </th>

                    <th className="py-3 px-4 text-right">
                      Harga Satuan
                    </th>

                    <th className="py-3 px-4 text-right">
                      Jumlah
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {upahList.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-gray-400"
                      >
                        Belum ada data upah.
                      </td>
                    </tr>
                  )}

                  {upahList.map((item, index) => (
                    <tr
                      key={`${item.boq_item_id}-upah-${index}`}
                      className="border-b border-gray-50 dark:border-gray-700/50"
                    >

                      <td className="py-2.5 px-4 font-medium">
                        {item.nama}
                      </td>

                      <td className="py-2.5 px-4">
                        {item.volume_kebutuhan}
                      </td>

                      <td className="py-2.5 px-4 text-gray-400">
                        {item.satuan}
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        {formatRupiah(item.harga_satuan)}
                      </td>

                      <td className="py-2.5 px-4 text-right font-medium">
                        {formatRupiah(item.subtotal)}
                      </td>

                    </tr>
                  ))}

                </tbody>

                {upahList.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">

                      <td
                        colSpan={4}
                        className="py-3 px-4 text-right font-semibold"
                      >
                        TOTAL UPAH
                      </td>

                      <td className="py-3 px-4 text-right font-bold">
                        {formatRupiah(totalUpah)}
                      </td>

                    </tr>
                  </tfoot>
                )}

              </table>
            </div>
          </div>

          {/* =====================================================
              GRAND TOTAL
          ===================================================== */}
          <div className="bg-primary-600 text-white rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs opacity-80">
                  TOTAL KESELURUHAN RAB
                </p>

                <p className="text-2xl font-bold mt-1">
                  {formatRupiah(grandTotal)}
                </p>
              </div>

              <div className="text-right text-sm">
                <p>
                  Material: {formatRupiah(totalMaterial)}
                </p>

                <p>
                  Upah: {formatRupiah(totalUpah)}
                </p>
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
}
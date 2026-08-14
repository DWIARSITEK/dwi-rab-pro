import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Sparkles } from 'lucide-react';
import apiClient from '../api/client.js';

function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

const modelRumahOptions = [
  'Minimalis',
  'Modern',
  'Japandi',
  'Klasik',
  'Industrial',
  'Premium'
];

export default function MesinRAB() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nama_proyek: '',
    pemilik: '',
    alamat: '',
    provinsi_id: '',
    kabupaten_id: '',
    panjang: '',
    lebar: '',
    jumlah_lantai: 1,
    model_rumah: 'Minimalis'
  });

  const [provinsiList, setProvinsiList] = useState([]);
  const [kabupatenList, setKabupatenList] = useState([]);
  const [luas, setLuas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasil, setHasil] = useState(null);

  // =========================================================
  // LOAD PROVINSI
  // =========================================================
  useEffect(() => {
    apiClient
      .get('/wilayah/provinsi')
      .then(res => setProvinsiList(res.data.data))
      .catch(err => {
        console.error('Gagal mengambil provinsi:', err);
      });
  }, []);

  // =========================================================
  // LOAD KABUPATEN BERDASARKAN PROVINSI
  // =========================================================
  useEffect(() => {
    if (form.provinsi_id) {
      apiClient
        .get(`/wilayah/kabupaten/${form.provinsi_id}`)
        .then(res => setKabupatenList(res.data.data))
        .catch(err => {
          console.error('Gagal mengambil kabupaten:', err);
          setKabupatenList([]);
        });
    } else {
      setKabupatenList([]);
    }
  }, [form.provinsi_id]);

  // =========================================================
  // HITUNG LUAS
  // =========================================================
  useEffect(() => {
    const p = parseFloat(form.panjang) || 0;
    const l = parseFloat(form.lebar) || 0;

    setLuas(p * l);
  }, [form.panjang, form.lebar]);

  // =========================================================
  // UPDATE FORM
  // =========================================================
  function update(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  // =========================================================
  // GENERATE RAB
  // =========================================================
  async function handleGenerate(e) {
    e.preventDefault();

    setError('');
    setLoading(true);
    setHasil(null);

    try {
      const res = await apiClient.post(
        '/rab/generate-otomatis',
        form
      );

      if (res.data.success) {
        const boqRes = await apiClient.get(
          `/rab/boq/${res.data.proyek_id}`
        );

        setHasil({
          proyek_id: res.data.proyek_id,
          ringkasan: res.data.ringkasan,
          total: res.data.total,
          boq: boqRes.data.data
        });
      } else {
        setError(
          res.data.message || 'Gagal generate RAB.'
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal generate RAB.'
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // KELOMPOKKAN BOQ BERDASARKAN KATEGORI
  // =========================================================
  const grouped = (hasil?.boq || []).reduce(
    (acc, item) => {
      const key = item.kategori || 'Lainnya';

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(item);

      return acc;
    },
    {}
  );

  // =========================================================
  // RINCIAN UPAH
  // Mengumpulkan semua upah dari seluruh item BOQ
  // berdasarkan nama pekerja
  // =========================================================
  const rincianUpah = (hasil?.boq || []).reduce(
    (acc, item) => {
      for (const d of item.detail || []) {
        if (d.tipe !== 'upah') continue;

        if (!acc[d.nama]) {
          acc[d.nama] = {
            nama: d.nama,
            satuan: d.satuan,
            total_volume: 0,
            harga_satuan: d.harga_satuan,
            total_subtotal: 0
          };
        }

        acc[d.nama].total_volume +=
          Number(d.volume_kebutuhan) || 0;

        acc[d.nama].total_subtotal +=
          Number(d.subtotal) || 0;
      }

      return acc;
    },
    {}
  );

  const rincianUpahList = Object.values(
    rincianUpah
  ).sort(
    (a, b) =>
      b.total_subtotal - a.total_subtotal
  );

  // =========================================================
  // RINCIAN MATERIAL
  // Mengumpulkan semua material dari seluruh item BOQ
  // berdasarkan nama material
  // =========================================================
  const rincianMaterial = (hasil?.boq || []).reduce(
    (acc, item) => {
      for (const d of item.detail || []) {
        if (d.tipe !== 'material') continue;

        if (!acc[d.nama]) {
          acc[d.nama] = {
            nama: d.nama,
            satuan: d.satuan,
            total_volume: 0,
            harga_satuan: d.harga_satuan,
            total_subtotal: 0
          };
        }

        acc[d.nama].total_volume +=
          Number(d.volume_kebutuhan) || 0;

        acc[d.nama].total_subtotal +=
          Number(d.subtotal) || 0;
      }

      return acc;
    },
    {}
  );

  const rincianMaterialList = Object.values(
    rincianMaterial
  ).sort(
    (a, b) =>
      b.total_subtotal - a.total_subtotal
  );

  // =========================================================
  // TOTAL DARI RINCIAN
  // =========================================================
  const totalRincianMaterial =
    rincianMaterialList.reduce(
      (total, item) =>
        total + Number(item.total_subtotal || 0),
      0
    );

  const totalRincianUpah =
    rincianUpahList.reduce(
      (total, item) =>
        total + Number(item.total_subtotal || 0),
      0
    );

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">
        Mesin Hitung RAB
      </h1>

      <p className="text-gray-400 text-sm mb-4">
        Isi data dasar rumah, sistem otomatis menghitung
        seluruh pekerjaan & menghasilkan RAB detail
      </p>

      {/* =====================================================
          WARNING
      ===================================================== */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400 mb-6">
        ⚠️ Volume pekerjaan dihitung otomatis pakai{' '}
        <strong>rumus estimasi standar</strong>{' '}
        (rule of thumb tahap awal perencanaan), dan harga
        dari Database Material/Upah yang bersifat{' '}
        <strong>umum/indikatif</strong>. Untuk keperluan
        resmi ke klien, tetap direview ulang.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ===================================================
            FORM INPUT
        =================================================== */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleGenerate}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 space-y-4"
          >

            {/* Nama Proyek */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Nama Proyek
              </label>

              <input
                required
                value={form.nama_proyek}
                onChange={e =>
                  update(
                    'nama_proyek',
                    e.target.value
                  )
                }
                placeholder="mis: Rumah Bpk. Andi"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
              />
            </div>

            {/* Pemilik & Alamat */}
            <div className="grid grid-cols-2 gap-3">

              <input
                placeholder="Pemilik (opsional)"
                value={form.pemilik}
                onChange={e =>
                  update(
                    'pemilik',
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
              />

              <input
                placeholder="Alamat (opsional)"
                value={form.alamat}
                onChange={e =>
                  update(
                    'alamat',
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
              />

            </div>

            {/* Provinsi & Kabupaten */}
            <div className="grid grid-cols-2 gap-3">

              <select
                value={form.provinsi_id}
                onChange={e =>
                  update(
                    'provinsi_id',
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
              >
                <option value="">
                  Provinsi (opsional)
                </option>

                {provinsiList.map(p => (
                  <option
                    key={p.id}
                    value={p.id}
                  >
                    {p.nama}
                  </option>
                ))}
              </select>

              <select
                value={form.kabupaten_id}
                onChange={e =>
                  update(
                    'kabupaten_id',
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
              >
                <option value="">
                  Kabupaten/Kota
                </option>

                {kabupatenList.map(k => (
                  <option
                    key={k.id}
                    value={k.id}
                  >
                    {k.nama}
                  </option>
                ))}
              </select>

            </div>

            {/* Lebar & Panjang */}
            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="block text-sm font-medium mb-1">
                  Lebar (m)
                </label>

                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.lebar}
                  onChange={e =>
                    update(
                      'lebar',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Panjang (m)
                </label>

                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.panjang}
                  onChange={e =>
                    update(
                      'panjang',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                />
              </div>

            </div>

            {/* Luas */}
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg px-4 py-3 text-sm">
              Luas Tanah/Lantai (otomatis):{' '}
              <span className="font-bold">
                {luas.toFixed(2)} m²
              </span>
            </div>

            {/* Model Rumah */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Model Rumah
              </label>

              <select
                value={form.model_rumah}
                onChange={e =>
                  update(
                    'model_rumah',
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
              >
                {modelRumahOptions.map(m => (
                  <option
                    key={m}
                    value={m}
                  >
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Jumlah Lantai */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Jumlah Lantai
              </label>

              <select
                value={form.jumlah_lantai}
                onChange={e =>
                  update(
                    'jumlah_lantai',
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
              >
                <option value={1}>
                  1 Lantai
                </option>

                <option value={2}>
                  2 Lantai
                </option>

                <option value={3}>
                  3 Lantai
                </option>

                <option value={4}>
                  4 Lantai
                </option>
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Generate */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Calculator
                  className="animate-spin"
                  size={18}
                />
              ) : (
                <Sparkles size={18} />
              )}

              {loading
                ? 'Menghitung RAB...'
                : 'Generate RAB Otomatis'}
            </button>

          </form>
        </div>

        {/* ===================================================
            HASIL
        =================================================== */}
        <div className="lg:col-span-3">

          {/* Belum ada hasil */}
          {!hasil && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 h-full flex items-center justify-center text-center text-gray-400 py-20 px-6">

              <div>
                <Sparkles
                  className="mx-auto mb-3"
                  size={32}
                />

                <p>
                  Isi form di sebelah kiri lalu klik{' '}
                  <strong>
                    Generate RAB Otomatis
                  </strong>{' '}
                  — hasil RAB detail per kategori pekerjaan
                  akan muncul di sini.
                </p>
              </div>

            </div>
          )}

          {/* =================================================
              HASIL RAB
          ================================================= */}
          {hasil && (
            <div className="space-y-5">

              {/* =================================================
                  RINGKASAN TOTAL
              ================================================= */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">

                <h2 className="text-lg font-bold mb-4">
                  Ringkasan RAB
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-4">

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">
                      Total Material
                    </p>

                    <p className="font-bold">
                      {formatRupiah(
                        hasil.total.total_material
                      )}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">
                      Total Upah
                    </p>

                    <p className="font-bold">
                      {formatRupiah(
                        hasil.total.total_upah
                      )}
                    </p>
                  </div>

                </div>

                <div className="bg-primary-600 text-white rounded-lg p-4">

                  <p className="text-xs opacity-80">
                    Grand Total RAB
                  </p>

                  <p className="text-2xl font-bold">
                    {formatRupiah(
                      hasil.total.grand_total
                    )}
                  </p>

                </div>

              </div>

              {/* =================================================
                  BOQ PER KATEGORI
              ================================================= */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">

                <h2 className="text-lg font-bold mb-4">
                  Rincian Pekerjaan / BOQ
                </h2>

                <div className="max-h-[32rem] overflow-y-auto space-y-5">

                  {Object.entries(grouped).map(
                    ([kategori, items]) => (
                      <div key={kategori}>

                        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                          {kategori}
                        </p>

                        <div className="overflow-x-auto">

                          <table className="w-full text-sm">

                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">

                                <th className="text-left py-2 pr-2 font-medium">
                                  Pekerjaan
                                </th>

                                <th className="text-left py-2 pr-2 font-medium">
                                  Volume
                                </th>

                                <th className="text-right py-2 font-medium">
                                  Subtotal
                                </th>

                              </tr>
                            </thead>

                            <tbody>

                              {items.map(item => (
                                <tr
                                  key={item.id}
                                  className="border-b border-gray-50 dark:border-gray-700/50"
                                >

                                  <td className="py-2 pr-2">
                                    {item.nama_pekerjaan}
                                  </td>

                                  <td className="py-2 pr-2 text-gray-400 whitespace-nowrap">
                                    {item.volume}{' '}
                                    {item.satuan}
                                  </td>

                                  <td className="py-2 text-right font-medium whitespace-nowrap">
                                    {formatRupiah(
                                      item.subtotal
                                    )}
                                  </td>

                                </tr>
                              ))}

                            </tbody>

                          </table>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* =================================================
                  RINCIAN MATERIAL
              ================================================= */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">

                <div className="flex items-center justify-between mb-4">

                  <div>
                    <h2 className="text-lg font-bold">
                      Rincian Material
                    </h2>

                    <p className="text-xs text-gray-400 mt-1">
                      Rekap seluruh material dari semua
                      pekerjaan
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      Total Material
                    </p>

                    <p className="font-bold text-primary-600">
                      {formatRupiah(
                        totalRincianMaterial
                      )}
                    </p>
                  </div>

                </div>

                {rincianMaterialList.length > 0 ? (
                  <div className="overflow-x-auto">

                    <table className="w-full text-sm">

                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">

                          <th className="text-left py-2 pr-3 font-medium">
                            No
                          </th>

                          <th className="text-left py-2 pr-3 font-medium">
                            Material
                          </th>

                          <th className="text-right py-2 pr-3 font-medium">
                            Volume
                          </th>

                          <th className="text-right py-2 pr-3 font-medium">
                            Satuan
                          </th>

                          <th className="text-right py-2 pr-3 font-medium">
                            Harga Satuan
                          </th>

                          <th className="text-right py-2 font-medium">
                            Subtotal
                          </th>

                        </tr>
                      </thead>

                      <tbody>

                        {rincianMaterialList.map(
                          (item, index) => (
                            <tr
                              key={`${item.nama}-${index}`}
                              className="border-b border-gray-50 dark:border-gray-700/50"
                            >

                              <td className="py-2 pr-3 text-gray-400">
                                {index + 1}
                              </td>

                              <td className="py-2 pr-3 font-medium">
                                {item.nama}
                              </td>

                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {Number(
                                  item.total_volume || 0
                                ).toLocaleString(
                                  'id-ID',
                                  {
                                    maximumFractionDigits: 2
                                  }
                                )}
                              </td>

                              <td className="py-2 pr-3 text-right text-gray-400 whitespace-nowrap">
                                {item.satuan}
                              </td>

                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {formatRupiah(
                                  item.harga_satuan
                                )}
                              </td>

                              <td className="py-2 text-right font-medium whitespace-nowrap">
                                {formatRupiah(
                                  item.total_subtotal
                                )}
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                      <tfoot>

                        <tr className="border-t-2 border-gray-200 dark:border-gray-700">

                          <td
                            colSpan="5"
                            className="py-3 text-right font-bold"
                          >
                            Total Material
                          </td>

                          <td className="py-3 text-right font-bold">
                            {formatRupiah(
                              totalRincianMaterial
                            )}
                          </td>

                        </tr>

                      </tfoot>

                    </table>

                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Tidak ada rincian material.
                  </div>
                )}

              </div>

              {/* =================================================
                  RINCIAN UPAH
              ================================================= */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">

                <div className="flex items-center justify-between mb-4">

                  <div>
                    <h2 className="text-lg font-bold">
                      Rincian Upah
                    </h2>

                    <p className="text-xs text-gray-400 mt-1">
                      Rekap seluruh upah tenaga kerja dari
                      semua pekerjaan
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      Total Upah
                    </p>

                    <p className="font-bold text-primary-600">
                      {formatRupiah(
                        totalRincianUpah
                      )}
                    </p>
                  </div>

                </div>

                {rincianUpahList.length > 0 ? (
                  <div className="overflow-x-auto">

                    <table className="w-full text-sm">

                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">

                          <th className="text-left py-2 pr-3 font-medium">
                            No
                          </th>

                          <th className="text-left py-2 pr-3 font-medium">
                            Jenis Pekerja
                          </th>

                          <th className="text-right py-2 pr-3 font-medium">
                            Volume
                          </th>

                          <th className="text-right py-2 pr-3 font-medium">
                            Satuan
                          </th>

                          <th className="text-right py-2 pr-3 font-medium">
                            Harga Satuan
                          </th>

                          <th className="text-right py-2 font-medium">
                            Subtotal
                          </th>

                        </tr>
                      </thead>

                      <tbody>

                        {rincianUpahList.map(
                          (item, index) => (
                            <tr
                              key={`${item.nama}-${index}`}
                              className="border-b border-gray-50 dark:border-gray-700/50"
                            >

                              <td className="py-2 pr-3 text-gray-400">
                                {index + 1}
                              </td>

                              <td className="py-2 pr-3 font-medium">
                                {item.nama}
                              </td>

                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {Number(
                                  item.total_volume || 0
                                ).toLocaleString(
                                  'id-ID',
                                  {
                                    maximumFractionDigits: 2
                                  }
                                )}
                              </td>

                              <td className="py-2 pr-3 text-right text-gray-400 whitespace-nowrap">
                                {item.satuan}
                              </td>

                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {formatRupiah(
                                  item.harga_satuan
                                )}
                              </td>

                              <td className="py-2 text-right font-medium whitespace-nowrap">
                                {formatRupiah(
                                  item.total_subtotal
                                )}
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                      <tfoot>

                        <tr className="border-t-2 border-gray-200 dark:border-gray-700">

                          <td
                            colSpan="5"
                            className="py-3 text-right font-bold"
                          >
                            Total Upah
                          </td>

                          <td className="py-3 text-right font-bold">
                            {formatRupiah(
                              totalRincianUpah
                            )}
                          </td>

                        </tr>

                      </tfoot>

                    </table>

                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Tidak ada rincian upah.
                  </div>
                )}

              </div>

              {/* =================================================
                  VERIFIKASI TOTAL
              ================================================= */}
              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700 p-5">

                <h2 className="text-sm font-bold mb-3">
                  Rekapitulasi
                </h2>

                <div className="space-y-2 text-sm">

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      Material
                    </span>

                    <span className="font-medium">
                      {formatRupiah(
                        totalRincianMaterial
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      Upah
                    </span>

                    <span className="font-medium">
                      {formatRupiah(
                        totalRincianUpah
                      )}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between gap-4">
                    <span className="font-bold">
                      Total
                    </span>

                    <span className="font-bold text-lg">
                      {formatRupiah(
                        totalRincianMaterial +
                        totalRincianUpah
                      )}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 pt-2">
                    Total di atas berasal dari rincian
                    material dan upah yang dikumpulkan dari
                    seluruh detail BOQ.
                  </div>

                </div>

              </div>

              {/* =================================================
                  BUTTON DAFTAR PROYEK
              ================================================= */}
              <button
                onClick={() =>
                  navigate('/daftar-proyek')
                }
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium py-3 rounded-lg text-sm"
              >
                Lihat & Download di Daftar Proyek
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
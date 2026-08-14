import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client.js';

export default function ProyekBaru() {
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // =========================================================
  // LOAD PROVINSI
  // =========================================================
  useEffect(() => {
    apiClient
      .get('/wilayah/provinsi')
      .then(res => {
        setProvinsiList(res.data.data);
      })
      .catch(err => {
        console.error('Gagal mengambil provinsi:', err);
        setError('Gagal mengambil data provinsi.');
      });
  }, []);

  // =========================================================
  // LOAD KABUPATEN BERDASARKAN PROVINSI
  // =========================================================
  useEffect(() => {
    if (form.provinsi_id) {
      apiClient
        .get(`/wilayah/kabupaten/${form.provinsi_id}`)
        .then(res => {
          setKabupatenList(res.data.data);
        })
        .catch(err => {
          console.error('Gagal mengambil kabupaten:', err);
          setKabupatenList([]);
        });
    } else {
      setKabupatenList([]);
    }
  }, [form.provinsi_id]);

  // =========================================================
  // HITUNG LUAS OTOMATIS
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
  // SIMPAN PROYEK + GENERATE RAB OTOMATIS
  // =========================================================
  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      // Data yang dikirim sama seperti yang digunakan MesinRAB
      const dataRAB = {
        nama_proyek: form.nama_proyek,
        pemilik: form.pemilik,
        alamat: form.alamat,
        provinsi_id: form.provinsi_id || '',
        kabupaten_id: form.kabupaten_id || '',
        panjang: form.panjang,
        lebar: form.lebar,
        jumlah_lantai: form.jumlah_lantai,
        model_rumah: form.model_rumah
      };

      // =====================================================
      // INI YANG PENTING:
      // Gunakan mesin generate RAB yang sama dengan MesinRAB
      // =====================================================
      const res = await apiClient.post(
        '/rab/generate-otomatis',
        dataRAB
      );

      if (!res.data.success) {
        throw new Error(
          res.data.message || 'Gagal membuat RAB.'
        );
      }

      // =====================================================
      // Ambil proyek_id hasil generate
      // =====================================================
      const proyekId = res.data.proyek_id;

      if (!proyekId) {
        throw new Error(
          'Proyek berhasil dibuat tetapi ID proyek tidak ditemukan.'
        );
      }

      // =====================================================
      // Pastikan BOQ/RAB sudah tersimpan dan bisa dibaca
      // =====================================================
      await apiClient.get(
        `/rab/boq/${proyekId}`
      );

      // =====================================================
      // Setelah proyek + RAB berhasil dibuat,
      // masuk ke Daftar Proyek
      // =====================================================
      navigate('/daftar-proyek');

    } catch (err) {
      console.error('Gagal membuat proyek + RAB:', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Gagal menyimpan proyek dan membuat RAB.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <h1 className="text-2xl font-bold mb-1">
        Proyek Baru
      </h1>

      <p className="text-gray-400 text-sm mb-6">
        Isi data proyek untuk membuat proyek sekaligus menghitung RAB otomatis
      </p>

      {/* =====================================================
          FORM
      ====================================================== */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4"
      >

        {/* ===================================================
            NAMA PROYEK
        ==================================================== */}
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
            placeholder="Contoh: Rumah Bpk. Andi"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        {/* ===================================================
            PEMILIK + MODEL RUMAH
        ==================================================== */}
        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="block text-sm font-medium mb-1">
              Pemilik
            </label>

            <input
              value={form.pemilik}
              onChange={e =>
                update(
                  'pemilik',
                  e.target.value
                )
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Jenis Rumah
            </label>

            <select
              value={form.model_rumah}
              onChange={e =>
                update(
                  'model_rumah',
                  e.target.value
                )
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="Minimalis">
                Minimalis
              </option>

              <option value="Modern">
                Modern
              </option>

              <option value="Japandi">
                Japandi
              </option>

              <option value="Klasik">
                Klasik
              </option>

              <option value="Industrial">
                Industrial
              </option>

              <option value="Premium">
                Premium
              </option>
            </select>
          </div>

        </div>

        {/* ===================================================
            ALAMAT
        ==================================================== */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Alamat
          </label>

          <input
            value={form.alamat}
            onChange={e =>
              update(
                'alamat',
                e.target.value
              )
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        {/* ===================================================
            PROVINSI + KABUPATEN
        ==================================================== */}
        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="block text-sm font-medium mb-1">
              Provinsi
            </label>

            <select
              value={form.provinsi_id}
              onChange={e => {
                update(
                  'provinsi_id',
                  e.target.value
                );

                update(
                  'kabupaten_id',
                  ''
                );
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="">
                Pilih Provinsi
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Kabupaten/Kota
            </label>

            <select
              value={form.kabupaten_id}
              onChange={e =>
                update(
                  'kabupaten_id',
                  e.target.value
                )
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="">
                Pilih Kabupaten/Kota
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

        </div>

        {/* ===================================================
            UKURAN + LANTAI
        ==================================================== */}
        <div className="grid grid-cols-3 gap-4">

          <div>
            <label className="block text-sm font-medium mb-1">
              Panjang (m)
            </label>

            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={form.panjang}
              onChange={e =>
                update(
                  'panjang',
                  e.target.value
                )
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Lebar (m)
            </label>

            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={form.lebar}
              onChange={e =>
                update(
                  'lebar',
                  e.target.value
                )
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Jumlah Lantai
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={form.jumlah_lantai}
              onChange={e =>
                update(
                  'jumlah_lantai',
                  e.target.value
                )
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

        </div>

        {/* ===================================================
            LUAS BANGUNAN
        ==================================================== */}
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg px-4 py-3 text-sm">
          Luas Bangunan (otomatis):{' '}
          <span className="font-bold">
            {luas.toFixed(2)} m²
          </span>
        </div>

        {/* ===================================================
            INFORMASI
        ==================================================== */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          ⚠️ Setelah klik <strong>Simpan Proyek</strong>,
          sistem akan langsung membuat proyek dan
          menghitung RAB otomatis berdasarkan data
          rumah yang dimasukkan.
        </div>

        {/* ===================================================
            ERROR
        ==================================================== */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* ===================================================
            SUBMIT
        ==================================================== */}
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? 'Membuat Proyek & Menghitung RAB...'
            : 'Simpan Proyek & Hitung RAB'}
        </button>

      </form>
    </div>
  );
}
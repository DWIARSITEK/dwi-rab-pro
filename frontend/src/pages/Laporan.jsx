import { useState, useEffect } from 'react';
import { FileText, Download, Printer, Loader2 } from 'lucide-react';
import apiClient from '../api/client.js';

export default function Laporan() {
  const [proyekList, setProyekList] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [proyekRes, riwayatRes] = await Promise.all([
        apiClient.get('/proyek'),
        apiClient.get('/laporan/riwayat/all')
      ]);

      setProyekList(proyekRes.data.data || []);
      setRiwayat(riwayatRes.data.data || []);
    } catch (err) {
      console.error('Gagal memuat laporan:', err);
    }
  }

  // ==============================
  // DOWNLOAD FILE
  // ==============================
  async function downloadFile(proyek, jenis) {
    const key = `${proyek.id}-${jenis}`;
    setDownloading(key);

    try {
      const response = await apiClient.get(
        `/laporan/${proyek.id}/${jenis}`,
        {
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], {
        type:
          jenis === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;

      const safeName = (proyek.nama_proyek || 'Proyek')
        .replace(/[<>:"/\\|?*]+/g, '-')
        .trim();

      link.download = `RAB-${safeName}.${jenis === 'pdf' ? 'pdf' : 'xlsx'}`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      // Refresh riwayat setelah berhasil download
      const riwayatRes = await apiClient.get('/laporan/riwayat/all');
      setRiwayat(riwayatRes.data.data || []);

    } catch (err) {
      console.error(`Gagal download ${jenis}:`, err);

      // Kalau backend mengembalikan JSON error dalam bentuk blob
      try {
        if (err.response?.data instanceof Blob) {
          const text = await err.response.data.text();

          try {
            const json = JSON.parse(text);
            alert(json.message || `Gagal download ${jenis.toUpperCase()}.`);
          } catch {
            alert(`Gagal download ${jenis.toUpperCase()}.`);
          }
        } else {
          alert(
            err.response?.data?.message ||
            `Gagal download ${jenis.toUpperCase()}.`
          );
        }
      } catch {
        alert(`Gagal download ${jenis.toUpperCase()}.`);
      }
    } finally {
      setDownloading(null);
    }
  }

  // ==============================
  // PRINT PDF
  // ==============================
  async function printPdf(proyek) {
    const key = `${proyek.id}-print`;
    setDownloading(key);

    try {
      const response = await apiClient.get(
        `/laporan/${proyek.id}/pdf`,
        {
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], {
        type: 'application/pdf'
      });

      const url = window.URL.createObjectURL(blob);

      const printWindow = window.open(url, '_blank');

      if (!printWindow) {
        alert('Popup diblokir browser. Izinkan popup untuk mencetak PDF.');
      }

      // Jangan langsung revoke karena browser masih membutuhkan URL
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);

    } catch (err) {
      console.error('Gagal membuka PDF:', err);
      alert(
        err.response?.data?.message ||
        'Gagal membuka PDF untuk dicetak.'
      );
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">
        Laporan
      </h1>

      <p className="text-gray-400 text-sm mb-6">
        Download laporan RAB dalam format PDF atau Excel
      </p>

      {/* ==============================
          DOWNLOAD PER PROYEK
      ============================== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 mb-6">

        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 font-semibold text-sm">
          Download per Proyek
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">

          {proyekList.length === 0 && (
            <p className="p-4 text-sm text-gray-400">
              Belum ada proyek.
            </p>
          )}

          {proyekList.map(p => {

            const pdfLoading = downloading === `${p.id}-pdf`;
            const excelLoading = downloading === `${p.id}-excel`;
            const printLoading = downloading === `${p.id}-print`;

            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 gap-4"
              >

                {/* INFO PROYEK */}
                <div className="flex items-center gap-3 min-w-0">

                  <FileText
                    className="text-primary-600 flex-shrink-0"
                    size={20}
                  />

                  <div className="min-w-0">

                    <p className="text-sm font-medium truncate">
                      {p.nama_proyek}
                    </p>

                    <p className="text-xs text-gray-400">
                      {p.jenis_rumah} • {p.luas} m²
                    </p>

                  </div>

                </div>

                {/* TOMBOL */}
                <div className="flex gap-2 flex-shrink-0">

                  {/* PDF */}
                  <button
                    type="button"
                    disabled={downloading !== null}
                    onClick={() => downloadFile(p, 'pdf')}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pdfLoading ? (
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <Download size={14} />
                    )}

                    {pdfLoading ? 'Mengunduh...' : 'PDF'}
                  </button>

                  {/* EXCEL */}
                  <button
                    type="button"
                    disabled={downloading !== null}
                    onClick={() => downloadFile(p, 'excel')}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {excelLoading ? (
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <Download size={14} />
                    )}

                    {excelLoading ? 'Mengunduh...' : 'Excel'}
                  </button>

                  {/* PRINT */}
                  <button
                    type="button"
                    disabled={downloading !== null}
                    onClick={() => printPdf(p)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {printLoading ? (
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <Printer size={14} />
                    )}

                    {printLoading ? 'Membuka...' : 'Print'}
                  </button>

                </div>

              </div>
            );
          })}

        </div>
      </div>

      {/* ==============================
          RIWAYAT EXPORT
      ============================== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">

        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 font-semibold text-sm">
          Riwayat Export
        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="py-2.5 px-4">
                  Proyek
                </th>

                <th className="py-2.5 px-4">
                  Jenis
                </th>

                <th className="py-2.5 px-4">
                  Waktu
                </th>
              </tr>
            </thead>

            <tbody>

              {riwayat.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="p-4 text-gray-400"
                  >
                    Belum ada riwayat export.
                  </td>
                </tr>
              )}

              {riwayat.map(r => (
                <tr
                  key={r.id}
                  className="border-b border-gray-50 dark:border-gray-700/50"
                >

                  <td className="py-2.5 px-4">
                    {r.nama_proyek}
                  </td>

                  <td className="py-2.5 px-4">
                    {r.jenis}
                  </td>

                  <td className="py-2.5 px-4 text-gray-400">
                    {new Date(r.created_at).toLocaleString('id-ID')}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      </div>
    </div>
  );
}
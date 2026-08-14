import { useLicense } from '../context/LicenseContext.jsx';
import { ShieldCheck } from 'lucide-react';

export default function Tentang() {
  const { license } = useLicense();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-1">Tentang Aplikasi</h1>
      <p className="text-gray-400 text-sm mb-6">Informasi versi dan status lisensi</p>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold">DR</div>
          <div>
            <p className="font-bold">DWI RAB PRO SNI 2026</p>
            <p className="text-xs text-gray-400">Versi 1.0.0</p>
          </div>
        </div>

        <div className="text-sm space-y-1.5">
          <p><span className="text-gray-400">Developer:</span> <span className="font-medium">DWI ARSITEK</span></p>
          <p><span className="text-gray-400">Pemilik Lisensi:</span> <span className="font-medium">{license?.nama_pemilik || '-'}</span></p>
          <p className="flex items-center gap-1.5">
            <span className="text-gray-400">Status Lisensi:</span>
            <span className="flex items-center gap-1 text-green-600 font-medium"><ShieldCheck size={14} /> {license?.status || '-'}</span>
          </p>
          <p><span className="text-gray-400">Berlaku Hingga:</span> <span className="font-medium">{license?.tanggal_kedaluwarsa ? new Date(license.tanggal_kedaluwarsa).toLocaleDateString('id-ID') : '-'}</span></p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400 space-y-2">
          <p><strong>Disclaimer Harga:</strong> Database Material dan Database Upah bawaan aplikasi ini berisi <strong>HARGA UMUM/INDIKATIF</strong> hasil estimasi pasar secara umum — <strong>bukan</strong> harga resmi HSPK (Harga Satuan Pokok Kegiatan) dari Dinas PU/instansi pemerintah daerah manapun. Harga aktual di lapangan dapat berbeda tergantung wilayah, waktu, dan penyedia material.</p>
          <p><strong>Disclaimer Estimasi:</strong> Hasil estimasi RAB pada aplikasi ini sepenuhnya bergantung pada data Database Material, Database Upah, dan Database AHSP yang tersimpan/diinput di sistem. Sebelum digunakan untuk keperluan resmi (penawaran ke klien, pengajuan kredit, dsb), pengguna wajib memverifikasi dan menyesuaikan harga-harga tersebut dengan kondisi pasar dan wilayah terkini melalui menu Database Material dan Database Upah.</p>
        </div>
      </div>
    </div>
  );
}

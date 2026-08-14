import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FolderOpen, DollarSign, Ruler, FileText } from 'lucide-react';
import apiClient from '../api/client.js';

const COLORS = ['#2563eb', '#60a5fa', '#93c5fd', '#1e40af'];

function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/dashboard/summary')
      .then(res => setSummary(res.data.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Jumlah Proyek', value: summary?.jumlah_proyek ?? 0, icon: FolderOpen, color: 'bg-blue-500' },
    { label: 'Nilai Total RAB', value: formatRupiah(summary?.nilai_total_rab), icon: DollarSign, color: 'bg-green-500' },
    { label: 'Total Luas Bangunan', value: `${summary?.total_luas_bangunan ?? 0} m²`, icon: Ruler, color: 'bg-amber-500' },
    { label: 'Total Laporan', value: summary?.total_laporan ?? 0, icon: FileText, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 text-sm">Ringkasan aktivitas estimasi RAB Anda</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center text-white mb-3`}>
              <c.icon size={20} />
            </div>
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className="text-xl font-bold mt-1">{loading ? '...' : c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold mb-4">Nilai RAB per Bulan (6 Bulan Terakhir)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={summary?.grafik_bulanan || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="bulan" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
              <Tooltip formatter={(v) => formatRupiah(v)} />
              <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold mb-4">Proyek per Jenis Rumah</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={summary?.grafik_jenis_rumah || []}
                dataKey="jumlah"
                nameKey="jenis_rumah"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {(summary?.grafik_jenis_rumah || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

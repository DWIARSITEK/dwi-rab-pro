import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderPlus, FolderOpen, Calculator,
  Package, Users, BookOpen, ClipboardList, FileText, Settings, Info
} from 'lucide-react';

const menuItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/proyek-baru', icon: FolderPlus, label: 'Proyek Baru' },
  { to: '/daftar-proyek', icon: FolderOpen, label: 'Daftar Proyek' },
  { to: '/mesin-rab', icon: Calculator, label: 'Mesin Hitung RAB' },
  { to: '/database-material', icon: Package, label: 'Database Material' },
  { to: '/database-upah', icon: Users, label: 'Database Upah' },
  { to: '/database-ahsp', icon: BookOpen, label: 'Database AHSP' },
  { to: '/boq', icon: ClipboardList, label: 'BOQ' },
  { to: '/laporan', icon: FileText, label: 'Laporan' },
  { to: '/pengaturan', icon: Settings, label: 'Pengaturan' },
  { to: '/tentang', icon: Info, label: 'Tentang' },
];

export default function Sidebar({ open }) {
  return (
    <aside
      className={`fixed lg:static z-30 top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-200 ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-200 dark:border-gray-700">
        <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
          DR
        </div>
        <div>
          <p className="text-xs text-gray-400 leading-none">DWI ARSITEK</p>
          <p className="text-sm font-bold leading-tight">RAB PRO SNI 2026</p>
        </div>
      </div>

      <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
        {menuItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

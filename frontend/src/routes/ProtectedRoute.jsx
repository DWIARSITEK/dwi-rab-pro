import { Navigate } from 'react-router-dom';
import { useLicense } from '../context/LicenseContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isActivated, loading } = useLicense();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 dark:text-gray-400">Memeriksa lisensi...</p>
        </div>
      </div>
    );
  }

  if (!isActivated) {
    return <Navigate to="/aktivasi" replace />;
  }

  return children;
}

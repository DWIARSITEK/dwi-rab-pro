import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

// Sisipkan token lisensi otomatis di setiap request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dwirab_license_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Jika lisensi ditolak (401/403), otomatis lempar ke halaman aktivasi
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const isLicenseCall = error.config?.url?.includes('/license/');
      if (!isLicenseCall) {
        localStorage.removeItem('dwirab_license_token');
        localStorage.removeItem('dwirab_license_info');
        window.location.href = '/aktivasi';
      }
    }
    return Promise.reject(error);
  }
);

// Client terpisah untuk admin (pakai token admin, bukan token lisensi)
export const adminClient = axios.create({ baseURL: '/api/admin' });
adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dwirab_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;

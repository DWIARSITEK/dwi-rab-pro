import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const LicenseContext = createContext(null);

export function LicenseProvider({ children }) {
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  async function checkLicenseStatus() {
    const token = localStorage.getItem('dwirab_license_token');
    if (!token) {
      setLoading(false);
      setIsActivated(false);
      return;
    }

    try {
      const res = await apiClient.get('/license/status');
      if (res.data.success) {
        setLicense(res.data.license);
        setIsActivated(true);
      }
    } catch (err) {
      localStorage.removeItem('dwirab_license_token');
      setIsActivated(false);
    } finally {
      setLoading(false);
    }
  }

  async function activate(kodeLisensi) {
    const res = await apiClient.post('/license/activate', { kode_lisensi: kodeLisensi });
    if (res.data.success) {
      localStorage.setItem('dwirab_license_token', res.data.token);
      localStorage.setItem('dwirab_license_info', JSON.stringify(res.data.license));
      setLicense(res.data.license);
      setIsActivated(true);
    }
    return res.data;
  }

  function logout() {
    localStorage.removeItem('dwirab_license_token');
    localStorage.removeItem('dwirab_license_info');
    setLicense(null);
    setIsActivated(false);
  }

  return (
    <LicenseContext.Provider value={{ license, loading, isActivated, activate, logout, checkLicenseStatus }}>
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  return useContext(LicenseContext);
}

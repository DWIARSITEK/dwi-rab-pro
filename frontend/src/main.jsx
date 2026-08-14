import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { LicenseProvider } from './context/LicenseContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LicenseProvider>
        <App />
      </LicenseProvider>
    </BrowserRouter>
  </React.StrictMode>
);

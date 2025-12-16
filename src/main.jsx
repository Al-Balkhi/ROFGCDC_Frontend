import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import useAuthStore from './store/authStore';
import 'leaflet/dist/leaflet.css';


// Ensure RTL is set on document
document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'ar');

// Initialize auth state on app startup
useAuthStore.getState().initialize();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

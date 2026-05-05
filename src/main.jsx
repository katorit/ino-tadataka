import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// localStorage を window.storage API として提供
window.storage = {
  get: async (key) => {
    const value = localStorage.getItem(key);
    return value !== null ? { value } : null;
  },
  set: async (key, value) => {
    localStorage.setItem(key, value);
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

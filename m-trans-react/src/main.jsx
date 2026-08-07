import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n.js';

// StrictMode çıxarıldı — development-də double-effect bug-larını aradan qaldırır
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
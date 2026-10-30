import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';                // App ใช้ Default Import (ไม่มีปีกกา)
import './index.css';
import { AuthProvider } from './context/AuthContext'; // AuthProvider ใช้ Named Import (มีปีกกา)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
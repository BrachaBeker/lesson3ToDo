import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import service from './service';

// מסך המשימות זמין רק למשתמש מחובר - אחרת מפנים להתחברות
function RequireAuth({ children }) {
  return service.isLoggedIn() ? children : <Navigate to="/login" replace />;
}

// משתמש מחובר שנכנס להתחברות/הרשמה עובר ישר למשימות
function GuestOnly({ children }) {
  return service.isLoggedIn() ? <Navigate to="/" replace /> : children;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<RequireAuth><App /></RequireAuth>} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

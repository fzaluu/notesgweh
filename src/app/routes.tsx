import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './providers/AuthProvider';

// Placeholder sementara untuk halaman-halaman yang akan kita buat bertahap
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/user/DashboardPage';
import FinancePage from '../pages/user/FinancePage';
import NotesPage from '../pages/user/NotesPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import UsersPage from '../pages/admin/UsersPage';
import ActivityLogsPage from '../pages/admin/ActivityLogsPage';

// Komponen penjaga rute (Route Guard) untuk User yang sudah login
const ProtectedUserRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center font-bold">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;

  return <>{children}</>;
};

// Komponen penjaga rute untuk Admin
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center font-bold">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

// Penjaga rute untuk halaman Login (jika sudah login, lempar ke dashboard masing-masing)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center font-bold">Loading...</div>;
  if (session) {
    if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* User Routes */}
      <Route path="/dashboard" element={<ProtectedUserRoute><DashboardPage /></ProtectedUserRoute>} />
      <Route path="/finance" element={<ProtectedUserRoute><FinancePage /></ProtectedUserRoute>} />
      <Route path="/notes" element={<ProtectedUserRoute><NotesPage /></ProtectedUserRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboardPage /></ProtectedAdminRoute>} />
      <Route path="/admin/users" element={<ProtectedAdminRoute><UsersPage /></ProtectedAdminRoute>} />
      <Route path="/admin/logs" element={<ProtectedAdminRoute><ActivityLogsPage /></ProtectedAdminRoute>} />

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
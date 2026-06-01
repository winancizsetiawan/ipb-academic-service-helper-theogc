import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

import LandingPage from '@/pages/LandingPage'
import Login from '@/pages/Login'
import VerifyEmail from '@/pages/VerifyEmail'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'

import FAQ from '@/pages/mahasiswa/FAQ'
import Submit from '@/pages/mahasiswa/Submit'
import Track from '@/pages/mahasiswa/Track'
import DiscList from '@/pages/mahasiswa/DiscList'
import DiscNew from '@/pages/mahasiswa/DiscNew'
import DiscDetail from '@/pages/mahasiswa/DiscDetail'
import Notifications from '@/pages/mahasiswa/Notifications'
import StudentProfile from '@/pages/mahasiswa/Profile'
import GenerateSurat from '@/pages/mahasiswa/GenerateSurat'

import StaffDashboard from '@/pages/staff/Dashboard'
import StaffRequests from '@/pages/staff/Requests'
import ManageFAQ from '@/pages/staff/ManageFAQ'
import ManageDisc from '@/pages/staff/ManageDisc'
import StaffProfile from '@/pages/staff/Profile'

import AdminDashboard from '@/pages/admin/Dashboard'
import AdminUsers from '@/pages/admin/Users'
import AdminCategories from '@/pages/admin/Categories'
import AdminStatistics from '@/pages/admin/Statistics'
import AdminProfile from '@/pages/admin/Profile'

function RequireAuth({ children, role }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  const home =
    user?.role === 'staff'
      ? '/staff/dashboard'
      : user?.role === 'admin'
        ? '/admin/dashboard'
        : '/faq'

  return (
    <Routes>
      {/* Landing Page */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={home} replace />
          ) : (
            <LandingPage />
          )
        }
      />

      {/* Login */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={home} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Verify Email */}
      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* Student Routes */}
      <Route
        path="/faq"
        element={
          <RequireAuth role="mahasiswa">
            <FAQ />
          </RequireAuth>
        }
      />

      <Route
        path="/submit"
        element={
          <RequireAuth role="mahasiswa">
            <Submit />
          </RequireAuth>
        }
      />

      <Route
        path="/track"
        element={
          <RequireAuth role="mahasiswa">
            <Track />
          </RequireAuth>
        }
      />

      <Route
        path="/generate-surat"
        element={
          <RequireAuth role="mahasiswa">
            <GenerateSurat />
          </RequireAuth>
        }
      />

      <Route
        path="/diskusi"
        element={
          <RequireAuth role="mahasiswa">
            <DiscList />
          </RequireAuth>
        }
      />

      <Route
        path="/diskusi/baru"
        element={
          <RequireAuth role="mahasiswa">
            <DiscNew />
          </RequireAuth>
        }
      />

      <Route
        path="/diskusi/detail"
        element={
          <RequireAuth role="mahasiswa">
            <DiscDetail />
          </RequireAuth>
        }
      />

      <Route
        path="/notifikasi"
        element={
          <RequireAuth role="mahasiswa">
            <Notifications />
          </RequireAuth>
        }
      />

      <Route
        path="/profil"
        element={
          <RequireAuth role="mahasiswa">
            <StudentProfile />
          </RequireAuth>
        }
      />

      {/* Staff Routes */}
      <Route
        path="/staff/dashboard"
        element={
          <RequireAuth role="staff">
            <StaffDashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/staff/requests"
        element={
          <RequireAuth role="staff">
            <StaffRequests />
          </RequireAuth>
        }
      />

      <Route
        path="/staff/faq"
        element={
          <RequireAuth role="staff">
            <ManageFAQ />
          </RequireAuth>
        }
      />

      <Route
        path="/staff/diskusi"
        element={
          <RequireAuth role="staff">
            <ManageDisc />
          </RequireAuth>
        }
      />

      <Route
        path="/staff/profil"
        element={
          <RequireAuth role="staff">
            <StaffProfile />
          </RequireAuth>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth role="admin">
            <AdminDashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/admin/pengguna"
        element={
          <RequireAuth role="admin">
            <AdminUsers />
          </RequireAuth>
        }
      />

      <Route
        path="/admin/kategori"
        element={
          <RequireAuth role="admin">
            <AdminCategories />
          </RequireAuth>
        }
      />

      <Route
        path="/admin/statistik"
        element={
          <RequireAuth role="admin">
            <AdminStatistics />
          </RequireAuth>
        }
      />

      <Route
        path="/admin/profil"
        element={
          <RequireAuth role="admin">
            <AdminProfile />
          </RequireAuth>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

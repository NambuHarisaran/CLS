import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import RequireRole from './components/RequireRole'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const CustomerDashboard = lazy(() => import('./pages/customer/Dashboard'))
const CustomerBills = lazy(() => import('./pages/customer/Bills'))
const CustomerCoupons = lazy(() => import('./pages/customer/Coupons'))
const CustomerProfile = lazy(() => import('./pages/customer/Profile'))
const POSPage = lazy(() => import('./pages/POS'))
const AdminOverview = lazy(() => import('./pages/admin/Overview'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))
const AdminCustomers = lazy(() => import('./pages/admin/Customers'))
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'))
const AdminOffers = lazy(() => import('./pages/admin/Offers'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const AdminStaff = lazy(() => import('./pages/admin/Staff'))

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-green-50">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Customer routes */}
            <Route path="/me" element={<RequireRole roles={['customer', 'admin', 'cashier']}><CustomerDashboard /></RequireRole>} />
            <Route path="/me/bills" element={<RequireRole roles={['customer', 'admin', 'cashier']}><CustomerBills /></RequireRole>} />
            <Route path="/me/coupons" element={<RequireRole roles={['customer', 'admin', 'cashier']}><CustomerCoupons /></RequireRole>} />
            <Route path="/me/profile" element={<RequireRole roles={['customer', 'admin', 'cashier']}><CustomerProfile /></RequireRole>} />

            {/* Cashier POS */}
            <Route path="/pos" element={<RequireRole roles={['cashier', 'admin']}><POSPage /></RequireRole>} />

            {/* Admin */}
            <Route path="/admin" element={<RequireRole roles={['admin']}><AdminOverview /></RequireRole>} />
            <Route path="/admin/products" element={<RequireRole roles={['admin']}><AdminProducts /></RequireRole>} />
            <Route path="/admin/customers" element={<RequireRole roles={['admin']}><AdminCustomers /></RequireRole>} />
            <Route path="/admin/coupons" element={<RequireRole roles={['admin']}><AdminCoupons /></RequireRole>} />
            <Route path="/admin/offers" element={<RequireRole roles={['admin']}><AdminOffers /></RequireRole>} />
            <Route path="/admin/settings" element={<RequireRole roles={['admin']}><AdminSettings /></RequireRole>} />
            <Route path="/admin/staff" element={<RequireRole roles={['admin']}><AdminStaff /></RequireRole>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </BrowserRouter>
    </AuthProvider>
  )
}

import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import ToastContainer from './components/ToastUI'
import LogoutModal from './components/LogoutModal'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import MainDashboard from './components/MainDashboard'
import DashboardHome from './components/DashboardHome'
import PackagesPage from './components/PackagesPage'
import WalletPage from './components/WalletPage'
import TeamPage from './components/TeamPage'
import AdminDashboard from './components/AdminDashboard'
import InvestmentPage from './components/InvestmentPage'
import ProfilePage from './components/ProfilePage'
import ReferralPage from './components/ReferralPage'
import TransactionsPage from './components/TransactionsPage'
import DepositPage from './components/DepositPage'
import WithdrawPage from './components/WithdrawPage'
import NotificationsPage from './components/NotificationsPage'
import SupportPage from './components/SupportPage'
import KYCPage from './components/KYCPage'

function ReferralRedirect() {
  const { code } = useParams()
  useEffect(() => {
    if (code) {
      sessionStorage.setItem('prime_ref_code', code)
    }
  }, [code])
  
  return <Navigate to={`/?ref=${code || ''}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/ref/:code" element={<ReferralRedirect />} />
            <Route path="/ref" element={<Navigate to="/" replace />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MainDashboard />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="deposit" element={<DepositPage />} />
              <Route path="packages" element={<PackagesPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="withdraw" element={<WithdrawPage />} />
              <Route path="investments" element={<InvestmentPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="referrals" element={<ReferralPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="kyc" element={<KYCPage />} />
            </Route>

            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
          <ToastContainer />
          <LogoutModal isOpen={false} onClose={() => {}} />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

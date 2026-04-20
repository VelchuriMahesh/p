import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import OfflineBanner from './components/OfflineBanner';
import { useAuth } from './hooks/useAuth';
import { getRouteForRole } from './utils/navigation';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/donor/HomePage';
import FeedPage from './pages/donor/FeedPage';
import NGODetailPage from './pages/donor/NGODetailPage';
import DonateOnlinePage from './pages/donor/DonateOnlinePage';
import DeliverPage from './pages/donor/DeliverPage';
import DashboardPage from './pages/donor/DashboardPage';
import CertificatePage from './pages/donor/CertificatePage';
import LeaderboardPage from './pages/donor/LeaderboardPage';
import MapPage from './pages/donor/MapPage';
import NotificationsPage from './pages/donor/NotificationsPage';
import NGODashboard from './pages/ngo/NGODashboard';
import ManageNeeds from './pages/ngo/ManageNeeds';
import ManagePosts from './pages/ngo/ManagePosts';
import VerifyDonations from './pages/ngo/VerifyDonations';
import VerifyDeliveries from './pages/ngo/VerifyDeliveries';
import NGOProfile from './pages/ngo/NGOProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateNGO from './pages/admin/CreateNGO';
import ManageNGOs from './pages/admin/ManageNGOs';
import VerifyCertificatePage from './pages/VerifyCertificatePage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ roles, children }) {
  const { role, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-accent border-t-transparent animate-spin" />
          <p className="text-sm text-muted">Loading...</p>
        </div>
      </div>
    );
  }
  if (!role) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to={getRouteForRole(role)} replace />;
  return children;
}

function AppLayout({ children }) {
  const location = useLocation();
  const { role } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(location.pathname);
  const publicCertPage = location.pathname.startsWith('/verify/');
  const showFrame = !isAuthPage && !publicCertPage && role;
  const showBottomNav = showFrame && role === 'donor';

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showFrame) return children;

  return (
    <>
      <Navbar />
      {!online ? <OfflineBanner /> : null}
      {children}
      {showBottomNav ? <BottomNav /> : null}
    </>
  );
}

export default function App() {
  const location = useLocation();
  const { role, loading } = useAuth();

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          <Routes location={location}>
            <Route
              path="/"
              element={
                loading ? (
                  <div className="flex min-h-screen items-center justify-center">
                    <div className="h-10 w-10 rounded-full border-4 border-accent border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <Navigate to={role ? getRouteForRole(role) : '/login'} replace />
                )
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify/:certId" element={<VerifyCertificatePage />} />

            <Route path="/home" element={<ProtectedRoute roles={['donor']}><HomePage /></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute roles={['donor']}><FeedPage /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute roles={['donor']}><MapPage /></ProtectedRoute>} />
            <Route path="/donate" element={<ProtectedRoute roles={['donor']}><MapPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute roles={['donor']}><NotificationsPage /></ProtectedRoute>} />
            <Route path="/ngo/:ngoId" element={<ProtectedRoute roles={['donor']}><NGODetailPage /></ProtectedRoute>} />
            <Route path="/ngo/:ngoId/donate" element={<ProtectedRoute roles={['donor']}><DonateOnlinePage /></ProtectedRoute>} />
            <Route path="/ngo/:ngoId/deliver" element={<ProtectedRoute roles={['donor']}><DeliverPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute roles={['donor']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/certificate/:type/:recordId" element={<ProtectedRoute roles={['donor']}><CertificatePage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute roles={['donor']}><LeaderboardPage /></ProtectedRoute>} />

            <Route path="/ngo-dashboard" element={<ProtectedRoute roles={['ngo_admin']}><NGODashboard /></ProtectedRoute>} />
            <Route path="/ngo-dashboard/needs" element={<ProtectedRoute roles={['ngo_admin']}><ManageNeeds /></ProtectedRoute>} />
            <Route path="/ngo-dashboard/posts" element={<ProtectedRoute roles={['ngo_admin']}><ManagePosts /></ProtectedRoute>} />
            <Route path="/ngo-dashboard/donations" element={<ProtectedRoute roles={['ngo_admin']}><VerifyDonations /></ProtectedRoute>} />
            <Route path="/ngo-dashboard/deliveries" element={<ProtectedRoute roles={['ngo_admin']}><VerifyDeliveries /></ProtectedRoute>} />
            <Route path="/ngo-dashboard/profile" element={<ProtectedRoute roles={['ngo_admin']}><NGOProfile /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute roles={['super_admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/create-ngo" element={<ProtectedRoute roles={['super_admin']}><CreateNGO /></ProtectedRoute>} />
            <Route path="/admin/ngos" element={<ProtectedRoute roles={['super_admin']}><ManageNGOs /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
}
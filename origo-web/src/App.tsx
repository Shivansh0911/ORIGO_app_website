import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSocketStore } from './store/socketStore';
import { useNotificationStore } from './store/notificationStore';
import { notificationsApi } from './api/endpoints';

// Layout
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Landing pages (keep existing marketing site)
import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import AboutPage from './pages/AboutPage';
import DownloadPage from './pages/DownloadPage';
import PrivacyPage from './pages/PrivacyPage';
import ConsentBanner from './components/consent/ConsentBanner';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CollegeVerifyPage from './pages/auth/CollegeVerifyPage';
import InterestPickerPage from './pages/auth/InterestPickerPage';
import LookingForPage from './pages/auth/LookingForPage';
import ProfileSetupPage from './pages/auth/ProfileSetupPage';

// App pages
import DiscoverPage from './pages/app/DiscoverPage';
import RizzPage from './pages/app/RizzPage';
import RizzChatPage from './pages/app/RizzChatPage';
import MessagesPage from './pages/app/MessagesPage';
import ChatPage from './pages/app/ChatPage';
import CommunitiesPage from './pages/app/CommunitiesPage';
import CommunityDetailPage from './pages/app/CommunityDetailPage';
import ProfilePage from './pages/app/ProfilePage';
import EditProfilePage from './pages/app/EditProfilePage';
import PremiumPage from './pages/app/PremiumPage';
import SettingsPage from './pages/app/SettingsPage';
import ShipAFriendPage from './pages/app/ShipAFriendPage';
import NotificationsPage from './pages/app/NotificationsPage';

// Freshers-season pages
import FreshersPage from './pages/app/FreshersPage';
import IntroCardPage from './pages/app/IntroCardPage';
import PromRadarPage from './pages/app/PromRadarPage';
import BatchSpacePage from './pages/app/BatchSpacePage';
import SeniorConnectPage from './pages/app/SeniorConnectPage';
import WeMetPage from './pages/app/WeMetPage';

function AppRoutes() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Routes>
          <Route path="freshers" element={<FreshersPage />} />
          <Route path="intro-card" element={<IntroCardPage />} />
          <Route path="prom" element={<PromRadarPage />} />
          <Route path="batch" element={<BatchSpacePage />} />
          <Route path="seniors" element={<SeniorConnectPage />} />
          <Route path="met" element={<WeMetPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="rizz" element={<RizzPage />} />
          <Route path="rizz/:sessionId" element={<RizzChatPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:conversationId" element={<ChatPage />} />
          <Route path="communities" element={<CommunitiesPage />} />
          <Route path="communities/:id" element={<CommunityDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/edit" element={<EditProfilePage />} />
          <Route path="premium" element={<PremiumPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="ship" element={<ShipAFriendPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="*" element={<Navigate to="discover" replace />} />
        </Routes>
      </AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { connect } = useSocketStore();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  // Connect socket when authenticated
  useEffect(() => {
    if (accessToken) connect(accessToken);
  }, [accessToken, connect]);

  // Poll unread notification count
  useEffect(() => {
    if (!isAuthenticated()) return;
    const poll = async () => {
      try {
        const { data } = await notificationsApi.getUnreadCount();
        setUnreadCount(data.count);
      } catch { /* ignore */ }
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [isAuthenticated, setUnreadCount]);

  return (
    <>
    <Routes>
      {/* Landing / marketing site */}
      <Route path="/" element={<><Navbar /><LandingPage /><Footer /></>} />
      <Route path="/features" element={<><Navbar /><FeaturesPage /><Footer /></>} />
      <Route path="/about" element={<><Navbar /><AboutPage /><Footer /></>} />
      <Route path="/download" element={<><Navbar /><DownloadPage /><Footer /></>} />
      <Route path="/privacy" element={<><Navbar /><PrivacyPage /><Footer /></>} />

      {/* Auth flow */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-college" element={<ProtectedRoute><CollegeVerifyPage /></ProtectedRoute>} />
      <Route path="/interests" element={<ProtectedRoute><InterestPickerPage /></ProtectedRoute>} />
      <Route path="/looking-for" element={<ProtectedRoute><LookingForPage /></ProtectedRoute>} />
      <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetupPage /></ProtectedRoute>} />

      {/* Main app */}
      <Route path="/app/*" element={<AppRoutes />} />

      {/* Redirect root to app if already logged in */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ConsentBanner />
    </>
  );
}

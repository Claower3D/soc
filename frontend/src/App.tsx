import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { FeedPage } from './pages/FeedPage';
import { VideoPage } from './pages/VideoPage';
import { MessengerPage } from './pages/MessengerPage';
import { ConferencesPage } from './pages/CallsPage';
import { PodcastsPage } from './pages/PodcastsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChannelPage } from './pages/ChannelPage';
import { ServicesPage } from './pages/ServicesPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { CommunitiesPage } from './pages/CommunitiesPage';
import { CommunityDetailPage } from './pages/CommunityDetailPage';
import { VideoEditorPage } from './pages/VideoEditorPage';
import { WalletPage } from './pages/WalletPage';
import { AdminPage } from './pages/AdminPage';
import { SpiritualPage } from './pages/SpiritualPage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthModal } from './components/AuthModal';
import './styles/theme.css';
import './App.css';

function AppContent() {
  const { isAuthModalOpen, closeAuthModal, authModalMode } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/register' || location.pathname === '/signup' || location.pathname === '/login';

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/register" element={<RegisterPage initialMode="register" />} />
        <Route path="/signup" element={<RegisterPage initialMode="register" />} />
        <Route path="/login" element={<RegisterPage initialMode="login" />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main-area">
        <Header />
        <main className="app-main-content">
          <Routes>
            <Route path="/" element={<FeedPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/explore" element={<Navigate to="/search" replace />} />
            <Route path="/video" element={<VideoPage />} />
            <Route path="/channel/:channelId" element={<ChannelPage />} />
            <Route path="/channel/me" element={<ChannelPage />} />
            <Route path="/messenger" element={<MessengerPage />} />
            <Route path="/conferences" element={<ConferencesPage />} />
            <Route path="/calls" element={<Navigate to="/conferences" replace />} />
            <Route path="/podcasts" element={<PodcastsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/communities" element={<CommunitiesPage />} />
            <Route path="/community/:id" element={<CommunityDetailPage />} />
            <Route path="/editor" element={<VideoEditorPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/spiritual" element={<SpiritualPage />} />
            <Route path="/spiritual/:tab" element={<SpiritualPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/profile/me" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <BottomNav />

      {/* Global Auth Modal for all guest locks */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;

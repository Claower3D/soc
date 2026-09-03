import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import './styles/theme.css';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="app-main-area">
          <Header />
          <main className="app-main-content">
            <Routes>
              <Route path="/" element={<FeedPage />} />
              <Route path="/video" element={<VideoPage />} />
              <Route path="/channel/:channelId" element={<ChannelPage />} />
              <Route path="/channel/me" element={<ChannelPage />} />
              <Route path="/messenger" element={<MessengerPage />} />
              <Route path="/conferences" element={<ConferencesPage />} />
              <Route path="/calls" element={<Navigate to="/conferences" replace />} />
              <Route path="/podcasts" element={<PodcastsPage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />
              <Route path="/profile/me" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;

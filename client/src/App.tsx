import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { usePlayer } from './services/player';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { LikedPage } from './pages/LikedPage';
import { QueuePage } from './pages/QueuePage';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';

function AppContent() {
  const init = usePlayer((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-black p-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/liked" element={<LikedPage />} />
            <Route path="/queue" element={<QueuePage />} />
          </Routes>
        </div>
      </div>

      {/* Player Bar */}
      <PlayerBar />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

// src/App.tsx - Главный роутер приложения
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import GamePage from './pages/GamePage';
import RoomLobby from './pages/RoomLobby';
import { startTokenRefresh } from './utils/authGuard'; // 👈 ДОБАВИТЬ ИМПОРТ

const App: React.FC = () => {
  // 👈 ДОБАВИТЬ useEffect
  useEffect(() => {
    console.log('🔒 Starting automatic token refresh...');
    startTokenRefresh();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Главная страница - всегда доступна */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Лобби комнаты - ожидание игроков */}
        <Route path="/room/:roomId" element={<RoomLobby />} />
        
        {/* Игровая комната - доступна всем для тестирования */}
        <Route path="/game/:roomId" element={<GamePage />} />
        
        {/* Дашборд - пока редирект на главную */}
        <Route path="/dashboard" element={<LandingPage />} />
        
        {/* Fallback - редирект на главную */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
};

export default App;
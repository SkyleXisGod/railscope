import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './GamesPage.css'; // Poprawny plik CSS ze stylami gier
import { translations } from './constants/translations';

// Import all games
import MemoryGame from './games/MemoryGame';
import FlappyTrain from './games/FlappyTrain';
import SnakeGame from './games/SnakeGame';
import SimonSignals from './games/SimonSignals';
import WagonCatcher from './games/WagonCatcher';
import TrainClicker from './games/TrainClicker';
import ConductorMath from './games/ConductorMath';
import TrainMaze from './games/TrainMaze';
import BrakeGame from './games/BrakeGame';
import FurnaceGame from './games/FurnaceGame';
import RadarGame from './games/RadarGame';
import SignalGame from './games/SignalGame';
import CouplerGame from './games/CouplerGame';
import SwitchGame from './games/SwitchGame';
import RadioGame from './games/RadioGame';
import BridgeGame from './games/BridgeGame';
import MaintenanceGame from './games/MaintenanceGame';
import CargoGame from './games/CargoGame';
import SpeedCheckGame from './games/SpeedCheckGame';
import CargoWeightGame from './games/CargoWeightGame';

const GAMES_LIST = [
  { id: 'wagoncatcher', key: 'game_wagoncatcher', emoji: '📦', ready: true }, 
  { id: 'math', key: 'game_math', emoji: '🎫', ready: true },
  { id: 'brake', key: 'game_brake', emoji: '🎛️', ready: true },
  { id: 'bridge', key: 'game_bridge', emoji: '🌉', ready: true },
  { id: 'coupler', key: 'game_coupler', emoji: '🔗', ready: true },
  { id: 'cargo', key: 'game_cargo', emoji: '🚢', ready: true },
  { id: 'memory', key: 'game_memory', emoji: '🧠', ready: true },
  { id: 'flappy', key: 'game_flappy', emoji: '🚂', ready: true },
  { id: 'snake', key: 'game_snake', emoji: '🐍', ready: true },
  { id: 'simon', key: 'game_simon', emoji: '🚦', ready: true },
  { id: 'clicker', key: 'game_clicker', emoji: '🖱️', ready: true },
  { id: 'maze', key: 'game_maze', emoji: '🌀', ready: true },
  { id: 'furnace', key: 'game_furnace', emoji: '🔥', ready: true },
  { id: 'radar', key: 'game_radar', emoji: '📡', ready: true },
  { id: 'signal', key: 'game_signal', emoji: '📻', ready: true },
  { id: 'switch', key: 'game_switch', emoji: '🎚️', ready: true },
  { id: 'radio', key: 'game_radio', emoji: '📳', ready: true },
  { id: 'maintenance', key: 'game_maintenance', emoji: '🔧', ready: true },
  { id: 'speedcheck', key: 'game_speedcheck', emoji: '📸', ready: true },
  { id: 'cargoweight', key: 'game_cargoweight', emoji: '⚖️', ready: true }
];

export default function GamesPage() {
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState(null);

  const lang = user?.settings?.language || 'PL';
  const t = translations[lang]?.games || translations.PL.games;

  // Sprawdzamy, czy użytkownik ma rolę premium
  const isPremium = user?.role === 'PLUS';

  const renderGame = () => {
    const props = {
      t: translations[lang]?.app || translations.PL.app,
      onBack: () => setActiveGame(null)
    };

    switch (activeGame) {
      case 'memory': return <MemoryGame {...props} />;
      case 'flappy': return <FlappyTrain {...props} />;
      case 'snake': return <SnakeGame {...props} />;
      case 'simon': return <SimonSignals {...props} />;
      case 'wagoncatcher': return <WagonCatcher {...props} />; 
      case 'clicker': return <TrainClicker {...props} />;
      case 'math': return <ConductorMath {...props} />;
      case 'maze': return <TrainMaze {...props} />;
      case 'brake': return <BrakeGame {...props} />;
      case 'furnace': return <FurnaceGame {...props} />;
      case 'radar': return <RadarGame {...props} />;
      case 'signal': return <SignalGame {...props} />;
      case 'coupler': return <CouplerGame {...props} />;
      case 'switch': return <SwitchGame {...props} />;
      case 'radio': return <RadioGame {...props} />;
      case 'bridge': return <BridgeGame {...props} />;
      case 'maintenance': return <MaintenanceGame {...props} />;
      case 'cargo': return <CargoGame {...props} />;
      case 'speedcheck': return <SpeedCheckGame {...props} />;
      case 'cargoweight': return <CargoWeightGame {...props} />;
      default: return null;
    }
  };

  // Jeśli użytkownik jest premium i odpalił grę -> pełny ekran gry
  if (activeGame && isPremium) {
    return <div className="games-page fullscreen">{renderGame()}</div>;
  }

  return (
    <div className="premium-games-wrapper">
      {/* 1. Właściwa zawartość strony (będzie rozmyta dla zwykłych użytkowników) */}
      <div className={`games-page ${!isPremium ? 'premium-blur-active' : ''}`}>
        <header className="games-header">
          <h1>{t.games_title || 'Strefa Gier Maszynisty'}</h1>
          <p>{t.games_subtitle || 'Przetestuj swój refleks i umiejętności kolejowe'}</p>
        </header>
        
        <div className="games-grid">
          {GAMES_LIST.map((game, index) => {
            const delay = `${(index % 4) * 0.2}s`; 
            return (
              <div 
                key={game.id} 
                className={`game-arcade-card ${game.ready ? 'active-game-mode' : ''}`} 
                onClick={() => isPremium && setActiveGame(game.id)}
                style={{ animationDelay: delay }} 
              >
                <span className="game-card-emoji">{game.emoji}</span>
                <h3 className="game-card-title">{t[game.key + '_title']}</h3>
                <span className="game-card-status">
                  {game.ready ? 'ONLINE 🟢' : 'WKRÓTCE 🔒'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Nakładka z blokadą i przyciskiem (widoczna TYLKO gdy brak premium) */}
      {!isPremium && (
        <div className="premium-overlay-container">
          <div className="premium-lock-box">
            <div className="premium-lock-icon">🔒</div>
            <h2 className="premium-lock-title">Strefa Premium</h2>
            <p className="premium-lock-message">
              Przepraszamy! Sekcja gier zręcznościowych dostępna jest wyłącznie dla użytkowników posiadających aktywne konto Premium.
            </p>
            <button 
              className="premium-redirect-btn"
              onClick={() => window.location.href = '/pay' /* Przekierowanie do strony płatności */}
            >
              Odblokuj Dostęp Premium 🌟
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
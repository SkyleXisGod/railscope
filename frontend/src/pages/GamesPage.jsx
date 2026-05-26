
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';
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

const GAMES_LIST = [
  { id: 'memory', key: 'game_memory', emoji: '🧠' },
  { id: 'flappy', key: 'game_flappy', emoji: '🚂' },
  { id: 'snake', key: 'game_snake', emoji: '🐍' },
  { id: 'simon', key: 'game_simon', emoji: '🎵' },
  { id: 'catcher', key: 'game_catcher', emoji: '🚂' },
  { id: 'clicker', key: 'game_clicker', emoji: '🖱️' },
  { id: 'math', key: 'game_math', emoji: '🔢' },
  { id: 'maze', key: 'game_maze', emoji: '迷' },
  { id: 'signal', key: 'game_signal', emoji: '🚦' },
  { id: 'brake', key: 'game_brake', emoji: '🛑' },
  { id: 'coupler', key: 'game_coupler', emoji: '🔗' },
  { id: 'switch', key: 'game_switch', emoji: '🔀' },
  { id: 'radio', key: 'game_radio', emoji: '📻' },
  { id: 'bridge', key: 'game_bridge', emoji: '🌉' },
  { id: 'radar', key: 'game_radar', emoji: '📡' },
  { id: 'maintenance', key: 'game_maintenance', emoji: '🔧' },
  { id: 'cargo', key: 'game_cargo', emoji: '📦' },
  { id: 'furnace', key: 'game_furnace', emoji: '🔥' }
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState(null);
  const { user, updateUser } = useAuth();
  const lang = 'EN';
  
  const t = translations[lang]?.games || translations.PL.games;

  const renderGame = () => {
    const props = { t, onBack: () => setActiveGame(null) };
    switch (activeGame) {
      case 'memory': return <MemoryGame {...props} />;
      case 'flappy': return <FlappyTrain {...props} />;
      case 'snake': return <SnakeGame {...props} />;
      case 'simon': return <SimonSignals {...props} />;
      case 'catcher': return <WagonCatcher {...props} />;
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
      default: return null;
    }
  };

  if (activeGame) {
    return <div className="games-page fullscreen">{renderGame()}</div>;
  }

  return (
    <div className="games-page">
      <header className="games-header">
        <h1>{t.games_title}</h1>
        <p>{t.games_subtitle}</p>
      </header>
      <div className="games-grid">
        {GAMES_LIST.map((game) => (
          <div key={game.id} className="game-card" onClick={() => setActiveGame(game.id)}>
            <h3>{`${game.emoji}${t[`${game.key}_title`]}`}</h3>
            <p>{t[`${game.key}_desc`]}</p>
            <button className="play-btn">{t.btn_play}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

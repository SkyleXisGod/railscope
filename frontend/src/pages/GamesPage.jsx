import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { translations } from "./constants/translations";
import { TrainMemory } from './games/TrainMemory';
import { FlappyTrain } from './games/FlappyTrain';
import './GamesPage.css';

const GamesPage = () => {
  const { user } = useAuth();
  const lang = user?.settings?.language || 'PL';
  const t = translations[lang].games;

  const [activeGame, setActiveGame] = useState(null);

  const text = {
    games_title: t?.games_title || "Strefa Gier RailScope 🎮",
    games_subtitle: t?.games_subtitle || "Wybierz maszynę i ruszaj do zabawy!",
    btn_back: t?.btn_back || "Powrót",
    btn_play: t?.btn_play || "Graj",
    moves: t?.moves || "Ruchy:",
    congratulations: t?.congratulations || "Gratulacje! Wygrałeś! 🎉",
    play_again: t?.play_again || "Zagraj ponownie",
    score: t?.score || "Wynik:",
    game_over: t?.game_over || "Koniec Gry!",
    level: t?.level || "Poziom:",
  };

  const gamesList = [
    { id: 'memory', icon: '🧠', title: t?.game_memory_title || "Kolejowe Memory", desc: t?.game_memory_desc || "Znajdź pary wagonów." },
    { id: 'flappy', icon: '🐦', title: t?.game_flappy_title || "Flappy Train", desc: t?.game_flappy_desc || "Omijaj semafory." },
    { id: 'snake', icon: '🐍', title: t?.game_snake_title || "Kolejowy Snake", desc: t?.game_snake_desc || "Zbieraj pasażerów." },
    { id: 'simon', icon: '🚦', title: t?.game_simon_title || "Cyfrowe Semafory", desc: t?.game_simon_desc || "Powtarzaj błyski sygnałów." },
    { id: 'catcher', icon: '🪣', title: t?.game_catcher_title || "Zajezdnia", desc: t?.game_catcher_desc || "Łap odczepione wagoniki." },
    { id: 'clicker', icon: '💰', title: t?.game_clicker_title || "Potentat", desc: t?.game_clicker_desc || "Kupuj pociągi towarowe." },
    { id: 'math', icon: '🎫', title: t?.game_math_title || "Szybki Konduktor", desc: t?.game_math_desc || "Mnożenie biletów na czas." },
    { id: 'maze', icon: '🗺️', title: t?.game_maze_title || "Zagubiony Pociąg", desc: t?.game_maze_desc || "Przeprowadź skład przez tory." },
    { id: 'dispatcher', icon: '🎛️', title: t?.game_dispatcher_title || "Dyspozytor", desc: t?.game_dispatcher_desc || "Kontroluj stacje i zwrotnice." },
    { id: 'reaction', icon: '⚡', title: t?.game_reaction_title || "Refleks", desc: t?.game_reaction_desc || "Zareaguj natychmiast na sygnał." },
    { id: 'inspector', icon: '🕵️', title: t?.game_inspector_title || "Rewizor", desc: t?.game_inspector_desc || "Sprawdzaj ważność biletów." },
    { id: 'fuel', icon: '🪨', title: t?.game_fuel_title || "Kotłownia", desc: t?.game_fuel_desc || "Zarządzaj zasobami pary." },
  ];

  const renderGame = () => {
    switch (activeGame) {
      case 'memory': return <TrainMemory t={text} onBack={() => setActiveGame(null)} />;
      case 'flappy': return <FlappyTrain t={text} onBack={() => setActiveGame(null)} />;
      case 'snake': return <SnakeGame t={text} onBack={() => setActiveGame(null)} />;
      case 'simon': return <SimonSignals t={text} onBack={() => setActiveGame(null)} />;
      case 'catcher': return <WagonCatcher t={text} onBack={() => setActiveGame(null)} />;
      case 'clicker': return <TrainClicker t={text} onBack={() => setActiveGame(null)} />;
      case 'math': return <ConductorMath t={text} onBack={() => setActiveGame(null)} />;
      case 'maze': return <TrainMaze t={text} onBack={() => setActiveGame(null)} />;
      case 'dispatcher': return <TycoonDispatcher t={text} onBack={() => setActiveGame(null)} />;
      case 'reaction': return <TrainReaction t={text} onBack={() => setActiveGame(null)} />;
      case 'inspector': return <TicketInspector t={text} onBack={() => setActiveGame(null)} />;
      case 'fuel': return <FuelManagement t={text} onBack={() => setActiveGame(null)} />;
      default: return null;
    }
  };

  return (
    <div className="games-page-container">
      {activeGame ? renderGame() : (
        <div className="games-menu">
          <h1 className="games-title">{text.games_title}</h1>
          <p className="games-subtitle">{text.games_subtitle}</p>
          <div className="games-grid-6">
            {gamesList.map(game => (
              <div className="game-card-mini" key={game.id}>
                <div className="game-icon-mini">{game.icon}</div>
                <h3>{game.title}</h3>
                <p>{game.desc}</p>
                <button className="play-button-mini" onClick={() => setActiveGame(game.id)}>{text.btn_play}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesPage;
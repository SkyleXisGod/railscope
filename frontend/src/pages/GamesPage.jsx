import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from '../context/AuthContext';
import { translations } from "./constants/translations";
import axios from 'axios';
import './GamesPage.css';

const GamesPage = () => {
  const { user } = useAuth();
  const lang = user?.settings?.language || 'PL';
  const t = translations[lang].games;

  const [activeGame, setActiveGame] = useState(null);

  const renderGame = () => {
    switch (activeGame) {
      case 'memory':
        return <MemoryGame t={t} onBack={() => setActiveGame(null)} />;
      case 'flappy':
        return <FlappyTrainPlaceholder t={t} onBack={() => setActiveGame(null)} />;
      default:
        return null;
    }
  };

  return (
    <div className="games-page-container">
      {activeGame ? (
        renderGame()
      ) : (
        <div className="games-menu">
          <h1 className="games-title">{t.games_title}</h1>
          <p className="games-subtitle">{t.games_subtitle}</p>
          
          <div className="games-grid">
            {/* Karta Gry 1: Kolejowe Memory */}
            <div className="game-card">
              <div className="game-icon">🚂</div>
              <h3>{t.game_memory_title}</h3>
              <p>{t.game_memory_desc}</p>
              <button className="play-button" onClick={() => setActiveGame('memory')}>
                {t.btn_play}
              </button>
            </div>

            {/* Karta Gry 2: Flappy Train */}
            <div className="game-card">
              <div className="game-icon">🚃</div>
              <h3>{t.game_flappy_title}</h3>
              <p>{t.game_flappy_desc}</p>
              <button className="play-button" onClick={() => setActiveGame('flappy')}>
                {t.btn_play}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- KOMPONENT: Kolejowe Memory ---
const MemoryGame = ({ t, onBack }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [moves, setMoves] = useState(0);

  const emojis = ['🚂', '🚋', '🚄', '🚅', '🚈', '🚇', '🚆', '🚞'];

  useEffect(() => {
    // Tasowanie kart po załadowaniu
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji }));
    setCards(shuffled);
  }, []);

    const resetGame = () => {
      setFlipped([]);
      setSolved([]);
      setMoves(0);
      setCards([...emojis, ...emojis]
        .sort(() => Math.random() - 0.5)
        .map((emoji, index) => ({ id: index, emoji }))
      );
    };

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || solved.includes(index)) return;
    
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const isMatch = cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji;
      if (isMatch) {
        setSolved([...solved, ...newFlipped]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="game-container">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>{t.game_memory_title}</h2>
      <p className="game-moves">{t.moves} {moves}</p>
      
      <div className="memory-grid">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || solved.includes(index);
          return (
            <div 
              key={card.id} 
              className={`memory-card ${isFlipped ? 'flipped' : ''}`}
              onClick={() => handleCardClick(index)}
            >
              <div className="memory-card-inner">
                <div className="memory-card-front">❓</div>
                <div className="memory-card-back">{card.emoji}</div>
              </div>
            </div>
          );
        })}
      </div>
      {solved.length === cards.length && cards.length > 0 && (
        <div className="game-won">
            <h3>{t.congratulations}</h3>
            <button className="play-button" onClick={resetGame}>Zagraj ponownie</button>
        </div>
        )}
    </div>
  );
};

// --- KOMPONENT: Flappy Train Placeholder ---
const FlappyTrainPlaceholder = ({ t, onBack }) => {
  return (
    <div className="game-container">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>{t.game_flappy_title}</h2>
      <div className="flappy-placeholder">
        <div className="bouncing-train">🚂</div>
        <p>{t.coming_soon}</p>
      </div>
    </div>
  );
};

export default GamesPage;
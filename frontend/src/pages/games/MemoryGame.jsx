import React, { useState, useEffect } from 'react';

const EMOJIS = ['🚂', '🚋', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉'];

export default function MemoryGame({ t, onBack }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle, playing

  const startNewGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, idx) => ({ id: idx, emoji }));
    setCards(shuffled);
    setFlipped([]);
    setSolved([]);
    setMoves(0);
    setGameState('playing');
  };

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || solved.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        setSolved(prev => [...prev, first, second]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>🧠 {t.game_memory_title || 'Pamięć Maszynisty'}</h2>
          {gameState === 'playing' && (
            <div className="game-hud-stats">
              <span className="hud-score">🔌 Ruchy: <strong>{moves}</strong></span>
              <span className="hud-timer">✅ Sparowane: <strong>{solved.length / 2} / 8</strong></span>
            </div>
          )}
        </div>

        <div className="game-viewport-area memory">
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>Matryca Pamięciowa</h3>
              <p className="game-explanation-text">
                Odkrywaj karty i łącz w pary identyczne symbole pociągów i infrastruktury kolejowej. Ukończ grę w jak najmniejszej liczbie ruchów!
              </p>
              <button className="btn-arcade-play" onClick={startNewGame}>URUCHOM SYSTEMY</button>
            </div>
          )}

          {gameState === 'playing' && solved.length === cards.length && (
            <div className="game-overlay-screen success-theme">
              <h3>🎉 BRAWO, KOLEJARZU!</h3>
              <p className="game-explanation-text">Wszystkie obwody pamięci zostały zsynchronizowane w <strong>{moves}</strong> ruchach!</p>
              <button className="btn-arcade-play" onClick={startNewGame}>Zagraj Ponownie 🔄</button>
            </div>
          )}

          {gameState === 'playing' && solved.length < cards.length && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              padding: '20px',
              height: '100%',
              boxSizing: 'border-box',
              alignContent: 'center'
            }}>
              {cards.map((card, idx) => {
                const isFlipped = flipped.includes(idx) || solved.includes(idx);
                return (
                  <div 
                    key={card.id} 
                    onClick={() => handleCardClick(idx)}
                    style={{
                      aspectRatio: '4/3',
                      background: isFlipped ? 'var(--bg-input)' : 'linear-gradient(135deg, #1e2530 0%, #0f121a 100%)',
                      border: isFlipped ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '2rem',
                      cursor: 'pointer',
                      userSelect: 'none',
                      boxShadow: isFlipped ? '0 0 10px rgba(52, 152, 219, 0.3)' : 'none',
                      transition: 'all 0.6s ease'
                    }}
                  >
                    {isFlipped ? card.emoji : '❓'}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
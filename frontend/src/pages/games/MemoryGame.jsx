import React, { useState, useEffect } from 'react';
import '../GamesPage.css';

const EMOJIS = ['🚂', '🚋', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉'];

export default function MemoryGame({ t, onBack }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    // Tasowanie kart
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, idx) => ({ id: idx, emoji }));
    setCards(shuffled);
    setFlipped([]);
    setSolved([]);
    setMoves(0);
  };

  const handleCardClick = (index) => {
    // Blokada przed kliknięciem tej samej, odkrytej lub więcej niż 2 kart
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
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="game-container memory-theme">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>{t.game_memory_title}</h2>
      <p>{t.moves} {moves}</p>
      
      {solved.length === cards.length && cards.length > 0 ? (
        <div className="win-screen">
          <h3>{t.congratulations}</h3>
          <button className="play-button" onClick={startNewGame}>{t.play_again}</button>
        </div>
      ) : (
        <div className="memory-grid">
          {cards.map((card, idx) => {
            const isFlipped = flipped.includes(idx) || solved.includes(idx);
            return (
              <div 
                key={card.id} 
                className={`memory-card ${isFlipped ? 'flipped' : ''}`}
                onClick={() => handleCardClick(idx)}
              >
                <div className="memory-card-inner">
                  <div className="memory-card-front">❓</div>
                  <div className="memory-card-back">{card.emoji}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
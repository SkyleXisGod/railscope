import React, { useState, useEffect } from 'react';

export default function MemoryGame({ t, onBack }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [moves, setMoves] = useState(0);

  const emojis = ['🚂', '🚊', '🚝', '🚞', '🚋', '🚄', '🚅', '🚈'];

  useEffect(() => {
    const shuffled = [...emojis, ...emojis]
      .map((emoji, index) => ({ id: index, emoji, salt: Math.random() }))
      .sort((a, b) => a.salt - b.salt);
    setCards(shuffled);
  }, []);

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || solved.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
        setSolved((prev) => [...prev, ...newFlipped]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="game-container math-game-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2 className="game-title-accent">{t.game_memory_title || "Kolejowe Memory"}</h2>
      <p className="game-stat">{t.moves || "Ruchy:"} <span className="stat-highlight">{moves}</span></p>
      
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
        <div className="game-won animation-pop">
          <h3>{t.congratulations || "Zwycięstwo!"}</h3>
          <button className="play-button" onClick={() => window.location.reload()}>{t.play_again || "Zagraj ponownie"}</button>
        </div>
      )}
    </div>
  );
}
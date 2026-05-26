import React, { useState, useEffect } from 'react';

export const TrainMemory = ({ t, onBack }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [moves, setMoves] = useState(0);

  const emojis = ['🚂', '🚋', '🚄', '🚅', '🚈', '🚇', '🚆', '🚞'];

  const initGame = () => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji }));
    setCards(shuffled);
    setFlipped([]);
    setSolved([]);
    setMoves(0);
  };

  useEffect(() => { initGame(); }, []);

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || solved.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
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
      <p className="game-stat">{t.moves} {moves}</p>
      <div className="memory-grid">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || solved.includes(index);
          return (
            <div key={card.id} className={`memory-card ${isFlipped ? 'flipped' : ''}`} onClick={() => handleCardClick(index)}>
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
          <button className="play-button" onClick={initGame}>{t.play_again}</button>
        </div>
      )}
    </div>
  );
};
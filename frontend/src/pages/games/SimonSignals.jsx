import React, { useState } from 'react';
import '../GamesPage.css';

const COLORS = ['red', 'green', 'blue', 'yellow'];

export default function SimonSignals({ t, onBack }) {
  const [sequence, setSequence] = useState([]);
  const [activeColor, setActiveColor] = useState(null);
  const [level, setLevel] = useState(0);

  const startGame = () => {
    const color = COLORS[Math.floor(Math.random() * 4)];
    setSequence([color]);
    setLevel(1);
    // Tutaj dodaj logikę animacji migania przyciskiem
  };

  return (
    <div className="game-container simon-theme">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>{t.game_simon_title}</h2>
      <p>{t.level} {level}</p>
      <div className="simon-board">
        {COLORS.map(color => (
          <div key={color} className={`simon-btn ${color} ${activeColor === color ? 'active' : ''}`} onClick={() => {}}></div>
        ))}
      </div>
      {level === 0 && <button className="play-button" onClick={startGame}>START</button>}
    </div>
  );
}
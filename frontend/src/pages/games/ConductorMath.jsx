import React, { useState } from 'react';

export default function ConductorMath({ t, onBack }) {
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');

  const checkAnswer = () => {
    // Logika sprawdzania wyniku
    setScore(s => s + 10);
    setInput('');
  };

  return (
    <div className="game-container math-theme">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>{t.game_math_title}</h2>
      <div className="math-problem">5 + 5 = ?</div>
      <input type="number" value={input} onChange={e => setInput(e.target.value)} />
      <button className="math-submit" onClick={checkAnswer}>SPRAWDŹ</button>
    </div>
  );
}
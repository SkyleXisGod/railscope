import React from 'react';
export default function SwitchGame({ t, onBack }) {
  return (
    <div className="game-container placeholder-game">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>{t.game_switch_title || 'SwitchGame'}</h2>
      <p>{t.game_switch_desc || 'Gra w przygotowaniu / ładowaniu.'}</p>
      <button className="play-button-mini">Start</button>
    </div>
  );
}

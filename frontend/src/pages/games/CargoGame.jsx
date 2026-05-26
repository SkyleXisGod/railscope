import React from 'react';
export default function CargoGame({ t, onBack }) {
  return (
    <div className="game-container placeholder-game">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>{t.game_cargo_title || 'CargoGame'}</h2>
      <p>{t.game_cargo_desc || 'Gra w przygotowaniu / ładowaniu.'}</p>
      <button className="play-button-mini">Start</button>
    </div>
  );
}

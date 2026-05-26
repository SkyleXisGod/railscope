import React, { useState, useEffect } from 'react';

export default function TrainClicker({ t, onBack }) {
  const [money, setMoney] = useState(0);
  const [trains, setTrains] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setMoney(m => m + (trains * 0.5)), 1000);
    return () => clearInterval(interval);
  }, [trains]);

  return (
    <div className="game-container clicker-theme">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>{t.game_clicker_title}</h2>
      <h3>💰 ${Math.floor(money)}</h3>
      <button className="big-click-btn" onClick={() => setMoney(m => m + 1)}>🚄 KLIKNIJ</button>
      <button className="buy-btn" onClick={() => { setMoney(m => m - 10); setTrains(t => t + 1); }}>KUP POCIĄG ($10)</button>
    </div>
  );
}
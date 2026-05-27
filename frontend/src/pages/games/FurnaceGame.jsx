import React, { useState, useEffect } from 'react';

export default function FurnaceGame({ t, onBack }) {
  const [pressure, setPressure] = useState(50);
  const [temp, setTemp] = useState(400);
  const [coal, setCoal] = useState(12);
  const [gameState, setGameState] = useState('idle'); // idle, running, explode, cold
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (gameState !== 'running') return;

    const timer = setInterval(() => {
      setPressure(p => {
        const nextP = p - 3;
        if (nextP <= 0) { setGameState('cold'); return 0; }
        if (nextP >= 100) { setGameState('explode'); return 100; }
        return nextP;
      });

      setTemp(t => Math.max(100, t - 10));
      setScore(s => s + 1);
    }, 400);

    return () => clearInterval(timer);
  }, [gameState]);

  const throwCoal = () => {
    if (gameState !== 'running' || coal <= 0) return;
    setCoal(c => c - 1);
    setPressure(p => Math.min(100, p + 14));
    setTemp(t => Math.min(1200, t + 80));
  };

  const addCoalStock = () => {
    if (gameState !== 'running') return;
    setCoal(c => c + 5);
  };

  const startFurnace = () => {
    setPressure(50);
    setTemp(500);
    setCoal(10);
    setScore(0);
    setGameState('running');
  };

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>🔥 Palacz Parowozu</h2>
          {gameState === 'running' && (
            <div className="game-hud-stats">
              <span className="hud-score">⏱️ Czas jazdy: <strong>{score}s</strong></span>
              <span className="hud-timer">⚫ Węgiel: <strong>{coal}T</strong></span>
            </div>
          )}
        </div>

        <div className="game-viewport-area">
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>Obsługa Kotła</h3>
              <p className="game-explanation-text">
                Utrzymuj ciśnienie pary w optymalnym zielonym zakresie. Rzucaj węgiel, by podnosić ciśnienie, ale uważaj – jeśli wskaźnik osiągnie 100%, kocioł eksploduje!
              </p>
              <button className="btn-arcade-play" onClick={startFurnace}>ODPAL KOCIOŁ 🔥</button>
            </div>
          )}

          {gameState === 'running' && (
            <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', boxSizing: 'border-box' }}>
              <div>
                {/* Pasek Ciśnienia */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    <span>CIŚNIENIE KOTŁA</span>
                    <span style={{ color: pressure > 80 ? 'var(--danger-color)' : '#00ffca' }}>{pressure} / 100 PSI</span>
                  </div>
                  <div style={{ width: '100%', height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: `${pressure}%`, height: '100%', background: pressure > 80 ? 'var(--danger-color)' : 'linear-gradient(90deg, #2ecc71, #f1c40f, #e74c3c)', transition: 'width 0.2s linear' }} />
                  </div>
                </div>

                {/* Pasek Temperatury */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    <span>TEMPERATURA PALENISKA</span>
                    <span style={{ color: 'var(--accent-color)' }}>{temp} °C</span>
                  </div>
                  <div style={{ width: '100%', height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: `${(temp / 1200) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #e67e22, #e74c3c)', transition: 'width 0.2s linear' }} />
                  </div>
                </div>
              </div>

              {/* Przyciski Akcji */}
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <button className="btn-arcade-play" onClick={throwCoal} disabled={coal <= 0} style={{ background: '#d35400' }}>
                  Dożuć Węgiel (1T) 🪨
                </button>
                <button className="btn-arcade-play" onClick={addCoalStock} style={{ background: '#7f8c8d' }}>
                  Zamów Dostawę 🚚
                </button>
              </div>
            </div>
          )}

          {gameState === 'explode' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>💥 KATASTROFALNY WYBUCH!</h3>
              <p className="game-explanation-text">Ciśnienie rozsadziło ściany kotła parowozu.</p>
              <p className="game-explanation-text">Utrzymałeś maszynę przez <strong>{score}</strong> sekund.</p>
              <button className="btn-arcade-play" onClick={startFurnace}>Napraw i Odpal Nowy 🔄</button>
            </div>
          )}

          {gameState === 'cold' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>🥶 OGIEŃ ZAGASŁ</h3>
              <p className="game-explanation-text">Ciśnienie spadło do zera. Pociąg stanął w szczerym polu.</p>
              <button className="btn-arcade-play" onClick={startFurnace}>Spróbuj Ponownie 🔄</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

export default function RadarGame({ t, onBack }) {
  const [blips, setBlips] = useState([]);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle, playing, crashed

  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnInterval = setInterval(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 150; // Odległość startowa od środka
      setBlips(prev => [...prev, {
        id: Date.now() + Math.random(),
        angle: angle,
        distance: radius,
        x: 200 + Math.cos(angle) * radius,
        y: 200 + Math.sin(angle) * radius
      }]);
    }, 1200);

    const moveInterval = setInterval(() => {
      setBlips(prev => {
        let crash = false;
        const nextBlips = prev.map(b => {
          const nextDist = b.distance - 4;
          if (nextDist <= 12) crash = true;
          return {
            ...b,
            distance: nextDist,
            x: 200 + Math.cos(b.angle) * nextDist,
            y: 200 + Math.sin(b.angle) * nextDist
          };
        });
        if (crash) setGameState('crashed');
        return nextBlips;
      });
    }, 100);

    return () => { clearInterval(spawnInterval); clearInterval(moveInterval); };
  }, [gameState]);

  const destroyBlip = (id) => {
    setBlips(prev => prev.filter(b => b.id !== id));
    setScore(s => s + 10);
  };

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>📡 Radar Dyspozytorski v2.0</h2>
          {gameState === 'playing' && (
            <div className="game-hud-stats">
              <span className="hud-score">🎯 Czyste Echo: <strong>{score} pkt</strong></span>
            </div>
          )}
        </div>

        <div className="game-viewport-area">
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>Skaner Pola</h3>
              <p className="game-explanation-text">
                Na ekranie radaru pojawiają się obwody zakłóceniowe. Klikaj bezpośrednio w czerwone punkty, aby je zneutralizować, zanim uderzą w centralny punkt dowodzenia stacji!
              </p>
              <button className="btn-arcade-play" onClick={() => { setScore(0); setBlips([]); setGameState('playing'); }}>URUCHOM SKAN 🎚️</button>
            </div>
          )}

          {gameState === 'playing' && (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {/* Okrągła tarcza radaru */}
              <div style={{
                width: '320px',
                height: '320px',
                border: '2px solid #00ff55',
                borderRadius: '50%',
                position: 'relative',
                background: 'rgba(0, 255, 85, 0.02)',
                boxShadow: 'inset 0 0 20px rgba(0,255,85,0.1)'
              }}>
                {/* Środek radaru */}
                <div style={{ position: 'absolute', left: '154px', top: '154px', width: '12px', height: '12px', background: '#00ff55', borderRadius: '50%' }} />
                
                {/* Spadające Blipy */}
                {blips.map(b => (
                  <div
                    key={b.id}
                    onClick={() => destroyBlip(b.id)}
                    style={{
                      position: 'absolute',
                      left: `${b.x - 130}px`,
                      top: `${b.y - 50}px`,
                      width: '20px',
                      height: '20px',
                      background: '#ff2a2a',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border: '2px solid white',
                      boxShadow: '0 0 8px #ff2a2a',
                      transform: 'translate(-50%, -50%)',
                      transition: 'left 0.1s linear, top 0.1s linear'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {gameState === 'crashed' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>🛑 RADAR SFORSOWANY!</h3>
              <p className="game-explanation-text">Anomalia uderzyła w centralny nadajnik.</p>
              <p className="game-explanation-text">Ostateczny wynik: <strong>{score}</strong> punktów.</p>
              <button className="btn-arcade-play" onClick={() => { setScore(0); setBlips([]); setGameState('playing'); }}>Restartuj System 🔄</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
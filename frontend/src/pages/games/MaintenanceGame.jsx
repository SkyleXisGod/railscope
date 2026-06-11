import React, { useState, useEffect } from 'react';

export default function MaintenanceGame({ t, onBack }) {
  const [damage, setDamage] = useState(0);
  const [failures, setFailures] = useState([]);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle, playing, broken

  useEffect(() => {
    if (gameState !== 'playing') return;

    // Pobieranie uszkodzeń z upływem czasu na podstawie aktywnych awarii
    const damageInterval = setInterval(() => {
      setDamage(d => {
        const nextD = d + (failures.length * 4) + 1;
        if (nextD >= 100) {
          setGameState('broken');
          return 100;
        }
        return nextD;
      });
    }, 300);

    // Losowe pojawianie się nowych awarii w różnych punktach makiety
    const spawnInterval = setInterval(() => {
      if (failures.length < 5) {
        setFailures(prev => [...prev, {
          id: Math.random(),
          x: Math.floor(Math.random() * 75) + 10,
          y: Math.floor(Math.random() * 65) + 15,
          type: ['🔧', '💥', '💨', '⚡'][Math.floor(Math.random() * 4)]
        }]);
      }
    }, 1000);

    return () => { clearInterval(damageInterval); clearInterval(spawnInterval); };
  }, [gameState, failures]);

  const fixFailure = (id) => {
    setFailures(prev => prev.filter(f => f.id !== id));
    setScore(s => s + 1);
    setDamage(d => Math.max(0, d - 6));
  };

  const startMaintenance = () => {
    setDamage(0);
    setFailures([]);
    setScore(0);
    setGameState('playing');
  };

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>🔧 {t.title || 'Warsztat Serwisowy'}</h2>
          {gameState === 'playing' && (
            <div className="game-hud-stats">
              <span className="hud-score">🛠️ {t.scoreLabel || 'Usunięte usterki'}: <strong>{score}</strong></span>
              <span className="hud-timer" style={{ color: damage > 75 ? 'var(--danger-color)' : 'yellow' }}>
                {t.damageLabel || 'Degradacja bloku'}: <strong>{damage}%</strong>
              </span>
            </div>
          )}
        </div>

        <div className="game-viewport-area">
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>{t.introTitle || 'Zarządzanie Usterkami Trakcji'}</h3>
              <p className="game-explanation-text">
                {t.introText || 'W przedziale maszynowym pękają przewody i dochodzi do zwarć elektrycznych! Klikaj błyskawicznie w pojawiające się symbole awarii na pulpicie silnika trakcyjnego, aby je naprawić zanim wskaźnik uszkodzeń osiągnie 100%.'}
              </p>
              <button className="btn-arcade-play" onClick={startMaintenance}>{t.startButton || 'WEJDŹ DO MASZYNOWNI 🔧'}</button>
            </div>
          )}

          {gameState === 'playing' && (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              
              {/* Pasek krytyczny na samej górze viewportu */}
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)' }}>
                <div style={{ width: `${damage}%`, height: '100%', background: damage > 70 ? 'var(--danger-color)' : 'var(--accent-color)', transition: 'width 0.2s linear' }} />
              </div>

              {/* Rysowanie awarii na mapie silnika */}
              {failures.map(f => (
                <button
                  key={f.id}
                  onClick={() => fixFailure(f.id)}
                  style={{
                    position: 'absolute',
                    left: `${f.x}%`,
                    top: `${f.y}%`,
                    fontSize: '2rem',
                    background: 'rgba(231, 76, 60, 0.2)',
                    border: '2px solid var(--danger-color)',
                    borderRadius: '50%',
                    width: '55px',
                    height: '55px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px var(--danger-color)',
                    animation: 'pulse 0.5s infinite alternate',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {f.type}
                </button>
              ))}

              <div style={{ position: 'absolute', bottom: '15px', left: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {t.fixPrompt || '🚨 Klikaj ikony usterek na pulpicie silnika!'}
              </div>
            </div>
          )}

          {gameState === 'broken' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>💥 {t.crashTitle || 'ZATARCIE SILNIKA TRAKCYJNEGO!'}</h3>
              <p className="game-explanation-text">{t.crashText || 'Szkody strukturalne osiągnęły 100%. Agregat prądotwórczy uległ stopieniu.'}</p>
              <p className="game-explanation-text">{t.brokenResultText || 'Udało Ci się usunąć'} <strong>{score}</strong> {t.repairButton || 'awarii przed awarią krytyczną'}.</p>
              <button className="btn-arcade-play" onClick={startMaintenance}>{t.repairButton || 'Zmontuj Nowy Blok 🔄'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
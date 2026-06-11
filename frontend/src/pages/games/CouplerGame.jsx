import React, { useState, useEffect, useRef } from 'react';
import '../GamesPage.css';

export default function CouplerGame({ t, onBack }) {
  const [gameState, setGameState] = useState('idle'); // idle, running, crashed
  const [score, setScore] = useState(0);
  const [damage, setDamage] = useState(0); // Od 0 do 100
  const [indicatorPos, setIndicatorPos] = useState(0); // 0 do 100 (pozycja suwaka)
  
  const directionRef = useRef(1); // 1 = w prawo, -1 = w lewo
  const targetMin = 40; // bezpieczna strefa min %
  const targetMax = 60; // bezpieczna strefa max %

  const startGame = () => {
    setScore(0);
    setDamage(0);
    setIndicatorPos(0);
    directionRef.current = 1;
    setGameState('running');
  };

  // Pętla animacji suwaka (refleksu)
  useEffect(() => {
    if (gameState !== 'running') return;

    // Prędkość suwaka wzrasta wraz z punktami
    const speed = 2.5 + Math.min(score * 0.4, 6);

    const interval = setInterval(() => {
      setIndicatorPos((pos) => {
        let nextPos = pos + directionRef.current * speed;
        if (nextPos >= 100) {
          nextPos = 100;
          directionRef.current = -1;
        } else if (nextPos <= 0) {
          nextPos = 0;
          directionRef.current = 1;
        }
        return nextPos;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [gameState, score]);

  const handleConnect = () => {
    if (gameState !== 'running') return;

    // Sprawdzenie, czy suwak jest w strefie bezpiecznej
    if (indicatorPos >= targetMin && indicatorPos <= targetMax) {
      setScore((s) => s + 1);
      // Przypadkowa nowa pozycja startowa dla urozmaicenia
      setIndicatorPos(Math.random() * 20);
      directionRef.current = 1;
    } else {
      // Błędny sprzęg zwiększa uszkodzenia
      setDamage((d) => {
        const nextD = d + 25;
        if (nextD >= 100) {
          setGameState('crashed');
          return 100;
        }
        return nextD;
      });
    }
  };

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>
      
      <div className="game-main-card">
        <div className="game-top-header">
          <h2>🔗 {t.title || 'Coupler'}</h2>
          {gameState === 'running' && (
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              <div>{t.scoreLabel || 'Connections'}: <span style={{ color: '#00ffca' }}>{score}</span></div>
              <div style={{ color: damage > 60 ? '#ff4757' : '#fff' }}>{t.damageLabel || 'Damage'}: {damage}%</div>
            </div>
          )}
        </div>

        <div className="game-viewport-area">
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>{t.introTitle || 'Calibrate the coupler'}</h3>
              <p className="game-explanation-text">
                {t.introText || 'Align the locking pin when the moving core enters the central tolerance zone. A mistimed connection can tear air hoses and damage the coupler.'}
              </p>
              <button className="btn-arcade-play" onClick={startGame}>{t.startButton || 'Start procedure'}</button>
            </div>
          )}

          {gameState === 'running' && (
            <div style={{ width: '100%', height: '100%', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
              
              {/* Pasek statusu uszkodzeń (taki sam jak w Maintenance) */}
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px', color: '#aaa' }}>
                  <span>{t.integrityLabel || 'Mechanism integrity'}</span>
                  <span>{100 - damage}%</span>
                </div>
                <div style={{ background: '#1c2430', height: '10px', borderRadius: '5px', overflow: 'hidden', border: '1px solid #2c3e50' }}>
                  <div style={{ width: `${100 - damage}%`, height: '100%', background: damage > 60 ? '#ff4757' : '#00ffca', transition: 'width 0.2s' }} />
                </div>
              </div>

              {/* Ekran testu refleksu */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '90%', position: 'relative', height: '40px', background: '#141b24', borderRadius: '6px', border: '2px solid #2c3e50', overflow: 'hidden' }}>
                  
                  {/* Zielona strefa docelowa */}
                  <div style={{
                    position: 'absolute',
                    left: `${targetMin}%`,
                    width: `${targetMax - targetMin}%`,
                    height: '100%',
                    background: 'rgba(0, 255, 202, 0.25)',
                    borderLeft: '1px dashed #00ffca',
                    borderRight: '1px dashed #00ffca'
                  }} />

                  {/* Czerwony ruchomy wskaźnik / suwak */}
                  <div style={{
                    position: 'absolute',
                    left: `${indicatorPos}%`,
                    width: '6px',
                    height: '100%',
                    background: '#ff4757',
                    boxShadow: '0 0 10px #ff4757',
                    transform: 'translateX(-50%)',
                    transition: 'left 0.02s linear'
                  }} />
                </div>
                <p style={{ fontSize: '11px', color: '#aaa', marginTop: '8px' }}>{t.targetZoneLabel || 'Capture zone: central highlighted sector'}</p>
              </div>

              {/* Główny przycisk wykonawczy */}
              <button 
                className="btn-arcade-play" 
                style={{ width: '100%', margin: 0, padding: '14px', background: '#2c3e50', border: '2px solid #00ffca', color: '#00ffca', fontSize: '15px' }}
                onClick={handleConnect}
              >
                {t.actionButton || 'Lock the coupler now'}
              </button>
            </div>
          )}

          {gameState === 'crashed' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>💥 {t.crashTitle || 'Coupler failure!'}</h3>
              <p className="game-explanation-text">{t.crashText || 'You exceeded critical stress limits. The coupler tore apart.'}</p>
              <p className="game-explanation-text">{t.scoreText || 'Connected axles:'} <strong>{score}</strong></p>
              <button className="btn-arcade-play" onClick={startGame}>{t.retryButton || 'Reset systems 🔄'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
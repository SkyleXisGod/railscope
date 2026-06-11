import React, { useState, useEffect } from 'react';

export default function SignalGame({ t, onBack }) {
  const [switchTrack, setSwitchTrack] = useState('S'); // A (Góra), S (Środek), D (Dół)
  const [targetTrack, setTargetTrack] = useState('S');
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle, playing, gameover

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (progress === 0) setTargetTrack(['A', 'S', 'D'][Math.floor(Math.random() * 3)]);

    const handleKey = (e) => {
      if (progress < 55) {
        const key = e.key.toLowerCase();
        if (key === 'a') setSwitchTrack('A');
        if (key === 's') setSwitchTrack('S');
        if (key === 'd') setSwitchTrack('D');
      }
    };

    window.addEventListener('keydown', handleKey);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (switchTrack === targetTrack) {
            setScore(s => s + 1);
            return 0; // Reset pociągu dla nowej rundy
          } else {
            setGameState('gameover');
            return p;
          }
        }
        return p + 2;
      });
    }, 40);

    return () => {
      window.removeEventListener('keydown', handleKey);
      clearInterval(interval);
    };
  }, [progress, switchTrack, targetTrack, gameState]);

  const startGame = () => {
    setScore(0);
    setProgress(0);
    setSwitchTrack('S');
    setGameState('playing');
  };

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>🚦 {t.title || 'Signal Control'}</h2>
          {gameState === 'playing' && (
            <div className="game-hud-stats">
              <span className="hud-score">🎯 {t.scoreLabel || 'Routed'}: <strong>{score}</strong></span>
              <span className="hud-timer" style={{ color: '#00ffd5' }}>{t.targetTrackLabel || 'Target track'}: <strong>{targetTrack}</strong></span>
            </div>
          )}
        </div>

        <div className="game-viewport-area">
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>{t.introTitle || 'Signal operator'}</h3>
              <p className="game-explanation-text">
                {t.introText || 'Quickly switch the turnout using keys A (top track), S (middle track) or D (bottom track) so the train enters the target track shown in the header. You only have time until the train passes the switch!'}
              </p>
              <button className="btn-arcade-play" onClick={startGame}>{t.startButton || 'Activate the signal 🎮'}</button>
            </div>
          )}

          {gameState === 'playing' && (
            <div style={{ padding: '20px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <svg viewBox="0 0 400 200" style={{ width: '100%', height: '180px' }}>
                {/* Tory bazowe */}
                <path d="M 0 100 L 180 100" stroke="#555" strokeWidth="6" fill="none" />
                
                {/* Linie rozjazdów */}
                <path d="M 180 100 L 400 40" stroke={switchTrack === 'A' ? 'var(--primary-color)' : '#333'} strokeWidth={switchTrack === 'A' ? '5' : '3'} fill="none" />
                <path d="M 180 100 L 400 100" stroke={switchTrack === 'S' ? 'var(--primary-color)' : '#333'} strokeWidth={switchTrack === 'S' ? '5' : '3'} fill="none" />
                <path d="M 180 100 L 400 160" stroke={switchTrack === 'D' ? 'var(--primary-color)' : '#333'} strokeWidth={switchTrack === 'D' ? '5' : '3'} fill="none" />

                {/* Litery celów końcowych */}
                <text x="380" y="30" fill={targetTrack === 'A' ? '#00ffca' : '#777'} fontSize="18" fontWeight="bold">A</text>
                <text x="380" y="95" fill={targetTrack === 'S' ? '#00ffca' : '#777'} fontSize="18" fontWeight="bold">S</text>
                <text x="380" y="155" fill={targetTrack === 'D' ? '#00ffca' : '#777'} fontSize="18" fontWeight="bold">D</text>

                {/* Jadący pociąg */}
                <g transform={`translate(${progress * 3.6}, ${progress < 50 ? 100 : (switchTrack === 'A' ? 100 - (progress-50)*1.2 : (switchTrack === 'D' ? 100 + (progress-50)*1.2 : 100))})`}>
                  <rect x="-25" y="-12" width="30" height="18" rx="4" fill="#00ff55" />
                  <text x="-20" y="2" fill="black" fontSize="11" fontWeight="bold">🚂</text>
                </g>
              </svg>
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '10px' }}>
                {t.guideText || 'Selected turnout:'} <strong style={{ color: 'var(--primary-color)' }}>TRACK {switchTrack}</strong> ({t.controlHint || 'Use keys A / S / D'})
              </div>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>🛑 {t.crashTitle || 'Signal disaster!'}</h3>
              <p className="game-explanation-text">{t.crashText || 'You routed the train to the wrong dispatch track.'}</p>
              <p className="game-explanation-text">{t.scoreText || 'Total routed trains:'} <strong>{score}</strong>.</p>
              <button className="btn-arcade-play" onClick={startGame}>{t.retryButton || 'Try again 🔄'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
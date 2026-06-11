import React, { useState, useEffect, useRef } from 'react';
import '../GamesPage.css';

export default function SimonSignals({ t, onBack }) {
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [activeColor, setActiveColor] = useState(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [gameState, setGameState] = useState('idle'); // idle, running, crashed
  const [score, setScore] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const colors = ['red', 'yellow', 'green'];
  const sequenceRef = useRef([]);
  const userSequenceRef = useRef([]);

  useEffect(() => { sequenceRef.current = sequence; }, [sequence]);
  useEffect(() => { userSequenceRef.current = userSequence; }, [userSequence]);

  const startGame = () => {
    setScore(0);
    setGameState('running');
    const nextSeq = [colors[Math.floor(Math.random() * 3)]];
    setSequence(nextSeq);
    setUserSequence([]);
    playSequence(nextSeq);
  };

  const playSequence = async (currentSeq) => {
    setIsPlayingSequence(true);
      setStatusMessage(t.playingStatus || 'Replaying sequence...');
    for (let i = 0; i < currentSeq.length; i++) {
      const color = currentSeq[i];
      setActiveColor(color);
      await new Promise(resolve => setTimeout(resolve, 500));
      setActiveColor(null);
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    setIsPlayingSequence(false);
    setStatusMessage(t.confirmSection || 'Confirm the signal sequence!');
  };

  const handleColorClick = (color) => {
    if (isPlayingSequence || gameState !== 'running') return;

    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 200);

    const nextUserSeq = [...userSequence, color];
    setUserSequence(nextUserSeq);

    const currentIdx = nextUserSeq.length - 1;

    if (nextUserSeq[currentIdx] !== sequenceRef.current[currentIdx]) {
      setGameState('crashed');
      return;
    }

    if (nextUserSeq.length === sequenceRef.current.length) {
      setScore(s => s + 1);
      setUserSequence([]);
      const nextSeq = [...sequenceRef.current, colors[Math.floor(Math.random() * 3)]];
      setSequence(nextSeq);
      setTimeout(() => playSequence(nextSeq), 800);
    }
  };

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>🚨 {t.title || 'Simon Signals'}</h2>
          {gameState === 'running' && (
            <div>{t.scoreLabel || 'Cleared blocks'}: <span style={{ color: '#00ffca', fontWeight: 'bold' }}>{score}</span></div>
          )}
        </div>

        <div className="game-viewport-area">
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>{t.introTitle || 'Synchronize the signal array'}</h3>
              <p className="game-explanation-text">
                {t.introText || 'Replay the precise flash sequence of the automation relays. Any mistake breaks the circuit and causes a critical overload on the main bus.'}
              </p>
              <button className="btn-arcade-play" onClick={startGame}>{t.startButton || 'Check signals'}</button>
            </div>
          )}

          {gameState === 'running' && (
            <div style={{ width: '100%', height: '100%', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
              
              <div style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', textAlign: 'center', color: isPlayingSequence ? '#3498db' : '#00ffca' }}>
                [{statusMessage}]
              </div>

              {/* Surowe pionowe ułożenie lamp przemysłowych */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', margin: '20px 0' }}>
                {colors.map((color) => {
                  const bgColors = { red: '#ff4757', yellow: '#ffa502', green: '#2ed573' };
                  const isActive = activeColor === color;
                  return (
                    <div
                      key={color}
                      onClick={() => handleColorClick(color)}
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        background: isActive ? bgColors[color] : '#141b24',
                        border: `3px solid ${isActive ? bgColors[color] : '#2c3e50'}`,
                        boxShadow: isActive ? `0 0 25px ${bgColors[color]}` : 'none',
                        cursor: isPlayingSequence ? 'not-allowed' : 'pointer',
                        transition: 'all 0.1s ease'
                      }}
                    />
                  );
                })}
              </div>

              <div style={{ fontSize: '11px', color: '#aaa', textAlign: 'center' }}>
                {t.interfaceLabel || 'Sequential signal panel interface'}
              </div>
            </div>
          )}

          {gameState === 'crashed' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>💥 {t.crashTitle || 'Module overload!'}</h3>
              <p className="game-explanation-text">{t.crashText || 'An invalid verification code was entered. Relays have overheated.'}</p>
              <p className="game-explanation-text">{t.scoreText || 'Verified nodes:'} <strong>{score}</strong></p>
              <button className="btn-arcade-play" onClick={startGame}>{t.retryButton || 'Reset relays 🔄'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
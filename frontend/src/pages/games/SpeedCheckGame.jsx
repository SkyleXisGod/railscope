import React, { useState, useEffect } from 'react';
import '../GamesPage.css';

export default function SpeedCheckGame({ t, onBack }) {
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [targetSpeed, setTargetSpeed] = useState(40);
  const [gameState, setGameState] = useState('idle'); // idle, running, success, crashed
  const [score, setScore] = useState(0);
  const [distanceLeft, setDistanceLeft] = useState(100);

  const startTest = () => {
    // Losowanie ograniczenia prędkości od 30 do 70 km/h
    const randomLimit = Math.floor(Math.random() * 5 * 10) + 30;
    setTargetSpeed(randomLimit);
    // Pociąg startuje rozpędzony powyżej ograniczenia
    setCurrentSpeed(randomLimit + Math.floor(Math.random() * 30) + 25);
    setDistanceLeft(100);
    setGameState('running');
  };

  useEffect(() => {
    if (gameState !== 'running') return;

    const interval = setInterval(() => {
      // Dystans do fotoradaru maleje
      setDistanceLeft(d => {
        if (d <= 0) {
          clearInterval(interval);
          checkFinalSpeed();
          return 0;
        }
        return d - 2.5;
      });

      // Bez hamowania prędkość pociągu delikatnie waha się lub rośnie z góry
      setCurrentSpeed(s => Math.max(10, s + (Math.random() * 2 - 0.8)));
    }, 60);

    return () => clearInterval(interval);
  }, [gameState, currentSpeed]);

  // Obsługa klawiatury (Spacja hamuje)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        applyBrake();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const applyBrake = () => {
    if (gameState !== 'running') return;
    // Kliknięcie/Spacja zbija prędkość w dół
    setCurrentSpeed(s => Math.max(0, s - 8));
  };

  const checkFinalSpeed = () => {
    // Tolerancja błędu: prędkość musi być mniejsza lub równa ograniczeniu, ale nie mniejsza niż limit - 15 (zbyt wolna jazda blokuje szlak)
    if (currentSpeed <= targetSpeed && currentSpeed >= targetSpeed - 15) {
      setScore(s => s + 1);
      setGameState('success');
    } else {
      setGameState('crashed');
    }
  };

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>📸 {t.title || 'Speed verification'}</h2>
          <div>{t.checkpointsLabel || 'Checkpoints cleared'}: <span style={{ color: '#00ffca', fontWeight: 'bold' }}>{score}</span></div>
        </div>

        <div className="game-viewport-area">
          
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>{t.introTitle || 'Road speed control'}</h3>
              <p className="game-explanation-text">
                {t.introText || 'You are approaching a speed check. Adjust your train speed so you do not exceed the limit. Do not go too slow either or you will block the line.'}
              </p>
              <button className="btn-arcade-play" onClick={startTest}>{t.startButton || 'Begin approach 🚇'}</button>
            </div>
          )}

          {gameState === 'running' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '15px', boxSizing: 'border-box' }}>
              
              {/* Pasek dystansu do fotoradaru */}
              <div style={{ width: '100%', maxWidth: '320px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                  <span>{t.distanceLabel || 'Distance to radar:'}</span>
                  <span style={{ color: '#ffa502', fontWeight: 'bold' }}>{Math.round(distanceLeft)} m</span>
                </div>
                <div style={{ height: '6px', background: '#141b24', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${distanceLeft}%`, height: '100%', background: '#ffa502', transition: 'width 0.06s linear' }} />
                </div>
              </div>

              {/* Wyświetlacz prędkości maszynisty */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', justifyContent: 'center', width: '100%' }}>
                <div style={{ background: '#11161b', border: '2px solid #ff4757', padding: '10px 15px', borderRadius: '8px', textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '10px', color: '#ff4757' }}>{t.speedLimitLabel || 'Speed limit'}</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{targetSpeed}</div>
                  <div style={{ fontSize: '9px', color: '#777' }}>km/h</div>
                </div>

                <div style={{ background: '#11161b', border: `2px solid ${currentSpeed > targetSpeed ? '#ff4757' : '#00ffca'}`, padding: '10px 15px', borderRadius: '8px', textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '10px', color: '#aaa' }}>{t.yourSpeedLabel || 'Your speed'}</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentSpeed > targetSpeed ? '#ff4757' : '#00ffca' }}>{Math.round(currentSpeed)}</div>
                  <div style={{ fontSize: '9px', color: '#777' }}>km/h</div>
                </div>
              </div>

              <button 
                className="btn-arcade-play" 
                onClick={applyBrake} 
                style={{ width: '220px', background: '#c0392b', border: '1px solid #ff4757' }}
              >
                {t.brakeButton || 'Emergency brake 🚨'}
              </button>
              <div style={{ fontSize: '10px', color: '#556270', marginTop: '10px' }}>{t.hintText || 'Tip: you can also use [SPACE] on your keyboard!'}</div>

            </div>
          )}

          {gameState === 'success' && (
            <div className="game-overlay-screen success-theme">
              <h3>🟢 {t.successTitle || 'Perfect speed'}</h3>
              <p className="game-explanation-text">{t.successText || 'You passed the radar at the ideal speed. The system logged a clean run.'}</p>
              <button className="btn-arcade-play" onClick={startTest}>{t.nextButton || 'Next sector 🔄'}</button>
            </div>
          )}

          {gameState === 'crashed' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>🚨 {t.failTitle || 'Too fast / too slow'}</h3>
              <p className="game-explanation-text">
                {currentSpeed > targetSpeed 
                  ? `${t.failTextHigh || 'You exceeded the speed limit.'} ${t.penaltyText || 'A penalty was applied.'}`
                  : `${t.failTextLow || 'You slowed down too much.'} ${t.penaltyText || 'A penalty was applied.'}`}
              </p>
              <p className="game-explanation-text">{t.scoreText || 'Penalty points'}: <strong>{score}</strong></p>
              <button className="btn-arcade-play" onClick={() => { setScore(0); startTest(); }}>{t.retryButton || 'Try again 🔄'}</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
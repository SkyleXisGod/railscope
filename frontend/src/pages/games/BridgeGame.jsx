import React, { useState, useEffect } from 'react';
import '../GamesPage.css';

export default function BridgeGame({ t, onBack }) {
  const [gameState, setGameState] = useState('idle'); // idle, running, stopped, crashed
  const [score, setScore] = useState(0);
  const [trainProgress, setTrainProgress] = useState(0);
  const [isLowering, setIsLowering] = useState(false);
  const [bridgeProgress, setBridgeProgress] = useState(0);

  const startTrain = () => {
    setTrainProgress(0);
    setIsLowering(false);
    setBridgeProgress(0);
    setGameState('running');
  };

  useEffect(() => {
    if (gameState !== 'running') return;

    // Prędkość wzrasta adaptacyjnie wraz z poziomem punktów gracza
    const trainSpeed = 1.6 + (score * 0.35); 

    const interval = setInterval(() => {
      // 1. Animowanie zamykania konstrukcji mostu
      if (isLowering) {
        setBridgeProgress((p) => Math.min(100, p + 14)); 
      }

      // 2. Aktualizacja pozycji pociągu
      setTrainProgress((prev) => {
        const next = prev + trainSpeed;

        // Luka rzeczna znajduje się w przedziale od 60% do 75% drogi składu
        if (next >= 60 && next <= 75) {
          if (bridgeProgress < 100) {
            setGameState('crashed'); // Most niezaryglowany na czas -> katastrofa
            clearInterval(interval);
            return prev;
          }
        }

        // Pociąg bezpiecznie dojechał do celu za rzeką
        if (next >= 100) {
          setScore((s) => s + 1);
          setGameState('stopped');
          clearInterval(interval);
          return 100;
        }

        return next;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [gameState, isLowering, bridgeProgress, score]);

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>{t.title || 'Most kolejowy'}</h2>
          {gameState === 'running' && (
            <div className="game-hud-stats">
              <span className="hud-score">🏆 {t.hudScore || 'Przeprawy'}: <strong>{score}</strong></span>
              <span className="hud-timer">⚡ {t.hudSpeed || 'Prędkość'}: <strong>{(1.6 + score * 0.35).toFixed(1)}x</strong></span>
            </div>
          )}
        </div>

        <div className="game-viewport-area">
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>{t.introTitle || 'Automatyka Mostów Ruchomych'}</h3>
              <p className="game-explanation-text">
                {t.introText || 'Ekspres pasażerski pędzi w stronę otwartego ramienia mostu! Kliknij przycisk kontrolny w idealnym ułamku sekundy, aby opuścić i zablokować przęsło zanim koła lokomotywy miną barierę bezpieczeństwa.'}
              </p>
              <button className="btn-arcade-play" onClick={startTrain}>{t.startButton || 'URUCHOM SYGNAŁ DROGOWY'}</button>
            </div>
          )}

          {gameState === 'running' && (
            <div style={{ padding: '30px 20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
              
              {/* Torowisko i rzeka z animowanym mechanicznym mostem */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '110px',
                background: '#0d1117',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center'
              }}>
                {/* Tor stacjonarny lewy */}
                <div style={{ position: 'absolute', left: 0, width: '60%', height: '6px', background: '#5e6a75' }} />
                
                {/* Przepaść rzeczna */}
                <div style={{ 
                  position: 'absolute', 
                  left: '60%', 
                  width: '15%', 
                  height: '100%', 
                  background: '#070a0e', 
                  borderLeft: '1px dashed var(--danger-color)', 
                  borderRight: '1px dashed var(--danger-color)' 
                }} />
                
                {/* Ruchoma klapa mostu zwodzonego */}
                <div style={{
                  position: 'absolute',
                  left: '60%',
                  width: '15%',
                  height: '6px',
                  background: 'var(--accent-color)',
                  transformOrigin: 'left top',
                  transform: `rotate(${90 - (bridgeProgress * 0.9)}deg)`,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                  transition: 'transform 0.04s linear'
                }} />
                
                {/* Tor stacjonarny prawy */}
                <div style={{ position: 'absolute', left: '75%', width: '25%', height: '6px', background: '#5e6a75' }} />

                {/* Lokomotywa */}
                <div style={{
                  position: 'absolute',
                  left: `${trainProgress}%`,
                  transform: 'translateX(-100%)',
                  fontSize: '35px',
                  bottom: '26px',
                  zIndex: 20,
                  userSelect: 'none'
                }}>
                  🚂
                </div>
              </div>

              {/* Dolny przycisk mechanizmu hydraulicznego */}
              <div style={{ textAlign: 'center' }}>
                <button 
                  className="btn-arcade-play" 
                  style={{ width: '100%', maxWidth: '450px', background: isLowering ? 'var(--bg-input)' : 'var(--accent-color)', color: isLowering ? 'var(--text-secondary)' : '#000' }} 
                  onClick={() => { if(!isLowering) setIsLowering(true); }}
                  disabled={isLowering}
                >
                  {isLowering ? `${t.loweringLabel || 'OPUSZCZANIE ZWODU'} (${bridgeProgress}%)` : (t.startButton || 'OPUŚĆ PRZĘSŁO NOW! 🚧')}
                </button>
              </div>
            </div>
          )}

          {gameState === 'crashed' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>💥 {t.crashTitle || 'KATASTROFA KOLEJOWA!'}</h3>
              <p className="game-explanation-text">{t.crashText || 'Pociąg runął w przepaść rzeczną. Most nie został zamknięty przed czasem krytycznym.'}</p>
              <p className="game-explanation-text">{t.crashScoreText || 'Ostateczny rekord operacji:'} <strong>{score} składów</strong></p>
              <button className="btn-arcade-play" onClick={startTrain}>{t.retryButton || 'Spróbuj Ponownie 🔄'}</button>
            </div>
          )}

          {gameState === 'stopped' && (
            <div className="game-overlay-screen success-theme">
              <h3>🎉 {t.successTitle || 'IDEALNY RELEKS!'}</h3>
              <p className="game-explanation-text">{t.successText || 'Skład przejechał bezpiecznie nad barierą wodną. Automatyka sprawna.'}</p>
              <button className="btn-arcade-play" onClick={startTrain}>{t.nextTrainButton || 'Kolejny Skład (Zwiększ Prędkość) ⏩'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
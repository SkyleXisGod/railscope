import React, { useState, useEffect } from 'react';

export default function BrakeGame({ t, onBack }) {
  const [speed, setSpeed] = useState(0);
  const [obstacleDistance, setObstacleDistance] = useState(1000);
  const [isBraking, setIsBraking] = useState(false);
  const [gameState, setGameState] = useState('idle'); // idle, running, stopped, crashed

  const startTrain = () => {
    setSpeed(Math.floor(Math.random() * 100) + 50);
    setObstacleDistance(Math.floor(Math.random() * 500) + 500);
    setIsBraking(false);
    setGameState('running');
  };

  useEffect(() => {
    if (gameState !== 'running') return;
    const interval = setInterval(() => {
      setObstacleDistance(d => {
        const nextD = d - (speed / 10);
        if (nextD <= 0 && speed > 0) {
          setGameState('crashed');
          return 0;
        }
        if (nextD > 0 && speed <= 0) {
          setGameState('stopped');
        }
        return nextD;
      });
      if (isBraking) {
        setSpeed(s => Math.max(0, s - 5));
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, speed, isBraking]);

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>🎛️ Kabina Maszynisty (Hebel Hamulca)</h2>
        </div>

        <div className="game-viewport-area">
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>Symulator Hamowania</h3>
              <p className="game-explanation-text">
                Pociąg pędzi w stronę stacji końcowej! Wyczuj odpowiedni moment i zaciągnij bezpiecznik hamulca, by zatrzymać skład idealnie przed peronem. Dojechanie z prędkością &gt; 0 skończy się katastrofą.
              </p>
              <button className="btn-arcade-play" onClick={startTrain}>RUSZAJ W TRASĘ 🚂</button>
            </div>
          )}

          {gameState === 'running' && (
            <>
              <div className="driver-cabin-panel">
                <div className="cabin-gauge speed-mode">
                  <h4>{speed} km/h</h4>
                  <p>PRĘDKOŚĆ</p>
                </div>
                <div className="cabin-gauge distance-mode">
                  <h4>{obstacleDistance.toFixed(0)} m</h4>
                  <p>DYSTANS DO STACJI</p>
                </div>
              </div>

              <div className="brake-lever-wrapper">
                <div 
                  className={`brake-lever-body ${isBraking ? 'pulled-state' : ''}`}
                  onClick={() => setIsBraking(true)}
                >
                  <div className="brake-lever-handle"></div>
                </div>
                <p>ZACIĄGNIJ HAMULEC AWARYJNY</p>
              </div>
            </>
          )}

          {gameState === 'crashed' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>💥 KATASTROFA!</h3>
              <p className="game-explanation-text">Nie zdążyłeś wyhamować pociągu i uderzyłeś w stację końcową!</p>
              <button className="btn-arcade-play" onClick={startTrain}>Spróbuj Ponownie 🔄</button>
            </div>
          )}

          {gameState === 'stopped' && (
            <div className="game-overlay-screen success-theme">
              <h3>🎉 SUKCES!</h3>
              <p className="game-explanation-text">
                Wspaniały manewr! Pociąg zatrzymał się bezpiecznie na stacji. Pozostały dystans: <strong>{obstacleDistance.toFixed(1)} m</strong>.
              </p>
              <button className="btn-arcade-play" onClick={startTrain}>Kolejny Przejazd 🔄</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
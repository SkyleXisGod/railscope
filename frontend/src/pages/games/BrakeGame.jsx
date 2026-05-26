import React, { useState, useEffect } from 'react';
export default function BrakeGame({ t, onBack }) {
  const [speed, setSpeed] = useState(0);
  const [obstacleDistance, setObstacleDistance] = useState(1000);
  const [isBraking, setIsBraking] = useState(false);
  const [gameState, setGameState] = useState('idle');

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
    <div className="game-container brake-theme">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>KABINA MASZYNISTY</h2>
      <div className="dashboard-panel">
        <div className="speedometer"><h3>{speed} km/h</h3><p>PRĘDKOŚĆ</p></div>
        <div className="radar"><h3>{obstacleDistance.toFixed(0)} m</h3><p>DO STACJI</p></div>
      </div>
      <div className="lever-container">
        <div className={`lever ${isBraking ? 'pulled' : ''}`} onClick={() => { if(gameState === 'running') setIsBraking(true); }}>
          <div className="lever-handle"></div>
          <div className="lever-shaft"></div>
        </div>
        <p>HEBEL HAMULCA</p>
      </div>
      {gameState === 'idle' && <button className="play-button" onClick={startTrain}>RUSZAJ W TRASĘ</button>}
      {gameState === 'crashed' && <h2 style={{color:'red'}}>💥 KATASTROFA! 💥 <br/><button className="play-button-mini" onClick={startTrain}>RESTART</button></h2>}
      {gameState === 'stopped' && <h2 style={{color:'#00ffca'}}>✔️ ZATRZYMAŁEŚ SIĘ! ✔️ <br/><button className="play-button-mini" onClick={startTrain}>ZAGRAJ PONOWNIE</button></h2>}
    </div>
  );
}

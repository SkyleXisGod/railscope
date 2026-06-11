import React, { useState, useEffect, useCallback } from 'react';
import '../GamesPage.css';
import { MAZE_MAPS } from './mazemaps/mazemaps'; // Import zewnętrznej bazy map

export default function TrainMaze({ t, onBack }) {
  const [currentMap, setCurrentMap] = useState(MAZE_MAPS[0]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle, running, success, timeout
  const [timeLeft, setTimeLeft] = useState(35);

  const drawRandomMap = () => {
    const randomIndex = Math.floor(Math.random() * MAZE_MAPS.length);
    const selectedMap = MAZE_MAPS[randomIndex];
    setCurrentMap(selectedMap);
    setPlayerPos({ ...selectedMap.startPos });
  };

  const startNewGame = () => {
    drawRandomMap();
    if (gameState === 'success') {
      setScore(s => s + 1);
    } else {
      setScore(0);
    }
    setTimeLeft(35);
    setGameState('running');
  };

  // NAPRAWIONE: Funkcja dynamicznie reaguje na każdą zmianę currentMap i gameState
  const movePlayer = useCallback((dx, dy) => {
    if (gameState !== 'running') return;

    setPlayerPos(current => {
      const nextX = current.x + dx;
      const nextY = current.y + dy;

      // Dynamiczne sprawdzanie wymiarów aktualnie załadowanej siatki
      const height = currentMap.grid.length;
      const width = currentMap.grid[0].length;

      // Sprawdzenie krawędzi mapy
      if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) return current;

      // Sprawdzenie kolizji z drzewem (wartość 1)
      if (currentMap.grid[nextY][nextX] === 1) return current;

      const nextPos = { x: nextX, y: nextY };

      // Sprawdzenie dotarcia do celu (stacji końcowej)
      if (nextPos.x === currentMap.targetPos.x && nextPos.y === currentMap.targetPos.y) {
        setGameState('success');
      }

      return nextPos;
    });
  }, [gameState, currentMap]); // Poprawne zależności

  // Słuchacz klawiatury
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'running') return;
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); movePlayer(0, -1); break;
        case 'ArrowDown': e.preventDefault(); movePlayer(0, 1); break;
        case 'ArrowLeft': e.preventDefault(); movePlayer(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); movePlayer(1, 0); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, movePlayer]);

  // Licznik czasu
  useEffect(() => {
    if (gameState !== 'running') return;
    if (timeLeft <= 0) {
      setGameState('timeout');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>🚂 {t.title || 'Train Maze'}</h2>
          <div>{t.routeLabel || 'Route'}: <span style={{ color: '#00ffca', fontWeight: 'bold' }}>{currentMap.name.toUpperCase()}</span></div>
        </div>

        <div className="game-viewport-area maze">
          
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>{t.introTitle || 'Rail navigation'}</h3>
              <p className="game-explanation-text">
                {t.introText || 'Guide the train safely through blocked tracks. Reach the terminal station before time runs out.'}
              </p>
              <button className="btn-arcade-play" onClick={startNewGame}>
                {t.startButton || 'Fire up the engine 🔋'}
              </button>
            </div>
          )}

          {gameState === 'running' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', padding: '10px', boxSizing: 'border-box' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '360px', marginBottom: '10px', fontSize: '11px', letterSpacing: '1px' }}>
                <div>{t.pointsLabel || 'Points'}: <span style={{ color: '#00ffca', fontWeight: 'bold' }}>{score}</span></div>
                <div>{t.reactionTimeLabel || 'Reaction time'}: <span style={{ color: timeLeft < 10 ? '#ff0055' : '#00ffca', fontWeight: 'bold' }}>{timeLeft}s</span></div>
              </div>

              {/* DYNAMICZNY GRID: Liczba kolumn generuje się automatycznie na podstawie szerokości tablicy */}
              <div 
                className="maze-board-grid"
                style={{ 
                  gridTemplateColumns: `repeat(${currentMap.grid[0].length}, 1fr)`,
                  maxWidth: '380px',
                  width: '100%'
                }}
              >
                {currentMap.grid.map((row, y) => 
                  row.map((cell, x) => {
                    const isPlayer = playerPos.x === x && playerPos.y === y;
                    const isTarget = currentMap.targetPos.x === x && currentMap.targetPos.y === y;
                    const isWall = cell === 1;

                    return (
                      <div 
                        key={`${x}-${y}`} 
                        className={`maze-cell ${isWall ? 'cell-wall' : 'cell-track'}`}
                        style={{
                          fontSize: currentMap.grid[0].length > 10 ? '16px' : '22px', // Mniejsza czcionka dla dużych map 12x12
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isPlayer ? '🚂' : isTarget ? '🚉' : isWall ? '🌲' : ''}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Przyciski sterowania dla myszki / urządzeń dotykowych */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <button className="play-button-mini" style={{ margin: '2px', width: '40px', height: '36px' }} onClick={() => movePlayer(0, -1)}>▲</button>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <button className="play-button-mini" style={{ margin: '2px', width: '40px', height: '36px' }} onClick={() => movePlayer(-1, 0)}>◀</button>
                  <button className="play-button-mini" style={{ margin: '2px', width: '40px', height: '36px' }} onClick={() => movePlayer(0, 1)}>▼</button>
                  <button className="play-button-mini" style={{ margin: '2px', width: '40px', height: '36px' }} onClick={() => movePlayer(1, 0)}>▶</button>
                </div>
              </div>

            </div>
          )}

          {gameState === 'success' && (
            <div className="game-overlay-screen success-theme">
              <h3>🎉 {t.successTitle || 'Station reached!'}</h3>
              <p className="game-explanation-text">{t.successText || 'The train arrived on schedule. Track clear.'}</p>
              <button className="btn-arcade-play" onClick={startNewGame}>
                {t.nextButton || 'Next run 🔄'}
              </button>
            </div>
          )}

          {gameState === 'timeout' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>🛑 {t.timeoutTitle || 'Train delay'}</h3>
              <p className="game-explanation-text">{t.timeoutText || 'Time ran out. The train stalled on a blocked junction.'}</p>
              <p className="game-explanation-text">{t.finalScoreText || 'Your final score:'} <strong>{score}</strong></p>
              <button className="btn-arcade-play" onClick={startNewGame}>
                {t.retryButton || 'Try again 🔄'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
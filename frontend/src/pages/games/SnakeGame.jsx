import React, { useState, useEffect, useCallback } from 'react';
import '../GamesPage.css';

const GRID_SIZE = 15; // Zmniejszona siatka pod stały widok viewportu

export default function SnakeGame({ t, onBack }) {
  const [snake, setSnake] = useState([[7, 7]]);
  const [direction, setDirection] = useState([0, -1]);
  const [food, setFood] = useState([3, 3]);
  const [gameState, setGameState] = useState('idle'); // idle, running, crashed
  const [score, setScore] = useState(0);

  const generateFood = useCallback((currentSnake) => {
    while (true) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (!currentSnake.some(s => s[0] === x && s[1] === y)) {
        return [x, y];
      }
    }
  }, []);

  const startGame = () => {
    const initSnake = [[7, 7]];
    setSnake(initSnake);
    setDirection([0, -1]);
    setScore(0);
    setFood(generateFood(initSnake));
    setGameState('running');
  };

  const handleKeyDown = useCallback((e) => {
    if (gameState !== 'running') return;
    switch (e.key) {
      case 'ArrowUp': if (direction[1] !== 1) setDirection([0, -1]); break;
      case 'ArrowDown': if (direction[1] !== -1) setDirection([0, 1]); break;
      case 'ArrowLeft': if (direction[0] !== 1) setDirection([-1, 0]); break;
      case 'ArrowRight': if (direction[0] !== -1) setDirection([1, 0]); break;
      default: break;
    }
  }, [direction, gameState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameState !== 'running') return;

    const moveInterval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const nextHead = [head[0] + direction[0], head[1] + direction[1]];

        // Kolizja ze ścianą boczna magistrali
        if (nextHead[0] < 0 || nextHead[0] >= GRID_SIZE || nextHead[1] < 0 || nextHead[1] >= GRID_SIZE) {
          setGameState('crashed');
          return prevSnake;
        }

        // Kolizja z własnym ogonem sondy
        if (prevSnake.some(segment => segment[0] === nextHead[0] && segment[1] === nextHead[1])) {
          setGameState('crashed');
          return prevSnake;
        }

        const newSnake = [nextHead, ...prevSnake];

        // Sprawdzenie przechwycenia pakietu usterki
        if (nextHead[0] === food[0] && nextHead[1] === food[1]) {
          setScore(s => s + 1);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 180 - Math.min(score * 8, 100)); // Przyspieszenie wraz z postępem

    return () => clearInterval(moveInterval);
  }, [gameState, direction, food, score, generateFood]);

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>📟 {t.title || 'Train Snake'}</h2>
          {gameState === 'running' && (
            <div>{t.scoreLabel || 'Recovery'}: <span style={{ color: '#00ffca', fontWeight: 'bold' }}>{score} KB</span></div>
          )}
        </div>

        <div className="game-viewport-area" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>{t.introTitle || 'Calibrate the fiber network'}</h3>
              <p className="game-explanation-text">
                {t.introText || 'Guide the cleaning probe with arrow keys. Clear rogue data packets in the electromagnetic fog. A hit to the core will destroy the probe.'}
              </p>
              <button className="btn-arcade-play" onClick={startGame}>{t.startButton || 'Launch probe'}</button>
            </div>
          )}

          {gameState === 'running' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              width: '280px',
              height: '280px',
              background: '#0d131a',
              border: '2px solid #2c3e50',
              borderRadius: '6px',
              padding: '2px'
            }}>
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                const x = idx % GRID_SIZE;
                const y = Math.floor(idx / GRID_SIZE);
                
                const isHead = snake[0][0] === x && snake[0][1] === y;
                const isBody = !isHead && snake.some(s => s[0] === x && s[1] === y);
                const isFood = food[0] === x && food[1] === y;

                let cellBg = 'transparent';
                if (isHead) cellBg = '#00ffca';
                else if (isBody) cellBg = 'rgba(0, 255, 202, 0.4)';
                else if (isFood) cellBg = '#ff4757';

                return (
                  <div
                    key={idx}
                    style={{
                      background: cellBg,
                      borderRadius: isHead || isFood ? '3px' : '1px',
                      margin: '1px',
                      boxShadow: isHead ? '0 0 8px #00ffca' : isFood ? '0 0 8px #ff4757' : 'none'
                    }}
                  />
                );
              })}
            </div>
          )}

          {gameState === 'crashed' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>💥 {t.crashTitle || 'Probe failure!'}</h3>
              <p className="game-explanation-text">{t.crashText || 'The probe hit a physical barrier and lost auxiliary power.'}</p>
              <p className="game-explanation-text">{t.scoreText || 'Cleared blocks:'} <strong>{score}</strong></p>
              <button className="btn-arcade-play" onClick={startGame}>{t.retryButton || 'Restart guidance system 🔄'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
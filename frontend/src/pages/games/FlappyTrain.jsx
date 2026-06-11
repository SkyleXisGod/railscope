import React, { useState, useEffect, useRef } from 'react';

const GRAVITY = 0.4;
const JUMP = -7;
const OBSTACLE_SPEED = 4;
const OBSTACLE_WIDTH = 60;

export default function FlappyTrain({ t, onBack }) {
  const [gameState, setGameState] = useState('idle'); // idle, playing, gameover
  const [trainY, setTrainY] = useState(200);
  const [velocity, setVelocity] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);

  const requestRef = useRef();
  const lastSpawnRef = useRef(0);

  const handleJump = () => {
    if (gameState === 'playing') {
      setVelocity(JUMP);
    }
  };

  const startGame = () => {
    setTrainY(200);
    setVelocity(0);
    setObstacles([]);
    setScore(0);
    lastSpawnRef.current = performance.now();
    setGameState('playing');
  };

  const updateGame = (time) => {
    if (gameState !== 'playing') return;

    // Grawitacja i ruch pociągu
    setTrainY((y) => {
      const nextY = y + velocity;
      if (nextY > 400 || nextY < 0) {
        setGameState('gameover');
        return y;
      }
      return nextY;
    });
    setVelocity((v) => v + GRAVITY);

    // Generator przeszkód
    if (time - lastSpawnRef.current > 1800) {
      const gapPosition = Math.floor(Math.random() * 180) + 50; // wysokość szczeliny
      setObstacles((obs) => [
        ...obs,
        { id: Math.random(), left: 800, gapTop: gapPosition, gapBottom: gapPosition + 130 }
      ]);
      lastSpawnRef.current = time;
    }

    // Ruch przeszkód i kolizje
    setObstacles((prevObs) => {
      const updated = [];
      for (let ob of prevObs) {
        const nextLeft = ob.left - OBSTACLE_SPEED;

        // Sprawdzenie kolizji (pociąg jest na stałej pozycji X ok 100px od lewej)
        if (nextLeft < 150 && nextLeft + OBSTACLE_WIDTH > 100) {
          // Pociąg jest w osi przeszkody, sprawdzamy czy uderzył w barierę góra/dół
          if (trainY < ob.gapTop || trainY + 30 > ob.gapBottom) {
            setGameState('gameover');
          }
        }

        if (nextLeft < 100 && !ob.passed) {
          ob.passed = true;
          setScore(s => s + 1);
        }

        if (nextLeft > -OBSTACLE_WIDTH) {
          updated.push({ ...ob, left: nextLeft });
        }
      }
      return updated;
    });

    requestRef.current = requestAnimationFrame(updateGame);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(updateGame);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, trainY, velocity]);

  return (
    <div className="game-card-wrapper" onClick={handleJump}>
      <button className="back-button" onClick={(e) => { e.stopPropagation(); onBack(); }}>
        &larr; {t.btn_back || 'Powrót'}
      </button>

      <div className="game-main-card" onClick={(e) => e.stopPropagation()}>
        <div className="game-top-header">
          <h2>🚂 {t.title || 'Flappy Train'}</h2>
          {gameState === 'playing' && (
            <div className="game-hud-stats">
              <span className="hud-score">🏆 {t.scoreLabel || 'Score'}: <strong>{score}</strong></span>
            </div>
          )}
        </div>

        <div className="game-viewport-area" onClick={handleJump} style={{ cursor: 'pointer' }}>
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>{t.subtitle || 'Quick aerial run'}</h3>
              <p className="game-explanation-text">
                {t.introText || 'Keep the train airborne! Tap anywhere on the game screen to jump and dodge giant traction poles.'}
              </p>
              <button className="btn-arcade-play" onClick={startGame}>{t.startButton || 'START 🚀'}</button>
            </div>
          )}

          {gameState === 'playing' && (
            <>
              {/* Lokomotywa */}
              <div style={{
                position: 'absolute',
                left: '100px',
                top: `${trainY}px`,
                fontSize: '35px',
                zIndex: 5,
                userSelect: 'none',
                transform: `rotate(${velocity * 2}deg)`,
                transition: 'transform 0.05s linear'
              }}>
                🚂
              </div>

              {/* Przeszkody */}
              {obstacles.map((ob) => (
                <React.Fragment key={ob.id}>
                  {/* Górna rura */}
                  <div style={{
                    position: 'absolute',
                    left: `${ob.left}px`,
                    top: 0,
                    width: `${OBSTACLE_WIDTH}px`,
                    height: `${ob.gapTop}px`,
                    background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)',
                    borderLeft: '2px solid #e74c3c',
                    borderRight: '2px solid #e74c3c',
                    borderBottom: '4px solid #e74c3c'
                  }} />
                  {/* Dolna rura */}
                  <div style={{
                    position: 'absolute',
                    left: `${ob.left}px`,
                    top: `${ob.gapBottom}px`,
                    width: `${OBSTACLE_WIDTH}px`,
                    bottom: 0,
                    background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)',
                    borderLeft: '2px solid #e74c3c',
                    borderRight: '2px solid #e74c3c',
                    borderTop: '4px solid #e74c3c'
                  }} />
                </React.Fragment>
              ))}
            </>
          )}

          {gameState === 'gameover' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>{t.gameOverTitle || 'Train wreck!'}</h3>
              <p className="game-explanation-text">{t.gameOverText || 'The train collided with infrastructure.'}</p>
              <p className="game-explanation-text">{t.scoreText || 'Your final score is:'} <strong>{score}</strong>.</p>
              <button className="btn-arcade-play" onClick={startGame}>{t.retryButton || 'Play again 🔄'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
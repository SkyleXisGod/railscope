import React, { useState, useEffect, useRef } from 'react';
import '../GamesPage.css';

export default function WagonCatcher({ t, onBack }) {
  const [gameState, setGameState] = useState('idle'); // idle, playing, crashed
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [locoX, setLocoX] = useState(50); // Pozycja lokomotywy w % (0 do 100)
  const [wagons, setWagons] = useState([]);

  const gameIntervalRef = useRef(null);
  const spawnTimerRef = useRef(0);
  const keysPressed = useRef({});

  const startGame = () => {
    setScore(0);
    setLives(3);
    setLocoX(45);
    setWagons([]);
    setGameState('playing');
    spawnTimerRef.current = 0;
  };

  // Obsługa sterowania z klawiatury
  useEffect(() => {
    const handleKeyDown = (e) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Główna pętla gry
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameIntervalRef.current = setInterval(() => {
      // 1. Płynny ruch lokomotywy
      setLocoX((prev) => {
        let next = prev;
        if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A']) {
          next = Math.max(0, prev - 5);
        }
        if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D']) {
          next = Math.min(85, prev + 5); // 85 chroni przed wyjechaniem za szerokość ekranu
        }
        return next;
      });

      // 2. Odliczanie czasu do spawnu nowego wagonu
      spawnTimerRef.current += 1;
      if (spawnTimerRef.current >= 18) { 
        spawnTimerRef.current = 0;
        const types = ['normal', 'gold', 'heavy'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        setWagons((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            x: Math.floor(Math.random() * 85),
            y: 0,
            type: randomType,
            speed: randomType === 'gold' ? 8 : randomType === 'heavy' ? 4 : 5,
          },
        ]);
      }

      // 3. Przemieszczanie wagonów oraz detekcja kolizji
      setWagons((prevWagons) => {
        let updated = [];
        let lifeLost = 0;
        let scoreGain = 0;

        for (let w of prevWagons) {
          let nextY = w.y + w.speed;

          // Detekcja złapania przez dach lokomotywy (strefa y ok. 82% - 90%)
          if (nextY >= 82 && nextY <= 90) {
            // Sprawdzenie nachodzenia poziomego (szerokość lokomotywy to ok. 15%)
            if (w.x >= locoX - 4 && w.x <= locoX + 15) {
              scoreGain += w.type === 'gold' ? 30 : w.type === 'heavy' ? 10 : 15;
              continue; // Wagon złapany - znika z planszy
            }
          }

          // Sprawdzenie upuszczenia wagonu (ucieczka na dół)
          if (nextY >= 95) {
            if (w.type !== 'gold') {
              lifeLost += 1; // Przepuszczenie zwykłego/ciężkiego wagonu kosztuje życie
            }
            continue; 
          }

          updated.push({ ...w, y: nextY });
        }

        if (scoreGain > 0) setScore((s) => s + scoreGain);
        if (lifeLost > 0) {
          setLives((l) => {
            const nextL = l - lifeLost;
            if (nextL <= 0) setGameState('crashed');
            return Math.max(0, nextL);
          });
        }

        return updated;
      });

    }, 50);

    return () => clearInterval(gameIntervalRef.current);
  }, [gameState, locoX]);

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>📦 {t.title || 'Wagon Catcher'} <br></br> ({t.introTitle || 'Maneuvering Run'})</h2>
          {gameState === 'playing' && (
            <div className="game-hud-stats">
              <span className="hud-score">🏆 {t.scoreLabel || 'Score'}: <strong>{score}</strong></span>
              <span className="hud-timer">{t.livesLabel || 'Lives'}: <strong>{Array.from({ length: Math.max(0, lives) }).map(() => '❤️').join(' ')}</strong></span>
            </div>
          )}
        </div>

        <div className="game-viewport-area">
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>{t.introTitle || 'Yard maneuvering'}</h3>
              <p className="game-explanation-text">
                {t.introText || 'Steer the locomotive with left/right arrows or A/D. Catch falling freight loads and secure the train before a logistics disaster!'}
              </p>
              <div className="game-controls-badge" style={{ display: 'flex', gap: '15px', fontSize: '0.85rem' }}>
                <span>📦 {t.typeInfoNormal || 'Normal: 15 pts'}</span>
                <span>⭐ {t.typeInfoGold || 'Gold (Fast): 30 pts'}</span>
                <span>💼 {t.typeInfoHeavy || 'Heavy: 10 pts'}</span>
              </div>
              <button className="btn-arcade-play" onClick={startGame}>{t.startButton || 'Start maneuvering run'}</button>
            </div>
          )}

          {gameState === 'playing' && (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* Renderowanie spadających obiektów */}
              {wagons.map((w) => (
                <div
                  key={w.id}
                  style={{
                    position: 'absolute',
                    left: `${w.x}%`,
                    top: `${w.y}%`,
                    fontSize: w.type === 'gold' ? '28px' : '24px',
                    transition: 'top 0.05s linear',
                    zIndex: 10,
                    filter: w.type === 'gold' ? 'drop-shadow(0 0 8px #ffd700)' : 'none'
                  }}
                >
                  {w.type === 'gold' ? '⭐' : w.type === 'heavy' ? '💼' : '📦'}
                </div>
              ))}

              {/* Lokomotywa gracza */}
              <div
                style={{
                  position: 'absolute',
                  left: `${locoX}%`,
                  bottom: '15px',
                  fontSize: '45px',
                  transition: 'left 0.05s linear',
                  zIndex: 12,
                  userSelect: 'none'
                }}
              >
                🚂
              </div>
            </div>
          )}

          {gameState === 'crashed' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>💥 {t.crashTitle || 'Train derailed!'}</h3>
              <p className="game-explanation-text">{t.crashText || 'You dropped too many freight wagons and lost train stability.'}</p>
              <p className="game-explanation-text">{t.scoreText || 'Your final score:'} <strong>{score}</strong></p>
              <button className="btn-arcade-play" onClick={startGame}>{t.retryButton || 'Try again 🔄'}</button>
            </div>
          )}
        </div>

        {/* Mobilne/Ekranowe przyciski sterujące widoczne pod ekranem tylko w fazie gry */}
        {gameState === 'playing' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px' }}>
            <button 
              className="btn-arcade-play" 
              style={{ padding: '8px 25px', margin: 0 }}
              onMouseDown={() => { keysPressed.current['ArrowLeft'] = true; }}
              onMouseUp={() => { keysPressed.current['ArrowLeft'] = false; }}
              onTouchStart={() => { keysPressed.current['ArrowLeft'] = true; }}
              onTouchEnd={() => { keysPressed.current['ArrowLeft'] = false; }}
            >
              ◀ {t.leftButton || 'Left'}
            </button>
            <button 
              className="btn-arcade-play" 
              style={{ padding: '8px 25px', margin: 0 }}
              onMouseDown={() => { keysPressed.current['ArrowRight'] = true; }}
              onMouseUp={() => { keysPressed.current['ArrowRight'] = false; }}
              onTouchStart={() => { keysPressed.current['ArrowRight'] = true; }}
              onTouchEnd={() => { keysPressed.current['ArrowRight'] = false; }}
            >
              {t.rightButton || 'Right'} ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
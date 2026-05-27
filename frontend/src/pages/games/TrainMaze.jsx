import React, { useState, useEffect, useCallback } from 'react';
import '../GamesPage.css';

// 0 = Tor (Przejezdny), 1 = Blokada/Ściana (Nieprzejezdna)
const MAZE_MAP = [
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 1, 0, 0, 0],
  [1, 1, 1, 0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 0, 1, 0],
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 0]
];

export default function TrainMaze({ t, onBack }) {
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, WIN, GAMEOVER
  const [timeLeft, setTimeLeft] = useState(35);

  const targetPos = { x: 7, y: 7 };

  const startNewGame = () => {
    setPlayerPos({ x: 0, y: 0 });
    setTimeLeft(35);
    setGameState('PLAYING');
  };

  const movePlayer = useCallback((dx, dy) => {
    if (gameState !== 'PLAYING') return;

    setPlayerPos(prev => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;

      // Sprawdzenie granic mapy
      if (newX < 0 || newX >= 8 || newY < 0 || newY >= 8) return prev;
      // Sprawdzenie czy pole nie jest zablokowane (ściana)
      if (MAZE_MAP[newY][newX] === 1) return prev;

      // Sprawdzenie dotarcia do celu
      if (newX === targetPos.x && newY === targetPos.y) {
        setScore(s => s + 150);
        setGameState('WIN');
      }

      return { x: newX, y: newY };
    });
  }, [gameState, targetPos.x, targetPos.y]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'PLAYING') return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); // Zapobieganie skrolowaniu strony
      }
      switch (e.key) {
        case 'ArrowUp': movePlayer(0, -1); break;
        case 'ArrowDown': movePlayer(0, 1); break;
        case 'ArrowLeft': movePlayer(-1, 0); break;
        case 'ArrowRight': movePlayer(1, 0); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, movePlayer]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    if (timeLeft <= 0) {
      setGameState('GAMEOVER');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  return (
    <div className="game-container furnace-theme">
      <button className="back-button" onClick={onBack}>
        &larr; {t.btn_back}
      </button>
      
      <h2 className="chernobyl-title">{t.game_maze_title || 'MANEWRY W LABIRYNCIE'}</h2>

      {gameState === 'START' && (
        <div className="chernobyl-panel" style={{ textAlign: 'center', padding: '30px' }}>
          <p style={{ color: '#00ffca', fontSize: '1.1rem', marginBottom: '20px' }}>
            Skład utknął na stacji rozrządowej! Przeprowadź lokomotywę przez gąszcz bocznic 
            wprost do głównego terminala pasażerskiego. Użyj strzałek na klawiaturze.
          </p>
          <button className="play-button" onClick={startNewGame}>
            URUCHOM LOKOMOTYWĘ
          </button>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <>
          <div className="chernobyl-panel" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p style={{ margin: 0 }}>PREMIA: <span className="green-text" style={{ fontWeight: 'bold' }}>{score}</span></p>
            <p style={{ margin: 0 }}>CZAS ROZKŁADOWY: <span className={timeLeft < 8 ? "blink-red" : "green-text"} style={{ fontWeight: 'bold' }}>{timeLeft}s</span></p>
          </div>

          <div className="maze-board-grid">
            {MAZE_MAP.map((row, y) =>
              row.map((cell, x) => {
                const isPlayer = playerPos.x === x && playerPos.y === y;
                const isTarget = targetPos.x === x && targetPos.y === y;
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`maze-cell ${cell === 1 ? 'cell-wall' : 'cell-track'}`}
                  >
                    {isPlayer && <span className="maze-emoji-object animate-train">🚂</span>}
                    {!isPlayer && isTarget && <span className="maze-emoji-object">🚉</span>}
                    {!isPlayer && !isTarget && cell === 1 && <span style={{ opacity: 0.35, fontSize: '14px' }}>🧱</span>}
                  </div>
                );
              })
            )}
          </div>

          {/* Pomocnicze przyciski ekranowe */}
          <div className="maze-mobile-controls" style={{ marginTop: '25px', textAlign: 'center' }}>
            <div>
              <button className="play-button-mini" style={{ margin: '4px', width: '45px', height: '40px' }} onClick={() => movePlayer(0, -1)}>▲</button>
            </div>
            <div>
              <button className="play-button-mini" style={{ margin: '4px', width: '45px', height: '40px' }} onClick={() => movePlayer(-1, 0)}>◀</button>
              <button className="play-button-mini" style={{ margin: '4px', width: '45px', height: '40px' }} onClick={() => movePlayer(0, 1)}>▼</button>
              <button className="play-button-mini" style={{ margin: '4px', width: '45px', height: '40px' }} onClick={() => movePlayer(1, 0)}>▶</button>
            </div>
          </div>
        </>
      )}

      {gameState === 'WIN' && (
        <div className="chernobyl-panel" style={{ textAlign: 'center', padding: '30px' }}>
          <h3 className="green-text" style={{ fontSize: '1.5rem', marginBottom: '15px' }}>🎉 STACJA OSIĄGNIĘTA!</h3>
          <p style={{ marginBottom: '20px' }}>Wprowadziłeś pociąg na właściwy tor bez żadnych opóźnień.</p>
          <button className="play-button" onClick={startNewGame}>
            KOLEJNY KURS 🔄
          </button>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="chernobyl-panel" style={{ textAlign: 'center', padding: '30px' }}>
          <h3 className="blink-red" style={{ fontSize: '1.5rem', marginBottom: '15px' }}>🛑 OPÓŹNIENIE SKŁADU</h3>
          <p style={{ marginBottom: '20px' }}>Czas minął, a pociąg utknął zablokowany w polu semaforowym.</p>
          <button className="play-button" onClick={startNewGame}>
            SPRÓBUJ PONOWNIE 🔄
          </button>
        </div>
      )}
    </div>
  );
}
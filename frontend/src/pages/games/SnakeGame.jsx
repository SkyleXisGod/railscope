import React, { useState, useEffect, useRef } from 'react';

export default function SnakeGame({ t, onBack }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const gridRef = useRef({
    snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }],
    direction: { x: 0, y: -1 },
    passenger: { x: 5, y: 5 },
    gridSize: 20,
    tileCount: 20
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const dir = gridRef.current.direction;
      if (e.key === 'ArrowUp' && dir.y !== 1) gridRef.current.direction = { x: 0, y: -1 };
      if (e.key === 'ArrowDown' && dir.y !== -1) gridRef.current.direction = { x: 0, y: 1 };
      if (e.key === 'ArrowLeft' && dir.x !== 1) gridRef.current.direction = { x: -1, y: 0 };
      if (e.key === 'ArrowRight' && dir.x !== -1) gridRef.current.direction = { x: 1, y: 0 };
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const spawnPassenger = (data) => {
      data.passenger = {
        x: Math.floor(Math.random() * data.tileCount),
        y: Math.floor(Math.random() * data.tileCount)
      };
    };

    const interval = setInterval(() => {
      const data = gridRef.current;
      const head = { x: data.snake[0].x + data.direction.x, y: data.snake[0].y + data.direction.y };

      // Kolizje ze ścianami lub własnym ogonem
      if (head.x < 0 || head.x >= data.tileCount || head.y < 0 || head.y >= data.tileCount ||
          data.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        clearInterval(interval);
        return;
      }

      data.snake.unshift(head);

      // Zjedzenie pasażera
      if (head.x === data.passenger.x && head.y === data.passenger.y) {
        setScore(s => s + 10);
        spawnPassenger(data);
      } else {
        data.snake.pop();
      }

      // Rysowanie planszy
      ctx.fillStyle = '#15151e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rysowanie pasażera
      ctx.font = '16px sans-serif';
      ctx.fillText('🧍', data.passenger.x * data.gridSize + 2, data.passenger.y * data.gridSize + 16);

      // Rysowanie pociągu
      data.snake.forEach((segment, idx) => {
        if (idx === 0) {
          ctx.fillText('🚂', segment.x * data.gridSize, segment.y * data.gridSize + 16);
        } else {
          ctx.fillStyle = '#4e5d6c';
          ctx.fillRect(segment.x * data.gridSize + 2, segment.y * data.gridSize + 2, data.gridSize - 4, data.gridSize - 4);
        }
      });
    }, 150);

    return () => clearInterval(interval);
  }, [gameOver]);

  return (
    <div className="game-container math-game-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2 className="game-title-accent">{t.game_snake_title || "Kolejowy Snake"}</h2>
      <p className="game-stat">{t.score || "Wynik:"} <span className="stat-highlight">{score}</span></p>
      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <canvas ref={canvasRef} width={400} height={400} style={{ border: '3px solid #222', borderRadius: '8px' }} />
      </div>
      {gameOver && (
        <div className="game-won animation-pop" style={{ background: '#a12424' }}>
          <h3>{t.game_over || "Koniec Gry!"}</h3>
          <button className="play-button" onClick={() => window.location.reload()}>{t.play_again || "Zagraj ponownie"}</button>
        </div>
      )}
    </div>
  );
}
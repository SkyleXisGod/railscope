import React, { useState, useEffect, useCallback } from 'react';
import '../GamesPage.css';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [[10, 10]];
const INITIAL_DIRECTION = [0, -1];

export default function SnakeGame({ t, onBack }) {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState([5, 5]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  const generateFood = useCallback(() => {
    return [Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)];
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!isStarted) setIsStarted(true);
    switch (e.key) {
      case 'ArrowUp': if (direction[1] !== 1) setDirection([0, -1]); break;
      case 'ArrowDown': if (direction[1] !== -1) setDirection([0, 1]); break;
      case 'ArrowLeft': if (direction[0] !== 1) setDirection([-1, 0]); break;
      case 'ArrowRight': if (direction[0] !== -1) setDirection([1, 0]); break;
      default: break;
    }
  }, [direction, isStarted]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isStarted || gameOver) return;
    const moveInterval = setInterval(() => {
      setSnake(prev => {
        const head = prev[0];
        const newHead = [head[0] + direction[0], head[1] + direction[1]];
        if (newHead[0] < 0 || newHead[0] >= GRID_SIZE || newHead[1] < 0 || newHead[1] >= GRID_SIZE || prev.some(s => s[0] === newHead[0] && s[1] === newHead[1])) {
          setGameOver(true);
          return prev;
        }
        const newSnake = [newHead, ...prev];
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          setScore(s => s + 10);
          setFood(generateFood());
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, 150);
    return () => clearInterval(moveInterval);
  }, [direction, isStarted, gameOver, food, generateFood]);

  return (
    <div className="game-container snake-theme">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>{t.game_snake_title}</h2>
      <p>{t.score} {score}</p>
      <div className="snake-grid">
        {!isStarted && !gameOver && <div className="overlay-msg">{t.click_to_start}</div>}
        {gameOver && <div className="overlay-msg"><h3>{t.game_over}</h3><button className="play-button" onClick={() => { setSnake(INITIAL_SNAKE); setScore(0); setGameOver(false); setIsStarted(false); }}>{t.play_again}</button></div>}
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE; const y = Math.floor(i / GRID_SIZE);
          const isSnake = snake.some(s => s[0] === x && s[1] === y);
          const isFood = food[0] === x && food[1] === y;
          return <div key={i} className={`snake-cell ${isSnake ? 'body' : ''}`}>{isFood ? '🧍' : ''}</div>;
        })}
      </div>
    </div>
  );
}
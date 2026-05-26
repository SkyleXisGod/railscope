import React, { useState, useEffect, useRef } from 'react';

export const FlappyTrain = ({ t, onBack }) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const canvasRef = useRef(null);
  const stateRef = useRef({
    trainY: 150, velocity: 0, pipes: [], frame: 0, score: 0, gameOver: false, hasStarted: false
  });

  const jump = () => {
    if (stateRef.current.gameOver) { resetGame(); return; }
    if (!stateRef.current.hasStarted) { stateRef.current.hasStarted = true; setHasStarted(true); }
    stateRef.current.velocity = -5.5;
  };

  const resetGame = () => {
    stateRef.current = { trainY: 150, velocity: 0, pipes: [], frame: 0, score: 0, gameOver: false, hasStarted: true };
    setGameOver(false);
    setScore(0);
  };

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const gameLoop = () => {
      const state = stateRef.current;
      ctx.fillStyle = '#1e1e24';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#444';
      ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

      if (state.hasStarted && !state.gameOver) {
        state.velocity += 0.25;
        state.trainY += state.velocity;
        state.frame++;

        if (state.frame % 100 === 0) {
          const gap = 110;
          const minHeight = 40;
          const maxHeight = canvas.height - gap - minHeight;
          const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
          state.pipes.push({ x: canvas.width, top: height, bottom: canvas.height - height - gap, passed: false });
        }

        for (let i = state.pipes.length - 1; i >= 0; i--) {
          const p = state.pipes[i];
          p.x -= 2;
          ctx.fillStyle = '#ff3333';
          ctx.fillRect(p.x, 0, 40, p.top);
          ctx.fillStyle = '#33ff33';
          ctx.fillRect(p.x, canvas.height - p.bottom, 40, p.bottom);

          if (!p.passed && p.x < 80) {
            p.passed = true;
            state.score++;
            setScore(state.score);
          }
          if (80 + 30 > p.x && 80 < p.x + 40 && (state.trainY < p.top || state.trainY + 24 > canvas.height - p.bottom)) {
            state.gameOver = true;
            setGameOver(true);
          }
          if (p.x + 40 < 0) state.pipes.splice(i, 1);
        }
        if (state.trainY > canvas.height - 30 || state.trainY < 0) {
          state.gameOver = true;
          setGameOver(true);
        }
      }

      ctx.font = '24px Arial';
      ctx.fillText(' Romano 🚂', 80, state.trainY + 20);

      if (!state.hasStarted) {
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t.click_to_start || "Kliknij lub użyj Spacji", canvas.width / 2, canvas.height / 2);
      }
      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animationId);
  }, [t.click_to_start]);

  return (
    <div className="game-container">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>{t.game_flappy_title}</h2>
      <p className="game-stat">{t.score} {score}</p>
      <canvas ref={canvasRef} width={400} height={400} className="game-canvas-board" onClick={jump} />
      {gameOver && (
        <div className="game-won" style={{ backgroundColor: '#dc3545' }}>
          <h3>{t.game_over}</h3>
          <button className="play-button" onClick={resetGame}>{t.play_again}</button>
        </div>
      )}
    </div>
  );
};
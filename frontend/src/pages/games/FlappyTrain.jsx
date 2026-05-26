import React, { useState, useEffect, useRef } from 'react';

export default function FlappyTrainGame({ t, onBack }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER
  const [score, setScore] = useState(0);
  const stateRef = useRef({ gameState: 'START', score: 0, trainY: 150, velocity: 0, pipes: [] });

  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resetGameData = () => {
      stateRef.current = {
        gameState: 'PLAYING',
        score: 0,
        trainY: 150,
        velocity: 0,
        pipes: [
          { x: 500, top: 100, bottom: 120, passed: false },
          { x: 750, top: 140, bottom: 100, passed: false }
        ]
      };
      setScore(0);
      setGameState('PLAYING');
    };

    const jump = () => {
      if (stateRef.current.gameState === 'PLAYING') {
        stateRef.current.velocity = -6;
      } else if (stateRef.current.gameState === 'START' || stateRef.current.gameState === 'GAMEOVER') {
        resetGameData();
      }
    };

    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const updateLoop = () => {
      const state = stateRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Tło - tory kolejowe na dole
      ctx.fillStyle = '#1a1a24';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#333344';
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

      if (state.gameState === 'PLAYING') {
        state.velocity += 0.35; // grawitacja
        state.trainY += state.velocity;

        if (state.trainY > canvas.height - 40 || state.trainY < 0) {
          setGameState('GAMEOVER');
        }

        // Aktualizacja i rysowanie przeszkód (semaforów)
        state.pipes.forEach((pipe) => {
          pipe.x -= 2.5;

          // Rysowanie górnego semafora
          ctx.fillStyle = '#444455';
          ctx.fillRect(pipe.x, 0, 40, pipe.top);
          ctx.fillStyle = '#ff3333';
          ctx.beginPath();
          ctx.arc(pipe.x + 20, pipe.top - 15, 6, 0, Math.PI * 2);
          ctx.fill();

          // Rysowanie dolnego semafora
          ctx.fillStyle = '#444455';
          ctx.fillRect(pipe.x, canvas.height - pipe.bottom, 40, pipe.bottom);
          ctx.fillStyle = '#33ff33';
          ctx.beginPath();
          ctx.arc(pipe.x + 20, canvas.height - pipe.bottom + 15, 6, 0, Math.PI * 2);
          ctx.fill();

          // Detekcja kolizji
          if (pipe.x < 80 && pipe.x + 40 > 50) {
            if (state.trainY < pipe.top || state.trainY + 24 > canvas.height - pipe.bottom) {
              setGameState('GAMEOVER');
            }
          }

          // Punktacja
          if (!pipe.passed && pipe.x < 50) {
            pipe.passed = true;
            state.score += 1;
            setScore(state.score);
          }
        });

        // Usuwanie starych i dodawanie nowych semaforów
        if (state.pipes[0] && state.pipes[0].x < -40) {
          state.pipes.shift();
          const top = Math.random() * 120 + 40;
          const bottom = Math.random() * 120 + 40;
          state.pipes.push({ x: canvas.width, top, bottom, passed: false });
        }
      }

      // Rysowanie pociągu (Gracz)
      ctx.font = '24px serif';
      ctx.fillText('🚂', 50, state.trainY + 20);

      if (state.gameState === 'START') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffca';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t.click_to_start || "Naciśnij Spację, aby wystartować", canvas.width / 2, canvas.height / 2);
      } else if (state.gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(139, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t.game_over || "Koniec Gry!", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '16px sans-serif';
        ctx.fillText(t.play_again || "Naciśnij Spację, aby zagrać ponownie", canvas.width / 2, canvas.height / 2 + 20);
      }

      animationId = requestAnimationFrame(updateLoop);
    };

    animationId = requestAnimationFrame(updateLoop);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, t]);

  return (
    <div className="game-container math-game-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2 className="game-title-accent">{t.game_flappy_title || "Flappy Train"}</h2>
      <p className="game-stat">{t.score || "Wynik:"} <span className="stat-highlight">{score}</span></p>
      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={360} 
          style={{ background: '#111', borderRadius: '12px', border: '3px solid #333', maxWidth: '100%', cursor: 'pointer' }}
          onClick={() => {
            if (gameState === 'START' || gameState === 'GAMEOVER') {
              setGameState('PLAYING');
            } else {
              stateRef.current.velocity = -6;
            }
          }}
        />
      </div>
    </div>
  );
}
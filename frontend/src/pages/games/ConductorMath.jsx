import React, { useState, useEffect } from 'react';

export default function ConductorMath({ t, onBack }) {
  const [problem, setProblem] = useState({ a: 0, b: 0, ans: 0 });
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(10);
  const [gameState, setGameState] = useState('PLAYING'); // PLAYING, GAMEOVER

  const generate = () => {
    const a = Math.floor(Math.random() * 12) + 2;
    const b = Math.floor(Math.random() * 10) + 2;
    const ans = a * b;
    const opts = [ans, ans + 2, ans - 2, a * (b + 1)].sort(() => Math.random() - 0.5);
    // Usuwanie duplikatów jeśli powstaną
    const uniqueOpts = [...new Set(opts)];
    while(uniqueOpts.length < 4) {
      uniqueOpts.push(ans + Math.floor(Math.random() * 10) + 3);
    }
    setProblem({ a, b, ans });
    setOptions(uniqueOpts.sort(() => Math.random() - 0.5));
    setTimer(8);
  };

  useEffect(() => {
    generate();
  }, []);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    if (timer <= 0) {
      setGameState('GAMEOVER');
      return;
    }
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, gameState]);

  const handleAnswer = (val) => {
    if (val === problem.ans) {
      setScore(s => s + 1);
      generate();
    } else {
      setTimer(t => Math.max(0, t - 3)); // Kara czasowa
    }
  };

  const restartGame = () => {
    setScore(0);
    setGameState('PLAYING');
    generate();
  };

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>🎫 {t.title || 'Kontrola Biletów'}</h2>
          {gameState === 'PLAYING' && (
            <div className="game-hud-stats">
              <span className="hud-score">🏆 {t.scoreLabel || 'Punkty'}: <strong>{score}</strong></span>
              <span className="hud-timer">⏳ {t.timerLabel || 'Czas'}: <strong>{timer}s</strong></span>
            </div>
          )}
        </div>

        <div className="game-viewport-area">
          {gameState === 'PLAYING' && (
            <div className="math-quiz-container">
              <div className="math-question-box">
                {problem.a} × {problem.b} = ?
              </div>
              <div className="math-options-grid">
                {options.map((opt, idx) => (
                  <button 
                    key={idx} 
                    className="btn-math-option"
                    onClick={() => handleAnswer(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>🛑 {t.timeUpTitle || 'Czas minął'}</h3>
              <p className="game-explanation-text">{t.timeUpText || 'Pasażer uciekł bez skasowanego biletu!'}</p>
              <p className="game-explanation-text">{t.resultText || 'Twój ostateczny wynik:'} <strong>{score}</strong> {t.scoreLabel || 'poprawnych odpowiedzi'}.</p>
              <button className="btn-arcade-play" onClick={restartGame}>{t.retryButton || 'Sprawdź kolejny wagon 🔄'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
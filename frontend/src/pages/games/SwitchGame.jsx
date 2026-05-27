import React, { useState, useEffect } from 'react';
import '../GamesPage.css';

export default function SwitchGame({ t, onBack }) {
  const [switches, setSwitches] = useState([false, false, false, false]);
  const [target, setTarget] = useState([false, false, false, false]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER

  const generateTarget = () => {
    const newTarget = switches.map(() => Math.random() > 0.5);
    // Upewniamy się, że nowa kombinacja nie jest identyczna z obecną
    if (newTarget.every((val, i) => val === switches[i])) {
      newTarget[Math.floor(Math.random() * newTarget.length)] = !newTarget[0];
    }
    setTarget(newTarget);
    // Poziom trudności: czas skraca się wraz ze wzrostem punktów
    setTimeLeft(Math.max(3, 10 - Math.floor(score / 3)));
  };

  const startNewGame = () => {
    setScore(0);
    setSwitches([false, false, false, false]);
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      generateTarget();
    }
  }, [gameState]);

  // Licznik czasu gry
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    if (timeLeft <= 0) {
      setGameState('GAMEOVER');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  const toggleSwitch = (idx) => {
    if (gameState !== 'PLAYING') return;

    const nextSwitches = [...switches];
    nextSwitches[idx] = !nextSwitches[idx];
    setSwitches(nextSwitches);

    // Sprawdzenie czy gracz ustawił poprawną kombinację zwrotnic
    if (nextSwitches.every((val, i) => val === target[i])) {
      setScore((s) => s + 1);
      // Przejście do następnej kombinacji
      const nextTarget = nextSwitches.map(() => Math.random() > 0.5);
      setTarget(nextTarget);
      setTimeLeft(Math.max(3, 10 - Math.floor((score + 1) / 3)));
    }
  };

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>🎛️ {t.game_switch_title || 'Nastawnia Zwrotnic'}</h2>
        </div>

        <div className="game-viewport-area">
          {gameState === 'START' && (
            <div className="game-overlay-screen">
              <h3>Dywizjon Ruchu Kolejowego</h3>
              <p className="game-explanation-text">
                Nadjeżdża pociąg towarowy! Przestawiaj dźwignie zwrotnic tak, aby ich układ (TOR A / TOR B) zgadzał się z zaplanowanym schematem na pulpicie. Pospiesz się!
              </p>
              <button className="btn-arcade-play" onClick={startNewGame}>URUCHOM NASTAWNIĘ 🔌</button>
            </div>
          )}

          {gameState === 'PLAYING' && (
            <>
              {/* Sekcja wzorca (celu) */}
              <div className="chernobyl-panel" style={{ marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>
                  <span>PUNKTY: <span className="green-text">{score}</span></span>
                  <span className={timeLeft <= 3 ? 'blink-red' : ''}>CZAS: <span className="highlight">{timeLeft}s</span></span>
                </div>
                
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#aaa', marginBottom: '5px' }}>WYMAGANY UKŁAD ZWROTNIC:</div>
                <div style={{ display: 'flex', justifyContent: 'space-around', background: '#0b0f12', padding: '10px', borderRadius: '5px' }}>
                  {target.map((val, idx) => (
                    <div key={idx} style={{ color: val ? '#00ffca' : '#ff0055', fontWeight: 'bold' }}>
                      Z{idx + 1}: {val ? 'TOR B' : 'TOR A'}
                    </div>
                  ))}
                </div>
              </div>

              {/* Interaktywne dźwignie */}
              <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: '10px' }}>
                {switches.map((val, idx) => (
                  <div key={idx} style={{ textAlign: 'center' }}>
                    <div style={{ color: '#00ffca', marginBottom: '15px', fontWeight: 'bold', fontSize: '10pt' }}>
                      DŹWIGNIA {idx + 1}
                    </div>
                    <div className="industrial-switch-slot" onClick={() => toggleSwitch(idx)}>
                      <div className={`industrial-lever-shaft ${val ? 'pulled-down' : 'pulled-up'}`}>
                        <div className={`industrial-lever-knob ${val ? 'active-b' : 'active-a'}`} />
                      </div>
                    </div>
                    <div style={{ marginTop: '15px', color: val ? '#00ffca' : '#ff0055', fontWeight: 'bold', fontSize: '11pt' }}>
                      {val ? 'TOR B' : 'TOR A'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="game-overlay-screen game-over-theme" style={{ textAlign: 'center' }}>
              <h3 className="blink-red">💥 KATASTROFA KOLEJOWA!</h3>
              <p className="game-explanation-text">Skład towarowy wypadł z szyn z powodu błędnego lub zbyt późnego ustawienia zwrotnic.</p>
              <p className="game-explanation-text" style={{ fontSize: '1.2rem' }}>Ostateczny wynik: <strong>{score}</strong></p>
              <button className="btn-arcade-play" onClick={startNewGame}>RESETUJ SYGNAŁY 🔄</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
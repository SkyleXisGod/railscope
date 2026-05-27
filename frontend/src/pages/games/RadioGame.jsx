import React, { useState, useEffect } from 'react';

export default function RadioGame({ t, onBack }) {
  const [currentFreq, setCurrentFreq] = useState(90.0);
  const [targetFreq, setTargetFreq] = useState(100.0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameState, setGameState] = useState('idle'); // idle, playing, success, timeout
  const [score, setScore] = useState(0);

  const startNewTransmission = () => {
    const randomFreq = parseFloat((Math.random() * (107.9 - 87.5) + 87.5).toFixed(1));
    setTargetFreq(randomFreq);
    setCurrentFreq(90.0);
    setTimeLeft(12);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) {
      setGameState('timeout');
      return;
    }

    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  // Sprawdzanie czy częstotliwości się pokrywają z tolerancją do 0.1 MHz
  const checkSignal = () => {
    if (Math.abs(currentFreq - targetFreq) < 0.15) {
      setScore(s => s + 1);
      setGameState('success');
    }
  };

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>📻 Radiostacja Interkomu (Strojenie)</h2>
          {gameState === 'playing' && (
            <div className="game-hud-stats">
              <span className="hud-score">📡 Zgrane depesze: <strong>{score}</strong></span>
              <span className="hud-timer">⏳ Okno sygnału: <strong>{timeLeft}s</strong></span>
            </div>
          )}
        </div>

        <div className="game-viewport-area">
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>Radioodbiornik Lokomotywy</h3>
              <p className="game-explanation-text">
                Centrala nadaje pilny komunikat alarmowy na ukrytej częstotliwości. Steruj suwakiem lub przyciskami, aby dopasować parametry fali i wciśnij "ZGRAJ SYGNAŁ", zanim minie czas okna transmisyjnego!
              </p>
              <button className="btn-arcade-play" onClick={startNewTransmission}>SZUKAJ SYGNAŁU 🎙️</button>
            </div>
          )}

          {gameState === 'playing' && (
            <div style={{ padding: '40px 20px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              
              {/* Wyświetlacz Retro */}
              <div style={{ background: '#090d16', padding: '20px', borderRadius: '10px', border: '1px solid #34495e', textAlign: 'center' }}>
                <div style={{ color: '#e67e22', fontSize: '0.85rem', letterSpacing: '2px' }}>CZĘSTOTLIWOŚĆ DOCELOWA CENTRALI</div>
                <div style={{ fontSize: '2.5rem', color: '#ff9f43', fontFamily: 'monospace', fontWeight: 'bold', margin: '5px 0' }}>
                  {targetFreq.toFixed(1)} <span style={{ fontSize: '1rem' }}>MHz</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Różnica szumów: {Math.abs(currentFreq - targetFreq).toFixed(1)} MHz
                </div>
              </div>

              {/* Kontrolery */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', color: 'var(--primary-color)', fontFamily: 'monospace', marginBottom: '10px' }}>
                  🎛️ TWOJE PASMO: <strong>{currentFreq.toFixed(1)} MHz</strong>
                </div>
                <input 
                  type="range" 
                  min="87.5" 
                  max="107.9" 
                  step="0.1"
                  value={currentFreq}
                  onChange={(e) => setCurrentFreq(parseFloat(e.target.value))}
                  style={{ width: '100%', maxWidth: '400px', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                />
              </div>

              <button className="btn-arcade-play" onClick={checkSignal} style={{ width: '200px', margin: '0 auto' }}>
                ZGRAJ SYGNAŁ 📻
              </button>
            </div>
          )}

          {gameState === 'success' && (
            <div className="game-overlay-screen success-theme">
              <h3>📻 DEPESZA ODEBRANA!</h3>
              <p className="game-explanation-text">Połączenie nawiązane pomyślnie. Czystość kanału idealna.</p>
              <button className="btn-arcade-play" onClick={startNewTransmission}>Następna Częstotliwość 🔄</button>
            </div>
          )}

          {gameState === 'timeout' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>🛑 SZUMY I STATYKA...</h3>
              <p className="game-explanation-text">Okno nadawcze zamknęło się. Utraciłeś kontakt z bazą.</p>
              <button className="btn-arcade-play" onClick={startNewTransmission}>Szukaj Od Nowa 🔄</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
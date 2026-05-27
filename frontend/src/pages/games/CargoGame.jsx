import React, { useState, useEffect } from 'react';
import '../GamesPage.css';

const LOGISTICS_TYPES = [
  { id: 'wood', emoji: '🪵', label: 'TARTAK (DREWNO)' },
  { id: 'coal', emoji: '💼', label: 'MINERALNY (WĘGIEL / RUDA)' },
  { id: 'chem', emoji: '🧪', label: 'CYSTERNA (CHEMIA / FLUID)' }
];

export default function CargoGame({ t, onBack }) {
  const [gameState, setGameState] = useState('idle'); // idle, running, crashed
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0); // Maksymalnie 3 błędy
  const [currentCargo, setCurrentCargo] = useState(null);
  const [timeLeft, setTimeLeft] = useState(100);

  const drawNextCargo = () => {
    const randomItem = LOGISTICS_TYPES[Math.floor(Math.random() * LOGISTICS_TYPES.length)];
    setCurrentCargo(randomItem);
    setTimeLeft(100);
  };

  const startLoader = () => {
    setScore(0);
    setErrors(0);
    setGameState('running');
    drawNextCargo();
  };

  // Interwał czasu paska ładowania
  useEffect(() => {
    if (gameState !== 'running') return;

    const speedFactor = 1 + Math.floor(score / 5) * 0.15;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Koniec czasu traktowany jest jako błąd kierowania ładunku
          handleFailure();
          return 100;
        }
        return prev - (1.5 * speedFactor);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, score, currentCargo]);

  const handleFailure = () => {
    setErrors((err) => {
      const nextErr = err + 1;
      if (nextErr >= 3) {
        setGameState('crashed');
      }
      return nextErr;
    });
    drawNextCargo();
  };

  const executeSort = (typeId) => {
    if (gameState !== 'running' || !currentCargo) return;

    if (typeId === currentCargo.id) {
      setScore((s) => s + 1);
      drawNextCargo();
    } else {
      handleFailure();
    }
  };

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>
      
      <div className="game-main-card">
        <div className="game-top-header">
          <h2>📦 {t.game_cargo_title || 'DYSPOZYCJA TOWAROWA'}</h2>
          {gameState === 'running' && (
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              <div>ODPRAWIONO: <span style={{ color: '#00ffca' }}>{score}</span></div>
              <div style={{ color: '#ff4757' }}>BŁĘDY: {errors}/3</div>
            </div>
          )}
        </div>

        <div className="game-viewport-area">
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>📋 KIEROWANIE POTOKIEM ŁADUNKÓW</h3>
              <p className="game-explanation-text">
                Wykrywaj nadjeżdżające wagony towarowe i przydzielaj je na odpowiednie tory odbiorcze (Tartak, Kopalnia, Zakład Chemiczny). Zwłoka lub błędne przekierowanie spowoduje przeciążenie stacji rozrządowej.
              </p>
              <button className="btn-arcade-play" onClick={startLoader}>ROZPOCZNIJ PRZEKIEROWANIE</button>
            </div>
          )}

          {gameState === 'running' && currentCargo && (
            <div style={{ width: '100%', height: '100%', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
              
              {/* Pasek pozostałego czasu na reakcję */}
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px', color: '#aaa' }}>
                  <span>CZAS NA ZMIANĘ ZWROTNICY SEKTORA</span>
                  <span>{Math.ceil(timeLeft)}%</span>
                </div>
                <div style={{ background: '#1c2430', height: '10px', borderRadius: '5px', overflow: 'hidden', border: '1px solid #2c3e50' }}>
                  <div style={{ width: `${timeLeft}%`, height: '100%', background: '#3498db', transition: 'width 0.1s linear' }} />
                </div>
              </div>

              {/* Centralny punkt wyświetlania kontenera towarowego */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ background: '#141b24', border: '1px solid #3498db', borderRadius: '8px', padding: '20px 40px', textAlign: 'center', boxShadow: 'inset 0 0 15px rgba(52, 152, 219, 0.2)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px', animation: 'pulse 1s infinite alternate' }}>{currentCargo.emoji}</div>
                  <div style={{ fontSize: '14px', letterSpacing: '1px', fontWeight: 'bold', color: '#fff' }}>{currentCargo.label}</div>
                </div>
              </div>

              {/* Przyciski operacyjne */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '0' }}>
                {LOGISTICS_TYPES.map((type) => (
                  <button
                    key={type.id}
                    className="btn-arcade-play"
                    style={{
                      margin: 0,
                      background: '#1f2937',
                      border: '1px solid #3498db',
                      padding: '12px',
                      fontSize: '13px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                    onClick={() => executeSort(type.id)}
                  >
                    <span style={{ fontSize: '18px' }}>{type.emoji}</span>
                    <span style={{ fontWeight: '600' }}>{type.label}</span>
                  </button>
                ))}
              </div>

            </div>
          )}

          {gameState === 'crashed' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>💥 PARALIŻ LOGISTYCZNY!</h3>
              <p className="game-explanation-text">Dopuściłeś do przekroczenia limitu 3 błędów odprawy. Tory rozrządowe zostały zablokowane.</p>
              <p className="game-explanation-text">Odprawiono bezpiecznie: <strong>{score} składów towarowych</strong></p>
              <button className="btn-arcade-play" onClick={startLoader}>UDROŻNIJ WĘZEŁ 🔄</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
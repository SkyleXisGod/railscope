import React, { useState, useEffect } from 'react';
import '../GamesPage.css';

export default function SpeedCheckGame({ t, onBack }) {
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [targetSpeed, setTargetSpeed] = useState(40);
  const [gameState, setGameState] = useState('idle'); // idle, running, success, crashed
  const [score, setScore] = useState(0);
  const [distanceLeft, setDistanceLeft] = useState(100);

  const startTest = () => {
    // Losowanie ograniczenia prędkości od 30 do 70 km/h
    const randomLimit = Math.floor(Math.random() * 5 * 10) + 30;
    setTargetSpeed(randomLimit);
    // Pociąg startuje rozpędzony powyżej ograniczenia
    setCurrentSpeed(randomLimit + Math.floor(Math.random() * 30) + 25);
    setDistanceLeft(100);
    setGameState('running');
  };

  useEffect(() => {
    if (gameState !== 'running') return;

    const interval = setInterval(() => {
      // Dystans do fotoradaru maleje
      setDistanceLeft(d => {
        if (d <= 0) {
          clearInterval(interval);
          checkFinalSpeed();
          return 0;
        }
        return d - 2.5;
      });

      // Bez hamowania prędkość pociągu delikatnie waha się lub rośnie z góry
      setCurrentSpeed(s => Math.max(10, s + (Math.random() * 2 - 0.8)));
    }, 60);

    return () => clearInterval(interval);
  }, [gameState, currentSpeed]);

  // Obsługa klawiatury (Spacja hamuje)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        applyBrake();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const applyBrake = () => {
    if (gameState !== 'running') return;
    // Kliknięcie/Spacja zbija prędkość w dół
    setCurrentSpeed(s => Math.max(0, s - 8));
  };

  const checkFinalSpeed = () => {
    // Tolerancja błędu: prędkość musi być mniejsza lub równa ograniczeniu, ale nie mniejsza niż limit - 15 (zbyt wolna jazda blokuje szlak)
    if (currentSpeed <= targetSpeed && currentSpeed >= targetSpeed - 15) {
      setScore(s => s + 1);
      setGameState('success');
    } else {
      setGameState('crashed');
    }
  };

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>📸 WERYFIKACJA PRĘDKOŚCI TRASY</h2>
          <div>ZALICZONE PUNKTY KONTROLNE: <span style={{ color: '#00ffca', fontWeight: 'bold' }}>{score}</span></div>
        </div>

        <div className="game-viewport-area">
          
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>📉 Kontrola Prędkości Drogowej</h3>
              <p className="game-explanation-text">
                Zbliżasz się do punktu pomiarowego! Dostosuj prędkość składu tak, aby nie przekroczyć narzuconego limitu. Nie jedź też zbyt wolno, by nie tamować ruchu.
              </p>
              <button className="btn-arcade-play" onClick={startTest}>ROZPOCZNIJ ZBLIŻENIE 🚇</button>
            </div>
          )}

          {gameState === 'running' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '15px', boxSizing: 'border-box' }}>
              
              {/* Pasek dystansu do fotoradaru */}
              <div style={{ width: '100%', maxWidth: '320px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                  <span>DYSTANS DO RADARU:</span>
                  <span style={{ color: '#ffa502', fontWeight: 'bold' }}>{Math.round(distanceLeft)} m</span>
                </div>
                <div style={{ height: '6px', background: '#141b24', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${distanceLeft}%`, height: '100%', background: '#ffa502', transition: 'width 0.06s linear' }} />
                </div>
              </div>

              {/* Wyświetlacz prędkości maszynisty */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', justifyContent: 'center', width: '100%' }}>
                <div style={{ background: '#11161b', border: '2px solid #ff4757', padding: '10px 15px', borderRadius: '8px', textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '10px', color: '#ff4757' }}>OGRANICZENIE</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{targetSpeed}</div>
                  <div style={{ fontSize: '9px', color: '#777' }}>km/h</div>
                </div>

                <div style={{ background: '#11161b', border: `2px solid ${currentSpeed > targetSpeed ? '#ff4757' : '#00ffca'}`, padding: '10px 15px', borderRadius: '8px', textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '10px', color: '#aaa' }}>TWOJA PRĘDKOŚĆ</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentSpeed > targetSpeed ? '#ff4757' : '#00ffca' }}>{Math.round(currentSpeed)}</div>
                  <div style={{ fontSize: '9px', color: '#777' }}>km/h</div>
                </div>
              </div>

              <button 
                className="btn-arcade-play" 
                onClick={applyBrake} 
                style={{ width: '220px', background: '#c0392b', border: '1px solid #ff4757' }}
              >
                HAMUJ AWARYJNIE 🚨
              </button>
              <div style={{ fontSize: '10px', color: '#556270', marginTop: '10px' }}>Wskazówka: Możesz też używać [SPACJI] na klawiaturze!</div>

            </div>
          )}

          {gameState === 'success' && (
            <div className="game-overlay-screen success-theme">
              <h3>🟢 PRĘDKOŚĆ PRAWIDŁOWA</h3>
              <p className="game-explanation-text">Minąłeś radar z idealną prędkością. System zarejestrował prawidłowy przejazd.</p>
              <button className="btn-arcade-play" onClick={startTest}>NASTĘPNY SEKTOR 🔄</button>
            </div>
          )}

          {gameState === 'crashed' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>🚨 MANDAT I BLOKADA TRASY</h3>
              <p className="game-explanation-text">
                {currentSpeed > targetSpeed 
                  ? `Przekroczyłeś dozwoloną prędkość o ${Math.round(currentSpeed - targetSpeed)} km/h! System automatycznie zablokował skład.` 
                  : 'Zwolniłeś zbyt mocno! Skład z tyłu musiał gwałtownie hamować, wywołując alarm linii.'}
              </p>
              <p className="game-explanation-text">Punkty karne na koncie. Zaliczone radary: <strong>{score}</strong></p>
              <button className="btn-arcade-play" onClick={() => { setScore(0); startTest(); }}>PONÓW JAZDĘ 🔄</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import '../GamesPage.css';

export default function CargoWeightGame({ t, onBack }) {
  const [wagons, setWagons] = useState([0, 0, 0]);
  const [activeWagon, setActiveWagon] = useState(0); // Który wagon jest aktualnie napełniany
  const [targetWeight, setTargetWeight] = useState(80); // Idealna granica
  const [gameState, setGameState] = useState('idle'); // idle, running, success, crashed
  const [score, setScore] = useState(0);

  const startLoading = () => {
    setWagons([0, 0, 0]);
    setActiveWagon(0);
    // Dynamiczny cel wagi dla trudności (między 70 a 90)
    setTargetWeight(Math.floor(Math.random() * 20) + 70);
    setGameState('running');
  };

  useEffect(() => {
    if (gameState !== 'running') return;
    if (activeWagon > 2) {
      evaluateCargo();
      return;
    }

    // Napełnianie aktywnego wagonu surowcem
    const interval = setInterval(() => {
      setWagons(prev => {
        const next = [...prev];
        next[activeWagon] = next[activeWagon] + 3;
        
        // Automatyczny krach, jeśli gracz totalnie zapomni zatrzymać i przeleje wagon
        if (next[activeWagon] >= 110) {
          clearInterval(interval);
          setGameState('crashed');
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, activeWagon]);

  const lockWagon = () => {
    if (gameState !== 'running') return;
    // Przejdź do ładowania kolejnego wagonu
    setActiveWagon(curr => curr + 1);
  };

  const evaluateCargo = () => {
    // Sprawdzenie czy wszystkie 3 wagony mieszczą się w przedziale tolerancji (targetWeight - 12 do targetWeight)
    const allValid = wagons.every(w => w <= targetWeight && w >= (targetWeight - 12));
    
    if (allValid) {
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
          <h2>⚖️ {t.title || 'TERMINAL ZAŁADUNKU MASOWEGO'}</h2>
          <div>{t.scoreLabel || 'SFORMOWANE SKŁADY'}: <span style={{ color: '#00ffca', fontWeight: 'bold' }}>{score}</span></div>
        </div>

        <div className="game-viewport-area">
          
          {gameState === 'idle' && (
            <div className="game-overlay-screen">
              <h3>{t.introTitle || '🌾 Dozowanie Tonażu Składu'}</h3>
              <p className="game-explanation-text">
                {t.introText || 'Napełnij po kolei 3 wagony towarowe. Zatrzymaj zsyp przyciskiem blokady, gdy poziom surowca znajdzie się jak najbliżej linii kreskowanej. Przeładowanie uszkodzi osie!'}
              </p>
              <button className="btn-arcade-play" onClick={startLoading}>{t.startButton || 'OTWÓRZ ZSYPY 📑'}</button>
            </div>
          )}

          {gameState === 'running' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '15px', boxSizing: 'border-box' }}>
              
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '20px', letterSpacing: '1px' }}>
                {t.loadingStatus || 'STATUS'}: {activeWagon < 3 ? `${t.lockButton || 'ŁADOWANIE WAGONU NR'} ${activeWagon + 1}...` : 'ANALIZA OSI...'}
              </div>

              {/* Wizualizacja 3 wagonów obok siebie */}
              <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '340px', height: '120px', alignItems: 'flex-end', background: '#11161b', padding: '15px', borderRadius: '8px', border: '1px solid #2c3e50', marginBottom: '25px', position: 'relative' }}>
                
                {/* Przerywana linia docelowej wagi */}
                <div style={{ position: 'absolute', bottom: `${targetWeight}%`, left: 0, width: '100%', borderTop: '2px dashed #00ffca', zIndex: 5 }}>
                  <span style={{ fontSize: '8px', color: '#00ffca', background: '#11161b', padding: '0 4px', position: 'absolute', top: '-12px', right: '10px' }}>{t.axleLimitLabel || 'Axle limit'}</span>
                </div>

                {wagons.map((weight, idx) => {
                  const isCurrent = activeWagon === idx;
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        flex: 1, 
                        height: '100%', 
                        background: '#1a232d', 
                        border: `2px solid ${isCurrent ? '#3498db' : '#2c3e50'}`, 
                        borderRadius: '4px', 
                        position: 'relative', 
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'flex-end'
                      }}
                    >
                      {/* Słupkowa zawartość surowca w wagonie */}
                      <div style={{ width: '100%', height: `${weight}%`, background: weight > targetWeight ? '#ff4757' : '#ffa502', transition: 'height 0.05s ease' }} />
                      <div style={{ position: 'absolute', width: '100%', textCenter: 'center', bottom: '5px', left: 0, textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: '#fff', zIndex: 6 }}>
                        W{idx + 1}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                className="btn-arcade-play" 
                onClick={lockWagon}
                disabled={activeWagon > 2}
                style={{ width: '220px' }}
              >
                {t.lockButton || '🔒 ODETNIJ ZSYP WAGONU'}
              </button>

            </div>
          )}

          {gameState === 'success' && (
            <div className="game-overlay-screen success-theme">
              <h3>🎉 {t.successTitle || 'WYWAŻENIE OPTYMALNE!'}</h3>
              <p className="game-explanation-text">{t.successText || 'Wszystkie sekcje załadowane równomiernie. Nacisk na szyny w normie.'}</p>
              <button className="btn-arcade-play" onClick={startLoading}>{t.nextButton || 'KOLEJNY SKŁAD 🔄'}</button>
            </div>
          )}

          {gameState === 'crashed' && (
            <div className="game-overlay-screen game-over-theme">
              <h3>🛑 {t.crashTitle || 'USZKODZENIE RESORÓW / SKOS'}</h3>
              <p className="game-explanation-text">
                {t.crashText || 'Wprowadziłeś pociąg w stan zagrożenia. Jeden z wagonów został przeładowany lub niedoładowany, co grozi wykolejeniem na zakręcie.'}
              </p>
              <p className="game-explanation-text">{t.scoreText || 'Skutecznie odprawione pociągi:'} <strong>{score}</strong></p>
              <button className="btn-arcade-play" onClick={() => { setScore(0); startLoading(); }}>{t.resetButton || 'WYCZYŚĆ TERMINAL 🔄'}</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
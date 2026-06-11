import React, { useState, useEffect } from 'react';
import '../GamesPage.css';

export default function TrainClicker({ t, onBack }) {
  const [pressure, setPressure] = useState(0);
  const [compressors, setCompressors] = useState(0);

  // Automatyczny przyrost ciśnienia z zakupionych kompresorów pomocniczych
  useEffect(() => {
    if (compressors === 0) return;
    const interval = setInterval(() => {
      setPressure(p => p + compressors * 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [compressors]);

  const handleManualPump = () => {
    setPressure(p => p + 1);
  };

  const buyCompressor = () => {
    const cost = 15 + compressors * 10;
    if (pressure >= cost) {
      setPressure(p => p - cost);
      setCompressors(c => c + 1);
    }
  };

  const nextCost = 15 + compressors * 10;

  return (
    <div className="game-card-wrapper">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back || 'Powrót'}</button>

      <div className="game-main-card">
        <div className="game-top-header">
          <h2>⚙️ {t.title || 'Train Clicker'}</h2>
          <div>{t.systemLabel || 'System'}: <span style={{ color: compressors > 0 ? '#00ffca' : '#aaa' }}>{compressors > 0 ? t.automaticLabel || 'Automatic' : t.manualLabel || 'Manual'}</span></div>
        </div>

        <div className="game-viewport-area">
          <div style={{ width: '100%', height: '100%', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            
            {/* Przemysłowy wskaźnik zgromadzonego ciśnienia */}
            <div style={{ background: '#141b24', border: '1px solid #2c3e50', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#aaa', letterSpacing: '1px' }}>{t.pressureLabel || 'Stored pressure'}</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00ffca', margin: '5px 0', fontFamily: 'monospace' }}>
                {pressure} <span style={{ fontSize: '16px', color: '#fff' }}>BAR</span>
              </div>
              <div style={{ fontSize: '11px', color: '#778ca3' }}>{t.activeCompressorsText || 'Active compressors'}: +{compressors} BAR/s</div>
            </div>

            {/* Centralny wielki przycisk tłoczni */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <button 
                className="btn-arcade-play"
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  margin: 0,
                  background: '#1c2430',
                  border: '4px dashed #00ffca',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 0 15px rgba(0, 255, 202, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={handleManualPump}
              >
                <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏋️‍♂️</span>
                {t.pumpButton || 'Pump'}
              </button>
            </div>

            {/* Sekcja modernizacji systemów automatycznych */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button
                className="btn-arcade-play"
                disabled={pressure < nextCost}
                style={{
                  margin: 0,
                  padding: '12px',
                  background: pressure >= nextCost ? '#2c3e50' : '#141b24',
                  border: `1px solid ${pressure >= nextCost ? '#00ffca' : '#2c3e50'}`,
                  opacity: pressure >= nextCost ? 1 : 0.5,
                  cursor: pressure >= nextCost ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px'
                }}
                onClick={buyCompressor}
              >
                <span>🚀 {t.buyButton || 'Install supporting compressor (+1 BAR/s)'}</span>
                <span style={{ fontWeight: 'bold', color: '#00ffca' }}>{nextCost} BAR</span>
              </button>
              <div style={{ fontSize: '10px', color: '#556270', textAlign: 'center', marginTop: '2px' }}>
                {t.activeCompressorsText || 'Active compressors'}: {compressors}.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
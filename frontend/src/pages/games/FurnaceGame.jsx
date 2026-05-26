import React, { useState, useEffect } from 'react';
export default function FurnaceGame({ t, onBack }) {
  const [pressure, setPressure] = useState(50);
  const [temp, setTemp] = useState(400);
  const [coal, setCoal] = useState(10);
  const [status, setStatus] = useState('STABILNY');
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (status === 'WYBUCH' || status === 'ZIMNY') return;
    const timer = setInterval(() => {
      setPressure(p => {
        const nextP = p - 2;
        if (nextP <= 0) { setStatus('ZIMNY'); return 0; }
        if (nextP > 85) setStatus('KRYTYCZNY');
        else if (nextP > 0 && nextP <= 85) setStatus('STABILNY');
        return nextP;
      });
      setTemp(t => Math.max(20, t - 15));
      setScore(s => s + 10);
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const throwCoal = () => {
    if (status === 'WYBUCH' || status === 'ZIMNY' || coal <= 0) return;
    setCoal(c => c - 1);
    setPressure(p => {
      const nextP = p + 15;
      if (nextP >= 100) setStatus('WYBUCH');
      return nextP;
    });
    setTemp(t => Math.min(1200, t + 150));
  };

  const addCoalSupply = () => {
    if (status !== 'WYBUCH' && status !== 'ZIMNY') setCoal(c => c + 5);
  };

  return (
    <div className="game-container furnace-theme">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2 className="chernobyl-title">KONTROLA KOTŁA T-14</h2>
      {status === 'WYBUCH' ? (
        <div className="chernobyl-boom">
          <h1>☢️ KATASTROFA ☢️</h1>
          <p>Kocioł rozerwany. Ciśnienie przekroczyło limit.</p>
          <button className="play-button-mini" onClick={() => { setPressure(50); setTemp(400); setCoal(10); setStatus('STABILNY'); setScore(0); }}>RESET SYSTEMU</button>
        </div>
      ) : status === 'ZIMNY' ? (
        <div className="chernobyl-cold">
          <h1>❄️ WYGASZENIE ❄️</h1>
          <p>Ogień zgasł. Pociąg zatrzymał się.</p>
          <button className="play-button-mini" onClick={() => { setPressure(50); setTemp(400); setCoal(10); setStatus('STABILNY'); setScore(0); }}>ODPAL NA NOWO</button>
        </div>
      ) : (
        <div className="chernobyl-panel">
          <div className="metrics">
            <div className={`meter ${pressure > 80 ? 'danger' : ''}`}>
              <label>CIŚNIENIE (PSI)</label>
              <div className="bar-bg"><div className="bar-fill" style={{ width: `${pressure}%`, backgroundColor: pressure > 80 ? '#ff0000' : '#00ffca' }}></div></div>
              <span>{pressure} / 100</span>
            </div>
            <div className="meter">
              <label>TEMPERATURA (°C)</label>
              <div className="bar-bg"><div className="bar-fill" style={{ width: `${(temp/1200)*100}%`, backgroundColor: temp > 900 ? '#ff9900' : '#00ffca' }}></div></div>
              <span>{temp}°C</span>
            </div>
          </div>
          <div className="status-display">
            <p>STATUS SYSTEMU: <span className={status === 'KRYTYCZNY' ? 'blink-red' : 'green-text'}>{status}</span></p>
            <p>CZAS JAZDY: {score} s</p>
            <p>ZAPAS WĘGLA: <b>{coal}</b> T</p>
          </div>
          <div className="furnace-controls">
            <button className="coal-btn" onClick={throwCoal}>🔥 DORZUĆ WĘGLA (+15 PSI)</button>
            <button className="supply-btn" onClick={addCoalSupply}>📦 ZAMÓW WĘGIEL (+5)</button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
export default function RadarGame({ t, onBack }) {
  const [blips, setBlips] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameOver) return;
    const spawnInterval = setInterval(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 140; // close to edge of 300px circle (150px rad)
      setBlips(prev => [...prev, { id: Date.now(), x: Math.cos(angle)*radius + 145, y: Math.sin(angle)*radius + 145, distance: radius }]);
    }, 1500);

    const moveInterval = setInterval(() => {
      setBlips(prev => {
        let anyCrash = false;
        const newBlips = prev.map(b => {
          const newDist = b.distance - 5;
          if (newDist <= 10) anyCrash = true;
          const ratio = newDist / b.distance;
          return { ...b, x: 145 + (b.x - 145)*ratio, y: 145 + (b.y - 145)*ratio, distance: newDist };
        });
        if (anyCrash) setGameOver(true);
        return newBlips;
      });
    }, 200);

    return () => { clearInterval(spawnInterval); clearInterval(moveInterval); };
  }, [gameOver]);

  const clickBlip = (id) => {
    setBlips(prev => prev.filter(b => b.id !== id));
    setScore(s => s + 10);
  };

  return (
    <div className="game-container radar-theme">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2 style={{color: '#00ff00', fontFamily: 'monospace'}}>SYSTEM RADAROWY v1.0</h2>
      <p style={{color: '#00ff00'}}>Zlikwiduj nierozpoznane sygnały, zanim dotrą do centrum! Punkty: {score}</p>
      
      {gameOver ? (
        <div style={{color:'red'}}>
          <h2>KOLIZJA! Węzeł zniszczony.</h2>
          <button className="play-button" onClick={() => { setBlips([]); setScore(0); setGameOver(false); }}>RESTART SYSTEMU</button>
        </div>
      ) : (
        <div className="radar-screen">
          <div className="radar-sweep"></div>
          {blips.map(b => (
            <div key={b.id} className="radar-blip" style={{ left: b.x, top: b.y }} onClick={() => clickBlip(b.id)}></div>
          ))}
        </div>
      )}
    </div>
  );
}

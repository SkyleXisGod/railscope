import React, { useState, useEffect, useRef } from 'react';
import '../GamesPage.css';

const GRAVITY = 6;
const JUMP = -50;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_SPEED = 5;

export default function FlappyTrain({ t, onBack }) {
  const [trainPos, setTrainPos] = useState(250);
  const [obstacles, setObstacles] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    let timeId;
    if (gameStarted && !gameOver) {
      timeId = setInterval(() => {
        // Grawitacja
        setTrainPos(pos => {
          const newPos = pos + GRAVITY;
          if (newPos > 450 || newPos < 0) {
            setGameOver(true);
            return pos;
          }
          return newPos;
        });

        // Przeszkody
        setObstacles(obs => {
          let newObs = obs.map(ob => ({ ...ob, left: ob.left - OBSTACLE_SPEED }));
          if (newObs.length > 0 && newObs[0].left < -OBSTACLE_WIDTH) {
            newObs.shift();
            setScore(s => s + 1);
          }
          if (newObs.length === 0 || newObs[newObs.length - 1].left < 300) {
            const height = Math.floor(Math.random() * 200) + 50;
            newObs.push({ left: 600, height });
          }
          return newObs;
        });
      }, 30);
    }
    return () => clearInterval(timeId);
  }, [gameStarted, gameOver]);

  // Detekcja kolizji
  useEffect(() => {
    if (!gameOver) {
      obstacles.forEach(ob => {
        const trainRight = 100 + 40; 
        const trainBottom = trainPos + 40;
        const obRight = ob.left + OBSTACLE_WIDTH;
        
        const hitTop = trainPos < ob.height;
        const hitBottom = trainBottom > ob.height + 150; 
        
        if (ob.left < trainRight && obRight > 100 && (hitTop || hitBottom)) {
          setGameOver(true);
        }
      });
    }
  }, [trainPos, obstacles, gameOver]);

  const jump = () => {
    if (!gameStarted) {
      setGameStarted(true);
      setTrainPos(250);
      setObstacles([]);
      setScore(0);
      setGameOver(false);
    } else if (!gameOver) {
      setTrainPos(pos => Math.max(0, pos + JUMP));
    }
  };

  return (
    <div className="game-container flappy-theme" onClick={jump}>
      <button className="back-button" onClick={(e) => { e.stopPropagation(); onBack(); }}>&larr; {t.btn_back}</button>
      <h2>{t.game_flappy_title}</h2>
      <p>{t.score} {score}</p>
      
      <div className="flappy-area">
        {!gameStarted && !gameOver && <div className="flappy-msg">{t.click_to_start}</div>}
        {gameOver && (
          <div className="flappy-msg over">
            <h3>{t.game_over}</h3>
            <button className="play-button" onClick={(e) => { e.stopPropagation(); setGameStarted(false); setGameOver(false); setScore(0); setTrainPos(250); setObstacles([]); }}>{t.play_again}</button>
          </div>
        )}
        <div className="flappy-train" style={{ top: trainPos }}>🚂</div>
        {obstacles.map((ob, i) => (
          <React.Fragment key={i}>
            <div className="flappy-pipe top" style={{ left: ob.left, height: ob.height, width: OBSTACLE_WIDTH }}></div>
            <div className="flappy-pipe bottom" style={{ left: ob.left, top: ob.height + 150, bottom: 0, width: OBSTACLE_WIDTH }}></div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
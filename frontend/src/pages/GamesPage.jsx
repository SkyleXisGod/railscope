import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { translations } from "./constants/translations";
import './GamesPage.css';

const GamesPage = () => {
  const { user } = useAuth();
  const lang = user?.settings?.language || 'PL';
  const t = translations[lang].games;

  const [activeGame, setActiveGame] = useState(null);

  // Fallbacki dla brakujących kluczy w starych plikach tłumaczeń
  const text = {
    games_title: t?.games_title || "Strefa Gier RailScope 🎮",
    games_subtitle: t?.games_subtitle || "Wybierz maszynę i ruszaj do zabawy!",
    btn_back: t?.btn_back || "Powrót",
    btn_play: t?.btn_play || "Graj",
    moves: t?.moves || "Ruchy:",
    congratulations: t?.congratulations || "Gratulacje! Wygrałeś! 🎉",
    play_again: "Zagraj ponownie",
    score: "Wynik:",
    game_over: "Koniec Gry!",
    level: "Poziom:",
    cash: "Fundusze:",
    speed: "Prędkość:"
  };

  const gamesList = [
    { id: 'memory', icon: '🚂', title: t?.game_memory_title || "Kolejowe Memory", desc: t?.game_memory_desc || "Znajdź pary takich samych pociągów." },
    { id: 'flappy', icon: '🚃', title: t?.game_flappy_title || "Flappy Train", desc: t?.game_flappy_desc || "Leć pociągiem między semaforami! Spacja lub kliknięcie steruje." },
    { id: 'snake', icon: '🐍', title: t?.game_snake_title || "Kolejowy Snake", desc: t?.game_snake_desc || "Zbieraj pasażerów na torowisku. Nie uderz we własne wagony!" },
    { id: 'simon', icon: '🚦', title: t?.game_simon_title || "Cyfrowe Semafory", desc: t?.game_simon_desc || "Powtórz sekwencję błysków kolejowych świateł sygnalizacyjnych." },
    { id: 'catcher', icon: '🪣', title: t?.game_catcher_title || "Katastrofa w Zajezdni", desc: t?.game_catcher_desc || "Spadają odczepione wagony! Łap je lokomotywą sterując myszką/palcem." },
    { id: 'clicker', icon: '💰', title: t?.game_clicker_title || "Kolejowy potentat", desc: t?.game_clicker_desc || "Klikaj w lokomotywę, zarabiaj i kupuj automatyczne pociągi towarowe." },
    { id: 'math', icon: '🎫', title: t?.game_math_title || "Szybki Konduktor", desc: t?.game_math_desc || "Sprawdź bilety! Rozwiąż jak najwięcej zadań matematycznych przed końcem czasu." },
    { id: 'maze', icon: '🗺️', title: t?.game_maze_title || "Zagubiony Pociąg", desc: t?.game_maze_desc || "Użyj strzałek, aby przeprowadzić pociąg przez ciasny labirynt zwrotnic do stacji." },
    { id: 'signal', icon: '🚥', title: t?.game_signal_title || "Sygnalizacja", desc: t?.game_signal_desc || "Sygnalizowanie pociągowi gdzie ma jechać!" },
    { id: 'brake', icon: '🛑', title: t?.game_brake_title || "Hamulec", desc: t?.game_brake_desc || "Zatrzymaj pociąg w razie potrzeby!" },
    { id: 'coupler', icon: '🔗', title: t?.game_coupler_title || "Sprzęganie", desc: t?.game_coupler_desc || "Połącz wagony w zgrupowane pociągi!" },
    { id: 'switch', icon: '🔄', title: t?.game_switch_title || "Zwrotnica", desc: t?.game_switch_desc || "Przełącz tor na którym jechał pociąg!" },
    { id: 'radio', icon: '📡', title: t?.game_radio_title || "Radiostacja", desc: t?.game_radio_desc || "Komunikuj się z kierownikiem stacji!" },
    { id: 'bridge', icon: '🌉', title: t?.game_bridge_title || "Most", desc: t?.game_bridge_desc || "Przejdź przez most i kontynuuj podróż!" },
    { id: 'radar', icon: '📡', title: t?.game_radar_title || "Radar", desc: t?.game_radar_desc || "Śledź ruch pociągów na mapie!" },
    { id: 'maintenance', icon: '🔧', title: t?.game_maintenance_title || "Serwis", desc: t?.game_maintenance_desc || "Utrzymanie pociągów w dobrym stanie!" },
    { id: 'cargo', icon: '🏗️', title: t?.game_cargo_title || "Załadunek", desc: t?.game_cargo_desc || "Załaduj towar na pociąg!" },
    { id: 'furnace', icon: '🔥', title: t?.game_furnace_title || "Palenisko", desc: t?.game_furnace_desc || "Załaduj paliwo na lokomotywę!" },
  ];

  const renderGame = () => {
    switch (activeGame) {
      case 'memory': return <MemoryGame t={text} onBack={() => setActiveGame(null)} />;
      case 'flappy': return <FlappyTrain t={text} onBack={() => setActiveGame(null)} />;
      case 'snake': return <SnakeGame t={text} onBack={() => setActiveGame(null)} />;
      case 'simon': return <SimonSignals t={text} onBack={() => setActiveGame(null)} />;
      case 'catcher': return <WagonCatcher t={text} onBack={() => setActiveGame(null)} />;
      case 'clicker': return <TrainClicker t={text} onBack={() => setActiveGame(null)} />;
      case 'math': return <ConductorMath t={text} onBack={() => setActiveGame(null)} />;
      case 'maze': return <TrainMaze t={text} onBack={() => setActiveGame(null)} />;
      case 'signal': return <SignalGame t={text} onBack={() => setActiveGame(null)} />;
      case 'brake': return <BrakeGame t={text} onBack={() => setActiveGame(null)} />;
      case 'coupler': return <CouplerGame t={text} onBack={() => setActiveGame(null)} />;
      case 'switch': return <SwitchGame t={text} onBack={() => setActiveGame(null)} />;
      case 'radio': return <RadioGame t={text} onBack={() => setActiveGame(null)} />;
      case 'bridge': return <BridgeGame t={text} onBack={() => setActiveGame(null)} />;
      case 'radar': return <RadarGame t={text} onBack={() => setActiveGame(null)} />;
      default: return null;
    }
  };

  return (
    <div className="games-page-container">
      {activeGame ? (
        renderGame()
      ) : (
        <div className="games-menu">
          <h1 className="games-title">{text.games_title}</h1>
          <p className="games-subtitle">{text.games_subtitle}</p>
          
          <div className="games-grid-6">
            {gamesList.map((game) => (
              <div className="game-card-mini" key={game.id}>
                <div className="game-icon-mini">{game.icon}</div>
                <h3>{game.title}</h3>
                <p>{game.desc}</p>
                <button className="play-button-mini" onClick={() => setActiveGame(game.id)}>
                  {text.btn_play}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 1. MEMORY GAME
// ==========================================
const MemoryGame = ({ t, onBack }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [moves, setMoves] = useState(0);

  const emojis = ['🚂', '🚋', '🚄', '🚅', '🚈', '🚇', '🚆', '🚞'];

  const initGame = () => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji }));
    setCards(shuffled);
    setFlipped([]);
    setSolved([]);
    setMoves(0);
  };

  useEffect(() => { initGame(); }, []);

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || solved.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
        setSolved([...solved, ...newFlipped]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="game-container">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>{t.game_memory_title}</h2>
      <p className="game-stat">{t.moves} {moves}</p>
      <div className="memory-grid">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || solved.includes(index);
          return (
            <div key={card.id} className={`memory-card ${isFlipped ? 'flipped' : ''}`} onClick={() => handleCardClick(index)}>
              <div className="memory-card-inner">
                <div className="memory-card-front">❓</div>
                <div className="memory-card-back">{card.emoji}</div>
              </div>
            </div>
          );
        })}
      </div>
      {solved.length === cards.length && cards.length > 0 && (
        <div className="game-won">
          <h3>{t.congratulations}</h3>
          <button className="play-button" onClick={initGame}>{t.play_again}</button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. FLAPPY TRAIN (W PEŁNI UKOŃCZONE)
// ==========================================
const FlappyTrain = ({ t, onBack }) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const canvasRef = useRef(null);
  const stateRef = useRef({
    trainY: 150,
    velocity: 0,
    pipes: [],
    frame: 0,
    score: 0,
    gameOver: false,
    hasStarted: false
  });

  const jump = () => {
    if (stateRef.current.gameOver) {
      resetGame();
      return;
    }
    if (!stateRef.current.hasStarted) {
      stateRef.current.hasStarted = true;
      setHasStarted(true);
    }
    stateRef.current.velocity = -3.5;
  };

  const resetGame = () => {
    stateRef.current = {
      trainY: 150,
      velocity: 0,
      pipes: [],
      frame: 0,
      score: 0,
      gameOver: false,
      hasStarted: true
    };
    setGameOver(false);
    setScore(0);
  };

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const gameLoop = () => {
      const state = stateRef.current;

      // Tło torowiska
      ctx.fillStyle = '#1e1e24';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

   
      ctx.fillStyle = '#444';
      ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

      if (state.hasStarted && !state.gameOver) {
        state.velocity += 0.15; 
        state.trainY += state.velocity;
        state.frame++;

        if (state.frame % 100 === 0) {
          const gap = 160;
          const minHeight = 40;
          const maxHeight = canvas.height - gap - minHeight;
          const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
          state.pipes.push({ x: canvas.width, top: height, bottom: canvas.height - height - gap, passed: false });
        }

        // Ruch rur i kolizje
        for (let i = state.pipes.length - 1; i >= 0; i--) {
          const p = state.pipes[i];
          p.x -= 2;

          // Rysowanie przeszkód (Słupy trakcyjne/Semafory)
          ctx.fillStyle = '#ff3333';
          ctx.fillRect(p.x, 0, 40, p.top); // Górny semafor
          ctx.fillStyle = '#33ff33';
          ctx.fillRect(p.x, canvas.height - p.bottom, 40, p.bottom); // Dolny semafor

          // Sprawdzanie punktacji
          if (!p.passed && p.x < 80) {
            p.passed = true;
            state.score++;
            setScore(state.score);
          }

          // Detekcja kolizji skrzynkowej
          if (
            80 + 30 > p.x && 80 < p.x + 40 &&
            (state.trainY < p.top || state.trainY + 24 > canvas.height - p.bottom)
          ) {
            state.gameOver = true;
            setGameOver(true);
          }

          if (p.x + 40 < 0) state.pipes.splice(i, 1);
        }

        // Granice okna skakania
        if (state.trainY > canvas.height - 30 || state.trainY < 0) {
          state.gameOver = true;
          setGameOver(true);
        }
      }

      // Rysowanie pociągu (Emoji 🚂)
      ctx.font = '24px Arial';
      ctx.fillText('🚂', 80, state.trainY + 20);

      // Wiadomość startowa
      if (!state.hasStarted) {
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Naciśnij SPACJĘ lub KLIKNIJ ekran by ruszyć', canvas.width / 2, canvas.height / 2);
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="game-container">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>Flappy Train</h2>
      <p className="game-stat">{t.score} {score}</p>
      <canvas ref={canvasRef} width={400} height={400} className="game-canvas-board" onClick={jump} />
      {gameOver && (
        <div className="game-won" style={{ backgroundColor: '#dc3545' }}>
          <h3>{t.game_over}</h3>
          <button className="play-button" onClick={resetGame}>{t.play_again}</button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. SNAKE GAME (KOLEJOWY SNAKE)
// ==========================================
const SnakeGame = ({ t, onBack }) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef(null);

  const gridCount = 20;
  const stateRef = useRef({
    snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }],
    dir: { x: 0, y: -1 },
    passenger: { x: 5, y: 5 },
    score: 0,
    gameOver: false,
    lastUpdate: 0
  });

  const generatePassenger = (snake) => {
    while (true) {
      const x = Math.floor(Math.random() * gridCount);
      const y = Math.floor(Math.random() * gridCount);
      if (!snake.some(s => s.x === x && s.y === y)) return { x, y };
    }
  };

  const restart = () => {
    stateRef.current = {
      snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }],
      dir: { x: 0, y: -1 },
      passenger: { x: 5, y: 5 },
      score: 0,
      gameOver: false,
      lastUpdate: 0
    };
    stateRef.current.passenger = generatePassenger(stateRef.current.snake);
    setGameOver(false);
    setScore(0);
  };

  useEffect(() => {
    const handleDir = (e) => {
      const d = stateRef.current.dir;
      if ((e.key === 'ArrowUp' || e.key === 'w') && d.y === 0) stateRef.current.dir = { x: 0, y: -1 };
      if ((e.key === 'ArrowDown' || e.key === 's') && d.y === 0) stateRef.current.dir = { x: 0, y: 1 };
      if ((e.key === 'ArrowLeft' || e.key === 'a') && d.x === 0) stateRef.current.dir = { x: -1, y: 0 };
      if ((e.key === 'ArrowRight' || e.key === 'd') && d.x === 0) stateRef.current.dir = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', handleDir);
    return () => window.removeEventListener('keydown', handleDir);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const size = canvas.width / gridCount;

    const loop = (timestamp) => {
      const state = stateRef.current;
      if (!state.lastUpdate) state.lastUpdate = timestamp;

      ctx.fillStyle = '#151518';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Siatka torów w tle
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 0.5;
      for(let i=0; i<gridCount; i++) {
        ctx.beginPath(); ctx.moveTo(i*size, 0); ctx.lineTo(i*size, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i*size); ctx.lineTo(canvas.width, i*size); ctx.stroke();
      }

      if (!state.gameOver && timestamp - state.lastUpdate > 150) {
        state.lastUpdate = timestamp;
        const head = { x: state.snake[0].x + state.dir.x, y: state.snake[0].y + state.dir.y };

        // Ściany i ogon kolizje
        if (head.x < 0 || head.x >= gridCount || head.y < 0 || head.y >= gridCount || state.snake.some(s => s.x === head.x && s.y === head.y)) {
          state.gameOver = true;
          setGameOver(true);
        } else {
          state.snake.unshift(head);
          if (head.x === state.passenger.x && head.y === state.passenger.y) {
            state.score += 10;
            setScore(state.score);
            state.passenger = generatePassenger(state.snake);
          } else {
            state.snake.pop();
          }
        }
      }

      // Rysowanie pasażera 🧍
      ctx.font = `${size * 0.8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧍', state.passenger.x * size + size/2, state.passenger.y * size + size/2);

      // Rysowanie pociągu (Głowa: 🚂, reszta wagoniki 🚃)
      state.snake.forEach((part, index) => {
        ctx.fillText(index === 0 ? '🚂' : '🚃', part.x * size + size/2, part.y * size + size/2);
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="game-container">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>Kolejowy Snake</h2>
      <p className="game-stat">{t.score} {score}</p>
      <canvas ref={canvasRef} width={400} height={400} className="game-canvas-board" />
      {gameOver && (
        <div className="game-won" style={{ backgroundColor: '#dc3545' }}>
          <h3>{t.game_over}</h3>
          <button className="play-button" onClick={restart}>{t.play_again}</button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. SIMON SIGNALS (SEMAFORY SAY)
// ==========================================
const SimonSignals = ({ t, onBack }) => {
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [activeSignal, setActiveSignal] = useState(null);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState('start'); // start, play, lose

  const signals = [
    { id: 0, color: '#ff3333', label: 'STOP' },
    { id: 1, color: '#ffcc00', label: 'OSTRZEŻENIE' },
    { id: 2, color: '#33ff33', label: 'WOLNA DROGA' }
  ];

  const startNewGame = () => {
    const first = Math.floor(Math.random() * 3);
    setSequence([first]);
    setUserSequence([]);
    setLevel(1);
    setGameState('play');
    playSeq([first]);
  };

  const playSeq = (seq) => {
    setIsPlayingSeq(true);
    let i = 0;
    const interval = setInterval(() => {
      setActiveSignal(seq[i]);
      setTimeout(() => setActiveSignal(null), 500);
      i++;
      if (i >= seq.length) {
        clearInterval(interval);
        setTimeout(() => setIsPlayingSeq(false), 600);
      }
    }, 900);
  };

  const handleSignalClick = (id) => {
    if (isPlayingSeq || gameState !== 'play') return;
    
    setActiveSignal(id);
    setTimeout(() => setActiveSignal(null), 250);

    const nextUserSeq = [...userSequence, id];
    setUserSequence(nextUserSeq);

    // Weryfikacja kroku
    const currentStep = nextUserSeq.length - 1;
    if (id !== sequence[currentStep]) {
      setGameState('lose');
      return;
    }

    // Ukończona cała sekwencja
    if (nextUserSeq.length === sequence.length) {
      setLevel(l => l + 1);
      setUserSequence([]);
      const nextSeq = [...sequence, Math.floor(Math.random() * 3)];
      setSequence(nextSeq);
      setTimeout(() => playSeq(nextSeq), 1000);
    }
  };

  return (
    <div className="game-container">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>Cyfrowe Semafory</h2>
      <p className="game-stat">{t.level} {level}</p>

      {gameState === 'start' && <button className="play-button" onClick={startNewGame}>{t.btn_play}</button>}

      <div className="simon-board">
        {signals.map((sig) => (
          <div 
            key={sig.id}
            className={`simon-bulb ${activeSignal === sig.id ? 'lit' : ''}`}
            style={{ backgroundColor: sig.color }}
            onClick={() => handleSignalClick(sig.id)}
          >
            <span>{sig.label}</span>
          </div>
        ))}
      </div>

      {gameState === 'lose' && (
        <div className="game-won" style={{ backgroundColor: '#dc3545', marginTop: '1.5rem' }}>
          <h3>Bląd na szlaku! Skucha.</h3>
          <button className="play-button" onClick={startNewGame}>{t.play_again}</button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 5. WAGON CATCHER
// ==========================================
const WagonCatcher = ({ t, onBack }) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef(null);

  const stateRef = useRef({
    basketX: 160,
    wagons: [],
    score: 0,
    gameOver: false,
    speedMultiplier: 0.2
  });

  const restart = () => {
    stateRef.current = { basketX: 160, wagons: [], score: 0, gameOver: false, speedMultiplier: 1 };
    setScore(0);
    setGameOver(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const handleMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const root = document.documentElement;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const mouseX = clientX - rect.left - root.scrollLeft;
      stateRef.current.basketX = Math.max(0, Math.min(canvas.width - 50, mouseX - 25));
    };

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove);
    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('touchmove', handleMove);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const loop = () => {
      const state = stateRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#212529';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!state.gameOver) {
        // Losowy respawn wagonów
        if (Math.random() < 0.012) {
          state.wagons.push({ x: Math.random() * (canvas.width - 30), y: 0, icon: Math.random() > 0.15 ? '🚃' : '💣' });
        }

        // Fizyka spadania
        for (let i = state.wagons.length - 1; i >= 0; i--) {
          const w = state.wagons[i];
          w.y += 3 * state.speedMultiplier;

          ctx.font = '24px Arial';
          ctx.fillText(w.icon, w.x, w.y);

          // Kolizja z koszykiem (naszą lokomotywą na dole)
          if (w.y >= canvas.height - 40 && w.y <= canvas.height - 15 && w.x + 20 >= state.basketX && w.x <= state.basketX + 50) {
            if (w.icon === '💣') {
              state.gameOver = true;
              setGameOver(true);
            } else {
              state.score += 1;
              setScore(state.score);
              state.speedMultiplier += 0.03; // Przyspiesza grę
            }
            state.wagons.splice(i, 1);
          } else if (w.y > canvas.height) {
            // Przegapiłeś wagonik
            if (w.icon === '🚃') {
              state.gameOver = true;
              setGameOver(true);
            }
            state.wagons.splice(i, 1);
          }
        }
      }

      // Rysowanie gracza (Lokomotywa 🚂)
      ctx.font = '36px Arial';
      ctx.fillText('🚂', state.basketX, canvas.height - 10);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="game-container">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>Katastrofa w Zajezdni</h2>
      <p className="game-stat">{t.score} {score} (Nie upuść 🚃 i unikaj 💣)</p>
      <canvas ref={canvasRef} width={360} height={450} className="game-canvas-board" style={{ cursor: 'none' }} />
      {gameOver && (
        <div className="game-won" style={{ backgroundColor: '#dc3545' }}>
          <h3>Kolej zablokowana!</h3>
          <button className="play-button" onClick={restart}>{t.play_again}</button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 6. TRAIN CLICKER
// ==========================================
const TrainClicker = ({ t, onBack }) => {
  const [cash, setCash] = useState(0);
  const [cps, setCps] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [upgradeCost, setUpgradeCost] = useState(15);
  const [autoTrainCost, setAutoTrainCost] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      if (cps > 0) setCash(c => c + cps);
    }, 1000);
    return () => clearInterval(timer);
  }, [cps]);

  const handleTrainClick = () => {
    setCash(c => c + clickPower);
  };

  const buyUpgrade = () => {
    if (cash >= upgradeCost) {
      setCash(c => c - upgradeCost);
      setClickPower(p => p + 1);
      setUpgradeCost(cost => Math.floor(cost * 1.5));
    }
  };

  const buyAutoTrain = () => {
    if (cash >= autoTrainCost) {
      setCash(c => c - autoTrainCost);
      setCps(c => c + 2);
      setAutoTrainCost(cost => Math.floor(cost * 1.6));
    }
  };

  return (
    <div className="game-container">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>Kolejowy potentat</h2>
      <div className="clicker-dashboard">
        <div className="clicker-stat-card">
          <p>{t.cash}</p>
          <h2>{cash} PLN</h2>
        </div>
        <div className="clicker-stat-card">
          <p>Przychód automatyczny:</p>
          <h4>{cps} PLN / sek</h4>
        </div>
      </div>

      <div className="clicker-train-zone" onClick={handleTrainClick}>
        <div className="giant-train-btn">🚂</div>
      </div>

      <div className="clicker-upgrades">
        <button className="upgrade-btn" onClick={buyUpgrade} disabled={cash < upgradeCost}>
          💪 Lepsza Węglarka (+1/klik) <br /> <b>Koszt: {upgradeCost} PLN</b>
        </button>
        <button className="upgrade-btn" onClick={buyAutoTrain} disabled={cash < autoTrainCost}>
          🤖 Pociąg Towarowy (+2/sek) <br /> <b>Koszt: {autoTrainCost} PLN</b>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 7. CONDUCTOR MATH
// ==========================================
const ConductorMath = ({ t, onBack }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [gameState, setGameState] = useState('start'); // start, play, end
  const [question, setQuestion] = useState({ a: 0, b: 0, ans: 0 });
  const [options, setOptions] = useState([]);

  const generateQuestion = () => {
    const a = Math.floor(Math.random() * 12) + 2;
    const b = Math.floor(Math.random() * 12) + 2;
    const ans = a * b;
    
    // Generowanie zmylających odpowiedzi
    const optSet = new Set([ans]);
    while(optSet.size < 4) {
      optSet.add(ans + (Math.floor(Math.random() * 7) - 3) * (Math.random() > 0.5 ? 1 : 2));
    }
    
    setQuestion({ a, b, ans });
    setOptions([...optSet].sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    if (gameState !== 'play') return;
    if (timeLeft <= 0) {
      setGameState('end');
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameState]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(20);
    setGameState('play');
    generateQuestion();
  };

  const checkAnswer = (selected) => {
    if (selected === question.ans) {
      setScore(s => s + 1);
      setTimeLeft(t => t + 2); // Bonusowy czas
      generateQuestion();
    } else {
      setTimeLeft(t => Math.max(0, t - 3)); // Kara czasowa
      generateQuestion();
    }
  };

  return (
    <div className="game-container">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>Szybki Konduktor</h2>

      {gameState === 'start' && (
        <div className="math-start-screen">
          <p>Czas ucieka, a pasażerowie czekają na wyliczenie ceny biletu! Mnożenie konduktorskie.</p>
          <button className="play-button" onClick={startGame}>{t.btn_play}</button>
        </div>
      )}

      {gameState === 'play' && (
        <div className="math-play-board">
          <div className="math-hud">
            <span className="badge-time">⏳ Czas: {timeLeft}s</span>
            <span className="badge-score">🎫 Punkty: {score}</span>
          </div>
          <h1 className="math-question">{question.a} × {question.b} = ?</h1>
          <div className="math-options-grid">
            {options.map((opt, i) => (
              <button key={i} className="math-opt-btn" onClick={() => checkAnswer(opt)}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'end' && (
        <div className="game-won" style={{ backgroundColor: '#4b5563' }}>
          <h3>Koniec zmiany! Twój biletowy wynik: {score}</h3>
          <button className="play-button" onClick={startGame}>Zacznij od nowa</button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 8. TRAIN MAZE (LABIRYNT)
// ==========================================
const TrainMaze = ({ t, onBack }) => {
  const [gameOver, setGameOver] = useState(false);
  
  // 1 = ściana/tory zablokowane, 0 = ścieżka, 2 = start(pociąg), 3 = stacja docelowa
  const maze = [
    [2, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    [1, 0, 1, 0, 1, 1, 0, 1, 1, 0],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 1, 1, 1, 1, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    [1, 1, 1, 0, 0, 0, 1, 0, 0, 3]
  ];

  const [pos, setPos] = useState({ x: 0, y: 0 });

  const resetMaze = () => {
    setPos({ x: 0, y: 0 });
    setGameOver(false);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (gameOver) return;
      let newX = pos.x;
      let newY = pos.y;

      if (e.key === 'ArrowUp' || e.key === 'w') newY--;
      if (e.key === 'ArrowDown' || e.key === 's') newY++;
      if (e.key === 'ArrowLeft' || e.key === 'a') newX--;
      if (e.key === 'ArrowRight' || e.key === 'd') newX++;

      // Sprawdzenie krawędzi oraz ścian
      if (newY >= 0 && newY < maze.length && newX >= 0 && newX < maze[0].length) {
        if (maze[newY][newX] !== 1) {
          setPos({ x: newX, y: newY });
          if (maze[newY][newX] === 3) {
            setGameOver(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleMove);
    return () => window.removeEventListener('keydown', handleMove);
  }, [pos, gameOver]);

  return (
    <div className="game-container">
      <button className="back-button" onClick={onBack}>&larr; {t.btn_back}</button>
      <h2>Zagubiony Pociąg</h2>
      <p className="game-stat">Doprowadź 🚂 do stacji końcowej 🏢 używając strzałek.</p>
      
      <div className="maze-board">
        {maze.map((row, y) => (
          <div key={y} className="maze-row">
            {row.map((cell, x) => {
              let char = '';
              let cellClass = 'maze-empty';
              if (pos.x === x && pos.y === y) {
                char = '🚂';
                cellClass = 'maze-player';
              } else if (cell === 1) {
                char = '🌲';
                cellClass = 'maze-wall';
              } else if (cell === 3) {
                char = '🏢';
                cellClass = 'maze-target';
              }
              return (
                <div key={x} className={`maze-cell ${cellClass}`}>
                  {char}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="game-won">
          <h3>Pociąg bezpiecznie dotarł na stację docelową! 🎉</h3>
          <button className="play-button" onClick={resetMaze}>{t.play_again}</button>
        </div>
      )}
    </div>
  );
};

export default GamesPage;
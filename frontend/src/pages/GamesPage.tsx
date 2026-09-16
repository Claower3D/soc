import { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, Star, Users, RotateCcw, 
  Sparkles, Zap, ChevronUp, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { initialUsers } from '../data/mock';
import './GamesPage.css';

interface GameCatalogItem {
  id: string;
  title: string;
  category: 'Аркады' | 'Головоломки' | 'Стратегии' | 'Мультиплеер';
  description: string;
  thumbnail: string;
  rating: number;
  onlinePlayers: string;
  badge?: string;
  badgeColor?: string;
}

const CATALOG_GAMES: GameCatalogItem[] = [
  {
    id: 'game-2048',
    title: '2048: New Age Edition',
    category: 'Головоломки',
    description: 'Легендарная числовая головоломка. Объединяйте плитки с одинаковыми числами и доберитесь до заветной 2048!',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    rating: 4.9,
    onlinePlayers: '4.2k игроков',
    badge: 'Играть в браузере',
    badgeColor: '#10b981'
  },
  {
    id: 'game-reaction',
    title: 'Cyber Reaction 2077',
    category: 'Аркады',
    description: 'Тест кибернетической реакции. Проверьте скорость ваших рефлексов и поставьте рекорд в сообществе.',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80',
    rating: 4.8,
    onlinePlayers: '2.8k игроков',
    badge: 'HOT',
    badgeColor: '#ec4899'
  },
  {
    id: 'game-cyber-runner',
    title: 'Neon Cyber Runner',
    category: 'Аркады',
    description: 'Динамичный неоновый бесконечный раннер. Уворачивайтесь от лазеров, собирайте энергоядра и улучшайте снаряжение.',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80',
    rating: 4.9,
    onlinePlayers: '12.4k игроков',
    badge: 'Популярно',
    badgeColor: '#8b5cf6'
  },
  {
    id: 'game-zen-mahjong',
    title: 'Дзен Маджонг 3D',
    category: 'Головоломки',
    description: 'Медитативное раскладывание традиционных и сакральных рун под расслабляющие звуки природы и частоту 432 Гц.',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    rating: 4.95,
    onlinePlayers: '18.1k игроков',
    badge: 'Zen Релакс',
    badgeColor: '#06b6d4'
  },
  {
    id: 'game-citadel',
    title: 'Битва Цитаделей: Эпоха',
    category: 'Стратегии',
    description: 'Тактическая пошаговая стратегия. Стройте защитные башни, развивайте технологии и защищайте базу от волн киборгов.',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80',
    rating: 4.7,
    onlinePlayers: '9.6k игроков',
    badge: 'PvP',
    badgeColor: '#f97316'
  },
  {
    id: 'game-chess',
    title: 'Шахматы New Age Arena',
    category: 'Мультиплеер',
    description: 'Классические шахматы с рейтингом ЭЛО, турнирами между пользователями соцсети и аналитикой ходов.',
    thumbnail: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=500&auto=format&fit=crop&q=80',
    rating: 4.85,
    onlinePlayers: '7.3k игроков',
    badge: 'Турнир',
    badgeColor: '#3b82f6'
  }
];

// Helper to spawn 2 or 4 in empty cell
function addRandomTile(board: number[]): number[] {
  const emptyIndices = board
    .map((val, idx) => (val === 0 ? idx : -1))
    .filter(idx => idx !== -1);
  if (emptyIndices.length === 0) return board;
  const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  const newBoard = [...board];
  newBoard[randomIndex] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
}

export function GamesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [activeGameId, setActiveGameId] = useState<string>('game-2048');

  // --- 2048 Game State ---
  const [board, setBoard] = useState<number[]>(() => {
    let b = Array(16).fill(0);
    b = addRandomTile(b);
    return addRandomTile(b);
  });
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('game_2048_best') || '1280', 10);
  });

  const reset2048 = () => {
    let b = Array(16).fill(0);
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
    setScore(0);
  };

  // Move row logic
  const slideAndMergeRow = (row: number[]) => {
    const nonZero = row.filter(x => x !== 0);
    const newRow: number[] = [];
    let addedScore = 0;
    let i = 0;
    while (i < nonZero.length) {
      if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
        const merged = nonZero[i] * 2;
        newRow.push(merged);
        addedScore += merged;
        i += 2;
      } else {
        newRow.push(nonZero[i]);
        i += 1;
      }
    }
    while (newRow.length < 4) {
      newRow.push(0);
    }
    return { newRow, addedScore };
  };

  const moveLeft = useCallback(() => {
    let changed = false;
    let newScore = score;
    const newBoard = [...board];
    for (let r = 0; r < 4; r++) {
      const row = [newBoard[r * 4], newBoard[r * 4 + 1], newBoard[r * 4 + 2], newBoard[r * 4 + 3]];
      const { newRow, addedScore } = slideAndMergeRow(row);
      newScore += addedScore;
      for (let c = 0; c < 4; c++) {
        if (newBoard[r * 4 + c] !== newRow[c]) changed = true;
        newBoard[r * 4 + c] = newRow[c];
      }
    }
    if (changed) {
      const finalBoard = addRandomTile(newBoard);
      setBoard(finalBoard);
      setScore(newScore);
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem('game_2048_best', newScore.toString());
      }
    }
  }, [board, score, bestScore]);

  const moveRight = useCallback(() => {
    let changed = false;
    let newScore = score;
    const newBoard = [...board];
    for (let r = 0; r < 4; r++) {
      const row = [newBoard[r * 4 + 3], newBoard[r * 4 + 2], newBoard[r * 4 + 1], newBoard[r * 4]];
      const { newRow, addedScore } = slideAndMergeRow(row);
      newScore += addedScore;
      const reversed = [...newRow].reverse();
      for (let c = 0; c < 4; c++) {
        if (newBoard[r * 4 + c] !== reversed[c]) changed = true;
        newBoard[r * 4 + c] = reversed[c];
      }
    }
    if (changed) {
      const finalBoard = addRandomTile(newBoard);
      setBoard(finalBoard);
      setScore(newScore);
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem('game_2048_best', newScore.toString());
      }
    }
  }, [board, score, bestScore]);

  const moveUp = useCallback(() => {
    let changed = false;
    let newScore = score;
    const newBoard = [...board];
    for (let c = 0; c < 4; c++) {
      const col = [newBoard[c], newBoard[4 + c], newBoard[8 + c], newBoard[12 + c]];
      const { newRow, addedScore } = slideAndMergeRow(col);
      newScore += addedScore;
      for (let r = 0; r < 4; r++) {
        if (newBoard[r * 4 + c] !== newRow[r]) changed = true;
        newBoard[r * 4 + c] = newRow[r];
      }
    }
    if (changed) {
      const finalBoard = addRandomTile(newBoard);
      setBoard(finalBoard);
      setScore(newScore);
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem('game_2048_best', newScore.toString());
      }
    }
  }, [board, score, bestScore]);

  const moveDown = useCallback(() => {
    let changed = false;
    let newScore = score;
    const newBoard = [...board];
    for (let c = 0; c < 4; c++) {
      const col = [newBoard[12 + c], newBoard[8 + c], newBoard[4 + c], newBoard[c]];
      const { newRow, addedScore } = slideAndMergeRow(col);
      newScore += addedScore;
      const reversed = [...newRow].reverse();
      for (let r = 0; r < 4; r++) {
        if (newBoard[r * 4 + c] !== reversed[r]) changed = true;
        newBoard[r * 4 + c] = reversed[r];
      }
    }
    if (changed) {
      const finalBoard = addRandomTile(newBoard);
      setBoard(finalBoard);
      setScore(newScore);
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem('game_2048_best', newScore.toString());
      }
    }
  }, [board, score, bestScore]);

  // Keyboard navigation for 2048
  useEffect(() => {
    if (activeGameId !== 'game-2048') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        moveUp();
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        moveDown();
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        moveLeft();
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        moveRight();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGameId, moveUp, moveDown, moveLeft, moveRight]);

  // --- Cyber Reaction Game State ---
  const [reactionState, setReactionState] = useState<'idle' | 'waiting' | 'ready' | 'result'>('idle');
  const [reactionStartTime, setReactionStartTime] = useState<number>(0);
  const [reactionResultMs, setReactionResultMs] = useState<number | null>(null);
  const [reactionTimeoutId, setReactionTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const startReactionTest = () => {
    setReactionState('waiting');
    setReactionResultMs(null);
    const delay = Math.floor(Math.random() * 2500) + 1500; // 1.5 - 4 seconds
    const timeout = setTimeout(() => {
      setReactionState('ready');
      setReactionStartTime(Date.now());
    }, delay);
    setReactionTimeoutId(timeout);
  };

  const handleReactionClick = () => {
    if (reactionState === 'idle') {
      startReactionTest();
    } else if (reactionState === 'waiting') {
      if (reactionTimeoutId) clearTimeout(reactionTimeoutId);
      setReactionState('idle');
      alert('Слишком рано! Дождитесь зеленого экрана.');
    } else if (reactionState === 'ready') {
      const elapsed = Date.now() - reactionStartTime;
      setReactionResultMs(elapsed);
      setReactionState('result');
    } else if (reactionState === 'result') {
      startReactionTest();
    }
  };

  const filteredGames = CATALOG_GAMES.filter(g => {
    if (selectedCategory === 'Все') return true;
    return g.category === selectedCategory;
  });

  return (
    <div className="games-page">
      {/* Hero Banner */}
      <div className="games-hero">
        <div className="games-hero-glow" />
        <div className="games-hero-content">
          <div className="games-badge-pill">
            <Sparkles size={14} />
            <span>NEW AGE GAMING</span>
          </div>
          <h1 className="games-title">Игры и Мини-приложения</h1>
          <p className="games-subtitle">
            Запускайте встроенные веб-игры мгновенно без скачивания, соревнуйтесь с друзьями по сети и ставьте рекорды.
          </p>
        </div>
      </div>

      <div className="games-container">
        {/* Active Interactive Game Arena */}
        <section className="game-arena-wrapper">
          <div className="game-arena-header">
            <div className="arena-game-info">
              <div className="arena-game-icon-box" style={{ background: activeGameId === 'game-2048' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #ec4899, #f43f5e)' }}>
                {activeGameId === 'game-2048' ? '🔢' : '⚡'}
              </div>
              <div>
                <h2 className="arena-game-title">
                  {activeGameId === 'game-2048' ? '2048: New Age Edition' : 'Cyber Reaction 2077'}
                </h2>
                <span className="arena-game-tag">
                  {activeGameId === 'game-2048' ? 'Головоломка • Управление стрелками клавиатуры или кнопками' : 'Тест реакции • Нажмите при появлении зеленого цвета'}
                </span>
              </div>
            </div>

            {activeGameId === 'game-2048' ? (
              <div className="arena-score-board">
                <div className="score-box">
                  <span className="score-label">СЧЁТ</span>
                  <span className="score-value">{score}</span>
                </div>
                <div className="score-box">
                  <span className="score-label">ЛУЧШИЙ</span>
                  <span className="score-value">{bestScore}</span>
                </div>
                <button className="btn-restart" onClick={reset2048} title="Начать заново">
                  <RotateCcw size={16} />
                  <span>Заново</span>
                </button>
              </div>
            ) : (
              <button className="btn-restart" onClick={() => setReactionState('idle')}>
                <RotateCcw size={16} />
                <span>Сброс</span>
              </button>
            )}
          </div>

          {/* 2048 Board */}
          {activeGameId === 'game-2048' ? (
            <div className="game-2048-container">
              <div className="grid-2048">
                {board.map((num, idx) => (
                  <div key={idx} className={`cell-2048 ${num === 0 ? 'cell-empty' : `cell-${num}`}`}>
                    {num > 0 ? num : ''}
                  </div>
                ))}
              </div>

              {/* On-screen Directional Pad for mobile & mouse */}
              <div className="game-controls-row">
                <div className="arrow-pad">
                  <div />
                  <button className="pad-btn" onClick={moveUp}><ChevronUp size={22} /></button>
                  <div />
                  <button className="pad-btn" onClick={moveLeft}><ChevronLeft size={22} /></button>
                  <button className="pad-btn" onClick={moveDown}><ChevronDown size={22} /></button>
                  <button className="pad-btn" onClick={moveRight}><ChevronRight size={22} /></button>
                </div>
              </div>
            </div>
          ) : (
            /* Cyber Reaction Box */
            <div 
              className={`reaction-test-box ${
                reactionState === 'waiting' 
                  ? 'reaction-waiting' 
                  : reactionState === 'ready' 
                  ? 'reaction-ready' 
                  : 'reaction-idle'
              }`}
              onClick={handleReactionClick}
            >
              {reactionState === 'idle' && (
                <>
                  <Zap size={36} color="#8b5cf6" style={{ marginBottom: 10 }} />
                  <h3>Нажмите, чтобы начать тест реакции</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                    После клика экран станет красным. Как только он загорится зеленым — кликните как можно быстрее!
                  </p>
                </>
              )}
              {reactionState === 'waiting' && (
                <>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>ЖДИТЕ ЗЕЛЁНОГО...</h2>
                  <p>Не кликайте раньше времени</p>
                </>
              )}
              {reactionState === 'ready' && (
                <>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>ЖМИТЕ СЕЙЧАС!</h1>
                </>
              )}
              {reactionState === 'result' && (
                <>
                  <span className="reaction-result-time">{reactionResultMs} мс</span>
                  <h3>
                    {reactionResultMs! < 200 
                      ? '⚡ Киберпанк-уровень! Невероятная реакция!' 
                      : reactionResultMs! < 270 
                      ? '🎯 Отличный результат! Уровень Pro-геймера.' 
                      : '👍 Хорошо! Нажмите, чтобы попробовать еще раз.'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Кликните для нового раунда</p>
                </>
              )}
            </div>
          )}
        </section>

        {/* Catalog Section */}
        <section className="games-catalog-section">
          <div className="games-catalog-header">
            <h2 className="games-catalog-title">Каталог игр и турниров</h2>
            <div className="games-filter-pills">
              {['Все', 'Аркады', 'Головоломки', 'Стратегии', 'Мультиплеер'].map(cat => (
                <button
                  key={cat}
                  className={`game-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="games-grid">
            {filteredGames.map(game => (
              <div 
                key={game.id} 
                className={`game-card ${activeGameId === game.id ? 'selected-active' : ''}`}
                onClick={() => {
                  if (game.id === 'game-2048' || game.id === 'game-reaction') {
                    setActiveGameId(game.id);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  } else {
                    alert(`Запуск игры «${game.title}». Загрузка онлайн-серверов...`);
                  }
                }}
              >
                <div className="game-thumb-wrap">
                  <img src={game.thumbnail} alt={game.title} className="game-thumb-img" />
                  {game.badge && (
                    <span className="game-badge-tag" style={{ background: game.badgeColor || '#8b5cf6' }}>
                      {game.badge}
                    </span>
                  )}
                  <span className="game-rating-tag">
                    <Star size={12} fill="#facc15" />
                    <span>{game.rating}</span>
                  </span>
                </div>

                <div className="game-card-body">
                  <h3 className="game-card-title">{game.title}</h3>
                  <p className="game-card-desc">{game.description}</p>
                  
                  <div className="game-card-footer">
                    <span className="game-online-count">
                      <Users size={14} />
                      <span>{game.onlinePlayers}</span>
                    </span>
                    <button className="game-play-btn">
                      {activeGameId === game.id ? 'Играть' : 'Выбрать'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Community Leaderboard */}
        <section className="leaderboard-section">
          <div className="leaderboard-header">
            <h2 className="leaderboard-title">
              <Trophy size={20} color="#eab308" />
              <span>Лидерборд Недели</span>
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Обновляется каждые 24 часа
            </span>
          </div>

          <div className="leaderboard-table">
            {initialUsers.slice(0, 5).map((usr, index) => (
              <div key={usr.id} className={`leader-row ${index < 3 ? 'top-rank' : ''}`}>
                <div className="leader-left">
                  <span className="leader-place">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <img src={usr.avatar} alt={usr.name} className="leader-avatar" />
                  <span className="leader-name">{usr.name}</span>
                </div>
                <span className="leader-pts">
                  {34500 - index * 4200} pts
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

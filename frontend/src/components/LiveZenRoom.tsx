import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Sparkles, Play, Pause, RotateCcw, Heart, 
  ShieldCheck, Send, MessageCircle 
} from 'lucide-react';
import { spiritualAudio } from '../utils/spiritualAudio';
import './LiveZenRoom.css';

interface LiveZenRoomProps {
  onEarnXp?: (amount: number, reason: string) => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  city: string;
  text: string;
}

export const LiveZenRoom: React.FC<LiveZenRoomProps> = ({ onEarnXp }) => {
  const [onlineCount, setOnlineCount] = useState(148);
  const [isMeditating, setIsMeditating] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [targetDuration] = useState(600); // 10 min
  const [lightPulses, setLightPulses] = useState<{ id: number; x: number; y: number }[]>([]);
  const [lightCount, setLightCount] = useState(1280);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Анна', city: 'Санкт-Петербург', text: 'Посылаю мир и тепло всем сердцам ✨' },
    { id: '2', sender: 'Тензин', city: 'Дхарамсала', text: 'Ом Мани Падме Хум 🙏' },
    { id: '3', sender: 'Михаил', city: 'Москва', text: 'Дышим вместе в общем поле тишины.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fluctuate online users realistically
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => Math.max(120, prev + Math.floor(Math.random() * 5) - 2));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Meditation timer logic
  useEffect(() => {
    if (isMeditating) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => {
          const next = prev + 1;
          // Interval chimes at 5 min
          if (next === 300) {
            spiritualAudio.playZenBowl(528);
          }
          if (next >= targetDuration) {
            handleCompleteSession();
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMeditating, targetDuration]);

  const handleStartMeditation = () => {
    spiritualAudio.playZenBowl(432);
    setIsMeditating(true);
  };

  const handlePauseMeditation = () => {
    setIsMeditating(false);
  };

  const handleResetMeditation = () => {
    setIsMeditating(false);
    setSecondsElapsed(0);
  };

  const handleCompleteSession = () => {
    setIsMeditating(false);
    spiritualAudio.playZenBowl(528);
    spiritualAudio.playCrystalChime();
    if (onEarnXp) {
      onEarnXp(50, 'Синхронная 10-минутная медитация в Live Zen');
    }
  };

  // Send light pulse animation
  const handleSendLight = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newPulse = {
      id: Date.now(),
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    setLightPulses(prev => [...prev, newPulse]);
    setLightCount(prev => prev + 1);
    spiritualAudio.playCrystalChime(); // high sparkling chime

    setTimeout(() => {
      setLightPulses(prev => prev.filter(p => p.id !== newPulse.id));
    }, 1800);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages(prev => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'Вы',
        city: 'В моменте',
        text: chatInput.trim()
      }
    ]);
    setChatInput('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="livezen-container">
      {/* Top Banner */}
      <div className="livezen-hero">
        <div className="livezen-halo" />
        <div className="livezen-top-row">
          <div className="livezen-badge">
            <span className="live-dot" />
            <span>LIVE ZEN ROOM • СИНХРОННОЕ ПРИСУТСТВИЕ</span>
          </div>

          <div className="livezen-online-pill">
            <Users size={16} />
            <span><strong>{onlineCount}</strong> практикующих сейчас</span>
          </div>
        </div>

        <h2 className="livezen-title">Глобальный Круг Тишины</h2>
        <p className="livezen-desc">
          Вы не одни. Прямо сейчас сотни людей по всему миру дышат в унисон с вами, удерживая поле покоя и чистого присутствия.
        </p>

        {/* Central Sync Orb / Meditation Controls */}
        <div className="zen-orb-wrapper">
          <div className={`zen-glow-orb ${isMeditating ? 'meditating' : ''}`}>
            <div className="zen-orb-inner">
              <div className="zen-timer-display">{formatTime(secondsElapsed)}</div>
              <div className="zen-timer-target">из 10:00</div>
              <div className="zen-timer-label">
                {isMeditating ? 'Дыхание в потоке' : 'Нажмите старт'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="zen-controls-bar">
          {!isMeditating ? (
            <button className="zen-btn zen-start" onClick={handleStartMeditation}>
              <Play size={18} />
              <span>Войти в медитацию</span>
            </button>
          ) : (
            <button className="zen-btn zen-pause" onClick={handlePauseMeditation}>
              <Pause size={18} />
              <span>Пауза</span>
            </button>
          )}

          <button className="zen-btn zen-reset" onClick={handleResetMeditation} title="Сбросить">
            <RotateCcw size={16} />
          </button>

          <button className="zen-btn zen-light-btn" onClick={handleSendLight}>
            <Heart size={16} className="heart-pulse" />
            <span>Послать Свет ({lightCount})</span>
          </button>
        </div>
      </div>

      {/* Light Pulses overlay */}
      {lightPulses.map(pulse => (
        <div 
          key={pulse.id}
          className="light-beam-effect"
          style={{ top: pulse.y, left: pulse.x }}
        />
      ))}

      {/* Room Chat & Intentions */}
      <div className="zen-bottom-grid">
        <div className="zen-intentions-card">
          <div className="card-header-line">
            <Sparkles size={16} className="sparkle-gold" />
            <h4>Намерение Общего Поля</h4>
          </div>
          <p className="intention-quote">
            «Пусть все живые существа во всех мирах будут свободны от страданий, страха и тревоги. Пусть мир воцарится в каждом сердце».
          </p>
          <div className="intention-tip">
            <ShieldCheck size={14} />
            <span>Звук поющей тибетской чаши 432 Гц автоматически звучит в начале и в конце сессии.</span>
          </div>
        </div>

        <div className="zen-chat-card">
          <div className="card-header-line">
            <MessageCircle size={16} />
            <h4>Живые отклики круга</h4>
          </div>

          <div className="zen-chat-list">
            {chatMessages.map(msg => (
              <div key={msg.id} className="zen-chat-item">
                <div className="zen-chat-meta">
                  <span className="zen-chat-name">{msg.sender}</span>
                  <span className="zen-chat-city">({msg.city})</span>
                </div>
                <div className="zen-chat-text">{msg.text}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChatMessage} className="zen-chat-form">
            <input 
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Поделитесь добрым словом или мантрой..."
              className="zen-chat-input"
            />
            <button type="submit" className="zen-chat-submit" disabled={!chatInput.trim()}>
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Sparkles, Bot, Send, X } from 'lucide-react';
import { spiritualAudio } from '../utils/spiritualAudio';
import './AiGuruModal.css';

interface Message {
  id: string;
  sender: 'user' | 'guru';
  text: string;
  recommendation?: {
    type: 'breathing' | 'meditation' | 'affirmation';
    title: string;
    actionLabel: string;
  };
}

interface AiGuruModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBreathing?: () => void;
  onPlaySound?: () => void;
}

const TRADITION_GURUS = [
  { id: 'zen', name: 'Мастер Дзэн (Шунья)', desc: 'Путь пустоты, присутствия и созерцания дыхания' },
  { id: 'sufi', name: 'Суфийский Мудрец (Руми)', desc: 'Путь любви, экстаза и преданности сердцу' },
  { id: 'stoic', name: 'Философ Стоик (Аврелий)', desc: 'Путь ясного разума, добродетели и спокойствия' },
  { id: 'vedic', name: 'Ведический Риши (Ананда)', desc: 'Путь осознанности, чакр и внутренней гармонии' }
];

const MOOD_PROMPTS = [
  { label: '🌪️ Тревога и стресс', mood: 'anxiety' },
  { label: '⚡ Потеря энергии', mood: 'low_energy' },
  { label: '💔 Боль в сердце', mood: 'heartache' },
  { label: '🧭 Поиск пути', mood: 'searching' },
  { label: '🧘 Хочу тишины', mood: 'peace' }
];

export const AiGuruModal: React.FC<AiGuruModalProps> = ({ 
  isOpen, 
  onClose,
  onStartBreathing,
  onPlaySound
}) => {
  const [selectedGuru, setSelectedGuru] = useState(TRADITION_GURUS[0]);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'guru',
      text: 'Мир твоему сердцу, путник. Я твой духовный наставник. Что сейчас волнует твою душу? Поделись своим состоянием или выбери ощущение ниже.',
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const generateAnswer = (userQuery: string) => {
    setIsTyping(true);
    spiritualAudio.playCrystalChime(); // gentle chime for guru thinking

    setTimeout(() => {
      let reply = '';
      let rec = undefined;

      const q = userQuery.toLowerCase();
      if (q.includes('тревог') || q.includes('стресс') || q.includes('страх')) {
        reply = `Дыши. Тревога — это всего лишь мысль о будущем, которого еще нет. Почувствуй стопами землю под собой прямо сейчас. В этой точке времени ты в безопасности.`;
        rec = {
          type: 'breathing' as const,
          title: 'Дыхание 4-7-8 для мгновенного снятия спазма',
          actionLabel: 'Начать дыхательную практику'
        };
      } else if (q.includes('энерги') || q.includes('устал') || q.includes('сил')) {
        reply = `Когда сосуд пуст, бесполезно требовать от него воды. Твое тело просит не лени, а глубокого покоя. Отпусти необходимость быть продуктивным на 10 минут.`;
        rec = {
          type: 'meditation' as const,
          title: 'Звуковая ванна 528 Гц для восстановления праны',
          actionLabel: 'Включить тибетскую чашу'
        };
      } else if (q.includes('сердц') || q.includes('боль') || q.includes('обид')) {
        reply = `Боль — это трещина, через которую в тебя проникает Свет. Не закрывай свое сердце на замок. Положи руку на грудь и скажи себе: «Я принимаю всё, что чувствую».`;
        rec = {
          type: 'affirmation' as const,
          title: 'Практика Метта (Любящей доброты)',
          actionLabel: 'Открыть аффирмации любви'
        };
      } else {
        reply = `То, что ты ищешь снаружи, уже присутствует внутри как свидетель. Успокой рябь на воде ума — и ты увидишь отражение луны. Наблюдай за вдохом и выдохом.`;
        rec = {
          type: 'breathing' as const,
          title: 'Осознанное дыхание 5 минут',
          actionLabel: 'Практиковать дыхание'
        };
      }

      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'guru',
          text: reply,
          recommendation: rec
        }
      ]);
      setIsTyping(false);
      spiritualAudio.playZenBowl(396);
    }, 900);
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    generateAnswer(text);
  };

  return (
    <div className="guru-overlay" onClick={onClose}>
      <div className="guru-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="guru-header">
          <div className="guru-header-info">
            <div className="guru-avatar-circle">
              <Bot size={22} />
            </div>
            <div>
              <div className="guru-header-title">ИИ-Духовный Наставник</div>
              <div className="guru-header-sub">{selectedGuru.name}</div>
            </div>
          </div>
          <button className="guru-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Guru Persona Selector */}
        <div className="guru-traditions-bar">
          {TRADITION_GURUS.map(g => (
            <button
              key={g.id}
              className={`guru-persona-btn ${selectedGuru.id === g.id ? 'active' : ''}`}
              onClick={() => setSelectedGuru(g)}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="guru-messages-area">
          {messages.map(m => (
            <div key={m.id} className={`guru-message-wrap ${m.sender}`}>
              <div className="guru-bubble">
                <p className="guru-bubble-text">{m.text}</p>

                {m.recommendation && (
                  <div className="guru-rec-box">
                    <div className="guru-rec-title">
                      <Sparkles size={14} />
                      <span>{m.recommendation.title}</span>
                    </div>
                    <button 
                      className="guru-rec-action-btn"
                      onClick={() => {
                        if (m.recommendation?.type === 'breathing' && onStartBreathing) {
                          onStartBreathing();
                          onClose();
                        } else if (onPlaySound) {
                          onPlaySound();
                          onClose();
                        }
                      }}
                    >
                      {m.recommendation.actionLabel}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="guru-message-wrap guru">
              <div className="guru-bubble typing-bubble">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
        </div>

        {/* Quick Mood Chips */}
        <div className="guru-mood-chips">
          {MOOD_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              className="guru-mood-chip"
              onClick={() => handleSend(p.label)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="guru-input-bar">
          <input 
            type="text"
            className="guru-input"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Спросите мудреца или опишите чувства..."
          />
          <button 
            className="guru-send-btn"
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

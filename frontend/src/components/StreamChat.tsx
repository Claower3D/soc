import { useState, useRef, useEffect } from 'react';
import { Send, Users, Gift } from 'lucide-react';
import type { StreamChatMessage } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import './StreamChat.css';

interface StreamChatProps {
  initialMessages?: StreamChatMessage[];
  viewersCount?: number;
  channelName: string;
}

export function StreamChat({ initialMessages = [], viewersCount = 14280, channelName }: StreamChatProps) {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [messages, setMessages] = useState<StreamChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [showDonationSuccess, setShowDonationSuccess] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Periodic random live incoming chat messages for dynamic Twitch atmosphere
  useEffect(() => {
    const chatSamples = [
      { username: 'Neo_Runner', color: '#10b981', text: 'Крутой ракурс! 🔥', badge: 'SUB' },
      { username: 'Lana_Ray', color: '#ec4899', text: 'Привет из Питера! Смотрим всей семьей 🎈' },
      { username: 'Ghost_Dog', color: '#3b82f6', text: 'Ставьте лайки стриму, чтобы взлетело в топ!', badge: 'VIP' },
      { username: 'ZenMaster', color: '#8b5cf6', text: 'Качество звука отличное 🎧' },
    ];

    const interval = setInterval(() => {
      const sample = chatSamples[Math.floor(Math.random() * chatSamples.length)];
      const newMsg: StreamChatMessage = {
        id: `sc_auto_${Date.now()}`,
        username: sample.username,
        color: sample.color,
        badge: sample.badge,
        text: sample.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev.slice(-40), newMsg]);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const newMsg: StreamChatMessage = {
      id: `sc_${Date.now()}`,
      username: currentUser.name,
      color: '#8b5cf6',
      badge: 'ВЫ',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  const handleSendDonation = (amount: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const donMsg: StreamChatMessage = {
      id: `sc_don_${Date.now()}`,
      username: currentUser.name,
      color: '#f59e0b',
      badge: 'ДОНАТ',
      isDonation: true,
      donationAmount: amount,
      text: `Поддержка стрима от души! Спасибо за качественный эфир ❤️`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, donMsg]);
    setShowDonationSuccess(amount);
    setTimeout(() => setShowDonationSuccess(null), 3500);
  };

  return (
    <div className="stream-chat-container">
      {/* Stream Chat Header */}
      <div className="stream-chat-header">
        <div className="stream-chat-title-group">
          <span className="live-stream-badge">
            <span className="live-pulsing-dot" />
            ЧАТ СТРИМА
          </span>
          <span className="stream-viewers-count">
            <Users size={13} /> {(viewersCount).toLocaleString('ru-RU')}
          </span>
        </div>
        <span className="stream-channel-tag">@{channelName}</span>
      </div>

      {/* Donation banner alert if triggered */}
      {showDonationSuccess && (
        <div className="stream-donation-popup">
          <Gift size={16} />
          <span>Вы отправили донат {showDonationSuccess}! Автор видит ваше сообщение 🚀</span>
        </div>
      )}

      {/* Stream Messages List */}
      <div className="stream-chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`stream-msg-line ${msg.isDonation ? 'donation-line' : ''}`}>
            {msg.isDonation && (
              <div className="donation-card-highlight">
                <Gift size={14} />
                <span>Донат: <strong>{msg.donationAmount}</strong></span>
              </div>
            )}
            <div className="stream-msg-content">
              <span className="stream-msg-time">{msg.time}</span>
              {msg.badge && (
                <span className={`stream-badge-pill badge-${msg.badge.toLowerCase()}`}>
                  {msg.badge}
                </span>
              )}
              <span className="stream-msg-user" style={{ color: msg.color || '#3b82f6' }}>
                {msg.username}:
              </span>
              <span className="stream-msg-text">{msg.text}</span>
            </div>
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      {/* Quick Donation / Support Row */}
      <div className="stream-quick-donations">
        <span className="quick-don-label"><Gift size={13} /> Поддержать:</span>
        <button type="button" className="btn-don-chip" onClick={() => handleSendDonation('100 ₽')}>100 ₽</button>
        <button type="button" className="btn-don-chip" onClick={() => handleSendDonation('300 ₽')}>300 ₽</button>
        <button type="button" className="btn-don-chip gold" onClick={() => handleSendDonation('1 000 ₽')}>1 000 ₽</button>
      </div>

      {/* Message Input Box */}
      <form className="stream-chat-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder={isAuthenticated ? "Отправить сообщение в чат..." : "Войдите, чтобы писать в чат"}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          className="stream-chat-input"
        />
        <button 
          type="submit" 
          className="stream-chat-send-btn" 
          disabled={!inputText.trim()}
          title="Отправить (Enter)"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

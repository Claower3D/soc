import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Smile, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';
import { type Chat, type Message } from '../data/mock';
import './ChatWindowNew.css';

interface ChatWindowProps {
  chat: Chat | null;
  onBack: () => void;
  onDeleteChat?: (id: string) => void;
  onUpdateChat?: (id: string, updates: Partial<Chat>) => void;
  availableChats?: Chat[];
  onSelectChat?: (id: string) => void;
}

const AI_REPLIES: Record<string, string> = {
  'привет': 'Привет! 👋 Чем могу помочь?',
  'помощь': '📚 Я могу:\n• Ответить на вопросы о платформе\n• Поддержать беседу\n• Помочь найти функции\n\nПросто напиши!',
  'кто ты': '🤖 Я ИИ Оракул — цифровой помощник платформы New Age. Задавай любые вопросы!',
  'спасибо': 'Пожалуйста! 😊 Обращайся в любое время.',
};

function getAiReply(text: string): string {
  const lower = text.toLowerCase().trim();
  for (const [key, reply] of Object.entries(AI_REPLIES)) {
    if (lower.includes(key)) return reply;
  }
  const replies = [
    'Интересно! Расскажи подробнее 🤔',
    'Понял тебя! Что-нибудь ещё?',
    'Хороший вопрос! Давай обсудим.',
    '✨ Отличная мысль!',
    'Я тебя слышу. Продолжай!',
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatWindowNew({ chat, onBack, onUpdateChat }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chat?.messages && Array.isArray(chat.messages)) {
      setMessages(chat.messages);
    } else {
      setMessages([]);
    }
    setInputValue('');
  }, [chat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!chat) {
    return (
      <div className="cw-empty">
        <div className="cw-empty-text">💬 Выберите диалог для начала общения</div>
      </div>
    );
  }

  const isAi = chat.id === 'chat_ai_oracle' || chat.id === 'ai_guru_bot';
  const chatName = String(chat.groupTitle || chat.user?.name || 'Чат');
  const chatAvatar = String(chat.groupAvatar || chat.user?.avatar || '');
  const isOnline = isAi || Boolean(chat.user?.online);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      text,
      fromMe: true,
      time: formatTime(),
      status: 'sent',
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputValue('');

    if (onUpdateChat) {
      onUpdateChat(chat.id, { messages: updatedMessages, lastMessage: text, time: formatTime() });
    }

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' as const } : m));
    }, 500);

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'read' as const } : m));
    }, 1500);

    if (isAi) {
      setTimeout(() => {
        const reply: Message = {
          id: `msg_ai_${Date.now()}`,
          text: getAiReply(text),
          fromMe: false,
          time: formatTime(),
          status: 'read',
        };
        setMessages(prev => {
          const updated = [...prev, reply];
          if (onUpdateChat) {
            onUpdateChat(chat.id, { messages: updated, lastMessage: String(reply.text || '').slice(0, 50), time: formatTime() });
          }
          return updated;
        });
      }, 800 + Math.random() * 1200);
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="cw-container">
      {/* Header */}
      <div className="cw-header">
        <button onClick={onBack} className="cw-back-btn">
          <ArrowLeft size={22} />
        </button>

        <div className="cw-avatar-wrap">
          {chatAvatar ? (
            <img src={chatAvatar} alt={chatName} className="cw-avatar-img" />
          ) : (
            <div className={`cw-avatar-placeholder ${isAi ? 'ai' : ''}`}>
              {chatName.charAt(0)}
            </div>
          )}
          {isOnline && <div className="cw-online-dot" />}
        </div>

        <div className="cw-header-info">
          <div className="cw-header-name">
            {chatName}
            {isAi && <span className="cw-ai-badge">ИИ</span>}
          </div>
          <div className={`cw-header-status ${isOnline ? 'online' : ''}`}>
            {isAi ? 'Нейросетевой помощник' : isOnline ? 'в сети' : 'был(а) недавно'}
          </div>
        </div>

        <div className="cw-header-actions">
          <button className="cw-action-btn"><Phone size={18} /></button>
          <button className="cw-action-btn"><Video size={18} /></button>
          <button className="cw-action-btn"><MoreVertical size={18} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="cw-messages">
        {messages.length === 0 ? (
          <div className="cw-no-messages">Сообщений пока нет. Начните диалог!</div>
        ) : (
          messages.map((msg) => {
            if (!msg || typeof msg !== 'object') return null;
            const isMe = Boolean(msg.fromMe);
            const text = String(msg.text || '');
            const time = String(msg.time || '');
            const status = String(msg.status || 'sent');

            return (
              <div key={String(msg.id)} className={`cw-msg-row ${isMe ? 'outgoing' : 'incoming'}`}>
                <div className={`cw-bubble ${isMe ? 'me' : 'them'}`}>
                  <div className="cw-bubble-text">{text}</div>
                  <div className="cw-bubble-meta">
                    <span className="cw-bubble-time">{time}</span>
                    {isMe && (
                      <span className={`cw-ticks ${status === 'read' ? 'read' : ''}`}>
                        {status === 'sent' ? '✓' : '✓✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="cw-input-bar">
        <button className="cw-input-icon"><Smile size={22} /></button>
        <button className="cw-input-icon"><Paperclip size={20} /></button>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Написать сообщение..."
          className="cw-input"
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className={`cw-send-btn ${inputValue.trim() ? 'active' : ''}`}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

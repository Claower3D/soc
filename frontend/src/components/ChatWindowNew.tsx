import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Smile, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';
import { type Chat, type Message } from '../data/mock';

interface ChatWindowProps {
  chat: Chat | null;
  onBack: () => void;
  onDeleteChat?: (id: string) => void;
  onUpdateChat?: (id: string, updates: Partial<Chat>) => void;
  availableChats?: Chat[];
  onSelectChat?: (id: string) => void;
}

// ИИ-ответы
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

  // Sync messages when chat changes
  useEffect(() => {
    if (chat?.messages && Array.isArray(chat.messages)) {
      setMessages(chat.messages);
    } else {
      setMessages([]);
    }
    setInputValue('');
  }, [chat?.id]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Empty state
  if (!chat) {
    return (
      <div className="chat-window-empty">
        <div className="empty-message-bubble">Выберите диалог для начала общения</div>
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

    // Save to parent
    if (onUpdateChat) {
      onUpdateChat(chat.id, {
        messages: updatedMessages,
        lastMessage: text,
        time: formatTime(),
      });
    }

    // Mark as delivered after 500ms
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' as const } : m));
    }, 500);

    // Mark as read after 1.5s
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'read' as const } : m));
    }, 1500);

    // AI reply
    if (isAi) {
      const delay = 800 + Math.random() * 1200;
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
            onUpdateChat(chat.id, {
              messages: updated,
              lastMessage: String(reply.text || '').slice(0, 50),
              time: formatTime(),
            });
          }
          return updated;
        });
      }, delay);
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderTicks = (msg: Message) => {
    if (!msg.fromMe) return null;
    const s = String(msg.status || 'sent');
    if (s === 'read') return <span className="tg-ticks read">✓✓</span>;
    if (s === 'delivered') return <span className="tg-ticks">✓✓</span>;
    return <span className="tg-ticks">✓</span>;
  };

  return (
    <div className="tg-chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="tg-chat-header" style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        borderBottom: '1px solid var(--color-border, #2a2a3a)',
        background: 'var(--color-surface, #1a1a2e)', flexShrink: 0,
      }}>
        <button onClick={onBack} className="tg-back-btn" style={{
          background: 'none', border: 'none', color: 'var(--color-text, #fff)', cursor: 'pointer',
          display: 'none', padding: 4,
        }}>
          <ArrowLeft size={22} />
        </button>

        <div style={{ position: 'relative' }}>
          {chatAvatar ? (
            <img src={chatAvatar} alt={chatName} style={{
              width: 40, height: 40, borderRadius: '50%', objectFit: 'cover',
            }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: isAi ? 'linear-gradient(135deg, #a855f7, #ec4899)' : '#6C5CE7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 16,
            }}>
              {chatName.charAt(0)}
            </div>
          )}
          {isOnline && (
            <div style={{
              position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
              borderRadius: '50%', background: '#4ade80', border: '2px solid var(--color-surface, #1a1a2e)',
            }} />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text, #fff)', fontSize: 15 }}>
            {chatName}
            {isAi && <span style={{
              fontSize: 10, fontWeight: 700, marginLeft: 6,
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: '#fff', padding: '1px 6px', borderRadius: 8,
            }}>ИИ</span>}
          </div>
          <div style={{ fontSize: 12, color: isOnline ? '#4ade80' : 'var(--color-text-secondary, #888)' }}>
            {isAi ? 'Нейросетевой помощник' : isOnline ? 'в сети' : 'был(а) недавно'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary, #888)', cursor: 'pointer', padding: 6 }}>
            <Phone size={18} />
          </button>
          <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary, #888)', cursor: 'pointer', padding: 6 }}>
            <Video size={18} />
          </button>
          <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary, #888)', cursor: 'pointer', padding: 6 }}>
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 12px',
        display: 'flex', flexDirection: 'column', gap: 6,
        background: 'var(--color-bg, #0f0f1a)',
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary, #666)', marginTop: 40, fontSize: 14 }}>
            Сообщений пока нет. Начните диалог!
          </div>
        ) : (
          messages.map((msg) => {
            if (!msg || typeof msg !== 'object') return null;
            const isMe = Boolean(msg.fromMe);
            const text = String(msg.text || '');
            const time = String(msg.time || '');

            return (
              <div key={String(msg.id)} style={{
                display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
                padding: '0 4px',
              }}>
                <div style={{
                  maxWidth: '70%', padding: '8px 12px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isMe
                    ? 'linear-gradient(135deg, #6C5CE7, #a855f7)'
                    : 'var(--color-surface, #1e1e32)',
                  color: '#fff', fontSize: 14, lineHeight: 1.45,
                  wordBreak: 'break-word', position: 'relative',
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    gap: 4, marginTop: 4, fontSize: 11,
                    color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--color-text-secondary, #666)',
                  }}>
                    <span>{time}</span>
                    {renderTicks(msg)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
        borderTop: '1px solid var(--color-border, #2a2a3a)',
        background: 'var(--color-surface, #1a1a2e)', flexShrink: 0,
      }}>
        <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary, #888)', cursor: 'pointer', padding: 6 }}>
          <Smile size={22} />
        </button>
        <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary, #888)', cursor: 'pointer', padding: 6 }}>
          <Paperclip size={20} />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Написать сообщение..."
          style={{
            flex: 1, background: 'var(--color-bg, #0f0f1a)', border: '1px solid var(--color-border, #2a2a3a)',
            borderRadius: 20, padding: '10px 16px', color: 'var(--color-text, #fff)', fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim()}
          style={{
            background: inputValue.trim() ? 'linear-gradient(135deg, #6C5CE7, #a855f7)' : 'transparent',
            border: 'none', borderRadius: '50%', width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: inputValue.trim() ? 'pointer' : 'default',
            color: inputValue.trim() ? '#fff' : 'var(--color-text-secondary, #555)',
            transition: 'all 0.2s',
          }}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

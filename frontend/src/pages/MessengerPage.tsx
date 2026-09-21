import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatList } from '../components/ChatList';
import { ChatWindowNew } from '../components/ChatWindowNew';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import { type Chat } from '../data/mock';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './MessengerPage.css';

// ИИ Оракул — встроенный ИИ-ассистент
const AI_ORACLE_CHAT: Chat = {
  id: 'chat_ai_oracle',
  user: {
    id: 'ai_oracle',
    name: 'ИИ Оракул',
    username: 'ai_oracle',
    avatar: '/ai_avatar.jpg',
    online: true,
    verified: true,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
  },
  lastMessage: '✨ Привет! Я ИИ Оракул — твой цифровой помощник',
  time: 'Сейчас',
  unread: 0,
  isFavorite: true,
  messages: [
    {
      id: 'ai_welcome_1',
      text: '✨ Привет! Я ИИ Оракул — твой цифровой помощник в New Age.\n\nЯ могу:\n• 💬 Поддержать беседу на любую тему\n• 🔮 Помочь разобраться с платформой\n• 📝 Ответить на вопросы\n\nНапиши мне что-нибудь!',
      fromMe: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    }
  ]
};

/** Ensure chat has valid structure for rendering */
function normalizeChat(c: any): Chat | null {
  if (!c || !c.id) return null;
  return {
    ...c,
    user: c.user && typeof c.user === 'object' ? {
      ...c.user,
      id: String(c.user.id || c.id || ''),
      name: String(c.user.name || c.name || 'Чат'),
      username: String(c.user.username || ''),
      avatar: String(c.user.avatar || ''),
      online: Boolean(c.user.online),
    } : {
      id: String(c.id || ''),
      name: String(c.name || 'Чат'),
      username: '',
      avatar: '/ai_avatar.jpg',
      online: false,
    },
    messages: Array.isArray(c.messages) ? c.messages : [],
    lastMessage: String(c.lastMessage || ''),
    time: String(c.time || 'Сейчас'),
    unread: Number(c.unread) || 0,
  };
}

export function MessengerPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedChatId = searchParams.get('chat') || searchParams.get('id');

  const [chatList, setChatList] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(requestedChatId);

  // Load chats
  useEffect(() => {
    let mounted = true;

    const finalize = (chats: Chat[]) => {
      if (!mounted) return;
      // Ensure ИИ Оракул is always first
      const hasOracle = chats.some(c => c.id === 'chat_ai_oracle');
      if (!hasOracle) {
        chats = [AI_ORACLE_CHAT, ...chats];
      } else {
        const oracle = chats.find(c => c.id === 'chat_ai_oracle')!;
        chats = [oracle, ...chats.filter(c => c.id !== 'chat_ai_oracle')];
      }
      setChatList(chats);
      localStorage.setItem('newage_messenger_chats', JSON.stringify(chats));
      setIsLoading(false);
    };

    // Try API first, fallback to localStorage
    api.chats.list().then((data) => {
      if (!mounted) return;
      if (Array.isArray(data) && data.length > 0) {
        const normalized = data.map(normalizeChat).filter(Boolean) as Chat[];
        finalize(normalized);
      } else {
        loadLocal();
      }
    }).catch(() => {
      if (mounted) loadLocal();
    });

    function loadLocal() {
      const saved = localStorage.getItem('newage_messenger_chats');
      let chats: Chat[] = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            chats = parsed.map(normalizeChat).filter(Boolean) as Chat[];
          }
        } catch { /* ignore */ }
      }
      finalize(chats);
    }

    return () => { mounted = false; };
  }, []);

  // Don't auto-select — show placeholder instead

  const activeChat = chatList.find(c => c.id === activeChatId) ?? null;

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    // Mark as read
    setChatList(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, unread: 0 } : c);
      localStorage.setItem('newage_messenger_chats', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteChat = (id: string) => {
    setChatList(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('newage_messenger_chats', JSON.stringify(updated));
      return updated;
    });
    if (activeChatId === id) setActiveChatId(null);
  };

  const handleUpdateChat = (chatId: string, updates: Partial<Chat>) => {
    setChatList(prev => {
      const updated = prev.map(c => c.id === chatId ? { ...c, ...updates } : c);
      localStorage.setItem('newage_messenger_chats', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCreateGroup = (newGroup: Chat) => {
    setChatList(prev => {
      const updated = [newGroup, ...prev];
      localStorage.setItem('newage_messenger_chats', JSON.stringify(updated));
      return updated;
    });
    setActiveChatId(newGroup.id);
  };

  if (isLoading) {
    return <div style={{ padding: 20, color: '#fff' }}>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="messenger-guest-lock-container">
        <GuestLockPrompt
          featureName="Личные сообщения и чаты"
          title="Мессенджер защищён сквозным шифрованием"
          description="Чтобы начать общение с другими участниками, войдите в свой аккаунт или зарегистрируйтесь."
          actionText="Создать аккаунт для переписки"
        />
      </div>
    );
  }

  return (
    <div className="messenger-page">
      <div className={`messenger-list ${activeChatId ? 'hide-mobile' : ''}`}>
        <ChatList
          chats={chatList}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onCreateGroup={handleCreateGroup}
          onUpdateChat={handleUpdateChat}
        />
      </div>
      <div className={`messenger-chat ${!activeChatId ? 'hide-mobile' : ''}`}>
        <ChatWindowNew
          chat={activeChat}
          onBack={() => setActiveChatId(null)}
          onDeleteChat={handleDeleteChat}
          onUpdateChat={handleUpdateChat}
          availableChats={chatList}
          onSelectChat={handleSelectChat}
        />
      </div>
    </div>
  );
}


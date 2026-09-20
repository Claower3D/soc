import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatList } from '../components/ChatList';
import { ChatWindow } from '../components/ChatWindow';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import { type Chat } from '../data/mock';
import { INITIAL_DATING_PROFILES } from '../data/datingData';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './MessengerPage.css';

export function MessengerPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedChatId = searchParams.get('chat') || searchParams.get('id');
  const datingProfileId = searchParams.get('datingProfile');

  const [chatList, setChatList] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ИИ Оракул — встроенный ИИ-ассистент, всегда первый чат
  const AI_ORACLE_CHAT: Chat = {
    id: 'chat_ai_oracle',
    user: {
      id: 'ai_oracle',
      name: 'ИИ Оракул',
      username: 'ai_oracle',
      avatar: '',
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
        text: '✨ Привет! Я **ИИ Оракул** — твой цифровой помощник в New Age.\n\nЯ могу:\n• 💬 Поддержать беседу на любую тему\n• 🔮 Помочь разобраться с платформой\n• 📝 Ответить на вопросы\n\nНапиши мне что-нибудь!',
        fromMe: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      }
    ]
  };



  useEffect(() => {
    let mounted = true;

    const loadChats = () => {
      let userChats: Chat[] = [];

      // Загружаем сохранённые чаты из localStorage
      const saved = localStorage.getItem('newage_messenger_chats');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Нормализуем — фильтруем битые данные
            userChats = parsed.filter((c: any) => c && c.id && c.user && typeof c.user === 'object' && typeof c.user.name === 'string').map((c: any) => ({
              ...c,
              lastMessage: String(c.lastMessage || ''),
              time: String(c.time || ''),
              user: { ...c.user, name: String(c.user.name || ''), username: String(c.user.username || ''), avatar: String(c.user.avatar || '') },
            }));
          }
        } catch { /* ignore */ }
      }

      // Убеждаемся что ИИ Оракул ВСЕГДА первый
      const hasOracle = userChats.some(c => c.id === 'chat_ai_oracle');
      if (!hasOracle) {
        userChats = [AI_ORACLE_CHAT, ...userChats];
      } else {
        // Переносим Оракула на первое место
        const oracle = userChats.find(c => c.id === 'chat_ai_oracle')!;
        userChats = [oracle, ...userChats.filter(c => c.id !== 'chat_ai_oracle')];
      }

      if (mounted) {
        setChatList(userChats);
        localStorage.setItem('newage_messenger_chats', JSON.stringify(userChats));
        setIsLoading(false);
      }
    };

    // Пробуем загрузить с API, фолбэк на localStorage
    api.chats.list().then((data) => {
      if (mounted) {
        if (Array.isArray(data) && data.length > 0) {
          // Нормализуем API чаты — добавляем user если нет
          const normalized = data.map((c: any) => ({
            ...c,
            user: c.user && typeof c.user === 'object' ? {
              ...c.user,
              name: String(c.user.name || c.name || 'Чат'),
              username: String(c.user.username || c.id || ''),
              avatar: String(c.user.avatar || ''),
              id: String(c.user.id || c.id || ''),
              online: Boolean(c.user.online),
            } : {
              id: String(c.id || ''),
              name: String(c.name || 'Чат'),
              username: String(c.id || ''),
              avatar: '',
              online: false,
            },
            messages: Array.isArray(c.messages) ? c.messages : [],
            lastMessage: String(c.lastMessage || ''),
            time: String(c.time || 'Сейчас'),
          })).filter((c: any) => c.id);
          const hasOracle = normalized.some((c: Chat) => c.id === 'chat_ai_oracle');
          const chats = hasOracle ? normalized : [AI_ORACLE_CHAT, ...normalized];
          setChatList(chats);
          localStorage.setItem('newage_messenger_chats', JSON.stringify(chats));
          setIsLoading(false);
        } else {
          loadChats();
        }
      }
    }).catch(() => {
      if (mounted) loadChats();
    });

    return () => { mounted = false; };
  }, []);

  const [activeChatId, setActiveChatId] = useState<string | null>(requestedChatId);

  // Auto-select отключён до фикса рендера ChatWindow
  // useEffect(() => {
  //   if (!isLoading && !activeChatId && chatList.length > 0 && !requestedChatId && !datingProfileId) {
  //     setActiveChatId(chatList[0].id);
  //   }
  // }, [isLoading, activeChatId, chatList, requestedChatId, datingProfileId]);

  // Handle incoming query params: requestedChatId or datingProfileId
  useEffect(() => {
    if (requestedChatId) {
      setActiveChatId(requestedChatId);
      // Mark as read in list
      setChatList(prev => {
        const updated = prev.map(c => {
          if (c.id === requestedChatId) {
            return {
              ...c,
              unread: 0,
              messages: c.messages.map(m => (!m.fromMe || !m.status ? { ...m, status: 'read' as const } : m))
            };
          }
          return c;
        });
        localStorage.setItem('newage_messenger_chats', JSON.stringify(updated));
        return updated;
      });
    } else if (datingProfileId) {
      const matchChatId = `chat_dating_${datingProfileId}`;
      const existing = chatList.find(c => c.id === matchChatId);
      if (existing) {
        setActiveChatId(matchChatId);
      } else {
        // Find profile in saved or initial profiles
        const savedProfilesStr = localStorage.getItem('newage_dating_all_profiles');
        let allProfiles = INITIAL_DATING_PROFILES;
        if (savedProfilesStr) {
          try {
            allProfiles = JSON.parse(savedProfilesStr);
          } catch { /* ignore */ }
        }
        const profile = allProfiles.find(p => p.id === datingProfileId);
        if (profile) {
          const newChat: Chat = {
            id: matchChatId,
            user: {
              id: profile.id,
              name: profile.name,
              username: profile.username || profile.id,
              avatar: profile.avatar || (profile.photos && profile.photos[0]) || '',
              online: profile.online ?? true,
              verified: profile.verified ?? true,
              followersCount: 350,
              followingCount: 120,
              postsCount: 15,
              consciousnessLevel: profile.consciousnessLevel,
              consciousnessTitle: profile.consciousnessTitle,
              zodiacSign: profile.zodiacSign
            },
            lastMessage: `💖 Взаимная симпатия! Резонанс ${profile.compatibilityScore || 95}%`,
            time: 'Только что',
            unread: 0,
            isFavorite: true,
            tagId: 'dating_match',
            messages: [
              {
                id: `m_match_${Date.now()}_1`,
                text: `✨ Поздравляем! У вас взаимная симпатия с ${profile.name} (${profile.age} лет, ${profile.city}). Резонанс душ: ${profile.compatibilityScore || 95}%!`,
                fromMe: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'read'
              },
              {
                id: `m_match_${Date.now()}_2`,
                text: `Привет! Я увидела твою анкету в New Age Знакомствах, наши ценности и цели очень резонируют! Буду рада познакомиться и пообщаться поближе ✨`,
                fromMe: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'read'
              }
            ]
          };

          setChatList(prev => {
            const updated = [newChat, ...prev.filter(c => c.id !== matchChatId)];
            localStorage.setItem('newage_messenger_chats', JSON.stringify(updated));
            return updated;
          });
          setActiveChatId(matchChatId);
        }
      }
    }
  }, [requestedChatId, datingProfileId]);

  const activeChat = chatList.find(c => c.id === activeChatId) ?? null;

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setChatList(prev => {
      const updated = prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            unread: 0,
            messages: c.messages.map(m => (!m.fromMe || !m.status ? { ...m, status: 'read' as const } : m))
          };
        }
        return c;
      });
      localStorage.setItem('newage_messenger_chats', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCreateGroup = (newGroup: Chat) => {
    const readGroup = {
      ...newGroup,
      unread: 0,
      messages: newGroup.messages.map(m => ({ ...m, status: 'read' as const }))
    };
    setChatList(prev => {
      const updated = [readGroup, ...prev];
      localStorage.setItem('newage_messenger_chats', JSON.stringify(updated));
      return updated;
    });
    setActiveChatId(readGroup.id);
  };

  const handleDeleteChat = (id: string) => {
    setChatList(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('newage_messenger_chats', JSON.stringify(updated));
      return updated;
    });
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };

  const handleUpdateChat = (chatId: string, updates: Partial<Chat>) => {
    setChatList(prev => {
      const updated = prev.map(c => c.id === chatId ? { ...c, ...updates } : c);
      localStorage.setItem('newage_messenger_chats', JSON.stringify(updated));
      return updated;
    });
  };

  if (isLoading) {
    return <div style={{ padding: '20px', color: '#fff' }}>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="messenger-guest-lock-container">
        <GuestLockPrompt
          featureName="Личные сообщения и чаты"
          title="Мессенджер защищён сквозным шифрованием"
          description="Чтобы начать общение с другими участниками, совершать звонки, создавать групповые чаты и делиться файлами, войдите в свой аккаунт или зарегистрируйтесь."
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
        <ChatWindow 
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

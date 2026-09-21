import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatList } from '../components/ChatList';
import { ChatWindowNew } from '../components/ChatWindowNew';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import { type Chat } from '../data/mock';
import { INITIAL_DATING_PROFILES } from '../data/datingData';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './MessengerPage.css';

export function MessengerPage() {
  const { currentUser, isAuthenticated, allAccounts } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedChatId = searchParams.get('chat') || searchParams.get('id');
  const datingProfileId = searchParams.get('datingProfile');
  const targetUserParam = searchParams.get('user') || searchParams.get('userId');

  const currentUserId = (isAuthenticated && currentUser?.id && currentUser.id !== 'guest')
    ? currentUser.id
    : 'guest';
  const CHATS_STORAGE_KEY = `newage_messenger_chats_${currentUserId}`;

  // Создание уникального персонального ИИ чата для каждого пользователя
  const createPersonalAiChat = (user?: { name?: string }): Chat => {
    const firstName = user?.name ? user.name.split(' ')[0] : '';
    return {
      id: 'chat_ai_oracle',
      user: {
        id: 'ai_oracle_0',
        name: 'Нейросетевой помощник',
        username: 'ai_oracle',
        avatar: '/ai_avatar.jpg',
        online: true,
        verified: true,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
      },
      lastMessage: '✨ Привет! Я твой личный ИИ помощник',
      time: 'Сейчас',
      unread: 0,
      isFavorite: true,
      messages: [
        {
          id: 'ai_welcome_1',
          text: `✨ Привет${firstName ? ', ' + firstName : ''}! Я **Нейросетевой помощник** — твой личный и конфиденциальный ИИ-ассистент в New Age.\n\n🔒 Все наши беседы строго приватны и доступны только тебе.\n\nЯ могу:\n• 💬 Отвечать на любые вопросы и поддерживать диалог\n• 🔮 Помогать в духовных практиках и саморазвитии\n• 📝 Помогать создавать тексты, посты и формулировать мысли\n• 💡 Подсказывать по всем возможностям платформы\n\nО чём бы ты хотел поговорить сегодня?`,
          fromMe: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        }
      ]
    };
  };

  const [chatList, setChatList] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(requestedChatId);

  // Загрузка чатов текущего пользователя
  useEffect(() => {
    let mounted = true;

    const loadChats = () => {
      let userChats: Chat[] = [];

      // Загружаем сохранённые чаты конкретного пользователя
      const saved = localStorage.getItem(CHATS_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            userChats = parsed
              .filter((c: any) => c && c.id && c.user && typeof c.user === 'object' && typeof c.user.name === 'string')
              .map((c: any) => ({
                ...c,
                lastMessage: String(c.lastMessage || ''),
                time: String(c.time || ''),
                user: {
                  ...c.user,
                  name: String(c.user.name || ''),
                  username: String(c.user.username || ''),
                  avatar: String(c.user.avatar || '')
                },
              }));
          }
        } catch { /* ignore */ }
      }

      // Личный ИИ ассистент всегда присутствует и уникален для этого пользователя
      const hasOracle = userChats.some(c => c.id === 'chat_ai_oracle');
      if (!hasOracle) {
        userChats = [createPersonalAiChat(currentUser), ...userChats];
      } else {
        const oldOracle = userChats.find(c => c.id === 'chat_ai_oracle')!;
        const updatedOracle = {
          ...oldOracle,
          user: {
            ...oldOracle.user,
            name: 'Нейросетевой помощник',
            avatar: '/ai_avatar.jpg',
          }
        };
        userChats = [updatedOracle, ...userChats.filter(c => c.id !== 'chat_ai_oracle')];
      }

      if (mounted) {
        setChatList(userChats);
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(userChats));
        setIsLoading(false);
      }
    };

    // Пробуем получить список чатов с сервера
    api.chats.list().then((data) => {
      if (mounted) {
        if (Array.isArray(data) && data.length > 0) {
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

          // Проверяем наличие личного ИИ чата из локального хранилища этого аккаунта
          let existingAiChat: Chat | undefined;
          const saved = localStorage.getItem(CHATS_STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                existingAiChat = parsed.find((c: any) => c.id === 'chat_ai_oracle');
              }
            } catch { /* ignore */ }
          }
          const personalAi = existingAiChat || createPersonalAiChat(currentUser);
          const chatsWithoutAi = normalized.filter((c: Chat) => c.id !== 'chat_ai_oracle');
          const finalChats = [personalAi, ...chatsWithoutAi];

          setChatList(finalChats);
          localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(finalChats));
          setIsLoading(false);
        } else {
          loadChats();
        }
      }
    }).catch(() => {
      if (mounted) loadChats();
    });

    return () => { mounted = false; };
  }, [currentUserId, isAuthenticated]);

  // Выбор начального активного чата
  useEffect(() => {
    if (!isLoading && !activeChatId && chatList.length > 0 && !requestedChatId && !datingProfileId && !targetUserParam) {
      setActiveChatId(chatList[0].id);
    }
  }, [isLoading, activeChatId, chatList, requestedChatId, datingProfileId, targetUserParam]);

  // Обработка параметров запроса: chat / id / datingProfile / user
  useEffect(() => {
    if (isLoading) return;

    if (requestedChatId) {
      setActiveChatId(requestedChatId);
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
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } else if (datingProfileId) {
      const matchChatId = `chat_dating_${datingProfileId}`;
      const existing = chatList.find(c => c.id === matchChatId);
      if (existing) {
        setActiveChatId(matchChatId);
      } else {
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
            localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));
            return updated;
          });
          setActiveChatId(matchChatId);
        }
      }
    } else if (targetUserParam) {
      const cleanTarget = targetUserParam.replace(/^@+/, '').trim();
      if (!cleanTarget) return;

      // Не открываем чат с самим собой
      const isSelf = currentUser && (
        cleanTarget === currentUser.id ||
        cleanTarget.toLowerCase() === (currentUser.username || '').toLowerCase()
      );
      if (isSelf) return;

      // Проверяем, есть ли уже диалог с этим пользователем
      const existing = chatList.find(c =>
        c.id === `chat_direct_${cleanTarget}` ||
        c.user?.id === cleanTarget ||
        (c.user?.username && c.user.username.toLowerCase() === cleanTarget.toLowerCase())
      );

      if (existing) {
        setActiveChatId(existing.id);
      } else {
        // Ищем информацию о собеседнике среди аккаунтов или сохранённых пользователей
        const matchedAccount = allAccounts.find(a =>
          a.id === cleanTarget ||
          (a.username && a.username.toLowerCase() === cleanTarget.toLowerCase())
        );

        const targetId = matchedAccount?.id || cleanTarget;
        const directChatId = `chat_direct_${targetId}`;
        const displayName = matchedAccount?.name || cleanTarget;
        const displayUsername = matchedAccount?.username || cleanTarget;
        const displayAvatar = matchedAccount?.avatar || '';

        const newDirectChat: Chat = {
          id: directChatId,
          user: {
            id: targetId,
            name: displayName,
            username: displayUsername,
            avatar: displayAvatar,
            online: true,
            verified: matchedAccount?.verified || false,
            followersCount: matchedAccount?.followersCount || 0,
            followingCount: matchedAccount?.followingCount || 0,
            postsCount: matchedAccount?.postsCount || 0,
          },
          lastMessage: '',
          time: 'Сейчас',
          unread: 0,
          messages: []
        };

        setChatList(prev => {
          const updated = [newDirectChat, ...prev.filter(c => c.id !== directChatId)];
          localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
        setActiveChatId(directChatId);
      }
    }
  }, [requestedChatId, datingProfileId, targetUserParam, isLoading]);

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
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));
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
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setActiveChatId(readGroup.id);
  };

  const handleDeleteChat = (id: string) => {
    setChatList(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };

  const handleUpdateChat = (chatId: string, updates: Partial<Chat>) => {
    setChatList(prev => {
      const updated = prev.map(c => c.id === chatId ? { ...c, ...updates } : c);
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));

      // Синхронизация для приватных диалогов 1-на-1 между локальными аккаунтами
      const targetChat = updated.find(c => c.id === chatId);
      if (
        targetChat &&
        targetChat.user?.id &&
        targetChat.user.id !== 'ai_oracle_0' &&
        !targetChat.isGroup &&
        targetChat.id !== 'chat_ai_oracle' &&
        currentUser?.id &&
        currentUser.id !== 'guest'
      ) {
        const recipientStorageKey = `newage_messenger_chats_${targetChat.user.id}`;
        try {
          const recRaw = localStorage.getItem(recipientStorageKey);
          let recChats: Chat[] = recRaw ? JSON.parse(recRaw) : [];
          if (!Array.isArray(recChats)) recChats = [];

          // Для получателя собеседник — это currentUser
          const partnerChatId = `chat_direct_${currentUser.id}`;
          const existingInRec = recChats.find(c => c.id === partnerChatId || c.user?.id === currentUser.id);

          // Инвертируем флаг fromMe, чтобы отправленные сообщения отображались у получателя как входящие
          const invertedMsgs = (targetChat.messages || []).map(m => ({
            ...m,
            fromMe: !m.fromMe,
          }));

          const recChat: Chat = {
            id: partnerChatId,
            user: {
              id: currentUser.id,
              name: currentUser.name,
              username: currentUser.username,
              avatar: currentUser.avatar || '',
              online: true,
              verified: currentUser.verified || false,
              followersCount: currentUser.followersCount || 0,
              followingCount: currentUser.followingCount || 0,
              postsCount: currentUser.postsCount || 0,
            },
            lastMessage: targetChat.lastMessage || '',
            time: targetChat.time || 'Сейчас',
            unread: (existingInRec?.unread || 0) + 1,
            messages: invertedMsgs,
          };

          const newRecChats = existingInRec
            ? recChats.map(c => (c.id === partnerChatId || c.user?.id === currentUser.id) ? recChat : c)
            : [recChat, ...recChats];

          localStorage.setItem(recipientStorageKey, JSON.stringify(newRecChats));
        } catch { /* ignore */ }
      }

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

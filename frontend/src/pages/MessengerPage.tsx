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

  useEffect(() => {
    let mounted = true;
    api.chats.list().then((data) => {
      if (mounted) {
        const saved = localStorage.getItem('newage_messenger_chats');
        let baseChats = data;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              baseChats = parsed;
            }
          } catch { /* ignore */ }
        }

        const firstId = baseChats[0]?.id;
        if (firstId) {
        baseChats = baseChats.map((c: Chat) => {
            if (c.id === firstId) {
              return {
                ...c,
                unread: 0,
                messages: c.messages.map((m: any) => (!m.fromMe || !m.status ? { ...m, status: 'read' as const } : m))
              };
            }
            return c;
          });
        }
        setChatList(baseChats);
        setIsLoading(false);
      }
    }).catch(err => {
      console.warn('Failed to load chats', err);
      if (mounted) setIsLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const [activeChatId, setActiveChatId] = useState<string | null>(requestedChatId);

  useEffect(() => {
    if (!isLoading && !activeChatId && chatList.length > 0 && !requestedChatId && !datingProfileId) {
      setActiveChatId(chatList[0].id);
    }
  }, [isLoading, activeChatId, chatList, requestedChatId, datingProfileId]);

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

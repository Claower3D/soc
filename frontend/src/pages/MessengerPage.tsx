import { useState } from 'react';
import { ChatList } from '../components/ChatList';
import { ChatWindow } from '../components/ChatWindow';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import { chats, type Chat } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import './MessengerPage.css';

export function MessengerPage() {
  const { isAuthenticated } = useAuth();
  const [chatList, setChatList] = useState<Chat[]>(() => {
    // If initial active chat exists, mark it read on initial load
    const firstId = chats[0]?.id;
    if (!firstId) return chats;
    return chats.map(c => {
      if (c.id === firstId) {
        return {
          ...c,
          unread: 0,
          messages: c.messages.map(m => (!m.fromMe || !m.status ? { ...m, status: 'read' as const } : m))
        };
      }
      return c;
    });
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(chats[0]?.id ?? null);

  const activeChat = chatList.find(c => c.id === activeChatId) ?? null;

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setChatList(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          unread: 0,
          messages: c.messages.map(m => (!m.fromMe || !m.status ? { ...m, status: 'read' as const } : m))
        };
      }
      return c;
    }));
  };

  const handleCreateGroup = (newGroup: Chat) => {
    const readGroup = {
      ...newGroup,
      unread: 0,
      messages: newGroup.messages.map(m => ({ ...m, status: 'read' as const }))
    };
    setChatList(prev => [readGroup, ...prev]);
    setActiveChatId(readGroup.id);
  };

  const handleDeleteChat = (id: string) => {
    setChatList(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };

  const handleUpdateChat = (chatId: string, updates: Partial<Chat>) => {
    setChatList(prev => prev.map(c => c.id === chatId ? { ...c, ...updates } : c));
  };

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

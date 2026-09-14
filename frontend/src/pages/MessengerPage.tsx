import { useState } from 'react';
import { ChatList } from '../components/ChatList';
import { ChatWindow } from '../components/ChatWindow';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import { chats, type Chat } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import './MessengerPage.css';

export function MessengerPage() {
  const { isAuthenticated } = useAuth();
  const [chatList, setChatList] = useState<Chat[]>(chats);
  const [activeChatId, setActiveChatId] = useState<string | null>(chats[0]?.id ?? null);

  const activeChat = chatList.find(c => c.id === activeChatId) ?? null;

  const handleDeleteChat = (id: string) => {
    setChatList(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
    }
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
          onSelectChat={setActiveChatId}
          onDeleteChat={handleDeleteChat}
        />
      </div>
      <div className={`messenger-chat ${!activeChatId ? 'hide-mobile' : ''}`}>
        <ChatWindow 
          chat={activeChat} 
          onBack={() => setActiveChatId(null)} 
          onDeleteChat={handleDeleteChat}
        />
      </div>
    </div>
  );
}

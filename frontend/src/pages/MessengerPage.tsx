import { useState } from 'react';
import { ChatList } from '../components/ChatList';
import { ChatWindow } from '../components/ChatWindow';
import { chats, type Chat } from '../data/mock';
import './MessengerPage.css';

export function MessengerPage() {
  const [chatList, setChatList] = useState<Chat[]>(chats);
  const [activeChatId, setActiveChatId] = useState<string | null>(chats[0]?.id ?? null);

  const activeChat = chatList.find(c => c.id === activeChatId) ?? null;

  const handleDeleteChat = (id: string) => {
    setChatList(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };

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

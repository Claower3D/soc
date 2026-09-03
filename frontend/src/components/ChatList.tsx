import { useState } from 'react';
import { Search, Users, Trash2 } from 'lucide-react';
import type { Chat } from '../data/mock';
import './ChatList.css';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat?: (id: string) => void;
}

export function ChatList({ chats, activeChatId, onSelectChat, onDeleteChat }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const filteredChats = chats.filter(chat => {
    const title = chat.groupTitle || chat.user.name;
    return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Поиск диалогов и групп..." 
            className="search-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="chat-items">
        {filteredChats.length === 0 ? (
          <div className="empty-search-chats">
            <span>Диалоги не найдены</span>
          </div>
        ) : (
          filteredChats.map(chat => {
            const isGroup = chat.isGroup;
            const displayName = chat.groupTitle || chat.user.name;
            const displayAvatar = chat.groupAvatar || chat.user.avatar;

            return (
              <div
                key={chat.id}
                className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="chat-avatar-wrapper">
                  <img src={displayAvatar} alt={displayName} className="chat-avatar" />
                  {!isGroup && chat.user.online && <div className="online-indicator" />}
                  {isGroup && (
                    <div className="group-badge-circle" title="Группа конференции">
                      <Users size={10} />
                    </div>
                  )}
                </div>

                <div className="chat-item-content">
                  <div className="chat-item-top">
                    <span className="chat-name">{displayName}</span>
                    <span className="chat-time">{chat.time}</span>
                  </div>

                  <div className="chat-item-bottom">
                    <span className="chat-preview">{chat.lastMessage}</span>
                    <div className="chat-item-actions-wrap">
                      {chat.unread > 0 && (
                        <span className="unread-badge">{chat.unread}</span>
                      )}
                      {onDeleteChat && (
                        <button
                          className="chat-delete-quick-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChatToDelete(chat.id);
                          }}
                          title="Удалить диалог"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Chat Confirmation Modal */}
      {chatToDelete && (
        <div className="tg-modal-overlay" onClick={() => setChatToDelete(null)}>
          <div className="tg-delete-modal-box" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon-badge">
              <Trash2 size={24} />
            </div>
            <h3>Удалить этот чат?</h3>
            <p className="delete-modal-desc">
              Вся переписка с этим пользователем или группой будет удалена из вашего списка диалогов.
            </p>
            <div className="delete-modal-buttons">
              <button className="modal-btn cancel" onClick={() => setChatToDelete(null)}>
                Отмена
              </button>
              <button 
                className="modal-btn delete"
                onClick={() => {
                  if (onDeleteChat) onDeleteChat(chatToDelete);
                  setChatToDelete(null);
                }}
              >
                Удалить чат
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

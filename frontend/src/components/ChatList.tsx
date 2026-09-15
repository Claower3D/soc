import { useState } from 'react';
import { Search, Users, Trash2, Plus, Sparkles, X, Check } from 'lucide-react';
import { initialUsers, currentUser, type Chat } from '../data/mock';
import './ChatList.css';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  onCreateGroup?: (groupChat: Chat) => void;
}

export function ChatList({ chats, activeChatId, onSelectChat, onDeleteChat, onCreateGroup }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const filteredChats = chats.filter(chat => {
    const title = chat.groupTitle || chat.user.name;
    return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim()) return;

    const newGroup: Chat = {
      id: `group_${Date.now()}`,
      user: currentUser,
      isGroup: true,
      groupTitle: groupTitle.trim(),
      groupAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80',
      membersCount: selectedUserIds.length + 1,
      lastMessage: 'Группа успешно создана',
      time: 'Только что',
      unread: 0,
      messages: [
        {
          id: `m_init_${Date.now()}`,
          text: `🎉 Беседа «${groupTitle.trim()}» создана! Участников: ${selectedUserIds.length + 1}`,
          fromMe: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    if (onCreateGroup) {
      onCreateGroup(newGroup);
    }
    onSelectChat(newGroup.id);
    setShowCreateGroupModal(false);
    setGroupTitle('');
    setSelectedUserIds([]);
  };

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <div className="chat-list-header-top">
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
          <button 
            type="button" 
            className="btn-create-group-trigger"
            onClick={() => setShowCreateGroupModal(true)}
            title="Создать беседу (группу)"
          >
            <Plus size={18} />
          </button>
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
            const isAi = chat.id === 'ai_guru_bot' || chat.isSystem;
            const displayName = chat.groupTitle || chat.user.name;
            const displayAvatar = chat.groupAvatar || chat.user.avatar;

            return (
              <div
                key={chat.id}
                className={`chat-item ${activeChatId === chat.id ? 'active' : ''} ${isAi ? 'chat-item-ai' : ''}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="chat-avatar-wrapper">
                  <img src={displayAvatar} alt={displayName} className="chat-avatar" />
                  {!isGroup && chat.user.online && <div className="online-indicator" />}
                  {isGroup && (
                    <div className="group-badge-circle" title="Групповая беседа">
                      <Users size={10} />
                    </div>
                  )}
                  {isAi && (
                    <div className="ai-badge-circle" title="ИИ-Наставник (системный)">
                      <Sparkles size={10} />
                    </div>
                  )}
                </div>

                <div className="chat-item-content">
                  <div className="chat-item-top">
                    <span className="chat-name">
                      {displayName}
                      {isAi && <span className="ai-tag-inline">ИИ</span>}
                    </span>
                    <span className="chat-time">{chat.time}</span>
                  </div>

                  <div className="chat-item-bottom">
                    <span className="chat-preview">{chat.lastMessage}</span>
                    <div className="chat-item-actions-wrap">
                      {chat.unread > 0 && (
                        <span className="unread-badge">{chat.unread}</span>
                      )}
                      {/* Can delete chats EXCEPT AI Guru */}
                      {onDeleteChat && !isAi && (
                        <button
                          type="button"
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

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="tg-modal-overlay" onClick={() => setShowCreateGroupModal(false)}>
          <div className="tg-group-modal-box" onClick={e => e.stopPropagation()}>
            <div className="group-modal-header">
              <div className="group-modal-header-title">
                <Users size={20} className="group-modal-icon" />
                <h3>Создать беседу</h3>
              </div>
              <button 
                type="button" 
                className="group-modal-close-btn"
                onClick={() => setShowCreateGroupModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="group-modal-form">
              <div className="group-form-group">
                <label>Название беседы:</label>
                <input 
                  type="text" 
                  className="group-input" 
                  placeholder="Например: Мастера Осознанности, Проект Спасение..." 
                  value={groupTitle}
                  onChange={e => setGroupTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="group-form-group">
                <label>Выберите участников ({selectedUserIds.length}):</label>
                <div className="group-users-picker">
                  {initialUsers.slice(1, 8).map(u => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <div 
                        key={u.id} 
                        className={`group-user-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleUserSelection(u.id)}
                      >
                        <img src={u.avatar} alt={u.name} className="group-user-avatar" />
                        <div className="group-user-info">
                          <span className="group-user-name">{u.name}</span>
                          <span className="group-user-role">
                            {u.consciousnessLevel ? `${u.consciousnessLevel} класс` : `@${u.username}`}
                          </span>
                        </div>
                        <div className={`group-user-checkbox ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <Check size={13} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="group-modal-footer">
                <button 
                  type="button" 
                  className="modal-btn cancel" 
                  onClick={() => setShowCreateGroupModal(false)}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="modal-btn create" 
                  disabled={!groupTitle.trim()}
                >
                  Создать беседу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

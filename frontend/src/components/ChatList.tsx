import { useState } from 'react';
import { 
  Search, Users, Trash2, Plus, Sparkles, X, Check, 
  Archive, ArchiveRestore, Lock, Unlock, KeyRound, Shield
} from 'lucide-react';
import { initialUsers, currentUser, type Chat } from '../data/mock';
import './ChatList.css';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  onCreateGroup?: (groupChat: Chat) => void;
  onUpdateChat?: (chatId: string, updates: Partial<Chat>) => void;
}

export function ChatList({ 
  chats, 
  activeChatId, 
  onSelectChat, 
  onDeleteChat, 
  onCreateGroup,
  onUpdateChat 
}: ChatListProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'archive' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Locked chats & PIN protection
  const [isLockedUnlocked, setIsLockedUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetLockedChatId, setTargetLockedChatId] = useState<string | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Set PIN for a chat modal
  const [chatToSetLock, setChatToSetLock] = useState<Chat | null>(null);
  const [newChatPin, setNewChatPin] = useState('1234');

  const archivedCount = chats.filter(c => c.isArchived).length;
  const lockedCount = chats.filter(c => c.isLocked).length;

  const filteredChats = chats.filter(chat => {
    // Tab filter
    if (activeTab === 'all') {
      if (chat.isArchived) return false;
      if (chat.isLocked) return false;
    } else if (activeTab === 'archive') {
      if (!chat.isArchived) return false;
    } else if (activeTab === 'locked') {
      if (!chat.isLocked) return false;
    }

    // Search filter
    const title = chat.groupTitle || chat.user.name;
    return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleChatClick = (chat: Chat) => {
    if (chat.isLocked && !isLockedUnlocked) {
      setTargetLockedChatId(chat.id);
      setEnteredPin('');
      setPinError(false);
      setShowPinModal(true);
      return;
    }
    onSelectChat(chat.id);
  };

  const handleTabClick = (tab: 'all' | 'archive' | 'locked') => {
    if (tab === 'locked' && !isLockedUnlocked) {
      setTargetLockedChatId('unlock_tab');
      setEnteredPin('');
      setPinError(false);
      setShowPinModal(true);
      return;
    }
    setActiveTab(tab);
  };

  const handlePinDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const verifyPin = (pin: string) => {
    // Default master PIN is 1234 or chat-specific PIN
    let valid = false;
    if (targetLockedChatId === 'unlock_tab') {
      valid = pin === '1234';
    } else {
      const targetChat = chats.find(c => c.id === targetLockedChatId);
      valid = pin === (targetChat?.pinCode || '1234');
    }

    if (valid) {
      setIsLockedUnlocked(true);
      setShowPinModal(false);
      if (targetLockedChatId === 'unlock_tab') {
        setActiveTab('locked');
      } else if (targetLockedChatId) {
        onSelectChat(targetLockedChatId);
      }
      setTargetLockedChatId(null);
      setEnteredPin('');
      setPinError(false);
    } else {
      setPinError(true);
      setTimeout(() => {
        setEnteredPin('');
        setPinError(false);
      }, 700);
    }
  };

  const handleToggleArchive = (chatId: string, currentArchived?: boolean) => {
    if (onUpdateChat) {
      onUpdateChat(chatId, { isArchived: !currentArchived });
    }
  };

  const handleSaveChatLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatToSetLock) return;
    if (onUpdateChat) {
      onUpdateChat(chatToSetLock.id, {
        isLocked: true,
        pinCode: newChatPin.trim() || '1234'
      });
    }
    setChatToSetLock(null);
  };

  const handleRemoveLock = (chatId: string) => {
    if (onUpdateChat) {
      onUpdateChat(chatId, { isLocked: false, pinCode: undefined });
    }
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

        {/* Filter Tabs: Все / Архив / Закрытые */}
        <div className="chat-list-filter-tabs">
          <button
            type="button"
            className={`chat-tab-pill ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabClick('all')}
          >
            Все
          </button>
          <button
            type="button"
            className={`chat-tab-pill ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => handleTabClick('archive')}
          >
            <Archive size={14} />
            <span>Архив</span>
            {archivedCount > 0 && <span className="tab-counter-badge">{archivedCount}</span>}
          </button>
          <button
            type="button"
            className={`chat-tab-pill ${activeTab === 'locked' ? 'active' : ''}`}
            onClick={() => handleTabClick('locked')}
          >
            {isLockedUnlocked ? <Unlock size={14} className="unlocked-icon" /> : <Lock size={14} />}
            <span>Закрытые</span>
            {lockedCount > 0 && <span className="tab-counter-badge">{lockedCount}</span>}
          </button>
        </div>
      </div>

      <div className="chat-items">
        {filteredChats.length === 0 ? (
          <div className="empty-search-chats">
            {activeTab === 'archive' ? (
              <div className="empty-tab-box">
                <Archive size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                <p>В архиве пока нет диалогов</p>
              </div>
            ) : activeTab === 'locked' ? (
              <div className="empty-tab-box">
                <Shield size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                <p>Нет закрытых диалогов с PIN-кодом</p>
                <small style={{ color: 'var(--color-text-tertiary)' }}>Наведите на диалог и нажмите замочек, чтобы закрыть его</small>
              </div>
            ) : (
              <span>Диалоги не найдены</span>
            )}
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
                className={`chat-item ${activeChatId === chat.id ? 'active' : ''} ${isAi ? 'chat-item-ai' : ''} ${chat.isLocked ? 'chat-item-locked' : ''}`}
                onClick={() => handleChatClick(chat)}
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
                  {chat.isLocked && (
                    <div className="locked-badge-circle" title="Защищено PIN-кодом">
                      <Lock size={10} />
                    </div>
                  )}
                </div>

                <div className="chat-item-content">
                  <div className="chat-item-top">
                    <span className="chat-name">
                      {displayName}
                      {isAi && <span className="ai-tag-inline">ИИ</span>}
                      {chat.isArchived && <span className="archive-tag-inline">Архив</span>}
                    </span>
                    <span className="chat-time">{chat.time}</span>
                  </div>

                  <div className="chat-item-bottom">
                    <span className="chat-preview">
                      {chat.isLocked && !isLockedUnlocked ? '🔒 Содержимое защищено PIN' : chat.lastMessage}
                    </span>
                    <div className="chat-item-actions-wrap">
                      {chat.unread > 0 && (
                        <span className="unread-badge">{chat.unread}</span>
                      )}

                      {/* Quick Action Buttons: Archive / Unarchive */}
                      {!isAi && (
                        <button
                          type="button"
                          className="chat-action-quick-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleArchive(chat.id, chat.isArchived);
                          }}
                          title={chat.isArchived ? "Разархивировать" : "В архив"}
                        >
                          {chat.isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                        </button>
                      )}

                      {/* Quick Action Buttons: Lock with PIN / Unlock */}
                      {!isAi && (
                        <button
                          type="button"
                          className={`chat-action-quick-btn ${chat.isLocked ? 'locked-active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (chat.isLocked) {
                              handleRemoveLock(chat.id);
                            } else {
                              setChatToSetLock(chat);
                              setNewChatPin('1234');
                            }
                          }}
                          title={chat.isLocked ? "Снять защиту PIN-кодом" : "Закрыть чат на PIN"}
                        >
                          {chat.isLocked ? <Unlock size={13} /> : <Lock size={13} />}
                        </button>
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
                          <Trash2 size={13} />
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

      {/* PIN Enter Modal (to open locked chat or tab) */}
      {showPinModal && (
        <div className="tg-modal-overlay" onClick={() => setShowPinModal(false)}>
          <div className="tg-pin-modal-box" onClick={e => e.stopPropagation()}>
            <div className="pin-modal-icon-badge">
              <KeyRound size={26} />
            </div>
            <h3>Введите PIN-код</h3>
            <p className="pin-modal-desc">
              Этот диалог защищён приватным паролем. Введите 4-значный код (по умолчанию: <strong>1234</strong>).
            </p>

            {/* Dots */}
            <div className={`pin-dots-row ${pinError ? 'shake error' : ''}`}>
              {[0, 1, 2, 3].map(idx => (
                <span key={idx} className={`pin-dot ${enteredPin.length > idx ? 'filled' : ''}`} />
              ))}
            </div>

            {pinError && <span className="pin-error-text">Неверный PIN-код, попробуйте еще раз</span>}

            {/* Numpad */}
            <div className="pin-numpad-grid">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(btn => (
                <button
                  key={btn}
                  type="button"
                  className={`numpad-btn ${btn === 'C' || btn === '⌫' ? 'action' : ''}`}
                  onClick={() => {
                    if (btn === 'C') {
                      setEnteredPin('');
                      setPinError(false);
                    } else if (btn === '⌫') {
                      setEnteredPin(p => p.slice(0, -1));
                      setPinError(false);
                    } else {
                      handlePinDigit(btn);
                    }
                  }}
                >
                  {btn}
                </button>
              ))}
            </div>

            <div className="pin-modal-cancel">
              <button type="button" className="modal-btn cancel" onClick={() => setShowPinModal(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set PIN Configuration Modal */}
      {chatToSetLock && (
        <div className="tg-modal-overlay" onClick={() => setChatToSetLock(null)}>
          <div className="tg-group-modal-box" onClick={e => e.stopPropagation()}>
            <div className="group-modal-header">
              <div className="group-modal-header-title">
                <Lock size={20} className="group-modal-icon" />
                <h3>Защитить диалог PIN-кодом</h3>
              </div>
              <button 
                type="button" 
                className="group-modal-close-btn"
                onClick={() => setChatToSetLock(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveChatLock} className="group-modal-form">
              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Чат <strong>«{chatToSetLock.groupTitle || chatToSetLock.user.name}»</strong> будет скрыт из общего списка и перемещен во вкладку «Закрытые 🔒».
              </p>

              <div className="group-form-group">
                <label>Задайте 4-значный PIN-код:</label>
                <input 
                  type="password"
                  maxLength={4}
                  className="group-input" 
                  placeholder="1234" 
                  value={newChatPin}
                  onChange={e => setNewChatPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  autoFocus
                  required
                />
                <small style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                  Запомните этот код, он потребуется для каждого входа в этот чат.
                </small>
              </div>

              <div className="group-modal-footer">
                <button 
                  type="button" 
                  className="modal-btn cancel" 
                  onClick={() => setChatToSetLock(null)}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="modal-btn create" 
                  disabled={newChatPin.length < 4}
                >
                  Установить защиту
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

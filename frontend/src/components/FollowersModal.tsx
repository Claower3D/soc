import { X, Search, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './FollowersModal.css';

type Tab = 'friends' | 'followers' | 'following';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: 'Подписчики' | 'Подписки' | 'Критики' | 'Друзья';
  currentUserId: string;
  isMe?: boolean;
}

interface SimpleUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  verified?: boolean;
  isFriend?: boolean;
}

export function FollowersModal({ isOpen, onClose, title, currentUserId, isMe }: FollowersModalProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(
    title === 'Друзья' ? 'friends' : title === 'Подписчики' ? 'followers' : 'following'
  );
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Load users when tab changes
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setUsers([]);

    const fetchUsers = async () => {
      try {
        let endpoint = '';
        if (activeTab === 'friends') {
          endpoint = `/api/users/${currentUserId}/friends`;
        } else if (activeTab === 'followers') {
          endpoint = `/api/users/${currentUserId}/followers`;
        } else {
          endpoint = `/api/users/${currentUserId}/following`;
        }

        const token = localStorage.getItem('new_age_jwt_token') || localStorage.getItem('newage_token') || '';
        const res = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'ok' && data.data?.users) {
          setUsers(data.data.users);
        }
      } catch {
        // fallback — пустой список
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, activeTab, currentUserId]);

  if (!isOpen) return null;

  const filteredUsers = search.trim()
    ? users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleRemoveFriend = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('new_age_jwt_token') || localStorage.getItem('newage_token') || '';
      await fetch(`/api/users/${userId}/friend`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch { /* ignore */ }
  };

  const handleUserClick = (user: SimpleUser) => {
    onClose();
    navigate(`/profile/${user.id}`);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'friends', label: 'Друзья' },
    { key: 'followers', label: 'Подписчики' },
    { key: 'following', label: 'Подписки' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container followers-modal-3tab" onClick={e => e.stopPropagation()}>
        {/* Tabs header */}
        <div className="followers-tabs-header">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`followers-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="followers-search-bar">
          <Search size={16} className="followers-search-icon" />
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="followers-search-input"
          />
        </div>

        {/* List */}
        <div className="modal-body">
          {loading ? (
            <div className="followers-loading">Загрузка...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="followers-empty">
              {search ? 'Ничего не найдено' : 'Список пуст'}
            </div>
          ) : (
            <div className="followers-list">
              {filteredUsers.map(user => {
                const isMeUser = currentUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    className="follower-row"
                    onClick={() => handleUserClick(user)}
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                      alt={user.name}
                      className="follower-avatar"
                    />
                    <div className="follower-info">
                      <span className="follower-name">@{user.username || user.name}</span>
                      <span className="follower-username">{user.name}</span>
                    </div>
                    {!isMeUser && activeTab === 'friends' && isMe && (
                      <button
                        className="follower-btn remove-friend"
                        onClick={e => handleRemoveFriend(user.id, e)}
                      >
                        <UserMinus size={14} /> Удалить
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

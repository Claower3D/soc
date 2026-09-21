import { X, Search, UserMinus, UserCheck, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getAllUsersPool, 
  getFollowersForUser, 
  getFollowingForUser,
  isUserFollowed,
  toggleUserFollowAsync,
  toggleUserFollow
} from '../utils/followStorage';
import { api } from '../api';
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
  isFollowed?: boolean;
}

export function FollowersModal({ isOpen, onClose, title, currentUserId, isMe }: FollowersModalProps) {
  const navigate = useNavigate();
  const { currentUser, allAccounts } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(
    title === 'Друзья' ? 'friends' : title === 'Подписчики' ? 'followers' : 'following'
  );
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [followRevision, setFollowRevision] = useState(0);

  // Load users when tab changes
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setUsers([]);

    const fetchUsers = async () => {
      let remoteUsers: SimpleUser[] = [];
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
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        const rawList = Array.isArray(data.data) 
          ? data.data 
          : (data.data?.users || data.users || (Array.isArray(data) ? data : []));

        if (Array.isArray(rawList) && rawList.length > 0) {
          remoteUsers = rawList;
        }
      } catch {
        // network or server fallback
      }

      // Fallback or merge with local followStorage pool
      if (remoteUsers.length === 0) {
        const pool = getAllUsersPool(currentUser, allAccounts);
        if (activeTab === 'followers') {
          const localList = getFollowersForUser(currentUserId, pool, currentUser?.id);
          remoteUsers = localList as SimpleUser[];
        } else if (activeTab === 'following') {
          const localList = getFollowingForUser(currentUserId, pool, !!isMe, currentUser?.id);
          remoteUsers = localList as SimpleUser[];
        } else if (activeTab === 'friends') {
          const myFollowers = getFollowersForUser(currentUserId, pool, currentUser?.id);
          const myFollowing = getFollowingForUser(currentUserId, pool, !!isMe, currentUser?.id);
          const followingIds = new Set(myFollowing.map(u => u.id));
          remoteUsers = myFollowers.filter(u => followingIds.has(u.id)) as SimpleUser[];
        }
      }

      setUsers(remoteUsers);
      setLoading(false);
    };

    fetchUsers();
  }, [isOpen, activeTab, currentUserId, currentUser, allAccounts, isMe, followRevision]);

  if (!isOpen) return null;

  const filteredUsers = search.trim()
    ? users.filter(u =>
        (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
        (u.username && u.username.toLowerCase().includes(search.toLowerCase()))
      )
    : users;

  const handleRemoveFriend = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.users.removeFriend(userId);
      toggleUserFollow(userId, currentUser?.id);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setFollowRevision(r => r + 1);
    } catch { /* ignore */ }
  };

  const handleToggleFollowFromModal = async (targetUser: SimpleUser, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const isCurrentlyFollowing = isUserFollowed(targetUser.id, currentUser?.id);
      await toggleUserFollowAsync(targetUser.id, currentUser?.id, targetUser as any);
      setFollowRevision(r => r + 1);

      if (activeTab === 'following' && isMe && isCurrentlyFollowing) {
        setUsers(prev => prev.filter(u => u.id !== targetUser.id));
      }
    } catch { /* ignore */ }
  };

  const handleUserClick = (user: SimpleUser) => {
    onClose();
    navigate(user.username ? `/profile/@${user.username.replace(/^@+/, '')}` : `/profile/${user.id}`);
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
                const followedByMe = isUserFollowed(user.id, currentUser?.id);

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

                    {!isMeUser && (
                      <div className="follower-action" onClick={e => e.stopPropagation()}>
                        {activeTab === 'friends' && isMe ? (
                          <button
                            className="follower-btn remove-friend"
                            onClick={e => handleRemoveFriend(user.id, e)}
                            title="Удалить из друзей"
                          >
                            <UserMinus size={14} /> Удалить
                          </button>
                        ) : activeTab === 'following' && isMe ? (
                          <button
                            className="follower-btn following"
                            onClick={e => handleToggleFollowFromModal(user, e)}
                            title="Отписаться"
                          >
                            <UserCheck size={14} /> Отписаться
                          </button>
                        ) : activeTab === 'followers' && isMe ? (
                          followedByMe ? (
                            <button
                              className="follower-btn following"
                              onClick={e => handleToggleFollowFromModal(user, e)}
                              title="Вы подписаны (нажмите, чтобы отписаться)"
                            >
                              <UserCheck size={14} /> Вы подписаны
                            </button>
                          ) : (
                            <button
                              className="follower-btn not-following"
                              onClick={e => handleToggleFollowFromModal(user, e)}
                              title="Подписаться в ответ"
                            >
                              <UserPlus size={14} /> В ответ
                            </button>
                          )
                        ) : (
                          // Viewing another user's list
                          followedByMe ? (
                            <button
                              className="follower-btn following"
                              onClick={e => handleToggleFollowFromModal(user, e)}
                              title="Отписаться"
                            >
                              <UserCheck size={14} /> Вы подписаны
                            </button>
                          ) : (
                            <button
                              className="follower-btn not-following"
                              onClick={e => handleToggleFollowFromModal(user, e)}
                              title="Подписаться"
                            >
                              <UserPlus size={14} /> Подписаться
                            </button>
                          )
                        )}
                      </div>
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

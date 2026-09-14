import { X, Check, UserPlus } from 'lucide-react';
import { type User } from '../data/mock';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { 
  getAllUsersPool, 
  getFollowersForUser, 
  getFollowingForUser, 
  getCriticsForUser, 
  toggleUserFollow,
  getStoredFollowingIds 
} from '../utils/followStorage';
import { useAuth } from '../context/AuthContext';
import './FollowersModal.css';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: 'Подписчики' | 'Подписки' | 'Критики';
  currentUserId: string;
  isMe?: boolean;
}

export function FollowersModal({ isOpen, onClose, title, currentUserId, isMe }: FollowersModalProps) {
  const navigate = useNavigate();
  const { currentUser, allAccounts } = useAuth();
  const [followingIds, setFollowingIds] = useState<string[]>(() => getStoredFollowingIds());

  useEffect(() => {
    const handleSync = () => {
      setFollowingIds(getStoredFollowingIds());
    };
    window.addEventListener('follow_change', handleSync);
    return () => window.removeEventListener('follow_change', handleSync);
  }, []);

  const allUsers = useMemo(() => {
    return getAllUsersPool(currentUser, allAccounts);
  }, [currentUser, allAccounts]);

  const listUsers: User[] = useMemo(() => {
    if (title === 'Подписчики') {
      return getFollowersForUser(currentUserId, allUsers, currentUser?.id);
    }
    if (title === 'Подписки') {
      return getFollowingForUser(currentUserId, allUsers, !!isMe);
    }
    return getCriticsForUser(currentUserId, allUsers);
  }, [title, currentUserId, allUsers, isMe, currentUser?.id]);

  if (!isOpen) return null;

  const handleToggle = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleUserFollow(userId);
    setFollowingIds(getStoredFollowingIds());
  };

  const handleUserClick = (user: User) => {
    onClose();
    navigate(`/profile/${user.id === 'me' ? 'me' : user.id}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {title === 'Критики' ? '🔥 Критики профиля' : title}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {listUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-tertiary)' }}>
              <span>Список пуст</span>
            </div>
          ) : (
            <div className="followers-list">
              {listUsers.map(user => {
                const isSubscribed = followingIds.includes(user.id);
                const isMeUser = currentUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    className="follower-row"
                    onClick={() => handleUserClick(user)}
                  >
                    <img src={user.avatar} alt={user.name} className="follower-avatar" />
                    <div className="follower-info">
                      <span className="follower-name">{user.name}</span>
                      <span className="follower-username">@{user.username}</span>
                    </div>
                    {!isMeUser && (
                      <button
                        className={`follower-btn ${isSubscribed ? 'following' : 'not-following'}`}
                        onClick={e => handleToggle(user.id, e)}
                      >
                        {isSubscribed ? (
                          <>
                            <Check size={14} /> Подписки
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} /> Подписаться
                          </>
                        )}
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

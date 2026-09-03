import { X, Check, UserPlus } from 'lucide-react';
import { initialUsers, type User } from '../data/mock';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './FollowersModal.css';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: 'Подписчики' | 'Подписки';
  currentUserId: string;
}

export function FollowersModal({ isOpen, onClose, title, currentUserId }: FollowersModalProps) {
  const navigate = useNavigate();
  // Generate mock followers/following list from initialUsers excluding current user
  const otherUsers = initialUsers.filter(u => u.id !== currentUserId);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({
    '1': true,
    '2': false,
    '3': true,
    '4': true,
    '5': false,
    '6': true,
    '7': false,
    '8': true,
  });

  if (!isOpen) return null;

  const toggleFollow = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowingMap(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleUserClick = (user: User) => {
    onClose();
    navigate(`/profile/${user.id === 'me' ? 'me' : user.id}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="followers-list">
            {otherUsers.map(user => {
              const isFollowing = followingMap[user.id] ?? false;
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
                  {user.id !== 'me' && (
                    <button
                      className={`follower-btn ${isFollowing ? 'following' : 'not-following'}`}
                      onClick={e => toggleFollow(user.id, e)}
                    >
                      {isFollowing ? (
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
        </div>
      </div>
    </div>
  );
}

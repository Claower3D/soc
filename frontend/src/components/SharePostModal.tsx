import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Search, Send, Check, Copy, Sparkles, Download, 
  Smartphone, User as UserIcon, MessageSquare
} from 'lucide-react';
import { type Post, type User } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { getAvatarUrl, handleAvatarError } from '../utils/avatar';
import './SharePostModal.css';

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onToast?: (message: string) => void;
}

export function SharePostModal({ isOpen, onClose, post, onToast }: SharePostModalProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [sentUserIds, setSentUserIds] = useState<Set<string>>(new Set());
  const [customNote, setCustomNote] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPublishingStory, setIsPublishingStory] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isMobile = typeof navigator !== 'undefined' && 
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  const postUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/post/${post.id}` 
    : `/post/${post.id}`;

  const currentUserId = (isAuthenticated && currentUser?.id && currentUser.id !== 'guest')
    ? currentUser.id
    : 'guest';

  // Load available users from API and local messenger cache
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchUsers = async () => {
      const collectedUsers: User[] = [];
      const seenIds = new Set<string>();

      // 1. From local messenger chats (recent interactions)
      try {
        const CHATS_STORAGE_KEY = `newage_messenger_chats_${currentUserId}`;
        const localChats = localStorage.getItem(CHATS_STORAGE_KEY);
        if (localChats) {
          const parsed = JSON.parse(localChats);
          if (Array.isArray(parsed)) {
            for (const c of parsed) {
              if (c?.user?.id && c.user.id !== currentUserId && c.user.id !== 'chat_ai_oracle' && !seenIds.has(c.user.id)) {
                seenIds.add(c.user.id);
                collectedUsers.push(c.user);
              }
            }
          }
        }
      } catch (_) {}

      // 2. From API users list
      try {
        const res = await api.users.list();
        const usersArray = Array.isArray(res) ? res : res?.users || [];
        for (const u of usersArray) {
          if (u?.id && u.id !== currentUserId && !seenIds.has(u.id)) {
            seenIds.add(u.id);
            collectedUsers.push(u);
          }
        }
      } catch (_) {}

      // 3. Fallback mock author if not present
      if (post.user && post.user.id !== currentUserId && !seenIds.has(post.user.id)) {
        collectedUsers.push(post.user);
      }

      if (isMounted) {
        setUsersList(collectedUsers);
      }
    };

    fetchUsers();
  }, [isOpen, currentUserId, post.user]);

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return usersList;
    const q = searchQuery.toLowerCase().trim();
    return usersList.filter(u => 
      u.name?.toLowerCase().includes(q) || 
      u.username?.toLowerCase().includes(q)
    );
  }, [usersList, searchQuery]);

  if (!isOpen) return null;

  // Handle direct message send to user
  const handleSendToUser = (targetUser: User) => {
    if (!targetUser?.id) return;
    const CHATS_STORAGE_KEY = `newage_messenger_chats_${currentUserId}`;
    
    try {
      const localData = localStorage.getItem(CHATS_STORAGE_KEY);
      let chats = localData ? JSON.parse(localData) : [];
      if (!Array.isArray(chats)) chats = [];

      let existingChat = chats.find((c: any) => c?.user?.id === targetUser.id);
      const textMessage = customNote.trim() 
        ? `${customNote.trim()}\n\n🔗 ${postUrl}` 
        : `Поделился публикацией:\n🔗 ${postUrl}`;

      const newMsg = {
        id: `msg_share_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: textMessage,
        fromMe: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        postPreview: {
          id: post.id,
          image: post.image,
          caption: post.caption,
          authorName: post.user?.name,
          authorUsername: post.user?.username,
        }
      };

      if (existingChat) {
        existingChat.messages = [...(existingChat.messages || []), newMsg];
        existingChat.lastMessage = `🔗 Публикация от @${post.user?.username || 'автора'}`;
        existingChat.time = 'Только что';
      } else {
        const newChat = {
          id: `chat_${targetUser.id}`,
          user: targetUser,
          lastMessage: `🔗 Публикация от @${post.user?.username || 'автора'}`,
          time: 'Только что',
          unread: 0,
          messages: [newMsg]
        };
        chats.unshift(newChat);
      }

      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
      window.dispatchEvent(new CustomEvent('chat_updated', { detail: { userId: targetUser.id } }));
    } catch (e) {
      console.warn('Could not save shared post to local chats:', e);
    }

    setSentUserIds(prev => new Set(prev).add(targetUser.id));
    if (onToast) {
      onToast(`Отправлено @${targetUser.username}`);
    }
  };

  // Copy link
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = postUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      if (onToast) onToast('Ссылка скопирована в буфер обмена');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (_) {
      if (onToast) onToast('Не удалось скопировать ссылку');
    }
  };

  // Add to Story
  const handleAddToStory = async () => {
    if (isPublishingStory) return;
    setIsPublishingStory(true);

    try {
      const createdAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const newStory = {
        id: `story_share_${Date.now()}`,
        user: currentUser,
        viewed: false,
        image: post.image || undefined,
        videoUrl: post.videoUrl || undefined,
        text: `Репост от @${post.user?.username || 'NewAge'}`,
        timestamp: 'Только что',
        createdAt,
        expiresAt,
        isRepost: true,
        repostId: post.id,
      };

      const token = localStorage.getItem('new_age_jwt_token') || localStorage.getItem('newage_token') || '';
      const apiUrl = (import.meta.env.VITE_API_URL || '') + '/api/stories';
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: newStory.id,
          image: newStory.image,
          videoUrl: newStory.videoUrl,
          mediaUrl: newStory.videoUrl || newStory.image || '',
          isVideo: !!newStory.videoUrl,
          text: newStory.text,
          createdAt: newStory.createdAt,
          expiresAt: newStory.expiresAt,
        })
      }).catch(console.warn);

      window.dispatchEvent(new CustomEvent('story_created', { detail: newStory }));
      if (onToast) onToast('Публикация добавлена в вашу историю! ✨');
      setTimeout(() => {
        setIsPublishingStory(false);
        onClose();
      }, 500);
    } catch (e) {
      setIsPublishingStory(false);
      if (onToast) onToast('Ошибка добавления в историю');
    }
  };

  // Download media
  const handleDownloadMedia = async () => {
    const mediaUrl = post.videoUrl || post.image;
    if (!mediaUrl) {
      if (onToast) onToast('В этой публикации нет фото или видео для скачивания');
      return;
    }

    setIsDownloading(true);
    if (onToast) onToast('Начинаем загрузку файла...');

    try {
      const isVideo = !!post.videoUrl || mediaUrl.includes('.mp4');
      const filename = `newage_${post.user?.username || 'post'}_${post.id.slice(0, 8)}.${isVideo ? 'mp4' : 'jpg'}`;

      if (mediaUrl.startsWith('data:') || mediaUrl.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = mediaUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const response = await fetch(mediaUrl, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }

      if (onToast) onToast('Файл успешно сохранен на устройство 📥');
    } catch (_) {
      // Fallback
      window.open(mediaUrl, '_blank');
      if (onToast) onToast('Файл открыт для сохранения');
    } finally {
      setIsDownloading(false);
    }
  };

  // Native mobile share (other apps)
  const handleShareExternal = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Публикация от @${post.user?.username || 'NewAge'}`,
          text: post.caption || 'Посмотрите публикацию в New Age Unity',
          url: postUrl,
        });
        if (onToast) onToast('Поделились!');
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  return createPortal(
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="share-modal-header">
          <div className="share-pill-drag-handle" />
          <div className="share-header-title-row">
            <h3 className="share-modal-title">Поделиться публикацией</h3>
            <button 
              type="button" 
              className="share-modal-close-btn" 
              onClick={onClose}
              title="Закрыть"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Post Snippet */}
        <div className="share-post-preview-bar">
          {post.image ? (
            <img src={post.image} alt="Thumbnail" className="share-preview-thumb" />
          ) : (
            <div className="share-preview-avatar">
              <UserIcon size={18} />
            </div>
          )}
          <div className="share-preview-meta">
            <span className="share-preview-author">@{post.user?.username || 'автор'}</span>
            <span className="share-preview-caption">
              {post.caption ? (post.caption.length > 55 ? post.caption.slice(0, 55) + '...' : post.caption) : 'Публикация New Age Unity'}
            </span>
          </div>
        </div>

        {/* Search Input for Users */}
        <div className="share-search-box">
          <Search size={16} className="share-search-icon" />
          <input 
            type="text" 
            placeholder="Кому отправить? Поиск друзей и пользователей..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="share-search-input"
            autoFocus={false}
          />
          {searchQuery && (
            <button 
              type="button" 
              className="share-search-clear" 
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Optional Custom Note Input */}
        <div className="share-note-input-wrap">
          <MessageSquare size={15} className="share-note-icon" />
          <input 
            type="text"
            placeholder="Написать сообщение к публикации... (необязательно)"
            value={customNote}
            onChange={e => setCustomNote(e.target.value)}
            className="share-note-input"
          />
        </div>

        {/* Users List for Direct Send */}
        <div className="share-users-section">
          <span className="share-section-label">Пользователи приложения</span>
          <div className="share-users-scroll-list">
            {filteredUsers.length === 0 ? (
              <div className="share-empty-users">
                <span>Пользователи не найдены</span>
              </div>
            ) : (
              filteredUsers.map(user => {
                const isSent = sentUserIds.has(user.id);
                return (
                  <div key={user.id} className="share-user-row">
                    <div className="share-user-left">
                      <div className="share-user-avatar-wrap">
                        <img 
                          src={getAvatarUrl(user)} 
                          alt={user.name} 
                          className="share-user-avatar" 
                          onError={handleAvatarError} 
                        />
                        {user.online && <span className="share-user-online-pip" />}
                      </div>
                      <div className="share-user-details">
                        <span className="share-user-name">{user.name}</span>
                        <span className="share-user-handle">@{user.username}</span>
                      </div>
                    </div>

                    <button 
                      type="button"
                      className={`btn-share-send ${isSent ? 'sent' : ''}`}
                      onClick={() => !isSent && handleSendToUser(user)}
                      disabled={isSent}
                    >
                      {isSent ? (
                        <>
                          <Check size={14} />
                          <span>Отправлено</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Отправить</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Action Buttons (Story, Download, Copy Link, Other Apps) */}
        <div className="share-quick-actions-grid">
          <button 
            type="button"
            className="share-quick-btn"
            onClick={handleCopyLink}
            title="Скопировать ссылку на публикацию"
          >
            <div className={`share-quick-icon-wrap ${copiedLink ? 'success' : ''}`}>
              {copiedLink ? <Check size={18} /> : <Copy size={18} />}
            </div>
            <span className="share-quick-btn-label">
              {copiedLink ? 'Скопировано!' : 'Копировать'}
            </span>
          </button>

          <button 
            type="button"
            className="share-quick-btn"
            onClick={handleAddToStory}
            disabled={isPublishingStory}
            title="Опубликовать в свою историю"
          >
            <div className="share-quick-icon-wrap story">
              <Sparkles size={18} />
            </div>
            <span className="share-quick-btn-label">
              {isPublishingStory ? 'Публикация...' : 'В историю'}
            </span>
          </button>

          <button 
            type="button"
            className="share-quick-btn"
            onClick={handleDownloadMedia}
            disabled={isDownloading}
            title="Скачать фото или видео на устройство"
          >
            <div className="share-quick-icon-wrap download">
              <Download size={18} />
            </div>
            <span className="share-quick-btn-label">
              {isDownloading ? 'Скачивание...' : 'Скачать'}
            </span>
          </button>

          {(isMobile || (typeof navigator !== 'undefined' && 'share' in navigator)) && (
            <button 
              type="button"
              className="share-quick-btn"
              onClick={handleShareExternal}
              title="Поделиться в других приложениях (WhatsApp, Telegram...)"
            >
              <div className="share-quick-icon-wrap external">
                <Smartphone size={18} />
              </div>
              <span className="share-quick-btn-label">В приложение</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

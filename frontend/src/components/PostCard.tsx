import { SharePostModal } from './SharePostModal';
import { createPortal } from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Check, MapPin, 
  Trash2, Headphones, Edit3, BarChart3, 
  Info, X, ShieldAlert, TrendingUp, Eye, Users, Sparkles,
  UserMinus, UserPlus, ExternalLink, Share2, Copy, Code, User
} from 'lucide-react';
import { type Post } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { PremiumBadge } from './PremiumBadge';
import { getAvatarUrl, handleAvatarError } from '../utils/avatar';
import { formatLastSeen } from '../utils/onlineStatus';
import { api } from '../api';
import './PostCard.css';
interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onOpenModal?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  onUpdatePost?: (updatedPost: Post) => void;
}
export function PostCard({ post, onLike, onOpenModal, onDeletePost, onUpdatePost }: PostCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal, currentUser } = useAuth();
  const [bookmarked, setBookmarked] = useState(post.saved ?? false);
  const [commentInput, setCommentInput] = useState('');
  const [localComments, setLocalComments] = useState(post.comments || []);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  // Editable local post data
  const [caption, setCaption] = useState(post.caption || '');
  const [location, setLocation] = useState(post.location || post.user?.location || '');
  // Menu and Modals state
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMoreMenu) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMoreMenu(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMoreMenu]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAboutAccountModal, setShowAboutAccountModal] = useState(false);
  const [showAboutPostModal, setShowAboutPostModal] = useState(false);
  // Edit form state
  const [editCaption, setEditCaption] = useState(caption);
  const [editLocation, setEditLocation] = useState(location);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  // Report state
  const [reportReason, setReportReason] = useState('Спам');
  // Follow state
  const [isFollowing, setIsFollowing] = useState(true);
  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };
  // Ownership check
  const isPostOwner = Boolean(
    currentUser && post && (
      post.user?.id === 'me' || 
      post.user?.id === currentUser.id || 
      (post as any)?.userId === currentUser.id ||
      (post.user?.username && currentUser.username && post.user.username.replace(/^@+/, '').toLowerCase() === currentUser.username.replace(/^@+/, '').toLowerCase()) ||
      (post.user?.id && currentUser.username && String(post.user.id).replace(/^@+/, '').toLowerCase() === currentUser.username.replace(/^@+/, '').toLowerCase()) ||
      currentUser.role === 'admin'
    )
  );
  const getPostUrl = () => {
    const origin = window.location.origin;
    return `${origin}/post/${post.id}`;
  };
  const handleCopyLink = () => {
    const url = getPostUrl();
    navigator.clipboard?.writeText(url);
    showToast('Ссылка скопирована в буфер обмена');
  };
  const handleEmbedCode = () => {
    const url = getPostUrl();
    const embed = `<iframe src="${url}/embed" width="400" height="600" frameborder="0" scrolling="no" allowtransparency="true"></iframe>`;
    navigator.clipboard?.writeText(embed);
    showToast('Код для вставки скопирован в буфер обмена');
  };
  const handleToggleFollow = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    if (nextState) {
      showToast(`Вы подписались на @${post.user.username}`);
    } else {
      showToast(`Вы отписались от @${post.user.username}`);
    }
    if (nextState) {
      api.users.follow(post.user.id).catch(console.warn);
    } else {
      api.users.unfollow(post.user.id).catch(console.warn);
    }
  };
  const handleBookmarkToggle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('register');
      return;
    }
    const next = !bookmarked;
    setBookmarked(next);
    api.posts.save(post.id).catch(console.warn);
    showToast(next ? 'Публикация сохранена в закладках' : 'Публикация удалена из закладок');
  };
  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      if (api.posts?.update) {
        await api.posts.update(post.id, {
          caption: editCaption,
          location: editLocation,
        });
      }
      setCaption(editCaption);
      setLocation(editLocation);
      const updatedPost = { ...post, caption: editCaption, location: editLocation };
      if (onUpdatePost) {
        onUpdatePost(updatedPost);
      }
      window.dispatchEvent(new CustomEvent('post_updated', { detail: { post: updatedPost } }));
      setShowEditModal(false);
      showToast('Публикация успешно обновлена');
    } catch (err) {
      console.warn('Ошибка сохранения публикации:', err);
      // Update locally anyway
      setCaption(editCaption);
      setLocation(editLocation);
      setShowEditModal(false);
      showToast('Изменения сохранены');
    } finally {
      setIsSavingEdit(false);
    }
  };
  const handleDeletePost = async () => {
    try {
      await api.posts.delete(post.id);
      if (onDeletePost) {
        onDeletePost(post.id);
      }
      window.dispatchEvent(new CustomEvent('post_deleted', { detail: { postId: post.id } }));
      setShowDeleteModal(false);
      showToast('Публикация удалена');
    } catch (err) {
      console.warn('Ошибка удаления:', err);
      if (onDeletePost) {
        onDeletePost(post.id);
      }
      window.dispatchEvent(new CustomEvent('post_deleted', { detail: { postId: post.id } }));
      setShowDeleteModal(false);
      showToast('Публикация удалена');
    }
  };
  const handleSendReport = () => {
    setShowReportModal(false);
    showToast('Спасибо! Ваша жалоба принята на модерацию');
  };
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('register');
      return;
    }
    if (!post.liked) {
      onLike(post.id);
    }
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 800);
  };
  const renderCaptionWithHashtags = (text: string) => {
    const parts = text.split(/(#[a-zA-Zа-яА-Я0-9_]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#')) {
        return (
          <span key={idx} className="caption-hashtag-chip">
            {part}
          </span>
        );
      }
      return part;
    });
  };
  const handleDeleteComment = (commentId: string) => {
    setLocalComments(prev => prev.filter(c => c.id !== commentId));
  };
  const handleProfileClick = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${userId === 'me' ? 'me' : userId}`);
  };
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('register');
      return;
    }
    onLike(post.id);
  };
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('register');
      return;
    }
    if (!commentInput.trim()) return;
    const newC = {
      id: `c_${Date.now()}`,
      user: currentUser,
      text: commentInput.trim(),
      timeAgo: 'Только что',
    };
    setLocalComments(prev => [...prev, newC]);
    api.posts.comment(post.id, commentInput.trim()).catch(console.warn);
    setCommentInput('');
  };
  // Metrics for statistics modal
  const likesCount = post.likes || 0;
  const commentsCount = localComments?.length || post.comments?.length || 0;
  const sharesCount = (post as any).shares || Math.max(1, Math.floor(likesCount * 0.35));
  const savesCount = bookmarked ? Math.max(1, Math.floor(likesCount * 0.2) + 1) : Math.floor(likesCount * 0.2);
  const viewsCount = (post as any).views || Math.max(12, likesCount * 9 + commentsCount * 14 + 38);
  const reachCount = Math.max(9, Math.round(viewsCount * 0.82));
  const engagementRate = viewsCount > 0 
    ? (((likesCount + commentsCount + savesCount + sharesCount) / viewsCount) * 100).toFixed(1)
    : '0.0';
  return (
    <article className={`post-card ${showMoreMenu ? "menu-open" : ""}`}>

      {/* Toast popup */}
      {toastMessage && (
        <div className="post-toast-notice">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
      {/* Header */}
      <header className="post-header">
        <div 
          className="post-user-clickable" 
          onClick={(e) => handleProfileClick(post.user.id, e)}
        >
          <div className="post-avatar-wrapper">
            <img 
              src={getAvatarUrl(post.user)} 
              alt={post.user.name} 
              className="post-avatar" 
              onError={handleAvatarError}
            />
            <span 
              className={`post-author-online ${(post.user.id === currentUser?.id ? true : Boolean(post.user.online)) ? 'is-online' : 'is-offline'}`} 
              title={(post.user.id === currentUser?.id || post.user.online) ? 'В сети' : formatLastSeen(post.user.lastSeen, false, post.user.lastSeenText)} 
            />
          </div>
          <div className="post-user-info">
            <div className="user-name-line">
              <span className="post-user-fullname">{post.user.name}</span>
              {post.user.isPremium && <PremiumBadge size="sm" />}
              <span className="post-author-handle">@{post.user.username}</span>
            </div>
            <div className="post-meta-line">
              <span className="post-time">{post.timeAgo}</span>
              {location && (
                <>
                  <span className="post-meta-dot">·</span>
                  <span className="post-location">
                    <MapPin size={11} /> {location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {/* 3 Dots Options Button & Side Dropdown */}
        <div className="post-more-wrap" ref={moreMenuRef}>
          <button 
            type="button"
            className="post-more-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreMenu(prev => !prev);
            }}
            title="Параметры публикации"
            aria-label="Параметры публикации"
          >
            <MoreHorizontal size={19} />
          </button>

          {showMoreMenu && (
            <div className="post-dropdown-menu" onClick={e => e.stopPropagation()}>
                {isPostOwner ? (
                  <>
                    <button 
                      type="button"
                      className="post-dropdown-item accent" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setEditCaption(caption);
                        setEditLocation(location);
                        setShowEditModal(true);
                      }}
                    >
                      <div className="post-dropdown-icon accent">
                        <Edit3 size={15} />
                      </div>
                      <span>Редактировать</span>
                    </button>

                    <button 
                      type="button"
                      className="post-dropdown-item" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowStatsModal(true);
                      }}
                    >
                      <div className="post-dropdown-icon stats">
                        <BarChart3 size={15} />
                      </div>
                      <span>Статистика</span>
                    </button>

                    <div className="post-dropdown-divider" />

                    <button 
                      type="button"
                      className="post-dropdown-item" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleBookmarkToggle();
                      }}
                    >
                      <div className="post-dropdown-icon">
                        <Bookmark size={15} fill={bookmarked ? '#6366F1' : 'none'} color={bookmarked ? '#6366F1' : 'currentColor'} />
                      </div>
                      <span>{bookmarked ? 'Удалить из закладок' : 'В закладки'}</span>
                    </button>

                    <button 
                      type="button"
                      className="post-dropdown-item" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        if (onOpenModal) onOpenModal(post);
                      }}
                    >
                      <div className="post-dropdown-icon">
                        <ExternalLink size={15} />
                      </div>
                      <span>Перейти к публикации</span>
                    </button>

                    <button 
                      type="button"
                      className="post-dropdown-item" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowShareModal(true);
                      }}
                    >
                      <div className="post-dropdown-icon">
                        <Share2 size={15} />
                      </div>
                      <span>Поделиться</span>
                    </button>

                    <button 
                      type="button"
                      className="post-dropdown-item" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleCopyLink();
                      }}
                    >
                      <div className="post-dropdown-icon">
                        <Copy size={15} />
                      </div>
                      <span>Копировать ссылку</span>
                    </button>

                    <button 
                      type="button"
                      className="post-dropdown-item" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleEmbedCode();
                      }}
                    >
                      <div className="post-dropdown-icon">
                        <Code size={15} />
                      </div>
                      <span>Вставить на сайт</span>
                    </button>

                    <div className="post-dropdown-divider" />

                    <button 
                      type="button"
                      className="post-dropdown-item danger" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowDeleteModal(true);
                      }}
                    >
                      <div className="post-dropdown-icon danger">
                        <Trash2 size={15} />
                      </div>
                      <span>Удалить публикацию</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      type="button"
                      className="post-dropdown-item" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleBookmarkToggle();
                      }}
                    >
                      <div className="post-dropdown-icon">
                        <Bookmark size={15} fill={bookmarked ? '#6366F1' : 'none'} color={bookmarked ? '#6366F1' : 'currentColor'} />
                      </div>
                      <span>{bookmarked ? 'Удалить из закладок' : 'Добавить в избранное'}</span>
                    </button>

                    <button 
                      type="button"
                      className="post-dropdown-item" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        if (onOpenModal) onOpenModal(post);
                      }}
                    >
                      <div className="post-dropdown-icon">
                        <ExternalLink size={15} />
                      </div>
                      <span>Перейти к публикации</span>
                    </button>

                    <button 
                      type="button"
                      className="post-dropdown-item" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowShareModal(true);
                      }}
                    >
                      <div className="post-dropdown-icon">
                        <Share2 size={15} />
                      </div>
                      <span>Поделиться</span>
                    </button>

                    <button 
                      type="button"
                      className="post-dropdown-item" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleCopyLink();
                      }}
                    >
                      <div className="post-dropdown-icon">
                        <Copy size={15} />
                      </div>
                      <span>Копировать ссылку</span>
                    </button>

                    <button 
                      type="button"
                      className="post-dropdown-item" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleEmbedCode();
                      }}
                    >
                      <div className="post-dropdown-icon">
                        <Code size={15} />
                      </div>
                      <span>Вставить на сайт</span>
                    </button>

                    <div className="post-dropdown-divider" />

                    <button 
                      type="button"
                      className="post-dropdown-item" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowAboutAccountModal(true);
                      }}
                    >
                      <div className="post-dropdown-icon">
                        <User size={15} />
                      </div>
                      <span>Об авторе @{post.user.username}</span>
                    </button>

                    <button 
                      type="button"
                      className="post-dropdown-item" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowAboutPostModal(true);
                      }}
                    >
                      <div className="post-dropdown-icon">
                        <Info size={15} />
                      </div>
                      <span>Об этой публикации</span>
                    </button>

                    <div className="post-dropdown-divider" />

                    <button 
                      type="button"
                      className="post-dropdown-item danger" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleToggleFollow();
                      }}
                    >
                      <div className="post-dropdown-icon danger">
                        {isFollowing ? <UserMinus size={15} /> : <UserPlus size={15} />}
                      </div>
                      <span>{isFollowing ? 'Отменить подписку' : 'Подписаться'}</span>
                    </button>

                    <button 
                      type="button"
                      className="post-dropdown-item danger" 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowReportModal(true);
                      }}
                    >
                      <div className="post-dropdown-icon danger">
                        <ShieldAlert size={15} />
                      </div>
                      <span>Пожаловаться</span>
                    </button>
                  </>
                )}
              </div>
          )}
        </div>
      </header>
      {/* Image or Video with double click heart burst */}
      {post.image && post.image.trim() !== '' ? (
        <div 
          className="post-image-container"
          onClick={() => onOpenModal && onOpenModal(post)}
          onDoubleClick={handleDoubleClick}
        >
          {post.image.startsWith('data:video') || post.image.endsWith('.mp4') || post.image.includes('/videos/') || post.videoUrl ? (
            <video src={post.videoUrl || post.image} controls className="post-image" />
          ) : (
            <img 
              src={post.image} 
              alt={caption} 
              className="post-image" 
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          {showHeartBurst && (
            <div className="heart-burst-overlay">
              <Heart size={84} fill="#EF4444" color="#EF4444" className="heart-burst-icon" />
            </div>
          )}
        </div>
      ) : null}
      {/* Audio / Podcast Player Bar */}
      {post.audioUrl && (
        <div className="post-audio-card-wrapper" onClick={e => e.stopPropagation()}>
          <div className="post-audio-pill-header">
            <div className="audio-badge-icon">
              <Headphones size={15} />
            </div>
            <span className="audio-badge-title">Аудиовыпуск подкаста</span>
          </div>
          <audio src={post.audioUrl} controls className="post-card-audio-ctrl" />
        </div>
      )}
      {/* Content & Actions */}
      <div className="post-content">
        <div className="post-actions">
          <div className="post-actions-left">
            <button 
              className={`action-btn ${post.liked ? 'liked' : ''}`} 
              onClick={handleLikeClick}
              title={post.liked ? 'Не нравится' : 'Нравится'}
            >
              <Heart fill={post.liked ? '#EF4444' : 'none'} color={post.liked ? '#EF4444' : 'currentColor'} size={22} />
            </button>
            <button 
              className="action-btn" 
              onClick={() => onOpenModal ? onOpenModal(post) : setShowAllComments(!showAllComments)}
              title="Комментарии"
            >
              <MessageCircle size={22} />
            </button>
            <button 
              className="action-btn" 
              onClick={() => setShowShareModal(true)} 
              title="Поделиться публикацией"
            >
              <Send size={22} />
            </button>
          </div>
          <button 
            className={`action-btn bookmark-btn ${bookmarked ? 'bookmarked' : ''}`} 
            onClick={handleBookmarkToggle}
            title={bookmarked ? 'В закладках' : 'Сохранить'}
          >
            <Bookmark fill={bookmarked ? '#6366F1' : 'none'} color={bookmarked ? '#6366F1' : 'currentColor'} size={22} />
          </button>
        </div>
        {/* Likers Avatars Strip */}
        {likesCount > 0 && (
          <div className="post-likers-preview">
            <span className="likers-text-line">
              Отметок «Нравится»: <strong>{likesCount.toLocaleString('ru-RU')}</strong>
            </span>
          </div>
        )}
        {/* Caption */}
        <div className="post-caption">
          <span 
            className="caption-username"
            onClick={(e) => handleProfileClick(post.user.id, e)}
          >
            {post.user.username}
          </span>{' '}
          {renderCaptionWithHashtags(caption)}
        </div>
        {/* Comments Section */}
        {(localComments?.length || 0) > 0 && (
          <div className="post-comments">
            {(showAllComments ? localComments : (localComments || []).slice(0, 2)).map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-text-wrap">
                  <span 
                    className="comment-username"
                    onClick={(e) => handleProfileClick(comment.user.id, e)}
                  >
                    {comment.user.username}
                  </span>{' '}
                  <span className="comment-text">{comment.text}</span>
                </div>
                {(comment.user.id === 'me' || post.user.id === 'me') && (
                  <button
                    className="comment-delete-btn"
                    onClick={() => handleDeleteComment(comment.id)}
                    title="Удалить комментарий"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            {(localComments?.length || 0) > 2 && !showAllComments && (
              <button 
                className="view-all-comments" 
                onClick={() => setShowAllComments(true)}
              >
                Посмотреть все комментарии ({localComments?.length || 0})
              </button>
            )}
          </div>
        )}
        {/* Inline Add Comment Input */}
        <form className="inline-comment-form" onSubmit={handleAddComment}>
          <input
            type="text"
            placeholder="Оставьте комментарий..."
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            className="inline-comment-input"
          />
          {commentInput.trim() && (
            <button type="submit" className="inline-comment-submit">
              Опубликовать
            </button>
          )}
        </form>
      </div>
                  {typeof document !== 'undefined' && createPortal(
        <>
          {/* ========================================================================= */}
      {/* 2. EDIT POST MODAL (FOR POST OWNER)                                       */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div className="post-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="post-edit-modal-card" onClick={e => e.stopPropagation()}>
            <div className="post-modal-header-line">
              <h3>Редактировать публикацию</h3>
              <button className="post-modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="post-edit-body">
              {post.image && (
                <div className="post-edit-media-preview">
                  <img src={post.image} alt="Preview" />
                </div>
              )}
              <div className="post-edit-field">
                <label>Текст публикации (подпись):</label>
                <textarea 
                  rows={4} 
                  value={editCaption} 
                  onChange={e => setEditCaption(e.target.value)} 
                  placeholder="О чем эта публикация? #теги..."
                  className="post-edit-textarea"
                />
              </div>
              <div className="post-edit-field">
                <label>Местоположение:</label>
                <div className="post-edit-input-wrap">
                  <MapPin size={16} className="field-icon" />
                  <input 
                    type="text" 
                    value={editLocation} 
                    onChange={e => setEditLocation(e.target.value)} 
                    placeholder="Например: Москва, Красная площадь"
                    className="post-edit-input"
                  />
                </div>
              </div>
            </div>
            <div className="post-modal-footer-line">
              <button 
                type="button" 
                className="btn-modal-cancel" 
                onClick={() => setShowEditModal(false)}
              >
                Отмена
              </button>
              <button 
                type="button" 
                className="btn-modal-save" 
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 3. POST STATISTICS / INSIGHTS MODAL (FOR POST OWNER)                      */}
      {/* ========================================================================= */}
      {showStatsModal && (
        <div className="post-modal-backdrop" onClick={() => setShowStatsModal(false)}>
          <div className="post-stats-modal-card" onClick={e => e.stopPropagation()}>
            <div className="post-modal-header-line">
              <div className="stats-title-col">
                <span className="stats-badge"><BarChart3 size={14} /> Аналитика New Age</span>
                <h3>Статистика публикации</h3>
              </div>
              <button className="post-modal-close-btn" onClick={() => setShowStatsModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="post-stats-body">
              {/* Post Header Snippet */}
              <div className="post-stats-snippet">
                {post.image ? (
                  <img src={post.image} alt="Snippet" className="stats-snippet-img" />
                ) : (
                  <div className="stats-snippet-placeholder">
                    <Sparkles size={20} color="#818CF8" />
                  </div>
                )}
                <div className="stats-snippet-info">
                  <p className="stats-snippet-caption">{caption ? caption.slice(0, 60) + (caption.length > 60 ? '...' : '') : 'Без описания'}</p>
                  <span className="stats-snippet-date">{post.timeAgo} · Опубликовано</span>
                </div>
              </div>
              {/* Engagement Overview Section */}
              <div className="stats-section-label">Обзор охвата и вовлеченности</div>
              <div className="stats-primary-grid">
                <div className="stats-metric-card highlight">
                  <div className="stats-metric-icon-wrap eye">
                    <Eye size={18} />
                  </div>
                  <div className="stats-metric-val">{viewsCount.toLocaleString('ru-RU')}</div>
                  <div className="stats-metric-name">Просмотры</div>
                  <span className="stats-metric-trend up">+18% за 24 ч.</span>
                </div>
                <div className="stats-metric-card">
                  <div className="stats-metric-icon-wrap users">
                    <Users size={18} />
                  </div>
                  <div className="stats-metric-val">{reachCount.toLocaleString('ru-RU')}</div>
                  <div className="stats-metric-name">Охват аккаунтов</div>
                  <span className="stats-metric-sub">Уникальные зрители</span>
                </div>
                <div className="stats-metric-card">
                  <div className="stats-metric-icon-wrap rate">
                    <TrendingUp size={18} />
                  </div>
                  <div className="stats-metric-val">{engagementRate}%</div>
                  <div className="stats-metric-name">Вовлеченность (ER)</div>
                  <span className="stats-metric-sub">Выше среднего</span>
                </div>
              </div>
              {/* Engagement Actions Details */}
              <div className="stats-section-label">Взаимодействия с публикацией</div>
              <div className="stats-details-list">
                <div className="stats-detail-row">
                  <div className="stats-detail-left">
                    <Heart size={16} className="icon-like" />
                    <span>Отметки «Нравится»</span>
                  </div>
                  <strong>{likesCount.toLocaleString('ru-RU')}</strong>
                </div>
                <div className="stats-detail-row">
                  <div className="stats-detail-left">
                    <MessageCircle size={16} className="icon-comment" />
                    <span>Комментарии</span>
                  </div>
                  <strong>{commentsCount.toLocaleString('ru-RU')}</strong>
                </div>
                <div className="stats-detail-row">
                  <div className="stats-detail-left">
                    <Send size={16} className="icon-share" />
                    <span>Репосты и пересылки</span>
                  </div>
                  <strong>{sharesCount.toLocaleString('ru-RU')}</strong>
                </div>
                <div className="stats-detail-row">
                  <div className="stats-detail-left">
                    <Bookmark size={16} className="icon-save" />
                    <span>Сохранения в закладки</span>
                  </div>
                  <strong>{savesCount.toLocaleString('ru-RU')}</strong>
                </div>
              </div>
              <div className="stats-info-note">
                <Info size={14} />
                <span>Данные собираются в режиме реального времени и обновляются при каждом новом просмотре.</span>
              </div>
            </div>
            <div className="post-modal-footer-line">
              <button 
                type="button" 
                className="btn-modal-close-wide" 
                onClick={() => setShowStatsModal(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 4. CONFIRM DELETE POST MODAL                                              */}
      {/* ========================================================================= */}
      {showDeleteModal && (
        <div className="post-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="post-confirm-modal-card" onClick={e => e.stopPropagation()}>
            <div className="post-confirm-icon-box danger">
              <Trash2 size={28} />
            </div>
            <h3>Удалить публикацию?</h3>
            <p>Вы уверены, что хотите удалить эту публикацию? Она будет безвозвратно удалена из вашей ленты и профиля.</p>
            <div className="post-confirm-actions">
              <button 
                type="button" 
                className="btn-confirm-delete" 
                onClick={handleDeletePost}
              >
                Удалить навсегда
              </button>
              <button 
                type="button" 
                className="btn-confirm-cancel" 
                onClick={() => setShowDeleteModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 5. REPORT MODAL                                                           */}
      {/* ========================================================================= */}
      {showReportModal && (
        <div className="post-modal-backdrop" onClick={() => setShowReportModal(false)}>
          <div className="post-confirm-modal-card report-card" onClick={e => e.stopPropagation()}>
            <div className="post-confirm-icon-box warning">
              <ShieldAlert size={28} />
            </div>
            <h3>Пожаловаться</h3>
            <p>Почему вы хотите сообщить об этой публикации?</p>
            <div className="report-reasons-list">
              {['Спам и реклама', 'Враждебные высказывания или буллинг', 'Насилие или опасный контент', 'Ложная информация', 'Нарушение авторских прав', 'Другое'].map(r => (
                <label key={r} className="report-reason-item">
                  <input 
                    type="radio" 
                    name="reportReason" 
                    value={r} 
                    checked={reportReason === r} 
                    onChange={() => setReportReason(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
            <div className="post-confirm-actions">
              <button 
                type="button" 
                className="btn-confirm-delete" 
                onClick={handleSendReport}
              >
                Отправить жалобу
              </button>
              <button 
                type="button" 
                className="btn-confirm-cancel" 
                onClick={() => setShowReportModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 6. ABOUT ACCOUNT MODAL                                                    */}
      {/* ========================================================================= */}
      {showAboutAccountModal && (
        <div className="post-modal-backdrop" onClick={() => setShowAboutAccountModal(false)}>
          <div className="post-about-modal-card" onClick={e => e.stopPropagation()}>
            <div className="post-modal-header-line">
              <h3>Об этом аккаунте</h3>
              <button className="post-modal-close-btn" onClick={() => setShowAboutAccountModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="post-about-body">
              <div className="about-user-hero">
                <img src={getAvatarUrl(post.user)} alt={post.user.name} className="about-avatar" />
                <div className="about-user-names">
                  <h4>{post.user.name}</h4>
                  <span className="about-handle">@{post.user.username}</span>
                  {post.user.isPremium && <PremiumBadge size="sm" />}
                </div>
              </div>
              <div className="about-info-rows">
                <div className="about-row">
                  <span className="about-row-label">Дата регистрации</span>
                  <span className="about-row-val">Март 2026 г.</span>
                </div>
                <div className="about-row">
                  <span className="about-row-label">Местоположение аккаунта</span>
                  <span className="about-row-val">{post.user.location || 'Россия'}</span>
                </div>
                <div className="about-row">
                  <span className="about-row-label">Статус подтверждения</span>
                  <span className="about-row-val">{post.user.isPremium ? 'Верифицирован' : 'Базовый аккаунт'}</span>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-visit-profile" 
                onClick={() => {
                  setShowAboutAccountModal(false);
                  navigate(`/profile/${post.user.id}`);
                }}
              >
                Открыть профиль
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 7. ABOUT POST MODAL                                                       */}
      {/* ========================================================================= */}
      {showAboutPostModal && (
        <div className="post-modal-backdrop" onClick={() => setShowAboutPostModal(false)}>
          <div className="post-about-modal-card" onClick={e => e.stopPropagation()}>
            <div className="post-modal-header-line">
              <h3>Об этой публикации</h3>
              <button className="post-modal-close-btn" onClick={() => setShowAboutPostModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="post-about-body">
              <div className="about-info-rows">
                <div className="about-row">
                  <span className="about-row-label">Дата публикации</span>
                  <span className="about-row-val">{post.timeAgo}</span>
                </div>
                <div className="about-row">
                  <span className="about-row-label">Формат контента</span>
                  <span className="about-row-val">{post.videoUrl || post.image?.includes('.mp4') ? 'Видео Full HD' : post.audioUrl ? 'Аудиовыпуск' : 'Фотография'}</span>
                </div>
                {location && (
                  <div className="about-row">
                    <span className="about-row-label">Геометка</span>
                    <span className="about-row-val">{location}</span>
                  </div>
                )}
                <div className="about-row">
                  <span className="about-row-label">ID публикации</span>
                  <span className="about-row-val mono">{post.id.slice(0, 16)}</span>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-visit-profile" 
                onClick={() => setShowAboutPostModal(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
        </>,
        document.body
      )}
          <SharePostModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
        onToast={showToast}
      />
    </article>
  );
}
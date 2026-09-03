import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Check, MapPin, Trash2 } from 'lucide-react';
import { currentUser, type Post } from '../data/mock';
import './PostCard.css';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onOpenModal?: (post: Post) => void;
}

export function PostCard({ post, onLike, onOpenModal }: PostCardProps) {
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(post.saved ?? false);
  const [copied, setCopied] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [localComments, setLocalComments] = useState(post.comments);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const newC = {
      id: `c_${Date.now()}`,
      user: currentUser,
      text: commentInput.trim(),
      timeAgo: 'Только что',
    };
    setLocalComments(prev => [...prev, newC]);
    setCommentInput('');
  };

  return (
    <article className="post-card">
      {/* Header */}
      <header className="post-header">
        <div 
          className="post-user-clickable" 
          onClick={(e) => handleProfileClick(post.user.id, e)}
        >
          <div className="post-avatar-wrapper">
            <img src={post.user.avatar} alt={post.user.name} className="post-avatar" />
            {post.user.online && <span className="post-author-online" />}
          </div>
          <div className="post-user-info">
            <div className="user-name-line">
              <span className="post-user-fullname">{post.user.name}</span>
              <span className="post-author-handle">@{post.user.username}</span>
            </div>
            <div className="post-meta-line">
              <span className="post-time">{post.timeAgo}</span>
              {post.user.location && (
                <>
                  <span className="post-meta-dot">·</span>
                  <span className="post-location">
                    <MapPin size={11} /> {post.user.location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button 
          className="post-more-btn" 
          onClick={handleShare}
          title={copied ? 'Ссылка скопирована!' : 'Опции'}
        >
          {copied ? <Check size={16} color="var(--color-success)" /> : <MoreHorizontal size={18} />}
        </button>
      </header>

      {/* Image with double click heart burst */}
      <div 
        className="post-image-container"
        onClick={() => onOpenModal && onOpenModal(post)}
        onDoubleClick={handleDoubleClick}
      >
        <img src={post.image} alt={post.caption} className="post-image" />
        {showHeartBurst && (
          <div className="heart-burst-overlay">
            <Heart size={84} fill="#EF4444" color="#EF4444" className="heart-burst-icon" />
          </div>
        )}
      </div>

      {/* Content & Actions */}
      <div className="post-content">
        <div className="post-actions">
          <div className="post-actions-left">
            <button 
              className={`action-btn ${post.liked ? 'liked' : ''}`} 
              onClick={() => onLike(post.id)}
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

            <button className="action-btn" onClick={handleShare} title="Поделиться публикацией">
              <Send size={22} />
            </button>
          </div>

          <button 
            className={`action-btn bookmark-btn ${bookmarked ? 'bookmarked' : ''}`} 
            onClick={() => setBookmarked(!bookmarked)}
            title={bookmarked ? 'В закладках' : 'Сохранить'}
          >
            <Bookmark fill={bookmarked ? '#6366F1' : 'none'} color={bookmarked ? '#6366F1' : 'currentColor'} size={22} />
          </button>
        </div>

        {/* Likers Avatars Strip */}
        <div className="post-likers-preview">
          <div className="likers-avatars-row">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="liker" className="mini-liker-img" />
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="liker" className="mini-liker-img" />
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="liker" className="mini-liker-img" />
          </div>
          <span className="likers-text-line">
            Нравится <strong>alice_iv</strong> и ещё <strong>{(post.likes - 1).toLocaleString('ru-RU')}</strong>
          </span>
        </div>

        {/* Caption */}
        <div className="post-caption">
          <span 
            className="caption-username"
            onClick={(e) => handleProfileClick(post.user.id, e)}
          >
            {post.user.username}
          </span>{' '}
          {renderCaptionWithHashtags(post.caption)}
        </div>

        {/* Comments Section */}
        {localComments.length > 0 && (
          <div className="post-comments">
            {(showAllComments ? localComments : localComments.slice(0, 2)).map(comment => (
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

            {localComments.length > 2 && !showAllComments && (
              <button 
                className="view-all-comments" 
                onClick={() => setShowAllComments(true)}
              >
                Посмотреть все комментарии ({localComments.length})
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
    </article>
  );
}

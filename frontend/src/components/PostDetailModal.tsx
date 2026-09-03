import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Heart, MessageCircle, Send, Bookmark, 
  Trash2, Reply, Smile, Check, MapPin 
} from 'lucide-react';
import { currentUser, type Post, type Comment } from '../data/mock';
import './PostDetailModal.css';

interface PostDetailModalProps {
  post: Post | null;
  onClose: () => void;
  onLikePost: (postId: string) => void;
  onUpdatePost?: (updatedPost: Post) => void;
}

const quickEmojis = ['❤️', '🔥', '👏', '😍', '☕', '✨', '🚀', '👍'];

export function PostDetailModal({ post, onClose, onLikePost, onUpdatePost }: PostDetailModalProps) {
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>(post?.comments || []);
  const [likedComments, setLikedComments] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [saved, setSaved] = useState(post?.saved ?? false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (post) {
      setComments(post.comments);
      setSaved(post.saved ?? false);
      setReplyingTo(null);
      setCommentText('');
    }
  }, [post]);

  if (!post) return null;

  const handleProfileClick = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    navigate(`/profile/${userId === 'me' ? 'me' : userId}`);
  };

  const handleToggleLikeComment = (commentId: string) => {
    setLikedComments(prev => {
      const cur = prev[commentId] || { liked: false, count: 0 };
      return {
        ...prev,
        [commentId]: {
          liked: !cur.liked,
          count: cur.liked ? Math.max(0, cur.count - 1) : cur.count + 1,
        },
      };
    });
  };

  const handleAddComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    const newCommentObj: Comment = {
      id: `comm_${Date.now()}`,
      user: currentUser,
      text: replyingTo ? `@${replyingTo} ${commentText.trim()}` : commentText.trim(),
      timeAgo: 'Только что',
    };

    const updatedComments = [...comments, newCommentObj];
    setComments(updatedComments);
    setCommentText('');
    setReplyingTo(null);

    // Notify parent
    if (onUpdatePost) {
      onUpdatePost({
        ...post,
        comments: updatedComments,
      });
    }

    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteComment = (commentId: string) => {
    const updated = comments.filter(c => c.id !== commentId);
    setComments(updated);
    setCommentToDelete(null);

    if (onUpdatePost) {
      onUpdatePost({
        ...post,
        comments: updated,
      });
    }
  };

  const handleReplyClick = (username: string) => {
    setReplyingTo(username);
    inputRef.current?.focus();
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="post-modal-backdrop" onClick={onClose}>
      <div className="post-modal-container" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button className="post-modal-exit-btn" onClick={onClose} title="Закрыть">
          <X size={20} />
        </button>

        {/* Left Side: Full Image */}
        <div className="post-modal-media-col">
          <img src={post.image} alt={post.caption} className="post-modal-photo" />
        </div>

        {/* Right Side: Header, Caption, Comments, Actions, Input */}
        <div className="post-modal-info-col">
          {/* Header */}
          <div className="modal-info-header">
            <div 
              className="modal-author-block"
              onClick={(e) => handleProfileClick(post.user.id, e)}
            >
              <img src={post.user.avatar} alt={post.user.name} className="modal-author-avatar" />
              <div className="modal-author-names">
                <div className="modal-author-top">
                  <span className="author-fullname">{post.user.name}</span>
                  <span className="author-username">@{post.user.username}</span>
                </div>
                <div className="modal-author-meta">
                  <span>{post.timeAgo}</span>
                  {post.location && (
                    <span className="modal-location">
                      <MapPin size={11} /> {post.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comments & Caption Scroll Area */}
          <div className="modal-comments-scrollable">
            {/* Original Post Caption as first comment */}
            <div className="modal-caption-entry">
              <img 
                src={post.user.avatar} 
                alt={post.user.name} 
                className="comment-user-avatar"
                onClick={(e) => handleProfileClick(post.user.id, e)}
              />
              <div className="comment-content-wrap">
                <div className="comment-text-bubble">
                  <span 
                    className="comment-user-bold"
                    onClick={(e) => handleProfileClick(post.user.id, e)}
                  >
                    {post.user.username}
                  </span>{' '}
                  <span className="comment-body-text">{post.caption}</span>
                </div>
                <div className="comment-time-sub">{post.timeAgo}</div>
              </div>
            </div>

            {/* Comments Divider */}
            {comments.length > 0 && (
              <div className="comments-divider">
                <span>Комментарии ({comments.length})</span>
              </div>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="no-comments-yet">
                <p>Комментариев пока нет.</p>
                <span>Будьте первым, кто оставит комментарий!</span>
              </div>
            ) : (
              comments.map(c => {
                const isMyComment = c.user.id === 'me' || c.user.username === currentUser.username;
                const isPostOwner = post.user.id === 'me';
                const canDelete = isMyComment || isPostOwner;
                const commentLike = likedComments[c.id] || { liked: false, count: 0 };

                return (
                  <div key={c.id} className="comment-entry-row">
                    <img 
                      src={c.user.avatar} 
                      alt={c.user.name} 
                      className="comment-user-avatar"
                      onClick={(e) => handleProfileClick(c.user.id, e)}
                    />

                    <div className="comment-content-wrap">
                      <div className="comment-text-bubble">
                        <span 
                          className="comment-user-bold"
                          onClick={(e) => handleProfileClick(c.user.id, e)}
                        >
                          {c.user.username || c.user.name}
                        </span>{' '}
                        <span className="comment-body-text">{c.text}</span>
                      </div>

                      {/* Comment Meta Actions */}
                      <div className="comment-actions-subbar">
                        <span className="comment-time-sub">{c.timeAgo}</span>

                        <button 
                          className="comment-action-link"
                          onClick={() => handleReplyClick(c.user.username || c.user.name)}
                        >
                          <Reply size={12} /> Ответить
                        </button>

                        {canDelete && (
                          <button 
                            className="comment-action-link delete"
                            onClick={() => setCommentToDelete(c.id)}
                            title="Удалить комментарий"
                          >
                            <Trash2 size={12} /> Удалить
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Like button for comment */}
                    <button 
                      className={`comment-heart-btn ${commentLike.liked ? 'liked' : ''}`}
                      onClick={() => handleToggleLikeComment(c.id)}
                      title={commentLike.liked ? 'Не нравится' : 'Нравится'}
                    >
                      <Heart 
                        size={14} 
                        fill={commentLike.liked ? '#EF4444' : 'none'} 
                        color={commentLike.liked ? '#EF4444' : '#94A3B8'} 
                      />
                      {commentLike.count > 0 && (
                        <span className="comment-likes-num">{commentLike.count}</span>
                      )}
                    </button>
                  </div>
                );
              })
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Action Icons Row (Like, Comment, Share, Save) */}
          <div className="modal-actions-toolbar">
            <div className="actions-left">
              <button 
                className={`modal-tool-btn ${post.liked ? 'liked' : ''}`}
                onClick={() => onLikePost(post.id)}
                title={post.liked ? 'Не нравится' : 'Нравится'}
              >
                <Heart 
                  size={24} 
                  fill={post.liked ? '#EF4444' : 'none'} 
                  color={post.liked ? '#EF4444' : 'currentColor'} 
                />
              </button>

              <button 
                className="modal-tool-btn" 
                onClick={() => inputRef.current?.focus()}
                title="Оставить комментарий"
              >
                <MessageCircle size={24} />
              </button>

              <button 
                className="modal-tool-btn" 
                onClick={handleShare}
                title="Поделиться"
              >
                {copiedLink ? <Check size={24} color="#10B981" /> : <Send size={24} />}
              </button>
            </div>

            <button 
              className={`modal-tool-btn bookmark ${saved ? 'saved' : ''}`}
              onClick={() => setSaved(!saved)}
              title={saved ? 'В закладках' : 'Сохранить'}
            >
              <Bookmark 
                size={24} 
                fill={saved ? 'var(--color-accent)' : 'none'} 
                color={saved ? 'var(--color-accent)' : 'currentColor'} 
              />
            </button>
          </div>

          {/* Likes Summary */}
          <div className="modal-likes-count">
            <strong>{post.likes.toLocaleString('ru-RU')}</strong> отметок «Нравится»
            <span className="modal-timestamp-label">{post.timeAgo}</span>
          </div>

          {/* Quick Emoji Bar */}
          <div className="modal-quick-emojis">
            {quickEmojis.map(emoji => (
              <button 
                key={emoji} 
                className="quick-emoji-chip"
                onClick={() => setCommentText(prev => prev + emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Replying Banner */}
          {replyingTo && (
            <div className="modal-replying-banner">
              <span>Ответ пользователю <strong>@{replyingTo}</strong></span>
              <button onClick={() => setReplyingTo(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Fixed Comment Input Form */}
          <form className="modal-input-form" onSubmit={handleAddComment}>
            <div className="modal-input-wrap">
              <Smile size={20} className="modal-input-smile" />
              <input
                ref={inputRef}
                type="text"
                placeholder={replyingTo ? `Ответить @${replyingTo}...` : "Добавьте комментарий..."}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="modal-text-input"
              />
            </div>
            <button 
              type="submit" 
              className="modal-submit-btn" 
              disabled={!commentText.trim()}
            >
              Опубликовать
            </button>
          </form>
        </div>
      </div>

      {/* Delete Comment Confirmation Modal */}
      {commentToDelete && (
        <div className="comment-delete-modal-overlay" onClick={() => setCommentToDelete(null)}>
          <div className="comment-delete-modal-box" onClick={e => e.stopPropagation()}>
            <div className="delete-badge">
              <Trash2 size={24} />
            </div>
            <h4>Удалить комментарий?</h4>
            <p>Вы уверены, что хотите удалить этот комментарий?</p>
            <div className="comment-delete-modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setCommentToDelete(null)}
              >
                Отмена
              </button>
              <button 
                className="btn-delete" 
                onClick={() => handleDeleteComment(commentToDelete)}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

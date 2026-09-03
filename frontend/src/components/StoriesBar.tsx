import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Heart, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { currentUser, type Story } from '../data/mock';
import './StoriesBar.css';

interface StoriesBarProps {
  stories: Story[];
}

export function StoriesBar({ stories }: StoriesBarProps) {
  const navigate = useNavigate();
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [likedStory, setLikedStory] = useState(false);

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  const handleOpenStory = (index: number) => {
    setActiveStoryIndex(index);
    setLikedStory(false);
    setReplyText('');
  };

  const handleClose = () => {
    setActiveStoryIndex(null);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      setLikedStory(false);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
      setLikedStory(false);
    } else {
      handleClose();
    }
  };

  const handleAuthorClick = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleClose();
    navigate(`/profile/${userId === 'me' ? 'me' : userId}`);
  };

  return (
    <>
      <div className="stories-bar">
        <div className="stories-container">
          {/* User's own story card */}
          <div 
            className="story-card own-story-card"
            onClick={() => navigate('/profile/me')}
          >
            <div className="story-card-bg-wrap">
              <img src={currentUser.coverImage || currentUser.avatar} alt="Ваша история" className="story-card-bg" />
              <div className="story-card-gradient" />
            </div>
            <div className="own-story-avatar-box">
              <img src={currentUser.avatar} alt="You" />
              <div className="own-story-plus-badge">
                <Plus size={14} />
              </div>
            </div>
            <span className="story-card-author">Создать историю</span>
          </div>

          {/* Other stories cards */}
          {stories.map((story, index) => (
            <div 
              className={`story-card ${story.viewed ? 'viewed' : 'unviewed'}`} 
              key={story.id}
              onClick={() => handleOpenStory(index)}
            >
              <div className="story-card-bg-wrap">
                <img src={story.image || story.user.avatar} alt={story.user.name} className="story-card-bg" />
                <div className="story-card-gradient" />
              </div>

              <div className="story-card-top-avatar">
                <img src={story.user.avatar} alt={story.user.name} />
                {story.user.online && <span className="story-online-dot" />}
              </div>

              <span className="story-card-author">{story.user.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {activeStory && (
        <div className="story-viewer-overlay" onClick={handleClose}>
          <button className="story-close-btn" onClick={handleClose}>
            <X size={26} />
          </button>

          {activeStoryIndex! > 0 && (
            <button className="story-nav-btn prev" onClick={handlePrev}>
              <ChevronLeft size={28} />
            </button>
          )}

          {activeStoryIndex! < stories.length - 1 && (
            <button className="story-nav-btn next" onClick={handleNext}>
              <ChevronRight size={28} />
            </button>
          )}

          <div className="story-viewer-card" onClick={e => e.stopPropagation()}>
            {/* Top progress bar */}
            <div className="story-progress-bar">
              <div className="story-progress-fill" />
            </div>

            {/* Author info */}
            <div 
              className="story-author-header"
              onClick={(e) => handleAuthorClick(activeStory.user.id, e)}
            >
              <img src={activeStory.user.avatar} alt={activeStory.user.name} className="story-author-avatar" />
              <div className="story-author-text">
                <span className="story-author-name">{activeStory.user.name}</span>
                <span className="story-timestamp">{activeStory.timestamp || '3 ч назад'}</span>
              </div>
            </div>

            {/* Story Image */}
            <div className="story-media-box">
              <img 
                src={activeStory.image || activeStory.user.coverImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'} 
                alt="Story" 
                className="story-full-img"
              />
            </div>

            {/* Bottom reply bar */}
            <div className="story-reply-bar">
              <input
                type="text"
                placeholder={`Ответить ${activeStory.user.name.split(' ')[0]}...`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="story-reply-input"
              />
              <button 
                className={`story-action-btn ${likedStory ? 'liked' : ''}`}
                onClick={() => setLikedStory(!likedStory)}
              >
                <Heart size={22} fill={likedStory ? '#EF4444' : 'none'} color={likedStory ? '#EF4444' : 'white'} />
              </button>
              {replyText.trim() && (
                <button 
                  className="story-action-btn send"
                  onClick={() => {
                    alert(`Сообщение отправлено для ${activeStory.user.name}`);
                    setReplyText('');
                  }}
                >
                  <Send size={20} color="white" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

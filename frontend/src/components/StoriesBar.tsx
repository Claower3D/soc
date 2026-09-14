import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Heart, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { type Story } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { CreateStoryModal } from './CreateStoryModal';
import './StoriesBar.css';

interface StoriesBarProps {
  stories: Story[];
  onAddStory?: (newStory: Story) => void;
}

export function StoriesBar({ stories, onAddStory }: StoriesBarProps) {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [likedStory, setLikedStory] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);

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
    if (userId === 'me' || userId === currentUser.id) {
      navigate(currentUser.username ? `/profile/@${currentUser.username}` : `/profile/${currentUser.id}`);
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  return (
    <>
      <div className="stories-bar">
        <div className="stories-container">
          {/* User's own story card */}
          <div 
            className="story-card own-story-card"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('register');
              } else {
                setIsCreateStoryOpen(true);
              }
            }}
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

          <div className="story-viewer-container" onClick={e => e.stopPropagation()}>
            {/* Top progress bar */}
            <div className="story-progress-bar">
              <div className="story-progress-fill" />
            </div>

            {/* Author info */}
            <div 
              className="story-header"
              onClick={(e) => handleAuthorClick(activeStory.user.id, e)}
            >
              <img src={activeStory.user.avatar} alt={activeStory.user.name} className="story-author-avatar" />
              <div className="story-author-info">
                <span className="story-author-name">{activeStory.user.name}</span>
                <span className="story-time">{activeStory.timestamp || '2 ч назад'}</span>
              </div>
            </div>

            {/* Story Content */}
            <div className="story-content">
              <img 
                src={activeStory.image || activeStory.user.avatar} 
                alt="Story" 
                className="story-image"
              />
              <div className="story-tap-areas">
                <div className="story-tap-left" onClick={handlePrev}>
                  <ChevronLeft size={24} className="tap-arrow" />
                </div>
                <div className="story-tap-right" onClick={handleNext}>
                  <ChevronRight size={24} className="tap-arrow" />
                </div>
              </div>
            </div>

            {/* Bottom reply bar */}
            <div className="story-footer">
              <input
                type="text"
                placeholder="Ответить на историю..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && replyText.trim()) {
                    if (!isAuthenticated) {
                      openAuthModal('register');
                      return;
                    }
                    alert(`Сообщение отправлено для ${activeStory.user.name}`);
                    setReplyText('');
                  }
                }}
                className="story-reply-input"
              />
              <button 
                className={`story-action-btn ${likedStory ? 'liked' : ''}`}
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal('register');
                    return;
                  }
                  setLikedStory(!likedStory);
                }}
              >
                <Heart size={22} fill={likedStory ? '#EF4444' : 'none'} color={likedStory ? '#EF4444' : 'white'} />
              </button>
              {replyText.trim() && (
                <button 
                  className="story-action-btn send"
                  onClick={() => {
                    if (!isAuthenticated) {
                      openAuthModal('register');
                      return;
                    }
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

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onCreateStory={(newStory) => {
          if (onAddStory) {
            onAddStory(newStory);
          }
          setIsCreateStoryOpen(false);
        }}
      />
    </>
  );
}

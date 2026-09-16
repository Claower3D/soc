import React, { useState } from 'react';
import { 
  X, Heart, MessageCircle, Sparkles, MapPin, 
  Briefcase, Award, Target, ChevronLeft, ChevronRight,
  ShieldCheck, Share2, Check
} from 'lucide-react';
import { type DatingProfile, DATING_GOALS } from '../data/datingData';
import { useNavigate } from 'react-router-dom';
import './DatingProfileModal.css';

interface DatingProfileModalProps {
  profile: DatingProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (profileId: string) => void;
  isLiked?: boolean;
}

export const DatingProfileModal: React.FC<DatingProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onLike,
  isLiked = false
}) => {
  const navigate = useNavigate();
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !profile) return null;

  const photos = profile.photos && profile.photos.length > 0 
    ? profile.photos 
    : [profile.avatar];

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx(prev => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleOpenChat = () => {
    if (onLike && !isLiked) {
      onLike(profile.id);
    }
    onClose();
    navigate(`/messenger?datingProfile=${encodeURIComponent(profile.id)}`);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/dating?profile=${profile.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="dating-modal-backdrop" onClick={onClose}>
      <div className="dating-modal-card" onClick={e => e.stopPropagation()}>
        <button className="dating-modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Gallery Hero Section */}
        <div className="dating-modal-gallery">
          <img 
            src={photos[activePhotoIdx]} 
            alt={profile.name} 
            className="dating-modal-hero-img" 
          />
          <div className="dating-gallery-gradient" />

          {/* Photo Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button className="gallery-arrow-btn left" onClick={handlePrevPhoto}>
                <ChevronLeft size={22} />
              </button>
              <button className="gallery-arrow-btn right" onClick={handleNextPhoto}>
                <ChevronRight size={22} />
              </button>
              <div className="gallery-dots-strip">
                {photos.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`gallery-dot ${idx === activePhotoIdx ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIdx(idx);
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Header overlay info */}
          <div className="dating-modal-hero-meta">
            <div className="hero-name-row">
              <h2 className="hero-profile-name">{profile.name}, {profile.age}</h2>
              {profile.verified && (
                <span className="hero-verified-badge" title="Анкета верифицирована">
                  <ShieldCheck size={18} />
                </span>
              )}
            </div>
            <div className="hero-subline">
              <span className="hero-city"><MapPin size={14} /> {profile.city}</span>
              {profile.zodiacSign && <span className="hero-zodiac">⭐ {profile.zodiacSign}</span>}
              {profile.compatibilityScore && (
                <span className="hero-compat-badge">
                  <Sparkles size={13} />
                  <span>{profile.compatibilityScore}% Резонанс</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="dating-modal-body">
          {/* Action Row */}
          <div className="dating-modal-actions-row">
            <button 
              type="button" 
              className={`dating-btn-like ${isLiked ? 'liked' : ''}`}
              onClick={() => onLike && onLike(profile.id)}
            >
              <Heart size={20} className={isLiked ? 'fill-current' : ''} />
              <span>{isLiked ? 'Вам нравится' : 'Поставить лайк'}</span>
            </button>

            <button 
              type="button" 
              className="dating-btn-message"
              onClick={handleOpenChat}
            >
              <MessageCircle size={19} />
              <span>Написать в чат</span>
            </button>

            <button 
              type="button" 
              className="dating-btn-share"
              onClick={handleShare}
              title="Поделиться анкетой"
            >
              {copied ? <Check size={18} color="#10B981" /> : <Share2 size={18} />}
            </button>
          </div>

          {/* Section: Goals */}
          <div className="dating-section-block">
            <h4 className="dating-section-title">
              <Target size={16} />
              <span>Цели знакомства</span>
            </h4>
            <div className="dating-goals-tags-list">
              {profile.goals.map(goalKey => {
                const info = DATING_GOALS.find(g => g.id === goalKey);
                if (!info) return null;
                return (
                  <div key={goalKey} className={`dating-goal-chip ${info.badgeClass}`}>
                    <span className="goal-icon">{info.icon}</span>
                    <span className="goal-label">{info.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Bio */}
          <div className="dating-section-block">
            <h4 className="dating-section-title">О себе</h4>
            <p className="dating-bio-text">{profile.bio}</p>
            {profile.occupation && (
              <div className="dating-occupation-pill">
                <Briefcase size={14} />
                <span>{profile.occupation}</span>
              </div>
            )}
          </div>

          {/* Section: Consciousness & Spiritual Profile */}
          <div className="dating-section-block consciousness-block">
            <div className="consciousness-badge-header">
              <div className="consciousness-level-badge">
                <Sparkles size={14} />
                <span>Класс {profile.consciousnessLevel}</span>
              </div>
              <span className="consciousness-title-text">{profile.consciousnessTitle}</span>
            </div>
            {profile.spiritualTradition && (
              <p className="consciousness-tradition-sub">
                Мировоззрение & Традиция: <strong>{profile.spiritualTradition}</strong>
              </p>
            )}
          </div>

          {/* Section: Life Goals & Achievements */}
          {(profile.achievements?.length > 0 || profile.lifeGoals?.length > 0) && (
            <div className="dating-section-block">
              <h4 className="dating-section-title">
                <Award size={16} />
                <span>Достижения и жизненные ориентиры</span>
              </h4>
              
              {profile.achievements && profile.achievements.length > 0 && (
                <div className="profile-sublist-group">
                  <span className="sublist-heading">🌟 Главные достижения:</span>
                  <ul className="profile-check-list">
                    {profile.achievements.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {profile.lifeGoals && profile.lifeGoals.length > 0 && (
                <div className="profile-sublist-group">
                  <span className="sublist-heading">🎯 Цели на будущее:</span>
                  <ul className="profile-check-list">
                    {profile.lifeGoals.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Section: Interests & Hobbies */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="dating-section-block">
              <h4 className="dating-section-title">Увлечения и интересы</h4>
              <div className="dating-interests-cloud">
                {profile.interests.map((tag, i) => (
                  <span key={i} className="interest-bubble-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

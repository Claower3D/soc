import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, 
  Play, Pause, Plus, Music, ChevronUp, ChevronDown, X, Send, Smile,
  Radio, Users, Sparkles, Flame, Video, Activity, Hash, Disc3
} from 'lucide-react';
import { type Clip, type ClipComment } from '../data/mock';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { UploadWaveModal } from '../components/UploadWaveModal';
import './ClipsPage.css';

type ClipTab = 'all' | 'zen' | 'live' | 'trending' | 'my';

const QUICK_HASHTAGS = ['Все', 'медитация', 'дзен', 'частота432', 'космос', 'звук', 'гармония'];

export const DEFAULT_AESTHETIC_CLIPS: Clip[] = [
  {
    id: 'clip_zen_01',
    user: {
      id: 'zen_temple',
      name: 'Храм Тишины & Медитации',
      username: 'zen_temple',
      avatar: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=400&q=80',
      role: 'expert',
      verified: true,
      followersCount: 14200,
      followingCount: 12,
      criticsCount: 0,
      postsCount: 45
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80',
    caption: 'Звуковая терапия 432 Гц • Глубокое погружение в состояние осознанности и покоя. Отпустите суету дня ✨🧘 #медитация #дзен #частота432 #звук',
    musicTitle: 'Священная Гармония • 432 Гц',
    musicAuthor: 'Solfeggio Sound Lab',
    audioTrackArt: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=200&q=80',
    overlayTitle: 'Частота 432 Гц • Гармония Духа',
    likesCount: 18420,
    commentsCount: 342,
    sharesCount: 1205,
    viewsCount: 94000,
    isLiked: false,
    isSaved: false,
    timeAgo: '2 ч назад',
    tags: ['медитация', 'дзен', 'частота432', 'звук']
  },
  {
    id: 'clip_zen_02',
    user: {
      id: 'cosmos_mind',
      name: 'Космический Разум',
      username: 'cosmos_flow',
      avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
      role: 'creator',
      verified: true,
      followersCount: 28900,
      followingCount: 45,
      criticsCount: 0,
      postsCount: 88
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    poster: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    caption: 'Синхронизация сознания с ритмами Вселенной. Практика визуализации светового потока и расширения восприятия 🌌💫 #космос #осознанность #поток',
    musicTitle: 'Deep Space Resonance • Alpha Waves',
    musicAuthor: 'Ambient Cosmos',
    audioTrackArt: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80',
    overlayTitle: 'Поток Сознания • Практика Света',
    likesCount: 31200,
    commentsCount: 512,
    sharesCount: 2480,
    viewsCount: 148000,
    isLiked: true,
    isSaved: true,
    timeAgo: '4 ч назад',
    tags: ['космос', 'энергия', 'альфаволны', 'осознанность']
  },
  {
    id: 'clip_zen_03',
    user: {
      id: 'sacred_geo',
      name: 'Сакральная Геометрия',
      username: 'sacred_art',
      avatar: 'https://images.unsplash.com/photo-1519638399535-1b036603ac77?auto=format&fit=crop&w=400&q=80',
      role: 'expert',
      verified: true,
      followersCount: 19500,
      followingCount: 33,
      criticsCount: 0,
      postsCount: 62
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    caption: 'Цветок Жизни и Золотое Сечение: как фундаментальные пропорции формируют гармонию живого мира 🔮 #геометрия #мудрость #гармония',
    musicTitle: 'Sacred Spheres • Ambient Soundscape',
    musicAuthor: 'Golden Ratio Records',
    audioTrackArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80',
    overlayTitle: 'Цветок Жизни • Код Гармонии',
    likesCount: 24900,
    commentsCount: 420,
    sharesCount: 1890,
    viewsCount: 112000,
    isLiked: false,
    isSaved: false,
    timeAgo: 'Вчера',
    tags: ['геометрия', 'гармония', 'цветокжизни']
  }
];

export function ClipsPage() {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.clips.list().then((data) => {
      if (mounted) {
        const saved = localStorage.getItem('newage_clips_state');
        let finalClips: Clip[] = Array.isArray(data) && data.length > 0 ? data : [];
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const ids = new Set(parsed.map((c: Clip) => c.id));
            const missing = finalClips.filter((c: Clip) => !ids.has(c.id));
            finalClips = [...missing, ...parsed];
          } catch (e) {
            console.error('Failed to parse saved clips', e);
          }
        }
        
        // Merge with DEFAULT_AESTHETIC_CLIPS so the feed is always alive with high-quality content
        const existingIds = new Set(finalClips.map(c => c.id));
        const additions = DEFAULT_AESTHETIC_CLIPS.filter(c => !existingIds.has(c.id));
        finalClips = [...finalClips, ...additions];

        setClips(finalClips);
        setIsLoading(false);
      }
    }).catch(err => {
      console.warn('Failed to load clips', err);
      if (mounted) {
        setClips(DEFAULT_AESTHETIC_CLIPS);
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const [activeTab, setActiveTab] = useState<ClipTab>('all');
  const [selectedTag, setSelectedTag] = useState<string>('Все');
  const [activeClipProgress, setActiveClipProgress] = useState<number>(0);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; left: number }[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayAnim, setShowPlayAnim] = useState(false);
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [activeClipForComments, setActiveClipForComments] = useState<Clip | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [followedAuthors, setFollowedAuthors] = useState<Record<string, boolean>>({
    'u2': true,
  });

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [waveDescription, setWaveDescription] = useState('');
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerUpload = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    uploadInputRef.current?.click();
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVideoFile(file);
      setWaveDescription('');
      setUploadModalOpen(true);
    }
    e.target.value = '';
  };

  const handlePublishWave = () => {
    if (!selectedVideoFile || !currentUser) return;
    
    const videoUrl = URL.createObjectURL(selectedVideoFile);
    
    const newClip: Clip = {
      id: 'clip_' + Date.now(),
      user: currentUser,
      videoUrl,
      poster: '',
      caption: waveDescription,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      isLiked: false,
      isSaved: false,
      timeAgo: 'Только что'
    };
    
    setClips(prev => [newClip, ...prev]);
    setUploadModalOpen(false);
    setSelectedVideoFile(null);
    setActiveIndex(0);
    if (feedRef.current) feedRef.current.scrollTop = 0;

    api.clips.create({
      videoUrl,
      thumbnailUrl: '',
      description: waveDescription,
      soundTitle: 'Оригинальный звук'
    }).catch((err) => console.warn('Backend clip save notice:', err));
  };

  const feedRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    localStorage.setItem('newage_clips_state', JSON.stringify(clips));
  }, [clips]);

  useEffect(() => {
    const currentClip = clips[activeIndex];
    if (!currentClip) return;

    Object.keys(videoRefs.current).forEach((clipId) => {
      const vid = videoRefs.current[clipId];
      if (!vid) return;

      if (clipId === currentClip.id) {
        api.clips.view(clipId).catch(console.warn);
        vid.muted = isMuted;
        if (isPlaying) {
          vid.play().catch(() => {
            vid.muted = true;
            setIsMuted(true);
            vid.play().catch((err) => console.log('Autoplay error', err));
          });
        } else {
          vid.pause();
        }
      } else {
        vid.pause();
        vid.currentTime = 0;
      }
    });
  }, [activeIndex, isPlaying, isMuted, clips]);

  const handleScroll = useCallback(() => {
    if (!feedRef.current) return;
    const container = feedRef.current;
    const scrollPosition = container.scrollTop;
    const itemHeight = container.clientHeight;
    if (itemHeight === 0) return;

    const newIndex = Math.round(scrollPosition / itemHeight);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < clips.length) {
      setActiveIndex(newIndex);
      setIsPlaying(true);
    }
  }, [activeIndex, clips.length]);

  const scrollToClip = (index: number) => {
    if (!feedRef.current || index < 0 || index >= clips.length) return;
    const itemHeight = feedRef.current.clientHeight;
    feedRef.current.scrollTo({
      top: index * itemHeight,
      behavior: 'smooth'
    });
  };

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
    setShowPlayAnim(true);
    setTimeout(() => setShowPlayAnim(false), 700);
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      const currentClip = clips[activeIndex];
      if (currentClip && videoRefs.current[currentClip.id]) {
        videoRefs.current[currentClip.id]!.muted = next;
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (commentsDrawerOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToClip(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToClip(activeIndex - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, commentsDrawerOpen, isPlaying, isMuted]);

  const handleLike = (clipId: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    api.clips.like(clipId).catch(console.warn);
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        const liked = !c.isLiked;
        return {
          ...c,
          isLiked: liked,
          likesCount: liked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1)
        };
      }
      return c;
    }));
  };

  const triggerSacredBurst = (emoji: string, clipId: string) => {
    const id = Date.now() + Math.random();
    const left = 30 + Math.random() * 40; // 30% to 70%
    setFloatingReactions(prev => [...prev.slice(-15), { id, emoji, left }]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 1800);

    // Give subtle like boost or feedback
    if (isAuthenticated) {
      handleLike(clipId);
    }
  };

  const handleTimeUpdate = (clipId: string) => {
    const vid = videoRefs.current[clipId];
    if (vid && vid.duration) {
      setActiveClipProgress((vid.currentTime / vid.duration) * 100);
    }
  };

  const handleTimelineScrub = (e: React.MouseEvent<HTMLDivElement>, clipId: string) => {
    e.stopPropagation();
    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const vid = videoRefs.current[clipId];
    if (vid && vid.duration) {
      vid.currentTime = percent * vid.duration;
      setActiveClipProgress(percent * 100);
    }
  };

  const handleSave = (clipId: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        return {
          ...c,
          isSaved: !c.isSaved
        };
      }
      return c;
    }));
  };

  const handleToggleFollow = (userId: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setFollowedAuthors(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleShare = (clip: Clip) => {
    const url = window.location.origin + '/clips?id=' + clip.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      alert('Ссылка на клип скопирована!');
    }
  };

  const openComments = (clip: Clip) => {
    setActiveClipForComments(clip);
    setCommentsDrawerOpen(true);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeClipForComments) return;
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const newComment: ClipComment = {
      id: 'cc_' + Date.now(),
      user: currentUser,
      text: newCommentText.trim(),
      timeAgo: 'только что',
      likes: 0
    };

    setClips(prev => prev.map(c => {
      if (c.id === activeClipForComments.id) {
        const updatedComments = [newComment, ...(c.comments || [])];
        const updatedClip = {
          ...c,
          comments: updatedComments,
          commentsCount: c.commentsCount + 1
        };
        setActiveClipForComments(updatedClip);
        return updatedClip;
      }
      return c;
    }));

    setNewCommentText('');
  };

  const handleLikeComment = (commentId: string) => {
    if (!activeClipForComments) return;
    setClips(prev => prev.map(c => {
      if (c.id === activeClipForComments.id && c.comments) {
        const updatedComments = c.comments.map(cm => {
          if (cm.id === commentId) {
            return { ...cm, likes: (cm.likes || 0) + 1 };
          }
          return cm;
        });
        const updatedClip = { ...c, comments: updatedComments };
        setActiveClipForComments(updatedClip);
        return updatedClip;
      }
      return c;
    }));
  };

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const displayedClips = clips.filter(c => {
    if (activeTab === 'zen') {
      const isZen = (c.tags && c.tags.some(t => ['медитация', 'дзен', 'частота432', 'звук', 'гармония'].includes(t))) ||
        (c.caption && /медитац|дзен|432|звук|частот|гармон|поток/i.test(c.caption));
      if (!isZen) return false;
    }
    if (activeTab === 'live') {
      if (!c.isLive) return false;
    }
    if (activeTab === 'trending') {
      if (c.likesCount <= 10000) return false;
    }
    if (activeTab === 'my') {
      if (c.user.id !== currentUser.id) return false;
    }
    if (selectedTag !== 'Все') {
      const tagLower = selectedTag.toLowerCase();
      const hasTag = (c.tags && c.tags.some(t => t.toLowerCase().includes(tagLower))) || 
        (c.caption && c.caption.toLowerCase().includes(tagLower));
      if (!hasTag) return false;
    }
    return true;
  });

  if (isLoading) {
    return <div style={{ padding: '20px', color: '#fff' }}>Загрузка...</div>;
  }

  return (
    <div className="clips-page-container">
      {/* Cosmic Ambient Glow Behind Feed */}
      <div className="clips-ambient-glow-layer" aria-hidden="true">
        <div className="clips-glow-orb orb-purple" />
        <div className="clips-glow-orb orb-cyan" />
        <div className="clips-glow-orb orb-magenta" />
      </div>

      {/* Category Tab Selector & Quick Hashtag Chips (Top Bar) */}
      <div className="clips-top-header-panel">
        <div className="clips-category-nav-bar">
          <div className="clips-category-tabs">
            <button 
              type="button" 
              className={`clips-cat-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveTab('all'); setActiveIndex(0); scrollToClip(0); }}
            >
              <Sparkles size={14} />
              <span>Все</span>
            </button>
            <button 
              type="button" 
              className={`clips-cat-tab ${activeTab === 'zen' ? 'active' : ''}`}
              onClick={() => { setActiveTab('zen'); setActiveIndex(0); scrollToClip(0); }}
            >
              <Activity size={14} />
              <span>Дзен & Звук</span>
            </button>
            <button 
              type="button" 
              className={`clips-cat-tab live-tab ${activeTab === 'live' ? 'active' : ''}`}
              onClick={() => { setActiveTab('live'); setActiveIndex(0); scrollToClip(0); }}
            >
              <Radio size={14} className="clip-live-pulse-icon" />
              <span>LIVE</span>
              <span className="clips-live-dot" />
            </button>
            <button 
              type="button" 
              className={`clips-cat-tab ${activeTab === 'trending' ? 'active' : ''}`}
              onClick={() => { setActiveTab('trending'); setActiveIndex(0); scrollToClip(0); }}
            >
              <Flame size={14} />
              <span>В тренде</span>
            </button>
            <button 
              type="button" 
              className={`clips-cat-tab ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => { setActiveTab('my'); setActiveIndex(0); scrollToClip(0); }}
            >
              <Users size={14} />
              <span>Мои</span>
            </button>
          </div>

          {/* Prominent Upload Clip Button in Top Bar */}
          <button 
            type="button" 
            className="clips-upload-btn-header"
            onClick={handleTriggerUpload}
            title="Загрузить свой клип"
          >
            <Plus size={16} />
            <span>Загрузить клип</span>
          </button>
        </div>

        {/* Quick Hashtag Chips Filter Bar */}
        <div className="clips-hashtag-chips-bar">
          {QUICK_HASHTAGS.map(tag => (
            <button
              key={tag}
              type="button"
              className={`clips-hashtag-chip ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => { setSelectedTag(tag); setActiveIndex(0); scrollToClip(0); }}
            >
              <Hash size={11} className="hashtag-hash-icon" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="clips-feed-wrapper">
        <div className="clip-nav-arrows">
          <button 
            type="button"
            className="clip-arrow-btn clip-upload-side-btn" 
            onClick={handleTriggerUpload}
            title="Загрузить клип"
          >
            <Plus size={20} />
          </button>
          <button 
            type="button"
            className="clip-arrow-btn" 
            onClick={() => scrollToClip(activeIndex - 1)}
            disabled={activeIndex === 0 || displayedClips.length === 0}
            title="Предыдущий клип"
          >
            <ChevronUp size={22} />
          </button>
          <button 
            type="button"
            className="clip-arrow-btn" 
            onClick={() => scrollToClip(activeIndex + 1)}
            disabled={activeIndex === displayedClips.length - 1 || displayedClips.length === 0}
            title="Следующий клип"
          >
            <ChevronDown size={22} />
          </button>
        </div>

        <div className="clips-feed" ref={feedRef} onScroll={handleScroll}>
          {displayedClips.length === 0 ? (
            <div className="clips-empty-state">
              <div className="clips-empty-icon-wrapper">
                <Video size={48} />
              </div>
              <h2 className="clips-empty-title">Клипов пока нет</h2>
              <p className="clips-empty-subtitle">
                Опубликуйте первое короткое видео и запустите новую волну в экосистеме!
              </p>
              <button 
                type="button" 
                className="clips-empty-btn"
                onClick={handleTriggerUpload}
              >
                <Plus size={18} />
                <span>Загрузить первый клип</span>
              </button>
            </div>
          ) : (
            displayedClips.map((clip, index) => {
            const isCurrent = index === activeIndex;
            const isFollowed = followedAuthors[clip.user.id];
            const isCaptionExpanded = expandedCaptions[clip.id];

            return (
              <div key={clip.id} className="clip-item-card">
                {/* Central Video Container */}
                <div className="clip-video-wrapper">
                  {/* Top Floating Badge */}
                  <div className="clip-top-bar">
                    <div className="clip-top-bar-left">
                      {clip.isLive ? (
                        <div className="clip-live-brand-tag">
                          <span className="clip-live-flashing-dot" />
                          <span className="clip-live-text">В ЭФИРЕ • LIVE</span>
                          {clip.viewersCount && (
                            <span className="clip-live-viewers">
                              <Users size={12} /> {clip.viewersCount.toLocaleString('ru-RU')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="clip-brand-tag">
                          <span className="clip-brand-dot" />
                          <span>Reels • New Age</span>
                        </div>
                      )}

                      {/* Soundwave Equalizer Badge */}
                      <div className="clip-soundwave-badge" title="Аудио резонанс 432 Гц">
                        <div className="clip-soundwave-bars">
                          <span className={`sw-bar sw-bar-1 ${isCurrent && isPlaying && !isMuted ? 'active' : ''}`} />
                          <span className={`sw-bar sw-bar-2 ${isCurrent && isPlaying && !isMuted ? 'active' : ''}`} />
                          <span className={`sw-bar sw-bar-3 ${isCurrent && isPlaying && !isMuted ? 'active' : ''}`} />
                          <span className={`sw-bar sw-bar-4 ${isCurrent && isPlaying && !isMuted ? 'active' : ''}`} />
                        </div>
                        <span className="clip-soundwave-text">432 Гц</span>
                      </div>
                    </div>

                    <button type="button" className="clip-create-btn" title="Запустить волну" onClick={handleTriggerUpload}>
                      <Plus size={15} />
                      <span>Волна</span>
                    </button>
                  </div>

                  {/* Video Player */}
                  <video
                    ref={el => { videoRefs.current[clip.id] = el; }}
                    className="clip-video-element"
                    src={clip.videoUrl}
                    poster={clip.poster}
                    loop
                    playsInline
                    muted={isMuted}
                    onClick={togglePlayPause}
                    onTimeUpdate={() => isCurrent && handleTimeUpdate(clip.id)}
                  />

                  {/* Big Play/Pause Center Indicator */}
                  {isCurrent && showPlayAnim && (
                    <div className="clip-center-play-indicator">
                      {isPlaying ? <Play size={36} fill="#fff" /> : <Pause size={36} fill="#fff" />}
                    </div>
                  )}

                  {/* Floating Particles / Sacred Energy Burst */}
                  {isCurrent && (
                    <div className="clip-floating-particles-layer" aria-hidden="true">
                      {floatingReactions.map(r => (
                        <div 
                          key={r.id} 
                          className="clip-floating-particle"
                          style={{ left: `${r.left}%` }}
                        >
                          {r.emoji}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Aesthetic Gothic / Spiritual Subtitle Overlay like in screenshot */}
                  {clip.overlayTitle && (
                    <div className="clip-overlay-title-banner">
                      <div className="clip-overlay-title-text">{clip.overlayTitle}</div>
                    </div>
                  )}

                  {/* In-Video Mute / Unmute Button (Bottom Right) */}
                  <button 
                    type="button"
                    className="clip-invideo-mute-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    title={isMuted ? 'Включить звук' : 'Выключить звук'}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>

                  {/* Bottom Info inside Video (Author, Follow, AI badge, Caption, Music, Sacred Reactions) */}
                  <div className="clip-bottom-info">
                    {/* Sacred Energy Reactions Tray (Ethereal glass pill) */}
                    <div className="clip-sacred-reactions-tray">
                      {['✨', '🧘', '🌊', '🔥', '🪐', '🤍'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className="clip-sacred-reaction-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerSacredBurst(emoji, clip.id);
                          }}
                          title={`Поделиться энергией ${emoji}`}
                        >
                          <span className="sacred-emoji">{emoji}</span>
                        </button>
                      ))}
                    </div>

                    {/* Author Row */}
                    <div className="clip-author-row">
                      <Link to="/profile" className="clip-author-avatar-wrap">
                        <img 
                          src={clip.user.avatar} 
                          alt={clip.user.name} 
                          className="clip-author-avatar" 
                        />
                      </Link>
                      <div className="clip-author-info-col">
                        <div className="clip-author-names-line">
                          <Link to="/profile" className="clip-author-username">
                            {clip.user.name}
                          </Link>
                          <span className="clip-dot-sep">•</span>
                          {clip.user.id !== currentUser.id && (
                            <button 
                              type="button"
                              className={`clip-follow-btn ${isFollowed ? 'following' : ''}`}
                              onClick={() => handleToggleFollow(clip.user.id)}
                            >
                              {isFollowed ? 'Подписки' : 'Подписаться'}
                            </button>
                          )}
                        </div>

                        {/* AI Generated Content badge from screenshot */}
                        {clip.isAiGenerated && (
                          <div className="clip-ai-badge-pill" title="Профиль, сгенерированный ИИ • ИИ-контент">
                            <span className="clip-ai-sparkle">✨</span>
                            <span>Профиль, сгенерированный ИИ • ИИ-контент</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Caption / Description with "... еще" */}
                    <div className={`clip-caption-wrap ${isCaptionExpanded ? 'expanded' : ''}`}>
                      <p className="clip-caption-text">
                        <span className="clip-caption-author">{clip.user.name}</span>{' '}
                        {clip.caption}
                      </p>
                      {clip.caption.length > 60 && (
                        <button 
                          type="button"
                          className="clip-more-toggle"
                          onClick={() => setExpandedCaptions(p => ({ ...p, [clip.id]: !p[clip.id] }))}
                        >
                          {isCaptionExpanded ? 'Свернуть' : '... ещё'}
                        </button>
                      )}
                    </div>

                    {/* Music track ticker row */}
                    <div className="clip-music-row">
                      <Music size={13} className="clip-music-icon" />
                      <div className="clip-music-ticker-wrap">
                        <span className="clip-music-name">
                          {clip.musicTitle || 'Оригинальный звук'} • {clip.musicAuthor || clip.user.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Glowing Neon Timeline Scrubber Progress Bar */}
                  <div 
                    className="clip-timeline-progress-track"
                    onClick={(e) => handleTimelineScrub(e, clip.id)}
                    title="Перемотка клипа"
                  >
                    <div 
                      className="clip-timeline-progress-fill" 
                      style={{ width: `${isCurrent ? activeClipProgress : 0}%` }}
                    >
                      <div className="clip-timeline-progress-glow-dot" />
                    </div>
                  </div>
                </div>

                {/* Right Action Column (Outside Video on Desktop, exactly like Instagram Reels) */}
                <div className="clip-right-actions-column">
                  {/* Like */}
                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className={`clip-action-btn ${clip.isLiked ? 'liked' : ''}`}
                      onClick={() => handleLike(clip.id)}
                      title={clip.isLiked ? 'Нравится' : 'Поставить лайк'}
                    >
                      <Heart size={24} fill={clip.isLiked ? '#ef4444' : 'none'} color={clip.isLiked ? '#ef4444' : '#fff'} />
                    </button>
                    <span className="clip-action-count">{formatCount(clip.likesCount)}</span>
                  </div>

                  {/* Comment */}
                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className="clip-action-btn"
                      onClick={() => openComments(clip)}
                      title="Комментарии"
                    >
                      <MessageCircle size={24} color="#fff" />
                    </button>
                    <span className="clip-action-count">{formatCount(clip.commentsCount)}</span>
                  </div>

                  {/* Share / Repost */}
                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className="clip-action-btn"
                      onClick={() => handleShare(clip)}
                      title="Поделиться"
                    >
                      <Share2 size={23} color="#fff" />
                    </button>
                    <span className="clip-action-count">{clip.sharesCount || 56}</span>
                  </div>

                  {/* Save / Bookmark */}
                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className={`clip-action-btn ${clip.isSaved ? 'saved' : ''}`}
                      onClick={() => handleSave(clip.id)}
                      title={clip.isSaved ? 'Сохранено' : 'Сохранить'}
                    >
                      <Bookmark size={24} fill={clip.isSaved ? '#fff' : 'none'} color="#fff" />
                    </button>
                  </div>

                  {/* More Options (...) */}
                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className="clip-action-btn"
                      onClick={() => handleShare(clip)}
                      title="Параметры"
                    >
                      <span className="clip-dots-icon">•••</span>
                    </button>
                  </div>

                  {/* Spinning Sacred Vinyl Mandala Disc */}
                  <div 
                    className="clip-sound-cover-btn"
                    onClick={toggleMute}
                    title={clip.musicTitle || 'Аудиодорожка (нажмите, чтобы включить/выключить звук)'}
                  >
                    <div className={`clip-vinyl-mandala ${isCurrent && isPlaying ? 'spinning' : 'paused'}`}>
                      <img 
                        src={clip.audioTrackArt || clip.user.avatar || clip.poster} 
                        alt="Audio Art" 
                        className="clip-audio-art-thumb" 
                      />
                      <div className="clip-vinyl-center-pin">
                        <Disc3 size={10} color="#fff" />
                      </div>
                    </div>
                    {isCurrent && isPlaying && !isMuted && (
                      <div className="clip-audio-floating-notes" aria-hidden="true">
                        <span className="clip-note-symbol note-1">♪</span>
                        <span className="clip-note-symbol note-2">♫</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
      </div>

      {commentsDrawerOpen && activeClipForComments && (
        <div className="clip-comments-drawer-overlay" onClick={() => setCommentsDrawerOpen(false)}>
          <div className="clip-comments-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="clip-comments-header">
              <button 
                type="button"
                className="clip-comments-close" 
                onClick={() => setCommentsDrawerOpen(false)}
                title="Закрыть комментарии"
              >
                <X size={18} />
              </button>
              <span className="clip-comments-title">
                Комментарии
              </span>
              <div style={{ width: 24 }} />
            </div>

            <div className="clip-comments-list">
              {activeClipForComments.comments && activeClipForComments.comments.length > 0 ? (
                activeClipForComments.comments.map((c) => (
                  <div key={c.id} className="clip-comment-item">
                    <img 
                      src={c.user.avatar} 
                      alt={c.user.name} 
                      className="clip-comment-avatar" 
                    />
                    <div className="clip-comment-body">
                      <div className="clip-comment-line">
                        <span className="clip-comment-author">{c.user.username || c.user.name}</span>
                        <span className="clip-comment-time">{c.timeAgo}</span>
                      </div>
                      <p className="clip-comment-text">{c.text}</p>
                      
                      <div className="clip-comment-subactions">
                        <button type="button" className="comment-subaction-link" onClick={() => setNewCommentText(`@${c.user.username || c.user.name} `)}>
                          Ответить
                        </button>
                        <button type="button" className="comment-subaction-link">
                          Показать перевод
                        </button>
                      </div>

                      <div className="comment-replies-row">
                        <span className="comment-replies-line" />
                        <span className="comment-replies-text">Смотреть все ответы (1)</span>
                      </div>
                    </div>

                    <button 
                      type="button"
                      className="clip-comment-like-btn"
                      onClick={() => handleLikeComment(c.id)}
                      title="Нравится"
                    >
                      <Heart size={14} fill={(c.likes || 0) > 0 ? '#ef4444' : 'none'} color={(c.likes || 0) > 0 ? '#ef4444' : '#8e8e8e'} />
                      {(c.likes || 0) > 0 && <span className="comment-like-count">{c.likes}</span>}
                    </button>
                  </div>
                ))
              ) : (
                <div className="clip-comments-empty">
                  Пока нет комментариев. Будьте первыми!
                </div>
              )}
            </div>

            <form className="clip-comment-input-form" onSubmit={handleAddComment}>
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="clip-comment-my-avatar"
              />
              <div className="clip-comment-input-wrap">
                <input 
                  type="text" 
                  className="clip-comment-input"
                  placeholder={isAuthenticated ? 'Добавьте комментарий...' : 'Войдите, чтобы комментировать'}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  disabled={!isAuthenticated}
                />
                <button 
                  type="button" 
                  className="clip-comment-emoji-btn"
                  title="Эмодзи"
                  onClick={() => setNewCommentText(prev => prev + '❤️')}
                >
                  <Smile size={18} />
                </button>
              </div>
              {newCommentText.trim() && (
                <button 
                  type="submit" 
                  className="clip-comment-send-btn"
                  disabled={!isAuthenticated || !newCommentText.trim()}
                  title="Опубликовать"
                >
                  <Send size={15} />
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      <input 
        type="file" 
        accept="video/*" 
        style={{ display: 'none' }} 
        ref={uploadInputRef}
        onChange={handleVideoFileChange}
      />

      <UploadWaveModal 
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        videoFile={selectedVideoFile}
        description={waveDescription}
        setDescription={setWaveDescription}
        onPublish={handlePublishWave}
      />

      {/* Floating Action Button for quick upload */}
      <button 
        type="button" 
        className="clips-mobile-fab-btn"
        onClick={handleTriggerUpload}
        title="Загрузить клип"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}


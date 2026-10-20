import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, 
  Play, Pause, Plus, Music, ChevronUp, ChevronDown, X, Send, Smile,
  Radio, Users, Sparkles, Flame, Video, Activity, Hash, Disc3,
  Search, Edit3, Trash2, Flag, Link2, Eye, BarChart3, TrendingUp,
  ArrowUpRight, CheckCircle2, Film
} from 'lucide-react';
import { type Clip, type ClipComment } from '../data/mock';
import { api, resolveMediaUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { UploadWaveModal } from '../components/UploadWaveModal';
import './ClipsPage.css';

type ClipTab = 'all' | 'zen' | 'live' | 'trending' | 'my';

const QUICK_HASHTAGS = ['Все', 'медитация', 'дзен', 'частота432', 'космос', 'звук', 'гармония'];

function captureVideoPoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      const tempUrl = URL.createObjectURL(file);
      video.src = tempUrl;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.onloadeddata = () => {
        video.currentTime = Math.min(1.0, video.duration > 1 ? 1.0 : 0.1);
      };
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              URL.revokeObjectURL(tempUrl);
              resolve(blob);
            }, 'image/jpeg', 0.85);
            return;
          }
        } catch {
          // ignore
        }
        URL.revokeObjectURL(tempUrl);
        resolve(null);
      };
      video.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export function ClipsPage() {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [searchParams] = useSearchParams();
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failedVideoIds, setFailedVideoIds] = useState<Record<string, boolean>>({});
  const userStorageKey = `newage_viewed_clips_${currentUser?.id || 'guest'}`;
  const viewedClipsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(userStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          viewedClipsRef.current = new Set(parsed);
        }
      }
    } catch (_) {}
  }, [userStorageKey]);

  useEffect(() => {
    let mounted = true;
    try {
      localStorage.removeItem('newage_clips_state');
    } catch (_) {}

    api.clips.list().then((data) => {
      if (mounted) {
        let finalClips: Clip[] = Array.isArray(data) ? data : [];
        
        // Удаляем битые (blob:) ссылки, тестовые фейковые клипы и потерянные видеофайлы
        finalClips = finalClips.filter(c => 
          c && c.videoUrl && 
          !c.videoUrl.startsWith('blob:') && 
          !c.videoUrl.includes('googleapis.com/sample') &&
          !c.videoUrl.includes('clip_1792408583_4c824401') &&
          !c.id.startsWith('clip_zen_')
        );

        setClips(finalClips);
        setIsLoading(false);

        // Автоскролл к конкретному клипу при переходе из профиля / по ссылке ?id=...
        const targetId = searchParams.get('id');
        if (targetId) {
          const targetIndex = finalClips.findIndex(c => c.id === targetId);
          if (targetIndex !== -1) {
            setActiveIndex(targetIndex);
            setTimeout(() => {
              if (feedRef.current) {
                feedRef.current.scrollTo({
                  top: targetIndex * feedRef.current.clientHeight,
                  behavior: 'auto'
                });
              }
            }, 150);
          }
        }
      }
    }).catch(err => {
      console.warn('Failed to load clips', err);
      if (mounted) {
        setClips([]);
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [searchParams]);

  // Options menu & Edit Clip state
  const [menuClip, setMenuClip] = useState<Clip | null>(null);
  const [editingClip, setEditingClip] = useState<Clip | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editSoundTitle, setEditSoundTitle] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deleteConfirmClip, setDeleteConfirmClip] = useState<Clip | null>(null);
  const [isDeletingClip, setIsDeletingClip] = useState(false);

  // Statistics modal state
  const [statsClip, setStatsClip] = useState<Clip | null>(null);
  const [statsTab, setStatsTab] = useState<'overview' | 'retention' | 'audience'>('overview');
  const [statsCopied, setStatsCopied] = useState(false);

  const isMyClip = (clip: Clip) => {
    if (!currentUser || !clip) return false;
    return clip.user?.id === currentUser.id || clip.user?.username === currentUser.username;
  };

  const handleOpenStats = (clip: Clip) => {
    setMenuClip(null);
    setStatsClip(clip);
    setStatsTab('overview');
    setStatsCopied(false);
  };

  const handleOpenEdit = (clip: Clip) => {
    setMenuClip(null);
    setEditingClip(clip);
    setEditCaption(clip.caption || '');
    setEditSoundTitle(clip.musicTitle || '');
  };

  const handleSaveEdit = async () => {
    if (!editingClip || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await api.clips.update(editingClip.id, {
        caption: editCaption.trim(),
        soundTitle: editSoundTitle.trim()
      });
      setClips(prev => prev.map(c => c.id === editingClip.id ? {
        ...c,
        caption: editCaption.trim(),
        musicTitle: editSoundTitle.trim() || c.musicTitle
      } : c));
      setEditingClip(null);
    } catch (err: any) {
      alert('Ошибка при сохранении: ' + (err?.message || 'Попробуйте снова'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteClip = async (clip: Clip) => {
    if (isDeletingClip) return;
    setIsDeletingClip(true);
    try {
      await api.clips.delete(clip.id);
      setClips(prev => prev.filter(c => c.id !== clip.id));
      window.dispatchEvent(new CustomEvent('clip_deleted', { detail: { id: clip.id } }));
      setDeleteConfirmClip(null);
      setMenuClip(null);
    } catch (err: any) {
      alert('Ошибка при удалении: ' + (err?.message || 'Попробуйте снова'));
    } finally {
      setIsDeletingClip(false);
    }
  };

  const [activeTab, setActiveTab] = useState<ClipTab>('all');
  const [selectedTag, setSelectedTag] = useState<string>('Все');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
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
  const [isPublishing, setIsPublishing] = useState(false);
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

  useEffect(() => {
    const handleOpenUploadEvent = () => {
      handleTriggerUpload();
    };
    window.addEventListener('open_clip_upload', handleOpenUploadEvent);
    return () => window.removeEventListener('open_clip_upload', handleOpenUploadEvent);
  }, [isAuthenticated]);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVideoFile(file);
      setWaveDescription('');
      setUploadModalOpen(true);
    }
    e.target.value = '';
  };

  const handlePublishWave = async () => {
    if (!selectedVideoFile || !currentUser || isPublishing) return;
    setIsPublishing(true);

    try {
      const formData = new FormData();
      formData.append('video', selectedVideoFile);
      formData.append('caption', waveDescription.trim());
      formData.append('soundTitle', `Оригинальный звук • ${currentUser.name}`);

      // Извлекаем постер первого кадра
      try {
        const posterBlob = await captureVideoPoster(selectedVideoFile);
        if (posterBlob) {
          formData.append('poster', posterBlob, 'poster.jpg');
        }
      } catch (posterErr) {
        console.warn('Could not generate video poster', posterErr);
      }

      const res = await api.clips.create(formData);
      const serverClipId = res?.id || ('clip_' + Date.now());
      const serverVideoUrl = res?.videoUrl || '';
      const serverPoster = res?.poster || '';

      const newClip: Clip = {
        id: serverClipId,
        user: currentUser,
        videoUrl: serverVideoUrl,
        poster: serverPoster,
        caption: waveDescription.trim(),
        musicTitle: `Оригинальный звук • ${currentUser.name}`,
        musicAuthor: currentUser.name,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 0,
        isLiked: false,
        isSaved: false,
        timeAgo: 'Только что'
      };

      setClips(prev => [newClip, ...prev]);
      window.dispatchEvent(new CustomEvent('clip_created', { detail: newClip }));
      setUploadModalOpen(false);
      setSelectedVideoFile(null);
      setWaveDescription('');
      setActiveIndex(0);
      if (feedRef.current) feedRef.current.scrollTop = 0;
    } catch (err: any) {
      console.error('Ошибка загрузки видео:', err);
      alert('Ошибка при загрузке видео: ' + (err?.message || 'Пожалуйста, попробуйте снова'));
    } finally {
      setIsPublishing(false);
    }
  };

  const feedRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    const currentClip = clips[activeIndex];
    if (!currentClip) return;

    Object.keys(videoRefs.current).forEach((clipId) => {
      const vid = videoRefs.current[clipId];
      if (!vid) return;

      if (clipId === currentClip.id) {
        if (!viewedClipsRef.current.has(clipId)) {
          viewedClipsRef.current.add(clipId);
          try {
            localStorage.setItem(userStorageKey, JSON.stringify(Array.from(viewedClipsRef.current)));
          } catch (_) {}
          api.clips.view(clipId).then((res: any) => {
            if (res && res.data && typeof res.data.viewsCount === 'number') {
              setClips(prev => prev.map(c => c.id === clipId ? { ...c, viewsCount: res.data.viewsCount } : c));
            }
          }).catch(console.warn);
        }
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
      // Do not intercept keyboard shortcuts when typing in inputs, textareas or when any modal/drawer is active
      const target = e.target as HTMLElement | null;
      if (
        target && (
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable || 
          target.closest('input, textarea, [contenteditable="true"]')
        )
      ) {
        return;
      }

      if (commentsDrawerOpen || uploadModalOpen || Boolean(editingClip) || Boolean(deleteConfirmClip)) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToClip(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToClip(activeIndex - 1);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, commentsDrawerOpen, uploadModalOpen, editingClip, deleteConfirmClip, isPlaying, isMuted]);

  const handleLike = async (clipId: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    // Optimistic toggle first
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        const liked = !c.isLiked;
        return {
          ...c,
          isLiked: liked,
          likesCount: liked ? (c.likesCount || 0) + 1 : Math.max(0, (c.likesCount || 0) - 1)
        };
      }
      return c;
    }));

    try {
      const res = await api.clips.like(clipId);
      if (res?.data) {
        const { liked, likesCount } = res.data;
        setClips(prev => prev.map(c => c.id === clipId ? { ...c, isLiked: liked, likesCount } : c));
      }
    } catch (err) {
      console.warn('Like clip error', err);
    }
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

  const handleShare = async (clip: Clip) => {
    const url = window.location.origin + '/clips?id=' + clip.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    api.clips.share(clip.id).catch(console.warn);
    setClips(prev => prev.map(c => c.id === clip.id ? { ...c, sharesCount: (c.sharesCount || 0) + 1 } : c));
    alert('Ссылка на клип скопирована в буфер обмена!');
  };

  const openComments = async (clip: Clip) => {
    setActiveClipForComments(clip);
    setCommentsDrawerOpen(true);
    try {
      const res = await api.clips.getComments(clip.id);
      const serverComments = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      if (serverComments.length > 0) {
        setClips(prev => prev.map(c => c.id === clip.id ? { ...c, comments: serverComments, commentsCount: serverComments.length } : c));
        setActiveClipForComments(prev => prev && prev.id === clip.id ? { ...prev, comments: serverComments, commentsCount: serverComments.length } : prev);
      }
    } catch (e) {
      console.warn('Error loading clip comments', e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeClipForComments) return;
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const text = newCommentText.trim();
    setNewCommentText('');

    try {
      const res = await api.clips.addComment(activeClipForComments.id, text);
      if (res?.data?.comment) {
        const addedComment = res.data.comment;
        const totalCount = res.data.commentsCount || ((activeClipForComments.commentsCount || 0) + 1);
        setClips(prev => prev.map(c => {
          if (c.id === activeClipForComments.id) {
            const updatedComments = [addedComment, ...(c.comments || [])];
            const updatedClip = {
              ...c,
              comments: updatedComments,
              commentsCount: totalCount
            };
            setActiveClipForComments(updatedClip);
            return updatedClip;
          }
          return c;
        }));
        return;
      }
    } catch (err) {
      console.warn('Add comment error', err);
    }

    // Optimistic fallback
    const newComment: ClipComment = {
      id: 'cc_' + Date.now(),
      user: currentUser,
      text: text,
      timeAgo: 'только что',
      likes: 0
    };

    setClips(prev => prev.map(c => {
      if (c.id === activeClipForComments.id) {
        const updatedComments = [newComment, ...(c.comments || [])];
        const updatedClip = {
          ...c,
          comments: updatedComments,
          commentsCount: (c.commentsCount || 0) + 1
        };
        setActiveClipForComments(updatedClip);
        return updatedClip;
      }
      return c;
    }));
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

  let displayedClips = clips.filter(c => {
    if (activeTab === 'zen') {
      const isZen = (c.tags && c.tags.some(t => ['медитация', 'дзен', 'частота432', 'звук', 'гармония'].includes(t))) ||
        (c.caption && /медитац|дзен|432|звук|частот|гармон|поток/i.test(c.caption));
      if (!isZen) return false;
    }
    if (activeTab === 'live') {
      if (!c.isLive) return false;
    }
    if (activeTab === 'my') {
      if (c.user.id !== currentUser.id) return false;
    }
    if (selectedTag !== 'Все') {
      const tagLower = selectedTag.toLowerCase().replace(/^#/, '');
      const hasTag = (c.tags && c.tags.some(t => t.toLowerCase().includes(tagLower))) || 
        (c.caption && c.caption.toLowerCase().includes(tagLower));
      if (!hasTag) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase().replace(/^#/, '');
      const matchTag = c.tags && c.tags.some(t => t.toLowerCase().includes(q));
      const matchCaption = c.caption && c.caption.toLowerCase().includes(q);
      const matchAuthor = (c.user.name && c.user.name.toLowerCase().includes(q)) ||
                          (c.user.username && c.user.username.toLowerCase().includes(q));
      const matchMusic = (c.musicTitle && c.musicTitle.toLowerCase().includes(q)) ||
                         (c.musicAuthor && c.musicAuthor.toLowerCase().includes(q));
      if (!matchTag && !matchCaption && !matchAuthor && !matchMusic) return false;
    }
    return true;
  });

  if (activeTab === 'trending') {
    displayedClips = [...displayedClips].sort((a, b) => 
      ((b.likesCount || 0) * 3 + (b.viewsCount || 0) + (b.commentsCount || 0) + (b.sharesCount || 0)) -
      ((a.likesCount || 0) * 3 + (a.viewsCount || 0) + (a.commentsCount || 0) + (a.sharesCount || 0))
    );
  }

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
      {/* Category Tab Selector & Search Engine (Top Bar) */}
      <div className="clips-top-header-panel">
        <div className="clips-category-nav-bar">
          <div className="clips-category-tabs">
            <button 
              type="button" 
              className={`clips-cat-tab ${activeTab === 'all' && !searchQuery && selectedTag === 'Все' ? 'active' : ''}`}
              onClick={() => { setActiveTab('all'); setSelectedTag('Все'); setSearchQuery(''); setActiveIndex(0); scrollToClip(0); }}
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

          {/* Search Engine Trigger Button */}
          <button 
            type="button" 
            className={`clips-search-toggle-btn ${(isSearchOpen || searchQuery || selectedTag !== 'Все') ? 'active' : ''}`}
            onClick={() => setIsSearchOpen(prev => !prev)}
            title="Поиск клипов и теги"
          >
            <Search size={14} />
            {selectedTag !== 'Все' ? (
              <span className="clips-search-active-pill">#{selectedTag}</span>
            ) : searchQuery ? (
              <span className="clips-search-active-pill">{searchQuery}</span>
            ) : (
              <span>Поиск</span>
            )}
          </button>

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

        {/* Search Engine & Tags Popover */}
        {isSearchOpen && (
          <div className="clips-search-dropdown-panel" onClick={e => e.stopPropagation()}>
            <div className="clips-search-bar-row">
              <Search size={16} className="clips-search-bar-icon" />
              <input 
                type="text"
                className="clips-search-input-field"
                placeholder="Поиск по клипам, авторам или #тегам..."
                value={searchQuery}
                onChange={e => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val === '') {
                    setSelectedTag('Все');
                  }
                  setActiveIndex(0);
                  scrollToClip(0);
                }}
                autoFocus
              />
              {(searchQuery || selectedTag !== 'Все') && (
                <button 
                  type="button" 
                  className="clips-search-reset-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag('Все');
                    setActiveIndex(0);
                    scrollToClip(0);
                  }}
                  title="Очистить поиск"
                >
                  <X size={14} />
                </button>
              )}
              <button 
                type="button" 
                className="clips-search-done-btn"
                onClick={() => setIsSearchOpen(false)}
              >
                Готово
              </button>
            </div>

            {/* Quick Hashtags in Search Engine */}
            <div className="clips-search-hashtags-section">
              <div className="clips-search-tags-heading">
                <Hash size={12} />
                <span>Теги для быстрого поиска:</span>
              </div>
              <div className="clips-search-tags-wrap">
                {QUICK_HASHTAGS.map(tag => {
                  const isCurrentTagActive = selectedTag === tag || (tag !== 'Все' && searchQuery.toLowerCase().includes(tag.toLowerCase()));
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`clips-search-tag-chip ${isCurrentTagActive ? 'active' : ''}`}
                      onClick={() => {
                        if (tag === 'Все') {
                          setSelectedTag('Все');
                          setSearchQuery('');
                        } else {
                          setSelectedTag(tag);
                          setSearchQuery(`#${tag}`);
                        }
                        setActiveIndex(0);
                        scrollToClip(0);
                      }}
                    >
                      <Hash size={11} className="hashtag-chip-icon" />
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Subtle Active Filter Pill when Search Panel is closed */}
        {!isSearchOpen && (selectedTag !== 'Все' || searchQuery) && (
          <div className="clips-active-filter-badge">
            <span className="active-filter-text">
              Фильтр: <strong>{searchQuery || `#${selectedTag}`}</strong> ({displayedClips.length})
            </span>
            <button 
              type="button" 
              className="active-filter-close"
              onClick={() => {
                setSelectedTag('Все');
                setSearchQuery('');
                setActiveIndex(0);
                scrollToClip(0);
              }}
              title="Сбросить фильтр"
            >
              <X size={12} />
            </button>
          </div>
        )}
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
                {searchQuery || selectedTag !== 'Все' ? <Search size={44} /> : <Video size={48} />}
              </div>
              <h2 className="clips-empty-title">
                {searchQuery || selectedTag !== 'Все' ? 'Ничего не найдено' : 'Клипов пока нет'}
              </h2>
              <p className="clips-empty-subtitle">
                {searchQuery || selectedTag !== 'Все'
                  ? `По запросу ${searchQuery ? `«${searchQuery}»` : `#${selectedTag}`} клипов не обнаружено.`
                  : 'Опубликуйте первое короткое видео и запустите новую волну в экосистеме!'}
              </p>
              {searchQuery || selectedTag !== 'Все' ? (
                <button 
                  type="button" 
                  className="clips-empty-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag('Все');
                    setActiveIndex(0);
                    scrollToClip(0);
                  }}
                >
                  <span>Сбросить поиск</span>
                </button>
              ) : (
                <button 
                  type="button" 
                  className="clips-empty-btn"
                  onClick={handleTriggerUpload}
                >
                  <Plus size={18} />
                  <span>Загрузить первый клип</span>
                </button>
              )}
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
                  {/* Floating Live Badge if active stream */}
                  {clip.isLive && (
                    <div className="clip-live-brand-tag" style={{ position: 'absolute', top: 14, left: 14, zIndex: 20 }}>
                      <span className="clip-live-flashing-dot" />
                      <span className="clip-live-text">В ЭФИРЕ • LIVE</span>
                      {clip.viewersCount && (
                        <span className="clip-live-viewers">
                          <Users size={12} /> {clip.viewersCount.toLocaleString('ru-RU')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Video Player */}
                  <video
                    ref={el => { videoRefs.current[clip.id] = el; }}
                    className="clip-video-element"
                    src={resolveMediaUrl(clip.videoUrl)}
                    poster={resolveMediaUrl(clip.poster)}
                    onError={() => setFailedVideoIds(prev => ({ ...prev, [clip.id]: true }))}
                    loop
                    playsInline
                    muted={isMuted}
                    onClick={togglePlayPause}
                    onTimeUpdate={() => isCurrent && handleTimeUpdate(clip.id)}
                  />

                  {failedVideoIds[clip.id] && (
                    <div className="clip-video-error-fallback">
                      <Video size={42} className="clip-error-icon" />
                      <p>Видео обрабатывается или временно недоступно</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
                        <button 
                          type="button" 
                          className="clip-retry-play-btn" 
                          onClick={() => {
                            setFailedVideoIds(prev => ({ ...prev, [clip.id]: false }));
                            const vid = videoRefs.current[clip.id];
                            if (vid) {
                              vid.load();
                              vid.play().catch(console.warn);
                            }
                          }}
                        >
                          Повторить
                        </button>
                        {index < displayedClips.length - 1 && (
                          <button
                            type="button"
                            className="clip-retry-play-btn"
                            style={{ background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.25)' }}
                            onClick={() => {
                              if (feedRef.current) {
                                feedRef.current.scrollTo({
                                  top: (index + 1) * feedRef.current.clientHeight,
                                  behavior: 'smooth'
                                });
                              }
                            }}
                          >
                            Следующий клип
                          </button>
                        )}
                        {isMyClip(clip) && (
                          <button
                            type="button"
                            className="clip-retry-play-btn"
                            style={{ background: 'rgba(239, 68, 68, 0.3)', borderColor: 'rgba(239, 68, 68, 0.6)', color: '#fca5a5' }}
                            onClick={() => setDeleteConfirmClip(clip)}
                          >
                            Удалить клип
                          </button>
                        )}
                      </div>
                    </div>
                  )}

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
                    <span className="clip-action-count">{formatCount(clip.likesCount || 0)}</span>
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
                    <span className="clip-action-count">{formatCount(clip.commentsCount || 0)}</span>
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
                    <span className="clip-action-count">{formatCount(clip.sharesCount || 0)}</span>
                  </div>

                  {/* Real Views counter & Analytics trigger */}
                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className="clip-action-btn clip-views-btn" 
                      onClick={() => handleOpenStats(clip)}
                      title="Посмотреть статистику видео"
                    >
                      <Eye size={23} color="#fff" />
                    </button>
                    <span className="clip-action-count">{formatCount(clip.viewsCount || 0)}</span>
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
                      onClick={() => setMenuClip(clip)}
                      title="Параметры видео"
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
        isPublishing={isPublishing}
      />

      {/* Action Sheet / 3-dots Options Modal */}
      {menuClip && (
        <div className="clip-menu-backdrop" onClick={() => setMenuClip(null)}>
          <div className="clip-menu-sheet" onClick={e => e.stopPropagation()}>
            <div className="clip-menu-header">
              <span className="clip-menu-drag-handle" />
              <div className="clip-menu-title">Параметры волны</div>
            </div>

            <div className="clip-menu-options">
              <button 
                type="button" 
                className="clip-menu-item stats-item"
                onClick={() => handleOpenStats(menuClip)}
              >
                <BarChart3 size={19} />
                <span>Статистика видео</span>
              </button>

              {isMyClip(menuClip) ? (
                <>
                  <button 
                    type="button" 
                    className="clip-menu-item edit-item"
                    onClick={() => handleOpenEdit(menuClip)}
                  >
                    <Edit3 size={19} />
                    <span>Редактировать описание и звук</span>
                  </button>

                  <button 
                    type="button" 
                    className="clip-menu-item delete-item"
                    onClick={() => {
                      setDeleteConfirmClip(menuClip);
                      setMenuClip(null);
                    }}
                  >
                    <Trash2 size={19} />
                    <span>Удалить видео</span>
                  </button>
                </>
              ) : (
                <button 
                  type="button" 
                  className="clip-menu-item report-item"
                  onClick={() => {
                    alert('Жалоба отправлена модераторам');
                    setMenuClip(null);
                  }}
                >
                  <Flag size={19} />
                  <span>Пожаловаться</span>
                </button>
              )}

              <button 
                type="button" 
                className="clip-menu-item"
                onClick={() => {
                  handleShare(menuClip);
                  setMenuClip(null);
                }}
              >
                <Link2 size={19} />
                <span>Скопировать ссылку</span>
              </button>

              <button 
                type="button" 
                className="clip-menu-item cancel-item"
                onClick={() => setMenuClip(null)}
              >
                <span>Отмена</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Statistics Modal */}
      {statsClip && (
        <div className="clip-stats-backdrop" onClick={() => setStatsClip(null)}>
          <div className="clip-stats-modal" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="clip-stats-header">
              <div className="clip-stats-title-col">
                <span className="clip-stats-badge">
                  <BarChart3 size={13} /> Аналитика
                </span>
                <h3 className="clip-stats-title">Статистика видео</h3>
              </div>
              <button 
                type="button" 
                className="clip-stats-close-btn"
                onClick={() => setStatsClip(null)}
                title="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            {/* Clip Info Card */}
            <div className="clip-stats-info-card">
              <div className="clip-stats-thumb-wrap">
                {statsClip.poster ? (
                  <img src={resolveMediaUrl(statsClip.poster)} alt="Clip preview" className="clip-stats-thumb-img" />
                ) : (
                  <video src={resolveMediaUrl(statsClip.videoUrl)} className="clip-stats-thumb-img" muted playsInline />
                )}
                <div className="clip-stats-thumb-badge">
                  <Film size={11} />
                </div>
              </div>
              <div className="clip-stats-info-details">
                <p className="clip-stats-caption">{statsClip.caption || 'Клип без описания'}</p>
                <div className="clip-stats-meta-row">
                  <span className="clip-stats-author">{statsClip.user?.name || 'Автор'}</span>
                  <span className="clip-stats-dot">•</span>
                  <span className="clip-stats-time">{statsClip.timeAgo || 'Только что'}</span>
                </div>
                <div className="clip-stats-sound-tag">
                  <Music size={11} />
                  <span>{statsClip.musicTitle || `Оригинальный звук • ${statsClip.user?.name || 'Автор'}`}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="clip-stats-tabs">
              <button
                type="button"
                className={`clip-stats-tab-btn ${statsTab === 'overview' ? 'active' : ''}`}
                onClick={() => setStatsTab('overview')}
              >
                <Activity size={14} />
                <span>Обзор</span>
              </button>
              <button
                type="button"
                className={`clip-stats-tab-btn ${statsTab === 'retention' ? 'active' : ''}`}
                onClick={() => setStatsTab('retention')}
              >
                <TrendingUp size={14} />
                <span>Вовлеченность</span>
              </button>
              <button
                type="button"
                className={`clip-stats-tab-btn ${statsTab === 'audience' ? 'active' : ''}`}
                onClick={() => setStatsTab('audience')}
              >
                <Users size={14} />
                <span>Аудитория</span>
              </button>
            </div>

            {/* Tab 1: Overview */}
            {statsTab === 'overview' && (
              <div className="clip-stats-tab-content">
                {/* Hero Views Card */}
                <div className="clip-stats-hero-card">
                  <div className="stats-hero-top">
                    <span className="stats-hero-label">Общее количество просмотров</span>
                    <span className="stats-hero-trend">
                      <ArrowUpRight size={14} /> Активно в волнах
                    </span>
                  </div>
                  <div className="stats-hero-number-row">
                    <Eye size={28} className="stats-hero-icon" />
                    <span className="stats-hero-number">{statsClip.viewsCount || 0}</span>
                  </div>
                  <div className="stats-hero-subtext">
                    Уникальные воспроизведения в экосистеме New Age Unity
                  </div>
                </div>

                {/* Metrics 4-grid */}
                <div className="clip-stats-metrics-grid">
                  <div className="clip-stat-card">
                    <div className="stat-card-icon-wrap like">
                      <Heart size={16} />
                    </div>
                    <div className="stat-card-val">{statsClip.likesCount || 0}</div>
                    <div className="stat-card-label">Отметки «Нравится»</div>
                  </div>

                  <div className="clip-stat-card">
                    <div className="stat-card-icon-wrap comment">
                      <MessageCircle size={16} />
                    </div>
                    <div className="stat-card-val">{statsClip.commentsCount || 0}</div>
                    <div className="stat-card-label">Комментарии</div>
                  </div>

                  <div className="clip-stat-card">
                    <div className="stat-card-icon-wrap share">
                      <Share2 size={16} />
                    </div>
                    <div className="stat-card-val">{statsClip.sharesCount || 0}</div>
                    <div className="stat-card-label">Поделились</div>
                  </div>

                  <div className="clip-stat-card">
                    <div className="stat-card-icon-wrap save">
                      <Bookmark size={16} />
                    </div>
                    <div className="stat-card-val">{statsClip.isSaved ? 1 : 0}</div>
                    <div className="stat-card-label">В закладках</div>
                  </div>
                </div>

                {/* Retention Summary Bar */}
                <div className="clip-stats-subcard">
                  <div className="subcard-header">
                    <span className="subcard-title">Среднее время просмотра</span>
                    <span className="subcard-badge">~14 сек.</span>
                  </div>
                  <div className="stats-progress-container">
                    <div className="stats-progress-bar" style={{ width: '78%' }} />
                  </div>
                  <div className="subcard-footer-info">
                    <span>Досмотры: <strong>78%</strong> хронометража</span>
                    <span>Отличный интерес</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Retention & Engagement */}
            {statsTab === 'retention' && (
              <div className="clip-stats-tab-content">
                {/* Engagement Rate */}
                <div className="clip-stats-subcard er-card">
                  <div className="er-main-row">
                    <div>
                      <span className="er-title">Коэффициент вовлеченности (ER)</span>
                      <p className="er-desc">Доля лайков, комментариев и репостов на 100 просмотров</p>
                    </div>
                    <div className="er-value-badge">
                      {(((statsClip.likesCount || 0) + (statsClip.commentsCount || 0) + (statsClip.sharesCount || 0) + (statsClip.isSaved ? 1 : 0)) / Math.max(statsClip.viewsCount || 1, 1) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Retention Curve / Step timeline */}
                <div className="clip-stats-subcard">
                  <span className="subcard-title">Удержание внимания зрителей</span>
                  <div className="retention-steps-list">
                    <div className="retention-step-item">
                      <div className="retention-step-labels">
                        <span>0:00 • Старт видео</span>
                        <span className="retention-percent">100%</span>
                      </div>
                      <div className="retention-bar-bg">
                        <div className="retention-bar-fill" style={{ width: '100%' }} />
                      </div>
                    </div>

                    <div className="retention-step-item">
                      <div className="retention-step-labels">
                        <span>0:03 • Первые секунды</span>
                        <span className="retention-percent">88%</span>
                      </div>
                      <div className="retention-bar-bg">
                        <div className="retention-bar-fill" style={{ width: '88%' }} />
                      </div>
                    </div>

                    <div className="retention-step-item">
                      <div className="retention-step-labels">
                        <span>0:07 • Середина</span>
                        <span className="retention-percent">76%</span>
                      </div>
                      <div className="retention-bar-bg">
                        <div className="retention-bar-fill" style={{ width: '76%' }} />
                      </div>
                    </div>

                    <div className="retention-step-item">
                      <div className="retention-step-labels">
                        <span>Финал • Досмотрели до конца</span>
                        <span className="retention-percent highlight">62%</span>
                      </div>
                      <div className="retention-bar-bg">
                        <div className="retention-bar-fill highlight" style={{ width: '62%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Energy Reactions */}
                <div className="clip-stats-subcard">
                  <span className="subcard-title">Сакральные реакции зрителей</span>
                  <div className="energy-stats-pills">
                    <span className="energy-pill">✨ Сияние <strong>42%</strong></span>
                    <span className="energy-pill">🧘 Гармония <strong>26%</strong></span>
                    <span className="energy-pill">🌊 Волна <strong>18%</strong></span>
                    <span className="energy-pill">🔥 Огонь <strong>14%</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Audience */}
            {statsTab === 'audience' && (
              <div className="clip-stats-tab-content">
                {/* Traffic Sources */}
                <div className="clip-stats-subcard">
                  <span className="subcard-title">Источники трафика</span>
                  <div className="source-distribution-list">
                    <div className="source-item">
                      <div className="source-labels">
                        <span>🌊 Рекомендации «Лента волн»</span>
                        <span>82%</span>
                      </div>
                      <div className="source-bar-bg">
                        <div className="source-bar-fill" style={{ width: '82%', background: '#38bdf8' }} />
                      </div>
                    </div>

                    <div className="source-item">
                      <div className="source-labels">
                        <span>👤 Профиль автора и подписки</span>
                        <span>12%</span>
                      </div>
                      <div className="source-bar-bg">
                        <div className="source-bar-fill" style={{ width: '12%', background: '#a855f7' }} />
                      </div>
                    </div>

                    <div className="source-item">
                      <div className="source-labels">
                        <span>🔗 Прямые переходы и шеринг</span>
                        <span>6%</span>
                      </div>
                      <div className="source-bar-bg">
                        <div className="source-bar-fill" style={{ width: '6%', background: '#10b981' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Viewer Type */}
                <div className="clip-stats-subcard">
                  <span className="subcard-title">Тип аудитории</span>
                  <div className="viewer-type-row">
                    <div className="viewer-type-box">
                      <span className="viewer-type-val">76%</span>
                      <span className="viewer-type-name">Новые зрители</span>
                    </div>
                    <div className="viewer-type-divider" />
                    <div className="viewer-type-box">
                      <span className="viewer-type-val">24%</span>
                      <span className="viewer-type-name">Подписчики</span>
                    </div>
                  </div>
                </div>

                {/* Peak Hours */}
                <div className="clip-stats-subcard">
                  <div className="subcard-header">
                    <span className="subcard-title">Пик активности зрителей</span>
                    <span className="subcard-badge">19:00 — 23:00</span>
                  </div>
                  <p className="peak-hint">
                    В это время аудитория наиболее активно взаимодействует с вертикальными клипами и практиками.
                  </p>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="clip-stats-footer">
              <button
                type="button"
                className="btn-stats-copy"
                onClick={() => {
                  handleShare(statsClip);
                  setStatsCopied(true);
                  setTimeout(() => setStatsCopied(false), 2000);
                }}
              >
                {statsCopied ? <CheckCircle2 size={16} color="#10b981" /> : <Link2 size={16} />}
                <span>{statsCopied ? 'Ссылка скопирована!' : 'Скопировать ссылку на видео'}</span>
              </button>
              <button
                type="button"
                className="btn-stats-close"
                onClick={() => setStatsClip(null)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Clip Modal */}
      {editingClip && (
        <div className="clip-edit-modal-backdrop" onClick={() => !isSavingEdit && setEditingClip(null)}>
          <div className="clip-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="clip-edit-header">
              <div className="clip-edit-title">
                <Edit3 size={20} color="var(--color-accent, #a855f7)" />
                <span>Редактировать клип</span>
              </div>
              <button 
                type="button" 
                className="clip-edit-close" 
                onClick={() => !isSavingEdit && setEditingClip(null)}
                disabled={isSavingEdit}
              >
                <X size={20} />
              </button>
            </div>

            <div className="clip-edit-body">
              <div className="clip-edit-preview-row">
                <img 
                  src={resolveMediaUrl(editingClip.poster || editingClip.user?.avatar)} 
                  alt="Превью" 
                  className="clip-edit-thumb" 
                />
                <div className="clip-edit-preview-meta">
                  <span className="clip-edit-author">{editingClip.user?.name}</span>
                  <span className="clip-edit-note">Изменения мгновенно отобразятся в ленте и профиле</span>
                </div>
              </div>

              <div className="clip-edit-field">
                <label className="clip-edit-label">Описание / Подпись</label>
                <textarea
                  className="clip-edit-textarea"
                  value={editCaption}
                  onChange={e => setEditCaption(e.target.value)}
                  placeholder="Добавьте описание или хэштеги..."
                  rows={4}
                  maxLength={500}
                  disabled={isSavingEdit}
                />
                <span className="clip-edit-counter">{editCaption.length} / 500</span>
              </div>

              <div className="clip-edit-field">
                <label className="clip-edit-label">Название аудиодорожки</label>
                <input
                  type="text"
                  className="clip-edit-input"
                  value={editSoundTitle}
                  onChange={e => setEditSoundTitle(e.target.value)}
                  placeholder="Оригинальный звук..."
                  maxLength={100}
                  disabled={isSavingEdit}
                />
              </div>
            </div>

            <div className="clip-edit-footer">
              <button 
                type="button" 
                className="clip-edit-btn-cancel" 
                onClick={() => setEditingClip(null)}
                disabled={isSavingEdit}
              >
                Отмена
              </button>
              <button 
                type="button" 
                className="clip-edit-btn-save" 
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmClip && (
        <div className="clip-menu-backdrop" onClick={() => !isDeletingClip && setDeleteConfirmClip(null)}>
          <div className="clip-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="clip-confirm-icon-wrap">
              <Trash2 size={28} color="#ef4444" />
            </div>
            <h3 className="clip-confirm-title">Удалить это видео?</h3>
            <p className="clip-confirm-text">
              Видео будет навсегда удалено из вашей ленты и профиля. Это действие нельзя отменить.
            </p>
            <div className="clip-confirm-actions">
              <button 
                type="button" 
                className="clip-confirm-btn-delete"
                onClick={() => handleDeleteClip(deleteConfirmClip)}
                disabled={isDeletingClip}
              >
                {isDeletingClip ? 'Удаление...' : 'Да, удалить'}
              </button>
              <button 
                type="button" 
                className="clip-confirm-btn-cancel"
                onClick={() => setDeleteConfirmClip(null)}
                disabled={isDeletingClip}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}


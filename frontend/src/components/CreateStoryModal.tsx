import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Camera, Image as ImageIcon, Sparkles, Type, Check, 
  Radio, Video, Mic, MicOff, RefreshCw, Smile, 
  Square, Wand2, Eye,
  ArrowLeft, Music, Bookmark, AtSign, PenLine, 
  Download, MoreHorizontal, ChevronDown, ChevronUp, 
  ChevronRight, Star, LayoutTemplate, Grid2X2, Plus,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { type Story } from '../data/mock';
import './CreateStoryModal.css';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStory: (newStory: Story) => void;
}

// Instagram-like visual color/mood filters with CSS filters
export interface StoryFilter {
  id: string;
  name: string;
  filterCss: string;
  badgeColor: string;
}

export const STORY_FILTERS: StoryFilter[] = [
  { id: 'normal', name: 'Оригинал', filterCss: 'none', badgeColor: '#94A3B8' },
  { id: 'paris', name: 'Paris (Мягкий)', filterCss: 'contrast(105%) brightness(110%) saturate(115%)', badgeColor: '#F472B6' },
  { id: 'oslo', name: 'Oslo (Холодный)', filterCss: 'contrast(110%) saturate(90%) hue-rotate(190deg) brightness(105%)', badgeColor: '#38BDF8' },
  { id: 'tokyo', name: 'Tokyo (Неон)', filterCss: 'contrast(130%) saturate(140%) brightness(105%)', badgeColor: '#A855F7' },
  { id: 'vintage', name: 'Retro 90s', filterCss: 'sepia(45%) contrast(115%) brightness(95%) saturate(120%)', badgeColor: '#F59E0B' },
  { id: 'noir', name: 'Noir (Ч/Б)', filterCss: 'grayscale(100%) contrast(140%) brightness(95%)', badgeColor: '#475569' },
  { id: 'golden', name: 'Golden Hour', filterCss: 'sepia(30%) saturate(150%) brightness(108%) contrast(105%)', badgeColor: '#EAB308' },
  { id: 'cyberpunk', name: 'Cyberpunk', filterCss: 'contrast(140%) saturate(160%) hue-rotate(300deg)', badgeColor: '#EC4899' },
];

// AR Face Masks & Overlays
export interface StoryMask {
  id: string;
  name: string;
  icon: string;
  overlayType: 'glasses' | 'crown' | 'sparkles' | 'cat_ears' | 'cyber_visor' | 'angel_halo';
}

export const STORY_MASKS: StoryMask[] = [
  { id: 'none', name: 'Без маски', icon: '🚫', overlayType: 'sparkles' },
  { id: 'sparkles', name: 'Блестки / Сияние', icon: '✨', overlayType: 'sparkles' },
  { id: 'crown', name: 'Золотая корона', icon: '👑', overlayType: 'crown' },
  { id: 'glasses', name: 'Крутые очки', icon: '🕶️', overlayType: 'glasses' },
  { id: 'cat_ears', name: 'Кошачьи ушки', icon: '🐱', overlayType: 'cat_ears' },
  { id: 'cyber_visor', name: 'Кибер-визор', icon: '🥽', overlayType: 'cyber_visor' },
  { id: 'angel_halo', name: 'Нимб ангела', icon: '😇', overlayType: 'angel_halo' },
];

export interface StoryLens {
  id: string;
  name: string;
  icon: string;
  overlayType: StoryMask['overlayType'] | 'none';
  thumb?: string;
  filterCss?: string;
}

export const STORY_LENSES: StoryLens[] = [
  { id: 'none', name: 'Без эффекта', icon: '🚫', overlayType: 'none' },
  { id: 'sparkles', name: 'Блестки / Сияние', icon: '✨', overlayType: 'sparkles', thumb: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=150&q=80' },
  { id: 'crown', name: 'Золотая корона', icon: '👑', overlayType: 'crown', thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=150&q=80' },
  { id: 'glasses', name: 'Крутые очки', icon: '🕶️', overlayType: 'glasses', thumb: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=150&q=80' },
  { id: 'cat_ears', name: 'Кошачьи ушки', icon: '🐱', overlayType: 'cat_ears', thumb: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=150&q=80' },
  { id: 'cyber_visor', name: 'Кибер-визор', icon: '🥽', overlayType: 'cyber_visor', thumb: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=150&q=80' },
  { id: 'angel_halo', name: 'Нимб ангела', icon: '😇', overlayType: 'angel_halo', thumb: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=150&q=80' },
];

const STORY_PRESETS = [
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
];

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
  'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
];

const MUSIC_TRACKS = [
  { id: 'track1', title: 'Одинокая звезда', artist: 'New Age Sound', duration: '0:30' },
  { id: 'track2', title: 'Cosmic Zen Meditation', artist: 'Aura Vibes', duration: '0:30' },
  { id: 'track3', title: 'Lo-Fi Chill & Coffee', artist: 'BeatMaster', duration: '0:30' },
  { id: 'track4', title: 'Night Cyber City', artist: 'SynthPulse', duration: '0:30' },
];

export function CreateStoryModal({ isOpen, onClose, onCreateStory }: CreateStoryModalProps) {
  const { currentUser } = useAuth();
  
  // Screen views: 'camera' | 'gallery'
  const [screen, setScreen] = useState<'camera' | 'gallery'>('camera');

  // Camera modes: 'photo' | 'camera_record' | 'live'
  const [activeMode, setActiveMode] = useState<'photo' | 'camera_record' | 'live'>('camera_record');

  // Photo & Background states
  const [selectedImage, setSelectedImage] = useState<string>(STORY_PRESETS[0]);
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null);
  const [storyText, setStoryText] = useState('');
  const [textPosition, setTextPosition] = useState<'center' | 'bottom' | 'top'>('bottom');
  const [isPhotoSnapped, setIsPhotoSnapped] = useState(false);
  
  // Effects: Filter & AR Mask
  const [activeFilter, setActiveFilter] = useState<StoryFilter>(STORY_FILTERS[0]);
  const [activeMask, setActiveMask] = useState<StoryMask>(STORY_MASKS[0]);
  const [activeTab, setActiveTab] = useState<'effects' | 'backgrounds' | 'text'>('effects');
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);

  // Instagram AR Effect Wheel mode state
  const [isEffectWheelOpen, setIsEffectWheelOpen] = useState(false);
  const wheelTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEffectWheelOpen && wheelTrackRef.current) {
      const activeEl = wheelTrackRef.current.querySelector('.lens-center-active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [isEffectWheelOpen, activeMask.id]);

  // Right sidebar expanded state
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);

  // Camera & Recording states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // Gallery screen states
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'recent' | 'photos' | 'videos'>('recent');
  const [userUploadedImages, setUserUploadedImages] = useState<string[]>([]);

  // Live Stream broadcast states
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveViewersCount, setLiveViewersCount] = useState(14);
  const [liveHearts, setLiveHearts] = useState<number[]>([]);
  const [liveChatMessages, setLiveChatMessages] = useState<Array<{ id: number; name: string; text: string }>>([
    { id: 1, name: 'Алиса Иванова', text: 'Всем привет! 🔥 Отличный эфир' },
    { id: 2, name: 'Михаил Рецензент', text: 'Качество картинки супер!' },
  ]);
  const [liveNewMsg, setLiveNewMsg] = useState('');

  // Device Controls
  const [isMuted, setIsMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Refs
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordIntervalRef = useRef<any>(null);

  // Stop camera stream helper
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch { /* ignore */ }
      });
      mediaStreamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
  };

  // Resilient multi-tier camera getter
  const getCameraStream = async (facing: 'user' | 'environment'): Promise<MediaStream> => {
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      throw new Error('Для доступа к камере требуется безопасное соединение (HTTPS или localhost).');
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error('Ваш браузер не поддерживает API захвата камеры (getUserMedia).');
    }

    // 1. Попытка: идеальный facingMode с микрофоном
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
    } catch (err1) {
      console.warn('Camera attempt 1 (video+audio) failed:', err1);
    }

    // 2. Попытка: только видео с идеальным facingMode (если микрофон занят или запрещен)
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
        },
        audio: false,
      });
    } catch (err2) {
      console.warn('Camera attempt 2 (video-only with facingMode) failed:', err2);
    }

    // 3. Попытка: базовое видео без ограничений (для внешних веб-камер на ПК и виртуальных камер)
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    } catch (err3) {
      console.warn('Camera attempt 3 (generic video:true) failed:', err3);
      throw err3;
    }
  };

  // Start webcam
  const startCamera = async () => {
    setCameraError(null);
    setCameraLoading(true);
    stopCamera();
    try {
      const stream = await getCameraStream(facingMode);
      mediaStreamRef.current = stream;
      setCameraActive(true);
      setCameraLoading(false);

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(e => console.warn('Video play error:', e));
      }
    } catch (err: any) {
      console.warn('Camera start error:', err);
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      const errMsg = isDenied
        ? 'Доступ к камере заблокирован в браузере. Разрешите доступ к камере в строке браузера (значок замочка) и нажмите «Повторить».'
        : (err?.message || 'Не удалось подключить камеру. Проверьте, не занята ли она другой программой.');
      setCameraError(errMsg);
      setCameraActive(false);
      setCameraLoading(false);
    }
  };

  // Ensure stream is attached to video element whenever camera is active
  useEffect(() => {
    if (cameraActive && mediaStreamRef.current && videoPreviewRef.current) {
      if (videoPreviewRef.current.srcObject !== mediaStreamRef.current) {
        videoPreviewRef.current.srcObject = mediaStreamRef.current;
      }
      videoPreviewRef.current.play().catch(e => console.warn('Video element play error:', e));
    }
  }, [cameraActive, screen, activeMode, facingMode, isPhotoSnapped]);

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  // Automatically start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsPhotoSnapped(false);
      setRecordedVideoUrl(null);
      startCamera();
    } else {
      stopCamera();
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    }
    return () => {
      stopCamera();
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, [isOpen, facingMode]);

  const handleModeChange = (mode: 'photo' | 'camera_record' | 'live') => {
    setActiveMode(mode);
    setRecordedVideoUrl(null);
    setIsPhotoSnapped(false);
    setIsLiveActive(mode === 'live');
    if (!cameraActive) {
      startCamera();
    }
  };

  // Live Stream Heart animations and viewer fluctuations
  useEffect(() => {
    if (!isLiveActive) return;
    const interval = setInterval(() => {
      setLiveViewersCount(prev => Math.max(8, prev + Math.floor(Math.random() * 5) - 2));
      if (Math.random() > 0.5) {
        setLiveHearts(prev => [...prev.slice(-12), Date.now()]);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Video recording handlers
  const startRecording = () => {
    if (!mediaStreamRef.current) {
      startCamera();
      return;
    }
    recordedChunksRef.current = [];
    try {
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : undefined;

      const recorder = mime 
        ? new MediaRecorder(mediaStreamRef.current, { mimeType: mime }) 
        : new MediaRecorder(mediaStreamRef.current);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mime || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
      };

      recorder.start(500);
      setIsRecording(true);
      setRecordSeconds(0);

      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds(s => {
          if (s >= 30) {
            stopRecording();
            return 30;
          }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      console.error('MediaRecorder error:', e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
    }
    setIsRecording(false);
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
  };

  // Shutter action based on mode
  const handleShutterClick = () => {
    if (activeMode === 'camera_record') {
      if (!isRecording) {
        startRecording();
      } else {
        stopRecording();
      }
    } else if (activeMode === 'photo') {
      // Snap frame from live video
      if (videoPreviewRef.current && cameraActive) {
        try {
          const video = videoPreviewRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 720;
          canvas.height = video.videoHeight || 1280;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (facingMode === 'user') {
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            setSelectedImage(dataUrl);
            setSelectedGradient(null);
            setIsPhotoSnapped(true);
            return;
          }
        } catch (e) {
          console.warn('Snap photo error:', e);
        }
      }
      // If camera wasn't active, open gallery
      setScreen('gallery');
    } else if (activeMode === 'live') {
      setIsLiveActive(prev => !prev);
    }
  };

  const handleRetakePhoto = () => {
    setIsPhotoSnapped(false);
    if (!cameraActive) {
      startCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        setSelectedImage(res);
        setUserUploadedImages(prev => [res, ...prev]);
        setSelectedGradient(null);
        setRecordedVideoUrl(null);
        setIsPhotoSnapped(true);
        setScreen('camera');
        setActiveMode('photo');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishStory = (isCloseFriends: boolean = false) => {
    const isLive = activeMode === 'live';
    const isRecorded = activeMode === 'camera_record' && recordedVideoUrl;
    const isPhoto = activeMode === 'photo' || !isRecorded;

    const newStory: Story = {
      id: `story_${Date.now()}`,
      user: currentUser,
      viewed: false,
      image: isPhoto ? (selectedGradient ? undefined : selectedImage) : undefined,
      gradient: isPhoto && selectedGradient ? selectedGradient : undefined,
      videoUrl: isRecorded ? recordedVideoUrl : undefined,
      isLive,
      liveViewers: isLive ? liveViewersCount : undefined,
      filter: activeFilter.id !== 'normal' ? activeFilter.name : undefined,
      mask: activeMask.id !== 'none' ? activeMask.name : undefined,
      text: storyText.trim() || (isLive ? '🔴 ПРЯМОЙ ЭФИР' : undefined),
      textPosition,
      timestamp: isLive ? 'В ЭФИРЕ' : 'Только что',
      musicTrack: selectedMusic || undefined,
    };

    if (isCloseFriends) {
      (newStory as any).isCloseFriends = true;
    }

    const token = localStorage.getItem('new_age_jwt_token') || localStorage.getItem('newage_token') || '';
    const payload = {
      id: newStory.id,
      image: newStory.image,
      videoUrl: newStory.videoUrl,
      mediaUrl: newStory.videoUrl || newStory.image || '',
      isVideo: !!newStory.videoUrl,
      isLive: newStory.isLive,
      liveViewers: newStory.liveViewers,
      filter: newStory.filter,
      mask: newStory.mask,
      text: newStory.text,
      textPosition: newStory.textPosition,
      gradient: newStory.gradient,
      musicTrack: newStory.musicTrack,
    };

    const apiUrl = (import.meta.env.VITE_API_URL || '') + '/api/stories';
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.warn('Could not post story to server:', err);
    });

    window.dispatchEvent(new CustomEvent('story_created', { detail: newStory }));

    onCreateStory(newStory);
    stopCamera();
    onClose();
  };

  const handleSendLiveComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveNewMsg.trim()) return;
    setLiveChatMessages(prev => [
      ...prev,
      { id: Date.now(), name: currentUser.name, text: liveNewMsg.trim() }
    ]);
    setLiveNewMsg('');
  };

  if (!isOpen) return null;

  const showLiveFeed = (cameraActive && !recordedVideoUrl && (!isPhotoSnapped || activeMode !== 'photo'));

  return (
    <div className="newage-story-camera-overlay" onClick={() => { stopCamera(); onClose(); }}>
      <div className="newage-story-camera-container" onClick={e => e.stopPropagation()}>
        
        {/* Hidden File Input for uploading media */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* ========================================================================= */}
        {/* VIEW 1: CAMERA CREATION SCREEN (Камера историй New Age)                  */}
        {/* ========================================================================= */}
        {screen === 'camera' && (
          <div className="story-camera-view">
            
            {/* Top Navigation Bar */}
            <div className="story-camera-top-bar">
              <button 
                type="button" 
                className="story-nav-btn" 
                onClick={() => { stopCamera(); onClose(); }}
                title="Назад / Закрыть"
              >
                <ArrowLeft size={22} />
              </button>

              <div className="story-top-title-block">
                <span className="story-top-title">историй</span>
                <span className="story-top-brand">New Age</span>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="story-top-mode-pills">
                <button
                  type="button"
                  className={`story-mode-pill ${activeMode === 'photo' ? 'active' : ''}`}
                  onClick={() => handleModeChange('photo')}
                >
                  <ImageIcon size={13} /> Фото
                </button>
                <button
                  type="button"
                  className={`story-mode-pill ${activeMode === 'camera_record' ? 'active' : ''}`}
                  onClick={() => handleModeChange('camera_record')}
                >
                  <Video size={13} /> Запись видео
                </button>
                <button
                  type="button"
                  className={`story-mode-pill live-pill ${activeMode === 'live' ? 'active' : ''}`}
                  onClick={() => handleModeChange('live')}
                >
                  <Radio size={13} /> LIVE Эфир
                </button>
              </div>

              {/* Confirm Checkmark Button when Effect Wheel is active (media_1789991567406.jpg) */}
              {isEffectWheelOpen && (
                <button
                  type="button"
                  className="story-top-confirm-btn"
                  onClick={() => setIsEffectWheelOpen(false)}
                  title="Готово"
                >
                  <Check size={22} />
                </button>
              )}
            </div>

            {/* Main Stage with Viewfinder & Right Tools Column */}
            <div className="story-stage-row">
              
              {/* Central Viewfinder Card (9:16 Aspect Ratio) */}
              <div 
                className="story-viewfinder-card"
                style={{
                  background: (activeMode === 'photo' && (isPhotoSnapped || !cameraActive))
                    ? (selectedGradient ? selectedGradient : `url(${selectedImage}) center/cover no-repeat`)
                    : '#000000',
                }}
              >
                {/* Live Camera Feed (Always in DOM for instant ref binding) */}
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    display: showLiveFeed ? 'block' : 'none',
                    filter: activeFilter.filterCss,
                  }}
                  className={`viewfinder-video-stream ${facingMode === 'user' ? 'mirror-camera' : ''}`}
                />

                {/* Recorded Video Playback */}
                {recordedVideoUrl && !isRecording && activeMode === 'camera_record' && (
                  <video
                    src={recordedVideoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="viewfinder-video-stream recorded-playback"
                    style={{ filter: activeFilter.filterCss }}
                  />
                )}

                {/* Camera Inactive / Loading / Error State */}
                {!cameraActive && !isPhotoSnapped && !recordedVideoUrl && (
                  <div className="viewfinder-camera-placeholder">
                    {cameraLoading ? (
                      <div className="viewfinder-camera-loading">
                        <RefreshCw size={28} className="spin-icon" />
                        <span>Подключение камеры...</span>
                      </div>
                    ) : cameraError ? (
                      <div className="viewfinder-camera-error">
                        <p>{cameraError}</p>
                        <button type="button" className="btn-camera-retry" onClick={startCamera}>
                          <RefreshCw size={14} /> Повторить попытку
                        </button>
                        <button type="button" className="btn-camera-retry gallery-btn" onClick={() => setScreen('gallery')}>
                          <ImageIcon size={14} /> Выбрать из галереи
                        </button>
                      </div>
                    ) : (
                      <div className="viewfinder-camera-loading">
                        <Camera size={32} color="#6366f1" />
                        <span>Нажмите «Включить камеру»</span>
                        <button type="button" className="btn-camera-retry" onClick={startCamera}>
                          Включить камеру
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Photo Mode Background Layer when a photo is selected or snapped */}
                {activeMode === 'photo' && (isPhotoSnapped || !cameraActive) && !selectedGradient && (
                  <div 
                    className="viewfinder-photo-layer" 
                    style={{ 
                      backgroundImage: `url(${selectedImage})`,
                      filter: activeFilter.filterCss 
                    }} 
                  />
                )}

                {/* AR Face Masks / Overlays */}
                {activeMask.id !== 'none' && (
                  <div className={`ar-mask-layer mask-${activeMask.overlayType}`}>
                    {activeMask.overlayType === 'glasses' && <div className="ar-emoji">🕶️</div>}
                    {activeMask.overlayType === 'crown' && <div className="ar-emoji">👑</div>}
                    {activeMask.overlayType === 'cat_ears' && <div className="ar-emoji">🐱</div>}
                    {activeMask.overlayType === 'angel_halo' && <div className="ar-emoji">😇</div>}
                    {activeMask.overlayType === 'cyber_visor' && <div className="ar-emoji">🥽</div>}
                    {activeMask.overlayType === 'sparkles' && <div className="ar-emoji">✨</div>}
                  </div>
                )}

                {/* Top Author Tag in Viewfinder */}
                <div className="viewfinder-author-badge">
                  <img src={currentUser.avatar} alt={currentUser.name} className="author-badge-avatar" />
                  <div className="author-badge-text">
                    <span className="author-name">{currentUser.name || 'Галимов Максим'}</span>
                    <span className="author-tag">
                      {activeMode === 'live' ? 'Прямой эфир' : 'Ваша история'}
                    </span>
                  </div>
                </div>

                {/* Music Badge Overlay if Selected */}
                {selectedMusic && (
                  <div className="viewfinder-music-badge">
                    <Music size={12} className="music-pulse" />
                    <span>{selectedMusic}</span>
                  </div>
                )}

                {/* Retake Button if photo is snapped */}
                {activeMode === 'photo' && isPhotoSnapped && (
                  <button 
                    type="button" 
                    className="viewfinder-retake-btn"
                    onClick={handleRetakePhoto}
                    title="Снять заново"
                  >
                    <RotateCcw size={13} /> Переснять
                  </button>
                )}

                {/* Active Filter Name Badge */}
                {activeFilter.id !== 'normal' && (
                  <div className="viewfinder-filter-badge" style={{ borderColor: activeFilter.badgeColor }}>
                    <Wand2 size={11} /> {activeFilter.name}
                  </div>
                )}

                {/* Text Overlay on Story */}
                {storyText && (
                  <div className={`viewfinder-text-overlay pos-${textPosition}`}>
                    <p>{storyText}</p>
                  </div>
                )}

                {/* Live Stream Viewers & Hearts */}
                {activeMode === 'live' && (
                  <>
                    <div className="viewfinder-live-header-pill">
                      <span className="live-pulse-dot" />
                      <span>LIVE</span>
                      <span className="live-count"><Eye size={12} /> {liveViewersCount}</span>
                    </div>

                    <div className="viewfinder-live-hearts">
                      {liveHearts.map(hk => (
                        <span key={hk} className="floating-heart">❤️</span>
                      ))}
                    </div>

                    <div className="viewfinder-live-chat">
                      {liveChatMessages.slice(-3).map(m => (
                        <div key={m.id} className="live-chat-row">
                          <b>{m.name}:</b> {m.text}
                        </div>
                      ))}
                      <form onSubmit={handleSendLiveComment} className="live-chat-input">
                        <input
                          type="text"
                          placeholder="Написать в эфир..."
                          value={liveNewMsg}
                          onChange={e => setLiveNewMsg(e.target.value)}
                        />
                      </form>
                    </div>
                  </>
                )}

                {/* Bottom Viewfinder HUD: Timer, Flip, Record, Mic */}
                <div className="viewfinder-bottom-hud">
                  
                  {/* Timer Bar */}
                  <div className="hud-timer-badge">
                    <span className={`hud-rec-dot ${isRecording ? 'blinking' : ''}`} />
                    <span>00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds} / 00:30</span>
                  </div>

                  {/* Buttons Row: Flip, Big Shutter, Mic */}
                  <div className="hud-controls-row">
                    <button
                      type="button"
                      className="hud-action-circle-btn"
                      onClick={toggleFacingMode}
                      title="Переключить камеру (передняя / задняя)"
                    >
                      <RefreshCw size={19} />
                    </button>

                    {/* Central Big Shutter Button */}
                    <button
                      type="button"
                      className={`hud-shutter-btn ${activeMode} ${isRecording ? 'is-recording' : ''}`}
                      onClick={handleShutterClick}
                      title={activeMode === 'camera_record' ? (isRecording ? 'Остановить' : 'Запись') : 'Сделать снимок'}
                    >
                      <div className={`hud-shutter-inner ${activeMode === 'photo' ? 'white' : 'red'}`}>
                        {isRecording && <Square size={16} fill="#ffffff" color="#ffffff" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`hud-action-circle-btn ${isMuted ? 'muted' : ''}`}
                      onClick={() => {
                        setIsMuted(!isMuted);
                        if (mediaStreamRef.current) {
                          mediaStreamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted);
                        }
                      }}
                      title={isMuted ? 'Включить звук' : 'Выключить звук'}
                    >
                      {isMuted ? <MicOff size={19} /> : <Mic size={19} />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Vertical Floating Tools Column (Screenshot 1 & 3) */}
              <div className={`story-vertical-tools-column ${isToolsExpanded ? 'expanded' : 'collapsed'}`}>
                
                {/* 1. Aa Текст */}
                <button 
                  type="button" 
                  className={`story-tool-item ${activeTab === 'text' ? 'active' : ''}`}
                  onClick={() => setActiveTab('text')}
                  title="Текст"
                >
                  <div className="story-tool-icon-box">
                    <span className="tool-typography-icon">Aa</span>
                  </div>
                  {isToolsExpanded && <span className="story-tool-label">Текст</span>}
                </button>

                {/* 2. Стикеры */}
                <button 
                  type="button" 
                  className="story-tool-item"
                  onClick={() => setActiveTab('text')}
                  title="Стикеры"
                >
                  <div className="story-tool-icon-box">
                    <Smile size={20} />
                  </div>
                  {isToolsExpanded && <span className="story-tool-label">Стикеры</span>}
                </button>

                {/* 3. Музыка */}
                <button 
                  type="button" 
                  className={`story-tool-item ${selectedMusic ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedMusic) {
                      setSelectedMusic(null);
                    } else {
                      setSelectedMusic(MUSIC_TRACKS[0].title);
                    }
                  }}
                  title="Музыка"
                >
                  <div className="story-tool-icon-box">
                    <Music size={20} />
                  </div>
                  {isToolsExpanded && <span className="story-tool-label">Музыка</span>}
                </button>

                {/* 4. Эффекты */}
                <button 
                  type="button" 
                  className={`story-tool-item ${(activeTab === 'effects' || isEffectWheelOpen) ? 'active' : ''}`}
                  onClick={() => {
                    setIsEffectWheelOpen(prev => !prev);
                    setActiveTab('effects');
                  }}
                  title="Эффекты"
                >
                  <div className="story-tool-icon-box">
                    <Sparkles size={20} />
                  </div>
                  {isToolsExpanded && <span className="story-tool-label">Эффекты</span>}
                </button>

                {/* Extended tools shown when expanded */}
                {isToolsExpanded && (
                  <>
                    <button 
                      type="button" 
                      className="story-tool-item"
                      onClick={() => alert('История сохранена в черновики')}
                      title="Сохранить"
                    >
                      <div className="story-tool-icon-box">
                        <Bookmark size={19} />
                      </div>
                      <span className="story-tool-label">Сохранить</span>
                    </button>

                    <button 
                      type="button" 
                      className="story-tool-item"
                      onClick={() => setStoryText(prev => `${prev} @`)}
                      title="Упомянуть"
                    >
                      <div className="story-tool-icon-box">
                        <AtSign size={19} />
                      </div>
                      <span className="story-tool-label">Упомянуть</span>
                    </button>

                    <button 
                      type="button" 
                      className="story-tool-item"
                      onClick={() => alert('Режим рисования активирован')}
                      title="Рисунок"
                    >
                      <div className="story-tool-icon-box">
                        <PenLine size={19} />
                      </div>
                      <span className="story-tool-label">Рисунок</span>
                    </button>

                    <button 
                      type="button" 
                      className="story-tool-item"
                      onClick={() => alert('Медиафайл скачивается на устройство')}
                      title="Скачать"
                    >
                      <div className="story-tool-icon-box">
                        <Download size={19} />
                      </div>
                      <span className="story-tool-label">Сохранить</span>
                    </button>

                    <button 
                      type="button" 
                      className="story-tool-item"
                      onClick={() => setActiveTab('backgrounds')}
                      title="Ещё"
                    >
                      <div className="story-tool-icon-box">
                        <MoreHorizontal size={19} />
                      </div>
                      <span className="story-tool-label">Ещё</span>
                    </button>
                  </>
                )}

                {/* Expand / Collapse toggle chevron */}
                <button
                  type="button"
                  className="story-tool-item story-tool-expand-btn"
                  onClick={() => setIsToolsExpanded(!isToolsExpanded)}
                  title={isToolsExpanded ? 'Свернуть' : 'Развернуть инструменты'}
                >
                  <div className="story-tool-icon-box">
                    {isToolsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                  {isToolsExpanded && <span className="story-tool-label">Свернуть</span>}
                </button>

              </div>

            </div>

            {/* Category Selector Tabs Under Viewfinder */}
            <div className="story-category-tabs-row">
              <button
                type="button"
                className={`story-cat-pill ${activeTab === 'effects' ? 'active' : ''}`}
                onClick={() => setActiveTab('effects')}
              >
                <Sparkles size={14} /> Фильтры & Маски
              </button>
              <button
                type="button"
                className={`story-cat-pill ${activeTab === 'backgrounds' ? 'active' : ''}`}
                onClick={() => setActiveTab('backgrounds')}
              >
                <ImageIcon size={14} /> Фоны & Фото
              </button>
              <button
                type="button"
                className={`story-cat-pill ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => setActiveTab('text')}
              >
                <Type size={14} /> Текст & Стикеры
              </button>
            </div>

            {/* Active Drawer: Filters & Masks / Backgrounds / Text */}
            <div className="story-bottom-drawer">
              
              {/* TAB 1: FILTERS & AR MASKS */}
              {activeTab === 'effects' && (
                <div className="drawer-pane">
                  <div className="drawer-filters-row">
                    {STORY_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`drawer-filter-card ${activeFilter.id === f.id ? 'active' : ''}`}
                        onClick={() => setActiveFilter(f)}
                      >
                        <div 
                          className="filter-thumb-box"
                          style={{
                            backgroundImage: `url(${selectedImage})`,
                            filter: f.filterCss
                          }}
                        />
                        <span className="filter-thumb-name">{f.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* AR Masks Carousel */}
                  <div className="drawer-masks-row">
                    {STORY_MASKS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`drawer-mask-pill ${activeMask.id === m.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveMask(m);
                          setIsEffectWheelOpen(true);
                        }}
                      >
                        <span className="mask-emoji">{m.icon}</span>
                        <span className="mask-name">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: BACKGROUNDS & PHOTO (WITH LINK TO GALLERY) */}
              {activeTab === 'backgrounds' && (
                <div className="drawer-pane">
                  <div className="drawer-bg-actions">
                    <button
                      type="button"
                      className="btn-open-gallery-picker"
                      onClick={() => setScreen('gallery')}
                    >
                      <ImageIcon size={16} /> Открыть галерею фото
                    </button>
                    <button
                      type="button"
                      className="btn-open-gallery-picker upload"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Plus size={16} /> Загрузить файл
                    </button>
                  </div>

                  <div className="drawer-bg-thumbnails">
                    {STORY_PRESETS.slice(0, 6).map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`bg-thumb-btn ${selectedImage === img && !selectedGradient ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${img})` }}
                        onClick={() => {
                          setSelectedImage(img);
                          setSelectedGradient(null);
                          setIsPhotoSnapped(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: TEXT & STICKERS */}
              {activeTab === 'text' && (
                <div className="drawer-pane">
                  <div className="drawer-stickers-row">
                    {['🔥 Огонь', '✨ New Day', '🎧 В наушниках', '📍 Локация', '☕ Coffee Time', '💯 100%', '🌟 Zen'].map((stk, i) => (
                      <button
                        key={i}
                        type="button"
                        className="quick-stk-chip"
                        onClick={() => setStoryText(prev => prev ? `${prev} ${stk}` : stk)}
                      >
                        {stk}
                      </button>
                    ))}
                  </div>

                  <div className="text-pos-switcher">
                    <span>Положение:</span>
                    {(['top', 'center', 'bottom'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        className={`pos-pill ${textPosition === p ? 'active' : ''}`}
                        onClick={() => setTextPosition(p)}
                      >
                        {p === 'top' ? 'Сверху' : p === 'center' ? 'По центру' : 'Внизу'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AR Effect Wheel (media_1789991567406.jpg) OR Caption Input (media_1789991567403.jpg) */}
              {isEffectWheelOpen ? (
                <div className="story-effect-wheel-wrapper">
                  <div className="effect-wheel-track" ref={wheelTrackRef}>
                    {STORY_LENSES.map((lens) => {
                      const isSelected = activeMask.id === lens.id;
                      return (
                        <button
                          key={lens.id}
                          type="button"
                          className={`effect-wheel-lens ${isSelected ? 'lens-center-active' : ''}`}
                          onClick={() => {
                            const found = STORY_MASKS.find(m => m.id === lens.id) || STORY_MASKS[0];
                            setActiveMask(found);
                            if (lens.filterCss) {
                              const matchingFilter = STORY_FILTERS.find(f => f.filterCss === lens.filterCss);
                              if (matchingFilter) setActiveFilter(matchingFilter);
                            }
                          }}
                          title={lens.name}
                        >
                          <div className="wheel-lens-inner">
                            {lens.id === 'none' ? (
                              <div className="lens-none-graphic">
                                <span className="lens-ban-icon">⊘</span>
                              </div>
                            ) : lens.thumb ? (
                              <div 
                                className="lens-thumb-graphic" 
                                style={{ backgroundImage: `url(${lens.thumb})` }}
                              >
                                <span className="lens-emoji-tag">{lens.icon}</span>
                              </div>
                            ) : (
                              <span className="lens-emoji-only">{lens.icon}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="effect-wheel-name-badge">
                    {activeMask.id === 'none' ? 'Без эффекта' : activeMask.name}
                  </div>
                </div>
              ) : (
                <div className="story-caption-input-box">
                  <input
                    type="text"
                    placeholder="Добавьте подпись..."
                    value={storyText}
                    onChange={e => setStoryText(e.target.value)}
                    maxLength={140}
                    className="story-caption-field"
                  />
                </div>
              )}

            </div>

            {/* Bottom Publishing Action Bar (media_1789991567403.jpg) */}
            {!isEffectWheelOpen && (
              <div className="story-bottom-action-bar">
                
                {/* Button 1: Ваша история */}
                <button
                  type="button"
                  className="action-publish-btn your-story-btn"
                  onClick={() => handlePublishStory(false)}
                >
                  <div className="story-avatar-ring">
                    <img src={currentUser.avatar} alt={currentUser.name} className="ring-avatar-img" />
                  </div>
                  <span>Ваша история</span>
                </button>

                {/* Button 2: Близкие друзья */}
                <button
                  type="button"
                  className="action-publish-btn close-friends-btn"
                  onClick={() => handlePublishStory(true)}
                >
                  <div className="close-friends-star-icon">
                    <Star size={14} fill="#ffffff" color="#ffffff" />
                  </div>
                  <span>Близкие друзья</span>
                </button>

                {/* Button 3: Round Blue Action Button > */}
                <button
                  type="button"
                  className="action-publish-circle-next"
                  onClick={() => handlePublishStory(false)}
                  title="Опубликовать"
                >
                  <ChevronRight size={22} />
                </button>

              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: GALLERY MEDIA PICKER SCREEN (Дополнить историю - Screenshot 2)   */}
        {/* ========================================================================= */}
        {screen === 'gallery' && (
          <div className="story-gallery-view">
            
            {/* Top Bar: Close, Title, Camera Icon */}
            <div className="story-gallery-top-bar">
              <button 
                type="button" 
                className="gallery-nav-btn" 
                onClick={() => setScreen('camera')}
                title="Назад к камере"
              >
                <X size={22} />
              </button>

              <h3 className="gallery-view-title">Дополнить историю</h3>

              <button 
                type="button" 
                className="gallery-nav-btn" 
                onClick={() => { 
                  setScreen('camera'); 
                  setIsPhotoSnapped(false);
                  startCamera(); 
                }}
                title="Открыть камеру"
              >
                <Camera size={20} />
              </button>
            </div>

            {/* 3 Quick Cards: Шаблоны, Музыка, Коллаж */}
            <div className="gallery-quick-cards-row">
              
              <div 
                className="gallery-quick-card"
                onClick={() => {
                  setSelectedImage(STORY_PRESETS[1]);
                  setStoryText('✨ Стильный шаблон New Age');
                  setIsPhotoSnapped(true);
                  setScreen('camera');
                }}
              >
                <div className="quick-card-icon-box template-bg">
                  <LayoutTemplate size={22} color="#ffffff" />
                </div>
                <span className="quick-card-label">Шаблоны</span>
              </div>

              <div 
                className="gallery-quick-card"
                onClick={() => {
                  setSelectedMusic(MUSIC_TRACKS[0].title);
                  alert(`Музыкальный трек "${MUSIC_TRACKS[0].title}" добавлен к истории`);
                }}
              >
                <div className="quick-card-icon-box music-bg">
                  <Music size={22} color="#ffffff" />
                </div>
                <span className="quick-card-label">Музыка</span>
              </div>

              <div 
                className="gallery-quick-card"
                onClick={() => {
                  setSelectedGradient(GRADIENT_PRESETS[1]);
                  setStoryText('Коллаж впечатлений');
                  setIsPhotoSnapped(true);
                  setScreen('camera');
                }}
              >
                <div className="quick-card-icon-box collage-bg">
                  <Grid2X2 size={22} color="#ffffff" />
                </div>
                <span className="quick-card-label">Коллаж</span>
              </div>

            </div>

            {/* Filter Row: "Недавние ▾" and "Выбрать" */}
            <div className="gallery-filter-subbar">
              <div className="gallery-dropdown-wrap">
                <select 
                  value={galleryFilter} 
                  onChange={e => setGalleryFilter(e.target.value as any)}
                  className="gallery-filter-select"
                >
                  <option value="recent">Недавние ▾</option>
                  <option value="all">Все медиа ▾</option>
                  <option value="photos">Фотографии ▾</option>
                  <option value="videos">Видео ▾</option>
                </select>
              </div>

              <div className="gallery-filter-right-actions">
                <button
                  type="button"
                  className="btn-gallery-action"
                  onClick={() => fileInputRef.current?.click()}
                  title="Загрузить фото с устройства"
                >
                  <Plus size={15} /> Загрузить
                </button>
                <button
                  type="button"
                  className="btn-gallery-action outline"
                  onClick={() => alert('Режим множественного выбора активирован')}
                >
                  <Check size={14} /> Выбрать
                </button>
              </div>
            </div>

            {/* Media Grid: 1st tile is Camera, then thumbnails */}
            <div className="gallery-media-grid">
              
              {/* Tile 1: Live Camera Tile */}
              <div 
                className="gallery-camera-tile"
                onClick={() => {
                  setScreen('camera');
                  setIsPhotoSnapped(false);
                  startCamera();
                }}
                title="Снять на камеру"
              >
                <div className="camera-tile-icon-circle">
                  <Camera size={26} color="#ffffff" />
                </div>
                <span>Камера</span>
              </div>

              {/* User Uploaded Photos */}
              {userUploadedImages.map((imgUrl, idx) => (
                <div 
                  key={`user_${idx}`} 
                  className={`gallery-photo-tile ${selectedImage === imgUrl ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedImage(imgUrl);
                    setSelectedGradient(null);
                    setIsPhotoSnapped(true);
                    setScreen('camera');
                    setActiveMode('photo');
                  }}
                >
                  <img src={imgUrl} alt={`Upload ${idx}`} />
                </div>
              ))}

              {/* Presets & Recent Media */}
              {STORY_PRESETS.map((presetUrl, idx) => (
                <div 
                  key={`preset_${idx}`} 
                  className={`gallery-photo-tile ${selectedImage === presetUrl ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedImage(presetUrl);
                    setSelectedGradient(null);
                    setIsPhotoSnapped(true);
                    setScreen('camera');
                    setActiveMode('photo');
                  }}
                >
                  <img src={presetUrl} alt={`Preset ${idx}`} />
                </div>
              ))}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

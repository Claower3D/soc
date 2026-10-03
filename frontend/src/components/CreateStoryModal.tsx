import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Camera, Image as ImageIcon, Sparkles, Check, 
  RefreshCw, Smile, Square, Eye,
  ArrowLeft, Music, 
  Download, ChevronRight, Star, LayoutTemplate, Grid2X2, Plus,
  RotateCcw, Zap, ZapOff, Infinity as InfinityIcon
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

  // Camera sub-modes: 'story' (default Insta) | 'create_text' | 'boomerang' | 'live'
  const [cameraSubMode, setCameraSubMode] = useState<'story' | 'create_text' | 'boomerang' | 'live'>('story');

  // Bottom slider active mode: 'post' | 'story' | 'reels' | 'live'
  const [bottomSliderMode, setBottomSliderMode] = useState<'post' | 'story' | 'reels' | 'live'>('story');

  // Photo & Background states
  const [selectedImage, setSelectedImage] = useState<string>(STORY_PRESETS[0]);
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null);
  const [gradientIdx, setGradientIdx] = useState(0);
  const [storyText, setStoryText] = useState('');
  const [isPhotoSnapped, setIsPhotoSnapped] = useState(false);
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [textPosition, setTextPosition] = useState<'center' | 'bottom' | 'top'>('bottom');
  
  // Effects: Filter & AR Mask
  const [activeFilter, setActiveFilter] = useState<StoryFilter>(STORY_FILTERS[0]);
  const [activeMask, setActiveMask] = useState<StoryMask>(STORY_MASKS[0]);
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [showStickersPicker, setShowStickersPicker] = useState(false);

  // Instagram AR Effect Wheel mode state
  const [isEffectWheelOpen, setIsEffectWheelOpen] = useState(false);
  const wheelTrackRef = useRef<HTMLDivElement>(null);

  // Flash & Camera options
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [isFlashing, setIsFlashing] = useState(false);

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
  const liveViewersCount = 14;
  const [liveChatMessages, setLiveChatMessages] = useState<Array<{ id: number; name: string; text: string }>>([]);
  const [liveNewMsg, setLiveNewMsg] = useState('');

  // Device Controls
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Refs
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordIntervalRef = useRef<any>(null);

  // Press & Hold Shutter Tracking
  const holdTimerRef = useRef<any>(null);
  const pressStartTimeRef = useRef<number>(0);
  const isLongPressRef = useRef(false);

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

    // 2. Попытка: только видео с идеальным facingMode
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

    // 3. Попытка: базовое видео без ограничений
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
  }, [cameraActive, screen, cameraSubMode, facingMode, isPhotoSnapped]);

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  // Automatically start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsPhotoSnapped(false);
      setRecordedVideoUrl(null);
      setCameraSubMode('story');
      setBottomSliderMode('story');
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
      try { navigator.vibrate?.([60]); } catch {}

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
    try { navigator.vibrate?.([40]); } catch {}
  };

  // Snap photo from live video
  const snapPhoto = () => {
    // Flash effect
    setIsFlashing(true);
    try { navigator.vibrate?.([40]); } catch {}
    setTimeout(() => setIsFlashing(false), 160);

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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          setSelectedImage(dataUrl);
          setSelectedGradient(null);
          setRecordedVideoUrl(null);
          setIsPhotoSnapped(true);
          return;
        }
      } catch (e) {
        console.warn('Snap photo error:', e);
      }
    }
    // If camera wasn't active, open gallery
    setScreen('gallery');
  };

  // UNIFIED INSTAGRAM SHUTTER HANDLERS:
  // 1 Tap (< 280ms) = Snap Photo
  // Press & Hold (> 280ms) = Record Video while held!
  const handleShutterPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (cameraSubMode === 'live') {
      return;
    }

    pressStartTimeRef.current = Date.now();
    isLongPressRef.current = false;

    // Start hold timer
    holdTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      startRecording();
    }, 280);
  };

  const handleShutterPointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (cameraSubMode === 'live') return;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    const duration = Date.now() - pressStartTimeRef.current;

    if (isLongPressRef.current || isRecording) {
      // It was a long press video record: stop it now
      stopRecording();
      isLongPressRef.current = false;
    } else if (duration < 280) {
      // It was a quick single tap: Snap photo!
      snapPhoto();
    }
  };

  const handleShutterPointerCancel = (e: React.PointerEvent) => {
    e.preventDefault();
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (isLongPressRef.current || isRecording) {
      stopRecording();
      isLongPressRef.current = false;
    }
  };

  const handleRetakeMedia = () => {
    setIsPhotoSnapped(false);
    setRecordedVideoUrl(null);
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
        setCameraSubMode('story');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishStory = (isCloseFriends: boolean = false) => {
    const isLive = cameraSubMode === 'live';
    const isRecorded = !!recordedVideoUrl;
    const isPhoto = !isRecorded;

    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

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
      createdAt,
      expiresAt,
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
      createdAt: newStory.createdAt,
      expiresAt: newStory.expiresAt,
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

  const cycleGradient = () => {
    const nextIdx = (gradientIdx + 1) % GRADIENT_PRESETS.length;
    setGradientIdx(nextIdx);
    setSelectedGradient(GRADIENT_PRESETS[nextIdx]);
  };

  if (!isOpen) return null;

  // Is media ready for preview / publishing (photo captured or video recorded or text mode)
  const isMediaReady = isPhotoSnapped || !!recordedVideoUrl || (cameraSubMode === 'create_text' && storyText.trim().length > 0);
  const showLiveFeed = (cameraActive && !recordedVideoUrl && !isPhotoSnapped && cameraSubMode !== 'create_text');

  return (
    <div className="newage-story-camera-overlay" onClick={() => { stopCamera(); onClose(); }}>
      <div className="newage-story-camera-container insta-fullscreen" onClick={e => e.stopPropagation()}>
        
        {/* Hidden File Input for uploading media */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* White Screen Snap Flash Overlay */}
        {isFlashing && <div className="camera-flash-overlay active" />}

        {/* ========================================================================= */}
        {/* VIEW 1: FULLSCREEN CAMERA & PREVIEW SCREEN                                */}
        {/* ========================================================================= */}
        {screen === 'camera' && (
          <div className="insta-story-viewfinder">
            
            {/* Live Camera Feed (Fills 100% of the screen) */}
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              style={{
                display: showLiveFeed ? 'block' : 'none',
                filter: activeFilter.filterCss,
              }}
              className={`insta-video-stream ${facingMode === 'user' ? 'mirror-camera' : ''}`}
            />

            {/* Recorded Video Playback */}
            {recordedVideoUrl && (
              <video
                src={recordedVideoUrl}
                autoPlay
                loop
                playsInline
                className="insta-video-stream recorded-playback"
                style={{ filter: activeFilter.filterCss }}
              />
            )}

            {/* Snapped Photo Layer */}
            {isPhotoSnapped && !recordedVideoUrl && (
              <div 
                className="insta-photo-layer" 
                style={{ 
                  backgroundImage: selectedGradient ? selectedGradient : `url(${selectedImage})`,
                  filter: activeFilter.filterCss 
                }} 
              />
            )}

            {/* Create Text Mode Gradient Canvas */}
            {cameraSubMode === 'create_text' && !isPhotoSnapped && !recordedVideoUrl && (
              <div 
                className="insta-photo-layer text-mode-canvas"
                style={{ background: selectedGradient || GRADIENT_PRESETS[0] }}
                onClick={() => setIsTextEditing(true)}
              >
                {!storyText ? (
                  <div className="text-mode-placeholder">
                    <span>Нажмите, чтобы ввести текст...</span>
                  </div>
                ) : (
                  <div className="text-mode-display">
                    <p>{storyText}</p>
                  </div>
                )}
              </div>
            )}

            {/* Camera Inactive / Loading / Error State */}
            {!cameraActive && !isPhotoSnapped && !recordedVideoUrl && cameraSubMode !== 'create_text' && (
              <div className="insta-camera-placeholder">
                {cameraLoading ? (
                  <div className="insta-camera-loading">
                    <RefreshCw size={36} className="spin-icon" color="#ffffff" />
                    <span>Подключение камеры...</span>
                  </div>
                ) : cameraError ? (
                  <div className="insta-camera-error">
                    <p>{cameraError}</p>
                    <button type="button" className="btn-insta-pill" onClick={startCamera}>
                      <RefreshCw size={15} /> Повторить попытку
                    </button>
                    <button type="button" className="btn-insta-pill gallery" onClick={() => setScreen('gallery')}>
                      <ImageIcon size={15} /> Выбрать из галереи
                    </button>
                  </div>
                ) : (
                  <div className="insta-camera-loading">
                    <Camera size={44} color="#ffffff" />
                    <button type="button" className="btn-insta-pill primary" onClick={startCamera}>
                      Включить камеру
                    </button>
                  </div>
                )}
              </div>
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

            {/* Text Overlay on Preview */}
            {storyText && isMediaReady && (
              <div 
                className={`viewfinder-text-overlay pos-${textPosition}`}
                onClick={() => setIsTextEditing(true)}
              >
                <p>{storyText}</p>
              </div>
            )}

            {/* Music Badge Overlay if Selected */}
            {selectedMusic && isMediaReady && (
              <div className="insta-music-pill">
                <Music size={13} className="music-pulse" />
                <span>{selectedMusic}</span>
                <button type="button" onClick={() => setSelectedMusic(null)} className="music-pill-del">×</button>
              </div>
            )}

            {/* =================================================================== */}
            {/* TOP BAR CONTROLS                                                    */}
            {/* =================================================================== */}
            <div className="insta-top-hud">
              
              {/* Left Button: Close (in camera) or Retake/Back (in preview) */}
              {!isMediaReady ? (
                <button 
                  type="button" 
                  className="insta-icon-btn close-btn" 
                  onClick={() => { stopCamera(); onClose(); }}
                  title="Закрыть"
                >
                  <X size={26} />
                </button>
              ) : (
                <button 
                  type="button" 
                  className="insta-icon-btn close-btn" 
                  onClick={handleRetakeMedia}
                  title="Переснять"
                >
                  <ArrowLeft size={24} />
                </button>
              )}

              {/* Center Controls (Camera Mode: Flash Toggle) */}
              {!isMediaReady && (
                <div className="insta-top-center-tools">
                  <button 
                    type="button" 
                    className={`insta-icon-btn flash-btn ${flashMode === 'on' ? 'active' : ''}`}
                    onClick={() => setFlashMode(prev => prev === 'off' ? 'on' : 'off')}
                    title="Вспышка"
                  >
                    {flashMode === 'on' ? <Zap size={22} fill="#FACC15" color="#FACC15" /> : <ZapOff size={22} />}
                  </button>
                </div>
              )}

              {/* Right Controls */}
              {!isMediaReady ? (
                <div className="insta-top-right-tools">
                  <button 
                    type="button" 
                    className="insta-icon-btn"
                    onClick={toggleFacingMode}
                    title="Сменить камеру"
                  >
                    <RotateCcw size={22} />
                  </button>
                </div>
              ) : (
                /* Preview Editing Tools across top right */
                <div className="insta-preview-top-tools">
                  {/* Text Aa */}
                  <button 
                    type="button" 
                    className="insta-icon-btn"
                    onClick={() => setIsTextEditing(true)}
                    title="Добавить текст"
                  >
                    <span className="insta-tool-text-icon">Aa</span>
                  </button>

                  {/* Stickers */}
                  <button 
                    type="button" 
                    className="insta-icon-btn"
                    onClick={() => setShowStickersPicker(prev => !prev)}
                    title="Стикеры"
                  >
                    <Smile size={22} />
                  </button>

                  {/* Music */}
                  <button 
                    type="button" 
                    className="insta-icon-btn"
                    onClick={() => setShowMusicPicker(prev => !prev)}
                    title="Музыка"
                  >
                    <Music size={22} />
                  </button>

                  {/* Filters */}
                  <button 
                    type="button" 
                    className="insta-icon-btn"
                    onClick={() => setShowFilterPicker(prev => !prev)}
                    title="Фильтры"
                  >
                    <Sparkles size={22} />
                  </button>

                  {/* Save */}
                  <button 
                    type="button" 
                    className="insta-icon-btn"
                    onClick={() => alert('Медиафайл сохранён на устройство')}
                    title="Сохранить"
                  >
                    <Download size={22} />
                  </button>
                </div>
              )}

            </div>

            {/* =================================================================== */}
            {/* LEFT VERTICAL TOOLS (Shown in Live Camera Mode - Screenshot 3)     */}
            {/* =================================================================== */}
            {!isMediaReady && (
              <div className="insta-left-vertical-toolbar">
                {/* 1. Aa Создать */}
                <button 
                  type="button" 
                  className={`insta-left-tool-btn ${cameraSubMode === 'create_text' ? 'active' : ''}`}
                  onClick={() => {
                    if (cameraSubMode === 'create_text') {
                      setCameraSubMode('story');
                      setSelectedGradient(null);
                    } else {
                      setCameraSubMode('create_text');
                      setSelectedGradient(GRADIENT_PRESETS[gradientIdx]);
                      setIsTextEditing(true);
                    }
                  }}
                  title="Создать (Текст)"
                >
                  <div className="insta-left-tool-icon">
                    <span className="left-aa-symbol">Aa</span>
                  </div>
                  <span className="insta-left-tool-label">Создать</span>
                </button>

                {/* 2. ∞ Бумеранг */}
                <button 
                  type="button" 
                  className={`insta-left-tool-btn ${cameraSubMode === 'boomerang' ? 'active' : ''}`}
                  onClick={() => setCameraSubMode(prev => prev === 'boomerang' ? 'story' : 'boomerang')}
                  title="Бумеранг"
                >
                  <div className="insta-left-tool-icon">
                    <InfinityIcon size={20} />
                  </div>
                  <span className="insta-left-tool-label">Бумеранг</span>
                </button>

                {/* 3. ✨ Эффекты */}
                <button 
                  type="button" 
                  className={`insta-left-tool-btn ${isEffectWheelOpen ? 'active' : ''}`}
                  onClick={() => setIsEffectWheelOpen(prev => !prev)}
                  title="Эффекты"
                >
                  <div className="insta-left-tool-icon">
                    <Sparkles size={20} />
                  </div>
                  <span className="insta-left-tool-label">Эффекты</span>
                </button>

                {/* 4. ⊞ Коллаж / Разметка */}
                <button 
                  type="button" 
                  className="insta-left-tool-btn"
                  onClick={() => alert('Коллаж активирован')}
                  title="Коллаж"
                >
                  <div className="insta-left-tool-icon">
                    <Grid2X2 size={19} />
                  </div>
                  <span className="insta-left-tool-label">Коллаж</span>
                </button>
              </div>
            )}

            {/* Interactive Live Chat on Live Mode */}
            {cameraSubMode === 'live' && !isMediaReady && (
              <div className="insta-live-chat-panel">
                <div className="insta-live-badge-row">
                  <span className="live-red-pill">LIVE</span>
                  <span className="live-viewers-tag"><Eye size={12} /> {liveViewersCount}</span>
                </div>
                <div className="insta-live-messages">
                  {liveChatMessages.slice(-3).map(m => (
                    <div key={m.id} className="live-chat-bubble">
                      <b>{m.name}:</b> {m.text}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendLiveComment} className="insta-live-input-box">
                  <input
                    type="text"
                    placeholder="Написать в прямой эфир..."
                    value={liveNewMsg}
                    onChange={e => setLiveNewMsg(e.target.value)}
                  />
                </form>
              </div>
            )}

            {/* =================================================================== */}
            {/* BOTTOM CONTROLS (Insta Camera Shutter OR Publishing Bar)            */}
            {/* =================================================================== */}
            {!isMediaReady ? (
              <div className="insta-bottom-camera-hud">
                
                {/* Recording Timer Badge */}
                {isRecording && (
                  <div className="insta-rec-timer-pill">
                    <span className="rec-red-pulse-dot" />
                    <span>00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds} / 00:30</span>
                  </div>
                )}

                {/* Horizontal Effect Lenses Carousel (Screenshot 3) */}
                {isEffectWheelOpen && (
                  <div className="insta-lenses-carousel" ref={wheelTrackRef}>
                    {STORY_LENSES.map((lens) => {
                      const isSelected = activeMask.id === lens.id;
                      return (
                        <button
                          key={lens.id}
                          type="button"
                          className={`insta-lens-circle ${isSelected ? 'active' : ''}`}
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
                          {lens.thumb ? (
                            <img src={lens.thumb} alt={lens.name} className="lens-thumb-img" />
                          ) : (
                            <span className="lens-char">{lens.icon}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Main Shutter Row: Gallery (Left) • Shutter (Center) • Flip (Right) */}
                <div className="insta-shutter-row">
                  
                  {/* Gallery Media Thumbnail */}
                  <button 
                    type="button" 
                    className="insta-gallery-thumb-btn"
                    onClick={() => setScreen('gallery')}
                    title="Открыть галерею"
                  >
                    {userUploadedImages[0] ? (
                      <img src={userUploadedImages[0]} alt="Gallery" className="thumb-preview-img" />
                    ) : (
                      <img src={STORY_PRESETS[0]} alt="Gallery" className="thumb-preview-img" />
                    )}
                    <span className="gallery-plus-icon">+</span>
                  </button>

                  {/* Central Shutter Button (Tap = Photo, Hold = Video!) */}
                  <div className="insta-shutter-wrapper">
                    <button
                      type="button"
                      className={`insta-shutter-button ${isRecording ? 'is-recording' : ''}`}
                      onPointerDown={handleShutterPointerDown}
                      onPointerUp={handleShutterPointerUp}
                      onPointerCancel={handleShutterPointerCancel}
                      onPointerLeave={handleShutterPointerCancel}
                      title="1 нажатие — фото, зажать — видео"
                    >
                      {/* Outer Ring & Progress SVG */}
                      <svg className="shutter-progress-ring" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="44"
                          className="shutter-ring-bg"
                        />
                        {isRecording && (
                          <circle
                            cx="50"
                            cy="50"
                            r="44"
                            className="shutter-ring-fill"
                            style={{
                              strokeDasharray: 2 * Math.PI * 44,
                              strokeDashoffset: 2 * Math.PI * 44 * (1 - (recordSeconds / 30)),
                            }}
                          />
                        )}
                      </svg>

                      {/* Inner Circle / Center */}
                      <div className={`shutter-inner-core ${isRecording ? 'recording' : ''}`}>
                        {isRecording && <Square size={16} fill="#ffffff" color="#ffffff" />}
                      </div>
                    </button>

                    {/* Hint text for first-time use */}
                    {!isRecording && !isEffectWheelOpen && (
                      <span className="shutter-quick-hint">Фото / Видео</span>
                    )}
                  </div>

                  {/* Camera Flip Button */}
                  <button 
                    type="button" 
                    className="insta-flip-camera-btn"
                    onClick={toggleFacingMode}
                    title="Переключить камеру"
                  >
                    <RefreshCw size={22} />
                  </button>

                </div>

                {/* Bottom Mode Slider (Screenshot 2 & 3: ПУБЛИКАЦИЯ • ИСТОРИЯ • REELS) */}
                <div className="insta-mode-slider">
                  <button 
                    type="button" 
                    className={`mode-slider-item ${bottomSliderMode === 'post' ? 'active' : ''}`}
                    onClick={() => {
                      setBottomSliderMode('post');
                      setScreen('gallery');
                    }}
                  >
                    ПУБЛИКАЦИЯ
                  </button>

                  <button 
                    type="button" 
                    className={`mode-slider-item ${bottomSliderMode === 'story' ? 'active' : ''}`}
                    onClick={() => {
                      setBottomSliderMode('story');
                      setCameraSubMode('story');
                    }}
                  >
                    ИСТОРИЯ
                  </button>

                  <button 
                    type="button" 
                    className={`mode-slider-item ${bottomSliderMode === 'reels' ? 'active' : ''}`}
                    onClick={() => {
                      setBottomSliderMode('reels');
                      alert('Переход к созданию Reels');
                    }}
                  >
                    REELS
                  </button>

                  <button 
                    type="button" 
                    className={`mode-slider-item ${bottomSliderMode === 'live' ? 'active' : ''}`}
                    onClick={() => {
                      setBottomSliderMode('live');
                      setCameraSubMode('live');
                    }}
                  >
                    ПРЯМОЙ ЭФИР
                  </button>
                </div>

              </div>
            ) : (
              /* =================================================================== */
              /* PUBLISHING BAR (Shown in Preview Mode - Screenshot 1 Bottom Bar)    */
              /* =================================================================== */
              <div className="insta-preview-bottom-bar">
                
                {/* Button 1: Ваша история */}
                <button
                  type="button"
                  className="insta-publish-btn your-story"
                  onClick={() => handlePublishStory(false)}
                >
                  <div className="publish-avatar-wrapper">
                    <img src={currentUser.avatar} alt={currentUser.name} className="publish-avatar-img" />
                  </div>
                  <span>Ваша история</span>
                </button>

                {/* Button 2: Близкие друзья */}
                <button
                  type="button"
                  className="insta-publish-btn close-friends"
                  onClick={() => handlePublishStory(true)}
                >
                  <div className="publish-star-icon">
                    <Star size={14} fill="#ffffff" color="#ffffff" />
                  </div>
                  <span>Близкие друзья</span>
                </button>

                {/* Button 3: Round Next Arrow > */}
                <button
                  type="button"
                  className="insta-publish-circle-next"
                  onClick={() => handlePublishStory(false)}
                  title="Опубликовать историю"
                >
                  <ChevronRight size={24} />
                </button>

              </div>
            )}

            {/* =================================================================== */}
            {/* FLOATING TEXT EDITOR MODAL (Typing overlay)                         */}
            {/* =================================================================== */}
            {isTextEditing && (
              <div className="insta-text-editor-overlay">
                <div className="text-editor-header">
                  <div className="text-pos-toggle">
                    <button 
                      type="button"
                      className={`text-pos-btn ${textPosition === 'top' ? 'active' : ''}`}
                      onClick={() => setTextPosition('top')}
                    >
                      Сверху
                    </button>
                    <button 
                      type="button"
                      className={`text-pos-btn ${textPosition === 'center' ? 'active' : ''}`}
                      onClick={() => setTextPosition('center')}
                    >
                      Центр
                    </button>
                    <button 
                      type="button"
                      className={`text-pos-btn ${textPosition === 'bottom' ? 'active' : ''}`}
                      onClick={() => setTextPosition('bottom')}
                    >
                      Снизу
                    </button>
                  </div>

                  {cameraSubMode === 'create_text' && (
                    <button type="button" className="btn-cycle-color" onClick={cycleGradient}>
                      🎨 Цвет фона
                    </button>
                  )}

                  <button 
                    type="button" 
                    className="btn-text-done"
                    onClick={() => setIsTextEditing(false)}
                  >
                    Готово
                  </button>
                </div>

                <div className="text-editor-body">
                  <textarea
                    autoFocus
                    placeholder="Добавьте подпись..."
                    value={storyText}
                    onChange={e => setStoryText(e.target.value)}
                    maxLength={160}
                    className="insta-text-editor-input"
                  />
                </div>
              </div>
            )}

            {/* Quick Filter Switcher Drawer */}
            {showFilterPicker && (
              <div className="insta-drawer-sheet">
                <div className="sheet-header">
                  <span>Выберите фильтр</span>
                  <button type="button" onClick={() => setShowFilterPicker(false)}>✕</button>
                </div>
                <div className="sheet-filters-list">
                  {STORY_FILTERS.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      className={`sheet-filter-item ${activeFilter.id === f.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveFilter(f);
                        setShowFilterPicker(false);
                      }}
                    >
                      <div className="sheet-filter-circle" style={{ borderColor: f.badgeColor }} />
                      <span>{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stickers Drawer */}
            {showStickersPicker && (
              <div className="insta-drawer-sheet">
                <div className="sheet-header">
                  <span>Стикеры и эмодзи</span>
                  <button type="button" onClick={() => setShowStickersPicker(false)}>✕</button>
                </div>
                <div className="sheet-stickers-grid">
                  {['🔥 Огонь', '✨ New Day', '🎧 В наушниках', '📍 Локация', '☕ Coffee Time', '💯 100%', '🌟 Zen', '❤️ Любовь', '🚀 Вперёд', '👑 VIP'].map((stk, i) => (
                    <button
                      key={i}
                      type="button"
                      className="sheet-sticker-btn"
                      onClick={() => {
                        setStoryText(prev => prev ? `${prev} ${stk}` : stk);
                        setShowStickersPicker(false);
                      }}
                    >
                      {stk}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Music Picker Drawer */}
            {showMusicPicker && (
              <div className="insta-drawer-sheet">
                <div className="sheet-header">
                  <span>Музыка для истории</span>
                  <button type="button" onClick={() => setShowMusicPicker(false)}>✕</button>
                </div>
                <div className="sheet-music-list">
                  {MUSIC_TRACKS.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className={`sheet-music-row ${selectedMusic === t.title ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedMusic(t.title);
                        setShowMusicPicker(false);
                      }}
                    >
                      <div className="sheet-music-icon"><Music size={16} /></div>
                      <div className="sheet-music-info">
                        <b>{t.title}</b>
                        <span>{t.artist} • {t.duration}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: GALLERY MEDIA PICKER SCREEN (Дополнить историю - Screenshot 2)   */}
        {/* ========================================================================= */}
        {screen === 'gallery' && (
          <div className="insta-gallery-view">
            
            {/* Top Bar: Close, Title, Camera Icon */}
            <div className="insta-gallery-header">
              <button 
                type="button" 
                className="gallery-nav-icon" 
                onClick={() => setScreen('camera')}
                title="Назад к камере"
              >
                <X size={24} />
              </button>

              <h3 className="gallery-header-title">Дополнить историю</h3>

              <button 
                type="button" 
                className="gallery-nav-icon" 
                onClick={() => { 
                  setScreen('camera'); 
                  setIsPhotoSnapped(false);
                  startCamera(); 
                }}
                title="Открыть камеру"
              >
                <Camera size={22} />
              </button>
            </div>

            {/* 3 Quick Cards: Шаблоны, Музыка, Коллаж (Screenshot 2) */}
            <div className="insta-gallery-pills-row">
              <div 
                className="insta-gallery-card-tile"
                onClick={() => {
                  setSelectedImage(STORY_PRESETS[1]);
                  setStoryText('✨ Стильный шаблон New Age');
                  setIsPhotoSnapped(true);
                  setScreen('camera');
                }}
              >
                <div className="card-tile-icon-box template-gradient">
                  <LayoutTemplate size={22} color="#ffffff" />
                </div>
                <span>Шаблоны</span>
              </div>

              <div 
                className="insta-gallery-card-tile"
                onClick={() => {
                  setSelectedMusic(MUSIC_TRACKS[0].title);
                  alert(`Музыкальный трек "${MUSIC_TRACKS[0].title}" добавлен к истории`);
                }}
              >
                <div className="card-tile-icon-box music-gradient">
                  <Music size={22} color="#ffffff" />
                </div>
                <span>Музыка</span>
              </div>

              <div 
                className="insta-gallery-card-tile"
                onClick={() => {
                  setSelectedGradient(GRADIENT_PRESETS[1]);
                  setStoryText('Коллаж впечатлений');
                  setIsPhotoSnapped(true);
                  setScreen('camera');
                }}
              >
                <div className="card-tile-icon-box collage-gradient">
                  <Grid2X2 size={22} color="#ffffff" />
                </div>
                <span>Коллаж</span>
              </div>
            </div>

            {/* Filter Sub-bar: "Недавние ▾" and "Загрузить / Выбрать" */}
            <div className="insta-gallery-subbar">
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

              <div className="gallery-right-actions">
                <button
                  type="button"
                  className="btn-gallery-pill"
                  onClick={() => fileInputRef.current?.click()}
                  title="Загрузить фото с устройства"
                >
                  <Plus size={15} /> Загрузить
                </button>
                <button
                  type="button"
                  className="btn-gallery-pill outline"
                  onClick={() => alert('Режим множественного выбора активирован')}
                >
                  <Check size={14} /> Выбрать
                </button>
              </div>
            </div>

            {/* Media Grid: 1st tile is Live Camera, followed by photos */}
            <div className="insta-gallery-grid">
              
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
                <div className="camera-tile-circle">
                  <Camera size={28} color="#ffffff" />
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
                    setCameraSubMode('story');
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
                    setCameraSubMode('story');
                  }}
                >
                  <img src={presetUrl} alt={`Preset ${idx}`} />
                </div>
              ))}

            </div>

            {/* Bottom Mode Slider in Gallery */}
            <div className="insta-gallery-bottom-slider">
              <button type="button" className="mode-slider-item">ПУБЛИКАЦИЯ</button>
              <button type="button" className="mode-slider-item active">ИСТОРИЯ</button>
              <button type="button" className="mode-slider-item">REELS</button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

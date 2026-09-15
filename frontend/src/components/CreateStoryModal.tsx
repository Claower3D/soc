import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Camera, Image as ImageIcon, Sparkles, Type, Check, 
  Radio, Video, Mic, MicOff, RefreshCw, Smile, 
  Palette, Square, Wand2, MessageCircle, Eye
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

const STORY_PRESETS = [
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
];

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
  'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
];

export function CreateStoryModal({ isOpen, onClose, onCreateStory }: CreateStoryModalProps) {
  const { currentUser } = useAuth();
  
  // Modes: 'photo' | 'camera_record' | 'live'
  const [activeMode, setActiveMode] = useState<'photo' | 'camera_record' | 'live'>('photo');

  // Photo & Background states
  const [selectedImage, setSelectedImage] = useState<string>(STORY_PRESETS[0]);
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null);
  const [storyText, setStoryText] = useState('');
  const [textPosition, setTextPosition] = useState<'center' | 'bottom' | 'top'>('center');
  
  // Effects: Filter & AR Mask
  const [activeFilter, setActiveFilter] = useState<StoryFilter>(STORY_FILTERS[0]);
  const [activeMask, setActiveMask] = useState<StoryMask>(STORY_MASKS[0]);
  const [activeTab, setActiveTab] = useState<'effects' | 'backgrounds' | 'text'>('effects');

  // Camera & Recording states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

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
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start webcam
  const startCamera = async () => {
    setCameraError(null);
    stopCamera();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Камера не поддерживается вашим браузером');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Не удалось подключить камеру. Проверьте разрешения или используйте готовые фоны.');
      setCameraActive(false);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
  }, [facingMode]);

  const handleModeChange = (mode: 'photo' | 'camera_record' | 'live') => {
    setActiveMode(mode);
    if (mode === 'camera_record' || mode === 'live') {
      startCamera();
      if (mode === 'live') {
        setIsLiveActive(true);
      } else {
        setIsLiveActive(false);
      }
    } else {
      stopCamera();
      setIsLiveActive(false);
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, []);

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
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(mediaStreamRef.current);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);

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
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setSelectedGradient(null);
        setRecordedVideoUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();

    const isLive = activeMode === 'live';
    const newStory: Story = {
      id: `story_${Date.now()}`,
      user: currentUser,
      viewed: false,
      image: (activeMode === 'photo' && !selectedGradient) ? selectedImage : (selectedGradient ? undefined : selectedImage),
      gradient: (activeMode === 'photo' && selectedGradient) ? selectedGradient : undefined,
      videoUrl: recordedVideoUrl || undefined,
      isLive,
      liveViewers: isLive ? liveViewersCount : undefined,
      filter: activeFilter.id !== 'normal' ? activeFilter.name : undefined,
      mask: activeMask.id !== 'none' ? activeMask.name : undefined,
      text: storyText.trim() || (isLive ? '🔴 ПРЯМОЙ ЭФИР' : undefined),
      textPosition,
      timestamp: isLive ? 'В ЭФИРЕ' : 'Только что',
    };

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

  return (
    <div className="create-story-overlay" onClick={() => { stopCamera(); onClose(); }}>
      <div className="create-story-modal" onClick={e => e.stopPropagation()}>
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Modal Header */}
        <div className="create-story-header">
          <div className="create-story-title-row">
            <Camera size={20} className="story-header-icon" />
            <h3>Камера историй New Age</h3>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="story-mode-switcher">
            <button
              type="button"
              className={`mode-btn ${activeMode === 'photo' ? 'active' : ''}`}
              onClick={() => handleModeChange('photo')}
            >
              <ImageIcon size={14} /> Фото
            </button>
            <button
              type="button"
              className={`mode-btn ${activeMode === 'camera_record' ? 'active' : ''}`}
              onClick={() => handleModeChange('camera_record')}
            >
              <Video size={14} /> Запись видео
            </button>
            <button
              type="button"
              className={`mode-btn live-btn ${activeMode === 'live' ? 'active' : ''}`}
              onClick={() => handleModeChange('live')}
            >
              <Radio size={14} /> LIVE Эфир
            </button>
          </div>

          <button className="create-story-close-btn" onClick={() => { stopCamera(); onClose(); }}>
            <X size={20} />
          </button>
        </div>

        {/* Story Preview & Canvas Area */}
        <div className="create-story-body">
          {/* Phone Canvas with Live Feed and AR Masks */}
          <div className="story-canvas-wrapper">
            <div 
              className="story-preview-phone"
              style={{
                background: activeMode === 'photo'
                  ? (selectedGradient ? selectedGradient : `url(${selectedImage}) center/cover no-repeat`)
                  : '#000000',
              }}
            >
              {/* WebCam Video stream with CSS Filter applied */}
              {(activeMode === 'camera_record' || activeMode === 'live') && (
                <div className="camera-video-container" style={{ filter: activeFilter.filterCss }}>
                  {cameraActive ? (
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      className="camera-live-stream"
                    />
                  ) : (
                    <div className="camera-placeholder">
                      {cameraError ? (
                        <div className="camera-err-box">
                          <p>{cameraError}</p>
                          <button type="button" className="btn-retry-camera" onClick={startCamera}>
                            <RefreshCw size={14} /> Повторить подключение
                          </button>
                        </div>
                      ) : (
                        <div className="camera-starting">
                          <RefreshCw size={24} className="spin-icon" />
                          <span>Подключение камеры...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Playback for recorded video */}
                  {recordedVideoUrl && !isRecording && activeMode === 'camera_record' && (
                    <video
                      src={recordedVideoUrl}
                      controls
                      autoPlay
                      loop
                      className="camera-live-stream recorded-playback"
                    />
                  )}
                </div>
              )}

              {/* Photo Mode Filter Applied */}
              {activeMode === 'photo' && !selectedGradient && (
                <div 
                  className="photo-filter-layer" 
                  style={{ 
                    backgroundImage: `url(${selectedImage})`,
                    filter: activeFilter.filterCss 
                  }} 
                />
              )}

              {/* AR Face Masks / Fun Overlays */}
              {activeMask.id !== 'none' && (
                <div className={`ar-mask-overlay mask-${activeMask.overlayType}`}>
                  {activeMask.overlayType === 'glasses' && (
                    <div className="mask-element ar-glasses">🕶️</div>
                  )}
                  {activeMask.overlayType === 'crown' && (
                    <div className="mask-element ar-crown">👑</div>
                  )}
                  {activeMask.overlayType === 'cat_ears' && (
                    <div className="mask-element ar-cat-ears">🐱</div>
                  )}
                  {activeMask.overlayType === 'angel_halo' && (
                    <div className="mask-element ar-halo">😇</div>
                  )}
                  {activeMask.overlayType === 'cyber_visor' && (
                    <div className="mask-element ar-visor">🥽</div>
                  )}
                  {activeMask.overlayType === 'sparkles' && (
                    <div className="mask-element ar-sparkles">✨</div>
                  )}
                </div>
              )}

              {/* Top Author Badge & LIVE Indicators */}
              <div className="story-preview-header">
                <div className="story-author-info">
                  <img src={currentUser.avatar} alt={currentUser.name} className="story-author-avatar" />
                  <div className="story-author-text">
                    <span className="story-author-name">{currentUser.name}</span>
                    <span className="story-author-tag">
                      {activeMode === 'live' ? 'Прямой эфир' : 'Ваша история'}
                    </span>
                  </div>
                </div>

                {activeMode === 'live' && (
                  <div className="live-status-pill">
                    <span className="live-red-dot" />
                    <span className="live-pill-text">ПРЯМОЙ ЭФИР</span>
                    <span className="live-viewers-count">
                      <Eye size={12} /> {liveViewersCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Live Floating Reactions (Hearts) */}
              {activeMode === 'live' && (
                <div className="live-hearts-stream">
                  {liveHearts.map((heartKey) => (
                    <span key={heartKey} className="floating-heart">❤️</span>
                  ))}
                </div>
              )}

              {/* Live Chat Overlay inside Video Stream */}
              {activeMode === 'live' && (
                <div className="live-stream-chat-box">
                  <div className="live-messages-list">
                    {liveChatMessages.slice(-4).map(msg => (
                      <div key={msg.id} className="live-chat-bubble">
                        <strong>{msg.name}:</strong> {msg.text}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendLiveComment} className="live-chat-input-row">
                    <input
                      type="text"
                      placeholder="Отправить комментарий в эфир..."
                      value={liveNewMsg}
                      onChange={e => setLiveNewMsg(e.target.value)}
                    />
                    <button type="submit">
                      <MessageCircle size={14} />
                    </button>
                  </form>
                </div>
              )}

              {/* Overlay Text */}
              {storyText && (
                <div className={`story-text-overlay pos-${textPosition}`}>
                  <p>{storyText}</p>
                </div>
              )}

              {/* Active Filter watermark tag */}
              {activeFilter.id !== 'normal' && (
                <div className="active-filter-badge" style={{ borderColor: activeFilter.badgeColor }}>
                  <Wand2 size={11} /> {activeFilter.name}
                </div>
              )}

              {/* Video Recording Controls Over Canvas */}
              {activeMode === 'camera_record' && (
                <div className="recording-hud-bar">
                  <div className="recording-hud-timer">
                    <span className={`rec-dot ${isRecording ? 'pulse' : ''}`} />
                    <span>00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds} / 00:30</span>
                  </div>

                  <div className="recording-buttons-row">
                    <button
                      type="button"
                      className="hud-icon-btn"
                      onClick={toggleFacingMode}
                      title="Переключить камеру"
                    >
                      <RefreshCw size={18} />
                    </button>

                    {!isRecording ? (
                      <button
                        type="button"
                        className="record-shutter-btn"
                        onClick={startRecording}
                        title="Начать запись"
                      >
                        <div className="shutter-inner red" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="record-shutter-btn recording"
                        onClick={stopRecording}
                        title="Остановить запись"
                      >
                        <Square size={20} fill="#ffffff" color="#ffffff" />
                      </button>
                    )}

                    <button
                      type="button"
                      className={`hud-icon-btn ${isMuted ? 'muted' : ''}`}
                      onClick={() => {
                        setIsMuted(!isMuted);
                        if (mediaStreamRef.current) {
                          mediaStreamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted);
                        }
                      }}
                      title={isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
                    >
                      {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls Side Column (Эффекты, Маски, Фоны, Текст) */}
          <div className="create-story-controls">
            {/* Control category tabs */}
            <div className="controls-category-tabs">
              <button
                type="button"
                className={`cat-tab-btn ${activeTab === 'effects' ? 'active' : ''}`}
                onClick={() => setActiveTab('effects')}
              >
                <Palette size={15} /> Фильтры & Маски
              </button>
              <button
                type="button"
                className={`cat-tab-btn ${activeTab === 'backgrounds' ? 'active' : ''}`}
                onClick={() => setActiveTab('backgrounds')}
              >
                <ImageIcon size={15} /> Фоны & Фото
              </button>
              <button
                type="button"
                className={`cat-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => setActiveTab('text')}
              >
                <Type size={15} /> Текст & Стикеры
              </button>
            </div>

            {/* TAB 1: FILTERS & AR MASKS */}
            {activeTab === 'effects' && (
              <div className="tab-pane-content">
                {/* 1. Instagram Filters */}
                <div className="control-group">
                  <label className="control-group-title">
                    <Wand2 size={14} /> Фильтры Instagram:
                  </label>
                  <div className="filters-carousel">
                    {STORY_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`filter-item-card ${activeFilter.id === f.id ? 'active' : ''}`}
                        onClick={() => setActiveFilter(f)}
                      >
                        <div 
                          className="filter-sample-thumb" 
                          style={{ filter: f.filterCss }}
                        />
                        <span className="filter-name">{f.name}</span>
                        {activeFilter.id === f.id && <Check size={13} className="filter-check-icon" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. AR Face Masks */}
                <div className="control-group">
                  <label className="control-group-title">
                    <Smile size={14} /> AR Маски и Оверлеи:
                  </label>
                  <div className="masks-grid">
                    {STORY_MASKS.map((mask) => (
                      <button
                        key={mask.id}
                        type="button"
                        className={`mask-badge-btn ${activeMask.id === mask.id ? 'active' : ''}`}
                        onClick={() => setActiveMask(mask)}
                      >
                        <span className="mask-emoji">{mask.icon}</span>
                        <span className="mask-name">{mask.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BACKGROUNDS & PHOTO UPLOAD */}
            {activeTab === 'backgrounds' && (
              <div className="tab-pane-content">
                <div className="control-group">
                  <label className="control-group-title">Загрузить с устройства</label>
                  <button 
                    type="button" 
                    className="upload-story-btn" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={18} />
                    <span>Выбрать фото или изображение</span>
                  </button>
                </div>

                <div className="control-group">
                  <label className="control-group-title">Готовые фоны природы и города:</label>
                  <div className="story-presets-grid">
                    {STORY_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`preset-thumb ${selectedImage === preset && !selectedGradient ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedImage(preset);
                          setSelectedGradient(null);
                          setActiveMode('photo');
                        }}
                      >
                        <img src={preset} alt={`Пресет ${idx}`} />
                        {selectedImage === preset && !selectedGradient && (
                          <div className="preset-check"><Check size={12} /></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-group-title">Градиентные фоны New Age:</label>
                  <div className="gradient-presets-row">
                    {GRADIENT_PRESETS.map((grad, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`grad-circle ${selectedGradient === grad ? 'active' : ''}`}
                        style={{ background: grad }}
                        onClick={() => {
                          setSelectedGradient(grad);
                          setActiveMode('photo');
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TEXT & STICKERS */}
            {activeTab === 'text' && (
              <div className="tab-pane-content">
                <div className="control-group">
                  <div className="text-header-row">
                    <label className="control-group-title">
                      <Type size={14} /> Подпись к истории:
                    </label>
                    <div className="pos-buttons">
                      <button 
                        type="button" 
                        className={`pos-btn ${textPosition === 'top' ? 'active' : ''}`}
                        onClick={() => setTextPosition('top')}
                        title="Сверху"
                      >
                        Вверх
                      </button>
                      <button 
                        type="button" 
                        className={`pos-btn ${textPosition === 'center' ? 'active' : ''}`}
                        onClick={() => setTextPosition('center')}
                        title="По центру"
                      >
                        Центр
                      </button>
                      <button 
                        type="button" 
                        className={`pos-btn ${textPosition === 'bottom' ? 'active' : ''}`}
                        onClick={() => setTextPosition('bottom')}
                        title="Внизу"
                      >
                        Низ
                      </button>
                    </div>
                  </div>
                  <textarea
                    placeholder="Добавьте мысль, стикер, опрос или цитату к вашей истории..."
                    value={storyText}
                    onChange={e => setStoryText(e.target.value)}
                    maxLength={140}
                    rows={4}
                    className="story-caption-textarea"
                  />
                  <span className="caption-char-count">{storyText.length}/140</span>
                </div>

                {/* Quick Sticker suggestions */}
                <div className="control-group">
                  <label className="control-group-title">Быстрые стикеры:</label>
                  <div className="quick-stickers-row">
                    {['🔥 Огонь', '✨ New Day', '🎧 В наушниках', '📍 Локация', '☕ Coffee Time', '💯 100%'].map((stk, i) => (
                      <button
                        key={i}
                        type="button"
                        className="sticker-chip"
                        onClick={() => setStoryText(prev => prev ? `${prev} ${stk}` : stk)}
                      >
                        {stk}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action Buttons */}
            <div className="story-actions-footer">
              <button 
                type="button" 
                className="btn-cancel-story" 
                onClick={() => { stopCamera(); onClose(); }}
              >
                Отмена
              </button>
              <button 
                type="button" 
                className={`btn-publish-story ${activeMode === 'live' ? 'btn-publish-live' : ''}`}
                onClick={handlePublish}
              >
                {activeMode === 'live' ? (
                  <>
                    <Radio size={16} /> Запустить прямой эфир
                  </>
                ) : activeMode === 'camera_record' && recordedVideoUrl ? (
                  <>
                    <Sparkles size={16} /> Опубликовать видео-историю
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Опубликовать историю
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

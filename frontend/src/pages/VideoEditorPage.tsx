import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Music,
  Type,
  Download,
  Share2,
  Sliders,
  Volume2,
  Smartphone,
  Square,
  Monitor,
  Check,
  Plus,
  Trash2,
  Wand2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Film,
  SkipBack,
  SkipForward,
  Magnet,
  Flag,
  FolderOpen,
  SlidersHorizontal,
  Layers2,
  Crosshair
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import './VideoEditorPage.css';

interface TrackItem {
  id: string;
  name: string;
  start: number; // in seconds
  duration: number; // in seconds
  color: string;
  type: 'video' | 'audio' | 'text' | 'effect';
  thumb?: string;
}

const COLOR_PRESETS = [
  { id: 'normal', name: 'Оригинал', filter: 'none', desc: 'Естественные цвета' },
  { id: 'cinematic', name: 'Cinematic', filter: 'contrast(1.2) saturate(1.1) brightness(0.95)', desc: 'Киношный контраст' },
  { id: 'warm', name: 'Тёплый', filter: 'sepia(0.25) saturate(1.2) hue-rotate(-10deg)', desc: 'Золотой час' },
  { id: 'bw', name: 'Черно-белый', filter: 'grayscale(1) contrast(1.15)', desc: 'Классический ч/б' },
  { id: 'cyber', name: 'Cyberpunk', filter: 'hue-rotate(180deg) saturate(1.6) contrast(1.1)', desc: 'Неоновый стиль' },
  { id: 'vintage', name: 'Винтаж', filter: 'sepia(0.5) contrast(0.9) brightness(1.05)', desc: 'Плёночный ретро' }
];

const MEDIA_POOL_ITEMS = [
  {
    id: 'media_1',
    title: 'Замок на закате.mp4',
    thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    duration: '00:06.0',
    type: 'video',
    resolution: '4K 60fps'
  },
  {
    id: 'media_2',
    title: 'Горный хребет.mp4',
    thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
    duration: '00:09.0',
    type: 'video',
    resolution: '4K 60fps'
  },
  {
    id: 'media_3',
    title: 'Неоновый город.mp4',
    thumb: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    duration: '00:08.5',
    type: 'video',
    resolution: '1080p 60fps'
  },
  {
    id: 'media_4',
    title: 'Морской прибой.mp4',
    thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    duration: '00:07.0',
    type: 'video',
    resolution: '4K 30fps'
  }
];

const MUSIC_TRACKS = [
  { id: 'm1', title: 'Lo-Fi Chill Sunset', artist: 'New Age Sound', duration: '2:15' },
  { id: 'm2', title: 'Energetic Phonk Beat', artist: 'CyberWave', duration: '1:45' },
  { id: 'm3', title: 'Acoustic Morning Coffee', artist: 'Sunny Vibes', duration: '3:10' },
  { id: 'm4', title: 'Cinematic Ambient Strings', artist: 'Orchestra Studio', duration: '2:50' }
];

export const VideoEditorPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Aspect Ratio: 9:16 (Story/Shorts), 1:1 (Square Feed), 16:9 (YouTube)
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const totalDuration = 15; // total demo duration in seconds
  const [speed, setSpeed] = useState<number>(1);
  const [volume, setVolume] = useState<number>(85);
  const [isLooping, setIsLooping] = useState(true);

  // Active Tool Mode (DaVinci toolbar)
  const [activeTool, setActiveTool] = useState<'select' | 'trim' | 'blade' | 'magnet'>('select');
  const [isSnapping, setIsSnapping] = useState(true);
  const [showSafeGuides, setShowSafeGuides] = useState(true);

  // DaVinci Page Switcher
  const [activePage, setActivePage] = useState<'media' | 'cut' | 'edit' | 'color' | 'fairlight' | 'deliver'>('edit');

  // Inspector Panel (Toggleable)
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<'color' | 'audio' | 'text' | 'effects'>('color');

  // Active filter & Color Grading
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Text overlay
  const [textOverlay, setTextOverlay] = useState('New Age Video Studio 🔥');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textSize, setTextSize] = useState(24);

  // Selected music
  const [selectedMusic, setSelectedMusic] = useState<string | null>('m1');

  // Track state (Mute / Lock / Visibility)
  const [v2Visible, setV2Visible] = useState(true);
  const [v2Locked, setV2Locked] = useState(false);
  const [v1Visible, setV1Visible] = useState(true);
  const [v1Locked, setV1Locked] = useState(false);
  const [a1Muted, setA1Muted] = useState(false);
  const [a1Solo, setA1Solo] = useState(false);
  const [a2Muted, setA2Muted] = useState(false);
  const [a2Solo, setA2Solo] = useState(false);

  // Selected media item in source monitor
  const [selectedSourceMedia, setSelectedSourceMedia] = useState(MEDIA_POOL_ITEMS[0]);

  // Multi-track Timeline items
  const [videoClips, setVideoClips] = useState<TrackItem[]>([
    {
      id: 'v1',
      name: 'Клип 1 (Замок 4K)',
      start: 0,
      duration: 6,
      color: '#4F46E5',
      type: 'video',
      thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'v2',
      name: 'Клип 2 (Горы 4K)',
      start: 6,
      duration: 9,
      color: '#6366F1',
      type: 'video',
      thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80'
    }
  ]);

  const [exportSuccessModal, setExportSuccessModal] = useState(false);

  // Animation playback loop
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const interval = 100 / speed;
      timerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            if (isLooping) {
              return 0;
            }
            setIsPlaying(false);
            return 0;
          }
          return Math.min(totalDuration, prev + 0.1);
        });
      }, interval);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, isLooping]);

  // Helper to format SMPTE Timecode (e.g. 01:00:03:12)
  const formatSMPTE = (seconds: number) => {
    const hrs = '01';
    const totalSecs = Math.floor(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const frames = Math.floor((seconds % 1) * 25);
    const mm = mins < 10 ? `0${mins}` : mins;
    const ss = secs < 10 ? `0${secs}` : secs;
    const ff = frames < 10 ? `0${frames}` : frames;
    return `${hrs}:${mm}:${ss}:${ff}`;
  };

  const handleStepFrame = (deltaFrames: number) => {
    setIsPlaying(false);
    const frameDuration = 1 / 25; // 25 fps
    setCurrentTime((prev) => Math.max(0, Math.min(totalDuration, prev + deltaFrames * frameDuration)));
  };

  const handleSplitAtPlayhead = () => {
    if (v1Locked) return;
    const target = videoClips.find(
      (c) => currentTime > c.start && currentTime < c.start + c.duration
    );
    if (!target) return;

    const firstDuration = Math.round((currentTime - target.start) * 10) / 10;
    const secondDuration = Math.round((target.duration - firstDuration) * 10) / 10;
    if (firstDuration <= 0.2 || secondDuration <= 0.2) return;

    const clip1: TrackItem = {
      ...target,
      name: `${target.name.split(' (часть')[0]} (ч. 1)`,
      duration: firstDuration
    };
    const clip2: TrackItem = {
      id: `v-${Date.now()}`,
      name: `${target.name.split(' (часть')[0]} (ч. 2)`,
      start: currentTime,
      duration: secondDuration,
      color: '#818CF8',
      type: 'video',
      thumb: target.thumb
    };

    setVideoClips((prev) =>
      prev.flatMap((c) => (c.id === target.id ? [clip1, clip2] : [c]))
    );
  };

  const handleDeleteClip = (id: string) => {
    if (videoClips.length <= 1) return;
    setVideoClips((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddMediaToTimeline = (item: typeof MEDIA_POOL_ITEMS[0]) => {
    const lastClip = videoClips[videoClips.length - 1];
    const newStart = lastClip ? lastClip.start + lastClip.duration : 0;
    const newClip: TrackItem = {
      id: `v-${Date.now()}`,
      name: item.title.replace('.mp4', ''),
      start: newStart < totalDuration ? newStart : 0,
      duration: 4,
      color: '#4F46E5',
      type: 'video',
      thumb: item.thumb
    };
    setVideoClips((prev) => [...prev, newClip]);
  };

  const handleExport = () => {
    setIsPlaying(false);
    setExportSuccessModal(true);
  };

  const currentFilterPreset = COLOR_PRESETS.find((p) => p.id === selectedFilter);
  const baseFilterCss = currentFilterPreset?.filter === 'none' ? '' : currentFilterPreset?.filter || '';
  const finalFilterCss = `${baseFilterCss} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`.trim();

  if (!isAuthenticated) {
    return (
      <div className="video-editor-page light-theme">
        <div className="messenger-guest-lock-container">
          <GuestLockPrompt
            featureName="Видеостудия New Age"
            title="Видеостудия доступна после регистрации"
            description="Профессиональный монтаж Reels, Shorts, Stories, наложение звуковых дорожек, цветокоррекция DaVinci и экспорт доступны зарегистрированным авторам."
            actionText="Войти или зарегистрироваться"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="video-editor-page davinci-light-studio">
      
      {/* 1. DaVinci Resolve Top App Bar */}
      <div className="davinci-top-bar">
        <div className="davinci-left-cluster">
          <div className="davinci-brand-badge">
            <span className="davinci-logo-dots">
              <span className="dot dot-red" />
              <span className="dot dot-green" />
              <span className="dot dot-blue" />
            </span>
            <span className="davinci-brand-title">New Age Resolve 21</span>
          </div>

          <div className="davinci-menu-bar">
            <span>Файл</span>
            <span>Правка</span>
            <span>Подгонка</span>
            <span className="menu-active">Временная шкала</span>
            <span>Клип</span>
            <span>Маркеры</span>
            <span>Вид</span>
            <span>Воспроизведение</span>
            <span>Цвет</span>
            <span>Fairlight</span>
            <span>Справка</span>
          </div>
        </div>

        <div className="davinci-project-name">
          <span className="project-title">Проект: Reels_NewAge_Master</span>
          <span className="project-status-tag">С правками</span>
        </div>

        <div className="davinci-top-right-actions">
          <button 
            className={`davinci-btn-toggle ${isInspectorOpen ? 'active' : ''}`}
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            title="Инспектор параметров"
          >
            <SlidersHorizontal size={14} />
            <span>Инспектор</span>
          </button>

          <button className="davinci-btn-quick-export" onClick={handleExport} title="Быстрый экспорт в 4K">
            <Download size={14} />
            <span>Экспорт & Публикация</span>
          </button>
        </div>
      </div>

      {/* 2. Secondary Workspace Navigation Bar */}
      <div className="davinci-sub-nav">
        <div className="sub-nav-left-tabs">
          <button 
            className={`sub-tab-btn ${inspectorTab === 'color' ? 'active' : ''}`}
            onClick={() => { setInspectorTab('color'); setIsInspectorOpen(true); }}
          >
            <Wand2 size={14} /> Цветокор (Color)
          </button>
          <button 
            className={`sub-tab-btn ${inspectorTab === 'audio' ? 'active' : ''}`}
            onClick={() => { setInspectorTab('audio'); setIsInspectorOpen(true); }}
          >
            <Music size={14} /> Музыка & Звук
          </button>
          <button 
            className={`sub-tab-btn ${inspectorTab === 'text' ? 'active' : ''}`}
            onClick={() => { setInspectorTab('text'); setIsInspectorOpen(true); }}
          >
            <Type size={14} /> Титры & Текст
          </button>
          <button 
            className={`sub-tab-btn ${inspectorTab === 'effects' ? 'active' : ''}`}
            onClick={() => { setInspectorTab('effects'); setIsInspectorOpen(true); }}
          >
            <Scissors size={14} /> Нарезка клипов
          </button>
        </div>

        {/* Aspect Ratio selector */}
        <div className="davinci-ratio-selector">
          <span className="ratio-label">Кадр:</span>
          <button
            className={`ratio-btn ${aspectRatio === '9:16' ? 'active' : ''}`}
            onClick={() => setAspectRatio('9:16')}
            title="Формат 9:16 (Reels, Shorts, Stories)"
          >
            <Smartphone size={13} /> 9:16 Вертикальный
          </button>
          <button
            className={`ratio-btn ${aspectRatio === '1:1' ? 'active' : ''}`}
            onClick={() => setAspectRatio('1:1')}
            title="Формат 1:1 (Квадрат)"
          >
            <Square size={13} /> 1:1 Квадрат
          </button>
          <button
            className={`ratio-btn ${aspectRatio === '16:9' ? 'active' : ''}`}
            onClick={() => setAspectRatio('16:9')}
            title="Формат 16:9 (Кино / YouTube)"
          >
            <Monitor size={13} /> 16:9 Кино
          </button>
        </div>

        <div className="sub-nav-right-tools">
          <button 
            className={`guide-toggle-btn ${showSafeGuides ? 'active' : ''}`}
            onClick={() => setShowSafeGuides(!showSafeGuides)}
            title="Отображать рамки безопасных зон (Safe Areas)"
          >
            <Crosshair size={14} /> Сетки кадрирования
          </button>
        </div>
      </div>

      {/* 3. Main Workspace Row: Dual Monitors + Collapsible Inspector */}
      <div className={`davinci-workspace-grid ${isInspectorOpen ? 'with-inspector' : 'no-inspector'}`}>
        
        {/* Left Monitor: Source / Media Pool */}
        <div className="davinci-monitor-box source-monitor-panel">
          <div className="monitor-header">
            <div className="monitor-title">
              <FolderOpen size={14} />
              <span>Медиатека / Источник (Media Pool)</span>
            </div>
            <span className="monitor-badge">{MEDIA_POOL_ITEMS.length} клипов</span>
          </div>

          <div className="source-viewer-content">
            <div className="source-media-grid">
              {MEDIA_POOL_ITEMS.map((item) => (
                <div 
                  key={item.id} 
                  className={`source-media-card ${selectedSourceMedia.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedSourceMedia(item)}
                >
                  <div className="source-thumb-wrap">
                    <img src={item.thumb} alt={item.title} />
                    <span className="source-duration-tag">{item.duration}</span>
                    <span className="source-res-tag">{item.resolution}</span>
                  </div>
                  <div className="source-card-footer">
                    <span className="source-filename" title={item.title}>{item.title}</span>
                    <button 
                      className="btn-add-to-timeline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddMediaToTimeline(item);
                      }}
                      title="Добавить на таймлайн"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick action info */}
            <div className="source-quick-info">
              <div className="info-stat">
                <Film size={13} />
                <span>Выбран: <strong>{selectedSourceMedia.title}</strong></span>
              </div>
              <button 
                className="btn-insert-timeline-main"
                onClick={() => handleAddMediaToTimeline(selectedSourceMedia)}
              >
                <Plus size={13} /> Вставить клип на таймлайн
              </button>
            </div>
          </div>
        </div>

        {/* Right Monitor: Timeline Program Monitor */}
        <div className="davinci-monitor-box program-monitor-panel">
          <div className="monitor-header">
            <div className="monitor-title">
              <Monitor size={14} />
              <span>Таймлайн / Мастер-просмотр (Timeline Viewer)</span>
            </div>
            <div className="monitor-controls-meta">
              <span className="meta-tag live">LIVE</span>
              <span className="meta-tag">{aspectRatio}</span>
              <span className="meta-tag">{speed}x</span>
            </div>
          </div>

          <div className="program-screen-area">
            <div className={`davinci-screen-bezel aspect-${aspectRatio.replace(':', '-')}`}>
              
              {/* Video layer */}
              <div
                className="screen-video-render"
                style={{
                  filter: finalFilterCss,
                  backgroundImage: `url(${videoClips[0]?.thumb || selectedSourceMedia.thumb})`
                }}
              >
                {/* Safe Area Guides (DaVinci dashed lines) */}
                {showSafeGuides && (
                  <div className="safe-area-overlay">
                    <div className="safe-action-box" />
                    <div className="safe-title-box" />
                    <div className="safe-center-crosshair">
                      <span className="cross-h" />
                      <span className="cross-v" />
                    </div>
                  </div>
                )}

                {/* Animated Playhead scan line in viewer */}
                <div
                  className="screen-scan-bar"
                  style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                />

                {/* Text Title Overlay */}
                {v2Visible && textOverlay && (
                  <div
                    className="screen-text-overlay"
                    style={{
                      color: textColor,
                      fontSize: `${textSize}px`
                    }}
                  >
                    {textOverlay}
                  </div>
                )}

                {/* Music Badge Overlay */}
                {!a2Muted && selectedMusic && (
                  <div className="screen-music-badge">
                    <Music size={12} className={isPlaying ? 'music-playing-wave' : ''} />
                    <span>{MUSIC_TRACKS.find((m) => m.id === selectedMusic)?.title}</span>
                  </div>
                )}

                {/* Center Play Button on Hover / Pause */}
                <div
                  className="screen-click-target"
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Пауза' : 'Воспроизведение'}
                >
                  {!isPlaying && (
                    <div className="screen-play-glyph">
                      <Play size={36} fill="#FFFFFF" color="#FFFFFF" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Inspector Panel */}
        {isInspectorOpen && (
          <div className="davinci-inspector-panel">
            <div className="inspector-header">
              <div className="inspector-title">
                <Sliders size={14} />
                <span>Инспектор (Inspector)</span>
              </div>
              <button 
                className="btn-close-inspector"
                onClick={() => setIsInspectorOpen(false)}
                title="Свернуть инспектор"
              >
                ✕
              </button>
            </div>

            <div className="inspector-content">
              {/* Tab: Color Grading */}
              {inspectorTab === 'color' && (
                <div className="inspector-section color-section">
                  <h4 className="inspector-h4">Цветокоррекция (Color Grading & LUTs)</h4>
                  
                  <div className="lut-presets-grid">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        className={`lut-card ${selectedFilter === p.id ? 'active' : ''}`}
                        onClick={() => setSelectedFilter(p.id)}
                      >
                        <div className="lut-preview" style={{ filter: p.filter }} />
                        <div className="lut-name">{p.name}</div>
                        {selectedFilter === p.id && <Check size={12} className="lut-check" />}
                      </button>
                    ))}
                  </div>

                  <h5 className="inspector-h5">Баланс экспозиции (Primary Wheels)</h5>
                  <div className="inspector-slider-row">
                    <div className="slider-label-line">
                      <span>Яркость (Exposure)</span>
                      <strong>{brightness}%</strong>
                    </div>
                    <input 
                      type="range" 
                      min="60" 
                      max="140" 
                      value={brightness} 
                      onChange={(e) => setBrightness(Number(e.target.value))} 
                    />
                  </div>

                  <div className="inspector-slider-row">
                    <div className="slider-label-line">
                      <span>Контраст (Contrast)</span>
                      <strong>{contrast}%</strong>
                    </div>
                    <input 
                      type="range" 
                      min="60" 
                      max="150" 
                      value={contrast} 
                      onChange={(e) => setContrast(Number(e.target.value))} 
                    />
                  </div>

                  <div className="inspector-slider-row">
                    <div className="slider-label-line">
                      <span>Насыщенность (Saturation)</span>
                      <strong>{saturation}%</strong>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="180" 
                      value={saturation} 
                      onChange={(e) => setSaturation(Number(e.target.value))} 
                    />
                  </div>

                  <button 
                    className="btn-reset-wheels"
                    onClick={() => {
                      setSelectedFilter('normal');
                      setBrightness(100);
                      setContrast(100);
                      setSaturation(100);
                    }}
                  >
                    Сбросить коррекцию
                  </button>
                </div>
              )}

              {/* Tab: Audio & Sound */}
              {inspectorTab === 'audio' && (
                <div className="inspector-section audio-section">
                  <h4 className="inspector-h4">Звуковая дорожка (Fairlight Audio)</h4>
                  
                  <div className="audio-selector-list">
                    {MUSIC_TRACKS.map((track) => (
                      <div 
                        key={track.id}
                        className={`audio-track-item ${selectedMusic === track.id ? 'active' : ''}`}
                        onClick={() => setSelectedMusic(selectedMusic === track.id ? null : track.id)}
                      >
                        <div className="track-icon">
                          <Music size={14} />
                        </div>
                        <div className="track-meta">
                          <div className="track-title">{track.title}</div>
                          <div className="track-artist">{track.artist} • {track.duration}</div>
                        </div>
                        <button className="track-pick-btn">
                          {selectedMusic === track.id ? 'Активен' : 'Выбрать'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="inspector-slider-row" style={{ marginTop: 14 }}>
                    <div className="slider-label-line">
                      <span>Мастер-громкость музыки</span>
                      <strong>{volume}%</strong>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume} 
                      onChange={(e) => setVolume(Number(e.target.value))} 
                    />
                  </div>
                </div>
              )}

              {/* Tab: Text & Titles */}
              {inspectorTab === 'text' && (
                <div className="inspector-section text-section">
                  <h4 className="inspector-h4">Титры & Субтитры (Fusion Titles)</h4>
                  
                  <div className="inspector-form-field">
                    <label>Текст на экране</label>
                    <input 
                      type="text" 
                      value={textOverlay} 
                      onChange={(e) => setTextOverlay(e.target.value)}
                      placeholder="Введите текст титра..."
                    />
                  </div>

                  <div className="inspector-slider-row">
                    <div className="slider-label-line">
                      <span>Кегль шрифта</span>
                      <strong>{textSize}px</strong>
                    </div>
                    <input 
                      type="range" 
                      min="14" 
                      max="54" 
                      value={textSize} 
                      onChange={(e) => setTextSize(Number(e.target.value))} 
                    />
                  </div>

                  <div className="inspector-form-field">
                    <label>Цвет заливки</label>
                    <div className="text-color-swatches">
                      {['#FFFFFF', '#FACC15', '#6366F1', '#EC4899', '#10B981', '#0F172A'].map((c) => (
                        <button 
                          key={c}
                          className={`color-swatch ${textColor === c ? 'active' : ''}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setTextColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Effects & Split */}
              {inspectorTab === 'effects' && (
                <div className="inspector-section effects-section">
                  <h4 className="inspector-h4">Инструменты лезвия (Blade & Split)</h4>
                  <p className="inspector-hint">
                    Поместите курсор на нужный кадр и нажмите кнопку ниже, чтобы разрезать клип на две части.
                  </p>
                  <button className="btn-inspector-blade" onClick={handleSplitAtPlayhead}>
                    <Scissors size={15} /> Разрезать клип на {formatSMPTE(currentTime)}
                  </button>

                  <h5 className="inspector-h5" style={{ marginTop: 16 }}>Фрагменты на дорожке V1:</h5>
                  <div className="inspector-clips-list">
                    {videoClips.map((clip) => (
                      <div key={clip.id} className="inspector-clip-row">
                        <div className="clip-row-info">
                          <strong>{clip.name}</strong>
                          <span>{clip.start.toFixed(1)}с – {(clip.start + clip.duration).toFixed(1)}с ({clip.duration.toFixed(1)}с)</span>
                        </div>
                        <button 
                          className="btn-trash-clip" 
                          onClick={() => handleDeleteClip(clip.id)}
                          disabled={videoClips.length <= 1}
                          title="Удалить фрагмент"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Professional Transport Bar (Between Monitors and Timeline) */}
      <div className="davinci-transport-bar">
        {/* Left tool selection buttons (Arrow, Trim, Blade, Magnet, Marker) */}
        <div className="transport-tools-cluster">
          <button 
            className={`tool-icon-btn ${activeTool === 'select' ? 'active' : ''}`}
            onClick={() => setActiveTool('select')}
            title="Стрелка выбора (A)"
          >
            <Film size={14} />
          </button>
          <button 
            className={`tool-icon-btn ${activeTool === 'trim' ? 'active' : ''}`}
            onClick={() => setActiveTool('trim')}
            title="Инструмент подгонки Trim (T)"
          >
            <Sliders size={14} />
          </button>
          <button 
            className={`tool-icon-btn ${activeTool === 'blade' ? 'active' : ''}`}
            onClick={() => {
              setActiveTool('blade');
              handleSplitAtPlayhead();
            }}
            title="Лезвие / Разрезать клип (B)"
          >
            <Scissors size={14} />
          </button>
          <button 
            className={`tool-icon-btn ${isSnapping ? 'active' : ''}`}
            onClick={() => setIsSnapping(!isSnapping)}
            title="Магнитное прилипание клипов (N)"
          >
            <Magnet size={14} />
          </button>
          <button 
            className="tool-icon-btn"
            onClick={() => alert(`Маркер добавлен на кадре ${formatSMPTE(currentTime)}`)}
            title="Добавить маркер (M)"
          >
            <Flag size={14} />
          </button>
        </div>

        {/* Center Frame-Stepping and Playback Controls */}
        <div className="transport-playback-cluster">
          <button 
            className="playback-btn" 
            onClick={() => { setCurrentTime(0); setIsPlaying(false); }}
            title="В самое начало (Home)"
          >
            <SkipBack size={14} />
          </button>
          <button 
            className="playback-btn" 
            onClick={() => handleStepFrame(-1)}
            title="На 1 кадр назад (Left Arrow)"
          >
            <RotateCcw size={13} />
          </button>
          <button 
            className={`playback-btn play-main-toggle ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
            title="Воспроизведение / Пауза (Space)"
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
          </button>
          <button 
            className="playback-btn" 
            onClick={() => handleStepFrame(1)}
            title="На 1 кадр вперёд (Right Arrow)"
          >
            <RotateCcw size={13} style={{ transform: 'scaleX(-1)' }} />
          </button>
          <button 
            className="playback-btn" 
            onClick={() => { setCurrentTime(totalDuration); setIsPlaying(false); }}
            title="В конец таймлайна (End)"
          >
            <SkipForward size={14} />
          </button>
          <button 
            className={`playback-btn loop-toggle ${isLooping ? 'active' : ''}`}
            onClick={() => setIsLooping(!isLooping)}
            title="Зацикливание таймлайна"
          >
            <Layers2 size={13} />
          </button>
        </div>

        {/* Right: SMPTE Timecode, Speed, Audio Monitor */}
        <div className="transport-timecode-cluster">
          <div className="smpte-display-box" title="Точный таймкод SMPTE (Часы:Минуты:Секунды:Кадры)">
            <span className="smpte-label">TCG</span>
            <span className="smpte-value">{formatSMPTE(currentTime)}</span>
          </div>

          <div className="speed-selector-pills">
            {[0.5, 1, 1.5, 2].map((s) => (
              <button
                key={s}
                className={`speed-btn ${speed === s ? 'active' : ''}`}
                onClick={() => setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="master-volume-box">
            <Volume2 size={14} />
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume} 
              onChange={(e) => setVolume(Number(e.target.value))} 
              className="master-vol-slider"
            />
            {/* Visual audio dB meter */}
            <div className="audio-db-meter">
              <span className={`db-bar ${volume > 30 ? 'lit' : ''}`} />
              <span className={`db-bar ${volume > 60 ? 'lit' : ''}`} />
              <span className={`db-bar ${volume > 85 ? 'lit-amber' : ''}`} />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Professional Multi-Track Timeline */}
      <div className="davinci-timeline-workstation">
        
        {/* Timeline Header Ruler Toolbar */}
        <div className="timeline-header-ruler-row">
          <div className="tracks-header-title-plate">
            <span>ТРЕКИ МОНТАЖА</span>
          </div>

          {/* SMPTE Time Ruler */}
          <div 
            className="timeline-time-ruler"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              setCurrentTime(ratio * totalDuration);
            }}
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="ruler-major-tick">
                <span className="tick-label">{formatSMPTE(i)}</span>
                <span className="micro-ticks">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tracks Main Body with vertical Needle Playhead */}
        <div className="timeline-tracks-body">
          
          {/* DaVinci Red Playhead Needle */}
          <div
            className="davinci-playhead"
            style={{ left: `calc(180px + (100% - 180px) * ${currentTime / totalDuration})` }}
          >
            <div className="playhead-cap">
              <span>{formatSMPTE(currentTime).split(':')[3]}f</span>
            </div>
            <div className="playhead-line" />
          </div>

          {/* Track 1: V2 (Титры / Оверлеи) */}
          <div className="timeline-lane-row track-v2">
            <div className="lane-header-plate">
              <div className="plate-track-id">V2</div>
              <div className="plate-track-name">Титры</div>
              <div className="plate-actions">
                <button 
                  className={`plate-btn ${!v2Visible ? 'disabled' : ''}`} 
                  onClick={() => setV2Visible(!v2Visible)}
                  title={v2Visible ? 'Скрыть дорожку' : 'Показать дорожку'}
                >
                  {v2Visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button 
                  className={`plate-btn ${v2Locked ? 'active' : ''}`} 
                  onClick={() => setV2Locked(!v2Locked)}
                  title={v2Locked ? 'Разблокировать дорожку' : 'Заблокировать дорожку'}
                >
                  {v2Locked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>
            </div>

            <div 
              className="lane-track-content"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                setCurrentTime(Math.max(0, Math.min(1, clickX / rect.width)) * totalDuration);
              }}
            >
              {v2Visible && textOverlay && (
                <div 
                  className="timeline-clip-item text-clip"
                  style={{ left: '10%', width: '75%' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectorTab('text');
                    setIsInspectorOpen(true);
                  }}
                >
                  <Type size={12} className="clip-icon" />
                  <span className="clip-label-text">{textOverlay}</span>
                  <div className="trim-handle-l" />
                  <div className="trim-handle-r" />
                </div>
              )}
            </div>
          </div>

          {/* Track 2: V1 (Видео) */}
          <div className="timeline-lane-row track-v1">
            <div className="lane-header-plate">
              <div className="plate-track-id">V1</div>
              <div className="plate-track-name">Видео ({aspectRatio})</div>
              <div className="plate-actions">
                <button 
                  className={`plate-btn ${!v1Visible ? 'disabled' : ''}`} 
                  onClick={() => setV1Visible(!v1Visible)}
                  title={v1Visible ? 'Скрыть дорожку' : 'Показать дорожку'}
                >
                  {v1Visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button 
                  className={`plate-btn ${v1Locked ? 'active' : ''}`} 
                  onClick={() => setV1Locked(!v1Locked)}
                  title={v1Locked ? 'Разблокировать дорожку' : 'Заблокировать дорожку'}
                >
                  {v1Locked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>
            </div>

            <div 
              className="lane-track-content"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                setCurrentTime(Math.max(0, Math.min(1, clickX / rect.width)) * totalDuration);
              }}
            >
              {v1Visible && videoClips.map((clip) => {
                const leftPercent = (clip.start / totalDuration) * 100;
                const widthPercent = (clip.duration / totalDuration) * 100;
                return (
                  <div
                    key={clip.id}
                    className="timeline-clip-item video-clip"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: clip.color
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectorTab('effects');
                      setIsInspectorOpen(true);
                    }}
                  >
                    <div className="clip-filmstrip-thumbs">
                      <img src={clip.thumb} alt={clip.name} />
                      <img src={clip.thumb} alt={clip.name} />
                    </div>
                    <div className="clip-info-strip">
                      <Film size={12} />
                      <span className="clip-label-text">{clip.name}</span>
                    </div>
                    <div className="trim-handle-l" />
                    <div className="trim-handle-r" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 3: A1 (Основное аудио) */}
          <div className="timeline-lane-row track-a1">
            <div className="lane-header-plate">
              <div className="plate-track-id">A1</div>
              <div className="plate-track-name">Звук клипа</div>
              <div className="plate-actions">
                <button 
                  className={`plate-badge-btn ${a1Muted ? 'active-mute' : ''}`} 
                  onClick={() => setA1Muted(!a1Muted)}
                  title="Заглушить дорожку A1 (Mute)"
                >
                  M
                </button>
                <button 
                  className={`plate-badge-btn ${a1Solo ? 'active-solo' : ''}`} 
                  onClick={() => setA1Solo(!a1Solo)}
                  title="Соло дорожки A1 (Solo)"
                >
                  S
                </button>
              </div>
            </div>

            <div 
              className="lane-track-content"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                setCurrentTime(Math.max(0, Math.min(1, clickX / rect.width)) * totalDuration);
              }}
            >
              {!a1Muted && (
                <div 
                  className="timeline-clip-item audio-primary-clip"
                  style={{ left: '0%', width: '100%' }}
                >
                  <div className="audio-waveform-svg">
                    <span className="wave-stem h-40" />
                    <span className="wave-stem h-70" />
                    <span className="wave-stem h-90" />
                    <span className="wave-stem h-50" />
                    <span className="wave-stem h-80" />
                    <span className="wave-stem h-60" />
                    <span className="wave-stem h-95" />
                    <span className="wave-stem h-75" />
                    <span className="wave-stem h-45" />
                    <span className="wave-stem h-85" />
                    <span className="wave-stem h-65" />
                    <span className="wave-stem h-90" />
                    <span className="wave-stem h-50" />
                    <span className="wave-stem h-80" />
                    <span className="wave-stem h-60" />
                    <span className="wave-stem h-95" />
                    <span className="wave-stem h-75" />
                    <span className="wave-stem h-40" />
                  </div>
                  <span className="clip-label-text">Оригинальная звуковая дорожка 48kHz Stereo</span>
                </div>
              )}
            </div>
          </div>

          {/* Track 4: A2 (Фоновая музыка) */}
          <div className="timeline-lane-row track-a2">
            <div className="lane-header-plate">
              <div className="plate-track-id">A2</div>
              <div className="plate-track-name">Музыка</div>
              <div className="plate-actions">
                <button 
                  className={`plate-badge-btn ${a2Muted ? 'active-mute' : ''}`} 
                  onClick={() => setA2Muted(!a2Muted)}
                  title="Заглушить дорожку A2 (Mute)"
                >
                  M
                </button>
                <button 
                  className={`plate-badge-btn ${a2Solo ? 'active-solo' : ''}`} 
                  onClick={() => setA2Solo(!a2Solo)}
                  title="Соло дорожки A2 (Solo)"
                >
                  S
                </button>
              </div>
            </div>

            <div 
              className="lane-track-content"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                setCurrentTime(Math.max(0, Math.min(1, clickX / rect.width)) * totalDuration);
              }}
            >
              {!a2Muted && selectedMusic ? (
                <div 
                  className="timeline-clip-item music-clip"
                  style={{ left: '0%', width: '100%' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectorTab('audio');
                    setIsInspectorOpen(true);
                  }}
                >
                  <Music size={12} className="clip-icon" />
                  <span className="clip-label-text">
                    ♫ {MUSIC_TRACKS.find((m) => m.id === selectedMusic)?.title} (Фоновое аудио)
                  </span>
                  <div className="audio-waveform-svg music-wave">
                    <span className="wave-stem h-60" />
                    <span className="wave-stem h-90" />
                    <span className="wave-stem h-70" />
                    <span className="wave-stem h-85" />
                    <span className="wave-stem h-55" />
                    <span className="wave-stem h-95" />
                    <span className="wave-stem h-65" />
                    <span className="wave-stem h-80" />
                  </div>
                </div>
              ) : (
                <button 
                  className="timeline-btn-add-music"
                  onClick={() => {
                    setInspectorTab('audio');
                    setIsInspectorOpen(true);
                  }}
                >
                  <Plus size={12} /> Добавить фоновую музыку на A2
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 6. DaVinci Signature Bottom Page Switcher */}
      <div className="davinci-bottom-page-bar">
        <button 
          className={`page-tab-item ${activePage === 'media' ? 'active' : ''}`}
          onClick={() => setActivePage('media')}
        >
          <FolderOpen size={14} />
          <span>Медиатека</span>
        </button>
        <button 
          className={`page-tab-item ${activePage === 'cut' ? 'active' : ''}`}
          onClick={() => setActivePage('cut')}
        >
          <Scissors size={14} />
          <span>Быстрая нарезка</span>
        </button>
        <button 
          className={`page-tab-item ${activePage === 'edit' ? 'active' : ''}`}
          onClick={() => setActivePage('edit')}
        >
          <Film size={14} />
          <span>Монтаж (Edit)</span>
        </button>
        <button 
          className={`page-tab-item ${activePage === 'color' ? 'active' : ''}`}
          onClick={() => {
            setActivePage('color');
            setInspectorTab('color');
            setIsInspectorOpen(true);
          }}
        >
          <Wand2 size={14} />
          <span>Цветокор (Color)</span>
        </button>
        <button 
          className={`page-tab-item ${activePage === 'fairlight' ? 'active' : ''}`}
          onClick={() => {
            setActivePage('fairlight');
            setInspectorTab('audio');
            setIsInspectorOpen(true);
          }}
        >
          <Music size={14} />
          <span>Звук Fairlight</span>
        </button>
        <button 
          className={`page-tab-item ${activePage === 'deliver' ? 'active' : ''}`}
          onClick={() => {
            setActivePage('deliver');
            handleExport();
          }}
        >
          <Download size={14} />
          <span>Экспорт (Deliver)</span>
        </button>
      </div>

      {/* 7. Export & Publish Modal */}
      {exportSuccessModal && (
        <div className="export-modal-backdrop" onClick={() => setExportSuccessModal(false)}>
          <div className="export-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="export-modal-header">
              <div className="success-badge">
                <Check size={28} />
              </div>
              <h3>Видео успешно смонтировано!</h3>
              <p>Разрешение 1080x1920 (Full HD, 60 FPS, кодек H.264). Выберите действие:</p>
            </div>

            <div className="export-options-grid">
              <div className="export-action-card">
                <h4>Опубликовать в New Age</h4>
                <div className="publish-buttons-col">
                  <button
                    className="btn-publish-story"
                    onClick={() => {
                      alert('Видео успешно опубликовано в ваши Истории (Stories)!');
                      setExportSuccessModal(false);
                    }}
                  >
                    <Smartphone size={16} /> Опубликовать в Истории (Stories)
                  </button>
                  <button
                    className="btn-publish-feed"
                    onClick={() => {
                      alert('Видео успешно опубликовано в основную Ленту!');
                      setExportSuccessModal(false);
                    }}
                  >
                    <Share2 size={16} /> Опубликовать в Ленту постов
                  </button>
                  <button
                    className="btn-publish-channel"
                    onClick={() => {
                      alert('Видео отправлено на обработку и публикацию на ваш видеоканал!');
                      setExportSuccessModal(false);
                    }}
                  >
                    <Monitor size={16} /> Опубликовать на моём канале
                  </button>
                </div>
              </div>

              <div className="export-action-card">
                <h4>Сохранить локально</h4>
                <button
                  className="btn-download-file"
                  onClick={() => {
                    alert('Файл new_age_edit.mp4 начал скачиваться.');
                    setExportSuccessModal(false);
                  }}
                >
                  <Download size={16} /> Скачать MP4 на устройство
                </button>
              </div>
            </div>

            <button
              className="btn-close-modal"
              onClick={() => setExportSuccessModal(false)}
            >
              Вернуться в монтажную студию
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Music,
  Type,
  Sparkles,
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
  Layers,
  Wand2
} from 'lucide-react';
import './VideoEditorPage.css';

interface TrackItem {
  id: string;
  name: string;
  start: number; // in seconds
  duration: number; // in seconds
  color: string;
  type: 'video' | 'audio' | 'text' | 'effect';
}

const COLOR_PRESETS = [
  { id: 'normal', name: 'Оригинал', filter: 'none' },
  { id: 'cinematic', name: 'Cinematic', filter: 'contrast(1.2) saturate(1.1) brightness(0.95)' },
  { id: 'warm', name: 'Тёплый', filter: 'sepia(0.25) saturate(1.2) hue-rotate(-10deg)' },
  { id: 'bw', name: 'Черно-белый', filter: 'grayscale(1) contrast(1.15)' },
  { id: 'cyber', name: 'Cyberpunk', filter: 'hue-rotate(180deg) saturate(1.6) contrast(1.1)' },
  { id: 'vintage', name: 'Винтаж', filter: 'sepia(0.5) contrast(0.9) brightness(1.05)' }
];

const MUSIC_TRACKS = [
  { id: 'm1', title: 'Lo-Fi Chill Sunset', artist: 'New Age Sound', duration: '2:15' },
  { id: 'm2', title: 'Energetic Phonk Beat', artist: 'CyberWave', duration: '1:45' },
  { id: 'm3', title: 'Acoustic Morning Coffee', artist: 'Sunny Vibes', duration: '3:10' },
  { id: 'm4', title: 'Cinematic Ambient Strings', artist: 'Orchestra Studio', duration: '2:50' }
];

export const VideoEditorPage: React.FC = () => {
  // Aspect Ratio: 9:16 (Story/Shorts), 1:1 (Square Feed), 16:9 (YouTube)
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const totalDuration = 15; // total demo duration in seconds
  const [speed, setSpeed] = useState<number>(1);
  const [volume, setVolume] = useState<number>(80);

  // Active filter
  const [selectedFilter, setSelectedFilter] = useState('normal');

  // Text overlay
  const [textOverlay, setTextOverlay] = useState('New Age Video Studio 🔥');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textSize, setTextSize] = useState(22);
  const [activeSideTab, setActiveSideTab] = useState<'filters' | 'audio' | 'text' | 'effects'>('filters');

  // Selected music
  const [selectedMusic, setSelectedMusic] = useState<string | null>('m1');

  // Multi-track Timeline items
  const [videoClips, setVideoClips] = useState<TrackItem[]>([
    { id: 'v1', name: 'Клип 1 (Вступление)', start: 0, duration: 6, color: '#6366F1', type: 'video' },
    { id: 'v2', name: 'Клип 2 (Основная часть)', start: 6, duration: 9, color: '#4F46E5', type: 'video' }
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
  }, [isPlaying, speed]);

  const handleSplitAtPlayhead = () => {
    // Find clip at currentTime
    const target = videoClips.find(
      (c) => currentTime > c.start && currentTime < c.start + c.duration
    );
    if (!target) return;

    const firstDuration = currentTime - target.start;
    const secondDuration = target.duration - firstDuration;

    const clip1: TrackItem = {
      ...target,
      name: `${target.name} (часть 1)`,
      duration: firstDuration
    };
    const clip2: TrackItem = {
      id: `v-${Date.now()}`,
      name: `${target.name} (часть 2)`,
      start: currentTime,
      duration: secondDuration,
      color: '#818CF8',
      type: 'video'
    };

    setVideoClips((prev) =>
      prev.flatMap((c) => (c.id === target.id ? [clip1, clip2] : [c]))
    );
  };

  const handleDeleteClip = (id: string) => {
    if (videoClips.length <= 1) return;
    setVideoClips((prev) => prev.filter((c) => c.id !== id));
  };

  const handleExport = () => {
    setIsPlaying(false);
    setExportSuccessModal(true);
  };

  const currentFilterCss =
    COLOR_PRESETS.find((p) => p.id === selectedFilter)?.filter || 'none';

  return (
    <div className="video-editor-page">
      {/* Top Header Controls */}
      <div className="editor-top-nav">
        <div className="editor-title-wrap">
          <div className="editor-icon-badge">
            <Sparkles size={20} />
          </div>
          <div>
            <h2>New Age Video Studio</h2>
            <span>Профессиональный монтаж Reels, Shorts, Stories и видео 4K</span>
          </div>
        </div>

        {/* Aspect Ratio selector */}
        <div className="aspect-ratio-selector">
          <button
            className={`ratio-btn ${aspectRatio === '9:16' ? 'active' : ''}`}
            onClick={() => setAspectRatio('9:16')}
            title="Формат 9:16 (Reels, Shorts, Stories)"
          >
            <Smartphone size={16} /> 9:16 Вертикальный
          </button>
          <button
            className={`ratio-btn ${aspectRatio === '1:1' ? 'active' : ''}`}
            onClick={() => setAspectRatio('1:1')}
            title="Формат 1:1 (Квадратная лента)"
          >
            <Square size={16} /> 1:1 Квадрат
          </button>
          <button
            className={`ratio-btn ${aspectRatio === '16:9' ? 'active' : ''}`}
            onClick={() => setAspectRatio('16:9')}
            title="Формат 16:9 (YouTube, горизонтальное)"
          >
            <Monitor size={16} /> 16:9 Горизонтальный
          </button>
        </div>

        <div className="export-top-actions">
          <button className="btn-export-render" onClick={handleExport}>
            <Download size={16} /> Экспорт & Публикация
          </button>
        </div>
      </div>

      {/* Main Workspace (Preview + Side Tools) */}
      <div className="editor-workspace-row">
        {/* Live Preview Canvas */}
        <div className="preview-canvas-column">
          <div className={`canvas-screen-frame ratio-${aspectRatio.replace(':', '-')}`}>
            <div
              className="canvas-video-layer"
              style={{
                filter: currentFilterCss,
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80)'
              }}
            >
              {/* Animated Playhead scan indicator */}
              <div
                className="canvas-play-indicator"
                style={{
                  left: `${(currentTime / totalDuration) * 100}%`
                }}
              />

              {/* Text Overlay */}
              {textOverlay && (
                <div
                  className="canvas-text-overlay"
                  style={{
                    color: textColor,
                    fontSize: `${textSize}px`
                  }}
                >
                  {textOverlay}
                </div>
              )}

              {/* Music badge */}
              {selectedMusic && (
                <div className="canvas-music-pill">
                  <Music size={12} className="music-pulse" />
                  <span>{MUSIC_TRACKS.find((m) => m.id === selectedMusic)?.title}</span>
                </div>
              )}
            </div>

            {/* Play/Pause overlay */}
            <div
              className="canvas-click-overlay"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {!isPlaying && (
                <div className="canvas-center-play">
                  <Play size={32} fill="#FFFFFF" color="#FFFFFF" />
                </div>
              )}
            </div>
          </div>

          {/* Quick Player Scrubber Controls */}
          <div className="preview-player-bar">
            <button
              className="player-control-btn play-toggle"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
            </button>
            <button
              className="player-control-btn"
              onClick={() => {
                setCurrentTime(0);
                setIsPlaying(false);
              }}
              title="В начало"
            >
              <RotateCcw size={16} />
            </button>

            <span className="timestamp-readout">
              00:{currentTime < 10 ? `0${currentTime.toFixed(1)}` : currentTime.toFixed(1)} / 00:{totalDuration}.0
            </span>

            {/* Speed toggle */}
            <div className="speed-pills">
              {[0.5, 1, 1.5, 2].map((s) => (
                <button
                  key={s}
                  className={`speed-pill ${speed === s ? 'active' : ''}`}
                  onClick={() => setSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div className="volume-slider-wrap">
              <Volume2 size={16} />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Side Tool Settings Panel */}
        <div className="editor-side-tools-column">
          <div className="side-tools-nav-tabs">
            <button
              className={`side-tab-btn ${activeSideTab === 'filters' ? 'active' : ''}`}
              onClick={() => setActiveSideTab('filters')}
            >
              <Wand2 size={16} /> Цветокор
            </button>
            <button
              className={`side-tab-btn ${activeSideTab === 'audio' ? 'active' : ''}`}
              onClick={() => setActiveSideTab('audio')}
            >
              <Music size={16} /> Музыка
            </button>
            <button
              className={`side-tab-btn ${activeSideTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveSideTab('text')}
            >
              <Type size={16} /> Текст
            </button>
            <button
              className={`side-tab-btn ${activeSideTab === 'effects' ? 'active' : ''}`}
              onClick={() => setActiveSideTab('effects')}
            >
              <Sliders size={16} /> Нарезка
            </button>
          </div>

          <div className="side-tool-content-box">
            {activeSideTab === 'filters' && (
              <div className="tab-filters-grid">
                <h4>Цветовые пресеты (Color Grading)</h4>
                <div className="filters-list">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className={`filter-card-btn ${selectedFilter === preset.id ? 'active' : ''}`}
                      onClick={() => setSelectedFilter(preset.id)}
                    >
                      <div
                        className="filter-thumb-preview"
                        style={{ filter: preset.filter }}
                      />
                      <span>{preset.name}</span>
                      {selectedFilter === preset.id && (
                        <Check size={14} className="filter-check-icon" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSideTab === 'audio' && (
              <div className="tab-audio-list">
                <h4>Библиотека треков (Без лицензионных ограничений)</h4>
                <div className="music-tracks-column">
                  {MUSIC_TRACKS.map((track) => (
                    <div
                      key={track.id}
                      className={`music-track-item ${selectedMusic === track.id ? 'selected' : ''}`}
                      onClick={() =>
                        setSelectedMusic(selectedMusic === track.id ? null : track.id)
                      }
                    >
                      <div className="track-icon-box">
                        <Music size={16} />
                      </div>
                      <div className="track-info">
                        <strong>{track.title}</strong>
                        <span>{track.artist} • {track.duration}</span>
                      </div>
                      <button className="track-choose-btn">
                        {selectedMusic === track.id ? 'Выбран' : 'Добавить'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSideTab === 'text' && (
              <div className="tab-text-editor">
                <h4>Текстовые плашки & Субтитры</h4>
                <div className="form-field">
                  <label>Текст на экране</label>
                  <input
                    type="text"
                    value={textOverlay}
                    onChange={(e) => setTextOverlay(e.target.value)}
                    placeholder="Введите текст..."
                  />
                </div>

                <div className="form-field">
                  <label>Размер шрифта: {textSize}px</label>
                  <input
                    type="range"
                    min="14"
                    max="48"
                    value={textSize}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                  />
                </div>

                <div className="form-field">
                  <label>Цвет текста</label>
                  <div className="color-dots-row">
                    {['#FFFFFF', '#FACC15', '#6366F1', '#EC4899', '#10B981', '#000000'].map(
                      (c) => (
                        <button
                          key={c}
                          className={`color-dot ${textColor === c ? 'active' : ''}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setTextColor(c)}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSideTab === 'effects' && (
              <div className="tab-split-editor">
                <h4>Инструменты монтажа</h4>
                <p className="hint-text">
                  Установите курсор таймлайна в нужное место и нажмите «Разрезать клип».
                </p>
                <div className="split-action-buttons">
                  <button className="btn-split-tool" onClick={handleSplitAtPlayhead}>
                    <Scissors size={18} /> Разрезать клип по таймкоду ({currentTime.toFixed(1)}с)
                  </button>
                </div>

                <div className="clips-manager-list">
                  <h5>Клипы на видео-дорожке:</h5>
                  {videoClips.map((clip) => (
                    <div key={clip.id} className="clip-row-item">
                      <div>
                        <strong>{clip.name}</strong>
                        <span>{clip.start.toFixed(1)}с – {(clip.start + clip.duration).toFixed(1)}с ({clip.duration.toFixed(1)}с)</span>
                      </div>
                      <button
                        className="btn-delete-clip"
                        onClick={() => handleDeleteClip(clip.id)}
                        disabled={videoClips.length <= 1}
                        title="Удалить фрагмент"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Track Timeline */}
      <div className="editor-timeline-section">
        <div className="timeline-toolbar">
          <div className="toolbar-left">
            <span className="timeline-badge">
              <Layers size={14} /> Мультитрековый таймлайн
            </span>
            <button className="timeline-tool-btn" onClick={handleSplitAtPlayhead}>
              <Scissors size={14} /> Split (Разрезать)
            </button>
          </div>

          <div className="timeline-zoom-scale">
            <span>Масштаб: 100%</span>
          </div>
        </div>

        <div className="timeline-tracks-container">
          {/* Time Ruler */}
          <div className="time-ruler">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="ruler-tick">
                <span>00:{i < 10 ? `0${i}` : i}</span>
              </div>
            ))}
          </div>

          {/* Red Playhead Line */}
          <div
            className="timeline-playhead-line"
            style={{
              left: `${(currentTime / totalDuration) * 100}%`
            }}
          >
            <div className="playhead-head" />
          </div>

          {/* Track 1: Video */}
          <div className="track-row">
            <div className="track-header">
              <Sparkles size={14} /> Видео ({aspectRatio})
            </div>
            <div
              className="track-lane"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                setCurrentTime(ratio * totalDuration);
              }}
            >
              {videoClips.map((clip) => {
                const leftPercent = (clip.start / totalDuration) * 100;
                const widthPercent = (clip.duration / totalDuration) * 100;
                return (
                  <div
                    key={clip.id}
                    className="track-clip video-clip"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: clip.color
                    }}
                  >
                    <div className="clip-trim-handle left" />
                    <span className="clip-label">{clip.name}</span>
                    <div className="clip-trim-handle right" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 2: Audio/Music */}
          <div className="track-row">
            <div className="track-header">
              <Music size={14} /> Аудиодорожка
            </div>
            <div
              className="track-lane"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                setCurrentTime(ratio * totalDuration);
              }}
            >
              {selectedMusic ? (
                <div
                  className="track-clip audio-clip"
                  style={{ left: '0%', width: '100%', backgroundColor: '#10B981' }}
                >
                  <Music size={14} />
                  <span className="clip-label">
                    {MUSIC_TRACKS.find((m) => m.id === selectedMusic)?.title} (Фон)
                  </span>
                </div>
              ) : (
                <button
                  className="add-track-btn"
                  onClick={() => setActiveSideTab('audio')}
                >
                  <Plus size={14} /> Добавить фоновую музыку
                </button>
              )}
            </div>
          </div>

          {/* Track 3: Text & Titles */}
          <div className="track-row">
            <div className="track-header">
              <Type size={14} /> Текст / Титры
            </div>
            <div
              className="track-lane"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                setCurrentTime(ratio * totalDuration);
              }}
            >
              {textOverlay && (
                <div
                  className="track-clip text-clip"
                  style={{ left: '10%', width: '75%', backgroundColor: '#F59E0B' }}
                >
                  <Type size={14} />
                  <span className="clip-label">{textOverlay}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export & Publish Modal */}
      {exportSuccessModal && (
        <div className="export-modal-backdrop" onClick={() => setExportSuccessModal(false)}>
          <div className="export-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="export-modal-header">
              <div className="success-badge">
                <Check size={28} />
              </div>
              <h3>Видео успешно смонтировано!</h3>
              <p>Разрешение 1080x1920 (Full HD, 60 FPS). Выберите действие:</p>
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
              Вернуться в студию
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

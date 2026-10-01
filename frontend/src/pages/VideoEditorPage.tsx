import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Crosshair,
  Copy,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import './VideoEditorPage.css';

export interface TrackClip {
  id: string;
  trackId: 'v2' | 'v1' | 'a1' | 'a2';
  name: string;
  start: number; // in seconds
  duration: number; // in seconds
  color: string;
  type: 'video' | 'audio' | 'text' | 'music';
  thumb?: string;
  // Typography properties:
  text?: string;
  textColor?: string;
  textSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  posX?: number;
  posY?: number;
  bgColor?: string;
  hasShadow?: boolean;
  hasStroke?: boolean;
  // Audio properties:
  volume?: number;
  filter?: string;
}

const FONT_FAMILIES = [
  { id: 'sans-serif', name: 'Inter (Современный без засечек)' },
  { id: "'Montserrat', sans-serif", name: 'Montserrat (Геометричный)' },
  { id: "'Impact', 'Arial Black', sans-serif", name: 'Impact / Viral (Reels / Shorts)' },
  { id: "'Oswald', sans-serif", name: 'Oswald (Узкий киношный)' },
  { id: "'Playfair Display', serif", name: 'Playfair Display (Премиум Serif)' },
  { id: "'Courier New', monospace", name: 'Courier New (Ретро машинка)' },
  { id: "'Pacifico', cursive", name: 'Pacifico (Рукописный)' },
  { id: "'Rubik', sans-serif", name: 'Rubik (Скругленный)' }
];

const FONT_WEIGHTS = [
  { id: '400', name: 'Обычный' },
  { id: '600', name: 'Полужирный' },
  { id: '700', name: 'Жирный' },
  { id: '900', name: 'Black' }
];

const TEXT_COLORS = [
  '#FFFFFF',
  '#FACC15',
  '#EF4444',
  '#3B82F6',
  '#10B981',
  '#EC4899',
  '#8B5CF6',
  '#0F172A'
];

const BG_PRESETS = [
  { id: 'transparent', name: 'Без фона' },
  { id: 'rgba(0, 0, 0, 0.7)', name: 'Тёмная' },
  { id: 'rgba(255, 255, 255, 0.9)', name: 'Светлая' },
  { id: 'rgba(239, 68, 68, 0.85)', name: 'Красная' },
  { id: 'rgba(234, 179, 8, 0.9)', name: 'Жёлтая' }
];

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

const INITIAL_CLIPS: TrackClip[] = [
  // V2: Text Titles
  {
    id: 'text_1',
    trackId: 'v2',
    name: 'Титр: New Age',
    start: 0.5,
    duration: 5.0,
    color: '#d97706',
    type: 'text',
    text: 'New Age Video Studio 🔥',
    textColor: '#FFFFFF',
    textSize: 26,
    fontWeight: '800',
    fontFamily: "'Montserrat', sans-serif",
    textAlign: 'center',
    posX: 50,
    posY: 75,
    bgColor: 'rgba(0, 0, 0, 0.65)',
    hasShadow: true,
    hasStroke: false
  },
  {
    id: 'text_2',
    trackId: 'v2',
    name: 'Титр: 4K HDR',
    start: 6.2,
    duration: 4.5,
    color: '#d97706',
    type: 'text',
    text: 'Кинематографичный 4K HDR ⚡',
    textColor: '#FACC15',
    textSize: 24,
    fontWeight: '900',
    fontFamily: "'Impact', 'Arial Black', sans-serif",
    textAlign: 'center',
    posX: 50,
    posY: 80,
    bgColor: 'transparent',
    hasShadow: true,
    hasStroke: true
  },
  // V1: Video Tracks
  {
    id: 'video_1',
    trackId: 'v1',
    name: 'Замок на закате.mp4',
    start: 0,
    duration: 6.0,
    color: '#4F46E5',
    type: 'video',
    thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    filter: 'cinematic'
  },
  {
    id: 'video_2',
    trackId: 'v1',
    name: 'Горный хребет.mp4',
    start: 6.0,
    duration: 9.0,
    color: '#6366F1',
    type: 'video',
    thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
    filter: 'warm'
  },
  // A1: Original Video Audio
  {
    id: 'audio_1',
    trackId: 'a1',
    name: 'Звук клипа (Замок) 48kHz',
    start: 0,
    duration: 6.0,
    color: '#0d9488',
    type: 'audio',
    volume: 85
  },
  {
    id: 'audio_2',
    trackId: 'a1',
    name: 'Звук клипа (Горы) 48kHz',
    start: 6.0,
    duration: 9.0,
    color: '#0f766e',
    type: 'audio',
    volume: 80
  },
  // A2: Background Music
  {
    id: 'music_1',
    trackId: 'a2',
    name: 'Lo-Fi Chill Sunset',
    start: 0,
    duration: 15.0,
    color: '#10b981',
    type: 'music',
    volume: 70
  }
];

export const VideoEditorPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Aspect Ratio: 9:16 (Story/Shorts), 1:1 (Square Feed), 16:9 (YouTube)
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  
  // Timeline clips state
  const [clips, setClips] = useState<TrackClip[]>(INITIAL_CLIPS);
  const [selectedClipId, setSelectedClipId] = useState<string | null>('video_1');
  
  // History for Undo / Redo
  const [history, setHistory] = useState<TrackClip[][]>([INITIAL_CLIPS]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [speed, setSpeed] = useState<number>(1);
  const [volume, setVolume] = useState<number>(85);
  const [isLooping, setIsLooping] = useState(true);

  // Dynamic Total Timeline Duration (minimum 16s, expands if clips exceed)
  const maxClipEnd = Math.max(...clips.map((c) => c.start + c.duration), 16);
  const totalDuration = Math.ceil(maxClipEnd);

  // Active Tool Mode (DaVinci toolbar)
  const [activeTool, setActiveTool] = useState<'select' | 'trim' | 'blade' | 'magnet'>('select');
  const [isSnapping, setIsSnapping] = useState(true);
  const [showSafeGuides, setShowSafeGuides] = useState(true);

  // Zoom scale (1x, 1.5x, 2x, 3x)
  const [zoomScale, setZoomScale] = useState<number>(1);

  // DaVinci Page Switcher
  const [activePage, setActivePage] = useState<'media' | 'cut' | 'edit' | 'color' | 'fairlight' | 'deliver'>('edit');

  // Inspector Panel (Toggleable)
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<'clip' | 'color' | 'audio' | 'text' | 'effects'>('clip');

  // Master Color Grading
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

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
  const [exportSuccessModal, setExportSuccessModal] = useState(false);

  // Dragging and Trimming State
  const [dragState, setDragState] = useState<{
    clipId: string;
    mode: 'move' | 'trim-start' | 'trim-end';
    startX: number;
    initialStart: number;
    initialDuration: number;
    currentStart: number;
    currentDuration: number;
  } | null>(null);

  // Blade Cut Hover state
  const [bladeHover, setBladeHover] = useState<{
    clipId: string;
    time: number;
    percent: number;
  } | null>(null);

  // Timeline Container Ref for measuring pixel widths
  const timelineLanesRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Monitor preview text dragging
  const [isDraggingTextOnScreen, setIsDraggingTextOnScreen] = useState(false);
  const screenRenderRef = useRef<HTMLDivElement>(null);

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
  }, [isPlaying, speed, isLooping, totalDuration]);

  // Helper to format SMPTE Timecode (e.g. 01:00:03:12)
  const formatSMPTE = (seconds: number) => {
    const hrs = '01';
    const totalSecs = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const frames = Math.floor(((seconds >= 0 ? seconds : 0) % 1) * 25);
    const mm = mins < 10 ? `0${mins}` : mins;
    const ss = secs < 10 ? `0${secs}` : secs;
    const ff = frames < 10 ? `0${frames}` : frames;
    return `${hrs}:${mm}:${ss}:${ff}`;
  };

  // Push new state into Undo history
  const pushHistory = useCallback((newClips: TrackClip[]) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newClips];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setClips(history[newIdx]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setClips(history[newIdx]);
    }
  }, [historyIndex, history]);

  const handleStepFrame = (deltaFrames: number) => {
    setIsPlaying(false);
    const frameDuration = 1 / 25; // 25 fps
    setCurrentTime((prev) => Math.max(0, Math.min(totalDuration, prev + deltaFrames * frameDuration)));
  };

  // Splitting / Slicing Logic
  const splitClipAtTime = (clipId: string, splitTime: number) => {
    const target = clips.find((c) => c.id === clipId);
    if (!target) return;
    if (splitTime <= target.start + 0.2 || splitTime >= target.start + target.duration - 0.2) return;

    const firstDuration = Math.round((splitTime - target.start) * 10) / 10;
    const secondDuration = Math.round((target.duration - firstDuration) * 10) / 10;
    if (firstDuration <= 0.2 || secondDuration <= 0.2) return;

    const clip1: TrackClip = {
      ...target,
      name: `${target.name.split(' (ч.')[0]} (ч. 1)`,
      duration: firstDuration
    };
    const clip2: TrackClip = {
      ...target,
      id: `${target.type}_${Date.now()}`,
      name: `${target.name.split(' (ч.')[0]} (ч. 2)`,
      start: splitTime,
      duration: secondDuration
    };

    const newClips = clips.flatMap((c) => (c.id === clipId ? [clip1, clip2] : [c]));
    setClips(newClips);
    setSelectedClipId(clip2.id);
    pushHistory(newClips);
  };

  // Split at current Playhead position
  const handleSplitAtPlayhead = () => {
    // If selected clip is under playhead, split it
    let target = clips.find(
      (c) => c.id === selectedClipId && currentTime > c.start + 0.1 && currentTime < c.start + c.duration - 0.1
    );
    // Otherwise look for video clip on V1
    if (!target && !v1Locked) {
      target = clips.find(
        (c) => c.trackId === 'v1' && currentTime > c.start + 0.1 && currentTime < c.start + c.duration - 0.1
      );
    }
    // Otherwise any clip under playhead
    if (!target) {
      target = clips.find(
        (c) => currentTime > c.start + 0.1 && currentTime < c.start + c.duration - 0.1
      );
    }

    if (target) {
      splitClipAtTime(target.id, currentTime);
    }
  };

  // Delete clip
  const handleDeleteClip = (id: string) => {
    const newClips = clips.filter((c) => c.id !== id);
    setClips(newClips);
    if (selectedClipId === id) {
      setSelectedClipId(newClips[0]?.id || null);
    }
    pushHistory(newClips);
  };

  // Duplicate clip
  const handleDuplicateClip = (id: string) => {
    const target = clips.find((c) => c.id === id);
    if (!target) return;
    const newClip: TrackClip = {
      ...target,
      id: `${target.type}_${Date.now()}`,
      name: `${target.name} (Копия)`,
      start: Math.round((target.start + target.duration + 0.2) * 10) / 10
    };
    const newClips = [...clips, newClip];
    setClips(newClips);
    setSelectedClipId(newClip.id);
    pushHistory(newClips);
  };

  // Add Clip to V1 (from Media Pool)
  const handleAddMediaToTimeline = (item: typeof MEDIA_POOL_ITEMS[0]) => {
    const newClip: TrackClip = {
      id: `video_${Date.now()}`,
      trackId: 'v1',
      name: item.title,
      start: currentTime,
      duration: 5.0,
      color: '#4F46E5',
      type: 'video',
      thumb: item.thumb,
      filter: 'cinematic'
    };
    const newClips = [...clips, newClip];
    setClips(newClips);
    setSelectedClipId(newClip.id);
    pushHistory(newClips);
  };

  // Add Text Title Clip to V2
  const handleAddTextClip = () => {
    const newClip: TrackClip = {
      id: `text_${Date.now()}`,
      trackId: 'v2',
      name: `Титр ${clips.filter((c) => c.trackId === 'v2').length + 1}`,
      start: currentTime,
      duration: 4.0,
      color: '#d97706',
      type: 'text',
      text: 'Новый заголовок ✨',
      textColor: '#FFFFFF',
      textSize: 26,
      fontWeight: '700',
      fontFamily: "'Montserrat', sans-serif",
      textAlign: 'center',
      posX: 50,
      posY: 75,
      bgColor: 'transparent',
      hasShadow: true,
      hasStroke: false
    };
    const newClips = [...clips, newClip];
    setClips(newClips);
    setSelectedClipId(newClip.id);
    setInspectorTab('clip');
    setIsInspectorOpen(true);
    pushHistory(newClips);
  };

  // Add Audio Clip to A1
  const handleAddAudioClip = () => {
    const newClip: TrackClip = {
      id: `audio_${Date.now()}`,
      trackId: 'a1',
      name: 'Стереодорожка FX 48kHz',
      start: currentTime,
      duration: 5.0,
      color: '#0d9488',
      type: 'audio',
      volume: 85
    };
    const newClips = [...clips, newClip];
    setClips(newClips);
    setSelectedClipId(newClip.id);
    pushHistory(newClips);
  };

  // Add Music to A2
  const handleAddMusicClip = (track: typeof MUSIC_TRACKS[0]) => {
    const newClip: TrackClip = {
      id: `music_${Date.now()}`,
      trackId: 'a2',
      name: track.title,
      start: currentTime,
      duration: 10.0,
      color: '#10b981',
      type: 'music',
      volume: 75
    };
    const newClips = [...clips, newClip];
    setClips(newClips);
    setSelectedClipId(newClip.id);
    pushHistory(newClips);
  };

  // Direct Drag & Drop: Start Dragging or Trimming
  const handleStartDrag = (
    e: React.MouseEvent,
    clip: TrackClip,
    mode: 'move' | 'trim-start' | 'trim-end'
  ) => {
    e.stopPropagation();
    e.preventDefault();

    // If blade tool is active and clicked on body, perform split directly!
    if (activeTool === 'blade' && mode === 'move') {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const splitTime = clip.start + ratio * clip.duration;
      splitClipAtTime(clip.id, splitTime);
      return;
    }

    setSelectedClipId(clip.id);
    setDragState({
      clipId: clip.id,
      mode,
      startX: e.clientX,
      initialStart: clip.start,
      initialDuration: clip.duration,
      currentStart: clip.start,
      currentDuration: clip.duration
    });
  };

  // Window mouse move & up listeners for drag & trim
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const lanesWidth = timelineLanesRef.current?.getBoundingClientRect().width || 1000;
      const effectiveWidth = lanesWidth * zoomScale;
      const pxPerSec = effectiveWidth / totalDuration;
      const deltaSec = (e.clientX - dragState.startX) / pxPerSec;

      if (dragState.mode === 'move') {
        let newStart = Math.max(0, dragState.initialStart + deltaSec);

        // Snapping (Magnet N)
        if (isSnapping) {
          // Snap to 0
          if (newStart < 0.25) newStart = 0;
          // Snap to current Playhead
          if (Math.abs(newStart - currentTime) < 0.25) newStart = currentTime;
          // Snap to other clips' start / end points
          clips.forEach((other) => {
            if (other.id !== dragState.clipId) {
              if (Math.abs(newStart - (other.start + other.duration)) < 0.25) {
                newStart = other.start + other.duration;
              }
              if (Math.abs(newStart - other.start) < 0.25) {
                newStart = other.start;
              }
            }
          });
        }

        newStart = Math.round(newStart * 10) / 10;

        setDragState((prev) => (prev ? { ...prev, currentStart: newStart } : null));
        setClips((prev) =>
          prev.map((c) => (c.id === dragState.clipId ? { ...c, start: newStart } : c))
        );
      } else if (dragState.mode === 'trim-start') {
        let newStart = dragState.initialStart + deltaSec;
        const maxStart = dragState.initialStart + dragState.initialDuration - 0.3;
        newStart = Math.max(0, Math.min(maxStart, newStart));
        let newDuration = dragState.initialDuration - (newStart - dragState.initialStart);
        newDuration = Math.max(0.3, Math.round(newDuration * 10) / 10);
        newStart = Math.round(newStart * 10) / 10;

        setDragState((prev) =>
          prev ? { ...prev, currentStart: newStart, currentDuration: newDuration } : null
        );
        setClips((prev) =>
          prev.map((c) =>
            c.id === dragState.clipId ? { ...c, start: newStart, duration: newDuration } : c
          )
        );
      } else if (dragState.mode === 'trim-end') {
        let newDuration = Math.max(0.3, dragState.initialDuration + deltaSec);
        newDuration = Math.round(newDuration * 10) / 10;

        setDragState((prev) => (prev ? { ...prev, currentDuration: newDuration } : null));
        setClips((prev) =>
          prev.map((c) => (c.id === dragState.clipId ? { ...c, duration: newDuration } : c))
        );
      }
    };

    const handleMouseUp = () => {
      if (dragState) {
        pushHistory(clips);
        setDragState(null);
      }
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, clips, totalDuration, zoomScale, isSnapping, currentTime, pushHistory]);

  // Currently Active Clips at Playhead (for Live Preview Monitor)
  const activeVideoClip =
    clips.find(
      (c) => c.trackId === 'v1' && currentTime >= c.start && currentTime < c.start + c.duration
    ) || clips.find((c) => c.trackId === 'v1') || { thumb: selectedSourceMedia.thumb, filter: 'normal', name: 'Черный экран' };

  const activeTextClip = clips.find(
    (c) => c.trackId === 'v2' && currentTime >= c.start && currentTime < c.start + c.duration
  );

  const activeMusicClip = clips.find(
    (c) => c.trackId === 'a2' && currentTime >= c.start && currentTime < c.start + c.duration
  );

  const selectedClip = clips.find((c) => c.id === selectedClipId);

  // Monitor preview text dragging
  const handleStartTextDragOnScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!activeTextClip) return;
    setSelectedClipId(activeTextClip.id);
    setInspectorTab('clip');
    setIsInspectorOpen(true);
    setIsDraggingTextOnScreen(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingTextOnScreen || !activeTextClip || !screenRenderRef.current) return;
      const rect = screenRenderRef.current.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / rect.width) * 100;
      const rawY = ((e.clientY - rect.top) / rect.height) * 100;
      const x = Math.max(5, Math.min(95, Math.round(rawX)));
      const y = Math.max(5, Math.min(95, Math.round(rawY)));

      setClips((prev) =>
        prev.map((c) => (c.id === activeTextClip.id ? { ...c, posX: x, posY: y } : c))
      );
    };

    const handleMouseUp = () => {
      if (isDraggingTextOnScreen) {
        setIsDraggingTextOnScreen(false);
        pushHistory(clips);
      }
    };

    if (isDraggingTextOnScreen) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingTextOnScreen, activeTextClip, clips, pushHistory]);

  // Blade tool hover indicator on clips
  const handleClipMouseMove = (e: React.MouseEvent, clip: TrackClip) => {
    if (activeTool !== 'blade') {
      if (bladeHover) setBladeHover(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const splitTime = clip.start + ratio * clip.duration;
    setBladeHover({
      clipId: clip.id,
      time: splitTime,
      percent: ratio * 100
    });
  };

  const handleClipMouseLeave = () => {
    if (bladeHover) setBladeHover(null);
  };

  // Keyboard Shortcuts (Space: Play, B: Blade, A: Select, T: Trim, N: Snapping, Del: Delete, Ctrl+Z, Ctrl+Y, Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') {
        setActiveTool('select');
      } else if (e.key === 'b' || e.key === 'B' || e.key === 'и' || e.key === 'И') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleSplitAtPlayhead();
        } else {
          setActiveTool('blade');
        }
      } else if (e.key === 't' || e.key === 'T' || e.key === 'е' || e.key === 'Е') {
        setActiveTool('trim');
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'т' || e.key === 'Т') {
        setIsSnapping((s) => !s);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          handleDeleteClip(selectedClipId);
        }
      } else if (e.code === 'ArrowLeft') {
        handleStepFrame(-1);
      } else if (e.code === 'ArrowRight') {
        handleStepFrame(1);
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'z' || e.key === 'Z' || e.key === 'я' || e.key === 'Я')
      ) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В')
      ) {
        e.preventDefault();
        if (selectedClipId) {
          handleDuplicateClip(selectedClipId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, handleUndo, handleRedo]);

  const handleExport = () => {
    setIsPlaying(false);
    setExportSuccessModal(true);
  };

  // Filters calculation
  const currentFilterPreset = COLOR_PRESETS.find((p) => p.id === (selectedClip?.filter || selectedFilter));
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
            <span onClick={handleUndo} title="Отменить (Ctrl+Z)" className="menu-btn-action">
              Отмена
            </span>
            <span onClick={handleRedo} title="Повторить (Ctrl+Y)" className="menu-btn-action">
              Повтор
            </span>
            <span className="menu-active">Временная шкала</span>
            <span onClick={handleSplitAtPlayhead} title="Разрезать клип (Ctrl+B)">
              Разрезать
            </span>
            <span>Клип</span>
            <span>Маркеры</span>
            <span>Вид</span>
            <span>Цвет</span>
            <span>Fairlight</span>
          </div>
        </div>

        <div className="davinci-project-name">
          <span className="project-title">Проект: Reels_NewAge_Master</span>
          <span className="project-status-tag">Правка дорожек</span>
        </div>

        <div className="davinci-top-right-actions">
          {/* Undo / Redo Top Toolbar buttons */}
          <div className="undo-redo-cluster">
            <button
              className="undo-btn"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Отменить действие (Ctrl+Z)"
            >
              <Undo2 size={13} />
            </button>
            <button
              className="undo-btn"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Повторить действие (Ctrl+Y)"
            >
              <Redo2 size={13} />
            </button>
          </div>

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
            className={`sub-tab-btn ${inspectorTab === 'clip' ? 'active' : ''}`}
            onClick={() => { setInspectorTab('clip'); setIsInspectorOpen(true); }}
          >
            <Sliders size={14} /> Клип ({selectedClip?.name || 'Не выбран'})
          </button>
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
            <Scissors size={14} /> Нарезка дорожек
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

          <button
            className={`btn-guide-toggle ${showSafeGuides ? 'active' : ''}`}
            onClick={() => setShowSafeGuides(!showSafeGuides)}
            title="Включить рамку безопасных зон Action/Title Safe"
          >
            <Crosshair size={13} /> Безопасные зоны
          </button>
        </div>
      </div>

      {/* 3. DaVinci Dual-Monitor & Inspector Work Area */}
      <div className={`davinci-workspace-grid ${isInspectorOpen ? 'with-inspector' : 'no-inspector'}`}>
        
        {/* Left Monitor: Source Monitor / Media Pool */}
        <div className="davinci-monitor-box source-monitor-panel">
          <div className="monitor-header">
            <div className="monitor-title">
              <FolderOpen size={14} />
              <span>Медиатека / Пул исходников (Media Pool)</span>
            </div>
            <span className="monitor-badge">{MEDIA_POOL_ITEMS.length} клипа</span>
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
                    <span className="source-filename">{item.title}</span>
                    <button 
                      className="btn-add-to-timeline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddMediaToTimeline(item);
                      }}
                      title="Добавить на таймлайн (V1)"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="source-quick-info">
              <div className="info-stat">
                <Film size={13} />
                <span>Выбран: <strong>{selectedSourceMedia.title}</strong></span>
              </div>
              <button 
                className="btn-insert-timeline-main"
                onClick={() => handleAddMediaToTimeline(selectedSourceMedia)}
              >
                <Plus size={13} /> Вставить на V1
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
              
              {/* Video layer reflecting current playhead */}
              <div
                ref={screenRenderRef}
                className="screen-video-render"
                style={{
                  filter: finalFilterCss,
                  backgroundImage: v1Visible && activeVideoClip.thumb ? `url(${activeVideoClip.thumb})` : 'none',
                  backgroundColor: '#090d16'
                }}
              >
                {/* Safe Area Guides */}
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

                {/* Text Title Overlay dynamically from active V2 text clip */}
                {v2Visible && activeTextClip && (
                  <div
                    className={`screen-text-overlay ${isDraggingTextOnScreen ? 'dragging' : ''} ${selectedClipId === activeTextClip.id ? 'selected' : ''}`}
                    style={{
                      left: `${activeTextClip.posX ?? 50}%`,
                      top: `${activeTextClip.posY ?? 75}%`,
                      color: activeTextClip.textColor || '#FFFFFF',
                      fontSize: `${activeTextClip.textSize || 26}px`,
                      fontWeight: activeTextClip.fontWeight || '700',
                      fontFamily: activeTextClip.fontFamily || "'Montserrat', sans-serif",
                      textAlign: activeTextClip.textAlign || 'center',
                      backgroundColor: activeTextClip.bgColor && activeTextClip.bgColor !== 'transparent' ? activeTextClip.bgColor : 'transparent',
                      padding: activeTextClip.bgColor && activeTextClip.bgColor !== 'transparent' ? '6px 14px' : '2px 6px',
                      borderRadius: activeTextClip.bgColor && activeTextClip.bgColor !== 'transparent' ? '8px' : '4px',
                      textShadow: activeTextClip.hasShadow !== false ? '0 2px 10px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)' : 'none',
                      WebkitTextStroke: activeTextClip.hasStroke ? '1.5px #000000' : 'none'
                    }}
                    onMouseDown={handleStartTextDragOnScreen}
                    title="Зажмите и перетаскивайте для перемещения текста по экрану"
                  >
                    {isDraggingTextOnScreen && (
                      <span className="text-position-badge">
                        X: {Math.round(activeTextClip.posX ?? 50)}% | Y: {Math.round(activeTextClip.posY ?? 75)}%
                      </span>
                    )}
                    {activeTextClip.text}
                  </div>
                )}

                {/* Music Badge Overlay from active A2 music clip */}
                {!a2Muted && activeMusicClip && (
                  <div className="screen-music-badge">
                    <Music size={12} className={isPlaying ? 'music-playing-wave' : ''} />
                    <span>{activeMusicClip.name}</span>
                  </div>
                )}

                {/* Center Play Button on Hover / Pause */}
                <div
                  className="screen-click-target"
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Пауза (Space)' : 'Воспроизведение (Space)'}
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
              {/* Tab: Clip Properties */}
              {inspectorTab === 'clip' && (
                <div className="inspector-section clip-properties-section">
                  <h4 className="inspector-h4">Параметры выбранного клипа</h4>
                  {selectedClip ? (
                    <div className="clip-props-form">
                      <div className="inspector-form-field">
                        <label>Название клипа</label>
                        <input
                          type="text"
                          value={selectedClip.name}
                          onChange={(e) => {
                            const newClips = clips.map((c) =>
                              c.id === selectedClip.id ? { ...c, name: e.target.value } : c
                            );
                            setClips(newClips);
                          }}
                        />
                      </div>

                      <div className="inspector-two-cols">
                        <div className="inspector-form-field">
                          <label>Начало (сек)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={selectedClip.start}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              const newClips = clips.map((c) =>
                                c.id === selectedClip.id ? { ...c, start: val } : c
                              );
                              setClips(newClips);
                              pushHistory(newClips);
                            }}
                          />
                        </div>
                        <div className="inspector-form-field">
                          <label>Длительность (сек)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.3"
                            value={selectedClip.duration}
                            onChange={(e) => {
                              const val = Math.max(0.3, parseFloat(e.target.value) || 0.3);
                              const newClips = clips.map((c) =>
                                c.id === selectedClip.id ? { ...c, duration: val } : c
                              );
                              setClips(newClips);
                              pushHistory(newClips);
                            }}
                          />
                        </div>
                      </div>

                      <div className="clip-quick-action-btns">
                        <button
                          className="btn-clip-action-split"
                          onClick={() => splitClipAtTime(selectedClip.id, currentTime)}
                          disabled={currentTime <= selectedClip.start || currentTime >= selectedClip.start + selectedClip.duration}
                          title="Разрезать в точке Playhead"
                        >
                          <Scissors size={14} /> Разрезать на {formatSMPTE(currentTime)}
                        </button>

                        <div className="action-row-buttons">
                          <button
                            className="btn-clip-action-dup"
                            onClick={() => handleDuplicateClip(selectedClip.id)}
                            title="Дублировать клип (Ctrl+D)"
                          >
                            <Copy size={13} /> Дублировать
                          </button>
                          <button
                            className="btn-clip-action-del"
                            onClick={() => handleDeleteClip(selectedClip.id)}
                            title="Удалить клип (Delete)"
                          >
                            <Trash2 size={13} /> Удалить
                          </button>
                        </div>
                      </div>

                      {/* If Text Clip: Full Typography & Layout Editor */}
                      {selectedClip.type === 'text' && (
                        <div className="text-clip-editor-sub">
                          {/* 1. Text Content */}
                          <div className="inspector-form-field">
                            <label className="sub-label">Текст титра</label>
                            <textarea
                              rows={2}
                              value={selectedClip.text || ''}
                              placeholder="Введите текст титра..."
                              onChange={(e) => {
                                const val = e.target.value;
                                const newClips = clips.map((c) =>
                                  c.id === selectedClip.id ? { ...c, text: val } : c
                                );
                                setClips(newClips);
                              }}
                            />
                          </div>

                          {/* 2. Font Family */}
                          <div className="inspector-form-field">
                            <label className="sub-label">Шрифт (Гарнитура)</label>
                            <select
                              className="davinci-select-input"
                              value={selectedClip.fontFamily || "'Montserrat', sans-serif"}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newClips = clips.map((c) =>
                                  c.id === selectedClip.id ? { ...c, fontFamily: val } : c
                                );
                                setClips(newClips);
                                pushHistory(newClips);
                              }}
                            >
                              {FONT_FAMILIES.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 3. Font Weight / Thickness */}
                          <div className="inspector-form-field">
                            <label className="sub-label">Начертание / Толщина</label>
                            <div className="font-weight-pills">
                              {FONT_WEIGHTS.map((w) => (
                                <button
                                  key={w.id}
                                  type="button"
                                  className={`weight-pill ${(selectedClip.fontWeight || '700') === w.id ? 'active' : ''}`}
                                  onClick={() => {
                                    const newClips = clips.map((c) =>
                                      c.id === selectedClip.id ? { ...c, fontWeight: w.id } : c
                                    );
                                    setClips(newClips);
                                    pushHistory(newClips);
                                  }}
                                >
                                  {w.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 4. Text Size (Кегль) */}
                          <div className="inspector-slider-row">
                            <div className="slider-label-line">
                              <span>Кегль шрифта (Размер)</span>
                              <strong>{selectedClip.textSize || 24}px</strong>
                            </div>
                            <input
                              type="range"
                              min="14"
                              max="68"
                              value={selectedClip.textSize || 24}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const newClips = clips.map((c) =>
                                  c.id === selectedClip.id ? { ...c, textSize: val } : c
                                );
                                setClips(newClips);
                              }}
                            />
                          </div>

                          {/* 5. Text Alignment */}
                          <div className="inspector-form-field">
                            <label className="sub-label">Выравнивание текста</label>
                            <div className="text-align-cluster">
                              {[
                                { id: 'left', label: 'По левому' },
                                { id: 'center', label: 'По центру' },
                                { id: 'right', label: 'По правому' }
                              ].map((a) => (
                                <button
                                  key={a.id}
                                  type="button"
                                  className={`align-btn ${(selectedClip.textAlign || 'center') === a.id ? 'active' : ''}`}
                                  onClick={() => {
                                    const newClips = clips.map((c) =>
                                      c.id === selectedClip.id ? { ...c, textAlign: a.id as 'left' | 'center' | 'right' } : c
                                    );
                                    setClips(newClips);
                                    pushHistory(newClips);
                                  }}
                                >
                                  {a.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 6. Position (X / Y) */}
                          <div className="inspector-form-field">
                            <div className="slider-label-line">
                              <label className="sub-label">Позиция на кадре</label>
                              <span className="pos-coords-tag">X: {selectedClip.posX ?? 50}% | Y: {selectedClip.posY ?? 75}%</span>
                            </div>
                            
                            {/* Quick position presets */}
                            <div className="pos-presets-row">
                              <button
                                type="button"
                                className="pos-preset-btn"
                                onClick={() => {
                                  const newClips = clips.map((c) =>
                                    c.id === selectedClip.id ? { ...c, posX: 50, posY: 18 } : c
                                  );
                                  setClips(newClips);
                                  pushHistory(newClips);
                                }}
                                title="Вверху кадра"
                              >
                                ⬆️ Вверху
                              </button>
                              <button
                                type="button"
                                className="pos-preset-btn"
                                onClick={() => {
                                  const newClips = clips.map((c) =>
                                    c.id === selectedClip.id ? { ...c, posX: 50, posY: 50 } : c
                                  );
                                  setClips(newClips);
                                  pushHistory(newClips);
                                }}
                                title="По центру кадра"
                              >
                                ⏺️ Центр
                              </button>
                              <button
                                type="button"
                                className="pos-preset-btn"
                                onClick={() => {
                                  const newClips = clips.map((c) =>
                                    c.id === selectedClip.id ? { ...c, posX: 50, posY: 80 } : c
                                  );
                                  setClips(newClips);
                                  pushHistory(newClips);
                                }}
                                title="Внизу кадра (Субтитры)"
                              >
                                ⬇️ Внизу (Субтитры)
                              </button>
                            </div>

                            <div className="inspector-two-cols" style={{ marginTop: 8 }}>
                              <div className="pos-slider-group">
                                <span className="tiny-label">По вертикали Y ({selectedClip.posY ?? 75}%)</span>
                                <input
                                  type="range"
                                  min="10"
                                  max="90"
                                  value={selectedClip.posY ?? 75}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const newClips = clips.map((c) =>
                                      c.id === selectedClip.id ? { ...c, posY: val } : c
                                    );
                                    setClips(newClips);
                                  }}
                                />
                              </div>
                              <div className="pos-slider-group">
                                <span className="tiny-label">По горизонтали X ({selectedClip.posX ?? 50}%)</span>
                                <input
                                  type="range"
                                  min="10"
                                  max="90"
                                  value={selectedClip.posX ?? 50}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const newClips = clips.map((c) =>
                                      c.id === selectedClip.id ? { ...c, posX: val } : c
                                    );
                                    setClips(newClips);
                                  }}
                                />
                              </div>
                            </div>
                            <p className="interactive-move-hint">💡 Можно также зажать и перетаскивать текст прямо на мониторе просмотра!</p>
                          </div>

                          {/* 7. Text Color */}
                          <div className="inspector-form-field">
                            <label className="sub-label">Цвет текста</label>
                            <div className="text-color-swatches">
                              {TEXT_COLORS.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  className={`color-swatch ${(selectedClip.textColor || '#FFFFFF') === c ? 'active' : ''}`}
                                  style={{ backgroundColor: c }}
                                  onClick={() => {
                                    const newClips = clips.map((cl) =>
                                      cl.id === selectedClip.id ? { ...cl, textColor: c } : cl
                                    );
                                    setClips(newClips);
                                    pushHistory(newClips);
                                  }}
                                />
                              ))}
                              <input
                                type="color"
                                className="custom-color-picker"
                                value={selectedClip.textColor || '#FFFFFF'}
                                title="Свой цвет"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newClips = clips.map((cl) =>
                                    cl.id === selectedClip.id ? { ...cl, textColor: val } : cl
                                  );
                                  setClips(newClips);
                                }}
                              />
                            </div>
                          </div>

                          {/* 8. Background Plaque / Pill */}
                          <div className="inspector-form-field">
                            <label className="sub-label">Подложка (Фоновая плашка)</label>
                            <div className="bg-preset-pills">
                              {BG_PRESETS.map((b) => (
                                <button
                                  key={b.id}
                                  type="button"
                                  className={`bg-pill ${(selectedClip.bgColor || 'transparent') === b.id ? 'active' : ''}`}
                                  onClick={() => {
                                    const newClips = clips.map((cl) =>
                                      cl.id === selectedClip.id ? { ...cl, bgColor: b.id } : cl
                                    );
                                    setClips(newClips);
                                    pushHistory(newClips);
                                  }}
                                >
                                  {b.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 9. Effects: Shadow & Stroke */}
                          <div className="inspector-form-field">
                            <label className="sub-label">Эффекты оформления</label>
                            <div className="effects-checkbox-row">
                              <label className="effect-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={selectedClip.hasShadow !== false}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    const newClips = clips.map((cl) =>
                                      cl.id === selectedClip.id ? { ...cl, hasShadow: val } : cl
                                    );
                                    setClips(newClips);
                                    pushHistory(newClips);
                                  }}
                                />
                                <span>Тень (Drop Shadow)</span>
                              </label>

                              <label className="effect-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={Boolean(selectedClip.hasStroke)}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    const newClips = clips.map((cl) =>
                                      cl.id === selectedClip.id ? { ...cl, hasStroke: val } : cl
                                    );
                                    setClips(newClips);
                                    pushHistory(newClips);
                                  }}
                                />
                                <span>Чёрная обводка (Outline)</span>
                              </label>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* If Audio / Music Clip */}
                      {(selectedClip.type === 'audio' || selectedClip.type === 'music') && (
                        <div className="audio-clip-editor-sub">
                          <div className="inspector-slider-row" style={{ marginTop: 8 }}>
                            <div className="slider-label-line">
                              <span>Громкость дорожки</span>
                              <strong>{selectedClip.volume || 80}%</strong>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={selectedClip.volume || 80}
                              onChange={(e) => {
                                const newClips = clips.map((c) =>
                                  c.id === selectedClip.id ? { ...c, volume: Number(e.target.value) } : c
                                );
                                setClips(newClips);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-clip-selected-hint">
                      <Film size={28} />
                      <p>Выберите любой клип на таймлайне для редактирования его параметров, нарезки или перемещения.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Color Grading */}
              {inspectorTab === 'color' && (
                <div className="inspector-section color-section">
                  <h4 className="inspector-h4">Цветокоррекция (Color Grading & LUTs)</h4>
                  
                  <div className="lut-presets-grid">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        className={`lut-card ${selectedFilter === p.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedFilter(p.id);
                          if (selectedClip && selectedClip.type === 'video') {
                            setClips((prev) =>
                              prev.map((c) => (c.id === selectedClip.id ? { ...c, filter: p.id } : c))
                            );
                          }
                        }}
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
                      max="140" 
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
                      max="160" 
                      value={saturation} 
                      onChange={(e) => setSaturation(Number(e.target.value))} 
                    />
                  </div>
                </div>
              )}

              {/* Tab: Audio & Sound */}
              {inspectorTab === 'audio' && (
                <div className="inspector-section audio-section">
                  <h4 className="inspector-h4">Библиотека звуков & музыки</h4>
                  <div className="audio-selector-list">
                    {MUSIC_TRACKS.map((track) => (
                      <div 
                        key={track.id}
                        className="audio-track-item"
                        onClick={() => handleAddMusicClip(track)}
                      >
                        <div className="track-icon">
                          <Music size={14} />
                        </div>
                        <div className="track-meta">
                          <div className="track-title">{track.title}</div>
                          <div className="track-artist">{track.artist} • {track.duration}</div>
                        </div>
                        <button className="track-pick-btn">
                          + На таймлайн
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="inspector-slider-row" style={{ marginTop: 14 }}>
                    <div className="slider-label-line">
                      <span>Мастер-громкость</span>
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
                  <h4 className="inspector-h4">Добавление титров (Fusion Titles)</h4>
                  <button className="btn-inspector-blade" onClick={handleAddTextClip}>
                    <Plus size={15} /> Вставить новый титр на {formatSMPTE(currentTime)}
                  </button>

                  <h5 className="inspector-h5" style={{ marginTop: 14 }}>Список титров на V2:</h5>
                  <div className="inspector-clips-list">
                    {clips.filter((c) => c.trackId === 'v2').map((clip) => (
                      <div 
                        key={clip.id} 
                        className={`inspector-clip-row ${selectedClipId === clip.id ? 'active' : ''}`}
                        onClick={() => setSelectedClipId(clip.id)}
                      >
                        <div className="clip-row-info">
                          <strong>{clip.text || clip.name}</strong>
                          <span>{clip.start.toFixed(1)}с – {(clip.start + clip.duration).toFixed(1)}с</span>
                        </div>
                        <button 
                          className="btn-trash-clip" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClip(clip.id);
                          }}
                          title="Удалить титр"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Effects & Blade List */}
              {inspectorTab === 'effects' && (
                <div className="inspector-section effects-section">
                  <h4 className="inspector-h4">Инструменты лезвия (Blade & Cut)</h4>
                  <p className="inspector-hint">
                    Выберите клип на дорожке или переместите красный Playhead на нужный кадр и нажмите «Разрезать».
                  </p>
                  <button className="btn-inspector-blade" onClick={handleSplitAtPlayhead}>
                    <Scissors size={15} /> Разрезать клип на {formatSMPTE(currentTime)}
                  </button>

                  <h5 className="inspector-h5" style={{ marginTop: 16 }}>Все фрагменты на таймлайне:</h5>
                  <div className="inspector-clips-list">
                    {clips.map((clip) => (
                      <div 
                        key={clip.id} 
                        className={`inspector-clip-row ${selectedClipId === clip.id ? 'active' : ''}`}
                        onClick={() => setSelectedClipId(clip.id)}
                      >
                        <div className="clip-row-info">
                          <strong>[{clip.trackId.toUpperCase()}] {clip.name}</strong>
                          <span>{clip.start.toFixed(1)}с – {(clip.start + clip.duration).toFixed(1)}с ({clip.duration.toFixed(1)}с)</span>
                        </div>
                        <button 
                          className="btn-trash-clip" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClip(clip.id);
                          }}
                          disabled={clips.length <= 1}
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
            title="Стрелка выбора и перемещения (A)"
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
            onClick={() => setActiveTool(activeTool === 'blade' ? 'select' : 'blade')}
            title="Лезвие / Разрезка клипов (B)"
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
            onClick={handleSplitAtPlayhead}
            title="Быстрый разрез по Playhead (Ctrl+B)"
          >
            <Scissors size={14} style={{ color: '#ef4444' }} />
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

        {/* Right: SMPTE Timecode, Zoom Scale, Speed, Audio Monitor */}
        <div className="transport-timecode-cluster">
          {/* Zoom controls */}
          <div className="timeline-zoom-controls">
            <button
              className="zoom-btn"
              onClick={() => setZoomScale((z) => Math.max(1, z - 0.25))}
              title="Уменьшить масштаб шкалы"
            >
              <ZoomOut size={13} />
            </button>
            <span className="zoom-label">{Math.round(zoomScale * 100)}%</span>
            <button
              className="zoom-btn"
              onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.25))}
              title="Увеличить масштаб шкалы"
            >
              <ZoomIn size={13} />
            </button>
          </div>

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
            <div className="audio-db-meter">
              <span className={`db-bar ${volume > 30 ? 'lit' : ''}`} />
              <span className={`db-bar ${volume > 60 ? 'lit' : ''}`} />
              <span className={`db-bar ${volume > 85 ? 'lit-amber' : ''}`} />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Professional Multi-Track Timeline */}
      <div className="davinci-timeline-workstation" ref={timelineScrollRef}>
        
        {/* Timeline Header Ruler Toolbar */}
        <div className="timeline-header-ruler-row">
          <div className="tracks-header-title-plate">
            <span>ТРЕКИ МОНТАЖА</span>
          </div>

          {/* SMPTE Time Ruler */}
          <div 
            className="timeline-time-ruler"
            style={{ width: `${zoomScale * 100}%` }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              setCurrentTime(Math.round(ratio * totalDuration * 10) / 10);
            }}
          >
            {Array.from({ length: totalDuration + 1 }).map((_, i) => (
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
        <div className="timeline-tracks-body" ref={timelineLanesRef} style={{ width: `${zoomScale * 100}%` }}>
          
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
                  className="plate-btn btn-quick-add"
                  onClick={handleAddTextClip}
                  title="Добавить новый титр на V2"
                >
                  <Plus size={11} />
                </button>
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
              {v2Visible && clips.filter((c) => c.trackId === 'v2').map((clip) => {
                const leftPercent = (clip.start / totalDuration) * 100;
                const widthPercent = (clip.duration / totalDuration) * 100;
                const isSelected = selectedClipId === clip.id;
                const isDragging = dragState?.clipId === clip.id;

                return (
                  <div 
                    key={clip.id}
                    className={`timeline-clip-item text-clip ${isSelected ? 'selected' : ''} ${isDragging ? 'is-dragging' : ''} ${activeTool === 'blade' ? 'blade-mode' : ''}`}
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    onMouseDown={(e) => !v2Locked && handleStartDrag(e, clip, 'move')}
                    onMouseMove={(e) => handleClipMouseMove(e, clip)}
                    onMouseLeave={handleClipMouseLeave}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClipId(clip.id);
                      setInspectorTab('clip');
                    }}
                  >
                    <Type size={12} className="clip-icon" />
                    <span className="clip-label-text">{clip.text || clip.name}</span>
                    
                    {/* Trim Handles */}
                    {!v2Locked && (
                      <>
                        <div 
                          className="trim-handle-l" 
                          onMouseDown={(e) => handleStartDrag(e, clip, 'trim-start')}
                          title="Трим начала"
                        />
                        <div 
                          className="trim-handle-r" 
                          onMouseDown={(e) => handleStartDrag(e, clip, 'trim-end')}
                          title="Трим конца"
                        />
                      </>
                    )}

                    {/* Blade cut preview line */}
                    {bladeHover && bladeHover.clipId === clip.id && (
                      <div className="blade-cut-indicator" style={{ left: `${bladeHover.percent}%` }}>
                        <span className="blade-time-tag">{formatSMPTE(bladeHover.time)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 2: V1 (Видео) */}
          <div className="timeline-lane-row track-v1">
            <div className="lane-header-plate">
              <div className="plate-track-id">V1</div>
              <div className="plate-track-name">Видео ({aspectRatio})</div>
              <div className="plate-actions">
                <button 
                  className="plate-btn btn-quick-add"
                  onClick={() => handleAddMediaToTimeline(selectedSourceMedia)}
                  title="Добавить клип из медиатеки на V1"
                >
                  <Plus size={11} />
                </button>
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
              {v1Visible && clips.filter((c) => c.trackId === 'v1').map((clip) => {
                const leftPercent = (clip.start / totalDuration) * 100;
                const widthPercent = (clip.duration / totalDuration) * 100;
                const isSelected = selectedClipId === clip.id;
                const isDragging = dragState?.clipId === clip.id;

                return (
                  <div
                    key={clip.id}
                    className={`timeline-clip-item video-clip ${isSelected ? 'selected' : ''} ${isDragging ? 'is-dragging' : ''} ${activeTool === 'blade' ? 'blade-mode' : ''}`}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: clip.color
                    }}
                    onMouseDown={(e) => !v1Locked && handleStartDrag(e, clip, 'move')}
                    onMouseMove={(e) => handleClipMouseMove(e, clip)}
                    onMouseLeave={handleClipMouseLeave}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClipId(clip.id);
                      setInspectorTab('clip');
                    }}
                  >
                    <div className="clip-filmstrip-thumbs">
                      {clip.thumb && <img src={clip.thumb} alt={clip.name} />}
                      {clip.thumb && <img src={clip.thumb} alt={clip.name} />}
                    </div>
                    <div className="clip-info-strip">
                      <Film size={12} />
                      <span className="clip-label-text">{clip.name}</span>
                    </div>

                    {/* Trim Handles */}
                    {!v1Locked && (
                      <>
                        <div 
                          className="trim-handle-l" 
                          onMouseDown={(e) => handleStartDrag(e, clip, 'trim-start')}
                          title="Трим начала"
                        />
                        <div 
                          className="trim-handle-r" 
                          onMouseDown={(e) => handleStartDrag(e, clip, 'trim-end')}
                          title="Трим конца"
                        />
                      </>
                    )}

                    {/* Blade cut preview line */}
                    {bladeHover && bladeHover.clipId === clip.id && (
                      <div className="blade-cut-indicator" style={{ left: `${bladeHover.percent}%` }}>
                        <span className="blade-time-tag">{formatSMPTE(bladeHover.time)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 3: A1 (Основное аудио клипов) */}
          <div className="timeline-lane-row track-a1">
            <div className="lane-header-plate">
              <div className="plate-track-id">A1</div>
              <div className="plate-track-name">Звук видео</div>
              <div className="plate-actions">
                <button 
                  className="plate-btn btn-quick-add"
                  onClick={handleAddAudioClip}
                  title="Добавить дорожку эффектов на A1"
                >
                  <Plus size={11} />
                </button>
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
              {!a1Muted && clips.filter((c) => c.trackId === 'a1').map((clip) => {
                const leftPercent = (clip.start / totalDuration) * 100;
                const widthPercent = (clip.duration / totalDuration) * 100;
                const isSelected = selectedClipId === clip.id;
                const isDragging = dragState?.clipId === clip.id;

                return (
                  <div 
                    key={clip.id}
                    className={`timeline-clip-item audio-primary-clip ${isSelected ? 'selected' : ''} ${isDragging ? 'is-dragging' : ''} ${activeTool === 'blade' ? 'blade-mode' : ''}`}
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    onMouseDown={(e) => handleStartDrag(e, clip, 'move')}
                    onMouseMove={(e) => handleClipMouseMove(e, clip)}
                    onMouseLeave={handleClipMouseLeave}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClipId(clip.id);
                      setInspectorTab('clip');
                    }}
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
                    </div>
                    <span className="clip-label-text">{clip.name}</span>

                    {/* Trim Handles */}
                    <div 
                      className="trim-handle-l" 
                      onMouseDown={(e) => handleStartDrag(e, clip, 'trim-start')}
                      title="Трим начала"
                    />
                    <div 
                      className="trim-handle-r" 
                      onMouseDown={(e) => handleStartDrag(e, clip, 'trim-end')}
                      title="Трим конца"
                    />

                    {/* Blade cut preview line */}
                    {bladeHover && bladeHover.clipId === clip.id && (
                      <div className="blade-cut-indicator" style={{ left: `${bladeHover.percent}%` }}>
                        <span className="blade-time-tag">{formatSMPTE(bladeHover.time)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 4: A2 (Фоновая музыка) */}
          <div className="timeline-lane-row track-a2">
            <div className="lane-header-plate">
              <div className="plate-track-id">A2</div>
              <div className="plate-track-name">Музыка</div>
              <div className="plate-actions">
                <button 
                  className="plate-btn btn-quick-add"
                  onClick={() => handleAddMusicClip(MUSIC_TRACKS[0])}
                  title="Добавить музыку на A2"
                >
                  <Plus size={11} />
                </button>
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
              {!a2Muted && clips.filter((c) => c.trackId === 'a2').map((clip) => {
                const leftPercent = (clip.start / totalDuration) * 100;
                const widthPercent = (clip.duration / totalDuration) * 100;
                const isSelected = selectedClipId === clip.id;
                const isDragging = dragState?.clipId === clip.id;

                return (
                  <div 
                    key={clip.id}
                    className={`timeline-clip-item music-clip ${isSelected ? 'selected' : ''} ${isDragging ? 'is-dragging' : ''} ${activeTool === 'blade' ? 'blade-mode' : ''}`}
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    onMouseDown={(e) => handleStartDrag(e, clip, 'move')}
                    onMouseMove={(e) => handleClipMouseMove(e, clip)}
                    onMouseLeave={handleClipMouseLeave}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClipId(clip.id);
                      setInspectorTab('clip');
                    }}
                  >
                    <Music size={12} className="clip-icon" />
                    <span className="clip-label-text">♫ {clip.name}</span>
                    <div className="audio-waveform-svg music-wave">
                      <span className="wave-stem h-60" />
                      <span className="wave-stem h-90" />
                      <span className="wave-stem h-70" />
                      <span className="wave-stem h-85" />
                      <span className="wave-stem h-55" />
                      <span className="wave-stem h-95" />
                      <span className="wave-stem h-65" />
                    </div>

                    {/* Trim Handles */}
                    <div 
                      className="trim-handle-l" 
                      onMouseDown={(e) => handleStartDrag(e, clip, 'trim-start')}
                      title="Трим начала"
                    />
                    <div 
                      className="trim-handle-r" 
                      onMouseDown={(e) => handleStartDrag(e, clip, 'trim-end')}
                      title="Трим конца"
                    />

                    {/* Blade cut preview line */}
                    {bladeHover && bladeHover.clipId === clip.id && (
                      <div className="blade-cut-indicator" style={{ left: `${bladeHover.percent}%` }}>
                        <span className="blade-time-tag">{formatSMPTE(bladeHover.time)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
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

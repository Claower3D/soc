import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, 
  Monitor, MessageSquare, Users, Hand, Send,
  Copy, Check, Volume2, VolumeX, Disc, MessageCircle,
  Settings, Palette, Eraser, Trash2, Download, Maximize2, 
  Minimize2, ChevronLeft, ChevronRight, Upload, 
  X, AlertCircle, Sparkles, Presentation, Film
} from 'lucide-react';
import { initialConferenceMessages, currentUser, type User, type ConferenceMessage, type Conference } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { spiritualAudio } from '../utils/spiritualAudio';
import { 
  saveConferenceRecording, 
  saveConferenceGroupChat, 
  downloadRecordingFile, 
  extractVideoThumbnail,
  saveRecordingBlobToIDB,
  type ConferenceRecordingItem 
} from '../utils/conferenceManager';
import { api, resolveMediaUrl } from '../api';
import './CallGrid.css';

interface CallGridProps {
  participants: User[];
  conference?: Conference | null;
  onLeaveCall?: (savedRecording?: ConferenceRecordingItem) => void;
  onGoToChatGroup?: (chatId: string) => void;
}

export function CallGrid({ participants, conference, onLeaveCall, onGoToChatGroup }: CallGridProps) {
  const navigate = useNavigate();
  const { currentUser: authUser } = useAuth();
  const effectiveUser = authUser || currentUser;

  // Audio / Video Media states
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('me');
  const [audioTestPlaying, setAudioTestPlaying] = useState(false);

  // Screen Sharing states
  const [screenSharing, setScreenSharing] = useState(false);
  const [screenShareMode, setScreenShareMode] = useState<'screen' | 'whiteboard' | 'presentation' | 'media' | null>(null);
  const [isSharePickerOpen, setIsSharePickerOpen] = useState(false);
  const [screenAudioMuted, setScreenAudioMuted] = useState(false);
  const [screenTrackTitle, setScreenTrackTitle] = useState('Экран устройства');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);

  // Whiteboard states
  const [whiteboardTool, setWhiteboardTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [whiteboardColor, setWhiteboardColor] = useState('#0F172A');
  const [whiteboardLineWidth, setWhiteboardLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Presentation states
  const [currentSlide, setCurrentSlide] = useState(0);
  const [laserPointerActive, setLaserPointerActive] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [customSlideUrl, setCustomSlideUrl] = useState<string | null>(null);

  // Media share states
  const [mediaVideoUrl, setMediaVideoUrl] = useState<string>('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [, setIsMediaPlaying] = useState(false);
  const mediaVideoRef = useRef<HTMLVideoElement | null>(null);

  // Device settings states
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>('');
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);

  // Meeting & UI states
  const [handRaised, setHandRaised] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'users' | null>('chat');
  const [messages, setMessages] = useState<ConferenceMessage[]>(initialConferenceMessages);
  const [chatInput, setChatInput] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [callEndedModal, setCallEndedModal] = useState(false);
  const [savedRecordingData, setSavedRecordingData] = useState<ConferenceRecordingItem | null>(null);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const screenContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const firstCapturedFrameRef = useRef<string>('');
  const recordCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordAnimRef = useRef<number | null>(null);
  const recordSourceVideoRef = useRef<HTMLVideoElement | null>(null);

  const confTitle = conference?.title || 'Спринт-синк команды #104';
  const confCode = conference?.inviteCode || 'conf-892-xyt';

  // 8 Presentation Slides Data
  const slides = [
    {
      title: 'Экосистема New Age Unity: Архитектура',
      subtitle: 'React 19 + TypeScript + Go (Gin) + PostgreSQL',
      points: [
        'Единое высоконагруженное ядро на Go с пулом соединений к PostgreSQL',
        'Персистентное хранилище медиафайлов и видео (media_files)',
        'Клиентская часть на React 19 с оптимизированным SPA-роутингом',
        'Полная поддержка Android WebView и PWA-установки'
      ]
    },
    {
      title: 'Модуль Видеоконференций и звонков',
      subtitle: 'Звук высокой чёткости, микрофон и захват экрана',
      points: [
        'Полноценный захват экрана, окон приложений и вкладок браузера (getDisplayMedia)',
        'Интерактивная виртуальная доска (Whiteboard) для совместных зарисовок',
        'Слайд-презентации с лазерной указкой и загрузкой материалов',
        'Интеллектуальное шумоподавление и эхоподавление голоса'
      ]
    },
    {
      title: 'Интерактивная доска (Whiteboard)',
      subtitle: 'Инструмент визуализации и командной работы',
      points: [
        'Рисование ручкой, маркером и ластиком на векторном холсте',
        'Выбор толщины кисти и гармоничной палитры цветов',
        'Экспорт наработок в формате изображения высокого разрешения',
        'Быстрый сброс и очистка холста в один клик'
      ]
    },
    {
      title: 'Модуль Ленты и Публикаций',
      subtitle: 'Интеллектуальный ранжирующий алгоритм новостей',
      points: [
        'Публикации фото, видео, музыки и опросов',
        'Реакции, треды комментариев и закладки',
        'Режим «Оракул» с ИИ-помощником и анализом тем',
        'Мгновенный отклик ленты с оптимистичными обновлениями'
      ]
    },
    {
      title: 'Короткие вертикальные видео (Клипы)',
      subtitle: 'Reels и TikTok-формат с персистентным хранилищем',
      points: [
        'Мгновенная загрузка вертикальных видеороликов до 150МБ',
        'Потоковое воспроизведение видео через HTTP Range (206 Partial Content)',
        'Удобная навигация: свайп, переход по звуку, комментарии',
        'Центральная кнопка создания клипа в мобильной панели'
      ]
    },
    {
      title: 'Telegram-стиль Мессенджер',
      subtitle: 'Чаты, каналы, папки и голосовые сообщения',
      points: [
        'Сквозное шифрование и защищенная передача сообщений',
        'Запись и воспроизведение голосовых сообщений со спектрограммой',
        'Автосоздание групп конференций и прикрепление записей',
        'Управление папками: Личные, Группы, Каналы, Боты'
      ]
    },
    {
      title: 'Маркетплейс и Доставка еды',
      subtitle: 'Встроенная электронная коммерция',
      points: [
        'Каталог товаров с фильтрацией, корзиной и оформлением заказов',
        'Рестораны, блюда и отслеживание статуса доставки курьером',
        'Безопасная оплата через внутренний кошелек или карты',
        'Отзывы покупателей с рейтингом и фотографиями'
      ]
    },
    {
      title: 'Безопасность и Верификация',
      subtitle: 'Паспортные данные и защита аккаунтов',
      points: [
        'Юридическая ответственность и привязка паспортных данных',
        'Двухфакторная авторизация и управление сессиями устройств',
        'Ролевая модель: Пользователь, Бизнес, Эксперт, Администратор',
        'Резервное копирование и защита персональных данных'
      ]
    }
  ];

  // Helper: setup Web Audio API analyser to measure microphone volume & detect speaking
  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      if (stream.getAudioTracks().length === 0) return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch (_) {}
      }

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));

        setAudioVolume(normalized);
        const speaking = normalized > 14;
        setIsLocalSpeaking(speaking);
        if (speaking) {
          setActiveSpeakerId('me');
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('Audio analyser setup error:', err);
    }
  }, []);

  // Enumerate input and output devices
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputs(devices.filter(d => d.kind === 'audioinput'));
      setAudioOutputs(devices.filter(d => d.kind === 'audiooutput'));
      setVideoInputs(devices.filter(d => d.kind === 'videoinput'));
    } catch (e) {
      console.warn('Device enumeration failed:', e);
    }
  }, []);

  // Draw current live conference state to offscreen recording canvas
  const drawConferenceFrame = useCallback(() => {
    let canvas = recordCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      recordCanvasRef.current = canvas;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Screen sharing
    if (screenShareMode === 'screen' && screenVideoRef.current && screenVideoRef.current.videoWidth > 0) {
      try {
        ctx.drawImage(screenVideoRef.current, 0, 0, 1280, 720);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.beginPath();
        ctx.roundRect(24, 24, 280, 40, 20);
        ctx.fill();
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(44, 44, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 15px Inter, sans-serif';
        ctx.fillText(`REC · ${confTitle.slice(0, 22)}`, 60, 49);
        return;
      } catch (_) {}
    }

    // 2. Presentation Slides
    if (screenShareMode === 'presentation') {
      const slide = slides[currentSlide] || slides[0];
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, '#0B0F19');
      grad.addColorStop(1, '#1E1B4B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, 1200, 640);

      ctx.fillStyle = '#818CF8';
      ctx.font = '600 18px Inter, sans-serif';
      ctx.fillText(`СЛАЙД ${currentSlide + 1} ИЗ ${slides.length} · ${confTitle}`, 70, 95);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.fillText(slide.title, 70, 165);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 22px Inter, sans-serif';
      ctx.fillText(slide.subtitle, 70, 215);

      slide.points.forEach((pt, i) => {
        const y = 300 + i * 55;
        ctx.fillStyle = '#6366F1';
        ctx.beginPath();
        ctx.arc(80, y - 7, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '500 20px Inter, sans-serif';
        ctx.fillText(pt, 105, y);
      });
      return;
    }

    // 3. Interactive Whiteboard
    if (screenShareMode === 'whiteboard' && canvasRef.current) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1280, 720);
      try {
        ctx.drawImage(canvasRef.current, 40, 10, 1200, 700);
      } catch (_) {}
      return;
    }

    // 4. Custom Video Share
    if (screenShareMode === 'media' && mediaVideoRef.current && mediaVideoRef.current.videoWidth > 0) {
      try {
        ctx.drawImage(mediaVideoRef.current, 0, 0, 1280, 720);
        return;
      } catch (_) {}
    }

    // 5. Active Camera Video
    const camElement = (recordSourceVideoRef.current && recordSourceVideoRef.current.videoWidth > 0)
      ? recordSourceVideoRef.current
      : (localVideoRef.current && localVideoRef.current.videoWidth > 0) ? localVideoRef.current : null;

    if (videoOn && camElement) {
      try {
        const vw = camElement.videoWidth;
        const vh = camElement.videoHeight;
        const scale = Math.max(1280 / vw, 720 / vh);
        const nw = vw * scale;
        const nh = vh * scale;
        const ox = (1280 - nw) / 2;
        const oy = (720 - nh) / 2;
        ctx.drawImage(camElement, ox, oy, nw, nh);

        // Header REC badge overlay
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(30, 30, 320, 46, 23);
        ctx.fill();

        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(52, 53, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText(`REC · ${confTitle.slice(0, 22)}`, 68, 59);
        return;
      } catch (_) {}
    }

    // 6. Camera is OFF or audio-only: Render vibrant, beautiful animated meeting stage
    const bgGrad = ctx.createLinearGradient(0, 0, 1280, 720);
    bgGrad.addColorStop(0, '#0F172A');
    bgGrad.addColorStop(0.5, '#1E1B4B');
    bgGrad.addColorStop(1, '#312E81');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Decorative ambient grid / glow
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.beginPath();
    ctx.arc(640, 310, 260, 0, Math.PI * 2);
    ctx.fill();

    // Pulse wave rings when speaking
    const pulseIntensity = Math.min(1, Math.max(0.1, (audioVolume || 0) / 50));
    const isSpeakingNow = micOn && (isLocalSpeaking || (audioVolume || 0) > 6);

    if (isSpeakingNow) {
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 + pulseIntensity * 0.5})`;
      ctx.lineWidth = 4 + pulseIntensity * 6;
      ctx.beginPath();
      ctx.arc(640, 300, 110 + pulseIntensity * 30, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(129, 140, 248, ${0.3 + pulseIntensity * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(640, 300, 140 + pulseIntensity * 45, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Speaker avatar circle with bright gradient
    const avGrad = ctx.createLinearGradient(540, 200, 740, 400);
    avGrad.addColorStop(0, '#4F46E5');
    avGrad.addColorStop(1, '#7C3AED');
    ctx.fillStyle = avGrad;
    ctx.beginPath();
    ctx.arc(640, 300, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isSpeakingNow ? '#10B981' : '#A78BFA';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Speaker initial
    const nameStr = effectiveUser?.name || 'Пользователь';
    const initialChar = nameStr.charAt(0).toUpperCase();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 64px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initialChar, 640, 300);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // Speaker name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText(nameStr, 640, 440);

    // Speaking badge / status
    ctx.fillStyle = isSpeakingNow ? '#34D399' : '#C7D2FE';
    ctx.font = '600 18px Inter, sans-serif';
    ctx.fillText(isSpeakingNow ? '🎙 Говорит сейчас...' : 'Микрофон включен · В эфире', 640, 475);

    // Dynamic audio equalizer bars under the avatar
    const barCount = 18;
    const barWidth = 6;
    const barGap = 8;
    const totalBarsWidth = barCount * barWidth + (barCount - 1) * barGap;
    const startX = 640 - totalBarsWidth / 2;
    for (let b = 0; b < barCount; b++) {
      const freq = Math.sin((Date.now() / 200) + b * 0.5);
      const h = isSpeakingNow ? Math.max(6, Math.abs(freq) * (20 + pulseIntensity * 30)) : 4;
      ctx.fillStyle = isSpeakingNow ? '#34D399' : '#818CF8';
      ctx.beginPath();
      ctx.roundRect(startX + b * (barWidth + barGap), 520 - h / 2, barWidth, h, 3);
      ctx.fill();
    }

    // Header bar overlay
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(40, 35, 380, 48, 24);
    ctx.fill();

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(65, 59, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(`REC · ${confTitle.slice(0, 26)}`, 84, 65);
  }, [screenShareMode, videoOn, slides, currentSlide, confTitle, audioVolume, micOn, isLocalSpeaking, effectiveUser]);

  // Continuous animation loop for conference recording canvas
  useEffect(() => {
    let animId: number;
    const loop = () => {
      drawConferenceFrame();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    recordAnimRef.current = animId;
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [drawConferenceFrame]);

  // Start recording conference stream with guaranteed video track
  const startCallRecording = useCallback((stream?: MediaStream | null) => {
    try {
      if (typeof MediaRecorder === 'undefined') return;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') return;

      let canvas = recordCanvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        recordCanvasRef.current = canvas;
      }

      // Draw initial frame immediately
      drawConferenceFrame();

      let recordingStream: MediaStream;
      if (typeof (canvas as any).captureStream === 'function') {
        const canvasStream = (canvas as any).captureStream(25);
        const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
        if (stream) {
          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length > 0) {
            tracks.push(audioTracks[0]);
          }
        }
        recordingStream = new MediaStream(tracks);
      } else if (stream) {
        recordingStream = stream;
      } else {
        return;
      }

      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }
      const options = selectedMime ? { mimeType: selectedMime } : undefined;
      const recorder = new MediaRecorder(recordingStream, options);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.warn('MediaRecorder start notice:', err);
    }
  }, [drawConferenceFrame]);

  const stopCallRecording = useCallback((): Promise<{ blob: Blob | null; url: string }> => {
    return new Promise((resolve) => {
      const fallbackUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      const recorder = mediaRecorderRef.current;
      if (recordAnimRef.current) {
        cancelAnimationFrame(recordAnimRef.current);
      }
      if (recorder && recorder.state !== 'inactive') {
        try {
          if (recorder.state === 'recording') {
            recorder.requestData();
          }
        } catch (_) {}
        recorder.onstop = () => {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
            const url = URL.createObjectURL(blob);
            resolve({ blob, url });
          } else {
            resolve({ blob: null, url: fallbackUrl });
          }
        };
        try {
          recorder.stop();
        } catch (_) {
          resolve({ blob: null, url: fallbackUrl });
        }
      } else {
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          resolve({ blob, url });
        } else {
          resolve({ blob: null, url: fallbackUrl });
        }
      }
    });
  }, []);

  // WebRTC UserMedia (Microphone + Camera) initialization
  useEffect(() => {
    let active = true;

    async function initUserMedia() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('getUserMedia not supported in this browser environment');
          startCallRecording(null);
          return;
        }

        await refreshDevices();

        const constraints: MediaStreamConstraints = {
          audio: {
            echoCancellation: echoCancellation,
            noiseSuppression: noiseSuppression,
            autoGainControl: true,
            ...(selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : {})
          },
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
            ...(selectedVideoInput ? { deviceId: { exact: selectedVideoInput } } : {})
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        if (recordSourceVideoRef.current) {
          recordSourceVideoRef.current.srcObject = stream;
          recordSourceVideoRef.current.play().catch(console.warn);
        }

        setupAudioAnalyser(stream);
        startCallRecording(stream);
        await refreshDevices();
      } catch (err) {
        console.warn('getUserMedia camera+mic failed, trying audio-only:', err);
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true }
          });
          if (!active) {
            audioOnly.getTracks().forEach(t => t.stop());
            return;
          }
          localStreamRef.current = audioOnly;
          setVideoOn(false);
          setupAudioAnalyser(audioOnly);
          startCallRecording(audioOnly);
          await refreshDevices();
        } catch (audioErr) {
          console.warn('Microphone permission denied or not available:', audioErr);
          if (active) {
            startCallRecording(null);
          }
        }
      }
    }

    initUserMedia();

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch (_) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (_) {}
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [setupAudioAnalyser, refreshDevices, echoCancellation, noiseSuppression, selectedAudioInput, selectedVideoInput, startCallRecording]);

  // Connect local video ref whenever videoOn or localStream updates
  useEffect(() => {
    if (videoOn && localStreamRef.current) {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(console.warn);
      }
      if (recordSourceVideoRef.current) {
        recordSourceVideoRef.current.srcObject = localStreamRef.current;
        recordSourceVideoRef.current.play().catch(console.warn);
      }
    }
  }, [videoOn]);

  // Connect screen video ref whenever screenStream updates
  useEffect(() => {
    if (screenShareMode === 'screen' && screenStreamRef.current && screenVideoRef.current) {
      screenVideoRef.current.muted = true;
      screenVideoRef.current.volume = 0;
      screenVideoRef.current.srcObject = screenStreamRef.current;
      screenVideoRef.current.play().catch(console.warn);
    }
  }, [screenShareMode]);

  // Early capture of the first video frame from conference recording canvas
  useEffect(() => {
    if (firstCapturedFrameRef.current) return;
    const interval = setInterval(() => {
      if (recordCanvasRef.current) {
        try {
          const frame = recordCanvasRef.current.toDataURL('image/jpeg', 0.85);
          if (frame && frame.length > 200) {
            firstCapturedFrameRef.current = frame;
            clearInterval(interval);
          }
        } catch (_) {}
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(d => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Speaker simulation for other participants
  useEffect(() => {
    const speakerTimer = setInterval(() => {
      if (!isLocalSpeaking) {
        const otherIds = participants.filter(p => p.id !== 'me' && p.id !== effectiveUser?.id).map(p => p.id);
        if (otherIds.length > 0) {
          const randomId = otherIds[Math.floor(Math.random() * otherIds.length)];
          setActiveSpeakerId(randomId);
        }
      }
    }, 6000);
    return () => clearInterval(speakerTimer);
  }, [isLocalSpeaking, participants, effectiveUser]);

  // Scroll chat
  useEffect(() => {
    if (activeSidePanel === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeSidePanel]);

  // Toggle Microphone
  const toggleMic = () => {
    const nextMic = !micOn;
    setMicOn(nextMic);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = nextMic;
      });
    }
    if (!nextMic) {
      setAudioVolume(0);
      setIsLocalSpeaking(false);
    }
  };

  // Toggle Camera
  const toggleVideo = async () => {
    const nextVideo = !videoOn;
    setVideoOn(nextVideo);
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
          track.enabled = nextVideo;
        });
      } else if (nextVideo) {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: selectedVideoInput ? { deviceId: { exact: selectedVideoInput } } : true
          });
          const newTrack = newStream.getVideoTracks()[0];
          localStreamRef.current.addTrack(newTrack);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            localVideoRef.current.play().catch(console.warn);
          }
        } catch (err) {
          console.warn('Failed to start webcam track:', err);
          setVideoOn(false);
        }
      }
    }
  };

  // Stop screen sharing cleanly
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setScreenSharing(false);
    setScreenShareMode(null);
    setScreenShareError(null);
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
  }, []);

  // Real System Screen Capture (Desktop, Window, Browser Tab with Audio)
  const startSystemScreenShare = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setScreenShareError('Ваш браузер или устройство не поддерживает прямой захват экрана. Доступна Интерактивная доска или Слайды.');
        setScreenShareMode('whiteboard');
        setScreenSharing(true);
        setIsSharePickerOpen(false);
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          frameRate: { ideal: 30, max: 60 }
        } as unknown as MediaTrackConstraints,
        audio: true
      });

      screenStreamRef.current = stream;
      setScreenSharing(true);
      setScreenShareMode('screen');
      setIsSharePickerOpen(false);
      setScreenShareError(null);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        setScreenTrackTitle(videoTrack.label || 'Экран устройства / Окно');
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

      setTimeout(() => {
        if (screenVideoRef.current) {
          screenVideoRef.current.muted = true;
          screenVideoRef.current.volume = 0;
          screenVideoRef.current.srcObject = stream;
          screenVideoRef.current.play().catch(console.warn);
        }
      }, 100);
    } catch (err: unknown) {
      console.warn('Screen share error or dismissed:', err);
      const errorObj = err as { name?: string; message?: string };
      if (errorObj?.name !== 'NotAllowedError') {
        setScreenShareError('Не удалось начать демонстрацию экрана: ' + (errorObj?.message || 'Доступ отклонен'));
      }
    }
  };

  // Start selected screen share mode
  const handleSelectShareMode = (mode: 'screen' | 'whiteboard' | 'presentation' | 'media') => {
    if (mode === 'screen') {
      startSystemScreenShare();
    } else {
      setScreenShareMode(mode);
      setScreenSharing(true);
      setIsSharePickerOpen(false);
      setScreenShareError(null);
    }
  };

  // Toggle Screen Audio transmission (for call participants & recording; presenter preview is always local-muted)
  const toggleScreenAudio = () => {
    setScreenAudioMuted(prev => {
      const next = !prev;
      if (screenStreamRef.current) {
        screenStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !next;
        });
      }
      return next;
    });
  };

  // Toggle Fullscreen on Screen Share
  const toggleFullscreen = () => {
    if (!screenContainerRef.current) return;
    if (!document.fullscreenElement) {
      screenContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.warn);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.warn);
    }
  };

  // Test Speaker Sound
  const handleTestSpeakerSound = () => {
    setAudioTestPlaying(true);
    spiritualAudio.playCrystalChime();
    setTimeout(() => {
      setAudioTestPlaying(false);
    }, 2000);
  };

  // Switch Audio Output (if supported by browser)
  const handleSelectAudioOutput = async (deviceId: string) => {
    setSelectedAudioOutput(deviceId);
    if (screenVideoRef.current && 'setSinkId' in screenVideoRef.current) {
      try {
        await (screenVideoRef.current as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId(deviceId);
      } catch (e) {
        console.warn('setSinkId failed:', e);
      }
    }
  };

  // Whiteboard drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (whiteboardTool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = whiteboardLineWidth * 4;
    } else if (whiteboardTool === 'highlighter') {
      ctx.strokeStyle = whiteboardColor + '40'; // semi-transparent
      ctx.lineWidth = whiteboardLineWidth * 3;
    } else {
      ctx.strokeStyle = whiteboardColor;
      ctx.lineWidth = whiteboardLineWidth;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.closePath();
    }
    setIsDrawing(false);
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `whiteboard-${confCode}.png`;
    a.click();
  };

  // Upload custom presentation slide
  const handleUploadCustomSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomSlideUrl(url);
    }
  };

  // Upload custom video for media share
  const handleUploadCustomVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaVideoUrl(url);
      setIsMediaPlaying(true);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: ConferenceMessage = {
      id: `msg_${Date.now()}`,
      user: effectiveUser,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  const handleSendReaction = (emoji: string) => {
    setFloatingReaction(emoji);
    setTimeout(() => setFloatingReaction(null), 2500);
  };

  const handleCopyInvite = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEndCall = async () => {
    // 1. Capture the LAST frame directly from our live conference recording canvas
    let capturedLastFrame = '';
    if (recordCanvasRef.current) {
      try {
        capturedLastFrame = recordCanvasRef.current.toDataURL('image/jpeg', 0.85);
      } catch (_) {}
    }
    if (!capturedLastFrame) {
      const activeVideo = (screenVideoRef.current && screenVideoRef.current.videoWidth > 0)
        ? screenVideoRef.current
        : (localVideoRef.current && localVideoRef.current.videoWidth > 0)
          ? localVideoRef.current
          : (document.querySelector('.conference-app-container video') as HTMLVideoElement | null);

      if (activeVideo && activeVideo.videoWidth > 0 && activeVideo.videoHeight > 0) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = activeVideo.videoWidth;
          canvas.height = activeVideo.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);
            capturedLastFrame = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch (_) {}
      }
    }

    const { blob, url } = await stopCallRecording();
    const finalDuration = formatTime(callDuration);
    const recId = `rec_${Date.now()}`;
    const effectiveConf: Conference = conference || {
      id: `conf_${Date.now()}`,
      title: confTitle,
      inviteCode: confCode,
      isPrivate: false,
      host: effectiveUser,
      status: 'ended',
      participants: participants,
    };

    let finalVideoUrl = url;
    if (blob && blob.size > 0) {
      try {
        const uploadRes = await api.upload(blob, 'conferences', `conf_${effectiveConf.id || Date.now()}.webm`);
        if (uploadRes?.url) {
          finalVideoUrl = resolveMediaUrl(uploadRes.url);
        }
      } catch (uploadErr) {
        console.warn('⚠️ Ошибка фоновой загрузки видеозаписи на сервер:', uploadErr);
      }
      try {
        await saveRecordingBlobToIDB(recId, blob);
      } catch (_) {}
    }

    // 2. Extract the FIRST frame from the live snapshot or from recorded video
    let capturedFirstFrame = firstCapturedFrameRef.current;
    if (!capturedFirstFrame) {
      try {
        capturedFirstFrame = await extractVideoThumbnail(blob || finalVideoUrl, 'first');
      } catch (_) {}
    }

    // Genuine frame from the recorded video: prefer first frame, fallback to last frame
    const realVideoThumbnail = capturedFirstFrame || capturedLastFrame || '';

    const targetGroupId = effectiveConf.chatGroupId || (
      effectiveConf.id ? (effectiveConf.id.startsWith('group_') ? effectiveConf.id : `group_${effectiveConf.id}`) : `group_conf_${Date.now()}`
    );
    effectiveConf.chatGroupId = targetGroupId;

    const savedGroupId = saveConferenceGroupChat({
      conference: effectiveConf,
      duration: finalDuration,
      messages: messages,
      videoUrl: finalVideoUrl,
      thumbnail: realVideoThumbnail,
      currentUserId: effectiveUser?.id || 'me',
      hostUser: effectiveUser,
      recordingId: recId,
    });

    const recItem: ConferenceRecordingItem = {
      id: recId,
      title: confTitle,
      date: 'Сегодня, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: finalDuration,
      participantsCount: participants.length || 1,
      thumbnail: realVideoThumbnail,
      videoUrl: finalVideoUrl,
      chatGroupId: savedGroupId,
      conferenceId: effectiveConf.id,
      inviteCode: confCode,
    };

    saveConferenceRecording(recItem, blob || undefined);

    setSavedRecordingData(recItem);
    setCreatedGroupId(savedGroupId);
    setCallEndedModal(true);
  };

  return (
    <div className="conference-app-container">
      {/* Top Bar */}
      <div className="conf-top-bar">
        <div className="conf-meta-left">
          <span className="rec-badge"><span className="rec-dot" /> REC</span>
          <div className="conf-title-wrap">
            <span className="conf-title">{confTitle}</span>
            <span className="conf-id">
              {conference?.isPrivate ? '🔒 Закрытая (по ссылке)' : '🌐 Открытая'} · Код: {confCode}
            </span>
          </div>
        </div>

        <div className="conf-meta-center">
          <span className="conf-timer">{formatTime(callDuration)}</span>
        </div>

        <div className="conf-meta-right">
          <button className="conf-pill-btn" onClick={() => setIsSettingsModalOpen(true)} title="Настройки звука, микрофона и камеры">
            <Settings size={14} />
            <span>Оборудование</span>
          </button>
          <button className="conf-pill-btn" onClick={handleCopyInvite}>
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedLink ? 'Ссылка скопирована' : 'Поделиться ссылкой'}</span>
          </button>
          <span className="hd-badge">HD 1080p</span>
        </div>
      </div>

      {/* Main Stage */}
      <div className="conf-workspace">
        <div className="conf-stage">
          {/* Reaction Float */}
          {floatingReaction && (
            <div className="floating-reaction-bubble">
              {floatingReaction}
            </div>
          )}

          {/* Hand raised notice */}
          {handRaised && (
            <div className="hand-raised-banner">
              <Hand size={16} /> Вы подняли руку
            </div>
          )}

          {/* Screen Sharing Views */}
          {screenSharing ? (
            <div className="screen-share-view">
              {/* MODE 1: REAL SYSTEM SCREEN SHARE */}
              {screenShareMode === 'screen' && (
                <div className="screen-share-presentation">
                  <div className="presentation-header">
                    <div className="presentation-header-left">
                      <span className="live-share-badge"><span className="rec-dot" /> В ЭФИРЕ</span>
                      <Monitor size={18} />
                      <span>{screenTrackTitle}</span>
                    </div>
                    <div className="presentation-header-actions">
                      <button 
                        className="screen-header-btn" 
                        onClick={toggleScreenAudio} 
                        title={screenAudioMuted ? 'Включить трансляцию звука экрана для участников' : 'Выключить трансляцию звука экрана для участников'}
                      >
                        {screenAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                        <span>{screenAudioMuted ? 'Звук выкл' : 'Звук экрана'}</span>
                      </button>
                      <button className="screen-header-btn" onClick={toggleFullscreen} title="Во весь экран">
                        {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                        <span>{isFullscreen ? 'Свернуть' : 'Во весь экран'}</span>
                      </button>
                      <button className="screen-stop-btn" onClick={stopScreenShare}>
                        <PhoneOff size={15} />
                        <span>Остановить показ</span>
                      </button>
                    </div>
                  </div>

                  <div className="screen-video-container" ref={screenContainerRef}>
                    <video
                      ref={screenVideoRef}
                      autoPlay
                      playsInline
                      muted={true}
                      className="real-screen-video"
                    />
                    {screenShareError && (
                      <div className="screen-fallback-alert" style={{ position: 'absolute', background: 'rgba(239, 68, 68, 0.95)', color: 'white', padding: '1rem 1.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertCircle size={22} />
                        <span>{screenShareError}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODE 2: INTERACTIVE WHITEBOARD */}
              {screenShareMode === 'whiteboard' && (
                <div className="screen-share-presentation">
                  <div className="presentation-header">
                    <div className="presentation-header-left">
                      <span className="live-share-badge"><span className="rec-dot" /> ДОСКА</span>
                      <Palette size={18} />
                      <span>Интерактивная доска конференции</span>
                    </div>
                    <div className="presentation-header-actions">
                      <button className="screen-header-btn" onClick={clearWhiteboard} title="Очистить холст">
                        <Trash2 size={15} />
                        <span>Очистить</span>
                      </button>
                      <button className="screen-header-btn" onClick={downloadWhiteboard} title="Скачать рисунок">
                        <Download size={15} />
                        <span>Скачать PNG</span>
                      </button>
                      <button className="screen-stop-btn" onClick={stopScreenShare}>
                        <PhoneOff size={15} />
                        <span>Остановить показ</span>
                      </button>
                    </div>
                  </div>

                  <div className="whiteboard-stage-wrapper">
                    <div className="whiteboard-toolbar">
                      <div className="whiteboard-tools-group">
                        <button 
                          className={`whiteboard-tool-btn ${whiteboardTool === 'pen' ? 'active' : ''}`}
                          onClick={() => setWhiteboardTool('pen')}
                          title="Маркер / Ручка"
                        >
                          <Palette size={16} />
                        </button>
                        <button 
                          className={`whiteboard-tool-btn ${whiteboardTool === 'highlighter' ? 'active' : ''}`}
                          onClick={() => setWhiteboardTool('highlighter')}
                          title="Текстовыделитель"
                        >
                          <Sparkles size={16} />
                        </button>
                        <button 
                          className={`whiteboard-tool-btn ${whiteboardTool === 'eraser' ? 'active' : ''}`}
                          onClick={() => setWhiteboardTool('eraser')}
                          title="Ластик"
                        >
                          <Eraser size={16} />
                        </button>
                      </div>

                      <div className="whiteboard-colors-group">
                        {['#0F172A', '#6366F1', '#10B981', '#EF4444', '#F59E0B', '#3B82F6'].map(c => (
                          <span
                            key={c}
                            className={`whiteboard-color-dot ${whiteboardColor === c && whiteboardTool !== 'eraser' ? 'active' : ''}`}
                            style={{ background: c }}
                            onClick={() => { setWhiteboardColor(c); if (whiteboardTool === 'eraser') setWhiteboardTool('pen'); }}
                          />
                        ))}
                      </div>

                      <div className="whiteboard-tools-group">
                        <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Толщина:</span>
                        {[2, 5, 12, 22].map(w => (
                          <button
                            key={w}
                            className={`whiteboard-tool-btn ${whiteboardLineWidth === w ? 'active' : ''}`}
                            onClick={() => setWhiteboardLineWidth(w)}
                            style={{ fontSize: '0.74rem', fontWeight: 600 }}
                          >
                            {w}px
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="whiteboard-canvas-area">
                      <canvas
                        ref={canvasRef}
                        width={1200}
                        height={700}
                        className="whiteboard-canvas"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 3: INTERACTIVE PRESENTATION */}
              {screenShareMode === 'presentation' && (
                <div className="screen-share-presentation">
                  <div className="presentation-header">
                    <div className="presentation-header-left">
                      <span className="live-share-badge"><span className="rec-dot" /> СЛАЙДЫ</span>
                      <Presentation size={18} />
                      <span>{customSlideUrl ? 'Пользовательская презентация' : `Слайд ${currentSlide + 1} из ${slides.length}`}</span>
                    </div>
                    <div className="presentation-header-actions">
                      <label className="screen-header-btn" style={{ cursor: 'pointer' }} title="Загрузить свой слайд / изображение">
                        <Upload size={15} />
                        <span>Свой файл</span>
                        <input type="file" accept="image/*" onChange={handleUploadCustomSlide} style={{ display: 'none' }} />
                      </label>
                      <button 
                        className={`screen-header-btn ${laserPointerActive ? 'active' : ''}`}
                        onClick={() => setLaserPointerActive(!laserPointerActive)}
                        title="Лазерная указка"
                      >
                        <Sparkles size={15} />
                        <span>{laserPointerActive ? 'Указка: ВКЛ' : 'Указка'}</span>
                      </button>
                      <button className="screen-stop-btn" onClick={stopScreenShare}>
                        <PhoneOff size={15} />
                        <span>Остановить показ</span>
                      </button>
                    </div>
                  </div>

                  <div 
                    className="presentation-stage-wrapper"
                    onMouseMove={e => {
                      if (!laserPointerActive) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setLaserPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseLeave={() => setLaserPos(null)}
                  >
                    {laserPointerActive && laserPos && (
                      <div className="presentation-laser-pointer" style={{ left: laserPos.x, top: laserPos.y }} />
                    )}

                    <div className="presentation-slide-view">
                      {customSlideUrl ? (
                        <img src={customSlideUrl} alt="Пользовательский слайд" className="presentation-custom-img" />
                      ) : (
                        <div className="presentation-slide-card">
                          <span className="slide-badge">Слайд {currentSlide + 1} из {slides.length}</span>
                          <h2>{slides[currentSlide].title}</h2>
                          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                            {slides[currentSlide].subtitle}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {slides[currentSlide].points.map((pt, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.88rem', color: '#E2E8F0' }}>
                                <Check size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {!customSlideUrl && (
                      <div className="presentation-nav-controls">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            className="screen-header-btn"
                            onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
                            disabled={currentSlide === 0}
                          >
                            <ChevronLeft size={16} /> Назад
                          </button>
                          <button
                            className="screen-header-btn"
                            onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))}
                            disabled={currentSlide === slides.length - 1}
                          >
                            Вперед <ChevronRight size={16} />
                          </button>
                        </div>

                        <div className="presentation-thumbnails-strip">
                          {slides.map((_, i) => (
                            <button
                              key={i}
                              className={`slide-thumb-btn ${currentSlide === i ? 'active' : ''}`}
                              onClick={() => setCurrentSlide(i)}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODE 4: MEDIA / VIDEO DEMONSTRATION */}
              {screenShareMode === 'media' && (
                <div className="screen-share-presentation">
                  <div className="presentation-header">
                    <div className="presentation-header-left">
                      <span className="live-share-badge"><span className="rec-dot" /> МЕДИА</span>
                      <Film size={18} />
                      <span>Демонстрация видео со звуком</span>
                    </div>
                    <div className="presentation-header-actions">
                      <label className="screen-header-btn" style={{ cursor: 'pointer' }} title="Выбрать свой видеофайл">
                        <Upload size={15} />
                        <span>Выбрать видео</span>
                        <input type="file" accept="video/*" onChange={handleUploadCustomVideo} style={{ display: 'none' }} />
                      </label>
                      <button className="screen-stop-btn" onClick={stopScreenShare}>
                        <PhoneOff size={15} />
                        <span>Остановить показ</span>
                      </button>
                    </div>
                  </div>

                  <div className="media-share-wrapper">
                    <video
                      ref={mediaVideoRef}
                      src={mediaVideoUrl}
                      controls
                      autoPlay
                      playsInline
                      className="media-share-video"
                      onPlay={() => setIsMediaPlaying(true)}
                      onPause={() => setIsMediaPlaying(false)}
                    />
                  </div>
                </div>
              )}

              {/* Mini participants strip at bottom of screen share */}
              <div className="mini-participants-strip">
                {participants.slice(0, 5).map(p => {
                  const isMe = p.id === 'me' || p.id === effectiveUser?.id || p.username === effectiveUser?.username;
                  return (
                    <div key={p.id} className="mini-participant-tile">
                      {isMe && videoOn && localStreamRef.current ? (
                        <video ref={localVideoRef} autoPlay playsInline muted className="mini-live-video" />
                      ) : (
                        <img src={p.avatar || '/default-avatar.svg'} alt={p.name} />
                      )}
                      <span>{isMe ? 'Вы' : p.name.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Normal Video Grid View */
            <div className={`video-tiles-grid grid-count-${Math.min(participants.length, 6)}`}>
              {participants.map((p) => {
                const isMe = p.id === 'me' || p.id === effectiveUser?.id || p.username === effectiveUser?.username;
                const isSpeaking = isMe ? (micOn && isLocalSpeaking) : activeSpeakerId === p.id;
                const isVideoMuted = isMe ? !videoOn : false;
                const isAudioMuted = isMe ? !micOn : false;

                return (
                  <div 
                    key={p.id} 
                    className={`participant-video-tile ${isSpeaking ? 'speaking-active' : ''}`}
                  >
                    {isMe && videoOn && localStreamRef.current ? (
                      <div className="tile-video-stream">
                        <video ref={localVideoRef} autoPlay playsInline muted className="tile-live-video" />
                        <div className="tile-video-overlay" />
                      </div>
                    ) : isVideoMuted ? (
                      <div className="tile-avatar-placeholder">
                        <img src={p.avatar || '/default-avatar.svg'} alt={p.name} />
                      </div>
                    ) : (
                      <div className="tile-video-stream">
                        <img src={p.avatar || '/default-avatar.svg'} alt={p.name} className="tile-video-bg" />
                        <div className="tile-video-overlay" />
                      </div>
                    )}

                    {/* Top status */}
                    <div className="tile-top-status">
                      {isSpeaking && (
                        <span className="speaking-indicator">
                          <Volume2 size={13} /> Говорит
                        </span>
                      )}
                    </div>

                    {/* Bottom tag */}
                    <div className="tile-bottom-bar">
                      <span className="participant-name-tag">
                        {isMe ? `${effectiveUser?.name || 'Вы'} (Вы)` : p.name}
                      </span>
                      <div className="tile-audio-status" style={{ display: 'flex', alignItems: 'center' }}>
                        {isAudioMuted ? (
                          <MicOff size={14} className="mic-muted-icon" />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Mic size={14} className="mic-live-icon" />
                            {isMe && isLocalSpeaking && (
                              <div className="tile-mic-meter">
                                <span className="tile-mic-meter-bar" />
                                <span className="tile-mic-meter-bar" style={{ animationDelay: '0.15s' }} />
                                <span className="tile-mic-meter-bar" style={{ animationDelay: '0.3s' }} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side Panel (In-call Chat & Users) */}
        {activeSidePanel && (
          <aside className="conf-side-panel">
            <div className="side-panel-header">
              <div className="side-panel-tabs">
                <button
                  className={`panel-tab-btn ${activeSidePanel === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveSidePanel('chat')}
                >
                  <MessageSquare size={16} /> Чат ({messages.length})
                </button>
                <button
                  className={`panel-tab-btn ${activeSidePanel === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveSidePanel('users')}
                >
                  <Users size={16} /> Участники ({participants.length})
                </button>
              </div>
              <button className="panel-close-btn" onClick={() => setActiveSidePanel(null)}>
                &times;
              </button>
            </div>

            {/* CHAT TAB */}
            {activeSidePanel === 'chat' && (
              <div className="conf-chat-body">
                <div className="conf-messages-feed">
                  {messages.map(msg => {
                    const isFromMe = msg.user.id === 'me' || msg.user.id === effectiveUser?.id;
                    return (
                      <div key={msg.id} className={`conf-msg-item ${isFromMe ? 'from-me' : ''}`}>
                        <img src={msg.user.avatar || '/default-avatar.svg'} alt={msg.user.name} className="conf-msg-avatar" />
                        <div className="conf-msg-content">
                          <div className="conf-msg-header">
                            <span className="conf-msg-author">{isFromMe ? 'Вы' : msg.user.name}</span>
                            <span className="conf-msg-time">{msg.time}</span>
                          </div>
                          <div className="conf-msg-bubble">{msg.text}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reactions */}
                <div className="conf-reactions-bar">
                  {['👍', '❤️', '👏', '🔥', '🎉'].map(emoji => (
                    <button
                      key={emoji}
                      className="reaction-quick-btn"
                      onClick={() => handleSendReaction(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="conf-chat-input-row">
                  <input
                    type="text"
                    placeholder="Написать сообщение в чат конференции..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    className="conf-chat-input"
                  />
                  <button 
                    className="conf-chat-send-btn" 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* PARTICIPANTS TAB */}
            {activeSidePanel === 'users' && (
              <div className="conf-users-body">
                <div className="users-list">
                  {participants.map(p => {
                    const isMe = p.id === 'me' || p.id === effectiveUser?.id;
                    return (
                      <div key={p.id} className="conf-user-row">
                        <img src={p.avatar || '/default-avatar.svg'} alt={p.name} className="user-row-avatar" />
                        <div className="user-row-info">
                          <span className="user-row-name">
                            {isMe ? `${effectiveUser?.name || 'Вы'} (Организатор)` : p.name}
                          </span>
                          <span className="user-row-status">
                            {isMe ? (micOn && isLocalSpeaking ? 'Говорит...' : 'В эфире') : (activeSpeakerId === p.id ? 'Говорит...' : 'В эфире')}
                          </span>
                        </div>
                        <div className="user-row-controls">
                          {isMe && !micOn ? (
                            <MicOff size={16} className="user-row-icon red" />
                          ) : (
                            <Mic size={16} className="user-row-icon green" />
                          )}
                          {isMe && !videoOn ? (
                            <VideoOff size={16} className="user-row-icon red" />
                          ) : (
                            <VideoIcon size={16} className="user-row-icon green" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="conf-bottom-controls">
        <div className="controls-group-left">
          {/* Microphone with volume indicator */}
          <button 
            className={`btn-control ${!micOn ? 'btn-danger' : ''}`} 
            onClick={toggleMic}
            title={micOn ? 'Выключить микрофон' : 'Включить микрофон'}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            <span className="control-text">{micOn ? 'Микрофон' : 'Выключен'}</span>
            {micOn && (
              <div className="mic-volume-meter-wrapper">
                <div className="mic-volume-meter-fill" style={{ width: `${Math.min(100, audioVolume * 2)}%` }} />
              </div>
            )}
          </button>

          {/* Camera toggle */}
          <button 
            className={`btn-control ${!videoOn ? 'btn-danger' : ''}`} 
            onClick={toggleVideo}
            title={videoOn ? 'Выключить камеру' : 'Включить камеру'}
          >
            {videoOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
            <span className="control-text">{videoOn ? 'Камера' : 'Выключена'}</span>
          </button>

          {/* Device Settings */}
          <button 
            className="btn-control" 
            onClick={() => setIsSettingsModalOpen(true)}
            title="Настройки звука и оборудования"
          >
            <Settings size={20} />
            <span className="control-text">Настройки</span>
          </button>
        </div>

        <div className="controls-group-center">
          {/* Screen Share Button with Multi-choice trigger */}
          <button 
            className={`btn-control ${screenSharing ? 'btn-active' : ''}`}
            onClick={() => {
              if (screenSharing) {
                stopScreenShare();
              } else {
                setIsSharePickerOpen(true);
              }
            }}
            title={screenSharing ? 'Остановить демонстрацию' : 'Выбрать демонстрацию'}
          >
            <Monitor size={20} />
            <span className="control-text">{screenSharing ? 'Остановить' : 'Экран'}</span>
          </button>

          {/* Hand Raise */}
          <button 
            className={`btn-control ${handRaised ? 'btn-active' : ''}`}
            onClick={() => setHandRaised(!handRaised)}
            title="Поднять руку"
          >
            <Hand size={20} />
            <span className="control-text">Рука</span>
          </button>

          {/* Chat Toggle */}
          <button 
            className={`btn-control ${activeSidePanel === 'chat' ? 'btn-active' : ''}`}
            onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat')}
            title="Чат конференции"
          >
            <MessageSquare size={20} />
            <span className="control-text">Чат</span>
          </button>

          {/* Users Toggle */}
          <button 
            className={`btn-control ${activeSidePanel === 'users' ? 'btn-active' : ''}`}
            onClick={() => setActiveSidePanel(activeSidePanel === 'users' ? null : 'users')}
            title="Участники"
          >
            <Users size={20} />
            <span className="control-text">Люди</span>
          </button>
        </div>

        <div className="controls-group-right">
          <button 
            className="btn-control btn-leave" 
            onClick={handleEndCall}
            title="Завершить конференцию"
          >
            <PhoneOff size={20} />
            <span className="control-text">Завершить</span>
          </button>
        </div>
      </div>

      {/* Screen Share Multi-Choice Modal */}
      {isSharePickerOpen && (
        <div className="conf-modal-overlay" onClick={() => setIsSharePickerOpen(false)}>
          <div className="share-picker-modal-box" onClick={e => e.stopPropagation()}>
            <div className="share-picker-header">
              <div className="share-picker-title">
                <Monitor size={22} color="#6366F1" />
                <span>Выберите тип демонстрации</span>
              </div>
              <button className="conf-modal-close" onClick={() => setIsSharePickerOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="share-picker-grid">
              {/* Option 1: Real System Screen / Window / Tab */}
              <div 
                className="share-option-card"
                onClick={() => handleSelectShareMode('screen')}
              >
                <div className="share-option-icon screen">
                  <Monitor size={24} />
                </div>
                <div className="share-option-name">Экран устройства / Окно / Вкладка</div>
                <div className="share-option-desc">
                  Прямой системный захват рабочего стола, любого открытого приложения или вкладки браузера со звуком.
                </div>
              </div>

              {/* Option 2: Interactive Whiteboard */}
              <div 
                className="share-option-card"
                onClick={() => handleSelectShareMode('whiteboard')}
              >
                <div className="share-option-icon board">
                  <Palette size={24} />
                </div>
                <div className="share-option-name">Интерактивная доска (Whiteboard)</div>
                <div className="share-option-desc">
                  Совместный виртуальный холст: рисуйте схемы, заметки маркерами, стикеры с экспортом рисунка.
                </div>
              </div>

              {/* Option 3: Presentation Slides */}
              <div 
                className="share-option-card"
                onClick={() => handleSelectShareMode('presentation')}
              >
                <div className="share-option-icon presentation">
                  <Presentation size={24} />
                </div>
                <div className="share-option-name">Презентация и слайды</div>
                <div className="share-option-desc">
                  Интерактивные слайды с навигацией, лазерной указкой и возможностью загрузки собственных изображений.
                </div>
              </div>

              {/* Option 4: Video / Media player */}
              <div 
                className="share-option-card"
                onClick={() => handleSelectShareMode('media')}
              >
                <div className="share-option-icon media">
                  <Film size={24} />
                </div>
                <div className="share-option-name">Видео и медиа-файл</div>
                <div className="share-option-desc">
                  Трансляция видеоролика со звуком, регулировкой громкости и воспроизведением видеофайлов.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Device Settings Modal (Microphone, Camera, Speaker) */}
      {isSettingsModalOpen && (
        <div className="conf-modal-overlay" onClick={() => setIsSettingsModalOpen(false)}>
          <div className="device-settings-modal-box" onClick={e => e.stopPropagation()}>
            <div className="share-picker-header">
              <div className="share-picker-title">
                <Settings size={22} color="#10B981" />
                <span>Настройки оборудования</span>
              </div>
              <button className="conf-modal-close" onClick={() => setIsSettingsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Microphone Settings */}
            <div className="device-setting-field">
              <label className="device-setting-label">
                <Mic size={16} color="#10B981" />
                <span>Микрофон (Аудиовход)</span>
              </label>
              <select 
                className="device-setting-select"
                value={selectedAudioInput}
                onChange={e => setSelectedAudioInput(e.target.value)}
              >
                {audioInputs.length > 0 ? (
                  audioInputs.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Микрофон ${i + 1}`}
                    </option>
                  ))
                ) : (
                  <option value="">Микрофон по умолчанию</option>
                )}
              </select>

              {/* Real-time mic test level */}
              <div className="mic-test-row">
                <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Уровень сигнала:</span>
                <div className="mic-test-bar">
                  <div className="mic-test-fill" style={{ width: `${Math.min(100, audioVolume * 2)}%` }} />
                </div>
                <span style={{ fontSize: '0.74rem', color: isLocalSpeaking ? '#10B981' : '#64748B', fontWeight: 600 }}>
                  {isLocalSpeaking ? 'Голос обнаружен' : 'Ожидание голоса'}
                </span>
              </div>
            </div>

            {/* Speaker Settings */}
            <div className="device-setting-field">
              <label className="device-setting-label">
                <Volume2 size={16} color="#3B82F6" />
                <span>Динамики / Наушники (Аудиовыход)</span>
              </label>
              <select 
                className="device-setting-select"
                value={selectedAudioOutput}
                onChange={e => handleSelectAudioOutput(e.target.value)}
              >
                {audioOutputs.length > 0 ? (
                  audioOutputs.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Динамики ${i + 1}`}
                    </option>
                  ))
                ) : (
                  <option value="">Динамики по умолчанию</option>
                )}
              </select>

              <button 
                type="button" 
                className={`sound-test-btn ${audioTestPlaying ? 'playing' : ''}`}
                onClick={handleTestSpeakerSound}
              >
                <Volume2 size={15} />
                <span>{audioTestPlaying ? 'Воспроизведение перезвона...' : 'Проверить звук'}</span>
              </button>
            </div>

            {/* Camera Settings */}
            <div className="device-setting-field">
              <label className="device-setting-label">
                <VideoIcon size={16} color="#8B5CF6" />
                <span>Веб-камера (Видеовход)</span>
              </label>
              <select 
                className="device-setting-select"
                value={selectedVideoInput}
                onChange={e => setSelectedVideoInput(e.target.value)}
              >
                {videoInputs.length > 0 ? (
                  videoInputs.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Камера ${i + 1}`}
                    </option>
                  ))
                ) : (
                  <option value="">Веб-камера по умолчанию</option>
                )}
              </select>
            </div>

            {/* Smart Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#E2E8F0', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={noiseSuppression} 
                  onChange={e => setNoiseSuppression(e.target.checked)} 
                />
                <span>Интеллектуальное шумоподавление микрофона (Noise Suppression)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#E2E8F0', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={echoCancellation} 
                  onChange={e => setEchoCancellation(e.target.checked)} 
                />
                <span>Эхоподавление динамиков и гарнитуры (Echo Cancellation)</span>
              </label>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-primary-summary" 
                style={{ padding: '0.55rem 1.5rem', fontSize: '0.85rem' }}
                onClick={() => setIsSettingsModalOpen(false)}
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Ended Summary Modal */}
      {callEndedModal && (
        <div className="conf-modal-overlay">
          <div className="call-summary-modal-box">
            <div className="summary-icon-badge">
              <Check size={32} />
            </div>
            <h2>Конференция успешно завершена</h2>
            <p className="summary-desc">
              Запись звонка обработана и сохранена, а группа общения автоматически создана в мессенджере.
            </p>

            {/* Video preview player */}
            {savedRecordingData && (
              <div className="summary-video-preview-wrap">
                <video 
                  src={savedRecordingData.videoUrl} 
                  controls 
                  playsInline 
                  poster={savedRecordingData.thumbnail && !savedRecordingData.thumbnail.includes('photo-') ? savedRecordingData.thumbnail : undefined}
                  className="summary-video-player"
                  onLoadedData={(e) => {
                    const v = e.currentTarget;
                    if ((!savedRecordingData.thumbnail || savedRecordingData.thumbnail.includes('photo-')) && v.videoWidth > 0) {
                      try {
                        const canvas = document.createElement('canvas');
                        canvas.width = v.videoWidth;
                        canvas.height = v.videoHeight;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
                          const frame = canvas.toDataURL('image/jpeg', 0.85);
                          if (frame && frame.length > 200) {
                            setSavedRecordingData(prev => prev ? { ...prev, thumbnail: frame } : prev);
                            saveConferenceRecording({ ...savedRecordingData, thumbnail: frame });
                          }
                        }
                      } catch (_) {}
                    }
                  }}
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (!v.poster && v.currentTime === 0) {
                      v.currentTime = 0.05;
                    }
                  }}
                />
              </div>
            )}

            <div className="summary-card-items">
              <div className="summary-item">
                <Disc size={20} className="summary-item-icon rec" />
                <div className="summary-item-text">
                  <strong>Запись звонка сохранена</strong>
                  <span>Длительность: {savedRecordingData?.duration || formatTime(callDuration)} · Архив записей</span>
                </div>
              </div>

              <div className="summary-item">
                <MessageCircle size={20} className="summary-item-icon chat" />
                <div className="summary-item-text">
                  <strong>Создана группа «{confTitle}»</strong>
                  <span>{participants.length} участников · история чата и видео сохранены</span>
                </div>
              </div>
            </div>

            <div className="summary-actions">
              {savedRecordingData && (
                <button 
                  type="button"
                  className="btn-download-summary"
                  onClick={() => downloadRecordingFile(savedRecordingData.videoUrl, savedRecordingData.title)}
                >
                  <Download size={18} /> Скачать видеозапись (.mp4)
                </button>
              )}

              <button 
                type="button"
                className="btn-primary-summary"
                onClick={() => {
                  setCallEndedModal(false);
                  const targetChat = createdGroupId || savedRecordingData?.chatGroupId || ('group_' + (conference?.id || 'conf_1'));
                  if (onGoToChatGroup) {
                    onGoToChatGroup(targetChat);
                  } else {
                    navigate(`/messenger?chat=${targetChat}`);
                  }
                }}
              >
                <MessageCircle size={18} /> Открыть группу в Мессенджере
              </button>

              <button 
                type="button"
                className="btn-secondary-summary"
                onClick={() => {
                  setCallEndedModal(false);
                  if (onLeaveCall) onLeaveCall(savedRecordingData || undefined);
                }}
              >
                Вернуться к списку конференций
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Offscreen Compositor Canvas & Camera Source for Guaranteed High-Fidelity Recording */}
      <canvas
        ref={recordCanvasRef}
        width={1280}
        height={720}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '160px',
          height: '90px',
          pointerEvents: 'none',
          opacity: 0.01,
          zIndex: -9999,
        }}
      />
      <video
        ref={recordSourceVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          pointerEvents: 'none',
          opacity: 0,
          zIndex: -9999,
        }}
      />
    </div>
  );
}

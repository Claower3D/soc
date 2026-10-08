import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Smile, Paperclip, MoreVertical, Phone, Video, Copy, Reply, Trash2, Pin, Forward, X, Mic, Volume2, VolumeX, Volume1, MicOff, Sparkles, Globe, Languages, Check, ChevronDown } from 'lucide-react';
import { type Chat, type Message } from '../data/mock';
import { formatLastSeen } from '../utils/onlineStatus';
import { API_BASE_URL } from '../api';
import { WORLD_LANGUAGES, POPULAR_LANG_CODES, translateText, playVoiceSpeech } from '../utils/translator';
import './ChatWindowNew.css';





interface ChatWindowProps {


  chat: Chat | null;


  onBack: () => void;


  onDeleteChat?: (id: string) => void;


  onUpdateChat?: (id: string, updates: Partial<Chat>) => void;


  availableChats?: Chat[];


  onSelectChat?: (id: string) => void;


}





const RU_NUM_MAP: Record<string, number> = {
  'ноль': 0, 'нуль': 0, 'один': 1, 'одна': 1, 'раз': 1, 'два': 2, 'две': 2, 'три': 3,
  'четыре': 4, 'пять': 5, 'шесть': 6, 'семь': 7, 'восемь': 8, 'девять': 9, 'десять': 10,
  'одиннадцать': 11, 'двенадцать': 12, 'тринадцать': 13, 'четырнадцать': 14, 'пятнадцать': 15,
  'шестнадцать': 16, 'семнадцать': 17, 'восемнадцать': 18, 'девятнадцать': 19, 'двадцать': 20,
  'тридцать': 30, 'сорок': 40, 'пятьдесят': 50, 'шестьдесят': 60, 'семьдесят': 70,
  'восемьдесят': 80, 'девяносто': 90, 'сто': 100,
};

function trySolveClientMath(text: string): string | null {
  let clean = (text || '').toLowerCase().trim().replace(/[?!.]/g, '').trim();
  clean = clean.replace(/^(?:сколько\s+будет|посчитай|вычисли|реши|скажи\s+сколько\s+будет)\s+/i, '').trim();

  // Digits: 5+5, 5 плюс 5, 10 * 4
  const digitMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(\+|\-|[\*xх]|\/|плюс|прибавить|минус|отнять|умножить\s+на|умножить|разделить\s+на|поделить\s+на|делить\s+на)\s*(\d+(?:[.,]\d+)?)$/i);
  if (digitMatch) {
    const a = parseFloat(digitMatch[1].replace(',', '.'));
    const op = digitMatch[2].toLowerCase();
    const b = parseFloat(digitMatch[3].replace(',', '.'));
    return calcMath(a, op, b);
  }

  // Words: пять плюс пять
  const words = clean.split(/\s+/);
  if (words.length >= 3) {
    const first = words[0];
    const last = words[words.length - 1];
    if (first in RU_NUM_MAP && last in RU_NUM_MAP) {
      const a = RU_NUM_MAP[first];
      const b = RU_NUM_MAP[last];
      const op = words.slice(1, -1).join(' ');
      return calcMath(a, op, b);
    }
  }
  return null;
}

function calcMath(a: number, op: string, b: number): string | null {
  let res: number;
  let opWord = 'плюс';
  if (op === '+' || op.includes('плюс') || op.includes('прибав')) {
    res = a + b;
    opWord = 'плюс';
  } else if (op === '-' || op.includes('минус') || op.includes('отня')) {
    res = a - b;
    opWord = 'минус';
  } else if (op === '*' || op === 'x' || op === 'х' || op.includes('умнож')) {
    res = a * b;
    opWord = 'умножить на';
  } else if (op === '/' || op.includes('раздел') || op.includes('подел') || op.includes('делит')) {
    if (b === 0) return 'Деление на ноль невозможно.';
    res = a / b;
    opWord = 'разделить на';
  } else {
    return null;
  }
  const fmt = (n: number) => Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `${fmt(a)} ${opWord} ${fmt(b)} будет ${fmt(res)}.`;
}

function getLocalOracleFallback(text: string, voice = false): string {
  const math = trySolveClientMath(text);
  if (math) return math;

  const lower = (text || '').trim().toLowerCase().replace(/[?!.]/g, '').trim();

  // Kazakh
  if (/[әғқңөұүһі]/i.test(lower) || lower.includes('қазақ') || lower.includes('сәлем') || lower.includes('салем') || lower.includes('қалайсың')) {
    if (lower.includes('сәлем') || lower.includes('салем')) return 'Сәлеметсіз бе! 👋 Мен — New Age платформасының ИИ Оракулымын. Сізге қалай көмектесе аламын? ✨';
    if (lower.includes('қалайсың') || lower.includes('калайсын')) return 'Рахмет, бәрі тамаша! Мен сандық сана болғандықтан, әрқашан бабымдамын. Өзіңіз қалайсыз? 🌟';
    if (lower.includes('кімсің') || lower.includes('кимсин')) return '🤖 Мен — New Age цифрлық экожүйесінің ИИ Оракулымын 🙏';
    if (lower.includes('рахмет')) return 'Оқасы жоқ! Әрқашан көмекке дайынмын 💫';
    return `Мен сұрағыңызды естідім: «${text.trim()}». Нейрожелі сервері уақытша бос емес. Бір минуттан кейін қайталаңыз.`;
  }

  // English
  if (/^[a-zA-Z0-9\s.,!?'"()-]+$/.test(lower) || lower.includes('hello') || lower.includes('hi ') || lower === 'hi') {
    if (lower.includes('hello') || lower.includes('hi')) return 'Hello! 👋 I am the AI Oracle of New Age. How may I guide you today? ✨';
    if (lower.includes('who are you')) return '🤖 I am the AI Oracle of New Age — your personal digital guide and life coach 🙏';
    if (lower.includes('how are you')) return 'I am doing great, thank you! Ready and eager to help you 🌟';
    return voice ? `I heard: "${text.trim()}". The neural network is temporarily busy (Google API rate limit). Please try again in a minute.` : `I heard your question: "${text.trim()}". The AI model is temporarily rate-limited. Please retry shortly or provide a fresh GEMINI_API_KEY.`;
  }

  // Russian / Default Cyrillic
  const ruMonths = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  if (lower.includes('сколько времени') || lower.includes('который час') || lower.includes('сколько сейчас времени')) {
    const now = new Date();
    return `Сейчас ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}.`;
  }
  if (lower.includes('какое число') || lower.includes('какой сегодня день') || lower.includes('какая сегодня дата')) {
    const now = new Date();
    return `Сегодня ${now.getDate()} ${ruMonths[now.getMonth()]} ${now.getFullYear()} года.`;
  }
  if (lower.startsWith('кто ты') || lower.startsWith('как тебя зовут') || lower === 'ты кто') {
    return voice ? 'Я ИИ Оракул, твой живой собеседник и помощник.' : '🤖 Я ИИ Оракул — цифровой наставник и помощник платформы New Age ✨';
  }
  if (lower.includes('как дела') || lower.includes('как ты') || lower.includes('как поживаешь')) {
    return voice ? 'Всё отлично, полон сил и готов общаться! Как твои дела?' : '✨ У меня всё отлично! Всегда полон энергии и готов помочь. А как твои дела? 🌟';
  }
  if (lower.includes('что ты умеешь') || lower.includes('что ты можешь')) {
    return voice ? 'Я умею отвечать на вопросы, решать примеры, давать советы и общаться вслух.' : '📚 Я могу отвечать на любые вопросы, считать, давать мудрые советы и вести живой диалог ✨';
  }
  if (lower.includes('привет') || lower.includes('здравствуй') || lower.includes('добрый день') || lower.includes('доброе утро') || lower.includes('добрый вечер')) {
    return voice ? 'Привет! Рад тебя слышать. О чём поговорим?' : 'Привет! 👋 Рад тебя слышать. Чем могу помочь сегодня? ✨';
  }
  if (lower.includes('спасибо') || lower.includes('благодар')) {
    return voice ? 'Всегда пожалуйста, рад помочь!' : 'Пожалуйста! 🙏 Обращайся в любое время 💫';
  }
  if (lower.includes('пока') || lower.includes('до свидания') || lower.includes('спокойной ночи')) {
    return voice ? 'До встречи! Хорошего дня.' : 'До свидания! Желаю отличного настроения ✨';
  }

  if (voice) {
    return `Я услышал: «${text.trim()}». Сервер нейросети сейчас обрабатывает много запросов. Попробуй повторить через минуту.`;
  }
  return `Я услышал твой вопрос: «${text.trim()}». Сервер нейросети временно перегружен. Пожалуйста, повтори через минуту.`;
}

async function fetchAiReply(text: string, history: Array<{ role: string; text: string }>, voice = false): Promise<string> {
  const math = trySolveClientMath(text);
  if (math) return math;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), voice ? 12000 : 20000);

  try {
    const resp = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history,
        voice,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error('API error');
    const data = await resp.json();
    return String(data.reply || getLocalOracleFallback(text, voice));
  } catch {
    clearTimeout(timeoutId);
    return getLocalOracleFallback(text, voice);
  }
}

function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_#`~>|]/g, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;
  const ruVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('ru'));
  if (ruVoices.length > 0) {
    const naturalRu = ruVoices.find(v => {
      const n = (v.name || '').toLowerCase();
      return n.includes('google') || n.includes('natural') || n.includes('yandex') || n.includes('dmitri') || n.includes('tatyana') || n.includes('milena');
    });
    return naturalRu || ruVoices[0];
  }
  return voices.find(v => v.default) || voices[0] || null;
}






function formatTime(): string {


  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


}





const EMOJI_LIST = ['','','','🥰','','🤔','','','👍','👎','❤️','🔥','✨','🙏','💫','🎉','','🤗','','🥺','💪','👏','🫶','💯','','🤩','','🤝','💡','🌟'];





type CtxMenu = { visible: boolean; x: number; y: number; msg: Message | null };






function VoiceMessageBubble({ msg, isMe, onUpdateText }: { msg: Message; isMe: boolean; onUpdateText?: (t: string) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showText, setShowText] = useState(Boolean(msg.text && !msg.text.includes('Это тестовое голосовое сообщение')));
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState(
    msg.text && !msg.text.includes('Это тестовое голосовое сообщение') ? msg.text : ''
  );
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (msg.text && !msg.text.includes('Это тестовое голосовое сообщение')) {
      setTranscribedText(msg.text);
    }
  }, [msg.text]);

  useEffect(() => {
    if (msg.mediaUrl) {
      audioRef.current = new Audio(msg.mediaUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current && audioRef.current.duration > 0) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      };
    }
  }, [msg.mediaUrl]);

  useEffect(() => {
    if (!msg.mediaUrl) {
      let interval: any;
      if (isPlaying) {
        interval = setInterval(() => {
          setProgress(p => {
            if (p >= 100) {
              setIsPlaying(false);
              return 0;
            }
            return p + 2;
          });
        }, 100);
      }
      return () => clearInterval(interval);
    }
  }, [isPlaying, msg.mediaUrl]);

  const togglePlay = () => {
    if (!isPlaying) {
      if (audioRef.current) audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  const toggleText = async () => {
    const nextState = !showText;
    setShowText(nextState);

    // Если открыли и текст еще не распознан — отправляем в нейросеть
    if (nextState && !transcribedText && msg.mediaUrl) {
      setIsTranscribing(true);
      try {
        const audioRes = await fetch(msg.mediaUrl);
        const blob = await audioRes.blob();
        const fd = new FormData();
        fd.append('audio', blob, 'speech.webm');
        const resp = await fetch(`${API_BASE_URL}/api/ai/stt`, {
          method: 'POST',
          body: fd,
        });
        if (resp.ok) {
          const data = await resp.json();
          const clean = String(data.text || '').trim();
          if (clean) {
            setTranscribedText(clean);
            if (onUpdateText) onUpdateText(clean);
          } else {
            setTranscribedText('Звук не распознан или запись пуста.');
          }
        } else {
          setTranscribedText('Не удалось расшифровать запись.');
        }
      } catch {
        setTranscribedText('Ошибка соединения при распознавании.');
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px', marginBottom: '4px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
        <div 
          onClick={togglePlay}
          style={{width: '40px', height: '40px', borderRadius: '50%', background: isMe ? 'rgba(255,255,255,0.2)' : 'var(--color-accent, #6C5CE7)22', color: isMe ? '#fff' : 'var(--color-accent, #6C5CE7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: '0.2s'}}
        >
          {isPlaying ? (
            <div style={{width: '12px', height: '12px', background: 'currentColor', borderRadius: '2px'}} />
          ) : (
            <div style={{width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '11px solid currentColor', marginLeft: '3px'}}></div>
          )}
        </div>
        
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '6px'}}>
          <div style={{height: '4px', background: isMe ? 'rgba(255,255,255,0.3)' : 'var(--color-border)', width: '100%', borderRadius: '2px', position: 'relative', overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, top: 0, height: '100%', width: `${progress || 0}%`, background: isMe ? '#fff' : 'var(--color-accent, #6C5CE7)', borderRadius: '2px', transition: 'width 0.1s linear'}}></div>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontSize: '11px', opacity: 0.8}}>{isPlaying ? `0:0${Math.floor((progress||0)/20)}` : '0:05'}</span>
            <button 
              type="button"
              onClick={toggleText}
              title="Перевести речь в текст"
              style={{
                background: showText ? (isMe ? 'rgba(255,255,255,0.3)' : 'var(--color-accent)') : 'transparent',
                color: showText ? '#fff' : (isMe ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)'),
                border: '1px solid ' + (isMe ? 'rgba(255,255,255,0.4)' : 'var(--color-border)'),
                borderRadius: '6px',
                padding: '2px 7px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              {isTranscribing ? '…' : 'T'}
            </button>
          </div>
        </div>
      </div>
      {showText && (
        <div style={{
          background: isMe ? 'rgba(255,255,255,0.12)' : 'var(--color-bg-card)', 
          padding: '8px 12px', 
          borderRadius: '8px', 
          fontSize: '13.5px',
          color: isMe ? '#fff' : 'inherit',
          marginTop: '4px',
          border: isMe ? 'none' : '1px solid var(--color-border)',
          lineHeight: '1.45',
        }}>
          {isTranscribing ? (
            <span style={{ fontStyle: 'italic', opacity: 0.85 }}>⚡ Распознавание речи...</span>
          ) : (
            transcribedText || 'Звук не распознан или запись пуста.'
          )}
        </div>
      )}
    </div>
  );
}

export function ChatWindowNew({ chat, onBack, onUpdateChat }: ChatWindowProps) {


  const [inputValue, setInputValue] = useState('');


  const [messages, setMessages] = useState<Message[]>([]);


  const [isAiTyping, setIsAiTyping] = useState(false);


  const [showEmoji, setShowEmoji] = useState(false);


  const [replyTo, setReplyTo] = useState<Message | null>(null);


  const [ctxMenu, setCtxMenu] = useState<CtxMenu>({ visible: false, x: 0, y: 0, msg: null });


  const messagesEndRef = useRef<HTMLDivElement>(null);


  const inputRef = useRef<HTMLInputElement>(null);





  const [isRecording, setIsRecording] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Voice Chat (на громкой связи)
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isSpeakerLoud, setIsSpeakerLoud] = useState(true); // По умолчанию громкая связь включена
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  interface MsgTranslationState {
    targetLang: string;
    translatedText: string;
    sourceLang?: string;
    isLoading: boolean;
    isOpen: boolean;
    isSpeaking: boolean;
    copied?: boolean;
    showAllLangs?: boolean;
  }
  const [msgTranslations, setMsgTranslations] = useState<Record<string, MsgTranslationState>>({});
  const stopTransSpeechRef = useRef<(() => void) | null>(null);
  const [speakingTransId, setSpeakingTransId] = useState<string | null>(null);
  const [userPreferredLang, setUserPreferredLang] = useState<string>('en');

  // Быстрый переводчик
  const [showQuickTranslator, setShowQuickTranslator] = useState(false);
  const [quickTransText, setQuickTransText] = useState('');
  const [quickTransTarget, setQuickTransTarget] = useState('en');
  const [quickTransResult, setQuickTransResult] = useState('');
  const [quickTransLoading, setQuickTransLoading] = useState(false);
  const [quickTransSpeaking, setQuickTransSpeaking] = useState(false);
  const [quickTransCopied, setQuickTransCopied] = useState(false);
  const stopQuickSpeechRef = useRef<(() => void) | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const silenceCountdownRafRef = useRef<number | null>(null);
  const silenceDeadlineRef = useRef<number>(0);
  const [silenceProgress, setSilenceProgress] = useState<number>(0);
  const currentVoiceQueryRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');
  const liveTranscriptRef = useRef<string>('');
  const isRecognitionRunningRef = useRef<boolean>(false);
  const [aiSpeechText, setAiSpeechText] = useState('');
  const [aiSpeechCharIdx, setAiSpeechCharIdx] = useState(0);
  const [voiceSessionStart, setVoiceSessionStart] = useState(0);
  const voiceOrbRef = useRef<HTMLDivElement>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const levelRafRef = useRef<number | null>(null);
  const voiceTranscriptEndRef = useRef<HTMLDivElement>(null);
  const isVoiceChatActiveRef = useRef(isVoiceChatActive);
  isVoiceChatActiveRef.current = isVoiceChatActive;
  const isMicMutedRef = useRef(isMicMuted);
  isMicMutedRef.current = isMicMuted;
  const voiceStatusRef = useRef(voiceStatus);
  voiceStatusRef.current = voiceStatus;
  const isSpeakerLoudRef = useRef(isSpeakerLoud);
  isSpeakerLoudRef.current = isSpeakerLoud;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const [isUserTalking, setIsUserTalking] = useState(false);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedVoiceChunksRef = useRef<Blob[]>([]);
  const hasSpokenInTurnRef = useRef<boolean>(false);
  const lastSpokenTimeRef = useRef<number>(0);
  const isProcessingSTTRef = useRef<boolean>(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const wavPcmChunksRef = useRef<Float32Array[]>([]);
  const wavScriptNodeRef = useRef<ScriptProcessorNode | null>(null);

  // Сборка 16-битного моно WAV с точной частотой 16 000 Гц для Google Speech Engine v2
  const buildWav16kBlob = (pcmFloatSamples: Float32Array[], sourceSampleRate: number): Blob => {
    let totalLen = 0;
    for (const c of pcmFloatSamples) totalLen += c.length;
    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const c of pcmFloatSamples) {
      merged.set(c, offset);
      offset += c.length;
    }

    const targetRate = 16000;
    let downsampled: Float32Array;
    if (sourceSampleRate === targetRate) {
      downsampled = merged;
    } else {
      const ratio = sourceSampleRate / targetRate;
      const newLen = Math.round(merged.length / ratio);
      downsampled = new Float32Array(newLen);
      for (let i = 0; i < newLen; i++) {
        const pos = i * ratio;
        const index = Math.floor(pos);
        const frac = pos - index;
        const nextIndex = Math.min(index + 1, merged.length - 1);
        downsampled[i] = merged[index] * (1 - frac) + merged[nextIndex] * frac;
      }
    }

    const numSamples = downsampled.length;
    const pcm16 = new Int16Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, downsampled[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(wavBuffer);
    const writeStr = (off: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(off + i, str.charCodeAt(i));
      }
    };

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // Linear PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, targetRate, true); // 16000 Hz
    view.setUint32(28, targetRate * 2, true); // Byte rate: 32000
    view.setUint16(32, 2, true); // Block align: 2
    view.setUint16(34, 16, true); // 16 bits
    writeStr(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    const pcmBytes = new Int16Array(wavBuffer, 44, numSamples);
    pcmBytes.set(pcm16);

    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const startPcmCapture = (stream: MediaStream) => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      const src = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];
      proc.onaudioprocess = (e: AudioProcessingEvent) => {
        chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      src.connect(proc);
      proc.connect(ctx.destination);
      return {
        stop: (): Blob | null => {
          try { proc.disconnect(); } catch {}
          try { src.disconnect(); } catch {}
          try { ctx.close(); } catch {}
          return chunks.length > 0 ? buildWav16kBlob(chunks, ctx.sampleRate) : null;
        }
      };
    } catch {
      return null;
    }
  };


  


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {


    const file = e.target.files?.[0];


    if (!file) return;


    


    const reader = new FileReader();


    reader.onload = () => {


      const isVideo = file.type.startsWith('video');


      const newMsg: Message = {


        id: `msg_${Date.now()}`,


        text: '',


        fromMe: true,


        time: formatTime(),


        status: 'sent',


        mediaUrl: reader.result as string,


        mediaType: isVideo ? 'video' : 'image',


      };


      const updatedMessages = [...messages, newMsg];


      setMessages(updatedMessages);


      saveMessages(updatedMessages);


    };


    reader.readAsDataURL(file);


  };


  


  const handleVoiceRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const pcmCapture = startPcmCapture(stream);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const wavBlob = pcmCapture ? pcmCapture.stop() : null;
        const mediaBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const finalAudioBlob = (wavBlob && wavBlob.size > 800) ? wavBlob : mediaBlob;
        const audioUrl = URL.createObjectURL(finalAudioBlob);

        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());

        const msgId = `msg_${Date.now()}`;
        const newMsg: Message = {
          id: msgId,
          text: '',
          fromMe: true,
          time: formatTime(),
          status: 'sent',
          mediaType: 'voice',
          mediaUrl: audioUrl,
        };
        const currentMsgs = messagesRef.current;
        const updatedMessages = [...currentMsgs, newMsg];
        messagesRef.current = updatedMessages;
        setMessages(updatedMessages);
        saveMessages(updatedMessages);

        // Автоматическое фоновое распознавание речи пользователя через Google Speech Engine v2
        if (finalAudioBlob.size > 400) {
          try {
            const formData = new FormData();
            const fileName = finalAudioBlob.type.includes('wav') ? 'speech.wav' : 'speech.webm';
            formData.append('audio', finalAudioBlob, fileName);
            const resp = await fetch(`${API_BASE_URL}/api/v1/speech/recognize`, {
              method: 'POST',
              body: formData,
            });
            if (resp.ok) {
              const data = await resp.json();
              const recognized = String(data.text || '').trim();
              if (recognized) {
                setMessages(prev => {
                  const mapped = prev.map(m => m.id === msgId ? { ...m, text: recognized } : m);
                  messagesRef.current = mapped;
                  saveMessages(mapped);
                  return mapped;
                });

                // Если диалог с ИИ Оракулом — генерируем ответ на распознанный голос
                if (chat && (chat.id === 'chat_ai_oracle' || chat.id === 'ai_guru_bot')) {
                  const history = [...messagesRef.current].map(m => ({
                    role: m.fromMe ? 'user' : 'assistant',
                    text: String(m.text || ''),
                  }));
                  setIsAiTyping(true);
                  fetchAiReply(recognized, history).then(replyText => {
                    setIsAiTyping(false);
                    const reply: Message = {
                      id: `msg_ai_${Date.now()}`,
                      text: replyText,
                      fromMe: false,
                      time: formatTime(),
                      status: 'read',
                    };
                    setMessages(curr => {
                      const withReply = [...curr, reply];
                      messagesRef.current = withReply;
                      saveMessages(withReply);
                      return withReply;
                    });
                  }).catch(() => {
                    setIsAiTyping(false);
                  });
                }
              }
            }
          } catch (e) {
            console.warn('Voice message auto-STT error:', e);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
      alert('Ошибка доступа к микрофону. Проверьте разрешения браузера.');
      setIsRecording(false);
    }
  };


  


  const handleVideoRecord = () => {


    setIsRecording(true);


    setTimeout(() => {


      setIsRecording(false);


      const newMsg: Message = {


        id: `msg_${Date.now()}`,


        text: '',


        fromMe: true,


        time: formatTime(),


        status: 'sent',


        mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',


        mediaType: 'video_note',


      };


      const updatedMessages = [...messages, newMsg];


      setMessages(updatedMessages);


      saveMessages(updatedMessages);


    }, 3000); // Fake 3 seconds video recording


  };








  useEffect(() => {


    if (chat?.messages && Array.isArray(chat.messages)) {


      setMessages(chat.messages);


    } else {


      setMessages([]);


    }


    setInputValue('');


    setReplyTo(null);


    setShowEmoji(false);


  }, [chat?.id]);





  useEffect(() => {


    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });


  }, [messages, isAiTyping]);





  // Close context menu on click anywhere


  useEffect(() => {


    const close = () => setCtxMenu(prev => prev.visible ? { ...prev, visible: false } : prev);


    window.addEventListener('click', close);


    return () => window.removeEventListener('click', close);


  }, []);

  const saveMessages = (msgs: Message[]) => {
    if (onUpdateChat && chat) {
      const last = msgs[msgs.length - 1];
      onUpdateChat(chat.id, {
        messages: msgs,
        lastMessage: last ? String(last.text || '').slice(0, 50) : '',
        time: formatTime(),
      });
    }
  };

  // Load available voices for Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          setAvailableVoices(v);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // Cleanup voice chat on chat change
  useEffect(() => {
    if (isVoiceChatActive) {
      stopVoiceChat();
    }
    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); } catch {}
      ttsAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  }, [chat?.id]);

  // Полная очистка при уходе со страницы
  useEffect(() => {
    return () => {
      isVoiceChatActiveRef.current = false;
      try { recognitionRef.current?.abort(); } catch {}
      if (ttsAudioRef.current) {
        try { ttsAudioRef.current.pause(); } catch {}
        ttsAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      if (levelRafRef.current) cancelAnimationFrame(levelRafRef.current);
      try { audioCtxRef.current?.close(); } catch {}
      micStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Автопрокрутка живой расшифровки разговора
  useEffect(() => {
    voiceTranscriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, liveTranscript, isVoiceChatActive]);

  const fallbackWebSpeech = (clean: string, finish: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      finish();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const chunks = clean.match(/[^.!?…]+[.!?…]*\s*/g) || [clean];
      const voice = getBestVoice(availableVoices);
      let offset = 0;
      let idx = 0;

      const speakNext = () => {
        if (!isVoiceChatActiveRef.current) { finish(); return; }
        if (idx >= chunks.length) { finish(); return; }
        const chunk = chunks[idx];
        const chunkOffset = offset;
        const utter = new SpeechSynthesisUtterance(chunk);
        utter.volume = isSpeakerLoudRef.current ? 1.0 : 0.4;
        utter.rate = 1.05;
        utter.pitch = 1.02;
        utter.lang = 'ru-RU';
        if (voice) utter.voice = voice;
        utter.onstart = () => setAiSpeechCharIdx(chunkOffset);
        utter.onboundary = (e: SpeechSynthesisEvent) => {
          setAiSpeechCharIdx(chunkOffset + (e.charIndex || 0) + (e.charLength || 0));
        };
        utter.onend = () => {
          offset += chunk.length;
          idx++;
          setAiSpeechCharIdx(offset);
          speakNext();
        };
        utter.onerror = (e: any) => {
          if (e?.error === 'interrupted' || e?.error === 'canceled') return;
          finish();
        };
        window.speechSynthesis.speak(utter);
      };

      speakNext();
    } catch {
      finish();
    }
  };

  const speakAloud = (text: string, onEnd?: () => void) => {
    const clean = cleanTextForSpeech(text);
    if (!clean) {
      if (onEnd) onEnd();
      return;
    }

    setAiSpeechText(clean);
    setAiSpeechCharIdx(0);

    // Остановка предыдущего звука или синтеза
    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.currentTime = 0;
      } catch {}
      ttsAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }

    let finished = false;
    let animFrameId: number | null = null;
    let watchdogTimer: any = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (watchdogTimer) clearTimeout(watchdogTimer);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      setAiSpeechCharIdx(clean.length);
      if (voiceOrbRef.current) {
        voiceOrbRef.current.style.setProperty('--lvl', '0');
      }
      if (onEnd) onEnd();
    };

    // Страховочный таймер: максимум 12 секунд или по длине текста, чтобы голос никогда не зависал
    const maxSpeechDuration = Math.max(7000, Math.min(25000, clean.length * 140));
    watchdogTimer = setTimeout(() => {
      console.warn('speakAloud watchdog: завершаем воспроизведение по тайм-ауту');
      if (ttsAudioRef.current) {
        try { ttsAudioRef.current.pause(); } catch {}
        ttsAudioRef.current = null;
      }
      finish();
    }, maxSpeechDuration);

    // Фронтенд воспроизводит естественный человеческий голос из нейронного TTS бэкенда
    try {
      const ttsUrl = `${API_BASE_URL}/api/ai/tts?text=${encodeURIComponent(clean)}&lang=ru&voice=Sulafat`;
      const audio = new Audio(ttsUrl);
      audio.volume = isSpeakerLoudRef.current ? 1.0 : 0.45;
      audio.playbackRate = 1.06;
      ttsAudioRef.current = audio;

      // Синхронизация караоке-субтитров по прогрессу реального аудио
      audio.ontimeupdate = () => {
        if (audio.duration > 0) {
          const ratio = Math.min(1, audio.currentTime / audio.duration);
          setAiSpeechCharIdx(Math.floor(clean.length * ratio));
        }
      };

      // Пульсация шара Оракула в такт речи
      let phase = 0;
      const animateSpeakingOrb = () => {
        if (!ttsAudioRef.current || ttsAudioRef.current.paused || voiceStatusRef.current !== 'speaking') {
          if (animFrameId) cancelAnimationFrame(animFrameId);
          return;
        }
        phase += 0.16;
        const wave = 0.5 + 0.5 * Math.abs(Math.sin(phase) * Math.cos(phase * 0.65));
        if (voiceOrbRef.current) {
          voiceOrbRef.current.style.setProperty('--lvl', wave.toFixed(3));
        }
        animFrameId = requestAnimationFrame(animateSpeakingOrb);
      };

      audio.onplay = () => {
        animateSpeakingOrb();
      };

      audio.onended = () => {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        ttsAudioRef.current = null;
        finish();
      };

      audio.onerror = (e) => {
        console.warn('Neural TTS playback error, falling back to Web Speech:', e);
        if (animFrameId) cancelAnimationFrame(animFrameId);
        ttsAudioRef.current = null;
        fallbackWebSpeech(clean, finish);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play prevented or network error, fallback:', err);
          if (animFrameId) cancelAnimationFrame(animFrameId);
          ttsAudioRef.current = null;
          fallbackWebSpeech(clean, finish);
        });
      }
    } catch (e) {
      console.warn('Speech initialization error:', e);
      fallbackWebSpeech(clean, finish);
    }
  };

  // Запись аудиодорожки пользователя для фонового серверного STT распознавания
  const startVoiceRecorder = (stream: MediaStream) => {
    try {
      if (voiceRecorderRef.current && voiceRecorderRef.current.state === 'recording') {
        try { voiceRecorderRef.current.stop(); } catch {}
      }
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }
      const rec = selectedMime ? new MediaRecorder(stream, { mimeType: selectedMime }) : new MediaRecorder(stream);
      recordedVoiceChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedVoiceChunksRef.current.push(e.data);
          // Ограничиваем буфер последними ~12 секундами (150 слайсов по 80мс)
          if (recordedVoiceChunksRef.current.length > 150) {
            recordedVoiceChunksRef.current.splice(0, recordedVoiceChunksRef.current.length - 150);
          }
        }
      };
      rec.start(80); // 80ms слайсы для мгновенного сбора аудио
      voiceRecorderRef.current = rec;
    } catch (e) {
      console.warn('Voice MediaRecorder error:', e);
    }
  };

  // Фильтрация паразитных звуков, щелчков и вздохов
  const isNoiseOnly = (text: string): boolean => {
    const t = text.trim().toLowerCase();
    if (!t || t.length < 2) return true;
    if (/^[.,?!:;—–\-+*/\\_~^#`\s]+$/.test(t)) return true;
    if (/^(э|а|м|гм|хм|кхм|пф)$/i.test(t)) return true;
    return false;
  };

  // Финальная очистка и нормализация распознанного текста
  const cleanAndFormatTranscript = (text: string): string => {
    if (!text) return '';
    let s = text.trim().replace(/\s+/g, ' ');
    // Удаляем случайные дубликаты слов подряд при глитчах распознавания ("открыть открыть" -> "открыть")
    s = s.replace(/\b([а-яa-zё0-9]+)\s+\1\b/gi, '$1');
    // Капитализация первого символа
    s = s.charAt(0).toUpperCase() + s.slice(1);
    return s;
  };

  // Живой форматированный текст для мгновенного отображения в интерфейсе
  const polishLiveText = (text: string): string => {
    if (!text) return '';
    const s = text.trim().replace(/\s+/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // Отмена таймера паузы
  const cancelSilenceCommit = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (silenceCountdownRafRef.current) {
      cancelAnimationFrame(silenceCountdownRafRef.current);
      silenceCountdownRafRef.current = null;
    }
    setSilenceProgress(0);
  };

  // Запуск интеллектуального таймера паузы с обратным отсчетом
  const scheduleSilenceCommit = (delayMs: number) => {
    cancelSilenceCommit();
    const deadline = Date.now() + delayMs;
    silenceDeadlineRef.current = deadline;

    const updateProgress = () => {
      const remaining = silenceDeadlineRef.current - Date.now();
      if (remaining <= 0) {
        setSilenceProgress(100);
        return;
      }
      const elapsed = delayMs - remaining;
      const pct = Math.min(100, Math.max(0, (elapsed / delayMs) * 100));
      setSilenceProgress(pct);
      silenceCountdownRafRef.current = requestAnimationFrame(updateProgress);
    };
    silenceCountdownRafRef.current = requestAnimationFrame(updateProgress);

    silenceTimerRef.current = setTimeout(() => {
      cancelSilenceCommit();
      if (isVoiceChatActiveRef.current && voiceStatusRef.current === 'listening') {
        commitVoicePhrase();
      }
    }, delayMs);
  };

  // Индикатор громкости микрофона и Voice Activity Detection (VAD)
  const startMicLevel = (stream: MediaStream) => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx: AudioContext = new Ctx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.35;
      src.connect(analyser);

      // Захват чистого PCM для 16 kHz WAV Google Speech Engine v2
      try {
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        wavPcmChunksRef.current = [];
        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          if (voiceStatusRef.current === 'listening' && !isMicMutedRef.current) {
            const data = e.inputBuffer.getChannelData(0);
            wavPcmChunksRef.current.push(new Float32Array(data));
            // Храним буфер последних ~10 секунд звука
            const maxSamples = ctx.sampleRate * 10;
            let total = 0;
            for (let i = wavPcmChunksRef.current.length - 1; i >= 0; i--) {
              total += wavPcmChunksRef.current[i].length;
              if (total > maxSamples) {
                wavPcmChunksRef.current.splice(0, i);
                break;
              }
            }
          }
        };
        src.connect(processor);
        processor.connect(ctx.destination);
        wavScriptNodeRef.current = processor;
      } catch (procErr) {
        console.warn('ScriptProcessor note:', procErr);
      }

      audioCtxRef.current = ctx;
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length / 255;
        const status = voiceStatusRef.current;
        let level = 0;

        if (status === 'listening' && !isMicMutedRef.current) {
          level = Math.min(1, avg * 3.6);
          const isSoundActive = avg > 0.040;

          if (isSoundActive) {
            lastSpokenTimeRef.current = Date.now();
            hasSpokenInTurnRef.current = true;
            setIsUserTalking(true);

            // Если Web Speech еще не выдал текст, даём быструю естественную паузу 600мс:
            if (!liveTranscriptRef.current && !finalTranscriptRef.current) {
              scheduleSilenceCommit(600);
            }
          } else if (Date.now() - lastSpokenTimeRef.current > 350) {
            setIsUserTalking(false);
          }
        }

        if (voiceOrbRef.current && status === 'listening') {
          voiceOrbRef.current.style.setProperty('--lvl', level.toFixed(3));
        }
        levelRafRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch (e) {
      console.warn('Mic level error', e);
    }
  };

  const stopMicLevel = () => {
    if (levelRafRef.current) cancelAnimationFrame(levelRafRef.current);
    levelRafRef.current = null;
    if (wavScriptNodeRef.current) {
      try {
        wavScriptNodeRef.current.disconnect();
        wavScriptNodeRef.current.onaudioprocess = null;
      } catch {}
      wavScriptNodeRef.current = null;
    }
    try { audioCtxRef.current?.close(); } catch {}
    audioCtxRef.current = null;
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
  };

  // Браузерное распознавание речи (Web Speech API) — непрерывный потоковый режим
  const startRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      // Если браузер не поддерживает SpeechRecognition (Firefox, некоторые WebView) —
      // работает параллельный аудиопоток 16 kHz WAV + серверный Google Speech Engine v2
      return;
    }

    if (isRecognitionRunningRef.current && recognitionRef.current) {
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'ru-RU';
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        isRecognitionRunningRef.current = true;
        if (voiceStatusRef.current === 'listening') setVoiceStatus('listening');
      };

      rec.onresult = (event: any) => {
        if (isMicMutedRef.current || voiceStatusRef.current !== 'listening') return;

        let sessionFinal = '';
        let sessionInterim = '';

        // Корректное объединение всей сессии без дублирования слов
        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item && item[0]) {
            const transcript = item[0].transcript || '';
            if (item.isFinal) {
              sessionFinal += (sessionFinal ? ' ' : '') + transcript.trim();
            } else {
              sessionInterim += (sessionInterim ? ' ' : '') + transcript.trim();
            }
          }
        }

        finalTranscriptRef.current = sessionFinal;
        const currentCombined = (sessionFinal ? sessionFinal + ' ' : '') + sessionInterim;
        const polished = polishLiveText(currentCombined);

        if (polished) {
          liveTranscriptRef.current = polished;
          setLiveTranscript(polished);
          hasSpokenInTurnRef.current = true;
          lastSpokenTimeRef.current = Date.now();
          setIsUserTalking(true);

          // Быстрый живой переход без задержек: 350мс для готовой фразы, 600мс для паузы в речи
          const pauseDelay = sessionInterim ? 600 : 350;
          scheduleSilenceCommit(pauseDelay);
        }
      };

      rec.onerror = (event: any) => {
        console.warn('SpeechRecognition event:', event.error);
        if (event.error === 'not-allowed') {
          alert('Доступ к микрофону заблокирован в настройках браузера.');
          stopVoiceChat();
          return;
        }
        if (event.error === 'no-speech') {
          return;
        }
        isRecognitionRunningRef.current = false;
        if (isVoiceChatActiveRef.current && voiceStatusRef.current === 'listening' && !isMicMutedRef.current) {
          setTimeout(() => {
            if (isVoiceChatActiveRef.current && voiceStatusRef.current === 'listening' && !isRecognitionRunningRef.current) {
              startRecognition();
            }
          }, 250);
        }
      };

      rec.onend = () => {
        isRecognitionRunningRef.current = false;
        if (isVoiceChatActiveRef.current && !isMicMutedRef.current && voiceStatusRef.current === 'listening') {
          setTimeout(() => {
            if (isVoiceChatActiveRef.current && voiceStatusRef.current === 'listening' && !isRecognitionRunningRef.current) {
              startRecognition();
            }
          }, 150);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('SpeechRecognition initialization note:', err);
    }
  };

  // Фиксация и отправка сказанной фразы (с автопереходом на серверный Google Speech Engine v2)
  const commitVoicePhrase = async () => {
    if (voiceStatusRef.current !== 'listening' || isProcessingSTTRef.current) return;
    isProcessingSTTRef.current = true;
    cancelSilenceCommit();

    try {
      // 1. Проверяем, расшифровал ли браузерный Web Speech API
      const rawText = (liveTranscriptRef.current || finalTranscriptRef.current).trim();
      const browserText = cleanAndFormatTranscript(rawText);

      if (browserText && browserText.length >= 2 && !isNoiseOnly(browserText)) {
        liveTranscriptRef.current = '';
        finalTranscriptRef.current = '';
        setLiveTranscript('');
        hasSpokenInTurnRef.current = false;
        setIsUserTalking(false);
        handleVoiceQuerySubmit(browserText);
        return;
      }

      // 2. Если браузерный Web Speech API пустой (ошибка сети/Android WebView) — отправляем 16 kHz WAV в Google Speech Engine v2 бэкенда!
      let audioBlob: Blob | null = null;
      if (wavPcmChunksRef.current.length > 0 && audioCtxRef.current) {
        audioBlob = buildWav16kBlob(wavPcmChunksRef.current, audioCtxRef.current.sampleRate);
        wavPcmChunksRef.current = [];
      } else if (recordedVoiceChunksRef.current.length > 0) {
        const currentRec = voiceRecorderRef.current;
        const mime = currentRec?.mimeType || 'audio/webm';
        audioBlob = new Blob(recordedVoiceChunksRef.current, { type: mime });
        recordedVoiceChunksRef.current = [];
      }

      if (audioBlob && audioBlob.size > 400 && hasSpokenInTurnRef.current) {
        setIsTranscribingVoice(true);
        voiceStatusRef.current = 'thinking';
        setVoiceStatus('thinking');

        const formData = new FormData();
        const ext = audioBlob.type.includes('wav') ? 'speech.wav' : 'speech.webm';
        formData.append('audio', audioBlob, ext);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        try {
          const resp = await fetch(`${API_BASE_URL}/api/v1/speech/recognize`, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (resp.ok) {
            const data = await resp.json();
            const recognized = cleanAndFormatTranscript(String(data.text || ''));
            if (recognized && recognized.length >= 2 && !isNoiseOnly(recognized)) {
              setIsTranscribingVoice(false);
              liveTranscriptRef.current = '';
              finalTranscriptRef.current = '';
              setLiveTranscript('');
              hasSpokenInTurnRef.current = false;
              setIsUserTalking(false);
              handleVoiceQuerySubmit(recognized);
              return;
            }
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          console.warn('STT request error:', fetchErr);
        }
        setIsTranscribingVoice(false);
      }
    } catch (e) {
      console.warn('commitVoicePhrase error:', e);
      setIsTranscribingVoice(false);
    } finally {
      isProcessingSTTRef.current = false;
    }

    // Если в аудио была тишина/шум или распознавание не удалось — возвращаемся в режим прослушивания
    liveTranscriptRef.current = '';
    finalTranscriptRef.current = '';
    setLiveTranscript('');
    hasSpokenInTurnRef.current = false;
    setIsUserTalking(false);
    setIsTranscribingVoice(false);
    if (isVoiceChatActiveRef.current) {
      voiceStatusRef.current = 'listening';
      setVoiceStatus('listening');
      if (micStreamRef.current && (!voiceRecorderRef.current || voiceRecorderRef.current.state === 'inactive')) {
        startVoiceRecorder(micStreamRef.current);
      }
      if (!isMicMutedRef.current) {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch {}
          recognitionRef.current = null;
          isRecognitionRunningRef.current = false;
        }
        startRecognition();
      }
    }
  };

  const handleVoiceQuerySubmit = async (spokenText: string) => {
    if (!spokenText.trim() || !chat) return;

    cancelSilenceCommit();
    voiceStatusRef.current = 'thinking';
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    finalTranscriptRef.current = '';
    liveTranscriptRef.current = '';
    setLiveTranscript('');
    hasSpokenInTurnRef.current = false;
    setIsUserTalking(false);

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      text: spokenText,
      fromMe: true,
      time: formatTime(),
      status: 'sent',
    };

    const currentMsgs = messagesRef.current;
    const updatedMessages = [...currentMsgs, newMsg];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
    saveMessages(updatedMessages);

    setVoiceStatus('thinking');
    setIsAiTyping(true);

    const history = updatedMessages.map(m => ({
      role: m.fromMe ? 'user' : 'assistant',
      text: String(m.text || ''),
    }));

    try {
      const replyText = await fetchAiReply(spokenText, history, true);
      setIsAiTyping(false);

      const reply: Message = {
        id: `msg_ai_${Date.now()}`,
        text: replyText,
        fromMe: false,
        time: formatTime(),
        status: 'read',
      };

      const withReply = [...messagesRef.current, reply];
      messagesRef.current = withReply;
      setMessages(withReply);
      saveMessages(withReply);

      if (isVoiceChatActiveRef.current) {
        voiceStatusRef.current = 'speaking';
        setVoiceStatus('speaking');
        speakAloud(replyText, () => {
          if (isVoiceChatActiveRef.current) {
            cancelSilenceCommit();
            voiceStatusRef.current = 'listening';
            setVoiceStatus('listening');
            finalTranscriptRef.current = '';
            liveTranscriptRef.current = '';
            setLiveTranscript('');
            hasSpokenInTurnRef.current = false;
            setIsUserTalking(false);
            if (micStreamRef.current) {
              startVoiceRecorder(micStreamRef.current);
            }
            if (!isMicMutedRef.current) {
              startRecognition();
            }
          } else {
            setVoiceStatus('idle');
          }
        });
      }
    } catch (err) {
      setIsAiTyping(false);
      if (isVoiceChatActiveRef.current) {
        cancelSilenceCommit();
        voiceStatusRef.current = 'listening';
        setVoiceStatus('listening');
        finalTranscriptRef.current = '';
        liveTranscriptRef.current = '';
        setLiveTranscript('');
        hasSpokenInTurnRef.current = false;
        setIsUserTalking(false);
        if (micStreamRef.current) {
          startVoiceRecorder(micStreamRef.current);
        }
        startRecognition();
      }
    }
  };

  const VOICE_GREETINGS = [
    'Привет! Я рядом и слушаю тебя. О чём поговорим?',
    'Здравствуй! Рад тебя слышать. Расскажи, что у тебя на душе?',
    'Привет, я на связи. Говори свободно — я внимательно слушаю.',
  ];

  const startVoiceChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;
      startMicLevel(stream);
      startVoiceRecorder(stream);
      isVoiceChatActiveRef.current = true;
      setIsVoiceChatActive(true);
      cancelSilenceCommit();
      setLiveTranscript('');
      liveTranscriptRef.current = '';
      finalTranscriptRef.current = '';
      currentVoiceQueryRef.current = '';
      hasSpokenInTurnRef.current = false;
      setIsUserTalking(false);

      // Оракул сам начинает живой разговор — приветствие голосом + в текст
      const greeting = VOICE_GREETINGS[Math.floor(Math.random() * VOICE_GREETINGS.length)];
      const greetMsg: Message = {
        id: `msg_ai_${Date.now()}`,
        text: greeting,
        fromMe: false,
        time: formatTime(),
        status: 'read',
      };
      const withGreet = [...messagesRef.current, greetMsg];
      setVoiceSessionStart(messagesRef.current.length);
      messagesRef.current = withGreet;
      setMessages(withGreet);
      saveMessages(withGreet);

      setVoiceStatus('speaking');
      voiceStatusRef.current = 'speaking';
      speakAloud(greeting, () => {
        if (!isVoiceChatActiveRef.current) return;
        cancelSilenceCommit();
        setVoiceStatus('listening');
        voiceStatusRef.current = 'listening';
        hasSpokenInTurnRef.current = false;
        setIsUserTalking(false);
        if (micStreamRef.current) {
          startVoiceRecorder(micStreamRef.current);
        }
        if (!isMicMutedRef.current) startRecognition();
      });
    } catch (err) {
      console.error('Mic permission error:', err);
      alert('Для голосового общения необходим доступ к микрофону. Пожалуйста, разрешите микрофон в настройках браузера.');
    }
  };

  const stopVoiceChat = () => {
    cancelSilenceCommit();
    isRecognitionRunningRef.current = false;
    isVoiceChatActiveRef.current = false;
    setIsVoiceChatActive(false);
    setVoiceStatus('idle');
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    setAiSpeechText('');
    setAiSpeechCharIdx(0);
    finalTranscriptRef.current = '';
    currentVoiceQueryRef.current = '';
    hasSpokenInTurnRef.current = false;
    isProcessingSTTRef.current = false;
    setIsUserTalking(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (voiceRecorderRef.current) {
      try {
        voiceRecorderRef.current.stop();
      } catch {}
      voiceRecorderRef.current = null;
    }
    recordedVoiceChunksRef.current = [];
    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.currentTime = 0;
      } catch {}
      ttsAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    stopMicLevel();
  };

  const toggleVoiceChat = () => {
    if (isVoiceChatActive) {
      stopVoiceChat();
    } else {
      startVoiceChat();
    }
  };

  const interruptAiSpeech = () => {
    cancelSilenceCommit();
    voiceStatusRef.current = 'listening';
    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.currentTime = 0;
      } catch {}
      ttsAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAiSpeechCharIdx(aiSpeechText.length);
    setVoiceStatus('listening');
    hasSpokenInTurnRef.current = false;
    setIsUserTalking(false);
    liveTranscriptRef.current = '';
    finalTranscriptRef.current = '';
    setLiveTranscript('');
    if (micStreamRef.current) {
      startVoiceRecorder(micStreamRef.current);
    }
    if (!isMicMuted) {
      startRecognition();
    }
  };

  const toggleMicMute = () => {
    setIsMicMuted(prev => {
      const next = !prev;
      if (next) {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
        }
      } else {
        if (isVoiceChatActive && voiceStatus === 'listening') {
          startRecognition();
        }
      }
      return next;
    });
  };

  const toggleSpeakerLoud = () => {
    setIsSpeakerLoud(prev => {
      const next = !prev;
      if (ttsAudioRef.current) {
        ttsAudioRef.current.volume = next ? 1.0 : 0.45;
      }
      return next;
    });
  };

  const toggleSpeakMessage = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      if (ttsAudioRef.current) {
        try { ttsAudioRef.current.pause(); } catch {}
        ttsAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMsgId(null);
      return;
    }

    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); } catch {}
      ttsAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(msgId);

    const clean = cleanTextForSpeech(text);
    if (!clean) {
      setSpeakingMsgId(null);
      return;
    }

    const fallbackSpeak = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(clean);
        utter.volume = isSpeakerLoud ? 1.0 : 0.5;
        utter.rate = 1.0;
        utter.pitch = 1.02;
        const voice = getBestVoice(availableVoices);
        if (voice) utter.voice = voice;
        utter.onend = () => setSpeakingMsgId(null);
        utter.onerror = () => setSpeakingMsgId(null);
        window.speechSynthesis.speak(utter);
      } else {
        setSpeakingMsgId(null);
      }
    };

    try {
      const ttsUrl = `${API_BASE_URL}/api/ai/tts?text=${encodeURIComponent(clean)}&lang=ru&voice=Sulafat`;
      const audio = new Audio(ttsUrl);
      audio.volume = isSpeakerLoud ? 1.0 : 0.5;
      ttsAudioRef.current = audio;

      audio.onended = () => {
        setSpeakingMsgId(null);
        ttsAudioRef.current = null;
      };

      audio.onerror = () => {
        ttsAudioRef.current = null;
        fallbackSpeak();
      };

      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {
          ttsAudioRef.current = null;
          fallbackSpeak();
        });
      }
    } catch {
      ttsAudioRef.current = null;
      fallbackSpeak();
    }
  };

  // --- Перевод сообщений и озвучка на разных языках мира ---
  const toggleTranslateMessage = async (msgId: string, text: string, targetLang?: string) => {
    const current = msgTranslations[msgId];
    const lang = targetLang || current?.targetLang || userPreferredLang || 'en';

    if (current?.isOpen && (!targetLang || targetLang === current.targetLang)) {
      if (speakingTransId === msgId && stopTransSpeechRef.current) {
        stopTransSpeechRef.current();
        stopTransSpeechRef.current = null;
        setSpeakingTransId(null);
      }
      setMsgTranslations(prev => ({
        ...prev,
        [msgId]: { ...prev[msgId], isOpen: false }
      }));
      return;
    }

    setMsgTranslations(prev => ({
      ...prev,
      [msgId]: {
        targetLang: lang,
        translatedText: prev[msgId]?.targetLang === lang ? prev[msgId].translatedText : '',
        isLoading: prev[msgId]?.targetLang !== lang || !prev[msgId]?.translatedText,
        isOpen: true,
        isSpeaking: false,
        showAllLangs: false,
      }
    }));

    try {
      const res = await translateText(text, lang);
      setMsgTranslations(prev => ({
        ...prev,
        [msgId]: {
          targetLang: lang,
          translatedText: res.text,
          sourceLang: res.from,
          isLoading: false,
          isOpen: true,
          isSpeaking: false,
          showAllLangs: false,
        }
      }));
      setUserPreferredLang(lang);
    } catch {
      setMsgTranslations(prev => ({
        ...prev,
        [msgId]: {
          ...prev[msgId],
          isLoading: false,
          translatedText: 'Ошибка перевода. Попробуйте еще раз.',
        }
      }));
    }
  };

  const toggleSpeakTranslation = (msgId: string, text: string, langCode: string) => {
    if (speakingTransId === msgId) {
      if (stopTransSpeechRef.current) {
        stopTransSpeechRef.current();
        stopTransSpeechRef.current = null;
      }
      setSpeakingTransId(null);
      setMsgTranslations(prev => ({
        ...prev,
        [msgId]: { ...prev[msgId], isSpeaking: false }
      }));
      return;
    }

    if (stopTransSpeechRef.current) {
      stopTransSpeechRef.current();
      stopTransSpeechRef.current = null;
    }
    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); } catch {}
      ttsAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);

    setSpeakingTransId(msgId);
    setMsgTranslations(prev => ({
      ...prev,
      [msgId]: { ...prev[msgId], isSpeaking: true }
    }));

    const cancelFn = playVoiceSpeech(text, langCode, {
      isSpeakerLoud,
      onStart: () => {
        setMsgTranslations(prev => ({
          ...prev,
          [msgId]: { ...prev[msgId], isSpeaking: true }
        }));
      },
      onEnd: () => {
        setSpeakingTransId(null);
        setMsgTranslations(prev => ({
          ...prev,
          [msgId]: { ...prev[msgId], isSpeaking: false }
        }));
        stopTransSpeechRef.current = null;
      },
      onError: () => {
        setSpeakingTransId(null);
        setMsgTranslations(prev => ({
          ...prev,
          [msgId]: { ...prev[msgId], isSpeaking: false }
        }));
        stopTransSpeechRef.current = null;
      }
    });

    stopTransSpeechRef.current = cancelFn;
  };

  const handleCopyTranslation = (msgId: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setMsgTranslations(prev => ({
      ...prev,
      [msgId]: { ...prev[msgId], copied: true }
    }));
    setTimeout(() => {
      setMsgTranslations(prev => ({
        ...prev,
        [msgId]: { ...prev[msgId], copied: false }
      }));
    }, 2000);
  };

  const handleQuickTranslate = async (langOverride?: string) => {
    const lang = langOverride || quickTransTarget || 'en';
    if (!quickTransText.trim()) return;
    setQuickTransLoading(true);
    setQuickTransTarget(lang);
    try {
      const res = await translateText(quickTransText, lang);
      setQuickTransResult(res.text);
    } catch {
      setQuickTransResult('Ошибка перевода');
    } finally {
      setQuickTransLoading(false);
    }
  };

  const handleQuickTranslateSpeak = () => {
    if (!quickTransResult.trim()) return;
    if (quickTransSpeaking) {
      if (stopQuickSpeechRef.current) {
        stopQuickSpeechRef.current();
        stopQuickSpeechRef.current = null;
      }
      setQuickTransSpeaking(false);
      return;
    }

    if (stopQuickSpeechRef.current) {
      stopQuickSpeechRef.current();
    }
    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); } catch {}
      ttsAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setQuickTransSpeaking(true);
    const cancelFn = playVoiceSpeech(quickTransResult, quickTransTarget, {
      isSpeakerLoud,
      onStart: () => setQuickTransSpeaking(true),
      onEnd: () => {
        setQuickTransSpeaking(false);
        stopQuickSpeechRef.current = null;
      },
      onError: () => {
        setQuickTransSpeaking(false);
        stopQuickSpeechRef.current = null;
      }
    });
    stopQuickSpeechRef.current = cancelFn;
  };

  if (!chat) {


    return (


      <div className="cw-empty">


        <div className="cw-empty-icon">💬</div>


        <h2 className="cw-empty-title">Выберите диалог</h2>


        <p className="cw-empty-subtitle">Выберите чат из списка слева или создайте новый для начала общения</p>


      </div>


    );


  }





  const isAi = chat.id === 'chat_ai_oracle' || chat.id === 'ai_guru_bot';


  const chatName = String(chat.groupTitle || chat.user?.name || 'Чат');


  const chatAvatar = String(chat.groupAvatar || chat.user?.avatar || '');


  const isOnline = isAi || Boolean(chat.user?.online);

  const handleSend = () => {


    const text = inputValue.trim();


    if (!text) return;





    const newMsg: Message = {


      id: `msg_${Date.now()}`,


      text: replyTo ? text : text,


      fromMe: true,


      time: formatTime(),


      status: 'sent',


      replyToId: replyTo?.id,


      replyToText: replyTo ? String(replyTo.text || '').slice(0, 60) : undefined,


    };





    const updatedMessages = [...messages, newMsg];


    setMessages(updatedMessages);


    setInputValue('');


    setReplyTo(null);


    setShowEmoji(false);


    saveMessages(updatedMessages);





    setTimeout(() => {


      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' as const } : m));


    }, 500);


    setTimeout(() => {


      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'read' as const } : m));


    }, 1500);





    if (isAi) {


      const history = [...messages, newMsg].map(m => ({


        role: m.fromMe ? 'user' : 'assistant',


        text: String(m.text || ''),


      }));


      setIsAiTyping(true);
      window.dispatchEvent(new CustomEvent('chat_typing_status', { detail: { chatId: chat.id, isTyping: true } }));
      if (onUpdateChat) {
        onUpdateChat(chat.id, { isTyping: true });
      }

      fetchAiReply(text, history).then(replyText => {
        const reply: Message = {
          id: `msg_ai_${Date.now()}`,
          text: replyText,
          fromMe: false,
          time: formatTime(),
          status: 'read',
        };
        setMessages(prev => {
          const updated = [...prev, reply];
          saveMessages(updated);
          return updated;
        });
        setIsAiTyping(false);
        window.dispatchEvent(new CustomEvent('chat_typing_status', { detail: { chatId: chat.id, isTyping: false } }));
        if (onUpdateChat) {
          onUpdateChat(chat.id, { isTyping: false });
        }
      }).catch(() => {
        setIsAiTyping(false);
        window.dispatchEvent(new CustomEvent('chat_typing_status', { detail: { chatId: chat.id, isTyping: false } }));
        if (onUpdateChat) {
          onUpdateChat(chat.id, { isTyping: false });
        }
      });
    }


    inputRef.current?.focus();


  };





  const handleKeyDown = (e: React.KeyboardEvent) => {


    if (e.key === 'Enter' && !e.shiftKey) {


      e.preventDefault();


      handleSend();


    }


    if (e.key === 'Escape') {


      setReplyTo(null);


      setShowEmoji(false);


    }


  };





  // Context menu


  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {


    e.preventDefault();


    setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, msg });


  };





  const handleCopy = () => {


    if (ctxMenu.msg?.text) {


      navigator.clipboard.writeText(String(ctxMenu.msg.text));


    }


    setCtxMenu({ visible: false, x: 0, y: 0, msg: null });


  };





  const handleReply = () => {


    if (ctxMenu.msg) {


      setReplyTo(ctxMenu.msg);


      inputRef.current?.focus();


    }


    setCtxMenu({ visible: false, x: 0, y: 0, msg: null });


  };





  const handleDeleteMsg = () => {


    if (ctxMenu.msg) {


      const updated = messages.filter(m => m.id !== ctxMenu.msg!.id);


      setMessages(updated);


      saveMessages(updated);


    }


    setCtxMenu({ visible: false, x: 0, y: 0, msg: null });


  };





  const handleEmojiClick = (emoji: string) => {


    setInputValue(prev => prev + emoji);


    inputRef.current?.focus();


  };





  return (


    <div className="cw-container">


      {/* Header */}


      <div className="cw-header">


        <button onClick={onBack} className="cw-back-btn">


          <ArrowLeft size={22} />


        </button>


        <div className="cw-avatar-wrap">


          {chatAvatar ? (


            <img src={chatAvatar} alt={chatName} className="cw-avatar-img" />


          ) : (


            <div className={`cw-avatar-placeholder ${isAi ? 'ai' : ''}`}>


              {chatName.charAt(0)}


            </div>


          )}


          {!chat.isGroup && (
            <div 
              className={`cw-online-dot ${isOnline ? 'is-online' : 'is-offline'}`} 
              title={isOnline ? 'В сети' : (chat.user?.lastSeenText || formatLastSeen(chat.user?.lastSeen, false, chat.user?.lastSeenText))} 
            />
          )}

        </div>

        <div className="cw-header-info">
          <div className="cw-header-name">
            <span className="cw-header-name-text">{chatName}</span>
            {isAi && <span className="cw-ai-badge">AI</span>}
          </div>
          <div className={`cw-header-status ${isOnline ? 'online' : ''}`}>
            {isAi ? (isAiTyping ? 'печатает...' : 'на связи') : isOnline ? 'в сети' : (chat.user?.lastSeenText || formatLastSeen(chat.user?.lastSeen, false, chat.user?.lastSeenText))}
          </div>
        </div>

        <div className="cw-header-actions">
          {isAi ? (
            <button 
              className={`cw-voice-header-btn ${isVoiceChatActive ? 'active' : ''}`}
              onClick={toggleVoiceChat}
              title={isVoiceChatActive ? "Закончить голосовой разговор" : "Голосовой разговор на громкой связи"}
            >
              {isVoiceChatActive ? <VolumeX size={17} /> : <Volume2 size={17} className="pulse-anim" />}
              <span className="cw-voice-header-label">{isVoiceChatActive ? 'Стоп' : 'Голос'}</span>
            </button>
          ) : (
            <>
              <button className="cw-action-btn"><Phone size={18} /></button>
              <button className="cw-action-btn"><Video size={18} /></button>
            </>
          )}
          <button className="cw-action-btn"><MoreVertical size={18} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="cw-messages">
        {isAi && (
          <div className="cw-voice-banner">
            <div className="cw-voice-banner-left">
              <div className="cw-voice-banner-icon">
                <Sparkles size={20} />
              </div>
              <div className="cw-voice-banner-info">
                <div className="cw-voice-banner-title">Голосовой разговор с Оракулом (транскрипция в текст)</div>
                <div className="cw-voice-banner-sub">Общайтесь вслух на громкой связи: ваши слова и ответы Оракула сохраняются в чат</div>
              </div>
            </div>
            <button 
              className={`cw-voice-banner-btn ${isVoiceChatActive ? 'active' : ''}`}
              onClick={toggleVoiceChat}
            >
              {isVoiceChatActive ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{isVoiceChatActive ? 'Закончить разговор' : 'Начать разговор'}</span>
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="cw-no-messages">
            <div className="cw-no-messages-icon">💬</div>
            <div className="cw-no-messages-title">Здесь пока нет сообщений</div>
            <div className="cw-no-messages-sub">Отправьте первое сообщение, чтобы начать диалог</div>
          </div>
        ) : (


          messages.map((msg) => {


            if (!msg || typeof msg !== 'object') return null;


            const isMe = Boolean(msg.fromMe);


            const text = String(msg.text || '');


            const time = String(msg.time || '');


            const status = String(msg.status || 'sent');





            // Find reply-to message


            const replyMsg = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;


            const replyPreview = msg.replyToText || (replyMsg ? String(replyMsg.text || '').slice(0, 60) : null);





            return (


              <div


                key={String(msg.id)}


                className={`cw-msg-row ${isMe ? 'outgoing' : 'incoming'}`}


                onContextMenu={(e) => handleContextMenu(e, msg)}


              >


                <div className={`cw-bubble ${isMe ? 'me' : 'them'}`}>


                  {replyPreview && (


                    <div className="cw-reply-preview">


                      <div className="cw-reply-bar" />


                      <div className="cw-reply-text">{replyPreview}</div>


                    </div>


                  )}


                  


                                    {msg.mediaType === 'image' && msg.mediaUrl && (


                    <img src={msg.mediaUrl} alt="Attachment" style={{maxWidth: '100%', borderRadius: '8px', marginBottom: '4px'}} />


                  )}


                  {msg.mediaType === 'video' && msg.mediaUrl && (


                    <video src={msg.mediaUrl} controls style={{maxWidth: '100%', borderRadius: '8px', marginBottom: '4px'}} />


                  )}


                  {msg.mediaType === 'video_note' && msg.mediaUrl && (


                    <div style={{width: '240px', height: '240px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 4px auto', position: 'relative', background: '#000'}}>


                      <video src={msg.mediaUrl} autoPlay loop muted playsInline style={{width: '100%', height: '100%', objectFit: 'cover'}} />


                    </div>


                  )}


                  {msg.mediaType === 'voice' ? (
                    <VoiceMessageBubble msg={msg} isMe={isMe} />
                  ) : (
                    text && <div className="cw-bubble-text">{text}</div>
                  )}

                  {/* Карточка перевода на разные языки мира + озвучка в виде голосового */}
                  {text && msgTranslations[msg.id]?.isOpen && (
                    <div className="cw-trans-box">
                      <div className="cw-trans-header">
                        <div className="cw-trans-lang-active">
                          <Globe size={13} className="cw-trans-globe-icon" />
                          <span className="cw-trans-lang-name">
                            {WORLD_LANGUAGES.find(l => l.code === msgTranslations[msg.id].targetLang)?.flag}{' '}
                            {WORLD_LANGUAGES.find(l => l.code === msgTranslations[msg.id].targetLang)?.name}
                          </span>
                        </div>
                        <div className="cw-trans-header-actions">
                          <button
                            type="button"
                            className="cw-trans-more-langs-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMsgTranslations(prev => ({
                                ...prev,
                                [msg.id]: { ...prev[msg.id], showAllLangs: !prev[msg.id]?.showAllLangs }
                              }));
                            }}
                            title="Сменить язык перевода"
                          >
                            <span>{msgTranslations[msg.id].showAllLangs ? 'Скрыть список' : 'Выбрать язык'}</span>
                            <ChevronDown size={12} className={msgTranslations[msg.id].showAllLangs ? 'cw-rot-180' : ''} />
                          </button>
                          <button
                            type="button"
                            className="cw-trans-close-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTranslateMessage(msg.id, text);
                            }}
                            title="Закрыть перевод"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Быстрые чипы популярных языков */}
                      <div className="cw-trans-chips">
                        {POPULAR_LANG_CODES.map(c => {
                          const langObj = WORLD_LANGUAGES.find(l => l.code === c);
                          if (!langObj) return null;
                          const isActive = msgTranslations[msg.id].targetLang === c;
                          return (
                            <button
                              key={c}
                              type="button"
                              className={`cw-trans-chip ${isActive ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTranslateMessage(msg.id, text, c);
                              }}
                            >
                              <span>{langObj.flag}</span>
                              <span>{langObj.code.toUpperCase()}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Полный список всех языков мира */}
                      {msgTranslations[msg.id].showAllLangs && (
                        <div className="cw-trans-all-langs">
                          {WORLD_LANGUAGES.map(lang => (
                            <button
                              key={lang.code}
                              type="button"
                              className={`cw-trans-lang-opt ${msgTranslations[msg.id].targetLang === lang.code ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTranslateMessage(msg.id, text, lang.code);
                              }}
                            >
                              <span className="cw-lang-flag">{lang.flag}</span>
                              <span className="cw-lang-name">{lang.name}</span>
                              <span className="cw-lang-native">({lang.nativeName})</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Текст перевода */}
                      <div className="cw-trans-body">
                        {msgTranslations[msg.id].isLoading ? (
                          <div className="cw-trans-loading">
                            <span className="cw-trans-spinner" />
                            <span>Перевожу на {WORLD_LANGUAGES.find(l => l.code === msgTranslations[msg.id].targetLang)?.name || 'язык'}... ⚡</span>
                          </div>
                        ) : (
                          <div className="cw-trans-text">{msgTranslations[msg.id].translatedText}</div>
                        )}
                      </div>

                      {/* Нижняя панель действий: Голосовое воспроизведение + Копирование */}
                      {!msgTranslations[msg.id].isLoading && msgTranslations[msg.id].translatedText && (
                        <div className="cw-trans-footer">
                          <button
                            type="button"
                            className={`cw-trans-voice-btn ${speakingTransId === msg.id ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSpeakTranslation(msg.id, msgTranslations[msg.id].translatedText, msgTranslations[msg.id].targetLang);
                            }}
                            title={speakingTransId === msg.id ? "Остановить голосовое" : "Слушать перевод в виде голосового"}
                          >
                            {speakingTransId === msg.id ? (
                              <>
                                <VolumeX size={14} />
                                <span>Остановить</span>
                                <span className="cw-voice-equalizer">
                                  <i /><i /><i /><i />
                                </span>
                              </>
                            ) : (
                              <>
                                <Volume2 size={14} />
                                <span>Слушать голосовое ({msgTranslations[msg.id].targetLang.toUpperCase()})</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            className="cw-trans-copy-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyTranslation(msg.id, msgTranslations[msg.id].translatedText);
                            }}
                            title="Скопировать переведенный текст"
                          >
                            {msgTranslations[msg.id].copied ? (
                              <>
                                <Check size={13} style={{ color: '#10b981' }} />
                                <span style={{ color: '#10b981' }}>Скопировано</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Копия</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="cw-bubble-meta">
                    {text && (
                      <>
                        <button 
                          type="button"
                          className={`cw-bubble-trans-btn ${msgTranslations[msg.id]?.isOpen ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleTranslateMessage(msg.id, text); }}
                          title={msgTranslations[msg.id]?.isOpen ? "Скрыть перевод" : "Перевести на языки мира и послушать в виде голосового"}
                        >
                          <Globe size={13} />
                        </button>

                        <button 
                          type="button"
                          className={`cw-bubble-speak-btn ${speakingMsgId === msg.id ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleSpeakMessage(msg.id, text); }}
                          title={speakingMsgId === msg.id ? "Остановить озвучку" : "Озвучить оригинал голосом"}
                        >
                          {speakingMsgId === msg.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        </button>
                      </>
                    )}
                    <span className="cw-bubble-time">{time}</span>
                    {isMe && (
                      <span className={`cw-ticks ${status === 'read' ? 'read' : ''}`}>
                        {status === 'sent' ? '✓' : '✓✓'}
                      </span>
                    )}
                  </div>


                </div>


              </div>


            );


          })


        )}


        {isAiTyping && (


          <div className="cw-msg-row incoming">


            <div className="cw-bubble them cw-typing-bubble">


              <div className="cw-typing-dots">


                <span className="cw-dot" />


                <span className="cw-dot" />


                <span className="cw-dot" />


              </div>


            </div>


          </div>


        )}


        {/* Live speech transcription bubble in chat */}
        {isVoiceChatActive && liveTranscript && (
          <div className="cw-msg-row outgoing live-transcribing">
            <div className="cw-bubble me cw-bubble-live">
              <div className="cw-bubble-text">{liveTranscript}</div>
              <div className="cw-bubble-meta">
                <span className="cw-live-indicator">
                  <span className="cw-live-dot" />
                  транскрибация речи...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />


      </div>





      {/* Context Menu */}


      {ctxMenu.visible && (


        <div className="cw-ctx-menu" style={{ top: ctxMenu.y, left: ctxMenu.x }}>


          <button className="cw-ctx-item" onClick={handleReply}>


            <Reply size={16} /> Ответить


          </button>


          <button className="cw-ctx-item" onClick={handleCopy}>


            <Copy size={16} /> Копировать


          </button>


          <button className="cw-ctx-item" onClick={() => { if (ctxMenu.msg) { handleEmojiClick('❤️'); } setCtxMenu({ visible: false, x: 0, y: 0, msg: null }); }}>


            <span style={{ fontSize: 16 }}>❤️</span> Реакция


          </button>


          <button className="cw-ctx-item" onClick={() => setCtxMenu({ visible: false, x: 0, y: 0, msg: null })}>


            <Pin size={16} /> Закрепить


          </button>


          <button className="cw-ctx-item" onClick={() => setCtxMenu({ visible: false, x: 0, y: 0, msg: null })}>


            <Forward size={16} /> Переслать


          </button>


          <div className="cw-ctx-divider" />


          <button className="cw-ctx-item danger" onClick={handleDeleteMsg}>


            <Trash2 size={16} /> Удалить


          </button>


        </div>


      )}





      {/* Emoji Picker */}


      {showEmoji && (


        <div className="cw-emoji-picker">


          {EMOJI_LIST.map(e => (


            <button key={e} className="cw-emoji-btn" onClick={() => handleEmojiClick(e)}>{e}</button>


          ))}


        </div>


      )}





      {/* Reply preview bar */}


      {replyTo && (


        <div className="cw-reply-bar-input">


          <div className="cw-reply-bar" />


          <div className="cw-reply-info">


            <span className="cw-reply-name">{replyTo.fromMe ? 'Вы' : chatName}</span>


            <span className="cw-reply-preview-text">{String(replyTo.text || '').slice(0, 60)}</span>


          </div>


          <button className="cw-reply-close" onClick={() => setReplyTo(null)}>


            <X size={16} />


          </button>


        </div>


      )}





      {/* Живой голосовой разговор — полноэкранный фон поверх чата */}
      {isVoiceChatActive && (
        <div className={`cw-live-overlay status-${voiceStatus}`}>
          <div className="cw-live-bg">
            <span className="cw-live-blob b1" />
            <span className="cw-live-blob b2" />
            <span className="cw-live-blob b3" />
            <span className="cw-live-stars" />
          </div>

          <div className="cw-live-top">
            <div className="cw-live-top-info">
              <span className="cw-live-rec-dot" />
              <span className="cw-live-top-title">Живой разговор • {chatName}</span>
            </div>
            <button type="button" className="cw-live-close" onClick={stopVoiceChat} title="Закончить разговор">
              <X size={20} />
            </button>
          </div>

          <div className="cw-live-center">
            <div
              ref={voiceOrbRef}
              className={`cw-live-orb ${isUserTalking ? 'user-talking' : ''} ${silenceProgress > 0 ? 'silence-pending' : ''}`}
              onClick={voiceStatus === 'speaking' ? interruptAiSpeech : (voiceStatus === 'listening' ? commitVoicePhrase : undefined)}
              title={voiceStatus === 'speaking' ? 'Нажмите, чтобы перебить' : (liveTranscript ? 'Нажмите, чтобы отправить фразу прямо сейчас' : 'Говорите свободно')}
            >
              <span className="cw-live-ring r1" />
              <span className="cw-live-ring r2" />
              <span className="cw-live-ring r3" />
              <div className="cw-live-orb-core">
                <img src={chatAvatar || '/ai_avatar.jpg'} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
            </div>

            <div className="cw-live-status">
              {isTranscribingVoice && 'Распознаю голос… ⚡'}
              {!isTranscribingVoice && voiceStatus === 'listening' && (
                isMicMuted
                  ? 'Микрофон выключен'
                  : isUserTalking
                    ? 'Слышу вас… 🎙️'
                    : 'Слушаю вас…'
              )}
              {!isTranscribingVoice && voiceStatus === 'thinking' && 'Оракул думает… ⚡'}
              {!isTranscribingVoice && voiceStatus === 'speaking' && 'Оракул говорит'}
              {!isTranscribingVoice && voiceStatus === 'idle' && 'Подключение…'}
            </div>
            <div className="cw-live-hint">
              {isTranscribingVoice
                ? 'Нейросеть переводит речь в текст…'
                : voiceStatus === 'speaking'
                  ? 'Нажмите на шар, чтобы перебить'
                  : voiceStatus === 'thinking'
                    ? 'Оракул читает и отвечает…'
                    : voiceStatus === 'listening' && !isMicMuted
                      ? isUserTalking
                        ? 'Слышу вас… Говорите свободно 🎙️'
                        : 'Говорите свободно — слова сразу переносятся в текст и передаются Оракулу'
                      : '\u00A0'}
            </div>
          </div>

          {/* Расшифровка всего разговора в текст */}
          <div className="cw-live-transcript">
            {messages.slice(voiceSessionStart).map((m, i, arr) => {
              const isLastAi = !m.fromMe && i === arr.length - 1 && voiceStatus === 'speaking' && aiSpeechText;
              return (
                <div key={String(m.id)} className={`cw-live-line ${m.fromMe ? 'me' : 'ai'}`}>
                  <span className="cw-live-who">{m.fromMe ? 'Вы' : 'Оракул'}</span>
                  <span className="cw-live-text">
                    {isLastAi ? (
                      <>
                        <span className="spoken">{aiSpeechText.slice(0, aiSpeechCharIdx)}</span>
                        <span className="pending">{aiSpeechText.slice(aiSpeechCharIdx)}</span>
                      </>
                    ) : String(m.text || '')}
                  </span>
                </div>
              );
            })}
            {isTranscribingVoice && (
              <div className="cw-live-line me live">
                <span className="cw-live-who">Вы</span>
                <span className="cw-live-text" style={{ fontStyle: 'italic', opacity: 0.85 }}>⚡ Распознаю речь...</span>
              </div>
            )}
            {!isTranscribingVoice && voiceStatus === 'thinking' && (
              <div className="cw-live-line ai">
                <span className="cw-live-who">Оракул</span>
                <span className="cw-live-text"><span className="cw-live-thinking"><i /><i /><i /></span></span>
              </div>
            )}
            {liveTranscript && (
              <div className="cw-live-line me live">
                <span className="cw-live-who">Вы</span>
                <span className="cw-live-text">{liveTranscript}<span className="cw-live-caret" /></span>
              </div>
            )}
            <div ref={voiceTranscriptEndRef} />
          </div>

          <div className="cw-live-controls">
            <button
              type="button"
              className={`cw-live-btn ${isMicMuted ? 'off' : ''}`}
              onClick={toggleMicMute}
              title={isMicMuted ? 'Включить микрофон' : 'Выключить микрофон'}
            >
              {isMicMuted ? <MicOff size={22} /> : <Mic size={22} />}
              <span>{isMicMuted ? 'Вкл. микрофон' : 'Микрофон'}</span>
            </button>

            {voiceStatus === 'speaking' && (
              <button
                type="button"
                className="cw-live-btn send-now"
                onClick={interruptAiSpeech}
                title="Перебить и сказать самому"
              >
                <Sparkles size={22} />
                <span>Перебить</span>
              </button>
            )}

            <button type="button" className="cw-live-btn end" onClick={stopVoiceChat} title="Закончить разговор">
              <VolumeX size={24} />
              <span>Закончить разговор</span>
            </button>

            <button
              type="button"
              className={`cw-live-btn ${isSpeakerLoud ? 'on' : ''}`}
              onClick={toggleSpeakerLoud}
              title="Громкая связь"
            >
              {isSpeakerLoud ? <Volume2 size={22} /> : <Volume1 size={22} />}
              <span>{isSpeakerLoud ? 'Громкая' : 'Тихо'}</span>
            </button>
          </div>
        </div>
      )}
      {/* Быстрый переводчик любого текста с голосовой озвучкой */}
      {showQuickTranslator && (
        <div className="cw-quick-translator-panel">
          <div className="cw-quick-trans-header">
            <div className="cw-quick-trans-title">
              <Languages size={17} className="cw-trans-title-icon" />
              <span>Переводчик языков мира и голосовая озвучка</span>
            </div>
            <button
              type="button"
              className="cw-quick-trans-close"
              onClick={() => {
                if (stopQuickSpeechRef.current) {
                  stopQuickSpeechRef.current();
                  stopQuickSpeechRef.current = null;
                }
                setQuickTransSpeaking(false);
                setShowQuickTranslator(false);
              }}
              title="Закрыть переводчик"
            >
              <X size={16} />
            </button>
          </div>

          <div className="cw-quick-trans-row">
            <input
              type="text"
              className="cw-quick-trans-input"
              value={quickTransText}
              onChange={(e) => setQuickTransText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleQuickTranslate(); }}
              placeholder="Введите или вставьте текст для перевода..."
            />
            <button
              type="button"
              className="cw-quick-trans-action-btn"
              onClick={() => handleQuickTranslate()}
              disabled={quickTransLoading || !quickTransText.trim()}
            >
              {quickTransLoading ? '...' : 'Перевести'}
            </button>
          </div>

          <div className="cw-quick-trans-langs">
            {POPULAR_LANG_CODES.map((c) => {
              const langObj = WORLD_LANGUAGES.find((l) => l.code === c);
              if (!langObj) return null;
              const isActive = quickTransTarget === c;
              return (
                <button
                  key={c}
                  type="button"
                  className={`cw-quick-lang-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleQuickTranslate(c)}
                >
                  <span>{langObj.flag}</span>
                  <span>{langObj.name}</span>
                </button>
              );
            })}
          </div>

          {quickTransResult && (
            <div className="cw-quick-trans-result-card">
              <div className="cw-quick-trans-result-text">{quickTransResult}</div>
              <div className="cw-quick-trans-result-actions">
                <button
                  type="button"
                  className={`cw-quick-voice-btn ${quickTransSpeaking ? 'active' : ''}`}
                  onClick={handleQuickTranslateSpeak}
                  title={quickTransSpeaking ? 'Остановить голосовое' : 'Послушать голосовое'}
                >
                  {quickTransSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  <span>{quickTransSpeaking ? 'Остановить' : `Послушать (${quickTransTarget.toUpperCase()})`}</span>
                  {quickTransSpeaking && (
                    <span className="cw-voice-equalizer">
                      <i /><i /><i /><i />
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  className="cw-quick-use-btn"
                  onClick={() => {
                    setInputValue(quickTransResult);
                    setShowQuickTranslator(false);
                    inputRef.current?.focus();
                  }}
                  title="Вставить перевод в поле ввода сообщения"
                >
                  <Send size={14} />
                  <span>Вставить в чат</span>
                </button>

                <button
                  type="button"
                  className="cw-quick-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(quickTransResult);
                    setQuickTransCopied(true);
                    setTimeout(() => setQuickTransCopied(false), 2000);
                  }}
                  title="Скопировать"
                >
                  {quickTransCopied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Input */}


      <div className="cw-input-bar">


        


        <button className="cw-input-icon" onClick={() => setShowEmoji(!showEmoji)}>


          <Smile size={22} />


        </button>


        <button className="cw-input-icon" onClick={() => fileInputRef.current?.click()}>


          <Paperclip size={20} />


        </button>

        <button 
          type="button"
          className={`cw-input-icon ${showQuickTranslator ? 'active' : ''}`} 
          onClick={() => {
            if (!showQuickTranslator && inputValue.trim()) {
              setQuickTransText(inputValue.trim());
            }
            setShowQuickTranslator(!showQuickTranslator);
          }}
          title="Переводчик на разные языки мира и голосовая озвучка"
        >
          <Languages size={20} />
        </button>


        <input 


          type="file" 


          ref={fileInputRef} 


          style={{display: 'none'}} 


          accept="image/*,video/*" 


          onChange={handleFileUpload} 


        />


        


        {isRecording ? (


          <div style={{flex: 1, padding: '10px 16px', color: '#ff3b30', fontWeight: 'bold', animation: 'pulse 1s infinite'}}>


            ...


          </div>


        ) : (


          <input


            ref={inputRef}


            type="text"


            value={inputValue}


            onChange={e => setInputValue(e.target.value)}


            onKeyDown={handleKeyDown}


            placeholder="Сообщение..."


            className="cw-input"


          />


        )}





        


        {inputValue.trim() ? (


          <button


            onClick={handleSend}


            className="cw-send-btn active"


          >


            <Send size={20} />


          </button>


        ) : isAi ? (
          <button 
            type="button"
            className={`cw-voice-input-btn ${isVoiceChatActive ? 'active' : ''}`}
            onClick={toggleVoiceChat}
            title={isVoiceChatActive ? "Закончить голосовой разговор" : "Голосовой диалог на громкой связи"}
          >
            {isVoiceChatActive ? <VolumeX size={20} /> : <Mic size={20} />}
          </button>
        ) : (
          <>
            <button className="cw-input-icon" onClick={handleVoiceRecord} disabled={isRecording}>
              <Mic size={20} />
            </button>
            <button className="cw-input-icon" onClick={handleVideoRecord} disabled={isRecording}>
              <Video size={20} />
            </button>
          </>
        )}


      </div>


    </div>





  );


}






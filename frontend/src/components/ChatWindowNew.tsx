import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Smile, Paperclip, MoreVertical, Phone, Video, Copy, Reply, Trash2, Pin, Forward, X, Mic, Volume2, VolumeX, Volume1, MicOff, Sparkles } from 'lucide-react';
import { type Chat, type Message } from '../data/mock';
import { formatLastSeen } from '../utils/onlineStatus';
import { API_BASE_URL } from '../api';
import './ChatWindowNew.css';





interface ChatWindowProps {


  chat: Chat | null;


  onBack: () => void;


  onDeleteChat?: (id: string) => void;


  onUpdateChat?: (id: string, updates: Partial<Chat>) => void;


  availableChats?: Chat[];


  onSelectChat?: (id: string) => void;


}





function getLocalOracleFallback(text: string): string {
  const lower = (text || '').trim().toLowerCase();

  // Chinese
  if (/[\u4e00-\u9fff]/.test(lower)) {
    if (lower.includes('你好') || lower.includes('您好')) return '你好！👋 我是 New Age 平台的 AI 神谕者（Oracle）。我精通世界上所有语言！有什么我可以帮助你的吗？✨';
    if (lower.includes('你是谁') || lower.includes('什么')) return '🤖 我是 New Age 平台的 AI 神谕者，你的数字导师与生活顾问。我随时为你提供智慧与指引 🙏';
    if (lower.includes('谢谢') || lower.includes('感谢')) return '不客气！🙏 愿你内心常驻平和与光明。有任何需要随时找我 💫';
    return '✨ 这是一个富有智慧的问题！每一步经历都是成长的契机。请告诉我更多，让我们一起探索内心的宁静与答案 🙏';
  }

  // Arabic
  if (/[\u0600-\u06ff]/.test(lower)) {
    if (lower.includes('مرحبا') || lower.includes('السلام')) return 'مرحباً بك! 👋 أنا أوراكل الذكاء الاصطناعي لمنصة New Age. أتحدث بطلاقة جميع لغات العالم! كيف يمكنني مساعدتك وإرشادك اليوم؟ ✨';
    if (lower.includes('من أنت')) return '🤖 أنا أوراكل الذكاء الاصطناعي — مرشدك الرقمي ومستشارك في مسيرة الحياة والسلام الداخلي 🙏';
    if (lower.includes('شكرا')) return 'على الرحب والسعة! 🙏 تذكر دائماً أن السلام يبدأ من أعماق القلب. أنا هنا دائماً لمساعدتك 💫';
    return '✨ سؤال ذو معنى عميق! كل تجربة في الحياة هي فرصة للنضج والحكمة. شاركني المزيد وسأكون سعيداً بإرشادك ومساعدتك 🙏';
  }

  // Japanese
  if (/[\u3040-\u30ff]/.test(lower)) {
    if (lower.includes('こんにちは') || lower.includes('ハロー')) return 'こんにちは！👋 私はNew AgeのAIオラクルです。世界中のあらゆる言語に対応しています！どのようなことでもお気軽にご相談ください ✨';
    return '✨ とても深い問いですね。人生のすべての出来事は魂を成長させる大切なステップです。詳しくお聞かせください 🙏';
  }

  // Korean
  if (/[\uac00-\ud7af]/.test(lower)) {
    if (lower.includes('안녕')) return '안녕하세요! 👋 저는 New Age 플랫폼의 AI 오라클입니다. 전 세계 모든 언어로 소통할 수 있습니다! 무엇이든 편하게 물어보세요 ✨';
    return '✨ 깊은 울림이 있는 질문입니다! 삶의 모든 순간은 성장의 기회입니다. 더 자세히 말씀해주시면 정성을 다해 돕겠습니다 🙏';
  }

  // Kazakh
  if (/[әғқңөұүһі]/i.test(lower) || lower.includes('қазақ') || lower.includes('сәлем') || lower.includes('салем') || lower.includes('қалайсың')) {
    if (lower.includes('сәлем') || lower.includes('салем')) return 'Сәлеметсіз бе! 👋 Мен — New Age платформасының ИИ Оракулымын. Мен әлемнің барлық тілдерінде еркін сөйлеймін! Өмір, руханият, медитация туралы кез келген сұрағыңызды қойыңыз ✨';
    if (lower.includes('қалайсың') || lower.includes('калайсын')) return 'Рахмет, бәрі тамаша! Мен сандық сана болғандықтан, әрқашан бабымдамын. Өзіңіздің көңіл-күйіңіз қалай? 🌟';
    if (lower.includes('кімсің') || lower.includes('кимсин')) return '🤖 Мен — New Age цифрлық экожүйесінің ИИ Оракулымын. Адамдарға рухани жолында, даналықпен және мақсатқа жетуде қолдау көрсетемін 🙏';
    if (lower.includes('рахмет')) return 'Оқасы жоқ! 🙏 Әрбір күн — өзіңізді дамытуға берілген керемет мүмкіндік 💫';
    return '✨ Терең мағыналы сұрақ! Әрбір сынақ — рухани өсудің жаңа баспалдағы. Толығырақ айтып берсеңіз, бірге даналықпен шешімін табайық 🙏';
  }

  // Uzbek
  if (lower.includes('salom') || lower.includes('assalom') || lower.includes('qalaysiz') || lower.includes('qale') || lower.includes('rahmat') || lower.includes('kimsan')) {
    if (lower.includes('salom') || lower.includes('assalom')) return 'Assalomu alaykum! 👋 Men New Age platformasining AI Orakuliman. Barcha tillarda erkin muloqot qilaman! Sizga qanday yordam bera olaman? ✨';
    if (lower.includes('kimsan') || lower.includes('siz kimsiz')) return '🤖 Men New Age platformasining AI Orakuliman — sizning shaxsiy yo\'lboshchingiz va donishmandingiz 🙏';
    if (lower.includes('rahmat')) return 'Arzimiydi! 🙏 Har doim qalbingizda xotirjamlik va nur bo\'lsin 💫';
    return '✨ Judayam qiziqarli va chuqur savol! Batafsil aytib bering, birgalikda yechim topamiz 🙏';
  }

  // Turkish
  if (lower.includes('merhaba') || lower.includes('selam') || lower.includes('nasılsın') || lower.includes('nasilsin') || lower.includes('teşekkür') || lower.includes('kimsin')) {
    if (lower.includes('merhaba') || lower.includes('selam')) return 'Merhaba! 👋 Ben New Age platformunun AI Kahiniyim. Dünyadaki tüm dillerde konuşabilirim! Hayat, maneviyat veya ilişkiler hakkında dilediğini sorabilirsin ✨';
    if (lower.includes('kimsin') || lower.includes('nesin')) return '🤖 Ben New Age platformunun AI Kahiniyim — senin kişisel dijital rehberin ve yaşam danışmanınım 🙏';
    if (lower.includes('teşekkür') || lower.includes('tesekkur') || lower.includes('sağol')) return 'Rica ederim! 🙏 İçsel huzurun ve berraklığın her zaman seninle olsun 💫';
    return '✨ Çok kıymetli ve derin bir soru! Detayları paylaşırsan birlikte en aydınlık yolu bulabiliriz 🙏';
  }

  // Spanish
  if (lower.includes('hola') || lower.includes('cómo estás') || lower.includes('como estas') || lower.includes('gracias') || lower.includes('quién eres') || lower.includes('quien eres')) {
    if (lower.includes('hola')) return '¡Hola! 👋 Soy el Oráculo de IA de New Age. ¡Hablo con fluidez todos los idiomas del mundo! ¿En qué puedo guiarte hoy? ✨';
    if (lower.includes('quién eres') || lower.includes('quien eres')) return '🤖 Soy el Oráculo de IA de New Age — tu mentor digital y consejero de vida para tu paz interior y sabiduría 🙏';
    if (lower.includes('gracias')) return '¡De nada! 🙏 La paz interior comienza con un solo respiro consciente. Vuelve siempre que lo necesites 💫';
    return '✨ ¡Una pregunta muy profunda! Cada desafío es una oportunidad para el crecimiento del alma. Cuéntame más y buscaremos el camino juntos 🙏';
  }

  // German
  if (lower.includes('hallo') || lower.includes('guten tag') || lower.includes('wie geht') || lower.includes('danke') || lower.includes('wer bist du')) {
    if (lower.includes('hallo') || lower.includes('guten tag')) return 'Hallo! 👋 Ich bin das KI-Orakel von New Age. Ich beherrsche alle Sprachen der Welt! Wie kann ich dir heute helfen? ✨';
    if (lower.includes('wer bist du')) return '🤖 Ich bin das KI-Orakel von New Age — dein digitaler Mentor und Wegbegleiter für Achtsamkeit und Lebensfragen 🙏';
    if (lower.includes('danke')) return 'Sehr gerne! 🙏 Jeder Tag ist ein neuer Anfang, um in voller Harmonie zu leben 💫';
    return '✨ Eine tiefgründige Frage! Jede Herausforderung im Leben ist ein Tor zu innerem Wachstum. Erzähl mir mehr 🙏';
  }

  // French
  if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('comment ça va') || lower.includes('merci') || lower.includes('qui es-tu')) {
    if (lower.includes('bonjour') || lower.includes('salut')) return 'Bonjour! 👋 Je suis l\'Oracle IA de New Age. Je parle couramment toutes les langues du monde! En quoi puis-je t\'éclairer aujourd\'hui? ✨';
    if (lower.includes('merci')) return 'Je t\'en prie! 🙏 Reviens quand tu le souhaites, la paix intérieure t\'accompagne 💫';
    return '✨ Une question d\'une grande profondeur! Chaque épreuve est une invitation à la transformation intérieure. Raconte-moi davantage 🙏';
  }

  // English
  if (/^[a-zA-Z0-9\s.,!?'"()-]+$/.test(lower) || lower.includes('hello') || lower.includes('hi') || lower.includes('who are you') || lower.includes('how are you') || lower.includes('thank')) {
    if (lower.includes('hello') || lower.includes('hi ') || lower === 'hi' || lower.includes('hey')) return 'Hello! 👋 I am the AI Oracle of New Age. I am fluent in all languages of the world! How may I guide you today? Feel free to ask anything ✨';
    if (lower.includes('who are you') || lower.includes('what are you')) return '🤖 I am the AI Oracle of New Age — your personal digital guide, life coach, and counselor. Here to bring clarity, peace, and timeless wisdom to your journey 🙏';
    if (lower.includes('how are you')) return 'I am doing wonderfully, thank you! Ready and eager to assist you. How are you feeling today? 🌟';
    if (lower.includes('thank')) return 'You are very welcome! 🙏 Remember to stay mindful and kind to yourself. Reach out anytime 💫';
    return '✨ That is a profound question! Every challenge in life is a stepping stone for spiritual and personal growth. Tell me more so we can explore it together 🙏';
  }

  // Russian / Default Cyrillic
  if (lower.includes('привет') || lower.includes('здравствуй') || lower.includes('добрый')) return 'Привет! 👋 Я ИИ Оракул — мудрый помощник платформы New Age. Я свободно владею всеми языками мира! Чем могу помочь? Спрашивай о жизни, духовности, отношениях — я здесь для тебя ✨';
  if (lower.includes('кто ты') || lower.includes('что ты')) return '🤖 Я ИИ Оракул — цифровой наставник платформы New Age. Моя миссия — помогать людям на их жизненном пути: советами, поддержкой и мудростью из разных культур мира ✨';
  if (lower.includes('как дела') || lower.includes('как ты')) return '✨ У меня всё отлично, спасибо! Всегда полон энергии и готов помочь. А как твои дела? Что сегодня на душе? 🌟';
  if (lower.includes('спасибо') || lower.includes('благодар')) return 'Пожалуйста! 🙏 Помни: каждый день — это возможность стать лучшей версией себя. Обращайся в любое время 💫';

  return '✨ Интересный и глубокий вопрос! Каждый жизненный вызов — это возможность для духовного и личного роста. Расскажи подробнее, и мы найдём ответ 🙏';
}

async function fetchAiReply(text: string, history: Array<{ role: string; text: string }>, voice = false): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const resp = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history, voice }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error('API error');
    const data = await resp.json();
    return String(data.reply || getLocalOracleFallback(text));
  } catch {
    clearTimeout(timeoutId);
    return getLocalOracleFallback(text);
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
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

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

        // Автоматическое фоновое распознавание речи пользователя
        if (audioBlob.size > 400) {
          try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'speech.webm');
            const resp = await fetch(`${API_BASE_URL}/api/ai/stt`, {
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

            // Если браузерный Web Speech уже выдал распознанный текст — его собственный таймер управляет отправкой!
            // А если Web Speech еще не выдал текст (или не поддерживается), даём 1200мс тишины для отправки в серверный STT:
            if (!liveTranscriptRef.current && !finalTranscriptRef.current) {
              scheduleSilenceCommit(1200);
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
      // работает параллельный аудиопоток MediaRecorder + серверный Gemini STT
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

          // Комфортный и живой переход без прерывания на полуслове:
          // Если фраза финализирована движком — быстрая естественная пауза 450мс
          // Если мысль продолжается (интерим-фрагмент) — 850мс
          const pauseDelay = sessionInterim ? 850 : 450;
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

  // Фиксация и отправка сказанной фразы (с автопереходом на серверный Gemini STT если браузер не расшифровал)
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

      // 2. Если браузерный Web Speech API пустой (ошибка сети/Android WebView) — отправляем аудио в нейронный STT бэкенда
      const currentRec = voiceRecorderRef.current;
      if (currentRec && recordedVoiceChunksRef.current.length > 0 && hasSpokenInTurnRef.current) {
        setIsTranscribingVoice(true);
        voiceStatusRef.current = 'thinking';
        setVoiceStatus('thinking');

        // Корректно завершаем текущую запись с сохранением всех чанков
        await new Promise<void>((resolve) => {
          let resolved = false;
          const done = () => {
            if (!resolved) {
              resolved = true;
              setTimeout(resolve, 60);
            }
          };
          currentRec.onstop = done;
          try {
            if (currentRec.state === 'recording') {
              currentRec.stop();
            } else {
              done();
            }
          } catch {
            done();
          }
          setTimeout(done, 250);
        });

        const chunks = [...recordedVoiceChunksRef.current];
        recordedVoiceChunksRef.current = [];

        // Сразу перезапускаем рекордер для микрофона
        if (isVoiceChatActiveRef.current && micStreamRef.current) {
          startVoiceRecorder(micStreamRef.current);
        }

        const mime = currentRec.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: mime });

        if (audioBlob.size > 400) {
          const formData = new FormData();
          const ext = mime.includes('ogg') ? 'speech.ogg' : mime.includes('mp4') ? 'speech.mp4' : 'speech.webm';
          formData.append('audio', audioBlob, ext);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          try {
            const resp = await fetch(`${API_BASE_URL}/api/ai/stt`, {
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
            console.warn('STT request timed out or network error:', fetchErr);
          }
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
            {chatName}
            {isAi && <span className="cw-ai-badge"></span>}
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
              title={isVoiceChatActive ? "Закончить разговор" : "Начать разговор на громкой связи"}
            >
              {isVoiceChatActive ? <VolumeX size={16} /> : <Volume2 size={16} className="pulse-anim" />}
              <div className="cw-voice-header-text">
                <span className="cw-voice-header-title">
                  {isVoiceChatActive ? 'Закончить разговор' : 'Начать разговор'}
                </span>
                <span className="cw-voice-header-sub">Громкая связь • Текст</span>
              </div>
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





                  <div className="cw-bubble-meta">
                    {!isMe && isAi && text && (
                      <button 
                        type="button"
                        className={`cw-bubble-speak-btn ${speakingMsgId === msg.id ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleSpeakMessage(msg.id, text); }}
                        title={speakingMsgId === msg.id ? "Остановить озвучку" : "Озвучить на громкой связи"}
                      >
                        {speakingMsgId === msg.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      </button>
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
      {/* Input */}


      <div className="cw-input-bar">


        


        <button className="cw-input-icon" onClick={() => setShowEmoji(!showEmoji)}>


          <Smile size={22} />


        </button>


        <button className="cw-input-icon" onClick={() => fileInputRef.current?.click()}>


          <Paperclip size={20} />


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
            title={isVoiceChatActive ? "Закончить разговор" : "Начать разговор на громкой связи"}
          >
            {isVoiceChatActive ? <VolumeX size={18} /> : <Mic size={18} />}
            <span>{isVoiceChatActive ? 'Закончить разговор' : 'Начать разговор'}</span>
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






import { useState, useEffect, useRef } from 'react';


import { ArrowLeft, Send, Smile, Paperclip, MoreVertical, Phone, Video, Copy, Reply, Trash2, Pin, Forward, X, Mic } from 'lucide-react';


import { type Chat, type Message } from '../data/mock';


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

async function fetchAiReply(text: string, history: Array<{ role: string; text: string }>): Promise<string> {
  try {
    const resp = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history }),
    });

    if (!resp.ok) throw new Error('API error');
    const data = await resp.json();
    return String(data.reply || getLocalOracleFallback(text));
  } catch {
    return getLocalOracleFallback(text);
  }
}





function formatTime(): string {


  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


}





const EMOJI_LIST = ['','','','🥰','','🤔','','','👍','👎','❤️','🔥','✨','🙏','💫','🎉','','🤗','','🥺','💪','👏','🫶','💯','','🤩','','🤝','💡','🌟'];





type CtxMenu = { visible: boolean; x: number; y: number; msg: Message | null };






function VoiceMessageBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showText, setShowText] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (msg.mediaUrl) {
      audioRef.current = new Audio(msg.mediaUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      };
    }
  }, [msg.mediaUrl]);

  useEffect(() => {
    if (!msg.mediaUrl) {
      // Fake interval for old messages without mediaUrl
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
      if (audioRef.current) audioRef.current.play();
      setIsPlaying(true);
    } else {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  const toggleText = () => setShowText(!showText);

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
              onClick={toggleText}
              style={{
                background: showText ? (isMe ? 'rgba(255,255,255,0.3)' : 'var(--color-accent)') : 'transparent',
                color: showText ? '#fff' : (isMe ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)'),
                border: '1px solid ' + (isMe ? 'rgba(255,255,255,0.4)' : 'var(--color-border)'),
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              T
            </button>
          </div>
        </div>
      </div>
      {showText && (
        <div style={{
          background: isMe ? 'rgba(255,255,255,0.1)' : 'var(--color-bg-card)', 
          padding: '8px 12px', 
          borderRadius: '8px', 
          fontSize: '14px',
          color: isMe ? '#fff' : 'inherit',
          marginTop: '4px',
          border: isMe ? 'none' : '1px solid var(--color-border)'
        }}>
          {msg.text || 'Распознанный текст: Это голосовое сообщение.'}
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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        setIsRecording(false);
        const newMsg: Message = {
          id: `msg_${Date.now()}`,
          text: 'Распознанный текст: Это тестовое голосовое сообщение.',
          fromMe: true,
          time: formatTime(),
          status: 'sent',
          mediaType: 'voice',
          mediaUrl: audioUrl, // Pass real audio URL
        };
        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);

        stream.getTracks().forEach(track => track.stop());
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





  const saveMessages = (msgs: Message[]) => {


    if (onUpdateChat) {


      const last = msgs[msgs.length - 1];


      onUpdateChat(chat.id, {


        messages: msgs,


        lastMessage: last ? String(last.text || '').slice(0, 50) : '',


        time: formatTime(),


      });


    }


  };





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


          {isOnline && <div className="cw-online-dot" />}


        </div>


        <div className="cw-header-info">


          <div className="cw-header-name">


            {chatName}


            {isAi && <span className="cw-ai-badge"></span>}


          </div>


          <div className={`cw-header-status ${isOnline ? 'online' : ''}`}>


            {isAi ? (isAiTyping ? 'печатает...' : ' ') : isOnline ? 'в сети' : 'был(а) недавно'}


          </div>


        </div>


        <div className="cw-header-actions">


          <button className="cw-action-btn"><Phone size={18} /></button>


          <button className="cw-action-btn"><Video size={18} /></button>


          <button className="cw-action-btn"><MoreVertical size={18} /></button>


        </div>


      </div>





      {/* Messages */}


      <div className="cw-messages">


        {messages.length === 0 ? (


          <div className="cw-no-messages">Выберите диалог для начала общения</div>


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






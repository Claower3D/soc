import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, ArrowLeft, PhoneCall, User as UserIcon, 
  Paperclip, Smile, Mic, Play, Pause, 
  Image as ImageIcon, Video as VideoIcon, 
  CheckCheck, X, Trash2, Edit2, Reply, Copy, Check, MoreVertical,
  Camera, FileText, Headphones, UserCheck, BarChart2, Calendar, 
  Sparkles, ShoppingBag, Zap, VolumeX, Palette, Archive, ArchiveRestore, Lock, Unlock
} from 'lucide-react';
import { 
  type Chat, type Message, type PollData, type EventData, 
  type ProductData, type ContactData, type ChatTheme, CHAT_THEMES, 
  initialUsers, initialProducts 
} from '../data/mock';
import './ChatWindow.css';

interface ChatWindowProps {
  chat: Chat | null;
  onBack: () => void;
  onDeleteChat?: (chatId: string) => void;
  onUpdateChat?: (chatId: string, updates: Partial<Chat>) => void;
}

const quickEmojis = ['😊', '😂', '🔥', '👍', '❤️', '🚀', '🎉', '👏', '👀', '💯', '🙌', '✨', '🧘', '🌟', '💎', '🕊️', '🤝', '🌞', '💡', '🌈'];

const stickerPacks = [
  { id: 'stk_1', title: 'Осознанность', url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=250&q=80' },
  { id: 'stk_2', title: 'Сердце', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=250&q=80' },
  { id: 'stk_3', title: 'Медитация', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=250&q=80' },
  { id: 'stk_4', title: 'Энергия', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=250&q=80' },
  { id: 'stk_5', title: 'Океан', url: 'https://images.unsplash.com/photo-1507525428033-b723cf961d3e?auto=format&fit=crop&w=250&q=80' },
  { id: 'stk_6', title: 'Космос', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=250&q=80' }
];

const sampleGifs = [
  { id: 'g1', title: 'Салют ✨', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80' },
  { id: 'g2', title: 'Огонь 🔥', url: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&w=400&q=80' },
  { id: 'g3', title: 'Покой 🌿', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80' },
  { id: 'g4', title: 'Код 💻', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80' }
];

export function ChatWindow({ chat, onBack, onDeleteChat, onUpdateChat }: ChatWindowProps) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>(chat?.messages || []);
  
  // Theme state
  const [showThemeModal, setShowThemeModal] = useState(false);
  const currentTheme: ChatTheme = chat?.customTheme || CHAT_THEMES[0];
  
  // Voice recording
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Mode: Voice vs Video Note (Кружочек)
  const [inputMode, setInputMode] = useState<'mic' | 'camera'>('mic');
  const [isVideoNoteRecording, setIsVideoNoteRecording] = useState(false);
  const [videoNoteSeconds, setVideoNoteSeconds] = useState(0);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Popups & Attachments
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMediaTabs, setShowMediaTabs] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'emoji' | 'stickers' | 'gif'>('emoji');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<{ title: string; duration: string } | null>(null);

  // Modals for Attachments
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOption1, setPollOption1] = useState('');
  const [pollOption2, setPollOption2] = useState('');
  const [pollOption3, setPollOption3] = useState('');

  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('20 сентября 2026');
  const [eventTime, setEventTime] = useState('18:00');
  const [eventLocation, setEventLocation] = useState('Онлайн • Live Zen');

  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Video note sound toggle in feed
  const [playingVideoNoteId, setPlayingVideoNoteId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1);
  
  // Deleting & Editing state
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [deleteForEveryone, setDeleteForEveryone] = useState(true);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [confirmClearChat, setConfirmClearChat] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const videoNoteTimerRef = useRef<number | null>(null);

  // Sync messages when chat changes
  useEffect(() => {
    setMessages(chat?.messages || []);
    setInputValue('');
    setAttachedImage(null);
    setIsRecordingVoice(false);
    setShowAttachMenu(false);
    setShowMediaTabs(false);
    setEditingMessage(null);
    setReplyingToMessage(null);
    setMessageToDelete(null);
  }, [chat]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice recording timer
  useEffect(() => {
    if (isRecordingVoice) {
      setVoiceSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setVoiceSeconds(s => s + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecordingVoice]);

  // Video note recording timer
  useEffect(() => {
    if (isVideoNoteRecording) {
      setVideoNoteSeconds(0);
      videoNoteTimerRef.current = window.setInterval(() => {
        setVideoNoteSeconds(s => s + 1);
      }, 1000);
    } else {
      if (videoNoteTimerRef.current) clearInterval(videoNoteTimerRef.current);
    }
    return () => {
      if (videoNoteTimerRef.current) clearInterval(videoNoteTimerRef.current);
    };
  }, [isVideoNoteRecording]);

  if (!chat) {
    return (
      <div className="chat-window-empty">
        <div className="empty-message-bubble">Выберите диалог для начала общения</div>
      </div>
    );
  }

  const handleSelectTheme = (theme: ChatTheme) => {
    if (chat && onUpdateChat) {
      onUpdateChat(chat.id, { customTheme: theme });
    }
    setShowThemeModal(false);
  };

  const handleToggleArchiveFromChat = () => {
    if (chat && onUpdateChat) {
      onUpdateChat(chat.id, { isArchived: !chat.isArchived });
    }
    setShowChatMenu(false);
  };

  const handleToggleLockFromChat = () => {
    if (chat && onUpdateChat) {
      onUpdateChat(chat.id, { 
        isLocked: !chat.isLocked,
        pinCode: !chat.isLocked ? '1234' : undefined
      });
    }
    setShowChatMenu(false);
  };

  const formatVoiceTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  // Helper to render delivery & read ticks
  const renderMessageTicks = (msg: Message) => {
    // 1 gray tick: msg.status === 'sent' or recipient is offline
    // 2 gray ticks: msg.status === 'delivered'
    // 2 blue ticks: msg.status === 'read' (or default fallback for online recipients)
    let status = msg.status;
    if (!status) {
      if (chat?.isGroup || chat?.id === 'ai_guru_bot') {
        status = 'read';
      } else if (chat && !chat.user.online) {
        status = 'sent';
      } else {
        status = 'read';
      }
    }

    if (status === 'sent') {
      return (
        <span title="Не доставлено (нет связи)">
          <Check size={14} className="tg-ticks sent" />
        </span>
      );
    }
    if (status === 'delivered') {
      return (
        <span title="Доставлено (не прочитано)">
          <CheckCheck size={14} className="tg-ticks delivered" />
        </span>
      );
    }
    return (
      <span title="Доставлено и прочитано">
        <CheckCheck size={14} className="tg-ticks read" />
      </span>
    );
  };

  // Send or Edit message
  const handleSendMessage = () => {
    if (!inputValue.trim() && !attachedImage) return;

    if (editingMessage) {
      setMessages(prev =>
        prev.map(m =>
          m.id === editingMessage.id
            ? { ...m, text: inputValue.trim() }
            : m
        )
      );
      setEditingMessage(null);
      setInputValue('');
      return;
    }

    const replyPrefix = replyingToMessage 
      ? `💬 [В ответ]: ${replyingToMessage.text ? replyingToMessage.text.slice(0, 30) + '...' : 'вложение'}\n`
      : '';

    const isRecipientOnline = chat ? (chat.isGroup || chat.id === 'ai_guru_bot' || chat.user.online) : false;
    const initialStatus: 'sent' | 'delivered' = isRecipientOnline ? 'delivered' : 'sent';

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      text: replyPrefix ? replyPrefix + inputValue.trim() : (inputValue.trim() || undefined),
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaUrl: attachedImage || undefined,
      mediaType: attachedImage ? 'image' : undefined,
      status: initialStatus,
    };

    setMessages(prev => [...prev, newMsg]);
    if (isRecipientOnline) {
      setTimeout(() => {
        setMessages(curr => curr.map(m => m.id === newMsg.id ? { ...m, status: 'read' } : m));
      }, 2500);
    }
    setInputValue('');
    setAttachedImage(null);
    setReplyingToMessage(null);
    setShowAttachMenu(false);
    setShowMediaTabs(false);

    // If talking to AI Guru, generate interactive reply
    if (chat?.id === 'ai_guru_bot') {
      const userText = (newMsg.text || '').toLowerCase();
      setTimeout(() => {
        let guruAnswer = 'То, что ты ищешь снаружи, уже присутствует внутри как свидетель. Успокой мысли и наблюдай за дыханием. ✨';
        if (userText.includes('таро') || userText.includes('карт')) {
          guruAnswer = 'Карты Таро — это зеркало твоего подсознания. Перейди во вкладку «Самопознание ➔ Таро & МАК», чтобы вытянуть Карту Дня в 3D! 🔮';
        } else if (userText.includes('натальн') || userText.includes('гороскоп') || userText.includes('дизайн')) {
          guruAnswer = 'Твой космический код уникален. Загляни в раздел «Натальная карта», чтобы рассчитать асцендент, стихии и бодиграф Human Design! 🌌';
        } else if (userText.includes('тревог') || userText.includes('стресс') || userText.includes('страх')) {
          guruAnswer = 'Сделай глубокий вдох животом на 4 счета и медленный выдох на 8. В этот миг ты в безопасности. Зайди в «Live Zen», чтобы подышать в общем круге практикующих. 🧘';
        } else if (userText.includes('привет') || userText.includes('здравствуй')) {
          guruAnswer = 'Мир твоему сердцу, путник! Я всегда рядом, чтобы подсказать практику, совет или толкование символов. О чем думаешь сейчас? 🙏';
        }

        setMessages(mPrev => [
          ...mPrev,
          {
            id: `guru_reply_${Date.now()}`,
            text: guruAnswer,
            fromMe: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 700);
    }
  };

  // Delete message execution
  const handleConfirmDeleteMessage = () => {
    if (!messageToDelete) return;
    setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
    setMessageToDelete(null);
  };

  // Start editing a message
  const handleStartEdit = (msg: Message) => {
    setEditingMessage(msg);
    setInputValue(msg.text || '');
    setReplyingToMessage(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setInputValue('');
  };

  // Copy message text
  const handleCopyMessage = (msg: Message) => {
    const content = msg.text || (msg.mediaType === 'voice' ? 'Голосовое сообщение' : 'Медиа');
    navigator.clipboard?.writeText(content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Clear all messages
  const handleClearHistory = () => {
    setMessages([]);
    setConfirmClearChat(false);
    setShowChatMenu(false);
  };

  // Voice recording handlers (with real getUserMedia / MediaRecorder fallback)
  const handleStartVoiceRecord = async () => {
    setIsRecordingVoice(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorder.start();
      }
    } catch {
      // In case mic is blocked, the visual animated recorder still runs smoothly
    }
  };

  const handleSendVoiceMessage = () => {
    let voiceBlobUrl: string | undefined = undefined;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      } catch {
        // ignore
      }
    }

    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      voiceBlobUrl = URL.createObjectURL(audioBlob);
    }

    const durationStr = formatVoiceTime(voiceSeconds || 4);
    const newVoiceMsg: Message = {
      id: `voice_${Date.now()}`,
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaType: 'voice',
      voiceDuration: durationStr,
      voiceBlobUrl,
      text: 'Голосовое сообщение',
    };
    setMessages(prev => [...prev, newVoiceMsg]);
    setIsRecordingVoice(false);
    setVoiceSeconds(0);
    audioChunksRef.current = [];
  };

  const handleCancelVoice = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      } catch {
        // ignore
      }
    }
    setIsRecordingVoice(false);
    setVoiceSeconds(0);
    audioChunksRef.current = [];
  };

  // Video Note (Кружочек) handlers
  const handleOpenVideoNoteRecorder = async () => {
    setIsVideoNoteRecording(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 480, height: 480 },
          audio: true 
        });
        cameraStreamRef.current = stream;
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play().catch(() => {});
        }
      }
    } catch {
      // Fallback: camera simulation is displayed
    }
  };

  const handleCloseVideoNoteRecorder = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    setIsVideoNoteRecording(false);
    setVideoNoteSeconds(0);
  };

  const handleSendVideoNote = () => {
    const sampleVideoNotes = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
    ];
    const pickedVideo = sampleVideoNotes[Math.floor(Math.random() * sampleVideoNotes.length)];

    const newVideoNoteMsg: Message = {
      id: `vidnote_${Date.now()}`,
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaType: 'video_note',
      videoNoteUrl: pickedVideo,
      text: 'Видео-сообщение'
    };

    setMessages(prev => [...prev, newVideoNoteMsg]);
    handleCloseVideoNoteRecorder();
  };

  // Toggle video note sound
  const togglePlayVideoNote = (id: string) => {
    setPlayingVideoNoteId(prev => prev === id ? null : id);
  };

  // Image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImage(reader.result as string);
        setShowAttachMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Document upload handler
  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const docMsg: Message = {
        id: `doc_${Date.now()}`,
        fromMe: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: file.name,
        mediaType: 'document'
      };
      setMessages(prev => [...prev, docMsg]);
      setShowAttachMenu(false);
    }
  };

  // Sample media attach
  const handleAttachSamplePhoto = () => {
    const samples = [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    setAttachedImage(picked);
    setShowAttachMenu(false);
  };

  // Send Sticker
  const handleSendSticker = (stickerUrl: string) => {
    const newMsg: Message = {
      id: `stk_${Date.now()}`,
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaType: 'sticker',
      stickerUrl
    };
    setMessages(prev => [...prev, newMsg]);
    setShowMediaTabs(false);
  };

  // Send GIF
  const handleSendGif = (gifUrl: string) => {
    const newMsg: Message = {
      id: `gif_${Date.now()}`,
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaType: 'gif',
      gifUrl
    };
    setMessages(prev => [...prev, newMsg]);
    setShowMediaTabs(false);
  };

  // Poll Handlers
  const handleCreatePoll = () => {
    if (!pollQuestion.trim()) return;
    const options = [
      { id: 'opt_1', text: pollOption1.trim() || 'Вариант 1', votes: 1 },
      { id: 'opt_2', text: pollOption2.trim() || 'Вариант 2', votes: 0 },
    ];
    if (pollOption3.trim()) {
      options.push({ id: 'opt_3', text: pollOption3.trim(), votes: 0 });
    }

    const pollData: PollData = {
      id: `poll_${Date.now()}`,
      question: pollQuestion.trim(),
      options,
      totalVotes: 1,
      isClosed: false,
      userVotedOptionId: 'opt_1'
    };

    const newMsg: Message = {
      id: `msg_poll_${Date.now()}`,
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaType: 'poll',
      pollData
    };

    setMessages(prev => [...prev, newMsg]);
    setShowPollModal(false);
    setPollQuestion('');
    setPollOption1('');
    setPollOption2('');
    setPollOption3('');
  };

  const handleVotePoll = (msgId: string, optId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.pollData) return m;
      const poll = m.pollData;
      if (poll.userVotedOptionId) return m;

      const updatedOptions = poll.options.map(opt => {
        if (opt.id === optId) return { ...opt, votes: opt.votes + 1 };
        return opt;
      });

      return {
        ...m,
        pollData: {
          ...poll,
          options: updatedOptions,
          totalVotes: poll.totalVotes + 1,
          userVotedOptionId: optId
        }
      };
    }));
  };

  // Event Handlers
  const handleCreateEvent = () => {
    if (!eventTitle.trim()) return;
    const eventData: EventData = {
      id: `event_${Date.now()}`,
      title: eventTitle.trim(),
      date: eventDate,
      time: eventTime,
      location: eventLocation,
      participantsCount: 5,
      isAttending: true
    };

    const newMsg: Message = {
      id: `msg_event_${Date.now()}`,
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaType: 'event',
      eventData
    };

    setMessages(prev => [...prev, newMsg]);
    setShowEventModal(false);
    setEventTitle('');
  };

  const handleToggleEventAttendance = (msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.eventData) return m;
      const ev = m.eventData;
      const nextAttending = !ev.isAttending;
      const currentCount = ev.participantsCount ?? 5;
      return {
        ...m,
        eventData: {
          ...ev,
          isAttending: nextAttending,
          participantsCount: currentCount + (nextAttending ? 1 : -1)
        }
      };
    }));
  };

  // Catalog item share (Product / Service)
  const handleShareProduct = (prod: typeof initialProducts[0]) => {
    const productData: ProductData = {
      id: prod.id,
      title: prod.title,
      price: prod.price,
      currency: '₽',
      image: prod.images[0],
      imageUrl: prod.images[0],
      type: 'product',
      category: prod.category || 'Товар',
      sellerName: prod.seller.name,
      commissionPercent: 3
    };

    const newMsg: Message = {
      id: `msg_prod_${Date.now()}`,
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaType: 'product',
      productData
    };

    setMessages(prev => [...prev, newMsg]);
    setShowCatalogModal(false);
  };

  // Contact share
  const handleShareContact = (user: typeof initialUsers[0]) => {
    const contactData: ContactData = {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      phone: '+7 (999) 450-88-21'
    };

    const newMsg: Message = {
      id: `msg_contact_${Date.now()}`,
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaType: 'contact',
      contactData
    };

    setMessages(prev => [...prev, newMsg]);
    setShowContactModal(false);
  };

  const togglePlayVoice = (id: string) => {
    setPlayingVoiceId(prev => prev === id ? null : id);
  };

  const handleHeaderClick = () => {
    if (chat.isGroup) {
      navigate('/conferences');
    } else {
      navigate(`/profile/${chat.user.id === 'me' ? 'me' : chat.user.id}`);
    }
  };

  return (
    <div className="tg-chat-container">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*,video/*"
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={docInputRef}
        style={{ display: 'none' }}
        onChange={handleDocChange}
      />

      {/* Telegram-style Chat Header */}
      <div className="tg-chat-header">
        <div className="tg-header-left">
          <button className="tg-back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>

          <div className="tg-user-box" onClick={handleHeaderClick}>
            <div className="tg-avatar-wrap">
              <img 
                src={chat.groupAvatar || chat.user.avatar} 
                alt={chat.groupTitle || chat.user.name} 
                className="tg-header-avatar" 
              />
              {!chat.isGroup && chat.user.online && <span className="tg-online-pip" />}
            </div>
            <div className="tg-user-titles">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="tg-header-name">{chat.groupTitle || chat.user.name}</span>
                {chat.id === 'ai_guru_bot' && (
                  <span style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', 
                    color: 'white', 
                    padding: '1px 6px', 
                    borderRadius: 8 
                  }}>
                    ИИ
                  </span>
                )}
              </div>
              <span className="tg-header-status">
                {chat.isGroup ? (
                  `${chat.membersCount || 6} участников · группа`
                ) : chat.id === 'ai_guru_bot' ? (
                  <span style={{ color: '#a855f7', fontWeight: 600 }}>Нейросетевой наставник (всегда в сети)</span>
                ) : chat.user.online ? (
                  <span className="online-text">в сети</span>
                ) : (
                  'был(а) недавно'
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="tg-header-actions">
          <button 
            className="tg-header-btn" 
            onClick={() => navigate('/conferences')}
            title="Конференция"
          >
            <PhoneCall size={19} />
          </button>

          {!chat.isGroup && chat.id !== 'ai_guru_bot' && (
            <button 
              className="tg-header-btn" 
              onClick={() => navigate(`/profile/${chat.user.id}`)}
              title="Профиль"
            >
              <UserIcon size={19} />
            </button>
          )}

          {/* More options (Clear history / Delete chat) */}
          <div className="header-menu-wrap">
            <button 
              className="tg-header-btn" 
              onClick={() => setShowChatMenu(!showChatMenu)}
              title="Параметры чата"
            >
              <MoreVertical size={19} />
            </button>

            {showChatMenu && (
              <div className="chat-options-dropdown">
                {/* Custom Theme selection */}
                <button 
                  className="chat-option-row"
                  onClick={() => {
                    setShowChatMenu(false);
                    setShowThemeModal(true);
                  }}
                >
                  <Palette size={16} color="var(--color-accent)" />
                  <span>Тема оформления</span>
                </button>

                {/* Toggle Archive */}
                {chat.id !== 'ai_guru_bot' && (
                  <button 
                    className="chat-option-row"
                    onClick={handleToggleArchiveFromChat}
                  >
                    {chat.isArchived ? (
                      <>
                        <ArchiveRestore size={16} color="var(--color-accent)" />
                        <span>Извлечь из архива</span>
                      </>
                    ) : (
                      <>
                        <Archive size={16} color="var(--color-text-secondary)" />
                        <span>Поместить в архив</span>
                      </>
                    )}
                  </button>
                )}

                {/* Toggle Lock PIN */}
                {chat.id !== 'ai_guru_bot' && (
                  <button 
                    className="chat-option-row"
                    onClick={handleToggleLockFromChat}
                  >
                    {chat.isLocked ? (
                      <>
                        <Unlock size={16} color="#10B981" />
                        <span>Снять защиту PIN</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} color="var(--color-danger)" />
                        <span>Закрыть чат (PIN)</span>
                      </>
                    )}
                  </button>
                )}

                <button 
                  className="chat-option-row"
                  onClick={() => {
                    setShowChatMenu(false);
                    setConfirmClearChat(true);
                  }}
                >
                  <Trash2 size={16} color="var(--color-danger)" />
                  <span>Очистить переписку</span>
                </button>

                {/* AI GURU cannot be deleted! */}
                {onDeleteChat && chat.id !== 'ai_guru_bot' && (
                  <button 
                    className="chat-option-row danger"
                    onClick={() => {
                      setShowChatMenu(false);
                      onDeleteChat(chat.id);
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Удалить чат</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Feed Area with custom per-chat theme background */}
      <div 
        className="tg-messages-scroll"
        style={{
          background: currentTheme.background !== 'var(--color-bg)' ? currentTheme.background : undefined
        }}
      >
        {messages.length === 0 ? (
          <div className="empty-messages-notice">
            <span>Сообщений пока нет. Начните диалог первым!</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.fromMe;
            const isVoice = msg.mediaType === 'voice';
            const isImage = msg.mediaType === 'image';
            const isVideoNote = msg.mediaType === 'video_note';
            const isPoll = msg.mediaType === 'poll' && msg.pollData;
            const isEvent = msg.mediaType === 'event' && msg.eventData;
            const isProduct = msg.mediaType === 'product' && msg.productData;
            const isContact = msg.mediaType === 'contact' && msg.contactData;
            const isSticker = msg.mediaType === 'sticker';
            const isGif = msg.mediaType === 'gif';
            const isDoc = msg.mediaType === 'document';
            const isRec = Boolean(msg.conferenceRecording);

            return (
              <div key={msg.id} className={`tg-msg-row ${isMe ? 'outgoing' : 'incoming'}`}>
                {/* Floating message actions toolbar on hover */}
                <div className="tg-msg-wrapper">
                  <div className="tg-msg-actions-toolbar">
                    <button 
                      className="msg-action-btn"
                      onClick={() => setReplyingToMessage(msg)}
                      title="Ответить"
                    >
                      <Reply size={14} />
                    </button>

                    {isMe && msg.text && !isVoice && !isVideoNote && (
                      <button 
                        className="msg-action-btn"
                        onClick={() => handleStartEdit(msg)}
                        title="Редактировать"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}

                    <button 
                      className="msg-action-btn"
                      onClick={() => handleCopyMessage(msg)}
                      title="Копировать"
                    >
                      {copiedId === msg.id ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                    </button>

                    {/* DELETE MESSAGE BUTTON */}
                    <button 
                      className="msg-action-btn delete"
                      onClick={() => setMessageToDelete(msg)}
                      title="Удалить сообщение"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* 1. Telegram Video Note (Кружочек) */}
                  {isVideoNote && (
                    <div 
                      className="tg-video-note-bubble"
                      onClick={() => togglePlayVideoNote(msg.id)}
                    >
                      <video
                        src={msg.videoNoteUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
                        className="video-note-element"
                        autoPlay
                        loop
                        muted={playingVideoNoteId !== msg.id}
                        playsInline
                      />
                      {playingVideoNoteId !== msg.id && (
                        <div className="video-note-play-hint">
                          <VolumeX size={20} />
                        </div>
                      )}
                      <div className="video-note-mute-status">
                        {playingVideoNoteId === msg.id ? 'Звук вкл' : 'Без звука'} · {msg.time}
                      </div>
                    </div>
                  )}

                  {/* 2. Sticker */}
                  {isSticker && (
                    <div className="tg-bubble sticker-bubble" style={{ background: 'transparent', boxShadow: 'none', border: 'none', padding: 0 }}>
                      <img src={msg.stickerUrl} alt="Sticker" className="tg-sticker-message" />
                      <div className="tg-meta" style={{ justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <span className="tg-time">{msg.time}</span>
                        {isMe && renderMessageTicks(msg)}
                      </div>
                    </div>
                  )}

                  {/* 3. GIF */}
                  {isGif && (
                    <div className="tg-bubble" style={{ padding: 6, maxWidth: 260 }}>
                      <img src={msg.gifUrl} alt="GIF" className="tg-gif-message" />
                      <div className="tg-meta">
                        <span className="tg-time">{msg.time}</span>
                        {isMe && renderMessageTicks(msg)}
                      </div>
                    </div>
                  )}

                  {/* 4. Poll Card */}
                  {isPoll && msg.pollData && (
                    <div className={`tg-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                      <div className="tg-poll-card">
                        <div className="poll-question">{msg.pollData.question}</div>
                        <span className="poll-type-tag">Анонимный опрос</span>
                        <div className="poll-options-list">
                          {msg.pollData.options.map(opt => {
                            const isVoted = msg.pollData?.userVotedOptionId === opt.id;
                            const total = msg.pollData?.totalVotes || 1;
                            const percent = Math.round((opt.votes / total) * 100);
                            return (
                              <div 
                                key={opt.id} 
                                className={`poll-option-row ${isVoted ? 'voted' : ''}`}
                                onClick={() => handleVotePoll(msg.id, opt.id)}
                              >
                                <div className="poll-option-fill" style={{ width: `${percent}%` }} />
                                <div className="poll-option-content">
                                  <span className="poll-option-text">{opt.text}</span>
                                  <span className="poll-option-percent">{percent}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="poll-votes-total">
                          Голосов: {msg.pollData.totalVotes}
                        </div>
                      </div>
                      <div className="tg-meta">
                        <span className="tg-time">{msg.time}</span>
                        {isMe && renderMessageTicks(msg)}
                      </div>
                    </div>
                  )}

                  {/* 5. Event Card */}
                  {isEvent && msg.eventData && (
                    <div className={`tg-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                      <div className="tg-event-card">
                        <span className="event-badge"><Calendar size={13} /> Мероприятие</span>
                        <div className="event-title">{msg.eventData.title}</div>
                        <div className="event-meta-info">
                          <span>📅 {msg.eventData.date} в {msg.eventData.time}</span>
                          <span>📍 {msg.eventData.location}</span>
                          <span>👥 Участников: {msg.eventData.participantsCount}</span>
                        </div>
                        <button 
                          className={`event-join-btn ${msg.eventData.isAttending ? 'attending' : ''}`}
                          onClick={() => handleToggleEventAttendance(msg.id)}
                        >
                          {msg.eventData.isAttending ? '✓ Вы идёте' : 'Присоединиться'}
                        </button>
                      </div>
                      <div className="tg-meta">
                        <span className="tg-time">{msg.time}</span>
                        {isMe && renderMessageTicks(msg)}
                      </div>
                    </div>
                  )}

                  {/* 6. Product / Service Card */}
                  {isProduct && msg.productData && (
                    <div className={`tg-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`} style={{ padding: 6 }}>
                      <div className="tg-product-card">
                        <img src={msg.productData.imageUrl} alt={msg.productData.title} className="product-card-img" />
                        <div className="product-card-body">
                          <span className="product-card-badge">{msg.productData.category}</span>
                          <div className="product-card-title">{msg.productData.title}</div>
                          <div className="product-card-price-row">
                            <span className="product-card-price">{msg.productData.price} {msg.productData.currency}</span>
                            <span className="product-card-commission">Комиссия 3% включена</span>
                          </div>
                          <button 
                            className="product-card-order-btn"
                            onClick={() => alert(`Заказ «${msg.productData?.title}» отправлен автору!`)}
                          >
                            Заказать / Купить
                          </button>
                        </div>
                      </div>
                      <div className="tg-meta" style={{ padding: '2px 6px' }}>
                        <span className="tg-time">{msg.time}</span>
                        {isMe && renderMessageTicks(msg)}
                      </div>
                    </div>
                  )}

                  {/* 7. Contact Card */}
                  {isContact && msg.contactData && (
                    <div className={`tg-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                      <div className="tg-contact-card">
                        <img src={msg.contactData.avatar} alt={msg.contactData.name} className="contact-card-avatar" />
                        <div className="contact-card-info">
                          <span className="contact-card-name">{msg.contactData.name}</span>
                          <span className="contact-card-sub">@{msg.contactData.username} · {msg.contactData.phone}</span>
                        </div>
                        <button 
                          className="contact-card-action-btn"
                          onClick={() => navigate(`/profile/${msg.contactData?.id}`)}
                        >
                          Открыть
                        </button>
                      </div>
                      <div className="tg-meta">
                        <span className="tg-time">{msg.time}</span>
                        {isMe && renderMessageTicks(msg)}
                      </div>
                    </div>
                  )}

                  {/* 8. Document Card */}
                  {isDoc && (
                    <div className={`tg-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                      <div className="tg-doc-file-card">
                        <div className="doc-file-icon-wrap">
                          <FileText size={20} />
                        </div>
                        <div className="doc-file-info">
                          <span className="doc-file-name">{msg.text}</span>
                          <span className="doc-file-size">1.4 МБ · Документ</span>
                        </div>
                      </div>
                      <div className="tg-meta">
                        <span className="tg-time">{msg.time}</span>
                        {isMe && renderMessageTicks(msg)}
                      </div>
                    </div>
                  )}

                  {/* Standard Text, Image, Voice, Conference Recording */}
                  {!isVideoNote && !isSticker && !isGif && !isPoll && !isEvent && !isProduct && !isContact && !isDoc && (
                    <div 
                      className={`tg-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}
                      style={{
                        background: isMe 
                          ? (currentTheme.bubbleMeBg || undefined) 
                          : (currentTheme.bubbleThemBg || undefined),
                        color: isMe 
                          ? (currentTheme.bubbleMeColor || undefined) 
                          : (currentTheme.bubbleThemColor || undefined),
                      }}
                    >
                      {/* Conference Recording Card */}
                      {isRec && msg.conferenceRecording && (
                        <div className="tg-rec-card">
                          <div className="tg-rec-header">
                            <VideoIcon size={20} className="tg-rec-icon" />
                            <div className="tg-rec-meta">
                              <span className="tg-rec-title">{msg.conferenceRecording.title}</span>
                              <span className="tg-rec-date">{msg.conferenceRecording.date} · {msg.conferenceRecording.duration}</span>
                            </div>
                          </div>
                          <button 
                            className="tg-rec-play-btn"
                            onClick={() => setSelectedRecording({
                              title: msg.conferenceRecording!.title,
                              duration: msg.conferenceRecording!.duration,
                            })}
                          >
                            <Play size={16} fill="currentColor" /> Смотреть запись звонка
                          </button>
                        </div>
                      )}

                      {/* Attached Image */}
                      {isImage && msg.mediaUrl && (
                        <div className="tg-media-preview-bubble">
                          <img src={msg.mediaUrl} alt="attachment" className="tg-chat-photo" />
                        </div>
                      )}

                      {/* Voice Message Player */}
                      {isVoice && (
                        <div className="tg-voice-player">
                          <button 
                            className="tg-voice-play-btn" 
                            onClick={() => togglePlayVoice(msg.id)}
                          >
                            {playingVoiceId === msg.id ? (
                              <Pause size={16} fill="currentColor" />
                            ) : (
                              <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />
                            )}
                          </button>

                          {/* Animated Audio Waveform Bars */}
                          <div className={`tg-waveform ${playingVoiceId === msg.id ? 'playing' : ''}`}>
                            {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 30, 85, 60, 40, 75, 90, 50, 65, 35].map((h, i) => (
                              <span 
                                key={i} 
                                className="wave-bar" 
                                style={{ height: `${h}%` }} 
                              />
                            ))}
                          </div>

                          <div className="tg-voice-meta">
                            <span className="tg-voice-duration">{msg.voiceDuration || '0:18'}</span>
                            <button 
                              className="tg-voice-speed" 
                              onClick={() => setVoiceSpeed(s => s === 1 ? 2 : 1)}
                            >
                              {voiceSpeed}X
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Text Content */}
                      {msg.text && (!isVoice || msg.text !== 'Голосовое сообщение') && (
                        <div className="tg-text">{msg.text}</div>
                      )}

                      {/* Timestamp & Seen ticks */}
                      <div className="tg-meta">
                        <span className="tg-time">{msg.time}</span>
                        {isMe && renderMessageTicks(msg)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Editing Notice Bar */}
      {editingMessage && (
        <div className="tg-action-banner edit">
          <div className="action-banner-text">
            <Edit2 size={16} className="banner-icon" />
            <div>
              <strong>Редактирование сообщения</strong>
              <p>{editingMessage.text?.slice(0, 40)}...</p>
            </div>
          </div>
          <button className="banner-cancel-btn" onClick={handleCancelEdit}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Replying Notice Bar */}
      {replyingToMessage && (
        <div className="tg-action-banner reply">
          <div className="action-banner-text">
            <Reply size={16} className="banner-icon" />
            <div>
              <strong>Ответ на сообщение</strong>
              <p>{replyingToMessage.text ? replyingToMessage.text.slice(0, 40) : 'Вложение'}...</p>
            </div>
          </div>
          <button className="banner-cancel-btn" onClick={() => setReplyingToMessage(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Image Preview Attachment Bar (before sending) */}
      {attachedImage && (
        <div className="tg-attachment-preview-bar">
          <div className="preview-thumb-box">
            <img src={attachedImage} alt="preview" />
            <button className="remove-preview-btn" onClick={() => setAttachedImage(null)}>
              <X size={14} />
            </button>
          </div>
          <span className="preview-hint">Изображение готово к отправке. Добавьте подпись ниже.</span>
        </div>
      )}

            {/* Standard Telegram Bottom Input Bar */}
      <div className="tg-bottom-bar">
        {/* Backdrop for popovers to close when clicked outside */}
        {(showMediaTabs || showAttachMenu) && (
          <div 
            className="tg-popover-backdrop" 
            onClick={() => {
              setShowMediaTabs(false);
              setShowAttachMenu(false);
            }} 
          />
        )}

{/* STICKERS, EMOJIS & GIF POPUP TABS */}
      {showMediaTabs && (
        <div className="tg-media-tabs-popover">
          <div className="media-tabs-header">
            <button 
              className={`media-tab-btn ${activeMediaTab === 'emoji' ? 'active' : ''}`}
              onClick={() => setActiveMediaTab('emoji')}
            >
              <Smile size={16} /> Эмодзи
            </button>
            <button 
              className={`media-tab-btn ${activeMediaTab === 'stickers' ? 'active' : ''}`}
              onClick={() => setActiveMediaTab('stickers')}
            >
              <Sparkles size={16} /> Стикеры
            </button>
            <button 
              className={`media-tab-btn ${activeMediaTab === 'gif' ? 'active' : ''}`}
              onClick={() => setActiveMediaTab('gif')}
            >
              <Zap size={16} /> GIF
            </button>
          </div>

          <div className="media-tabs-body">
            {activeMediaTab === 'emoji' && (
              <div className="emoji-grid">
                {quickEmojis.map(emoji => (
                  <button
                    key={emoji}
                    className="emoji-cell"
                    onClick={() => {
                      setInputValue(prev => prev + emoji);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {activeMediaTab === 'stickers' && (
              <div className="stickers-grid">
                {stickerPacks.map(stk => (
                  <button 
                    key={stk.id} 
                    className="sticker-cell-btn"
                    onClick={() => handleSendSticker(stk.url)}
                    title={stk.title}
                  >
                    <img src={stk.url} alt={stk.title} className="sticker-cell-img" />
                  </button>
                ))}
              </div>
            )}

            {activeMediaTab === 'gif' && (
              <div className="gifs-grid">
                {sampleGifs.map(g => (
                  <button 
                    key={g.id} 
                    className="gif-cell-btn"
                    onClick={() => handleSendGif(g.url)}
                  >
                    <img src={g.url} alt={g.title} className="gif-cell-img" />
                    <span className="gif-title-tag">{g.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXACT MATCH ATTACHMENT MENU (from user's screenshot) */}
      {showAttachMenu && (
        <div className="tg-attach-menu-dark">
          {/* 1. Документ */}
          <button 
            className="attach-dark-row"
            onClick={() => {
              setShowAttachMenu(false);
              docInputRef.current?.click();
            }}
          >
            <span className="attach-icon-badge color-purple"><FileText size={20} /></span>
            <span>Документ</span>
          </button>

          {/* 2. Фото и видео */}
          <button 
            className="attach-dark-row"
            onClick={() => {
              setShowAttachMenu(false);
              fileInputRef.current?.click();
            }}
          >
            <span className="attach-icon-badge color-blue"><ImageIcon size={20} /></span>
            <span>Фото и видео</span>
          </button>

          {/* 3. Камера */}
          <button 
            className="attach-dark-row"
            onClick={() => {
              setShowAttachMenu(false);
              handleAttachSamplePhoto();
            }}
          >
            <span className="attach-icon-badge color-pink"><Camera size={20} /></span>
            <span>Камера</span>
          </button>

          {/* 4. Аудио */}
          <button 
            className="attach-dark-row"
            onClick={() => {
              const audioMsg: Message = {
                id: `audio_${Date.now()}`,
                fromMe: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                text: 'Медитация Полнолуния (432 Гц)',
                mediaType: 'voice',
                voiceDuration: '14:20'
              };
              setMessages(prev => [...prev, audioMsg]);
              setShowAttachMenu(false);
            }}
          >
            <span className="attach-icon-badge color-orange"><Headphones size={20} /></span>
            <span>Аудио</span>
          </button>

          {/* 5. Контакт */}
          <button 
            className="attach-dark-row"
            onClick={() => {
              setShowAttachMenu(false);
              setShowContactModal(true);
            }}
          >
            <span className="attach-icon-badge color-cyan"><UserCheck size={20} /></span>
            <span>Контакт</span>
          </button>

          {/* 6. Опрос */}
          <button 
            className="attach-dark-row"
            onClick={() => {
              setShowAttachMenu(false);
              setShowPollModal(true);
            }}
          >
            <span className="attach-icon-badge color-yellow"><BarChart2 size={20} /></span>
            <span>Опрос</span>
          </button>

          {/* 7. Мероприятие */}
          <button 
            className="attach-dark-row"
            onClick={() => {
              setShowAttachMenu(false);
              setShowEventModal(true);
            }}
          >
            <span className="attach-icon-badge color-rose"><Calendar size={20} /></span>
            <span>Мероприятие</span>
          </button>

          {/* 8. Новый стикер */}
          <button 
            className="attach-dark-row"
            onClick={() => {
              setShowAttachMenu(false);
              setShowMediaTabs(true);
              setActiveMediaTab('stickers');
            }}
          >
            <span className="attach-icon-badge color-teal"><Sparkles size={20} /></span>
            <span>Новый стикер</span>
          </button>

          {/* 9. Каталог (Товары и Услуги с 3% комиссией) */}
          <button 
            className="attach-dark-row highlighted"
            onClick={() => {
              setShowAttachMenu(false);
              setShowCatalogModal(true);
            }}
          >
            <span className="attach-icon-badge color-amber"><ShoppingBag size={20} /></span>
            <span>Каталог товаров/услуг</span>
          </button>

          {/* 10. Быстрые ответы */}
          <button 
            className="attach-dark-row"
            onClick={() => {
              setInputValue('Благодарю за обращение! Отвечу в течение 5 минут. 🙏');
              setShowAttachMenu(false);
            }}
          >
            <span className="attach-icon-badge color-gray"><Zap size={20} /></span>
            <span>Быстрые ответы</span>
          </button>
        </div>
      )}


        {/* Voice recording mode */}
        {isRecordingVoice ? (
          <div className="tg-voice-recording-row">
            <div className="voice-recording-indicator">
              <span className="rec-pulse-dot" />
              <span className="rec-timer">{formatVoiceTime(voiceSeconds)}</span>
              <span className="rec-hint">Запись голосового сообщения...</span>
            </div>

            <div className="voice-recording-actions">
              <button className="voice-cancel-btn" onClick={handleCancelVoice}>
                Отмена
              </button>
              <button className="voice-send-btn" onClick={handleSendVoiceMessage}>
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Normal typing mode */
          <div className="tg-input-row">
            {/* Attachment Button (Paperclip) */}
            <button 
              className={`tg-tool-btn ${showAttachMenu ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowAttachMenu(prev => !prev);
                setShowMediaTabs(false);
              }}
              title="Меню вложений"
            >
              <Paperclip size={21} />
            </button>

            {/* Input Field */}
            <div className="tg-input-wrapper">
              <input
                type="text"
                placeholder={editingMessage ? "Отредактируйте сообщение..." : "Написать сообщение..."}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                className="tg-text-input"
              />

              {/* Media Popover toggle (Emoji / Stickers / GIF) */}
              <button 
                className={`tg-emoji-btn ${showMediaTabs ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMediaTabs(prev => !prev);
                  setShowAttachMenu(false);
                }}
                title="Стикеры, эмодзи и GIF"
              >
                <Smile size={21} />
              </button>
            </div>

            {/* Action Buttons: Toggle Mic/Camera mode & Send/Record */}
            {inputValue.trim() || attachedImage ? (
              <button 
                className="tg-send-action-btn"
                onClick={handleSendMessage}
                title={editingMessage ? "Сохранить изменения" : "Отправить сообщение"}
              >
                <Send size={18} className="tg-send-icon" />
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* Switcher between Mic and Camera note */}
                <button
                  className={`tg-mode-toggle-btn ${inputMode === 'camera' ? 'camera-active' : ''}`}
                  onClick={() => setInputMode(m => m === 'mic' ? 'camera' : 'mic')}
                  title={inputMode === 'mic' ? "Переключить на видео-кружочек" : "Переключить на голосовое"}
                >
                  {inputMode === 'mic' ? <Camera size={19} /> : <Mic size={19} />}
                </button>

                {inputMode === 'mic' ? (
                  <button 
                    className="tg-mic-action-btn"
                    onClick={handleStartVoiceRecord}
                    title="Записать голосовое сообщение"
                  >
                    <Mic size={22} />
                  </button>
                ) : (
                  <button 
                    className="tg-mic-action-btn"
                    style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}
                    onClick={handleOpenVideoNoteRecorder}
                    title="Записать видео-кружочек"
                  >
                    <VideoIcon size={22} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TELEGRAM VIDEO NOTE RECORDER OVERLAY MODAL */}
      {isVideoNoteRecording && (
        <div className="tg-video-note-recorder-overlay">
          <div className="recorder-circle-wrapper">
            <video 
              ref={cameraVideoRef} 
              className="camera-preview-video" 
              autoPlay 
              muted 
              playsInline 
            />
            <div className="recorder-recording-indicator">
              <span className="rec-pulse-point" />
              <span>{formatVoiceTime(videoNoteSeconds)}</span>
            </div>
          </div>

          <div className="recorder-controls-row">
            <button className="btn-rec-cancel" onClick={handleCloseVideoNoteRecorder}>
              Отмена
            </button>
            <button className="btn-rec-send" onClick={handleSendVideoNote}>
              <Send size={16} /> Отправить кружочек
            </button>
          </div>
        </div>
      )}

      {/* POLL CREATION MODAL */}
      {showPollModal && (
        <div className="tg-modal-overlay" onClick={() => setShowPollModal(false)}>
          <div className="tg-delete-modal-box" style={{ textAlign: 'left' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>Создать опрос</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <input 
                type="text" 
                placeholder="Задайте вопрос..." 
                value={pollQuestion} 
                onChange={e => setPollQuestion(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text)' }}
              />
              <input 
                type="text" 
                placeholder="Вариант ответа 1" 
                value={pollOption1} 
                onChange={e => setPollOption1(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text)' }}
              />
              <input 
                type="text" 
                placeholder="Вариант ответа 2" 
                value={pollOption2} 
                onChange={e => setPollOption2(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text)' }}
              />
              <input 
                type="text" 
                placeholder="Вариант ответа 3 (опционально)" 
                value={pollOption3} 
                onChange={e => setPollOption3(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text)' }}
              />
            </div>
            <div className="delete-modal-buttons">
              <button className="modal-btn cancel" onClick={() => setShowPollModal(false)}>Отмена</button>
              <button className="modal-btn" style={{ background: '#eab308', color: '#000' }} onClick={handleCreatePoll}>Создать</button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT CREATION MODAL */}
      {showEventModal && (
        <div className="tg-modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="tg-delete-modal-box" style={{ textAlign: 'left' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>Создать мероприятие</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <input 
                type="text" 
                placeholder="Название встречи / практики..." 
                value={eventTitle} 
                onChange={e => setEventTitle(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text)' }}
              />
              <input 
                type="text" 
                placeholder="Дата (например: 25 сентября)" 
                value={eventDate} 
                onChange={e => setEventDate(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text)' }}
              />
              <input 
                type="text" 
                placeholder="Время (например: 19:00)" 
                value={eventTime} 
                onChange={e => setEventTime(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text)' }}
              />
              <input 
                type="text" 
                placeholder="Место или ссылка (например: Онлайн • Live Zen)" 
                value={eventLocation} 
                onChange={e => setEventLocation(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text)' }}
              />
            </div>
            <div className="delete-modal-buttons">
              <button className="modal-btn cancel" onClick={() => setShowEventModal(false)}>Отмена</button>
              <button className="modal-btn" style={{ background: '#ec4899', color: '#fff' }} onClick={handleCreateEvent}>Создать</button>
            </div>
          </div>
        </div>
      )}

      {/* CATALOG (PRODUCTS & SERVICES) MODAL */}
      {showCatalogModal && (
        <div className="tg-modal-overlay" onClick={() => setShowCatalogModal(false)}>
          <div className="tg-delete-modal-box" style={{ textAlign: 'left', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Прикрепить товар или услугу</h3>
              <button className="modal-close-icon" onClick={() => setShowCatalogModal(false)}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 14 }}>
              С каждой продажи удерживается комиссия платформы 3%.
            </p>
            <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {initialProducts.map(prod => (
                <div 
                  key={prod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 8,
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-secondary)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleShareProduct(prod)}
                >
                  <img src={prod.images[0]} alt={prod.title} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-text)' }}>{prod.title}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-accent)', fontWeight: 600 }}>{prod.price} ₽ · {prod.category || 'Товар'}</div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                    Выбрать
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTACT SELECTION MODAL */}
      {showContactModal && (
        <div className="tg-modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="tg-delete-modal-box" style={{ textAlign: 'left', maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Поделиться контактом</h3>
              <button className="modal-close-icon" onClick={() => setShowContactModal(false)}><X size={20} /></button>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {initialUsers.filter(u => u.id !== 'me').map(u => (
                <div 
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 8,
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-secondary)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleShareContact(u)}
                >
                  <img src={u.avatar} alt={u.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-text)' }}>{u.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>@{u.username}</div>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                    Отправить
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Message Confirmation Modal */}
      {messageToDelete && (
        <div className="tg-modal-overlay" onClick={() => setMessageToDelete(null)}>
          <div className="tg-delete-modal-box" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon-badge">
              <Trash2 size={24} />
            </div>
            <h3>Удалить сообщение?</h3>
            <p className="delete-modal-desc">
              Вы уверены, что хотите удалить это сообщение? Действие нельзя отменить.
            </p>

            <label className="delete-everyone-checkbox">
              <input
                type="checkbox"
                checked={deleteForEveryone}
                onChange={e => setDeleteForEveryone(e.target.checked)}
              />
              <span>Удалить также для {chat.isGroup ? 'всех участников' : chat.user.name}</span>
            </label>

            <div className="delete-modal-buttons">
              <button 
                className="modal-btn cancel"
                onClick={() => setMessageToDelete(null)}
              >
                Отмена
              </button>
              <button 
                className="modal-btn delete"
                onClick={handleConfirmDeleteMessage}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat History Confirmation Modal */}
      {confirmClearChat && (
        <div className="tg-modal-overlay" onClick={() => setConfirmClearChat(false)}>
          <div className="tg-delete-modal-box" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon-badge">
              <Trash2 size={24} />
            </div>
            <h3>Очистить историю сообщений?</h3>
            <p className="delete-modal-desc">
              Все сообщения в этом диалоге будут удалены безвозвратно.
            </p>

            <div className="delete-modal-buttons">
              <button 
                className="modal-btn cancel"
                onClick={() => setConfirmClearChat(false)}
              >
                Отмена
              </button>
              <button 
                className="modal-btn delete"
                onClick={handleClearHistory}
              >
                Очистить всё
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording Player Modal */}
      {selectedRecording && (
        <div className="tg-rec-modal-overlay" onClick={() => setSelectedRecording(null)}>
          <div className="tg-rec-modal-box" onClick={e => e.stopPropagation()}>
            <div className="tg-rec-modal-header">
              <h3>{selectedRecording.title}</h3>
              <button className="modal-close-icon" onClick={() => setSelectedRecording(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="tg-rec-modal-player">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" 
                alt="Recording video" 
                className="tg-rec-video-preview"
              />
              <div className="video-rec-play-overlay">
                <Play size={48} fill="white" color="white" />
              </div>
            </div>
            <div className="tg-rec-modal-footer">
              <span>Длительность: {selectedRecording.duration} · Full HD 1080p</span>
              <button className="btn btn-primary" onClick={() => setSelectedRecording(null)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Theme Customization Modal */}
      {showThemeModal && (
        <div className="tg-modal-overlay" onClick={() => setShowThemeModal(false)}>
          <div className="tg-theme-modal-box" onClick={e => e.stopPropagation()}>
            <div className="group-modal-header">
              <div className="group-modal-header-title">
                <Palette size={20} className="group-modal-icon" />
                <h3>Оформление этого диалога</h3>
              </div>
              <button 
                type="button" 
                className="group-modal-close-btn"
                onClick={() => setShowThemeModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="theme-modal-body">
              <p className="theme-modal-desc">
                Выберите индивидуальную цветовую палитру и фон для чата с <strong>«{chat.groupTitle || chat.user.name}»</strong>:
              </p>

              <div className="themes-grid-picker">
                {CHAT_THEMES.map(theme => {
                  const isSelected = currentTheme.id === theme.id;
                  return (
                    <div 
                      key={theme.id}
                      className={`theme-card-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectTheme(theme)}
                    >
                      <div 
                        className="theme-card-preview"
                        style={{ background: theme.previewBg }}
                      >
                        <div 
                          className="preview-bubble mock-them"
                          style={{ 
                            background: theme.bubbleThemBg || 'var(--color-bg-card)', 
                            color: theme.bubbleThemColor || 'var(--color-text)' 
                          }}
                        >
                          Привет!
                        </div>
                        <div 
                          className="preview-bubble mock-me"
                          style={{ 
                            background: theme.bubbleMeBg || 'var(--color-accent)', 
                            color: theme.bubbleMeColor || '#FFFFFF' 
                          }}
                        >
                          Здравствуйте ✨
                        </div>
                      </div>
                      <div className="theme-card-footer">
                        <span className="theme-card-name">{theme.name}</span>
                        {isSelected && <Check size={14} className="theme-checked-icon" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="group-modal-footer">
              <button 
                type="button" 
                className="modal-btn cancel" 
                onClick={() => setShowThemeModal(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

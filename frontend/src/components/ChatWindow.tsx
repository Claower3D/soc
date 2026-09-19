import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, ArrowLeft, PhoneCall, User as UserIcon, 
  Paperclip, Smile, Mic, Play, Pause, 
  Image as ImageIcon, Video as VideoIcon, 
  CheckCheck, X, Trash2, Edit2, Reply, Copy, Check, MoreVertical,
  Camera, FileText, Headphones, UserCheck, BarChart2, Calendar, 
  Sparkles, ShoppingBag, Zap, VolumeX, Palette, Archive, ArchiveRestore, Lock, Unlock,
  Pin, Languages, Forward, CheckSquare, Search, Bookmark
} from 'lucide-react';
import { 
  type Chat, type Message, type PollData, type EventData, 
  type ProductData, type ContactData, type ChatTheme, CHAT_THEMES, 
  initialUsers, initialProducts, chats as defaultChats 
} from '../data/mock';
import './ChatWindow.css';

interface ChatWindowProps {
  chat: Chat | null;
  onBack: () => void;
  onDeleteChat?: (chatId: string) => void;
  onUpdateChat?: (chatId: string, updates: Partial<Chat>) => void;
  availableChats?: Chat[];
  onSelectChat?: (id: string) => void;
}

import { 
  TELEGRAM_STICKER_PACKS, 
  STICKER_QUICK_REACTIONS, 
  EMOJI_CATEGORIES, 
  TELEGRAM_GIFS
} from '../data/telegramStickers';
import { cacheService } from '../utils/cacheService';

const REACTION_EMOJIS = ['❤️', '👍', '👎', '🔥', '🥰', '👏', '😂'];

export function ChatWindow({ chat, onBack, onDeleteChat, onUpdateChat, availableChats, onSelectChat }: ChatWindowProps) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState(() => {
    return chat?.id ? (cacheService.get<string>(`chat_draft_${chat.id}`) || '') : '';
  });
  const [messages, setMessages] = useState<Message[]>(chat?.messages || []);

  useEffect(() => {
    if (chat?.id) {
      const draft = cacheService.get<string>(`chat_draft_${chat.id}`) || '';
      setInputValue(draft);
    }
  }, [chat?.id]);
  
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
  const [activeMediaTab, setActiveMediaTab] = useState<'search' | 'emoji' | 'stickers' | 'gif'>('stickers');
  const [stickerSearchQuery, setStickerSearchQuery] = useState('');
  const [selectedStickerPackId, setSelectedStickerPackId] = useState<string>('pack_fav');
  const [stickerReactionFilter, setStickerReactionFilter] = useState<string | null>(null);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<string>('recent');
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

  // Right-Click Context Menu State (Screenshot 4)
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    message: Message | null;
  }>({ visible: false, x: 0, y: 0, message: null });

  // Selected messages mode
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);

  // Forward Message Modal State (Telegram Forward Dialog)
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messagesToForward, setMessagesToForward] = useState<Message[]>([]);
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');
  const [selectedTargetChatId, setSelectedTargetChatId] = useState<string | null>(null);
  const [forwardComment, setForwardComment] = useState('');
  const [forwardToastMessage, setForwardToastMessage] = useState<string | null>(null);

  // Close context menu on any outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, message: null });
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [contextMenu.visible]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const videoNoteTimerRef = useRef<number | null>(null);

  // Sync messages when chat changes and ensure active chat is marked read
  useEffect(() => {
    if (chat) {
      const hasUnread = chat.unread > 0;
      const hasUnreadMessages = chat.messages.some(m => !m.fromMe && m.status !== 'read');
      if ((hasUnread || hasUnreadMessages) && onUpdateChat) {
        const readMsgs = chat.messages.map(m => (!m.fromMe || !m.status ? { ...m, status: 'read' as const } : m));
        onUpdateChat(chat.id, { unread: 0, messages: readMsgs });
      }
    }
    setMessages(chat?.messages || []);
    const draft = chat?.id ? (cacheService.get<string>(`chat_draft_${chat.id}`) || '') : '';
    setInputValue(draft);
    setAttachedImage(null);
    setIsRecordingVoice(false);
    setShowAttachMenu(false);
    setShowMediaTabs(false);
    setEditingMessage(null);
    setReplyingToMessage(null);
    setMessageToDelete(null);
  }, [chat?.id]);

  // Sync internal messages if chat.messages array reference updates from parent
  useEffect(() => {
    if (chat?.messages) {
      setMessages(chat.messages);
    }
  }, [chat?.messages]);

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

  // Toggle Reaction on a message (hover bar or context menu - Screenshot 4 & 5)
  const handleToggleReaction = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const currentReactions = m.reactions ? [...m.reactions] : [];
      const existingIdx = currentReactions.findIndex(r => r.emoji === emoji);

      if (existingIdx >= 0) {
        const item = currentReactions[existingIdx];
        if (item.fromMe) {
          // Remove my reaction
          if (item.count <= 1) {
            currentReactions.splice(existingIdx, 1);
          } else {
            currentReactions[existingIdx] = { ...item, count: item.count - 1, fromMe: false };
          }
        } else {
          // Add my reaction
          currentReactions[existingIdx] = { ...item, count: item.count + 1, fromMe: true };
        }
      } else {
        // New reaction
        currentReactions.push({ emoji, count: 1, fromMe: true });
      }

      return { ...m, reactions: currentReactions };
    }));

    // Close context menu if open
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  // Right Click Context Menu Handler
  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent menu going offscreen
    const menuWidth = 240;
    const menuHeight = 360;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

    setContextMenu({
      visible: true,
      x: Math.max(10, x),
      y: Math.max(10, y),
      message: msg
    });
  };

  // Pin / Unpin message
  const handleTogglePinMessage = (msg: Message) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isPinned: !m.isPinned } : m));
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  // Translate simulated
  const handleTranslateMessage = (msg: Message) => {
    if (!msg.text) return;
    const translated = `[Переведено]: ${msg.text}`;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, text: translated } : m));
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  // Forward single message (Opens Telegram Forward Modal)
  const handleForwardMessage = (msg: Message) => {
    setMessagesToForward([msg]);
    setSelectedTargetChatId(null);
    setForwardComment('');
    setForwardSearchQuery('');
    setShowForwardModal(true);
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  // Select message
  const handleSelectMessage = (msg: Message) => {
    setSelectedMessageIds(prev => prev.includes(msg.id) ? prev.filter(id => id !== msg.id) : [...prev, msg.id]);
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  // Helper for plural text (1 сообщение, 2 сообщения, 5 сообщений)
  const getSelectedCountText = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 19) {
      return `${count} сообщений`;
    }
    if (mod10 === 1) {
      return `${count} сообщение`;
    }
    if (mod10 >= 2 && mod10 <= 4) {
      return `${count} сообщения`;
    }
    return `${count} сообщений`;
  };

  const handleDeleteSelected = () => {
    if (selectedMessageIds.length === 0) return;
    const count = selectedMessageIds.length;
    if (window.confirm(`Удалить ${getSelectedCountText(count)}?`)) {
      const remaining = messages.filter(m => !selectedMessageIds.includes(m.id));
      setMessages(remaining);
      if (chat && onUpdateChat) {
        onUpdateChat(chat.id, { messages: remaining });
      }
      setSelectedMessageIds([]);
    }
  };

  // Forward selected messages (Opens Telegram Forward Modal)
  const handleForwardSelected = () => {
    if (selectedMessageIds.length === 0) return;
    const toForward = messages.filter(m => selectedMessageIds.includes(m.id));
    setMessagesToForward(toForward);
    setSelectedTargetChatId(null);
    setForwardComment('');
    setForwardSearchQuery('');
    setShowForwardModal(true);
  };

  // Execute Telegram message forwarding
  const handleConfirmForward = () => {
    if (!selectedTargetChatId || messagesToForward.length === 0) return;

    const targetList = availableChats || defaultChats;
    const targetChat = targetList.find(c => c.id === selectedTargetChatId);
    if (!targetChat) return;

    const senderName = chat?.user.name || (chat?.isGroup ? chat.groupTitle : 'Пользователь');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Build new forwarded messages with forwardedFrom label
    const newForwardedMsgs: Message[] = messagesToForward.map((origMsg, idx) => ({
      ...origMsg,
      id: `fwd_${Date.now()}_${idx}`,
      fromMe: true,
      time: nowTime,
      forwardedFrom: origMsg.forwardedFrom || (origMsg.fromMe ? 'Вы' : senderName),
      status: 'sent' as const,
      reactions: []
    }));

    // If there's an additional comment entered by user
    if (forwardComment.trim()) {
      newForwardedMsgs.push({
        id: `fwd_cmt_${Date.now()}`,
        text: forwardComment.trim(),
        fromMe: true,
        time: nowTime,
        status: 'sent' as const
      });
    }

    const countText = getSelectedCountText(messagesToForward.length);
    const targetChatName = targetChat.groupTitle || targetChat.user.name;

    // If forwarded to the current active chat
    if (chat && targetChat.id === chat.id) {
      setMessages(prev => [...prev, ...newForwardedMsgs]);
      if (onUpdateChat) {
        onUpdateChat(chat.id, {
          messages: [...messages, ...newForwardedMsgs]
        });
      }
    } else {
      // Forwarded to another chat
      if (onUpdateChat) {
        onUpdateChat(targetChat.id, {
          messages: [...targetChat.messages, ...newForwardedMsgs],
          unread: (targetChat.unread || 0) + 1
        });
      }
      // Switch to the target chat so user sees their forwarded message
      if (onSelectChat) {
        onSelectChat(targetChat.id);
      }
    }

    // Show temporary toast notification
    setForwardToastMessage(`${countText} переслано в «${targetChatName}»`);
    setTimeout(() => {
      setForwardToastMessage(null);
    }, 3500);

    setShowForwardModal(false);
    setSelectedMessageIds([]);
    setMessagesToForward([]);
    setForwardComment('');
    setSelectedTargetChatId(null);
  };

  const handleCancelSelection = () => {
    setSelectedMessageIds([]);
  };

  // Close context menu or cancel selection on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedMessageIds.length > 0) {
          setSelectedMessageIds([]);
        }
        if (contextMenu.visible) {
          setContextMenu({ visible: false, x: 0, y: 0, message: null });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMessageIds.length, contextMenu.visible]);

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

    const isRecipientOnline = chat ? (chat.isGroup || chat.id === 'ai_guru_bot' || chat.id === 'chat_ai_oracle' || chat.user.online) : false;
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

    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);
    if (chat && onUpdateChat) {
      onUpdateChat(chat.id, { 
        messages: nextMessages,
        lastMessage: newMsg.text || (attachedImage ? '📷 Изображение' : 'Сообщение'),
        time: newMsg.time,
        unread: 0
      });
    }

    if (isRecipientOnline) {
      setTimeout(() => {
        setMessages(curr => {
          const updated = curr.map(m => m.id === newMsg.id ? { ...m, status: 'read' as const } : m);
          if (chat && onUpdateChat) {
            onUpdateChat(chat.id, { messages: updated, unread: 0 });
          }
          return updated;
        });
      }, 2000);
    }
    if (chat?.id) {
      cacheService.remove(`chat_draft_${chat.id}`);
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

        const replyMsg: Message = {
          id: `guru_reply_${Date.now()}`,
          text: guruAnswer,
          fromMe: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        };

        setMessages(mPrev => {
          const list = [...mPrev, replyMsg];
          if (chat && onUpdateChat) {
            onUpdateChat(chat.id, {
              messages: list,
              lastMessage: guruAnswer,
              time: replyMsg.time,
              unread: 0
            });
          }
          return list;
        });
      }, 700);
    }

    // ИИ Оракул авто-ответ
    if (chat?.id === 'chat_ai_oracle') {
      const userText = (newMsg.text || '').toLowerCase();
      setTimeout(() => {
        // Генерируем ответ на основе ключевых слов
        let oracleAnswer: string;
        if (userText.includes('привет') || userText.includes('здравствуй') || userText.includes('хай')) {
          oracleAnswer = '👋 Привет! Рад тебя видеть в New Age! Чем могу помочь?';
        } else if (userText.includes('как дела') || userText.includes('как ты')) {
          oracleAnswer = '✨ У меня всё отлично, я же ИИ — всегда в форме! А как у тебя?';
        } else if (userText.includes('помощь') || userText.includes('помоги') || userText.includes('help')) {
          oracleAnswer = '🤝 Конечно помогу! Ты можешь:\n\n• 📸 Публиковать посты и сторис\n• 🎥 Загружать видео и клипы\n• 💬 Общаться в мессенджере\n• 🛒 Продавать на маркетплейсе\n• 👥 Вступать в сообщества\n\nЧто именно интересует?';
        } else if (userText.includes('кто ты') || userText.includes('что ты')) {
          oracleAnswer = '🔮 Я ИИ Оракул — встроенный ассистент платформы New Age. Я помогаю пользователям ориентироваться и отвечаю на вопросы!';
        } else if (userText.includes('спасибо') || userText.includes('thanks')) {
          oracleAnswer = '😊 Всегда пожалуйста! Обращайся если что.';
        } else {
          const replies = [
            '🤔 Интересный вопрос! Я пока учусь, но скоро смогу помогать с этим.',
            '✨ Принял! Когда подключат полноценный AI, я смогу ответить подробнее.',
            '💭 Хмм, дай подумать... Пока что я знаю базовые команды, но развиваюсь!',
            '🚀 Отличная мысль! Платформа New Age только растёт.',
            '👀 Записал. Если что-то ещё нужно — пиши, я всегда на связи!',
          ];
          oracleAnswer = replies[Math.floor(Math.random() * replies.length)];
        }

        const replyMsg: Message = {
          id: `oracle_reply_${Date.now()}`,
          text: oracleAnswer,
          fromMe: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        };

        setMessages(mPrev => {
          const list = [...mPrev, replyMsg];
          if (chat && onUpdateChat) {
            onUpdateChat(chat.id, {
              messages: list,
              lastMessage: oracleAnswer,
              time: replyMsg.time,
              unread: 0
            });
          }
          return list;
        });
      }, 800 + Math.random() * 1200);
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

      {/* PINNED MESSAGE BANNER (TELEGRAM STYLE) */}
      {messages.some(m => m.isPinned) && (
        <div className="tg-pinned-bar">
          <div className="pinned-bar-content">
            <Pin size={15} className="pinned-icon" />
            <div className="pinned-text-wrap">
              <span className="pinned-label">Закрепленное сообщение</span>
              <span className="pinned-preview">
                {messages.find(m => m.isPinned)?.text || 'Вложение'}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="pinned-unpin-btn" 
            onClick={() => {
              const pinned = messages.find(m => m.isPinned);
              if (pinned) handleTogglePinMessage(pinned);
            }}
            title="Открепить"
          >
            <X size={15} />
          </button>
        </div>
      )}

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
              <div 
                key={msg.id} 
                className={`tg-msg-row ${isMe ? 'outgoing' : 'incoming'} ${selectedMessageIds.includes(msg.id) ? 'selected-msg' : ''} ${selectedMessageIds.length > 0 ? 'selection-mode' : ''}`}
                onContextMenu={(e) => handleContextMenu(e, msg)}
                onClick={() => {
                  if (selectedMessageIds.length > 0) {
                    handleSelectMessage(msg);
                  }
                }}
              >
                {/* Telegram Selection Checkbox Circle (Matches Screenshot 2) */}
                {selectedMessageIds.length > 0 && (
                  <div 
                    className={`tg-msg-select-check ${selectedMessageIds.includes(msg.id) ? 'checked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectMessage(msg);
                    }}
                    title={selectedMessageIds.includes(msg.id) ? "Снять выбор" : "Выбрать сообщение"}
                  >
                    {selectedMessageIds.includes(msg.id) && (
                      <Check size={13} strokeWidth={3.2} className="tg-check-icon" />
                    )}
                  </div>
                )}

                {/* Floating message actions toolbar on hover */}
                <div className="tg-msg-wrapper">
                  <div className="tg-msg-actions-toolbar">
                    {/* Hover Reaction Bar (Screenshot 4 top) */}
                    <div className="hover-reactions-strip">
                      {REACTION_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className="hover-reaction-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleReaction(msg.id, emoji);
                          }}
                          title={`Поставить ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <div className="toolbar-divider" />
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
                      {/* Telegram Forwarded Header */}
                      {msg.forwardedFrom && (
                        <div className="tg-forwarded-bubble-header">
                          <Forward size={12} className="tg-forward-header-icon" />
                          <span>Переслано от <strong>{msg.forwardedFrom}</strong></span>
                        </div>
                      )}

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

                      {/* Timestamp, Seen ticks & Attached Reactions (Screenshot 5) */}
                      <div className="tg-meta">
                        <span className="tg-time">{msg.time}</span>
                        {isMe && renderMessageTicks(msg)}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="msg-reaction-badges-row">
                            {msg.reactions.map((r, rIdx) => (
                              <button
                                key={rIdx}
                                type="button"
                                className={`msg-reaction-badge ${r.fromMe ? 'my-reaction' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleReaction(msg.id, r.emoji);
                                }}
                                title={`Реакция ${r.emoji}: ${r.count}`}
                              >
                                <span>{r.emoji}</span>
                                {r.count > 1 && <span className="reaction-count">{r.count}</span>}
                              </button>
                            ))}
                          </div>
                        )}
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

            {/* TELEGRAM RIGHT-CLICK CONTEXT MENU (EXACT SCREENSHOT 4) */}
      {contextMenu.visible && contextMenu.message && (
        <div 
          className="tg-context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          {/* Top Emoji Reactions Strip */}
          <div className="context-reactions-bar">
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                className="context-reaction-btn"
                onClick={() => handleToggleReaction(contextMenu.message!.id, emoji)}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="context-menu-divider" />

          {/* 1. Ответить */}
          <button 
            type="button" 
            className="context-menu-row"
            onClick={() => {
              setReplyingToMessage(contextMenu.message);
              setContextMenu({ visible: false, x: 0, y: 0, message: null });
            }}
          >
            <Reply size={16} />
            <span>Ответить</span>
          </button>

          {/* 2. Копировать */}
          <button 
            type="button" 
            className="context-menu-row"
            onClick={() => {
              handleCopyMessage(contextMenu.message!);
              setContextMenu({ visible: false, x: 0, y: 0, message: null });
            }}
          >
            <Copy size={16} />
            <span>Копировать</span>
          </button>

          {/* 3. Перевести */}
          <button 
            type="button" 
            className="context-menu-row"
            onClick={() => handleTranslateMessage(contextMenu.message!)}
          >
            <Languages size={16} />
            <span>Перевести</span>
          </button>

          {/* 4. Закрепить */}
          <button 
            type="button" 
            className="context-menu-row"
            onClick={() => handleTogglePinMessage(contextMenu.message!)}
          >
            <Pin size={16} />
            <span>{contextMenu.message.isPinned ? 'Открепить' : 'Закрепить'}</span>
          </button>

          {/* 5. Переслать */}
          <button 
            type="button" 
            className="context-menu-row"
            onClick={() => handleForwardMessage(contextMenu.message!)}
          >
            <Forward size={16} />
            <span>Переслать</span>
          </button>

          {/* 6. Выбрать */}
          <button 
            type="button" 
            className="context-menu-row"
            onClick={() => handleSelectMessage(contextMenu.message!)}
          >
            <CheckSquare size={16} />
            <span>Выбрать</span>
          </button>

          <div className="context-menu-divider" />

          {/* 7. Удалить */}
          <button 
            type="button" 
            className="context-menu-row danger"
            onClick={() => {
              setMessageToDelete(contextMenu.message);
              setContextMenu({ visible: false, x: 0, y: 0, message: null });
            }}
          >
            <Trash2 size={16} />
            <span>Удалить</span>
          </button>
        </div>
      )}

      {/* Standard Telegram Bottom Input Bar OR Telegram Multi-select Action Bar */}
      <div className="tg-bottom-bar">
        {selectedMessageIds.length > 0 ? (
          /* Telegram Multi-select Action Bar (Matches Screenshot 2) */
          <div className="tg-selection-bottom-bar">
            <button 
              type="button" 
              className="tg-selection-action-btn delete"
              onClick={handleDeleteSelected}
              title="Удалить выбранные сообщения"
            >
              <Trash2 size={20} />
            </button>

            <div className="tg-selection-counter-wrapper">
              <span className="tg-selection-count-text">
                {getSelectedCountText(selectedMessageIds.length)}
              </span>
            </div>

            <div className="tg-selection-right-actions">
              <button 
                type="button" 
                className="tg-selection-action-btn forward"
                onClick={handleForwardSelected}
                title="Переслать выбранные сообщения"
              >
                <Forward size={20} />
              </button>

              <button
                type="button"
                className="tg-selection-action-btn close"
                onClick={handleCancelSelection}
                title="Отменить выбор (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          <>
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

{/* TELEGRAM STICKERS, EMOJIS & GIF POPUP TABS (EXACT SCREENSHOT MATCH) */}
      {showMediaTabs && (
        <div className="tg-media-tabs-popover telegram-stickers-popup" onClick={e => e.stopPropagation()}>
          {/* Top Bar: Sticker packs on 'stickers', Categories on 'emoji', Tags on 'gif' */}
          {activeMediaTab === 'stickers' && (
            <div className="tg-sticker-top-packs-bar">
              {TELEGRAM_STICKER_PACKS.map(pack => (
                <button
                  key={pack.id}
                  type="button"
                  className={`tg-top-pack-item ${selectedStickerPackId === pack.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedStickerPackId(pack.id);
                    const el = document.getElementById(`section_${pack.id}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                  title={pack.title}
                >
                  {pack.avatar === 'bookmark' ? (
                    <Bookmark size={18} className="fav-pack-icon" />
                  ) : (
                    <img src={pack.avatar} alt={pack.title} className="top-pack-thumb" />
                  )}
                </button>
              ))}
            </div>
          )}

          {activeMediaTab === 'emoji' && (
            <div className="tg-emoji-top-categories-bar">
              {EMOJI_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`tg-emoji-category-tab ${activeEmojiCategory === cat.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveEmojiCategory(cat.id);
                    const el = document.getElementById(`emoji_cat_${cat.id}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                  title={cat.name}
                >
                  <span className="emoji-cat-icon">{cat.icon}</span>
                </button>
              ))}
            </div>
          )}

          {activeMediaTab === 'gif' && (
            <div className="tg-gif-top-tags-bar">
              {['🔥 Огонь', '✨ Салют', '😂 Смех', '⚡ Кибер', '🌿 Дзен', '🎉 Праздник'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  className="tg-gif-tag-pill"
                  onClick={() => setStickerSearchQuery(tag.split(' ')[1] || tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Search bar with emoji quick filters (Screenshot: 🔍 Поиск стикеров + ❤️ 👍 👎 🎉 😀 😢) */}
          <div className="tg-sticker-search-row">
            <div className="tg-sticker-search-input-wrap">
              <Search size={15} className="search-icon-muted" />
              <input 
                type="text"
                className="tg-sticker-search-field"
                placeholder={
                  activeMediaTab === 'stickers' 
                    ? 'Поиск стикеров' 
                    : activeMediaTab === 'emoji' 
                    ? 'Поиск эмодзи' 
                    : 'Поиск GIF'
                }
                value={stickerSearchQuery}
                onChange={(e) => {
                  setStickerSearchQuery(e.target.value);
                  if (stickerReactionFilter) setStickerReactionFilter(null);
                }}
              />
              {stickerSearchQuery && (
                <button type="button" className="clear-search-btn" onClick={() => setStickerSearchQuery('')}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Reaction filters only on Stickers tab */}
            {activeMediaTab === 'stickers' && (
              <div className="tg-sticker-reaction-pills">
                {STICKER_QUICK_REACTIONS.map(rx => (
                  <button
                    key={rx.emoji}
                    type="button"
                    className={`tg-reaction-filter-btn ${stickerReactionFilter === rx.emoji ? 'active' : ''}`}
                    onClick={() => {
                      setStickerReactionFilter(prev => prev === rx.emoji ? null : rx.emoji);
                      setStickerSearchQuery('');
                    }}
                    title={rx.label}
                  >
                    {rx.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Media Content Area */}
          <div className="tg-stickers-content-scroll">
            {activeMediaTab === 'stickers' && (
              <div className="tg-sticker-sections-list">
                {TELEGRAM_STICKER_PACKS.map(pack => {
                  let filteredStickers = pack.stickers;
                  if (stickerReactionFilter) {
                    filteredStickers = filteredStickers.filter(s => s.emoji === stickerReactionFilter);
                  }
                  if (stickerSearchQuery.trim()) {
                    const q = stickerSearchQuery.toLowerCase();
                    filteredStickers = filteredStickers.filter(s => 
                      pack.title.toLowerCase().includes(q) || (s.emoji && s.emoji.includes(q))
                    );
                  }

                  if (filteredStickers.length === 0 && (stickerReactionFilter || stickerSearchQuery)) {
                    return null;
                  }

                  return (
                    <div key={pack.id} id={`section_${pack.id}`} className="tg-sticker-pack-section">
                      <div className="tg-sticker-pack-title">
                        {pack.title}
                      </div>

                      <div className="tg-stickers-grid-cells">
                        {filteredStickers.map(stk => (
                          <button
                            key={stk.id}
                            type="button"
                            className="tg-sticker-single-item"
                            onClick={() => handleSendSticker(stk.url)}
                            title={`${pack.title} ${stk.emoji || ''}`}
                          >
                            <img src={stk.url} alt="Sticker" className="tg-sticker-img" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeMediaTab === 'emoji' && (
              <div className="tg-emojis-pane">
                {EMOJI_CATEGORIES.map(cat => {
                  const filteredEmojis = cat.emojis.filter(e => 
                    !stickerSearchQuery.trim() || e.includes(stickerSearchQuery.trim())
                  );
                  if (filteredEmojis.length === 0) return null;

                  return (
                    <div key={cat.id} id={`emoji_cat_${cat.id}`} className="emoji-cat-section">
                      <div className="tg-sticker-pack-title emoji-cat-header-title">
                        {cat.name}
                      </div>
                      <div className="emoji-grid-expanded">
                        {filteredEmojis.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            className="emoji-large-cell"
                            onClick={() => setInputValue(prev => prev + emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeMediaTab === 'gif' && (
              <div className="tg-gifs-pane">
                <div className="tg-sticker-pack-title">Популярные GIF</div>
                <div className="gifs-grid">
                  {TELEGRAM_GIFS.map(g => (
                    <button 
                      key={g.id} 
                      type="button"
                      className="gif-cell-btn"
                      onClick={() => handleSendGif(g.url)}
                    >
                      <img src={g.url} alt={g.title} className="gif-cell-img" />
                      <span className="gif-title-tag">{g.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Telegram Navigation Bar (🔍 Search, 😊 Emoji, 🐱 Stickers, 🎬 GIF) */}
          <div className="tg-sticker-bottom-nav">
            <button
              type="button"
              className="tg-bottom-tab-icon search"
              onClick={() => {
                const inp = document.querySelector('.tg-sticker-search-field') as HTMLInputElement;
                inp?.focus();
              }}
              title="Поиск"
            >
              <Search size={19} />
            </button>

            <button
              type="button"
              className={`tg-bottom-tab-icon ${activeMediaTab === 'emoji' ? 'active' : ''}`}
              onClick={() => setActiveMediaTab('emoji')}
              title="Эмодзи"
            >
              <Smile size={20} />
            </button>

            <button
              type="button"
              className={`tg-bottom-tab-icon ${activeMediaTab === 'stickers' ? 'active' : ''}`}
              onClick={() => setActiveMediaTab('stickers')}
              title="Стикеры"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 0 0-10 10c0 5.52 4.48 10 10 10a10 10 0 0 0 10-10c0-2.5-.9-4.8-2.4-6.6L12 2z"/>
                <path d="M19.6 5.4A10 10 0 0 0 12 2v8h8c0-1.8-.7-3.4-1.8-4.6z"/>
                <circle cx="9" cy="11" r="1.2" fill="currentColor"/>
                <circle cx="15" cy="11" r="1.2" fill="currentColor"/>
                <path d="M9 15c1 1.2 2 1.5 3 1.5s2-.3 3-1.5"/>
              </svg>
            </button>

            <button
              type="button"
              className={`tg-bottom-tab-icon ${activeMediaTab === 'gif' ? 'active' : ''}`}
              onClick={() => setActiveMediaTab('gif')}
              title="GIF"
            >
              <span className="gif-text-icon">GIF</span>
            </button>
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
                onChange={e => {
                  const val = e.target.value;
                  setInputValue(val);
                  if (chat?.id) {
                    if (val.trim()) {
                      cacheService.set(`chat_draft_${chat.id}`, val, 3600 * 48, 'chat_draft');
                    } else {
                      cacheService.remove(`chat_draft_${chat.id}`);
                    }
                  }
                }}
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
        </>
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

      {/* TELEGRAM FORWARD MODAL (EXACT TELEGRAM STYLE) */}
      {showForwardModal && (
        <div className="tg-modal-overlay" onClick={() => setShowForwardModal(false)}>
          <div className="tg-forward-modal-card" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="tg-forward-modal-head">
              <div>
                <h3 className="tg-forward-title">Переслать сообщение</h3>
                <span className="tg-forward-subtitle">
                  {getSelectedCountText(messagesToForward.length)}
                </span>
              </div>
              <button 
                type="button" 
                className="tg-forward-close-btn"
                onClick={() => setShowForwardModal(false)}
                title="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview of messages being forwarded */}
            <div className="tg-forward-preview-strip">
              <Forward size={14} className="preview-fwd-icon" />
              <div className="preview-text-box">
                <span className="preview-sender">
                  {chat?.user.name || 'Диалог'}:
                </span>
                <span className="preview-snippet">
                  {messagesToForward.map(m => m.text || (m.mediaType === 'image' ? 'Фотография' : m.mediaType === 'voice' ? 'Голосовое сообщение' : 'Медиа')).join(' • ').slice(0, 65)}
                  {messagesToForward.map(m => m.text || '').join('').length > 65 ? '...' : ''}
                </span>
              </div>
            </div>

            {/* Search chats field */}
            <div className="tg-forward-search-box">
              <Search size={16} className="forward-search-icon" />
              <input
                type="text"
                placeholder="Поиск чатов и контактов..."
                value={forwardSearchQuery}
                onChange={e => setForwardSearchQuery(e.target.value)}
                autoFocus
              />
              {forwardSearchQuery && (
                <button 
                  type="button" 
                  className="search-clear-btn"
                  onClick={() => setForwardSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Chats and Contacts list */}
            <div className="tg-forward-chats-list">
              {((availableChats || defaultChats).filter(c => 
                c.user.name.toLowerCase().includes(forwardSearchQuery.toLowerCase()) ||
                (c.groupTitle && c.groupTitle.toLowerCase().includes(forwardSearchQuery.toLowerCase())) ||
                c.user.username.toLowerCase().includes(forwardSearchQuery.toLowerCase())
              )).map(c => {
                const isSelected = selectedTargetChatId === c.id;
                const chatDisplayName = c.groupTitle || c.user.name;
                return (
                  <div
                    key={c.id}
                    className={`tg-forward-chat-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedTargetChatId(c.id)}
                  >
                    <div className="forward-chat-avatar-wrap">
                      <img src={c.user.avatar} alt={chatDisplayName} className="forward-chat-avatar" />
                      {c.user.online && <span className="forward-online-dot" />}
                    </div>

                    <div className="forward-chat-info">
                      <div className="forward-chat-name-row">
                        <span className="forward-chat-name">{chatDisplayName}</span>
                        {c.isGroup && <span className="forward-group-tag">Группа</span>}
                      </div>
                      <span className="forward-chat-meta">
                        {c.user.online ? 'в сети' : `@${c.user.username}`}
                      </span>
                    </div>

                    <div className={`forward-radio-circle ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional Comment Input */}
            <div className="tg-forward-comment-row">
              <input
                type="text"
                placeholder="Добавить комментарий к пересылке..."
                value={forwardComment}
                onChange={e => setForwardComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && selectedTargetChatId) {
                    handleConfirmForward();
                  }
                }}
              />
            </div>

            {/* Modal Footer Actions */}
            <div className="tg-forward-modal-foot">
              <button
                type="button"
                className="btn-forward-cancel"
                onClick={() => setShowForwardModal(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn-forward-submit"
                disabled={!selectedTargetChatId}
                onClick={handleConfirmForward}
              >
                <Forward size={16} />
                <span>
                  {selectedTargetChatId 
                    ? `Отправить в ${(availableChats || defaultChats).find(c => c.id === selectedTargetChatId)?.user.name || 'чат'}` 
                    : 'Выберите чат для отправки'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Toast for Forward success */}
      {forwardToastMessage && (
        <div className="tg-forward-toast-banner">
          <Check size={16} className="toast-icon" />
          <span>{forwardToastMessage}</span>
        </div>
      )}
    </div>
  );
}

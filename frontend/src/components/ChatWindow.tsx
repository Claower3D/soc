import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, ArrowLeft, PhoneCall, User as UserIcon, 
  Paperclip, Smile, Mic, Play, Pause, 
  Image as ImageIcon, Video as VideoIcon, 
  CheckCheck, X, Trash2, Edit2, Reply, Copy, Check, MoreVertical
} from 'lucide-react';
import type { Chat, Message } from '../data/mock';
import './ChatWindow.css';

interface ChatWindowProps {
  chat: Chat | null;
  onBack: () => void;
  onDeleteChat?: (chatId: string) => void;
}

const quickEmojis = ['😊', '😂', '🔥', '👍', '❤️', '🚀', '🎉', '👏', '👀', '💯', '🙌', '✨'];

export function ChatWindow({ chat, onBack, onDeleteChat }: ChatWindowProps) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>(chat?.messages || []);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<{ title: string; duration: string } | null>(null);
  
  // Deleting & Editing state
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [deleteForEveryone, setDeleteForEveryone] = useState(true);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [confirmClearChat, setConfirmClearChat] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<number | null>(null);

  // Sync messages when chat changes
  useEffect(() => {
    setMessages(chat?.messages || []);
    setInputValue('');
    setAttachedImage(null);
    setIsRecordingVoice(false);
    setShowAttachMenu(false);
    setShowEmojiPicker(false);
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

  if (!chat) {
    return (
      <div className="chat-window-empty">
        <div className="empty-message-bubble">Выберите диалог для начала общения</div>
      </div>
    );
  }

  const formatVoiceTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  // Send or Edit message
  const handleSendMessage = () => {
    if (!inputValue.trim() && !attachedImage) return;

    if (editingMessage) {
      // Save edited message
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

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      text: replyPrefix ? replyPrefix + inputValue.trim() : (inputValue.trim() || undefined),
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaUrl: attachedImage || undefined,
      mediaType: attachedImage ? 'image' : undefined,
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setAttachedImage(null);
    setReplyingToMessage(null);
    setShowAttachMenu(false);
    setShowEmojiPicker(false);
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

  // Finish and send voice note
  const handleSendVoiceMessage = () => {
    const durationStr = formatVoiceTime(voiceSeconds || 3);
    const newVoiceMsg: Message = {
      id: `voice_${Date.now()}`,
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaType: 'voice',
      voiceDuration: durationStr,
      text: 'Голосовое сообщение',
    };
    setMessages(prev => [...prev, newVoiceMsg]);
    setIsRecordingVoice(false);
    setVoiceSeconds(0);
  };

  const handleCancelVoice = () => {
    setIsRecordingVoice(false);
    setVoiceSeconds(0);
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

  const togglePlayVoice = (id: string) => {
    if (playingVoiceId === id) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(id);
    }
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
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*,video/*"
        onChange={handleFileChange}
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
              <span className="tg-header-name">{chat.groupTitle || chat.user.name}</span>
              <span className="tg-header-status">
                {chat.isGroup ? (
                  `${chat.membersCount || 6} участников · группа конференции`
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

          {!chat.isGroup && (
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
                {onDeleteChat && (
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

      {/* Messages Feed Area */}
      <div className="tg-messages-scroll">
        {messages.length === 0 ? (
          <div className="empty-messages-notice">
            <span>Сообщений пока нет. Начните диалог первым!</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.fromMe;
            const isVoice = msg.mediaType === 'voice';
            const isImage = msg.mediaType === 'image';
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

                    {isMe && msg.text && !isVoice && (
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

                  <div className={`tg-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
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
                      {isMe && <CheckCheck size={14} className="tg-ticks" />}
                    </div>
                  </div>
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

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="tg-emoji-popover">
          <div className="emoji-grid">
            {quickEmojis.map(emoji => (
              <button
                key={emoji}
                className="emoji-cell"
                onClick={() => {
                  setInputValue(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paperclip Attachment Menu Popover */}
      {showAttachMenu && (
        <div className="tg-attach-menu">
          <button 
            className="attach-option"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="attach-icon-circle blue">
              <ImageIcon size={18} />
            </div>
            <span>Выбрать фото/видео</span>
          </button>

          <button 
            className="attach-option"
            onClick={handleAttachSamplePhoto}
          >
            <div className="attach-icon-circle purple">
              <ImageIcon size={18} />
            </div>
            <span>Демо-изображение</span>
          </button>

          <button 
            className="attach-option"
            onClick={() => {
              const newRecMsg: Message = {
                id: `rec_share_${Date.now()}`,
                fromMe: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                conferenceRecording: {
                  title: 'Запись недавней конференции',
                  duration: '34:20',
                  date: 'Сегодня',
                  code: 'rec-recent',
                },
              };
              setMessages(prev => [...prev, newRecMsg]);
              setShowAttachMenu(false);
            }}
          >
            <div className="attach-icon-circle green">
              <VideoIcon size={18} />
            </div>
            <span>Прикрепить запись звонка</span>
          </button>
        </div>
      )}

      {/* Standard Telegram Bottom Input Bar */}
      <div className="tg-bottom-bar">
        {/* Voice recording mode */}
        {isRecordingVoice ? (
          <div className="tg-voice-recording-row">
            <div className="voice-recording-indicator">
              <span className="rec-pulse-dot" />
              <span className="rec-timer">{formatVoiceTime(voiceSeconds)}</span>
              <span className="rec-hint">Идет запись голосового сообщения...</span>
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
              onClick={() => {
                setShowAttachMenu(!showAttachMenu);
                setShowEmojiPicker(false);
              }}
              title="Прикрепить файл или фото"
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

              {/* Emoji/Sticker button */}
              <button 
                className={`tg-emoji-btn ${showEmojiPicker ? 'active' : ''}`}
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowAttachMenu(false);
                }}
                title="Смайлики"
              >
                <Smile size={21} />
              </button>
            </div>

            {/* Action Button: Voice recording OR Send button */}
            {inputValue.trim() || attachedImage ? (
              <button 
                className="tg-send-action-btn"
                onClick={handleSendMessage}
                title={editingMessage ? "Сохранить изменения" : "Отправить сообщение"}
              >
                <Send size={18} className="tg-send-icon" />
              </button>
            ) : (
              <button 
                className="tg-mic-action-btn"
                onClick={() => setIsRecordingVoice(true)}
                title="Записать голосовое сообщение"
              >
                <Mic size={22} />
              </button>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}

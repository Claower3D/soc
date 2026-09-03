import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, 
  Monitor, MessageSquare, Users, Hand, Send,
  Copy, Check, Volume2, Disc, MessageCircle
} from 'lucide-react';
import { initialConferenceMessages, currentUser, type User, type ConferenceMessage, type Conference } from '../data/mock';
import './CallGrid.css';

interface CallGridProps {
  participants: User[];
  conference?: Conference | null;
  onLeaveCall?: () => void;
  onGoToChatGroup?: (chatId: string) => void;
}

export function CallGrid({ participants, conference, onLeaveCall, onGoToChatGroup }: CallGridProps) {
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'users' | null>('chat');
  const [messages, setMessages] = useState<ConferenceMessage[]>(initialConferenceMessages);
  const [chatInput, setChatInput] = useState('');
  const [callDuration, setCallDuration] = useState(145);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('2');
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);
  const [callEndedModal, setCallEndedModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const confTitle = conference?.title || 'Спринт-синк команды #104';
  const confCode = conference?.inviteCode || 'conf-892-xyt';

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(d => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Speaker simulation
  useEffect(() => {
    const speakerTimer = setInterval(() => {
      const ids = ['me', '1', '2', '6'];
      const randomId = ids[Math.floor(Math.random() * ids.length)];
      setActiveSpeakerId(randomId);
    }, 7000);
    return () => clearInterval(speakerTimer);
  }, []);

  // Scroll chat
  useEffect(() => {
    if (activeSidePanel === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeSidePanel]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: ConferenceMessage = {
      id: `msg_${Date.now()}`,
      user: currentUser,
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

  const handleEndCall = () => {
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

          {/* Screen Share View */}
          {screenSharing ? (
            <div className="screen-share-view">
              <div className="screen-share-presentation">
                <div className="presentation-header">
                  <Monitor size={18} /> Демонстрация экрана: {confTitle}
                </div>
                <div className="presentation-content">
                  <div className="demo-slide">
                    <span className="slide-badge">Слайд 1 из 8</span>
                    <h2>Архитектура соцсети: React 19 + Go</h2>
                    <p>✓ Модуль Ленты · ✓ Видеохостинг · ✓ Telegram-мессенджер с медиа и войсами</p>
                    <p>✓ Конференции с автосозданием групп и сохранением записей</p>
                  </div>
                </div>
              </div>

              <div className="mini-participants-strip">
                {participants.slice(0, 4).map(p => (
                  <div key={p.id} className="mini-participant-tile">
                    <img src={p.avatar} alt={p.name} />
                    <span>{p.id === 'me' ? 'Вы' : p.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Normal Grid View */
            <div className={`video-tiles-grid grid-count-${Math.min(participants.length, 6)}`}>
              {participants.map((p) => {
                const isMe = p.id === 'me';
                const isSpeaking = activeSpeakerId === p.id;
                const isVideoMuted = isMe && !videoOn;
                const isAudioMuted = isMe && !micOn;

                return (
                  <div 
                    key={p.id} 
                    className={`participant-video-tile ${isSpeaking ? 'speaking-active' : ''}`}
                  >
                    {isVideoMuted ? (
                      <div className="tile-avatar-placeholder">
                        <img src={p.avatar} alt={p.name} />
                      </div>
                    ) : (
                      <div className="tile-video-stream">
                        <img src={p.avatar} alt={p.name} className="tile-video-bg" />
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
                        {isMe ? `${p.name} (Вы)` : p.name}
                      </span>
                      <div className="tile-audio-status">
                        {isAudioMuted ? (
                          <MicOff size={14} className="mic-muted-icon" />
                        ) : (
                          <Mic size={14} className="mic-live-icon" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side Panel */}
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
                    const isFromMe = msg.user.id === 'me';
                    return (
                      <div key={msg.id} className={`conf-msg-item ${isFromMe ? 'from-me' : ''}`}>
                        <img src={msg.user.avatar} alt={msg.user.name} className="conf-msg-avatar" />
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
                  {participants.map(p => (
                    <div key={p.id} className="conf-user-row">
                      <img src={p.avatar} alt={p.name} className="user-row-avatar" />
                      <div className="user-row-info">
                        <span className="user-row-name">{p.id === 'me' ? `${p.name} (Организатор)` : p.name}</span>
                        <span className="user-row-status">
                          {activeSpeakerId === p.id ? 'Говорит...' : 'В эфире'}
                        </span>
                      </div>
                      <div className="user-row-controls">
                        {p.id === 'me' && !micOn ? (
                          <MicOff size={16} className="user-row-icon red" />
                        ) : (
                          <Mic size={16} className="user-row-icon green" />
                        )}
                        {p.id === 'me' && !videoOn ? (
                          <VideoOff size={16} className="user-row-icon red" />
                        ) : (
                          <VideoIcon size={16} className="user-row-icon green" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Controls Bar (Redesigned with elegant modern buttons) */}
      <div className="conf-bottom-controls">
        <div className="controls-group-left">
          <button 
            className={`btn-control ${!micOn ? 'btn-danger' : ''}`} 
            onClick={() => setMicOn(!micOn)}
            title={micOn ? 'Выключить микрофон' : 'Включить микрофон'}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            <span className="control-text">{micOn ? 'Микрофон' : 'Выключен'}</span>
          </button>

          <button 
            className={`btn-control ${!videoOn ? 'btn-danger' : ''}`} 
            onClick={() => setVideoOn(!videoOn)}
            title={videoOn ? 'Выключить камеру' : 'Включить камеру'}
          >
            {videoOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
            <span className="control-text">{videoOn ? 'Камера' : 'Выключена'}</span>
          </button>
        </div>

        <div className="controls-group-center">
          <button 
            className={`btn-control ${screenSharing ? 'btn-active' : ''}`}
            onClick={() => setScreenSharing(!screenSharing)}
            title="Демонстрация экрана"
          >
            <Monitor size={20} />
            <span className="control-text">Экран</span>
          </button>

          <button 
            className={`btn-control ${handRaised ? 'btn-active' : ''}`}
            onClick={() => setHandRaised(!handRaised)}
            title="Поднять руку"
          >
            <Hand size={20} />
            <span className="control-text">Рука</span>
          </button>

          <button 
            className={`btn-control ${activeSidePanel === 'chat' ? 'btn-active' : ''}`}
            onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat')}
            title="Чат конференции"
          >
            <MessageSquare size={20} />
            <span className="control-text">Чат</span>
          </button>

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

      {/* Call Ended Summary Modal with Group Chat & Recording Links */}
      {callEndedModal && (
        <div className="conf-modal-overlay">
          <div className="call-summary-modal-box">
            <div className="summary-icon-badge">
              <Check size={32} />
            </div>
            <h2>Конференция успешно завершена</h2>
            <p className="summary-desc">
              Запись звонка обработана, а группа общения автоматически создана в мессенджере.
            </p>

            <div className="summary-card-items">
              <div className="summary-item">
                <Disc size={20} className="summary-item-icon rec" />
                <div className="summary-item-text">
                  <strong>Запись звонка сохранена</strong>
                  <span>Длительность: {formatTime(callDuration)} · Архив записей</span>
                </div>
              </div>

              <div className="summary-item">
                <MessageCircle size={20} className="summary-item-icon chat" />
                <div className="summary-item-text">
                  <strong>Создана группа «{confTitle}»</strong>
                  <span>{participants.length} участников · история чата сохранена</span>
                </div>
              </div>
            </div>

            <div className="summary-actions">
              <button 
                className="btn-primary-summary"
                onClick={() => {
                  setCallEndedModal(false);
                  if (onGoToChatGroup) {
                    onGoToChatGroup('group_conf_1');
                  } else {
                    navigate('/messenger');
                  }
                }}
              >
                <MessageCircle size={18} /> Открыть группу в Мессенджере
              </button>

              <button 
                className="btn-secondary-summary"
                onClick={() => {
                  setCallEndedModal(false);
                  if (onLeaveCall) onLeaveCall();
                }}
              >
                Вернуться к списку конференций
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

async function fetchAiReply(text: string, history: Array<{ role: string; text: string }>): Promise<string> {
  try {
    const resp = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history }),
    });
    if (!resp.ok) throw new Error('API error');
    const data = await resp.json();
    return String(data.reply || 'РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ РѕС‚РІРµС‚. РџРѕРїСЂРѕР±СѓР№ РµС‰С‘ СЂР°Р·!');
  } catch {
    const fallbacks = [
      'вњЁ РРЅС‚РµСЂРµСЃРЅС‹Р№ РІРѕРїСЂРѕСЃ! Р Р°СЃСЃРєР°Р¶Рё РїРѕРґСЂРѕР±РЅРµРµ рџ™Џ',
      'рџ’« Р”Р°РІР°Р№ СЂР°Р·Р±РµСЂС‘РјСЃСЏ РІРјРµСЃС‚Рµ. Р§С‚Рѕ РёРјРµРЅРЅРѕ С‚РµР±СЏ РІРѕР»РЅСѓРµС‚?',
      'рџЊџ РЇ Р·РґРµСЃСЊ РґР»СЏ С‚РµР±СЏ. Р Р°СЃСЃРєР°Р¶Рё Р±РѕР»СЊС€Рµ!',
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const EMOJI_LIST = ['рџЂ','рџ‚','рџЌ','рџҐ°','рџЋ','рџ¤”','рџў','рџЎ','рџ‘Ќ','рџ‘Ћ','вќ¤пёЏ','рџ”Ґ','вњЁ','рџ™Џ','рџ’«','рџЋ‰','рџЉ','рџ¤—','рџ‡','рџҐє','рџ’Є','рџ‘Џ','рџ«¶','рџ’Ї','рџ±','рџ¤©','рџґ','рџ¤ќ','рџ’Ў','рџЊџ'];

type CtxMenu = { visible: boolean; x: number; y: number; msg: Message | null };

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
        mediaType: isVideo ? 'video_note' : 'image',
      };
      const updatedMessages = [...messages, newMsg];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
    };
    reader.readAsDataURL(file);
  };
  
  const handleVoiceRecord = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const newMsg: Message = {
        id: `msg_${Date.now()}`,
        text: '',
        fromMe: true,
        time: formatTime(),
        status: 'sent',
        mediaType: 'voice',
      };
      const updatedMessages = [...messages, newMsg];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
    }, 2000); // Fake 2 seconds recording
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
        <div className="cw-empty-icon">рџ’¬</div>
        <h2 className="cw-empty-title">Р’С‹Р±РµСЂРёС‚Рµ РґРёР°Р»РѕРі</h2>
        <p className="cw-empty-subtitle">Р’С‹Р±РµСЂРёС‚Рµ С‡Р°С‚ РёР· СЃРїРёСЃРєР° СЃР»РµРІР° РёР»Рё СЃРѕР·РґР°Р№С‚Рµ РЅРѕРІС‹Р№ РґР»СЏ РЅР°С‡Р°Р»Р° РѕР±С‰РµРЅРёСЏ</p>
      </div>
    );
  }

  const isAi = chat.id === 'chat_ai_oracle' || chat.id === 'ai_guru_bot';
  const chatName = String(chat.groupTitle || chat.user?.name || 'Р§Р°С‚');
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
            {isAi && <span className="cw-ai-badge">РР</span>}
          </div>
          <div className={`cw-header-status ${isOnline ? 'online' : ''}`}>
            {isAi ? (isAiTyping ? 'РїРµС‡Р°С‚Р°РµС‚...' : 'РќРµР№СЂРѕСЃРµС‚РµРІРѕР№ РїРѕРјРѕС‰РЅРёРє') : isOnline ? 'РІ СЃРµС‚Рё' : 'Р±С‹Р»(Р°) РЅРµРґР°РІРЅРѕ'}
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
          <div className="cw-no-messages">РЎРѕРѕР±С‰РµРЅРёР№ РїРѕРєР° РЅРµС‚. РќР°С‡РЅРёС‚Рµ РґРёР°Р»РѕРі!</div>
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
                  {msg.mediaType === 'video_note' && msg.mediaUrl && (
                    <video src={msg.mediaUrl} controls style={{maxWidth: '100%', borderRadius: '8px', marginBottom: '4px'}} />
                  )}
                  {msg.mediaType === 'voice' && (
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                      <div style={{width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <Mic size={16} />
                      </div>
                      <div style={{height: '2px', background: 'rgba(255,255,255,0.5)', width: '100px'}}></div>
                      <span style={{fontSize: '12px'}}>0:05</span>
                    </div>
                  )}
                  {text && <div className="cw-bubble-text">{text}</div>}

                  <div className="cw-bubble-meta">
                    <span className="cw-bubble-time">{time}</span>
                    {isMe && (
                      <span className={`cw-ticks ${status === 'read' ? 'read' : ''}`}>
                        {status === 'sent' ? 'вњ“' : 'вњ“вњ“'}
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
            <Reply size={16} /> РћС‚РІРµС‚РёС‚СЊ
          </button>
          <button className="cw-ctx-item" onClick={handleCopy}>
            <Copy size={16} /> РљРѕРїРёСЂРѕРІР°С‚СЊ
          </button>
          <button className="cw-ctx-item" onClick={() => { if (ctxMenu.msg) { handleEmojiClick('вќ¤пёЏ'); } setCtxMenu({ visible: false, x: 0, y: 0, msg: null }); }}>
            <span style={{ fontSize: 16 }}>вќ¤пёЏ</span> Р РµР°РєС†РёСЏ
          </button>
          <button className="cw-ctx-item" onClick={() => setCtxMenu({ visible: false, x: 0, y: 0, msg: null })}>
            <Pin size={16} /> Р—Р°РєСЂРµРїРёС‚СЊ
          </button>
          <button className="cw-ctx-item" onClick={() => setCtxMenu({ visible: false, x: 0, y: 0, msg: null })}>
            <Forward size={16} /> РџРµСЂРµСЃР»Р°С‚СЊ
          </button>
          <div className="cw-ctx-divider" />
          <button className="cw-ctx-item danger" onClick={handleDeleteMsg}>
            <Trash2 size={16} /> РЈРґР°Р»РёС‚СЊ
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
            <span className="cw-reply-name">{replyTo.fromMe ? 'Р’С‹' : chatName}</span>
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
            Р—Р°РїРёСЃСЊ...
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="РЎРѕРѕР±С‰РµРЅРёРµ..."
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


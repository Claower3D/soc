import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, Plus, Link as LinkIcon, Disc, Lock, Globe, 
  Users, Play, ShieldCheck, Copy, Check, MessageSquare, 
  Clock, ArrowRight, Search, Trash2, Download, Film, X
} from 'lucide-react';
import { CallGrid } from '../components/CallGrid';
import { CreateConferenceModal } from '../components/CreateConferenceModal';
import { 
  initialConferences, 
  currentUser, type Conference 
} from '../data/mock';
import { 
  getStoredConferenceRecordings, 
  deleteConferenceRecording, 
  saveConferenceGroupChat,
  downloadRecordingFile,
  type ConferenceRecordingItem 
} from '../utils/conferenceManager';
import { useAuth } from '../context/AuthContext';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import './CallsPage.css';

export function ConferencesPage() {
  const navigate = useNavigate();
  const { currentUser: authUser, isAuthenticated, openAuthModal } = useAuth();
  const effectiveUser = authUser || currentUser;
  const [conferences, setConferences] = useState<Conference[]>(initialConferences);
  const [recordings, setRecordings] = useState<ConferenceRecordingItem[]>(() => getStoredConferenceRecordings());
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'private' | 'recordings'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConference, setActiveConference] = useState<Conference | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [previewRecording, setPreviewRecording] = useState<ConferenceRecordingItem | null>(null);

  // Sync recordings with localStorage on custom events
  useEffect(() => {
    const handleRecsUpdate = () => {
      setRecordings(getStoredConferenceRecordings());
    };
    window.addEventListener('newage_recordings_updated', handleRecsUpdate);
    window.addEventListener('storage', handleRecsUpdate);
    return () => {
      window.removeEventListener('newage_recordings_updated', handleRecsUpdate);
      window.removeEventListener('storage', handleRecsUpdate);
    };
  }, []);

  const handleDeleteConference = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConferences(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteRecording = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConferenceRecording(id);
    setRecordings(prev => prev.filter(r => r.id !== id));
  };

  // Handle create conference
  const handleCreateConference = (newConf: Conference, autoCreateGroup: boolean) => {
    setIsCreateModalOpen(false);
    
    // Auto-create Telegram group chat for this conference if enabled
    if (autoCreateGroup) {
      const createdGroupId = saveConferenceGroupChat({
        conference: newConf,
        duration: '0:00',
        messages: [],
        thumbnail: newConf.recordingThumbnail,
        currentUserId: effectiveUser?.id || 'me',
        hostUser: effectiveUser,
      });
      newConf.chatGroupId = createdGroupId;
    }

    setConferences(prev => [newConf, ...prev]);
    setActiveConference(newConf);
  };

  // Join conference by code/link
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const cleanCode = joinCodeInput.trim().toLowerCase();
    const found = conferences.find(c => 
      c.inviteCode.toLowerCase() === cleanCode || c.id.toLowerCase() === cleanCode
    );

    if (found) {
      setActiveConference(found);
      setJoinCodeInput('');
    } else {
      // Create instant session for this link
      const instantConf: Conference = {
        id: `conf_${Date.now()}`,
        title: `Конференция по ссылке: ${joinCodeInput}`,
        isPrivate: true,
        inviteCode: joinCodeInput,
        host: effectiveUser,
        status: 'live',
        participants: [effectiveUser],
        hasRecording: true,
      };
      setConferences(prev => [instantConf, ...prev]);
      setActiveConference(instantConf);
      setJoinCodeInput('');
    }
  };

  const handleCopyLink = (conf: Conference, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/conferences?code=${conf.inviteCode}`;
    navigator.clipboard?.writeText(link);
    setCopiedCode(conf.id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // When call ends
  const handleLeaveCall = (savedRec?: ConferenceRecordingItem) => {
    if (savedRec) {
      setRecordings(prev => [savedRec, ...prev.filter(r => r.id !== savedRec.id)]);
    } else {
      setRecordings(getStoredConferenceRecordings());
    }
    setActiveConference(null);
  };

  // Active call view
  if (activeConference) {
    return (
      <CallGrid
        conference={activeConference}
        participants={activeConference.participants.length > 0 ? activeConference.participants : [effectiveUser]}
        onLeaveCall={handleLeaveCall}
        onGoToChatGroup={(chatId) => {
          handleLeaveCall();
          navigate(`/messenger?chat=${encodeURIComponent(chatId)}`);
        }}
      />
    );
  }

  // Filter conferences
  const filteredConferences = conferences.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.host.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.inviteCode.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'open') return matchesSearch && !c.isPrivate;
    if (activeTab === 'private') return matchesSearch && c.isPrivate;
    return matchesSearch;
  });

  if (!isAuthenticated) {
    return (
      <div className="conferences-page">
        <div className="messenger-guest-lock-container">
          <GuestLockPrompt
            featureName="Конференции и видеовстречи"
            title="Конференции доступны после регистрации"
            description="Создавайте защищенные видеовстречи, подключайтесь по коду приглашения, транслируйте экран и сохраняйте записи звонков в экосистеме New Age."
            actionText="Войти или зарегистрироваться"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="conferences-page">
      {/* Top Banner with Action Cards */}
      <div className="conf-hero-section">
        <div className="conf-hero-header">
          <div>
            <div className="hero-pill">
              <ShieldCheck size={14} /> Защищенная видеосвязь
            </div>
            <h1 className="hero-title">Конференции «Демо»</h1>
            <p className="hero-subtitle">
              Создавайте свои открытые и закрытые видеовстречи с автоматическим чатом в Телеграме и сохранением записей.
            </p>
          </div>

          {isAuthenticated ? (
            <button 
              className="btn-create-conf-main"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={20} />
              <span>Создать свою конференцию</span>
            </button>
          ) : (
            <button 
              className="btn-create-conf-main guest-restricted-btn"
              onClick={() => openAuthModal('register')}
              title="Для создания видеоконференции войдите в аккаунт"
            >
              <Lock size={18} />
              <span>Создать свою конференцию</span>
            </button>
          )}
        </div>

        {/* Quick Join Bar */}
        <div className="conf-quick-cards">
          <form className="join-by-code-card" onSubmit={handleJoinByCode}>
            <div className="join-input-wrap">
              <LinkIcon size={18} className="join-icon" />
              <input
                type="text"
                placeholder="Введите код или ссылку (например: conf-sync-104)..."
                value={joinCodeInput}
                onChange={e => setJoinCodeInput(e.target.value)}
                className="join-input"
              />
            </div>
            <button type="submit" className="join-submit-btn" disabled={!joinCodeInput.trim()}>
              Подключиться
            </button>
          </form>

          <div className="recordings-count-card" onClick={() => setActiveTab('recordings')}>
            <div className="rec-icon-box">
              <Disc size={20} />
            </div>
            <div className="rec-text-box">
              <span className="rec-count">{recordings.length} записей</span>
              <span className="rec-label">Архив сохраненных звонков</span>
            </div>
            <ArrowRight size={16} className="rec-arrow" />
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="conf-toolbar">
        <div className="conf-tabs">
          <button
            className={`conf-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Все встречи ({conferences.length})
          </button>
          <button
            className={`conf-tab-btn ${activeTab === 'open' ? 'active' : ''}`}
            onClick={() => setActiveTab('open')}
          >
            <Globe size={15} /> Открытые ({conferences.filter(c => !c.isPrivate).length})
          </button>
          <button
            className={`conf-tab-btn ${activeTab === 'private' ? 'active' : ''}`}
            onClick={() => setActiveTab('private')}
          >
            <Lock size={15} /> Только по ссылке ({conferences.filter(c => c.isPrivate).length})
          </button>
          <button
            className={`conf-tab-btn ${activeTab === 'recordings' ? 'active' : ''}`}
            onClick={() => setActiveTab('recordings')}
          >
            <Disc size={15} /> Записи ({recordings.length})
          </button>
        </div>

        <div className="conf-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Поиск встреч по теме, коду или автору..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Grid */}
      {activeTab === 'recordings' ? (
        /* RECORDINGS ARCHIVE VIEW */
        <div className="recordings-grid">
          {recordings.map(rec => (
            <div key={rec.id} className="recording-card">
              <div 
                className="rec-card-thumb-box"
                onClick={() => setPreviewRecording(rec)}
              >
                <img src={rec.thumbnail} alt={rec.title} />
                <span className="rec-duration-badge">{rec.duration}</span>
                <span className="rec-quality-badge">HD 1080p</span>
                <div className="rec-play-overlay">
                  <Play size={28} fill="white" color="white" />
                </div>
              </div>

              <div className="rec-card-info">
                <div className="rec-card-date">
                  <Clock size={13} /> {rec.date}
                </div>
                <h3 className="rec-card-title">{rec.title}</h3>

                <div className="rec-card-actions">
                  <button 
                    className="rec-btn-watch"
                    onClick={() => setPreviewRecording(rec)}
                  >
                    <Play size={14} fill="currentColor" /> Смотреть
                  </button>
                  <button 
                    className="rec-btn-download"
                    onClick={() => downloadRecordingFile(rec.videoUrl, rec.title)}
                    title="Скачать видеозапись (.mp4)"
                  >
                    <Download size={14} />
                  </button>
                  <button 
                    className="rec-btn-chat"
                    onClick={() => navigate(`/messenger?chat=${rec.chatGroupId}`)}
                    title="Открыть группу конференции в мессенджере"
                  >
                    <MessageSquare size={14} /> Чат
                  </button>
                  <button 
                    className="rec-btn-delete"
                    onClick={(e) => handleDeleteRecording(rec.id, e)}
                    title="Удалить запись из архива"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* CONFERENCES LIST VIEW */
        <div className="conferences-grid">
          {filteredConferences.length === 0 ? (
            <div className="conf-empty-state">
              <Video size={48} className="empty-icon" />
              <h3>Конференции не найдены</h3>
              <p>Создайте свою конференцию или измените поисковый запрос</p>
              <button 
                className="btn-create-conf-main"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus size={18} /> Создать конференцию
              </button>
            </div>
          ) : (
            filteredConferences.map(conf => {
              const isLive = conf.status === 'live';

              return (
                <div key={conf.id} className={`conf-card ${conf.isPrivate ? 'card-private' : ''}`}>
                  {/* Card Header */}
                  <div className="conf-card-top">
                    <div className="conf-status-pills">
                      {isLive ? (
                        <span className="live-status-pill">
                          <span className="live-dot" /> В эфире
                        </span>
                      ) : (
                        <span className="scheduled-status-pill">
                          <Clock size={12} /> {conf.scheduledTime || 'Запланировано'}
                        </span>
                      )}

                      {conf.isPrivate ? (
                        <span className="access-pill private">
                          <Lock size={12} /> Только по ссылке
                        </span>
                      ) : (
                        <span className="access-pill public">
                          <Globe size={12} /> Открытая
                        </span>
                      )}
                    </div>

                    <div className="conf-card-top-actions">
                      <button 
                        className="conf-share-btn" 
                        onClick={(e) => handleCopyLink(conf, e)}
                        title="Скопировать ссылку для входа"
                      >
                        {copiedCode === conf.id ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                      </button>
                      <button 
                        className="conf-delete-card-btn" 
                        onClick={(e) => handleDeleteConference(conf.id, e)}
                        title="Удалить конференцию"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Host */}
                  <h3 className="conf-card-title">{conf.title}</h3>

                  <div className="conf-card-host">
                    <img src={conf.host.avatar} alt={conf.host.name} className="host-avatar" />
                    <div className="host-meta">
                      <span className="host-name">{conf.host.id === 'me' ? `${conf.host.name} (Вы)` : conf.host.name}</span>
                      <span className="host-sub">Организатор встречи</span>
                    </div>
                  </div>

                  {/* Features info */}
                  <div className="conf-card-tags">
                    <span className="card-tag">
                      <MessageSquare size={13} /> Автогруппа в чате
                    </span>
                    {conf.hasRecording && (
                      <span className="card-tag rec">
                        <Disc size={13} /> Запись звонка (REC)
                      </span>
                    )}
                  </div>

                  {/* Participants & Join Button */}
                  <div className="conf-card-bottom">
                    <div className="participants-strip">
                      <div className="avatars-overlap">
                        {conf.participants.slice(0, 4).map(p => (
                          <img key={p.id} src={p.avatar} alt={p.name} className="overlap-avatar" />
                        ))}
                      </div>
                      <span className="participants-count">
                        <Users size={13} /> {conf.participants.length}
                      </span>
                    </div>

                    <button 
                      className={`btn-join-conf ${isLive ? 'primary' : 'secondary'}`}
                      onClick={() => setActiveConference(conf)}
                    >
                      <Video size={16} />
                      <span>{isLive ? 'Войти в звонок' : 'Подключиться'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create Conference Modal */}
      <CreateConferenceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateConference={handleCreateConference}
      />

      {/* Recording Player Modal */}
      {previewRecording && (
        <div className="tg-rec-modal-overlay" onClick={() => setPreviewRecording(null)}>
          <div className="tg-rec-modal-box" onClick={e => e.stopPropagation()}>
            <div className="tg-rec-modal-header">
              <div className="tg-rec-modal-title-col">
                <span className="tg-rec-modal-badge"><Film size={13} /> Запись видеоконференции</span>
                <h3>{previewRecording.title}</h3>
              </div>
              <button className="modal-close-icon" onClick={() => setPreviewRecording(null)} title="Закрыть">
                <X size={20} />
              </button>
            </div>

            <div className="tg-rec-modal-player">
              <video 
                src={previewRecording.videoUrl} 
                controls 
                autoPlay 
                playsInline
                poster={previewRecording.thumbnail}
                className="tg-rec-real-video"
              />
            </div>

            <div className="tg-rec-modal-footer">
              <div className="tg-rec-meta-info">
                <span>Длительность: <strong>{previewRecording.duration}</strong></span>
                <span className="meta-dot">•</span>
                <span>Формат: <strong>Full HD 1080p</strong></span>
                <span className="meta-dot">•</span>
                <span>{previewRecording.date}</span>
              </div>

              <div className="tg-rec-modal-actions">
                <button 
                  type="button" 
                  className="btn-download-rec"
                  onClick={() => downloadRecordingFile(previewRecording.videoUrl, previewRecording.title)}
                >
                  <Download size={15} /> Скачать MP4
                </button>
                <button 
                  type="button" 
                  className="btn-chat-rec"
                  onClick={() => {
                    const targetChat = previewRecording.chatGroupId;
                    setPreviewRecording(null);
                    navigate(`/messenger?chat=${targetChat}`);
                  }}
                >
                  <MessageSquare size={15} /> Открыть группу в чате
                </button>
                <button 
                  type="button" 
                  className="btn-close-rec" 
                  onClick={() => setPreviewRecording(null)}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const CallsPage = ConferencesPage;

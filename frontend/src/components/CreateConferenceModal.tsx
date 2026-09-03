import { useState } from 'react';
import { X, Video, Lock, Globe, MessageSquare, Disc } from 'lucide-react';
import { currentUser, type Conference } from '../data/mock';
import './CreateConferenceModal.css';

interface CreateConferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateConference: (conf: Conference, autoCreateGroup: boolean) => void;
}

export function CreateConferenceModal({ isOpen, onClose, onCreateConference }: CreateConferenceModalProps) {
  const [title, setTitle] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [createGroup, setCreateGroup] = useState(true);
  const [recordMeeting, setRecordMeeting] = useState(true);

  if (!isOpen) return null;

  const generatedCode = `conf-${Math.random().toString(36).substring(2, 7)}-${isPrivate ? 'sec' : 'open'}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const confTitle = title.trim() || 'Новая конференция';
    const newConf: Conference = {
      id: `conf_${Date.now()}`,
      title: confTitle,
      isPrivate,
      inviteCode: generatedCode,
      host: currentUser,
      status: 'live',
      startedAt: 'Только что',
      participants: [currentUser],
      hasRecording: recordMeeting,
      recordingDuration: '0:00',
      recordingDate: 'Сегодня',
      recordingThumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    };

    onCreateConference(newConf, createGroup);
  };

  return (
    <div className="conf-modal-overlay" onClick={onClose}>
      <div className="conf-modal-box" onClick={e => e.stopPropagation()}>
        <div className="conf-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-wrap">
              <Video size={20} />
            </div>
            <div>
              <h3>Создание конференции</h3>
              <p>Настройте параметры доступа, записи и группы в чате</p>
            </div>
          </div>
          <button className="conf-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="conf-modal-body">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Тема / Название встречи</label>
            <input
              type="text"
              placeholder="Например: Спринт-синк команды, Презентация дизайна..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="form-input"
              autoFocus
            />
          </div>

          {/* Access Type (Open vs Private) */}
          <div className="form-group">
            <label className="form-label">Тип доступа</label>
            <div className="access-options-grid">
              <div 
                className={`access-card ${!isPrivate ? 'selected' : ''}`}
                onClick={() => setIsPrivate(false)}
              >
                <div className="access-card-radio">
                  <span className="radio-circle" />
                </div>
                <div className="access-card-content">
                  <div className="access-title-row">
                    <Globe size={18} className="access-icon open" />
                    <strong>Открытая конференция</strong>
                  </div>
                  <p>Видна в общем списке комнат. Любой участник сообщества может свободно присоединиться.</p>
                </div>
              </div>

              <div 
                className={`access-card ${isPrivate ? 'selected' : ''}`}
                onClick={() => setIsPrivate(true)}
              >
                <div className="access-card-radio">
                  <span className="radio-circle" />
                </div>
                <div className="access-card-content">
                  <div className="access-title-row">
                    <Lock size={18} className="access-icon lock" />
                    <strong>Закрытая (только по ссылке)</strong>
                  </div>
                  <p>Вход только по персональной ссылке или коду. Скрыта от посторонних пользователей.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Auto create group checkbox */}
          <div className="features-checkboxes">
            <label className="feature-checkbox-label">
              <input
                type="checkbox"
                checked={createGroup}
                onChange={e => setCreateGroup(e.target.checked)}
                className="custom-checkbox"
              />
              <div className="checkbox-text">
                <div className="checkbox-title">
                  <MessageSquare size={16} /> Автоматически создать группу в Мессенджере
                </div>
                <p>Все участники звонка и текстовый чат встречи будут сохранены в отдельную группу Телеграма.</p>
              </div>
            </label>

            <label className="feature-checkbox-label">
              <input
                type="checkbox"
                checked={recordMeeting}
                onChange={e => setRecordMeeting(e.target.checked)}
                className="custom-checkbox"
              />
              <div className="checkbox-text">
                <div className="checkbox-title">
                  <Disc size={16} /> Вести и сохранить запись конференции (REC)
                </div>
                <p>Видеозапись звонка сохранится в архив и автоматически прикрепится к группе чата.</p>
              </div>
            </label>
          </div>

          {/* Footer buttons */}
          <div className="conf-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-create-submit">
              <Video size={18} /> Создать и войти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

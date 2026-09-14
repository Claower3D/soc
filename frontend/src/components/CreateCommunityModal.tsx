import React, { useState } from 'react';
import { X, Users, Upload, Shield, Globe, Lock } from 'lucide-react';
import { type Community, currentUser, BELIEF_OPTIONS } from '../data/mock';
import './CreateCommunityModal.css';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCommunity: (newCommunity: Community) => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  onCreateCommunity,
}) => {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('IT & Технологии');
  const [beliefCategory, setBeliefCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [cover, setCover] = useState(
    'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80'
  );
  const [avatar, setAvatar] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  );
  const [rules, setRules] = useState([
    'Уважительное отношение ко всем участникам',
    'Публикация контента строго по тематике сообщества',
    'Запрещены спам, реклама и токсичное поведение'
  ]);
  const [newRule, setNewRule] = useState('');

  if (!isOpen) return null;

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setRules([...rules, newRule.trim()]);
    setNewRule('');
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanHandle = (handle || name.toLowerCase().replace(/[^a-z0-9]/gi, '_'))
      .replace(/^@/, '');

    const newComm: Community = {
      id: `comm-${Date.now()}`,
      name: name.trim(),
      handle: cleanHandle,
      avatar,
      cover,
      description: description.trim() || 'Новое активное сообщество в New Age.',
      category,
      beliefCategory: category === 'Мировоззрение & Философия' ? beliefCategory : undefined,
      membersCount: 1,
      isPrivate,
      isJoined: true,
      verified: false,
      creator: currentUser,
      rules,
      events: [],
      chatGroupId: `group_${cleanHandle}`
    };

    onCreateCommunity(newComm);
    onClose();
  };

  return (
    <div className="create-community-backdrop" onClick={onClose}>
      <div className="create-community-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-community-header">
          <div className="header-title-wrap">
            <div className="modal-icon-badge">
              <Users size={20} />
            </div>
            <div>
              <h3>Создать сообщество</h3>
              <p>Объединяйте единомышленников, организуйте встречи и обсуждения</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-community-form">
          <div className="form-preview-row">
            <div
              className="preview-cover-box"
              style={{ backgroundImage: `url(${cover})` }}
            >
              <div
                className="preview-avatar-box"
                style={{ backgroundImage: `url(${avatar})` }}
                onClick={() => {
                  const url = prompt('Введите URL аватара сообщества:', avatar);
                  if (url) setAvatar(url);
                }}
                title="Нажмите, чтобы изменить аватар"
              />
              <button
                type="button"
                className="change-cover-btn"
                onClick={() => {
                  const url = prompt('Введите URL обложки (изображения):', cover);
                  if (url) setCover(url);
                }}
              >
                <Upload size={14} /> Сменить обложку
              </button>
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Название сообщества *</label>
              <input
                type="text"
                placeholder="Например: Архитектура Highload систем"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Тег (handle)</label>
              <div className="input-prefix-box">
                <span className="input-prefix">@</span>
                <input
                  type="text"
                  placeholder="highload_community"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              rows={3}
              placeholder="Расскажите о целях сообщества, обсуждаемых темах и расписании встреч..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Тематическая категория</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="IT & Технологии">IT & Технологии</option>
                <option value="Дизайн & Арт">Дизайн & Арт</option>
                <option value="Бизнес & Стартапы">Бизнес & Стартапы</option>
                <option value="Мировоззрение & Философия">Мировоззрение & Философия</option>
                <option value="Спорт & Здоровье">Спорт & Здоровье</option>
                <option value="Наука & Образование">Наука & Образование</option>
                <option value="Музыка & Творчество">Музыка & Творчество</option>
                <option value="Локальный клуб">Локальный клуб города</option>
              </select>
            </div>

            {category === 'Мировоззрение & Философия' && (
              <div className="form-group">
                <label>Философский вектор / Конфессия</label>
                <select
                  value={beliefCategory}
                  onChange={(e) => setBeliefCategory(e.target.value)}
                >
                  <option value="">Межконфессиональный диалог (открытый)</option>
                  {BELIEF_OPTIONS.filter((b) => b !== 'Не указано').map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="privacy-selector-box">
            <div
              className={`privacy-option ${!isPrivate ? 'selected' : ''}`}
              onClick={() => setIsPrivate(false)}
            >
              <div className="option-icon">
                <Globe size={18} />
              </div>
              <div className="option-content">
                <strong>Открытое сообщество</strong>
                <span>Любой пользователь New Age может вступить и читать материалы</span>
              </div>
            </div>

            <div
              className={`privacy-option ${isPrivate ? 'selected' : ''}`}
              onClick={() => setIsPrivate(true)}
            >
              <div className="option-icon">
                <Lock size={18} />
              </div>
              <div className="option-content">
                <strong>Закрытый клуб</strong>
                <span>Вступление по заявке или приглашению модератора</span>
              </div>
            </div>
          </div>

          <div className="form-group rules-group">
            <label>
              <Shield size={16} /> Правила сообщества
            </label>
            <ul className="rules-list">
              {rules.map((rule, idx) => (
                <li key={idx}>
                  <span>{idx + 1}. {rule}</span>
                  <button
                    type="button"
                    className="delete-rule-btn"
                    onClick={() => handleRemoveRule(idx)}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="add-rule-row">
              <input
                type="text"
                placeholder="Добавить правило сообщества..."
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRule();
                  }
                }}
              />
              <button type="button" className="add-rule-btn" onClick={handleAddRule}>
                + Добавить
              </button>
            </div>
          </div>

          <div className="create-community-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-create-submit">
              Создать сообщество
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

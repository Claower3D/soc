import { useState } from 'react';
import { 
  X, Mail, Lock, Phone, User as UserIcon, Shield, CheckCircle2, 
  ShoppingBag, Video, ArrowRight 
} from 'lucide-react';
import { BELIEF_OPTIONS, currentUser, type UserRole, type BeliefPrivacy } from '../data/mock';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login',
  onSuccess 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [step, setStep] = useState<1 | 2>(1); // In register mode: 1 = credentials, 2 = profile & belief/role
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [selectedBelief, setSelectedBelief] = useState<string>('Не указано');
  const [beliefPrivacy, setBeliefPrivacy] = useState<BeliefPrivacy>('private');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  if (!isOpen) return null;

  const handleNextOrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && step === 1) {
      setStep(2);
      return;
    }

    // Apply updates to currentUser
    if (name) currentUser.name = name;
    if (username) currentUser.username = username.replace(/^@/, '');
    if (mode === 'register') {
      currentUser.role = selectedRole;
      currentUser.beliefType = selectedBelief;
      currentUser.beliefPrivacy = beliefPrivacy;
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={e => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-header">
          <div className="auth-brand-badge">NEW AGE</div>
          <h2>
            {mode === 'login' 
              ? 'Добро пожаловать!' 
              : step === 1 
                ? 'Создать аккаунт New Age' 
                : 'Настройка профиля и роли'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Войдите в мультифункциональную социальную сеть'
              : step === 1
                ? 'Присоединяйтесь к единой экосистеме контента и общения'
                : 'Выберите роль в системе и настройте приватность'}
          </p>
        </div>

        {/* OAuth Buttons */}
        {step === 1 && (
          <div className="oauth-row">
            <button type="button" className="oauth-btn" onClick={() => { onSuccess?.(); onClose(); }}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="18" />
              Google
            </button>
            <button type="button" className="oauth-btn" onClick={() => { onSuccess?.(); onClose(); }}>
              <img src="https://www.svgrepo.com/show/349527/telegram.svg" alt="Telegram" width="18" />
              Telegram
            </button>
          </div>
        )}

        {step === 1 && <div className="auth-divider"><span>или через почту/телефон</span></div>}

        <form onSubmit={handleNextOrSubmit} className="auth-form">
          {mode === 'login' && (
            <>
              <div className="auth-field">
                <label>Email или Телефон</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input 
                    type="text" 
                    placeholder="alex@example.com или +7 999 123-45-67" 
                    value={emailOrPhone}
                    onChange={e => setEmailOrPhone(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Пароль</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                Войти в систему
              </button>
            </>
          )}

          {mode === 'register' && step === 1 && (
            <>
              <div className="auth-field">
                <label>Имя и фамилия</label>
                <div className="auth-input-wrapper">
                  <UserIcon size={18} className="auth-input-icon" />
                  <input 
                    type="text" 
                    placeholder="Алексей Миронов" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Имя пользователя (@никнейм)</label>
                <div className="auth-input-wrapper">
                  <span className="auth-at">@</span>
                  <input 
                    type="text" 
                    placeholder="alex_mironov" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Email или телефон</label>
                <div className="auth-input-wrapper">
                  <Phone size={18} className="auth-input-icon" />
                  <input 
                    type="text" 
                    placeholder="Email или номер телефона" 
                    value={emailOrPhone}
                    onChange={e => setEmailOrPhone(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Пароль</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input 
                    type="password" 
                    placeholder="Минимум 8 символов" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                Продолжить <ArrowRight size={18} />
              </button>
            </>
          )}

          {mode === 'register' && step === 2 && (
            <>
              {/* Выбор роли аккаунта */}
              <div className="auth-section">
                <label className="auth-section-title">Тип аккаунта</label>
                <div className="role-cards-grid">
                  <div 
                    className={`role-card ${selectedRole === 'user' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('user')}
                  >
                    <div className="role-icon-box">
                      <UserIcon size={20} />
                    </div>
                    <div className="role-info">
                      <strong>Личный аккаунт</strong>
                      <span>Общение, просмотр ленты, видео и покупки</span>
                    </div>
                  </div>

                  <div 
                    className={`role-card ${selectedRole === 'creator' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('creator')}
                  >
                    <div className="role-icon-box creator">
                      <Video size={20} />
                    </div>
                    <div className="role-info">
                      <strong>Автор контента</strong>
                      <span>Свой канал, видеостудия, подкасты, донаты и спонсорство</span>
                    </div>
                  </div>

                  <div 
                    className={`role-card ${selectedRole === 'business' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('business')}
                  >
                    <div className="role-icon-box business">
                      <ShoppingBag size={20} />
                    </div>
                    <div className="role-info">
                      <strong>Бизнес / Продавец</strong>
                      <span>Мини-магазин в профиле, витрина товаров, продажи</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Выбор типа верования */}
              <div className="auth-section">
                <div className="belief-title-row">
                  <label className="auth-section-title">Мировоззрение / Конфессия (опционально)</label>
                  <span className="belief-tag-badge">GDPR Protected</span>
                </div>
                <p className="auth-field-hint">
                  Особая категория данных. Используется исключительно для рекомендации профильных сообществ и клубов по интересам.
                </p>
                <select 
                  className="auth-select"
                  value={selectedBelief}
                  onChange={e => setSelectedBelief(e.target.value)}
                >
                  {BELIEF_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>

                <div className="privacy-toggle-box">
                  <Shield size={16} className="privacy-shield-icon" />
                  <div className="privacy-text">
                    <strong>Видимость в профиле</strong>
                    <span>Кто сможет видеть ваш выбор мировоззрения</span>
                  </div>
                  <select 
                    className="privacy-select"
                    value={beliefPrivacy}
                    onChange={e => setBeliefPrivacy(e.target.value as BeliefPrivacy)}
                  >
                    <option value="private">🔒 Только я (Скрыто)</option>
                    <option value="followers">👥 Только подписчики</option>
                    <option value="public">🌐 Всем пользователям</option>
                  </select>
                </div>
              </div>

              <div className="terms-checkbox">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={agreedToTerms} 
                  onChange={e => setAgreedToTerms(e.target.checked)} 
                />
                <label htmlFor="terms">
                  Согласен с правилами платформы New Age и обработкой персональных данных
                </label>
              </div>

              <div className="auth-action-buttons">
                <button type="button" className="auth-back-btn" onClick={() => setStep(1)}>
                  Назад
                </button>
                <button type="submit" className="auth-submit-btn" disabled={!agreedToTerms}>
                  <CheckCircle2 size={18} /> Завершить регистрацию
                </button>
              </div>
            </>
          )}
        </form>

        <div className="auth-footer">
          {mode === 'login' ? (
            <p>
              Впервые в New Age?{' '}
              <button 
                type="button" 
                className="auth-toggle-btn"
                onClick={() => { setMode('register'); setStep(1); }}
              >
                Создать аккаунт
              </button>
            </p>
          ) : (
            <p>
              Уже есть аккаунт?{' '}
              <button 
                type="button" 
                className="auth-toggle-btn"
                onClick={() => { setMode('login'); setStep(1); }}
              >
                Войти
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

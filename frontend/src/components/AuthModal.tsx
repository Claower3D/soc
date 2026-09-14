import { useState } from 'react';
import { 
  X, Mail, Lock, Phone, User as UserIcon, Shield, CheckCircle2, 
  ShoppingBag, Video, ArrowRight, Check, Compass, Info
} from 'lucide-react';
import { RELIGIONS_CATALOG, currentUser, type UserRole, type BeliefPrivacy } from '../data/mock';
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
  const [selectedBeliefId, setSelectedBeliefId] = useState<string>('christianity');
  const [beliefPrivacy, setBeliefPrivacy] = useState<BeliefPrivacy>('public');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const selectedReligion = RELIGIONS_CATALOG.find(r => r.id === selectedBeliefId) || RELIGIONS_CATALOG[0];

  const handleNextOrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && step === 1) {
      setStep(2);
      return;
    }

    // Apply updates to currentUser (simulating real persistent profile)
    if (name) currentUser.name = name;
    if (username) currentUser.username = username.replace(/^@/, '');
    if (mode === 'register') {
      currentUser.role = selectedRole;
      currentUser.beliefType = selectedReligion.name;
      currentUser.beliefPrivacy = beliefPrivacy;
    }

    setLoginSuccessMessage(true);
    setTimeout(() => {
      if (onSuccess) onSuccess();
      onClose();
      setLoginSuccessMessage(false);
    }, 800);
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
                : 'Выбор мировоззрения и роли'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Войдите в мультифункциональную социальную сеть'
              : step === 1
                ? 'Присоединяйтесь к единой экосистеме контента и общения'
                : 'Выберите сакральный символ веры, роль и настройте приватность'}
          </p>
        </div>

        {loginSuccessMessage ? (
          <div className="auth-success-screen">
            <div className="auth-success-icon">
              <CheckCircle2 size={48} color="#10B981" />
            </div>
            <h3>{mode === 'login' ? 'Успешный вход!' : 'Аккаунт успешно создан!'}</h3>
            <p>Добро пожаловать в экосистему New Age, {currentUser.name}</p>
          </div>
        ) : (
          <>
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
                        placeholder="example@newage.com или +7 999 000-00-00" 
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

                  <div className="auth-extras">
                    <label className="remember-me">
                      <input type="checkbox" defaultChecked />
                      <span>Запомнить меня</span>
                    </label>
                    <a href="#forgot" className="forgot-link" onClick={e => { e.preventDefault(); alert('Ссылка для сброса отправлена на почту'); }}>
                      Забыли пароль?
                    </a>
                  </div>

                  <button type="submit" className="auth-submit-btn">
                    Войти в аккаунт
                  </button>
                </>
              )}

              {mode === 'register' && step === 1 && (
                <>
                  <div className="auth-field">
                    <label>Ваше имя и фамилия</label>
                    <div className="auth-input-wrapper">
                      <UserIcon size={18} className="auth-input-icon" />
                      <input 
                        type="text" 
                        placeholder="Иван Петров" 
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
                    Продолжить к выбору веры и роли <ArrowRight size={18} />
                  </button>
                </>
              )}

              {mode === 'register' && step === 2 && (
                <>
                  {/* ИНТЕРАКТИВНЫЙ ВЫБОР РЕЛИГИИ / МИРОВОЗЗРЕНИЯ С ЗОЛОТЫМИ СИМВОЛАМИ */}
                  <div className="auth-section">
                    <div className="belief-title-row">
                      <div className="belief-title-flex">
                        <Compass size={18} className="belief-compass-icon" />
                        <label className="auth-section-title">Вероисповедание / Мировоззрение</label>
                      </div>
                      <span className="belief-tag-badge">GDPR Protected</span>
                    </div>

                    <p className="auth-field-hint">
                      Выберите ваше духовное или философское направление. Платформа будет подбирать близкие сообщества, праздники и мероприятия.
                    </p>

                    {/* Галерея карточек с золотыми символами */}
                    <div className="religion-cards-grid">
                      {RELIGIONS_CATALOG.filter(r => r.id !== 'none').map((religion) => {
                        const isSelected = selectedBeliefId === religion.id;
                        return (
                          <div 
                            key={religion.id}
                            className={`religion-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedBeliefId(religion.id)}
                            title={religion.description}
                          >
                            <div className="religion-symbol-frame">
                              <img 
                                src={religion.iconImg} 
                                alt={religion.name} 
                                className="religion-symbol-img"
                              />
                              {isSelected && (
                                <span className="religion-check-dot">
                                  <Check size={11} color="#FFFFFF" />
                                </span>
                              )}
                            </div>
                            <div className="religion-text-block">
                              <span className="religion-card-name">{religion.name}</span>
                              <span className="religion-card-symbol">({religion.symbolTitle})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Опция "Не указывать" */}
                    <div 
                      className={`religion-none-option ${selectedBeliefId === 'none' ? 'selected' : ''}`}
                      onClick={() => setSelectedBeliefId('none')}
                    >
                      <Info size={16} />
                      <span>Не указывать мировоззрение (Оставить скрытым / Светский профиль)</span>
                    </div>

                    {/* Настройка видимости в профиле */}
                    <div className="privacy-toggle-box">
                      <Shield size={16} className="privacy-shield-icon" />
                      <div className="privacy-text">
                        <strong>Видимость в профиле</strong>
                        <span>Кто сможет видеть символ веры в вашем профиле</span>
                      </div>
                      <select 
                        className="privacy-select"
                        value={beliefPrivacy}
                        onChange={e => setBeliefPrivacy(e.target.value as BeliefPrivacy)}
                      >
                        <option value="public">🌐 Всем пользователям</option>
                        <option value="followers">👥 Только подписчикам</option>
                        <option value="private">🔒 Только я (Скрыто)</option>
                      </select>
                    </div>
                  </div>

                  {/* Выбор роли аккаунта */}
                  <div className="auth-section">
                    <label className="auth-section-title">Роль аккаунта</label>
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
                          <span>Лента, видео, мессенджер и общение</span>
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
                          <span>Канал, видеостудия, подкасты и донаты</span>
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
                          <strong>Бизнес / Магазин</strong>
                          <span>Витрина на маркетплейсе и продажи</span>
                        </div>
                      </div>
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
                      Я согласен с правилами сообщества New Age, политикой конфиденциальности и обработкой персональных данных
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
          </>
        )}
      </div>
    </div>
  );
};

import { useState } from 'react';
import { 
  X, Mail, Lock, Phone, User as UserIcon, Shield, CheckCircle2, 
  ShoppingBag, Video, ArrowRight, Check, Compass, Info, AlertCircle, Sparkles, LogIn, UserPlus, QrCode, Smartphone
} from 'lucide-react';
import { RELIGIONS_CATALOG, type UserRole, type BeliefPrivacy } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { LegalModal } from './LegalModal';
import logoImg from '../assets/logo.png';
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
  const { login, register, currentUser } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'form' | 'qr'>('form');
  const [step, setStep] = useState<1 | 2>(1);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [selectedBeliefId, setSelectedBeliefId] = useState<string>('christianity');
  const [beliefPrivacy, setBeliefPrivacy] = useState<BeliefPrivacy>('public');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms'>('privacy');

  if (!isOpen) return null;

  const selectedReligion = RELIGIONS_CATALOG.find(r => r.id === selectedBeliefId) || RELIGIONS_CATALOG[0];

  const handleNextOrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'login') {
      setIsSubmitting(true);
      try {
        const res = await login(emailOrPhone, password);
        if (!res.success) {
          setErrorMessage(res.message || t('auth.modal.err_fill_all'));
          return;
        }
        setLoginSuccessMessage(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
          setLoginSuccessMessage(false);
        }, 700);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Mode: register
    if (step === 1) {
      if (!name.trim() || !username.trim() || !emailOrPhone.trim() || !password) {
        setErrorMessage(t('auth.modal.err_fill_all'));
        return;
      }
      if (password.length < 6) {
        setErrorMessage(t('auth.modal.err_password_len'));
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 submit
    setIsSubmitting(true);
    try {
      const res = await register({
        name,
        username,
        emailOrPhone,
        password,
        role: selectedRole,
        beliefType: selectedBeliefId === 'none' ? 'Не указывать / Личное' : selectedReligion.name,
        beliefPrivacy,
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Ошибка при регистрации');
        return;
      }

      setLoginSuccessMessage(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setLoginSuccessMessage(false);
      }, 800);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setIsSubmitting(true);
    try {
      await login('alex_mironov');
      setLoginSuccessMessage(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setLoginSuccessMessage(false);
      }, 600);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-horizontal-card" onClick={e => e.stopPropagation()}>
        <button className="auth-modal-close-btn" onClick={onClose} title="Закрыть">
          <X size={18} />
        </button>

        {/* LEFT BRAND PANEL (Горизонтальное разделение) */}
        <div className="auth-modal-left-panel">
          <div className="auth-brand-top">
            <img 
              src={logoImg} 
              alt="New Age Logo" 
              className="auth-brand-clean-logo" 
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="auth-brand-badge-pill">
              <Sparkles size={12} className="sparkle-gold" />
              <span>NEW AGE ECOSYSTEM</span>
            </div>
            <h2 className="auth-brand-title">Социальная экосистема нового поколения</h2>
            <p className="auth-brand-desc">
              Общайтесь, создавайте видео, запускайте конференции, слушайте подкасты и торгуйте в едином удобном пространстве.
            </p>
          </div>

          <div className="auth-left-features">
            <div className="auth-feature-pill">
              <Check size={14} className="feature-check" />
              <span>12 мировоззрений и сакральных символов</span>
            </div>
            <div className="auth-feature-pill">
              <Check size={14} className="feature-check" />
              <span>HD видеозвонки и конференции без ограничений</span>
            </div>
            <div className="auth-feature-pill">
              <Check size={14} className="feature-check" />
              <span>Встроенный маркетплейс и кошелёк</span>
            </div>
          </div>

          <div className="auth-left-footer">
            <span>Защита данных GDPR · 2026</span>
          </div>
        </div>

        {/* RIGHT INTERACTIVE FORM PANEL */}
        <div className="auth-modal-right-panel">
          {/* TOP TABS: Вход / Регистрация */}
          <div className="auth-tabs-row">
            <button
              type="button"
              className={`auth-top-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setStep(1); setErrorMessage(null); }}
            >
              <LogIn size={16} />
              <span>Вход</span>
            </button>
            <button
              type="button"
              className={`auth-top-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setStep(1); setErrorMessage(null); }}
            >
              <UserPlus size={16} />
              <span>Регистрация</span>
            </button>
          </div>

          {errorMessage && (
            <div className="auth-error-banner">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {loginSuccessMessage ? (
            <div className="auth-success-screen">
              <div className="auth-success-icon">
                <CheckCircle2 size={54} color="#10B981" />
              </div>
              <h3>{mode === 'login' ? 'Успешная авторизация!' : 'Добро пожаловать в New Age!'}</h3>
              <p>Вы вошли как <b>{currentUser.name}</b> (@{currentUser.username})</p>
            </div>
          ) : (
            <div className="auth-form-scroll-body">
              {/* SUB-SELECTOR ДЛЯ ВХОДА: По логину / По QR-коду */}
              {mode === 'login' && (
                <div className="login-method-toggle">
                  <button
                    type="button"
                    className={`method-sub-btn ${loginMethod === 'form' ? 'active' : ''}`}
                    onClick={() => setLoginMethod('form')}
                  >
                    <Mail size={14} /> Логин и пароль
                  </button>
                  <button
                    type="button"
                    className={`method-sub-btn ${loginMethod === 'qr' ? 'active' : ''}`}
                    onClick={() => setLoginMethod('qr')}
                  >
                    <QrCode size={14} /> Вход по QR-коду
                  </button>
                </div>
              )}

              {/* QR-КОД ВХОД */}
              {mode === 'login' && loginMethod === 'qr' && (
                <div className="qr-login-container">
                  <div className="qr-box-wrapper">
                    {/* Стильный SVG QR-код с брендовым центровым лого */}
                    <div className="qr-code-frame">
                      <svg viewBox="0 0 200 200" className="qr-svg-graphic">
                        {/* QR Matrix Elements */}
                        <rect width="200" height="200" fill="#FFFFFF" rx="12" />
                        {/* Top-Left Corner Box */}
                        <rect x="20" y="20" width="45" height="45" rx="6" fill="#1E293B" />
                        <rect x="27" y="27" width="31" height="31" rx="4" fill="#FFFFFF" />
                        <rect x="34" y="34" width="17" height="17" rx="3" fill="#6366F1" />

                        {/* Top-Right Corner Box */}
                        <rect x="135" y="20" width="45" height="45" rx="6" fill="#1E293B" />
                        <rect x="142" y="27" width="31" height="31" rx="4" fill="#FFFFFF" />
                        <rect x="149" y="34" width="17" height="17" rx="3" fill="#6366F1" />

                        {/* Bottom-Left Corner Box */}
                        <rect x="20" y="135" width="45" height="45" rx="6" fill="#1E293B" />
                        <rect x="27" y="142" width="31" height="31" rx="4" fill="#FFFFFF" />
                        <rect x="34" y="149" width="17" height="17" rx="3" fill="#6366F1" />

                        {/* Data Pattern Mock */}
                        <rect x="75" y="25" width="12" height="12" rx="2" fill="#1E293B" />
                        <rect x="95" y="25" width="12" height="25" rx="2" fill="#6366F1" />
                        <rect x="115" y="35" width="12" height="12" rx="2" fill="#1E293B" />
                        <rect x="75" y="45" width="12" height="12" rx="2" fill="#8B5CF6" />
                        <rect x="75" y="70" width="22" height="12" rx="2" fill="#1E293B" />
                        <rect x="105" y="70" width="25" height="12" rx="2" fill="#1E293B" />
                        <rect x="140" y="75" width="12" height="22" rx="2" fill="#6366F1" />
                        <rect x="160" y="80" width="15" height="12" rx="2" fill="#1E293B" />
                        <rect x="25" y="80" width="15" height="12" rx="2" fill="#1E293B" />
                        <rect x="48" y="75" width="12" height="25" rx="2" fill="#6366F1" />

                        <rect x="75" y="115" width="20" height="12" rx="2" fill="#1E293B" />
                        <rect x="105" y="115" width="12" height="25" rx="2" fill="#6366F1" />
                        <rect x="125" y="125" width="20" height="12" rx="2" fill="#1E293B" />
                        <rect x="155" y="115" width="20" height="20" rx="2" fill="#8B5CF6" />
                        <rect x="75" y="145" width="12" height="25" rx="2" fill="#6366F1" />
                        <rect x="95" y="155" width="25" height="12" rx="2" fill="#1E293B" />
                        <rect x="130" y="150" width="12" height="20" rx="2" fill="#1E293B" />
                        <rect x="150" y="145" width="25" height="12" rx="2" fill="#6366F1" />

                        {/* Center Emblem */}
                        <circle cx="100" cy="100" r="20" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
                        <circle cx="100" cy="100" r="14" fill="#6366F1" />
                      </svg>
                    </div>
                  </div>

                  <div className="qr-instructions">
                    <div className="qr-step-item">
                      <Smartphone size={16} className="qr-step-icon" />
                      <span>Откройте приложение <b>New Age</b> на телефоне</span>
                    </div>
                    <div className="qr-step-item">
                      <QrCode size={16} className="qr-step-icon" />
                      <span>Перейдите в <b>Профиль → QR-сканер</b> и наведите камеру</span>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className="qr-demo-instant-btn"
                    onClick={handleQuickDemoLogin}
                  >
                    Имитировать сканирование QR и войти <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* ОБЫЧНЫЙ ВХОД ИЛИ РЕГИСТРАЦИЯ */}
              {(mode === 'register' || (mode === 'login' && loginMethod === 'form')) && (
                <>
                  {/* Quick Demo Login Option */}
                  {mode === 'login' && (
                    <div className="demo-quick-login-banner" onClick={handleQuickDemoLogin}>
                      <div className="demo-login-badge">Тестовый вход</div>
                      <div className="demo-login-text">
                        <strong>Войти как Алексей Миронов</strong>
                        <span>Демо-аккаунт с заполненным профилем и публикациями</span>
                      </div>
                      <ArrowRight size={16} className="demo-arrow" />
                    </div>
                  )}

                  {/* OAuth Buttons */}
                  {step === 1 && (
                    <div className="oauth-row">
                      <button type="button" className="oauth-btn" onClick={handleQuickDemoLogin}>
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="18" />
                        Google
                      </button>
                      <button type="button" className="oauth-btn" onClick={handleQuickDemoLogin}>
                        <img src="https://www.svgrepo.com/show/349527/telegram.svg" alt="Telegram" width="18" />
                        Telegram
                      </button>
                    </div>
                  )}

                  {step === 1 && <div className="auth-divider"><span>или с логином и паролем</span></div>}

                  <form onSubmit={handleNextOrSubmit} className="auth-form">
                    {mode === 'login' && (
                      <>
                        <div className="auth-field">
                          <label>{t('auth.modal.contact_label')}</label>
                          <div className="auth-input-wrapper">
                            <Mail size={17} className="auth-input-icon" />
                            <input 
                              type="text" 
                              placeholder="alex_mironov или alex@newage.com" 
                              value={emailOrPhone}
                              onChange={e => setEmailOrPhone(e.target.value)}
                              required 
                            />
                          </div>
                        </div>

                        <div className="auth-field">
                          <label>{t('auth.modal.password_label')}</label>
                          <div className="auth-input-wrapper">
                            <Lock size={17} className="auth-input-icon" />
                            <input 
                              type="password" 
                              placeholder="••••••••" 
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="auth-extras">
                          <label className="remember-me">
                            <input type="checkbox" defaultChecked />
                            <span>Запомнить меня</span>
                          </label>
                          <a href="#forgot" className="forgot-link" onClick={e => { e.preventDefault(); alert('Для демо используйте любой логин или существующего пользователя'); }}>
                            Забыли пароль?
                          </a>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                          {isSubmitting ? 'Вход...' : t('auth.modal.btn_submit_login')}
                        </button>
                      </>
                    )}

                    {mode === 'register' && step === 1 && (
                      <>
                        <div className="auth-inputs-grid-2">
                          <div className="auth-field">
                            <label>{t('auth.modal.name_label')}</label>
                            <div className="auth-input-wrapper">
                              <UserIcon size={17} className="auth-input-icon" />
                              <input 
                                type="text" 
                                placeholder={t('auth.modal.name_placeholder')}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required 
                              />
                            </div>
                          </div>

                          <div className="auth-field">
                            <label>{t('auth.modal.username_label')}</label>
                            <div className="auth-input-wrapper">
                              <span className="auth-at">@</span>
                              <input 
                                type="text" 
                                placeholder="username" 
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="auth-field">
                          <label>{t('auth.modal.contact_label')}</label>
                          <div className="auth-input-wrapper">
                            <Phone size={17} className="auth-input-icon" />
                            <input 
                              type="text" 
                              placeholder={t('auth.modal.contact_placeholder')}
                              value={emailOrPhone}
                              onChange={e => setEmailOrPhone(e.target.value)}
                              required 
                            />
                          </div>
                        </div>

                        <div className="auth-field">
                          <label>{t('auth.modal.password_label')}</label>
                          <div className="auth-input-wrapper">
                            <Lock size={17} className="auth-input-icon" />
                            <input 
                              type="password" 
                              placeholder={t('auth.modal.password_placeholder')}
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              required 
                            />
                          </div>
                        </div>

                        <div className="register-legal-notice">
                          <span>
                            Продолжая, вы соглашаетесь с{' '}
                            <button 
                              type="button" 
                              className="legal-link-btn"
                              onClick={() => { setLegalTab('terms'); setLegalModalOpen(true); }}
                            >
                              Правилами сообщества
                            </button>{' '}
                            и{' '}
                            <button 
                              type="button" 
                              className="legal-link-btn"
                              onClick={() => { setLegalTab('privacy'); setLegalModalOpen(true); }}
                            >
                              Политикой конфиденциальности
                            </button>
                          </span>
                        </div>

                        <button type="submit" className="auth-submit-btn">
                          {t('auth.modal.btn_next')} <ArrowRight size={18} />
                        </button>
                      </>
                    )}

                    {mode === 'register' && step === 2 && (
                      <>
                        {/* ИНТЕРАКТИВНЫЙ ВЫБОР РЕЛИГИИ / МИРОВОЗЗРЕНИЯ С ЗОЛОТЫМИ СИМВОЛАМИ */}
                        <div className="auth-section">
                          <div className="belief-title-row">
                            <div className="belief-title-flex">
                              <Compass size={17} className="belief-compass-icon" />
                              <label className="auth-section-title">Вероисповедание / Мировоззрение</label>
                            </div>
                            <span className="belief-tag-badge">GDPR Protected</span>
                          </div>

                          <p className="auth-field-hint">
                            Выберите направление для подбора близких сообществ и праздников.
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
                            <Info size={15} />
                            <span>Не указывать мировоззрение (Светский профиль)</span>
                          </div>

                          {/* Настройка видимости в профиле */}
                          <div className="privacy-toggle-box">
                            <Shield size={16} className="privacy-shield-icon" />
                            <div className="privacy-text">
                              <strong>Видимость в профиле</strong>
                              <span>Кто сможет видеть символ веры в профиле</span>
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
                                <UserIcon size={18} />
                              </div>
                              <div className="role-info">
                                <strong>Личный</strong>
                                <span>Лента, видео, мессенджер</span>
                              </div>
                            </div>

                            <div 
                              className={`role-card ${selectedRole === 'creator' ? 'active' : ''}`}
                              onClick={() => setSelectedRole('creator')}
                            >
                              <div className="role-icon-box creator">
                                <Video size={18} />
                              </div>
                              <div className="role-info">
                                <strong>Автор</strong>
                                <span>Канал, видео, подкасты</span>
                              </div>
                            </div>

                            <div 
                              className={`role-card ${selectedRole === 'business' ? 'active' : ''}`}
                              onClick={() => setSelectedRole('business')}
                            >
                              <div className="role-icon-box business">
                                <ShoppingBag size={18} />
                              </div>
                              <div className="role-info">
                                <strong>Бизнес</strong>
                                <span>Витрина и продажи</span>
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
                            Я согласен с{' '}
                            <button
                              type="button"
                              className="legal-link-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setLegalTab('terms');
                                setLegalModalOpen(true);
                              }}
                            >
                              правилами сообщества New Age
                            </button>{' '}
                            и{' '}
                            <button
                              type="button"
                              className="legal-link-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setLegalTab('privacy');
                                setLegalModalOpen(true);
                              }}
                            >
                              политикой конфиденциальности (GDPR/ФЗ-152)
                            </button>
                          </label>
                        </div>

                        <div className="auth-action-buttons">
                          <button type="button" className="auth-back-btn" onClick={() => setStep(1)}>
                            {t('auth.modal.btn_back')}
                          </button>
                          <button type="submit" className="auth-submit-btn" disabled={!agreedToTerms || isSubmitting}>
                            <CheckCircle2 size={17} /> {isSubmitting ? 'Регистрация...' : t('auth.modal.btn_submit_register')}
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно политики конфиденциальности и правил */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
      />
    </div>
  );
};

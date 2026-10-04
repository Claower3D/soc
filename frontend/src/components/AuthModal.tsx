import { useState, useEffect } from 'react';
import { 
  X, Mail, Lock, User as UserIcon, Shield, CheckCircle2, 
  ShoppingBag, Video, ArrowRight, Check, Compass, Info, AlertCircle, Sparkles, LogIn, UserPlus, QrCode, Smartphone,
  Eye, EyeOff
} from 'lucide-react';
import { RELIGIONS_CATALOG, type UserRole, type BeliefPrivacy } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { LegalModal } from './LegalModal';
import { SacredQrLogo } from './SacredQrLogo';
import { CountryPhoneInput } from './CountryPhoneInput';
import { type CountryInfo } from '../utils/countryDetect';
import { API_BASE_URL } from '../api';
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
  const { login, register, currentUser, loginWithToken } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'form' | 'qr'>('form');
  const [step, setStep] = useState<1 | 2>(1);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [detectedCountry, setDetectedCountry] = useState<CountryInfo | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [selectedBeliefId, setSelectedBeliefId] = useState<string>('christianity');
  const [beliefPrivacy, setBeliefPrivacy] = useState<BeliefPrivacy>('public');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms'>('privacy');

  // QR Login State
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<'pending' | 'confirmed' | 'expired'>('pending');

  useEffect(() => {
    if (!isOpen || mode !== 'login' || loginMethod !== 'qr') {
      return;
    }

    let active = true;
    let pollInterval: any = null;

    const initQR = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/qr/init`);
        const data = await res.json();
        if (data.status === 'ok' && data.data?.sessionId) {
          if (!active) return;
          const sId = data.data.sessionId;
          setQrSessionId(sId);
          setQrStatus('pending');

          pollInterval = setInterval(async () => {
            try {
              const statusRes = await fetch(`${API_BASE_URL}/api/auth/qr/status?session=${encodeURIComponent(sId)}`);
              const statusData = await statusRes.json();
              if (statusData.status === 'ok' && statusData.data) {
                const sStatus = statusData.data.sessionStatus;
                if (sStatus === 'confirmed') {
                  clearInterval(pollInterval);
                  setQrStatus('confirmed');
                  if (statusData.data.token && statusData.data.user) {
                    loginWithToken(statusData.data.token, statusData.data.user);
                    setLoginSuccessMessage(true);
                    setTimeout(() => {
                      onClose();
                    }, 1200);
                  }
                } else if (sStatus === 'expired') {
                  clearInterval(pollInterval);
                  setQrStatus('expired');
                }
              }
            } catch {
              // ignore transient network poll errors
            }
          }, 1500);
        }
      } catch (err) {
        console.error('Failed to init QR session:', err);
      }
    };

    initQR();

    return () => {
      active = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isOpen, mode, loginMethod]);

  if (!isOpen) return null;

  const executeRegistration = async (overrideBeliefId?: string, overrideRole?: UserRole) => {
    const cleanUser = username.trim().toLowerCase().replace(/^@/, '');
    if (!name.trim() || !cleanUser || !emailOrPhone.trim() || !password) {
      setErrorMessage(t('auth.modal.err_fill_all'));
      return;
    }
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUser)) {
      setErrorMessage('Уникальный ID должен содержать только латинские буквы, цифры и _ (от 3 до 30 символов)');
      return;
    }
    if (password.length < 6) {
      setErrorMessage(t('auth.modal.err_password_len'));
      return;
    }

    const effBelief = overrideBeliefId !== undefined ? overrideBeliefId : selectedBeliefId;
    const effRole = overrideRole !== undefined ? overrideRole : selectedRole;
    const effReligion = RELIGIONS_CATALOG.find(r => r.id === effBelief) || RELIGIONS_CATALOG[0];

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await register({
        name: name.trim(),
        username: cleanUser,
        emailOrPhone: emailOrPhone.trim(),
        password,
        role: effRole,
        beliefType: effBelief === 'none' ? 'Не указывать / Личное' : effReligion.name,
        beliefPrivacy,
        location: detectedCountry ? detectedCountry.nameRu : 'Россия',
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
      }, 700);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      const cleanUser = username.trim().toLowerCase().replace(/^@/, '');
      if (!name.trim() || !cleanUser || !emailOrPhone.trim() || !password) {
        setErrorMessage(t('auth.modal.err_fill_all'));
        return;
      }
      if (!/^[a-z0-9_]{3,30}$/.test(cleanUser)) {
        setErrorMessage('Уникальный ID должен содержать только латинские буквы, цифры и _ (от 3 до 30 символов)');
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
    await executeRegistration();
  };

  const handleOAuthClick = (provider: string) => {
    setErrorMessage(`Авторизация через ${provider} будет доступна в мобильном приложении`);
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

              {/* QR-КОД ВХОД С САХРАЛЬНЫМ ЛОГОТИПОМ ЭКОСИСТЕМЫ */}
              {mode === 'login' && loginMethod === 'qr' && (
                <div className="qr-login-container">
                  <div className="qr-sacred-stage">
                    {qrStatus === 'confirmed' ? (
                      <div className="qr-confirmed-success" style={{textAlign: 'center', padding: '30px 15px'}}>
                        <div style={{fontSize: '48px', marginBottom: '12px'}}>✨</div>
                        <h3 style={{color: '#10B981', fontWeight: 700, margin: '0 0 8px'}}>Успешный вход!</h3>
                        <p style={{color: 'var(--color-text-secondary)', fontSize: '0.9rem'}}>Авторизуем ваш аккаунт...</p>
                      </div>
                    ) : qrStatus === 'expired' ? (
                      <div className="qr-expired-block" style={{textAlign: 'center', padding: '30px 15px'}}>
                        <p style={{color: '#EF4444', marginBottom: '12px'}}>QR-код устарел</p>
                        <button 
                          type="button" 
                          className="btn btn-primary"
                          onClick={() => {
                            setQrStatus('pending');
                            setQrSessionId(null);
                          }}
                        >
                          Обновить QR-код
                        </button>
                      </div>
                    ) : (
                      <SacredQrLogo 
                        size={220} 
                        dataUrl={qrSessionId ? `${window.location.origin}/qr-login?session=${qrSessionId}` : `${window.location.origin}/qr-login`} 
                      />
                    )}
                  </div>

                  <div className="qr-instructions">
                    <div className="qr-step-item">
                      <Smartphone size={16} className="qr-step-icon" />
                      <span>Откройте камеру на телефоне или приложение <b>New Age</b></span>
                    </div>
                    <div className="qr-step-item">
                      <QrCode size={16} className="qr-step-icon" />
                      <span>Наведите камеру на QR-код и подтвердите вход</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ОБЫЧНЫЙ ВХОД ИЛИ РЕГИСТРАЦИЯ */}
              {(mode === 'register' || (mode === 'login' && loginMethod === 'form')) && (
                <>
                  {/* OAuth Buttons */}
                  {step === 1 && (
                    <div className="oauth-row">
                      <button type="button" className="oauth-btn" onClick={() => handleOAuthClick('Google')}>
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="18" />
                        Google
                      </button>
                      <button type="button" className="oauth-btn" onClick={() => handleOAuthClick('Telegram')}>
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
                          <div className="auth-field-header-row">
                            <label>{t('auth.modal.contact_label')}</label>
                            {detectedCountry && (
                              <span className="auth-detected-badge" title="Страна определена автоматически">
                                📍 {detectedCountry.nameRu}
                              </span>
                            )}
                          </div>
                          <CountryPhoneInput
                            value={emailOrPhone}
                            onChange={(val) => setEmailOrPhone(val)}
                            onCountryDetected={(c) => setDetectedCountry(c)}
                            placeholder="+7 (___) ___-__-__ или email"
                            required
                          />
                        </div>

                        <div className="auth-field">
                          <label>{t('auth.modal.password_label')}</label>
                          <div className="auth-input-wrapper">
                            <Lock size={17} className="auth-input-icon" />
                            <input 
                              type={showLoginPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              value={password} 
                              onChange={e => setPassword(e.target.value)}
                              autoComplete="current-password"
                            />
                            <button
                              type="button"
                              className="auth-password-toggle-btn"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              tabIndex={-1}
                              aria-label="Показать пароль"
                            >
                              {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        <div className="auth-extras">
                          <label className="remember-me">
                            <input type="checkbox" defaultChecked />
                            <span>Запомнить меня</span>
                          </label>
                          <a href="#forgot" className="forgot-link" onClick={e => { e.preventDefault(); setErrorMessage('Для восстановления доступа обратитесь в службу поддержки: support@newage.network'); }}>
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
                            <label>{t('auth.modal.name_label')} *</label>
                            <div className="auth-input-wrapper">
                              <UserIcon size={17} className="auth-input-icon" />
                              <input 
                                type="text" 
                                placeholder={t('auth.modal.name_placeholder')}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                autoComplete="name"
                                required 
                              />
                            </div>
                          </div>

                          <div className="auth-field">
                            <label>{t('auth.modal.username_label')} *</label>
                            <div className="auth-input-wrapper">
                              <span className="auth-at">@</span>
                              <input 
                                type="text" 
                                placeholder="username" 
                                value={username}
                                onChange={e => {
                                  const clean = e.target.value.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
                                  setUsername(clean);
                                }}
                                autoComplete="username"
                                required 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="auth-field">
                          <div className="auth-field-header-row">
                            <label>Номер телефона или Email *</label>
                            {detectedCountry && (
                              <span className="auth-detected-badge" title="Страна определена автоматически">
                                📍 {detectedCountry.nameRu}
                              </span>
                            )}
                          </div>
                          <CountryPhoneInput
                            value={emailOrPhone}
                            onChange={(val) => setEmailOrPhone(val)}
                            onCountryDetected={(c) => setDetectedCountry(c)}
                            onlyPhone={false}
                            placeholder="+7 (999) 000-00-00 или email@domain.com"
                            required
                          />
                        </div>

                        <div className="auth-field">
                          <label>{t('auth.modal.password_label')} *</label>
                          <div className="auth-input-wrapper">
                            <Lock size={17} className="auth-input-icon" />
                            <input 
                              type={showPassword ? "text" : "password"} 
                              placeholder={t('auth.modal.password_placeholder')}
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              autoComplete="new-password"
                              required 
                            />
                            <button
                              type="button"
                              className="auth-password-toggle-btn"
                              onClick={() => setShowPassword(!showPassword)}
                              tabIndex={-1}
                              aria-label="Показать пароль"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
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

                        <div className="register-actions-mobile-group">
                          <button 
                            type="button" 
                            className="auth-submit-btn fast-register-btn"
                            disabled={isSubmitting}
                            onClick={() => executeRegistration()}
                          >
                            <Sparkles size={17} />
                            {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться в 1 клик'}
                          </button>

                          <button 
                            type="submit" 
                            className="auth-secondary-step-btn"
                          >
                            <span>Настроить мировоззрение и роль (Шаг 2)</span>
                            <ArrowRight size={15} />
                          </button>
                        </div>
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
                          <button 
                            type="button" 
                            className="auth-skip-btn" 
                            onClick={() => executeRegistration('none', 'user')}
                            disabled={isSubmitting}
                          >
                            Пропустить
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

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User as UserIcon, Mail, Lock, Eye, EyeOff, Shield, 
  CheckCircle2, ArrowRight, ArrowLeft, Sparkles, AlertCircle, 
  Check, Info, Video, ShoppingBag, Globe, KeyRound
} from 'lucide-react';
import { RELIGIONS_CATALOG, type UserRole, type BeliefPrivacy } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { LegalModal } from '../components/LegalModal';
import { SacredQrLogo } from '../components/SacredQrLogo';
import logoImg from '../assets/logo.png';
import './RegisterPage.css';

interface RegisterPageProps {
  initialMode?: 'register' | 'login';
}

export function RegisterPage({ initialMode = 'register' }: RegisterPageProps) {
  const navigate = useNavigate();
  const { register, login, currentUser } = useAuth();
  const { t, currentLang, setLanguage, languages } = useTranslation();

  const [authMode, setAuthMode] = useState<'register' | 'login'>(initialMode);
  const [step, setStep] = useState<1 | 2>(1);

  // Login form state
  const [loginQuery, setLoginQuery] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);

  // Registration form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameFeedback, setUsernameFeedback] = useState<string>('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [selectedBeliefId, setSelectedBeliefId] = useState<string>('christianity');
  const [beliefPrivacy, setBeliefPrivacy] = useState<BeliefPrivacy>('public');
  
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successText, setSuccessText] = useState('');
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms'>('privacy');

  const selectedReligion = RELIGIONS_CATALOG.find(r => r.id === selectedBeliefId) || RELIGIONS_CATALOG[0];

  // Real-time username check debounced
  const handleUsernameChange = (val: string) => {
    // Sanitize: allow lowercase Latin, numbers and underscore, auto-strip leading @
    const clean = val.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
    setUsername(clean);

    if (!clean) {
      setUsernameStatus('idle');
      setUsernameFeedback('');
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus('invalid');
      setUsernameFeedback('Минимум 3 символа');
      return;
    }

    if (clean.length > 30) {
      setUsernameStatus('invalid');
      setUsernameFeedback('Максимум 30 символов');
      return;
    }

    setUsernameStatus('checking');
    setUsernameFeedback('Проверяем доступность ID...');

    // Call API debounced
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(clean)}`);
        const json = await res.json();
        if (json?.data?.available) {
          setUsernameStatus('available');
          setUsernameFeedback(`@${clean} свободен`);
        } else {
          setUsernameStatus('taken');
          setUsernameFeedback(json?.data?.message || `@${clean} уже занят`);
        }
      } catch {
        setUsernameStatus('available');
        setUsernameFeedback(`@${clean} доступен`);
      }
    }, 350);

    return () => clearTimeout(timer);
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim().toLowerCase().replace(/^@/, '');

    if (!name.trim() || !cleanUser || !emailOrPhone.trim() || !password) {
      setErrorMessage(t('auth.modal.err_fill_all'));
      return;
    }

    // Strict validation for unique ID
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUser)) {
      setErrorMessage('Уникальный ID должен состоять из латинских букв, цифр или _ (от 3 до 30 символов)');
      return;
    }

    if (usernameStatus === 'taken') {
      setErrorMessage(`ID @${cleanUser} уже занят. Пожалуйста, придумайте другой уникальный ID`);
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('auth.modal.err_password_len'));
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setErrorMessage(t('auth.modal.err_password_match'));
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginQuery.trim() || !loginPassword) {
      setErrorMessage(t('auth.modal.err_fill_all') || 'Заполните все поля');
      return;
    }

    setIsLoginSubmitting(true);
    try {
      const res = await login(loginQuery.trim(), loginPassword);
      if (!res.success) {
        setErrorMessage(res.message || 'Неверный логин или пароль');
        return;
      }

      setSuccessText('Авторизация успешна! Входим в профиль...');
      setSuccess(true);
      const cleanUser = loginQuery.trim().replace(/^@/, '');
      setTimeout(() => {
        if (cleanUser && !cleanUser.includes('@') && !cleanUser.includes('.')) {
          navigate(`/profile/@${cleanUser}`);
        } else {
          navigate(`/profile/@${currentUser?.username || cleanUser}`);
        }
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ошибка сервера при входе');
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!agreedToTerms) {
      setErrorMessage(t('auth.modal.err_terms'));
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanUser = username.trim().replace(/^@/, '');
      const res = await register({
        name: name.trim(),
        username: cleanUser,
        emailOrPhone: emailOrPhone.trim(),
        password,
        role: selectedRole,
        beliefType: selectedBeliefId === 'none' ? 'Не указано / Личное' : selectedReligion.name,
        beliefPrivacy,
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Ошибка регистрации');
        return;
      }

      setSuccessText('Ваш криптографический JWT-токен успешно сгенерирован сервером. Перенаправляем в профиль...');
      setSuccess(true);
      setTimeout(() => {
        navigate(`/profile/@${cleanUser}`);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Серверная ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page-container">
      {/* Ambient background decoration */}
      <div className="register-bg-decor-circle circle-1" />
      <div className="register-bg-decor-circle circle-2" />

      {/* Top Header */}
      <header className="register-page-header">
        <Link to="/" className="register-brand-link">
          <img src={logoImg} alt="New Age" className="register-brand-logo" />
          <div className="register-brand-text">
            <span className="brand-logo-title">NEW AGE</span>
            <span className="brand-logo-subtitle">Экосистема 2026</span>
          </div>
        </Link>

        <div className="register-header-controls">
          <div className="register-lang-picker">
            <Globe size={15} />
            <select 
              value={currentLang}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="register-lang-select"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeName}
                </option>
              ))}
            </select>
          </div>

          <Link to="/" className="register-back-to-app-btn">
            {t('nav.feed')}
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="register-page-main">
        <div className="register-card">
          {/* Left Benefit Banner */}
          <div className="register-side-banner">
            <div className="side-banner-content">
              <div className="side-badge">
                <Sparkles size={14} className="sparkle-icon" />
                <span>Официальная регистрация</span>
              </div>
              <h1 className="side-title">Добро пожаловать в Новую Эру</h1>
              <p className="side-desc">
                Единый аккаунт открывает доступ ко всем возможностям платформы: HD конференциям, ИИ-наставнику, защищенному мессенджеру и духовному маркетплейсу.
              </p>

              <div className="side-benefits-list">
                <div className="benefit-item">
                  <div className="benefit-icon-wrapper">
                    <KeyRound size={16} />
                  </div>
                  <div>
                    <strong>JWT RFC 7519 & Salt Hash</strong>
                    <span>Криптографическая защита учетных записей</span>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon-wrapper">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <strong>12 Мировоззрений и Символов</strong>
                    <span>Выбирайте свою веру или нейтральный путь</span>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon-wrapper">
                    <Shield size={16} />
                  </div>
                  <div>
                    <strong>GDPR & ФЗ-152</strong>
                    <span>Полный суверенитет и приватность ваших данных</span>
                  </div>
                </div>
              </div>

              {/* Sacred QR Code Widget */}
              <div className="side-banner-qr-block">
                <SacredQrLogo size={150} />
                <span className="side-qr-caption">Сканируйте сакральный QR для входа с телефона</span>
              </div>

              <div className="side-banner-footer">
                {authMode === 'register' ? (
                  <>
                    <span>Уже есть аккаунт?</span>
                    <button 
                      type="button" 
                      className="side-login-link-btn"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMessage(null);
                      }}
                    >
                      Войти в профиль
                    </button>
                  </>
                ) : (
                  <>
                    <span>Впервые у нас?</span>
                    <button 
                      type="button" 
                      className="side-login-link-btn"
                      onClick={() => {
                        setAuthMode('register');
                        setErrorMessage(null);
                      }}
                    >
                      Создать аккаунт
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Interactive Form */}
          <div className="register-form-container">
            {/* Mode Switcher Tabs on top of the form */}
            <div className="auth-mode-switch-tabs">
              <button
                type="button"
                className={`auth-mode-tab ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                }}
              >
                Вход в аккаунт
              </button>
              <button
                type="button"
                className={`auth-mode-tab ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage(null);
                }}
              >
                Регистрация
              </button>
            </div>

            {/* Step Progress Tracker (only when registering) */}
            {authMode === 'register' && (
              <div className="step-progress-tracker">
                <div className={`progress-step-node ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                  <div className="node-number">{step > 1 ? <Check size={14} /> : '1'}</div>
                  <span className="node-title">Аккаунт</span>
                </div>
                <div className={`progress-track-line ${step >= 2 ? 'active' : ''}`} />
                <div className={`progress-step-node ${step >= 2 ? 'active' : ''}`}>
                  <div className="node-number">2</div>
                  <span className="node-title">Мировоззрение & Роль</span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="register-alert-box error">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {success ? (
              <div className="register-success-view">
                <div className="success-icon-animation">
                  <CheckCircle2 size={64} color="#10B981" />
                </div>
                <h2>{authMode === 'login' ? 'Вход выполнен' : t('auth.modal.success_reg')}</h2>
                <p>{successText || 'Перенаправляем в систему...'}</p>
                <div className="success-loader-bar" />
              </div>
            ) : authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="register-step-form">
                <div className="step-header-text">
                  <h2>Авторизация в профиль</h2>
                  <p>Введите ваш Email, телефон или @username для входа</p>
                </div>

                <div className="form-fields-grid single-col">
                  <div className="form-group-field">
                    <label>{t('auth.modal.email_or_phone')} *</label>
                    <div className="form-input-box">
                      <Mail size={18} className="field-icon" />
                      <input 
                        type="text" 
                        placeholder="example@newage.ru или @username" 
                        value={loginQuery}
                        onChange={(e) => setLoginQuery(e.target.value)}
                        autoFocus
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group-field">
                    <div className="field-label-row">
                      <label>{t('auth.modal.password')} *</label>
                    </div>
                    <div className="form-input-box">
                      <Lock size={18} className="field-icon" />
                      <input 
                        type={showLoginPassword ? 'text' : 'password'} 
                        placeholder="Введите ваш пароль"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required 
                      />
                      <button 
                        type="button" 
                        className="password-toggle-btn"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-bottom-actions">
                  <button 
                    type="submit" 
                    className="primary-register-btn full-width"
                    disabled={isLoginSubmitting}
                  >
                    <span>{isLoginSubmitting ? 'Проверка JWT токена...' : 'Войти в профиль'}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>

                <div className="login-quick-switch-footer">
                  <span>Нет профиля в New Age? </span>
                  <button
                    type="button"
                    className="inline-toggle-link"
                    onClick={() => {
                      setAuthMode('register');
                      setErrorMessage(null);
                    }}
                  >
                    Пройти быструю регистрацию
                  </button>
                </div>
              </form>
            ) : (
              <>
                {step === 1 ? (
                  <form onSubmit={handleStep1} className="register-step-form">
                    <div className="step-header-text">
                      <h2>Создание учетной записи</h2>
                      <p>Заполните базовые учетные данные для авторизации</p>
                    </div>

                    <div className="form-fields-grid">
                      <div className="form-group-field">
                        <label>{t('auth.modal.name_label')} *</label>
                        <div className="form-input-box">
                          <UserIcon size={18} className="field-icon" />
                          <input 
                            type="text" 
                            placeholder={t('auth.modal.name_placeholder')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group-field">
                        <div className="field-label-row">
                          <label>{t('auth.modal.username_label')} *</label>
                          {username && (
                            <span className={`username-status-badge ${usernameStatus}`}>
                              {usernameStatus === 'checking' && '⏳ Проверка...'}
                              {usernameStatus === 'available' && '✓ Свободен'}
                              {usernameStatus === 'taken' && '✕ Занят'}
                              {usernameStatus === 'invalid' && '✕ Недопустимый'}
                            </span>
                          )}
                        </div>
                        <div className={`form-input-box ${usernameStatus === 'available' ? 'success' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'error' : ''}`}>
                          <span className="field-icon-at">@</span>
                          <input 
                            type="text" 
                            placeholder="claower_3d" 
                            value={username}
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            required 
                            autoComplete="username"
                          />
                        </div>
                        {usernameFeedback && (
                          <span className={`field-hint-text ${usernameStatus}`}>
                            {usernameFeedback}
                          </span>
                        )}
                        {!usernameFeedback && (
                          <span className="field-hint-text">
                            Уникальный ID профиля: a-z, 0-9, _
                          </span>
                        )}
                      </div>

                      <div className="form-group-field full-width">
                        <label>{t('auth.modal.contact_label')} *</label>
                        <div className="form-input-box">
                          <Mail size={18} className="field-icon" />
                          <input 
                            type="text" 
                            placeholder={t('auth.modal.contact_placeholder')}
                            value={emailOrPhone}
                            onChange={(e) => setEmailOrPhone(e.target.value)}
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group-field">
                        <label>{t('auth.modal.password_label')} *</label>
                        <div className="form-input-box">
                          <Lock size={18} className="field-icon" />
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('auth.modal.password_placeholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                          />
                          <button 
                            type="button" 
                            className="toggle-pwd-btn"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group-field">
                        <label>{t('auth.modal.confirm_password_label')} *</label>
                        <div className="form-input-box">
                          <Lock size={18} className="field-icon" />
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('auth.modal.confirm_password_placeholder')}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-bottom-actions">
                      <button type="submit" className="primary-register-btn">
                        <span>{t('auth.modal.btn_next')}</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="register-step-form">
                    <div className="step-header-text">
                      <h2>Мировоззрение и профиль</h2>
                      <p>Выберите сакральный символ и роль в экосистеме</p>
                    </div>

                    <div className="register-section-box">
                      <div className="section-label-flex">
                        <Sparkles size={16} className="sparkle-gold" />
                        <strong>Священная вера или мировоззрение</strong>
                      </div>
                      <p className="section-subtext">
                        Золотой сакральный символ отобразится рядом с вашим профилем
                      </p>

                      <div className="beliefs-cards-scroll-grid">
                        {RELIGIONS_CATALOG.filter(r => r.id !== 'none').map((religion) => {
                          const isSelected = selectedBeliefId === religion.id;
                          return (
                            <div 
                              key={religion.id}
                              className={`belief-item-card ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedBeliefId(religion.id)}
                              title={religion.description}
                            >
                              <div className="belief-item-symbol-wrapper">
                                <img 
                                  src={religion.iconImg} 
                                  alt={religion.name} 
                                  className="belief-item-img" 
                                />
                              </div>
                              <span className="belief-item-name">{religion.name}</span>
                              <span className="belief-item-subtitle">{religion.symbolTitle}</span>
                              {isSelected && (
                                <div className="belief-check-mark">
                                  <Check size={12} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div 
                        className={`belief-none-card ${selectedBeliefId === 'none' ? 'selected' : ''}`}
                        onClick={() => setSelectedBeliefId('none')}
                      >
                        <Info size={16} />
                        <span>Светский профиль (не указывать веру)</span>
                      </div>

                      <div className="belief-privacy-row">
                        <Shield size={16} />
                        <span>Видимость символа веры:</span>
                        <select 
                          value={beliefPrivacy}
                          onChange={(e) => setBeliefPrivacy(e.target.value as BeliefPrivacy)}
                          className="belief-privacy-dropdown"
                        >
                          <option value="public">🌐 Видно всем</option>
                          <option value="followers">👥 Только подписчикам</option>
                          <option value="private">🔒 Скрыто (только мне)</option>
                        </select>
                      </div>
                    </div>

                    <div className="register-section-box">
                      <div className="section-label-flex">
                        <UserIcon size={16} />
                        <strong>{t('auth.modal.role_label')}</strong>
                      </div>

                      <div className="role-options-grid">
                        <div 
                          className={`role-option-card ${selectedRole === 'user' ? 'active' : ''}`}
                          onClick={() => setSelectedRole('user')}
                        >
                          <div className="role-option-icon">
                            <UserIcon size={20} />
                          </div>
                          <div>
                            <strong>Личный профиль</strong>
                            <span>Общение, лента, видео, звонки</span>
                          </div>
                        </div>

                        <div 
                          className={`role-option-card ${selectedRole === 'creator' ? 'active' : ''}`}
                          onClick={() => setSelectedRole('creator')}
                        >
                          <div className="role-option-icon creator">
                            <Video size={20} />
                          </div>
                          <div>
                            <strong>Автор / Эксперт</strong>
                            <span>Каналы, подкасты, стримы</span>
                          </div>
                        </div>

                        <div 
                          className={`role-option-card ${selectedRole === 'business' ? 'active' : ''}`}
                          onClick={() => setSelectedRole('business')}
                        >
                          <div className="role-option-icon business">
                            <ShoppingBag size={20} />
                          </div>
                          <div>
                            <strong>Бизнес & Мастер</strong>
                            <span>Услуги, товары, маркетплейс</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="register-terms-box">
                      <input 
                        type="checkbox" 
                        id="register-terms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                      />
                      <label htmlFor="register-terms">
                        {t('auth.modal.terms')}{' '}
                        <button 
                          type="button" 
                          className="terms-modal-trigger"
                          onClick={() => { setLegalTab('terms'); setLegalModalOpen(true); }}
                        >
                          (Правила и Условия)
                        </button>
                      </label>
                    </div>

                    <div className="form-bottom-actions split">
                      <button 
                        type="button" 
                        className="secondary-back-btn"
                        onClick={() => setStep(1)}
                      >
                        <ArrowLeft size={16} />
                        <span>{t('auth.modal.btn_back')}</span>
                      </button>

                      <button 
                        type="submit" 
                        className="primary-register-btn"
                        disabled={!agreedToTerms || isSubmitting}
                      >
                        <CheckCircle2 size={18} />
                        <span>{isSubmitting ? 'Создание JWT аккаунта...' : t('auth.modal.btn_submit_register')}</span>
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <LegalModal 
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
      />
    </div>
  );
}

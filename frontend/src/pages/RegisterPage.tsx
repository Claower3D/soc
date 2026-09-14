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
import logoImg from '../assets/logo.png';
import './RegisterPage.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t, currentLang, setLanguage, languages } = useTranslation();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
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
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms'>('privacy');

  const selectedReligion = RELIGIONS_CATALOG.find(r => r.id === selectedBeliefId) || RELIGIONS_CATALOG[0];

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !username.trim() || !emailOrPhone.trim() || !password) {
      setErrorMessage(t('auth.modal.err_fill_all'));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!agreedToTerms) {
      setErrorMessage(t('auth.modal.err_terms'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        name: name.trim(),
        username: username.trim(),
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

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
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

              <div className="side-banner-footer">
                <span>Уже есть аккаунт?</span>
                <button 
                  type="button" 
                  className="side-login-link-btn"
                  onClick={() => navigate('/')}
                >
                  Войти в профиль
                </button>
              </div>
            </div>
          </div>

          {/* Right Interactive Form */}
          <div className="register-form-container">
            {/* Step Progress Tracker */}
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
                <h2>{t('auth.modal.success_reg')}</h2>
                <p>Ваш криптографический JWT-токен успешно сгенерирован сервером. Перенаправляем на платформу...</p>
                <div className="success-loader-bar" />
              </div>
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
                        <label>{t('auth.modal.username_label')} *</label>
                        <div className="form-input-box">
                          <span className="field-icon-at">@</span>
                          <input 
                            type="text" 
                            placeholder="username" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required 
                          />
                        </div>
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

import { useState } from 'react';
import { 
  X, Briefcase, ShoppingBag, Phone, Mail, MapPin, Clock, 
  Sparkles, CheckCircle2, AlertCircle, ArrowLeft, Store, 
  TrendingUp, ShieldCheck, HeartHandshake, ChevronRight,
  FileText, Lock, ShieldAlert, CheckSquare, Square, EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { type User, BUSINESS_CATEGORIES } from '../data/mock';
import { spiritualAudio } from '../utils/spiritualAudio';
import './BusinessAccountModal.css';

interface BusinessAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BusinessAccountModal({ isOpen, onClose, onSuccess }: BusinessAccountModalProps) {
  const { currentUser, updateProfile } = useAuth();

  const isAlreadyBusiness = currentUser?.role === 'business';
  const hasExistingPassport = Boolean(currentUser?.passportSeriesNumber);

  // Business info state
  const [category, setCategory] = useState<string>(currentUser?.businessCategory || BUSINESS_CATEGORIES[0]);
  const [businessPhone, setBusinessPhone] = useState<string>(currentUser?.businessPhone || currentUser?.phone_number || '');
  const [businessEmail, setBusinessEmail] = useState<string>(currentUser?.businessEmail || '');
  const [businessAddress, setBusinessAddress] = useState<string>(currentUser?.businessAddress || currentUser?.location || '');
  const [businessWorkingHours, setBusinessWorkingHours] = useState<string>(currentUser?.businessWorkingHours || 'Ежедневно 10:00 – 20:00');
  const [businessDescription, setBusinessDescription] = useState<string>(currentUser?.businessDescription || currentUser?.bio || '');

  // Passport & Legal responsibility state
  const [passportFullName, setPassportFullName] = useState<string>(currentUser?.passportFullName || currentUser?.name || '');
  const [passportSeriesNumber, setPassportSeriesNumber] = useState<string>(currentUser?.passportSeriesNumber || '');
  const [passportIssueDate, setPassportIssueDate] = useState<string>(currentUser?.passportIssueDate || '');
  const [passportDepartmentCode, setPassportDepartmentCode] = useState<string>(currentUser?.passportDepartmentCode || '');
  const [passportIssuedBy, setPassportIssuedBy] = useState<string>(currentUser?.passportIssuedBy || '');
  const [passportInn, setPassportInn] = useState<string>(currentUser?.passportInn || '');
  
  // Consent checkboxes
  const [agreePersonalResponsibility, setAgreePersonalResponsibility] = useState<boolean>(hasExistingPassport);
  const [agreeTermsAndRules, setAgreeTermsAndRules] = useState<boolean>(hasExistingPassport);
  
  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showMaskedPassport, setShowMaskedPassport] = useState(hasExistingPassport);

  if (!isOpen) return null;

  const maskPassport = (val: string) => {
    if (!val || val.length < 4) return '•• •• ••••••';
    return val.slice(0, 4) + ' ••••••';
  };

  const handleActivateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate passport fields for legal responsibility
    if (!passportFullName.trim()) {
      setValidationError('Пожалуйста, укажите ФИО полностью по паспорту.');
      return;
    }
    if (!passportSeriesNumber.trim() || passportSeriesNumber.trim().length < 6) {
      setValidationError('Пожалуйста, укажите корректные серию и номер паспорта.');
      return;
    }
    if (!passportIssueDate.trim()) {
      setValidationError('Пожалуйста, укажите дату выдачи паспорта.');
      return;
    }
    if (!passportIssuedBy.trim()) {
      setValidationError('Пожалуйста, укажите, кем выдан паспорт.');
      return;
    }

    // Validate consent
    if (!agreePersonalResponsibility) {
      setValidationError('Для получения статуса бизнес-аккаунта необходимо подтвердить личную и юридическую ответственность за свои товары и деятельность.');
      return;
    }
    if (!agreeTermsAndRules) {
      setValidationError('Необходимо подтвердить согласие с регламентом коммерческой деятельности New Age.');
      return;
    }

    setIsSubmitting(true);

    const updatedData: Partial<User> = {
      role: 'business',
      businessCategory: category,
      businessPhone: businessPhone.trim(),
      businessEmail: businessEmail.trim(),
      businessAddress: businessAddress.trim(),
      businessWorkingHours: businessWorkingHours.trim(),
      businessDescription: businessDescription.trim(),
      passportFullName: passportFullName.trim(),
      passportSeriesNumber: passportSeriesNumber.trim(),
      passportIssueDate: passportIssueDate.trim(),
      passportDepartmentCode: passportDepartmentCode.trim(),
      passportIssuedBy: passportIssuedBy.trim(),
      passportInn: passportInn.trim(),
      passportVerified: true,
      passportAgreedAt: currentUser?.passportAgreedAt || new Date().toISOString(),
    };

    updateProfile(updatedData);

    try {
      spiritualAudio.playCrystalChime();
    } catch {
      // Audio fallback
    }

    setIsSubmitting(false);
    setSuccessMessage(isAlreadyBusiness ? 'Данные бизнес-аккаунта и юридическая ответственность успешно обновлены!' : 'Поздравляем! Ваш бизнес-аккаунт верифицирован и успешно активирован!');

    setTimeout(() => {
      setSuccessMessage(null);
      if (onSuccess) onSuccess();
      onClose();
    }, 1300);
  };

  const handleRevertToPersonal = () => {
    setIsSubmitting(true);
    const updatedData: Partial<User> = {
      role: 'user',
    };

    updateProfile(updatedData);

    try {
      spiritualAudio.playCrystalChime();
    } catch {
      // Audio fallback
    }

    setIsSubmitting(false);
    setShowRevertConfirm(false);
    setSuccessMessage('Вы успешно переключились на личный аккаунт');

    setTimeout(() => {
      setSuccessMessage(null);
      if (onSuccess) onSuccess();
      onClose();
    }, 1200);
  };

  return (
    <div className="business-modal-backdrop" onClick={onClose}>
      <div className="business-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="business-modal-header">
          <div className="business-modal-title-wrap">
            <div className="business-modal-icon-badge">
              <Briefcase size={22} />
            </div>
            <div>
              <h2 className="business-modal-title">
                {isAlreadyBusiness ? 'Управление бизнес-аккаунтом' : 'Переход на бизнес-аккаунт New Age Unity'}
              </h2>
              <p className="business-modal-subtitle">
                Витрина товаров, верификация продавца и персональная ответственность
              </p>
            </div>
          </div>
          <button className="business-modal-close-btn" onClick={onClose} title="Закрыть">
            <X size={20} />
          </button>
        </div>

        {/* Success toast notification */}
        {successMessage && (
          <div className="business-success-banner">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Validation error notification */}
        {validationError && (
          <div className="business-error-banner">
            <AlertCircle size={18} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Revert confirmation dialog */}
        {showRevertConfirm ? (
          <div className="business-revert-confirm-box">
            <div className="revert-icon-circle">
              <AlertCircle size={32} />
            </div>
            <h3>Переключиться на личный аккаунт?</h3>
            <p>
              Бейдж магазина и категория будут скрыты из вашего профиля. Ваши товары сохранятся в базе, но витрина станет неактивной для покупателей.
            </p>
            <div className="business-confirm-actions">
              <button 
                type="button" 
                className="btn-business-cancel"
                onClick={() => setShowRevertConfirm(false)}
              >
                <ArrowLeft size={16} /> Отмена
              </button>
              <button 
                type="button" 
                className="btn-business-revert-danger"
                disabled={isSubmitting}
                onClick={handleRevertToPersonal}
              >
                Да, переключить на личный
              </button>
            </div>
          </div>
        ) : (
          <div className="business-modal-body">
            {/* Value perks banner for new business users */}
            {!isAlreadyBusiness && (
              <div className="business-perks-container">
                <div className="business-perk-item">
                  <div className="perk-icon-wrap violet">
                    <ShoppingBag size={18} />
                  </div>
                  <div className="perk-text-wrap">
                    <h4>Витрина товаров и услуг</h4>
                    <p>Продавайте артефакты, книги, таро-консультации и обучающие курсы прямо в профиле</p>
                  </div>
                </div>

                <div className="business-perk-item">
                  <div className="perk-icon-wrap emerald">
                    <Store size={18} />
                  </div>
                  <div className="perk-text-wrap">
                    <h4>Статус проверенного магазина</h4>
                    <p>Официальный бейдж магазина и категория в ленте и профиле</p>
                  </div>
                </div>

                <div className="business-perk-item">
                  <div className="perk-icon-wrap amber">
                    <TrendingUp size={18} />
                  </div>
                  <div className="perk-text-wrap">
                    <h4>Прямая связь с клиентами</h4>
                    <p>Кнопки заказов в WhatsApp / Telegram / Телефон и встроенная статистика продаж</p>
                  </div>
                </div>
              </div>
            )}

            {isAlreadyBusiness && (
              <div className="business-active-status-bar">
                <div className="active-status-indicator">
                  <span className="active-dot-ping" />
                  <ShieldCheck size={18} />
                  <span>Бизнес-аккаунт верифицирован</span>
                </div>
                <span className="business-role-pill">
                  {currentUser.businessCategory || 'Магазин'}
                </span>
              </div>
            )}

            <form onSubmit={handleActivateBusiness} className="business-account-form">
              {/* Category picker */}
              <div className="business-field-group">
                <label className="business-field-label">
                  <ShoppingBag size={15} /> Категория деятельности / Направление
                </label>
                <div className="business-chips-grid">
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`business-chip ${category === cat ? 'selected' : ''}`}
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact phone / WhatsApp */}
              <div className="business-form-row">
                <div className="business-field-group">
                  <label className="business-field-label">
                    <Phone size={15} /> Контактный телефон / WhatsApp
                  </label>
                  <input
                    type="text"
                    className="business-input"
                    placeholder="+7 (999) 000-00-00"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                  />
                  <span className="business-field-hint">Для заказов и связи от покупателей</span>
                </div>

                <div className="business-field-group">
                  <label className="business-field-label">
                    <Mail size={15} /> Email для связи / заказов
                  </label>
                  <input
                    type="email"
                    className="business-input"
                    placeholder="shop@example.com"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                  />
                  <span className="business-field-hint">Оповещения и переписка</span>
                </div>
              </div>

              {/* Address / Location & Working hours */}
              <div className="business-form-row">
                <div className="business-field-group">
                  <label className="business-field-label">
                    <MapPin size={15} /> Адрес шоурума / Город
                  </label>
                  <input
                    type="text"
                    className="business-input"
                    placeholder="Москва, ул. Арбат / Онлайн по всему миру"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                  />
                </div>

                <div className="business-field-group">
                  <label className="business-field-label">
                    <Clock size={15} /> Часы работы
                  </label>
                  <input
                    type="text"
                    className="business-input"
                    placeholder="Пн-Вс: 10:00 – 21:00"
                    value={businessWorkingHours}
                    onChange={(e) => setBusinessWorkingHours(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="business-field-group">
                <label className="business-field-label">
                  <Sparkles size={15} /> Описание магазина / Услуг
                </label>
                <textarea
                  className="business-textarea"
                  rows={2}
                  placeholder="Расскажите о ваших товарах, индивидуальных консультациях, опыте или философии бренда..."
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                />
              </div>

              {/* ========================================================================= */}
              {/* SECTION: ПАСПОРТНЫЕ ДАННЫЕ И ЮРИДИЧЕСКАЯ ОТВЕТСТВЕННОСТЬ */}
              {/* ========================================================================= */}
              <div className="passport-verification-section">
                <div className="passport-section-header">
                  <div className="passport-header-title">
                    <ShieldAlert size={18} className="passport-header-icon" />
                    <span>Паспортные данные и юридическая ответственность продавца</span>
                  </div>
                  <div className="passport-security-badge" title="Данные строго зашифрованы">
                    <Lock size={12} />
                    <span>Конфиденциально</span>
                  </div>
                </div>

                <div className="passport-legal-notice">
                  <p>
                    <strong>Внимание:</strong> В соответствии с правилами платформы New Age Unity, продавец несёт <strong>полную персональную, гражданско-правовую, финансовую и уголовную ответственность</strong> за реализуемые товары, книги, консультации, расчёты с покупателями и соблюдение законодательства. Платформа не несёт ответственности за действия продавца.
                  </p>
                </div>

                {hasExistingPassport && showMaskedPassport ? (
                  <div className="passport-verified-summary-card">
                    <div className="summary-left">
                      <CheckCircle2 size={20} className="verified-check-icon" />
                      <div>
                        <strong>Паспортные данные верифицированы</strong>
                        <p>{passportFullName} • {maskPassport(passportSeriesNumber)}</p>
                        <span className="summary-meta">Ответственность продавца подтверждена</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-change-passport"
                      onClick={() => setShowMaskedPassport(false)}
                    >
                      Изменить данные
                    </button>
                  </div>
                ) : (
                  <div className="passport-fields-block">
                    {/* ФИО */}
                    <div className="business-field-group">
                      <label className="business-field-label required">
                        <FileText size={14} /> ФИО гражданина (полностью по паспорту)
                      </label>
                      <input
                        type="text"
                        className="business-input"
                        placeholder="Иванов Иван Иванович"
                        value={passportFullName}
                        required
                        onChange={(e) => setPassportFullName(e.target.value)}
                      />
                    </div>

                    {/* Серия, Номер и Дата выдачи */}
                    <div className="business-form-row">
                      <div className="business-field-group">
                        <label className="business-field-label required">
                          Серия и номер паспорта
                        </label>
                        <input
                          type="text"
                          className="business-input"
                          placeholder="45 15 123456"
                          maxLength={15}
                          value={passportSeriesNumber}
                          required
                          onChange={(e) => setPassportSeriesNumber(e.target.value)}
                        />
                      </div>

                      <div className="business-field-group">
                        <label className="business-field-label required">
                          Дата выдачи паспорта
                        </label>
                        <input
                          type="date"
                          className="business-input"
                          value={passportIssueDate}
                          required
                          onChange={(e) => setPassportIssueDate(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Кем выдан и Код подразделения */}
                    <div className="business-form-row">
                      <div className="business-field-group">
                        <label className="business-field-label required">
                          Кем выдан паспорт
                        </label>
                        <input
                          type="text"
                          className="business-input"
                          placeholder="Отделом УФМС России по г. Москве..."
                          value={passportIssuedBy}
                          required
                          onChange={(e) => setPassportIssuedBy(e.target.value)}
                        />
                      </div>

                      <div className="business-field-group">
                        <label className="business-field-label">
                          Код подразделения
                        </label>
                        <input
                          type="text"
                          className="business-input"
                          placeholder="770-001"
                          maxLength={10}
                          value={passportDepartmentCode}
                          onChange={(e) => setPassportDepartmentCode(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* ИНН */}
                    <div className="business-field-group">
                      <label className="business-field-label">
                        ИНН продавца (физлица, самозанятого или ИП)
                      </label>
                      <input
                        type="text"
                        className="business-input"
                        placeholder="12 цифр (для самозанятых / ИП / физлиц)"
                        maxLength={15}
                        value={passportInn}
                        onChange={(e) => setPassportInn(e.target.value)}
                      />
                      <span className="business-field-hint">Для прозрачности расчетов и налоговой идентификации</span>
                    </div>

                    {hasExistingPassport && (
                      <button
                        type="button"
                        className="btn-passport-toggle-view"
                        onClick={() => setShowMaskedPassport(true)}
                      >
                        <EyeOff size={14} /> Скрыть поля паспорта
                      </button>
                    )}
                  </div>
                )}

                {/* Consent & Responsibility Checkboxes */}
                <div className="passport-agreements-block">
                  <div 
                    className={`agreement-checkbox-row ${agreePersonalResponsibility ? 'checked' : ''}`}
                    onClick={() => setAgreePersonalResponsibility(!agreePersonalResponsibility)}
                  >
                    <div className="checkbox-box">
                      {agreePersonalResponsibility ? (
                        <CheckSquare size={19} className="check-icon-active" />
                      ) : (
                        <Square size={19} className="check-icon-inactive" />
                      )}
                    </div>
                    <label className="agreement-text">
                      <strong>Я подтверждаю достоверность указанных паспортных данных</strong> и безоговорочно принимаю на себя <strong>всю персональную, гражданско-правовую, финансовую и уголовную ответственность</strong> за публикуемые товары, услуги, консультации и любые взаимодействия с клиентами на платформе New Age Unity.
                    </label>
                  </div>

                  <div 
                    className={`agreement-checkbox-row ${agreeTermsAndRules ? 'checked' : ''}`}
                    onClick={() => setAgreeTermsAndRules(!agreeTermsAndRules)}
                  >
                    <div className="checkbox-box">
                      {agreeTermsAndRules ? (
                        <CheckSquare size={19} className="check-icon-active" />
                      ) : (
                        <Square size={19} className="check-icon-inactive" />
                      )}
                    </div>
                    <label className="agreement-text">
                      Я даю согласие на безопасное хранение паспортных данных в целях юридической идентификации и соглашаюсь с <strong>Регламентом коммерческой деятельности и договором-офертой продавца</strong> New Age Unity.
                    </label>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="business-footer-actions">
                {isAlreadyBusiness && (
                  <button
                    type="button"
                    className="btn-business-revert"
                    onClick={() => setShowRevertConfirm(true)}
                  >
                    Вернуться на личный аккаунт
                  </button>
                )}

                <div className="business-submit-group">
                  <button
                    type="button"
                    className="btn-business-cancel"
                    onClick={onClose}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn-business-submit"
                    disabled={isSubmitting || !agreePersonalResponsibility || !agreeTermsAndRules}
                  >
                    <Sparkles size={16} />
                    <span>
                      {isAlreadyBusiness ? 'Сохранить данные' : 'Подтвердить ответственность и перейти'}
                    </span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {!isAlreadyBusiness && (
                <div className="business-free-note">
                  <HeartHandshake size={15} />
                  <span>Переход на бизнес-аккаунт бесплатен • Ответственность возлагается на продавца</span>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

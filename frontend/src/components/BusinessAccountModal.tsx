import { useState } from 'react';
import { 
  X, Briefcase, ShoppingBag, Phone, Mail, MapPin, Clock, 
  Sparkles, CheckCircle2, AlertCircle, ArrowLeft, Store, 
  TrendingUp, ShieldCheck, HeartHandshake, ChevronRight
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

  // Form state
  const [category, setCategory] = useState<string>(currentUser?.businessCategory || BUSINESS_CATEGORIES[0]);
  const [businessPhone, setBusinessPhone] = useState<string>(currentUser?.businessPhone || currentUser?.phone_number || '');
  const [businessEmail, setBusinessEmail] = useState<string>(currentUser?.businessEmail || '');
  const [businessAddress, setBusinessAddress] = useState<string>(currentUser?.businessAddress || currentUser?.location || '');
  const [businessWorkingHours, setBusinessWorkingHours] = useState<string>(currentUser?.businessWorkingHours || 'Ежедневно 10:00 – 20:00');
  const [businessDescription, setBusinessDescription] = useState<string>(currentUser?.businessDescription || currentUser?.bio || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleActivateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updatedData: Partial<User> = {
      role: 'business',
      businessCategory: category,
      businessPhone: businessPhone.trim(),
      businessEmail: businessEmail.trim(),
      businessAddress: businessAddress.trim(),
      businessWorkingHours: businessWorkingHours.trim(),
      businessDescription: businessDescription.trim(),
    };

    updateProfile(updatedData);

    try {
      spiritualAudio.playCrystalChime();
    } catch {
      // Audio fallback
    }

    setIsSubmitting(false);
    setSuccessMessage(isAlreadyBusiness ? 'Настройки бизнес-аккаунта сохранены!' : 'Поздравляем! Ваш бизнес-аккаунт успешно активирован!');

    setTimeout(() => {
      setSuccessMessage(null);
      if (onSuccess) onSuccess();
      onClose();
    }, 1200);
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
                {isAlreadyBusiness ? 'Управление бизнес-аккаунтом' : 'Бизнес-аккаунт New Age'}
              </h2>
              <p className="business-modal-subtitle">
                {isAlreadyBusiness 
                  ? 'Редактируйте данные вашей витрины и контакты для клиентов' 
                  : 'Трансформируйте профиль в магазин, студию или практику'}
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

        {/* Revert confirmation dialog */}
        {showRevertConfirm ? (
          <div className="business-revert-confirm-box">
            <div className="revert-icon-circle">
              <AlertCircle size={32} />
            </div>
            <h3>Переключиться на личный аккаунт?</h3>
            <p>
              Бейдж магазина и категория будут скрыты из вашего профиля. Ваши товары останутся сохранены, но витрина станет неактивной для покупателей.
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
                    <p>Продавайте эзотерические артефакты, книги, таро-консультации и курсы прямо в профиле</p>
                  </div>
                </div>

                <div className="business-perk-item">
                  <div className="perk-icon-wrap emerald">
                    <Store size={18} />
                  </div>
                  <div className="perk-text-wrap">
                    <h4>Статус проверенного магазина</h4>
                    <p>Специальный статус в профиле, ленте и каталоге мастеров New Age</p>
                  </div>
                </div>

                <div className="business-perk-item">
                  <div className="perk-icon-wrap amber">
                    <TrendingUp size={18} />
                  </div>
                  <div className="perk-text-wrap">
                    <h4>Связь с клиентами & Аналитика</h4>
                    <p>Прямые кнопки связи (WhatsApp, Telegram, Телефон) и статистика витрины</p>
                  </div>
                </div>
              </div>
            )}

            {isAlreadyBusiness && (
              <div className="business-active-status-bar">
                <div className="active-status-indicator">
                  <span className="active-dot-ping" />
                  <ShieldCheck size={18} />
                  <span>Бизнес-аккаунт активен</span>
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
                  <Sparkles size={15} /> Описание магазина / Практики
                </label>
                <textarea
                  className="business-textarea"
                  rows={3}
                  placeholder="Расскажите о ваших товарах, индивидуальных консультациях, опыте или философии бренда..."
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                />
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
                    disabled={isSubmitting}
                  >
                    <Sparkles size={16} />
                    <span>
                      {isAlreadyBusiness ? 'Сохранить изменения' : 'Подключить бизнес-аккаунт'}
                    </span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {!isAlreadyBusiness && (
                <div className="business-free-note">
                  <HeartHandshake size={15} />
                  <span>Переход на бизнес-аккаунт бесплатный и может быть отменён в любое время в профиле</span>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

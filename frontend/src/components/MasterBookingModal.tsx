import React, { useState, useEffect } from 'react';
import { 
  Clock, Video, Star, CheckCircle, 
  CreditCard, Sparkles, X 
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import './MasterBookingModal.css';

interface MasterBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMasterType?: string;
  onConferenceCreated?: (roomName: string, inviteLink: string) => void;
}

interface Master {
  id: string;
  name: string;
  avatar: string;
  role: string;
  rating: number;
  reviewsCount: number;
  priceRub: number;
  tags: string[];
  slots: string[];
}

const MASTERS: Master[] = [
  {
    id: 'm1',
    name: 'Аглая Велес',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    role: 'Гранд-Мастер Таро & МАК',
    rating: 4.98,
    reviewsCount: 142,
    priceRub: 2500,
    tags: ['Таро Райдера-Уэйта', 'Оракул Мадам Ленорман', 'Родовые каналы'],
    slots: ['Сегодня 18:00', 'Сегодня 20:00', 'Завтра 14:00', 'Завтра 19:30']
  },
  {
    id: 'm2',
    name: 'Даниил Север',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'Астролог Западной и Ведической школ',
    rating: 4.95,
    reviewsCount: 98,
    priceRub: 3200,
    tags: ['Натальная карта', 'Солярный прогноз', 'Синастрия (совместимость)'],
    slots: ['Завтра 12:00', 'Завтра 16:00', 'Ср 18:00', 'Ср 21:00']
  },
  {
    id: 'm3',
    name: 'Майя Шанти',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'Сертифицированный аналитик Human Design',
    rating: 5.0,
    reviewsCount: 76,
    priceRub: 2900,
    tags: ['Чтение Бодиграфа', 'Инкарнационный крест', 'Детский дизайн'],
    slots: ['Сегодня 19:00', 'Завтра 15:30', 'Чт 13:00']
  }
];

export const MasterBookingModal: React.FC<MasterBookingModalProps> = ({
  isOpen,
  onClose,
  preselectedMasterType,
  onConferenceCreated
}) => {
  const { formatPrice } = useCurrency();
  const [selectedMaster, setSelectedMaster] = useState<Master>(MASTERS[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>(MASTERS[0].slots[0]);
  const [sessionTheme, setSessionTheme] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedRoom, setGeneratedRoom] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => {
    if (preselectedMasterType === 'astrologer') {
      setSelectedMaster(MASTERS[1]);
      setSelectedSlot(MASTERS[1].slots[0]);
    } else if (preselectedMasterType === 'humandesign') {
      setSelectedMaster(MASTERS[2]);
      setSelectedSlot(MASTERS[2].slots[0]);
    } else {
      setSelectedMaster(MASTERS[0]);
      setSelectedSlot(MASTERS[0].slots[0]);
    }
  }, [preselectedMasterType, isOpen]);

  if (!isOpen) return null;

  const handleBook = () => {
    // Generate private conference room
    const roomId = 'zen-' + Math.random().toString(36).substring(2, 9);
    const roomUrl = `/calls?room=${roomId}&host=true`;

    setGeneratedRoom({
      name: `Сессия 1-на-1 с ${selectedMaster.name} (${selectedSlot})`,
      url: roomUrl
    });

    setIsSuccess(true);

    if (onConferenceCreated) {
      onConferenceCreated(
        `Консультация: ${selectedMaster.name}`,
        roomUrl
      );
    }
  };

  return (
    <div className="booking-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="booking-header">
          <div className="booking-header-title">
            <Sparkles size={18} className="sparkle-gold" />
            <span>Запись на сессию 1-на-1 с Экспертом</span>
          </div>
          <button className="booking-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!isSuccess ? (
          <div className="booking-content">
            {/* Master Selector Cards */}
            <div className="booking-masters-list">
              <label className="booking-label">Выберите наставника:</label>
              <div className="booking-masters-grid">
                {MASTERS.map(m => (
                  <div
                    key={m.id}
                    className={`master-select-card ${selectedMaster.id === m.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedMaster(m);
                      setSelectedSlot(m.slots[0]);
                    }}
                  >
                    <img src={m.avatar} alt={m.name} className="master-avatar-img" />
                    <div className="master-info-wrap">
                      <div className="master-card-name">{m.name}</div>
                      <div className="master-card-role">{m.role}</div>
                      <div className="master-rating-row">
                        <Star size={13} className="star-gold" />
                        <span>{m.rating} ({m.reviewsCount} отзывов)</span>
                      </div>
                    </div>
                    <div className="master-card-price">{formatPrice(m.priceRub)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div className="booking-slots-section">
              <label className="booking-label">
                <Clock size={14} /> Доступные интервалы (МСК):
              </label>
              <div className="booking-slots-grid">
                {selectedMaster.slots.map(slot => (
                  <button
                    key={slot}
                    className={`booking-slot-btn ${selectedSlot === slot ? 'active' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Request note */}
            <div className="booking-note-section">
              <label className="booking-label">Ваш вопрос или тема встречи (необязательно):</label>
              <textarea
                value={sessionTheme}
                onChange={e => setSessionTheme(e.target.value)}
                placeholder="Например: разбор отношений по натальной карте или предназначение..."
                className="booking-textarea"
                rows={2}
              />
            </div>

            {/* Payment Summary */}
            <div className="booking-summary-box">
              <div className="booking-summary-row">
                <span>Стоимость 50-мин консультации:</span>
                <strong>{formatPrice(selectedMaster.priceRub)}</strong>
              </div>
              <div className="booking-summary-row sub-row">
                <span>Способ оплаты:</span>
                <span className="pay-method">
                  <CreditCard size={13} /> New Age Pay / Баланс кошелька
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="booking-footer">
              <button className="booking-pay-btn" onClick={handleBook}>
                <Video size={16} />
                <span>Оплатить и создать видеокомнату ({formatPrice(selectedMaster.priceRub)})</span>
              </button>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="booking-success-view">
            <div className="success-icon-bubble">
              <CheckCircle size={42} className="check-emerald" />
            </div>

            <h3 className="success-title">Консультация успешно забронирована!</h3>
            <p className="success-desc">
              Ваша персональная защищенная видеокомната с <strong>{selectedMaster.name}</strong> создана на время <strong>{selectedSlot}</strong>.
            </p>

            <div className="success-room-info">
              <div className="room-info-label">Прямая ссылка на WebRTC-комнату:</div>
              <div className="room-info-box">
                <code>{window.location.origin}{generatedRoom?.url}</code>
              </div>
            </div>

            <div className="success-actions">
              <a 
                href={generatedRoom?.url} 
                className="join-now-btn"
                onClick={onClose}
              >
                <Video size={16} />
                <span>Перейти в комнату видеозвонка</span>
              </a>

              <button className="success-close-btn" onClick={onClose}>
                Вернуться к практикам
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Sparkles, RotateCcw, Eye, 
  ExternalLink, CheckCircle2, ChevronRight, Layers, Flame, X
} from 'lucide-react';
import { TAROT_DECK, TAROT_SPREADS, type TarotCard, type TarotSpread } from '../data/tarotData';
import { spiritualAudio } from '../utils/spiritualAudio';
import './TarotDeckModal.css';

interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
  positionName: string;
  revealed: boolean;
}

interface TarotDeckModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onBookExpert?: () => void;
}

export const TarotDeckModal: React.FC<TarotDeckModalProps> = ({ isOpen = true, onClose, onBookExpert }) => {
  const [selectedSpread, setSelectedSpread] = useState<TarotSpread>(TAROT_SPREADS[0]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [, setIsDealing] = useState(false);
  const [selectedCardDetail, setSelectedCardDetail] = useState<DrawnCard | null>(null);

  if (isOpen === false) return null;

  const startSpread = (spread: TarotSpread) => {
    setSelectedSpread(spread);
    setIsDealing(true);
    spiritualAudio.playCrystalChime();

    // Random shuffle & pick cards
    const shuffled = [...TAROT_DECK].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, spread.cardCount).map((card, idx) => ({
      card,
      isReversed: Math.random() > 0.8,
      positionName: spread.positions[idx] || `Позиция ${idx + 1}`,
      revealed: false
    }));

    setTimeout(() => {
      setDrawnCards(chosen);
      setIsDealing(false);
    }, 600);
  };

  const handleRevealCard = (index: number) => {
    spiritualAudio.playZenBowl(528, 2);
    setDrawnCards(prev =>
      prev.map((c, idx) => (idx === index ? { ...c, revealed: true } : c))
    );
  };

  const handleRevealAll = () => {
    spiritualAudio.playCrystalChime();
    setDrawnCards(prev => prev.map(c => ({ ...c, revealed: true })));
  };

  const allRevealed = drawnCards.length > 0 && drawnCards.every(c => c.revealed);

  return (
    <div className="tarot-section-container">
      {/* Header with Mode Selectors */}
      <div className="tarot-header-card">
        <div className="tarot-header-glow" />
        <div className="tarot-header-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="tarot-badge">
              <Sparkles size={14} /> ИНТЕРАКТИВНЫЙ ОРАКУЛ NEW AGE
            </div>
            {onClose && (
              <button 
                type="button" 
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
          <h2>3D Колода Таро и Метафорические Карты</h2>
          <p>
            Сформулируйте в тишине важный вопрос, выберите тип расклада и прикоснитесь к картам.
            Звуковой резонанс 528 Гц активирует интуитивное восприятие символов.
          </p>

          <div className="tarot-spreads-pills">
            {TAROT_SPREADS.map(spread => (
              <button
                key={spread.id}
                className={`spread-pill ${selectedSpread.id === spread.id ? 'active' : ''}`}
                onClick={() => startSpread(spread)}
              >
                <Layers size={15} />
                <span>{spread.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Deck Field */}
      <div className="tarot-felt-field">
        {drawnCards.length === 0 ? (
          <div className="tarot-welcome-prompt">
            <div className="tarot-card-fan-preview">
              <div className="fan-card fan-1" />
              <div className="fan-card fan-2" />
              <div className="fan-card fan-3" />
            </div>
            <h3>Колода заряжена и готова к раскладу</h3>
            <p>Выберите расклад выше или начните с Оракула дня (1 карта совета)</p>
            <button
              className="btn-draw-deck"
              onClick={() => startSpread(selectedSpread)}
            >
              <Sparkles size={17} />
              <span>Перетасовать и вытянуть карты</span>
            </button>
          </div>
        ) : (
          <div className="tarot-active-board">
            <div className="board-top-controls">
              <span className="board-spread-title">
                Расклад: <strong>{selectedSpread.name}</strong>
              </span>
              <div className="board-btns">
                {!allRevealed && (
                  <button className="btn-reveal-all" onClick={handleRevealAll}>
                    <Eye size={15} /> Открыть все карты
                  </button>
                )}
                <button
                  className="btn-reshuffle"
                  onClick={() => startSpread(selectedSpread)}
                  title="Перетасовать заново"
                >
                  <RotateCcw size={15} /> Перетасовать
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            <div className={`tarot-cards-grid count-${drawnCards.length}`}>
              {drawnCards.map((item, index) => (
                <div key={item.card.id} className="tarot-slot-wrapper">
                  <div className="slot-position-tag">
                    <span className="pos-num">{index + 1}</span>
                    <span className="pos-name">{item.positionName}</span>
                  </div>

                  <div
                    className={`tarot-3d-card ${item.revealed ? 'flipped' : ''}`}
                    onClick={() => {
                      if (!item.revealed) {
                        handleRevealCard(index);
                      } else {
                        setSelectedCardDetail(item);
                      }
                    }}
                  >
                    {/* Back side of card */}
                    <div className="card-face card-back">
                      <div className="card-back-pattern">
                        <Sparkles size={28} className="back-pattern-icon" />
                        <span>NEW AGE</span>
                      </div>
                      <div className="touch-hint">Нажмите, чтобы открыть</div>
                    </div>

                    {/* Front side of card */}
                    <div className="card-face card-front">
                      <div className="card-image-box">
                        <img src={item.card.image} alt={item.card.name} />
                        {item.isReversed && <span className="reversed-badge">Перевернута</span>}
                      </div>
                      <div className="card-front-info">
                        <span className="card-element-tag">{item.card.element}</span>
                        <h4 className="card-title-front">{item.card.name}</h4>
                        <div className="card-keywords-front">
                          {item.card.keywords.slice(0, 2).join(' • ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {item.revealed && (
                    <button 
                      className="btn-read-deep"
                      onClick={() => setSelectedCardDetail(item)}
                    >
                      <span>Толкование</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Live Advice Box when all revealed */}
            {allRevealed && (
              <div className="tarot-synthesis-card">
                <div className="synthesis-header">
                  <Flame size={18} color="#F59E0B" />
                  <h4>Синтез послания Оракула</h4>
                </div>
                <p className="synthesis-text">
                  Карты указывают на преобладание стихии{' '}
                  <strong>{drawnCards[0].card.element}</strong>. Главный вектор:{' '}
                  <em>«{drawnCards[0].card.advice}»</em>. Примите этот импульс без сомнений.
                </p>

                {onBookExpert && (
                  <div className="tarot-expert-callout">
                    <div className="expert-callout-text">
                      <strong>Хотите глубокий индивидуальный разбор ситуации?</strong>
                      <span>Запишитесь на 1-на-1 видеосессию к верифицированному тарологу платформы</span>
                    </div>
                    <button className="btn-callout-book" onClick={onBookExpert}>
                      <span>Записаться к тарологу</span>
                      <ExternalLink size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      {selectedCardDetail && (
        <div className="tarot-modal-backdrop" onClick={() => setSelectedCardDetail(null)}>
          <div className="tarot-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>{selectedCardDetail.card.name}</h3>
              <button className="modal-close-chip" onClick={() => setSelectedCardDetail(null)}>
                Закрыть
              </button>
            </div>

            <div className="modal-card-body">
              <div className="modal-card-left">
                <img src={selectedCardDetail.card.image} alt={selectedCardDetail.card.name} />
                <div className="modal-meta-pills">
                  <span>Стихия: {selectedCardDetail.card.element}</span>
                  {selectedCardDetail.card.astrologySign && (
                    <span>Планета: {selectedCardDetail.card.astrologySign}</span>
                  )}
                </div>
              </div>

              <div className="modal-card-right">
                <div className="modal-pos-banner">
                  В раскладе: <strong>{selectedCardDetail.positionName}</strong>
                </div>

                <div className="modal-keywords-row">
                  {selectedCardDetail.card.keywords.map(k => (
                    <span key={k} className="keyword-chip">
                      #{k}
                    </span>
                  ))}
                </div>

                <div className="modal-meaning-block">
                  <h5>Прямое толкование:</h5>
                  <p>{selectedCardDetail.card.meaningUpright}</p>
                </div>

                {selectedCardDetail.isReversed && (
                  <div className="modal-meaning-block reversed">
                    <h5>Перевернутое значение:</h5>
                    <p>{selectedCardDetail.card.meaningReversed}</p>
                  </div>
                )}

                <div className="modal-advice-box">
                  <CheckCircle2 size={16} color="#10B981" />
                  <div>
                    <strong>Совет Оракула:</strong>
                    <p>{selectedCardDetail.card.advice}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

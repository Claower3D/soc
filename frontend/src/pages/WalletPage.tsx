import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Crown,
  Heart,
  CreditCard,
  History,
  ShieldCheck,
  Sparkles,
  Check,
  Plus,
  Send,
  Share2,
  Copy
} from 'lucide-react';
import {
  currentUser,
  type WalletTransaction
} from '../data/mock';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import './WalletPage.css';

export const WalletPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { formatPrice, currencyConfig, currency } = useCurrency();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [subscriptionTiers, setSubscriptionTiers] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      api.wallet.balance().then(data => {
        setBalance(data.balance || 0);
        setTransactions(data.transactions || []);
        if (data.subscriptionTiers) {
            setSubscriptionTiers(data.subscriptionTiers);
        }
      }).catch(err => {
        console.warn('Failed to load wallet data:', err);
      });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 760, margin: '2rem auto', padding: '1rem' }}>
        <GuestLockPrompt
          featureName="Кошелёк и New Age Pay"
          title="Финансовый кошелёк привязан к личному профилю"
          description="Пополнение баланса, донаты авторам контента, покупка премиум-подписок и вывод средств доступны только зарегистрированным пользователям."
          actionText="Создать аккаунт для доступа к кошельку"
        />
      </div>
    );
  }

  // Modal states
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('1000');
  const [depositCard, setDepositCard] = useState('4276 •••• •••• 9812');

  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState('500');
  const [donateAuthor, setDonateAuthor] = useState('Александр Волков (@alex_dev)');
  const [donateMessage, setDonateMessage] = useState('Спасибо за полезные видеоуроки и исходники!');

  const [hasPremium, setHasPremium] = useState(false);

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(depositAmount);
    if (!val || val <= 0) return;

    setBalance((prev) => prev + val);
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'deposit',
      amount: val,
      description: `Пополнение с карты ${depositCard.slice(-4)}`,
      date: 'Сегодня, только что',
      status: 'completed',
      recipientOrSender: 'Банковская карта'
    };
    setTransactions([newTx, ...transactions]);
    setIsDepositOpen(false);
  };

  const handleDonateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(donateAmount);
    if (!val || val <= 0 || val > balance) {
      alert('Недостаточно средств на балансе кошелька.');
      return;
    }

    setBalance((prev) => prev - val);
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'donation_sent',
      amount: -val,
      description: `Донат автору: ${donateAuthor}`,
      date: 'Сегодня, только что',
      status: 'completed',
      recipientOrSender: donateAuthor
    };
    setTransactions([newTx, ...transactions]);
    setIsDonateOpen(false);
    alert(`Вы успешно отправили ${formatPrice(val)} автору ${donateAuthor}!`);
  };

  const handleSubscribeTier = (tierTitle: string, price: number) => {
    if (balance < price) {
      alert('Недостаточно средств для оформления подписки. Пополните кошелек.');
      return;
    }
    setBalance((prev) => prev - price);
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'subscription',
      amount: -price,
      description: `Спонсорство автора: уровень «${tierTitle}»`,
      date: 'Сегодня, только что',
      status: 'completed'
    };
    setTransactions([newTx, ...transactions]);
    alert(`Вы успешно подписались на уровень «${tierTitle}»!`);
  };

  const handleBuyPremium = () => {
    const price = 399;
    if (balance < price) {
      alert('Недостаточно средств. Пополните кошелек для New Age Premium.');
      return;
    }
    setBalance((prev) => prev - price);
    setHasPremium(true);
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'subscription',
      amount: -price,
      description: 'New Age Premium на 1 месяц',
      date: 'Сегодня, только что',
      status: 'completed'
    };
    setTransactions([newTx, ...transactions]);
    alert('Поздравляем! Вам подключена подписка New Age Premium.');
  };

  return (
    <div className="wallet-page">
      {/* Top Banner & Balance Cards */}
      <div className="wallet-hero-grid">
        {/* Main Wallet Balance Card */}
        <div className="wallet-balance-card">
          <div className="balance-header-row">
            <div className="wallet-badge">
              <Wallet size={18} />
              <span>Кошелёк New Age Pay</span>
            </div>
            <span className="user-handle-tag">@{currentUser.username}</span>
          </div>

          <div className="balance-value-block">
            <span className="balance-label">Доступный баланс</span>
            <div className="balance-sum">
              <h1>{formatPrice(balance)}</h1>
              {currency !== 'RUB' ? (
                <span className="currency-sub">≈ {balance.toLocaleString()} ₽</span>
              ) : (
                <span className="currency-sub">≈ ${(balance / 92).toFixed(0)} USD</span>
              )}
            </div>
          </div>

          <div className="balance-actions-row">
            <button className="btn-wallet-action deposit" onClick={() => setIsDepositOpen(true)}>
              <Plus size={16} /> Пополнить баланс
            </button>
            <button
              className="btn-wallet-action donate"
              onClick={() => setIsDonateOpen(true)}
            >
              <Heart size={16} /> Донат автору
            </button>
            <button
              className="btn-wallet-action withdraw"
              onClick={() => alert('Заявка на вывод отправлена в банк-эмитент.')}
            >
              <ArrowUpRight size={16} /> Вывести
            </button>
          </div>
        </div>

        {/* New Age Premium Card */}
        <div className={`premium-promo-card ${hasPremium ? 'active-premium' : ''}`}>
          <div className="premium-header-badge">
            <Crown size={16} />
            <span>{hasPremium ? 'Ваш статус: PREMIUM' : 'New Age Premium'}</span>
          </div>

          <h3>{hasPremium ? 'Премиум подписка активна' : 'Максимум возможностей платформы'}</h3>

          <ul className="premium-perks-list">
            <li>
              <Check size={14} className="perk-check" /> 0% комиссии на переводы и маркетплейс
            </li>
            <li>
              <Check size={14} className="perk-check" /> Золотой статус-бейдж в профиле и чатах
            </li>
            <li>
              <Check size={14} className="perk-check" /> HD 4K экспорт в видеостудии без водяного знака
            </li>
            <li>
              <Check size={14} className="perk-check" /> Доступ к закрытым конференциям до 500 чел.
            </li>
          </ul>

          <div className="premium-footer-row">
            <div className="price-tag">
              <strong>{formatPrice(399)}</strong>
              <span>/ месяц</span>
            </div>
            <button
              className="btn-buy-premium"
              onClick={handleBuyPremium}
              disabled={hasPremium}
            >
              {hasPremium ? 'Подписка подключена' : `Оформить за ${formatPrice(399)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Author Sponsorship Tiers Section */}
      <div className="sponsorship-tiers-section">
        <div className="section-title-row">
          <div className="section-title-wrap">
            <Sparkles size={20} color="#6366F1" />
            <div>
              <h3>Спонсорство авторов и подписки</h3>
              <p>Поддерживайте авторов каналов и получайте эксклюзивный контент и доступ в закрытые чаты</p>
            </div>
          </div>
        </div>

        <div className="tiers-grid">
          {subscriptionTiers.map((tier) => (
            <div key={tier.id} className="tier-card">
              <div className="tier-top">
                <h4>{tier.title}</h4>
                <div className="tier-price">
                  <strong>{formatPrice(tier.price)}</strong>
                  <span>/ месяц</span>
                </div>
              </div>

              <ul className="tier-perks">
                {tier.perks.map((perk: string, idx: number) => (
                  <li key={idx}>
                    <Check size={14} className="tier-check-icon" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              <button
                className="btn-subscribe-tier"
                onClick={() => handleSubscribeTier(tier.title, tier.price)}
              >
                Оформить уровень
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Program Section */}
      <div className="referral-program-section" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div className="section-title-row">
          <div className="section-title-wrap">
            <Share2 size={20} color="#a855f7" />
            <div>
              <h3 style={{ color: 'var(--text-primary, #ffffff)', fontSize: '1.2rem', fontWeight: 700 }}>
                Реферальная программа 2.0 (New Age Partners)
              </h3>
              <p style={{ color: 'var(--text-secondary, #a1a1aa)', fontSize: '0.88rem' }}>
                Приглашайте друзей и авторов. Получайте 10% от их оплат курсов и премиум-подписок пожизненно прямо на баланс кошелька.
              </p>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginTop: '16px',
          marginBottom: '18px'
        }}>
          <div style={{ background: 'var(--surface, #18181b)', border: '1px solid var(--border-color, #27272a)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #a1a1aa)' }}>Приглашено участников:</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>14 человек</div>
          </div>
          <div style={{ background: 'var(--surface, #18181b)', border: '1px solid var(--border-color, #27272a)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #a1a1aa)' }}>Заработано на рефералах:</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>+4 250 ₽</div>
          </div>
          <div style={{ background: 'var(--surface, #18181b)', border: '1px solid var(--border-color, #27272a)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #a1a1aa)' }}>Ваш партнерский уровень:</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c084fc' }}>Серебряный Партнёр (10%)</div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          background: 'var(--bg-primary, #09090b)',
          border: '1px solid var(--border-color, #27272a)',
          borderRadius: '10px',
          padding: '8px 12px'
        }}>
          <code style={{ flex: 1, fontSize: '0.88rem', color: '#38bdf8' }}>
            https://newage.network/join?ref=alex_guru
          </code>
          <button 
            type="button" 
            onClick={() => {
              navigator.clipboard?.writeText('https://newage.network/join?ref=alex_guru');
              alert('Партнёрская ссылка скопирована в буфер обмена!');
            }}
            style={{
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Copy size={14} /> Скопировать ссылку
          </button>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="transactions-history-section">
        <div className="section-title-row">
          <div className="section-title-wrap">
            <History size={20} color="#6366F1" />
            <div>
              <h3>История операций</h3>
              <p>Все транзакции: покупки, продажи на маркетплейсе, донаты и подписки</p>
            </div>
          </div>
        </div>

        <div className="transactions-table-card">
          <div className="transactions-list">
            {transactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="transaction-row">
                  <div className={`tx-icon-badge ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>

                  <div className="tx-details">
                    <strong>{tx.description}</strong>
                    <div className="tx-submeta">
                      <span>{tx.date}</span>
                      {tx.recipientOrSender && (
                        <>
                          <span className="dot-sep">•</span>
                          <span>{tx.recipientOrSender}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="tx-amount-col">
                    <span className={`amount-text ${isPositive ? 'green' : 'gray'}`}>
                      {isPositive ? `+${formatPrice(tx.amount)}` : `-${formatPrice(Math.abs(tx.amount))}`}
                    </span>
                    <span className="tx-status-badge completed">
                      <ShieldCheck size={11} /> Успешно
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Deposit */}
      {isDepositOpen && (
        <div className="wallet-modal-backdrop" onClick={() => setIsDepositOpen(false)}>
          <div className="wallet-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Пополнение баланса New Age</h3>
            <p>Деньги будут мгновенно зачислены на ваш внутренний счет кошелька</p>

            <form onSubmit={handleDepositSubmit} className="modal-form">
              <div className="form-group">
                <label>Сумма пополнения ({currencyConfig.symbol})</label>
                <div className="deposit-preset-row">
                  {['500', '1000', '2500', '5000'].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      className={`preset-btn ${depositAmount === preset ? 'active' : ''}`}
                      onClick={() => setDepositAmount(preset)}
                    >
                      {formatPrice(Number(preset))}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="100"
                  required
                />
              </div>

              <div className="form-group">
                <label>Способ оплаты</label>
                <div className="card-selector-box">
                  <CreditCard size={18} />
                  <input
                    type="text"
                    value={depositCard}
                    onChange={(e) => setDepositCard(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-buttons-row">
                <button type="button" className="btn-cancel" onClick={() => setIsDepositOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn-submit-action">
                  Пополнить на {Number(depositAmount || 0).toLocaleString()} ₽
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Donate */}
      {isDonateOpen && (
        <div className="wallet-modal-backdrop" onClick={() => setIsDonateOpen(false)}>
          <div className="wallet-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="donate-icon-title">
              <Heart size={24} color="#EF4444" />
              <h3>Отправить донат автору</h3>
            </div>
            <p>Прямая поддержка любимого создателя контента без скрытых комиссий</p>

            <form onSubmit={handleDonateSubmit} className="modal-form">
              <div className="form-group">
                <label>Получатель</label>
                <input
                  type="text"
                  value={donateAuthor}
                  onChange={(e) => setDonateAuthor(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Сумма доната (₽)</label>
                <div className="deposit-preset-row">
                  {['200', '500', '1000', '3000'].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      className={`preset-btn ${donateAmount === preset ? 'active' : ''}`}
                      onClick={() => setDonateAmount(preset)}
                    >
                      {preset} ₽
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={donateAmount}
                  onChange={(e) => setDonateAmount(e.target.value)}
                  min="50"
                  required
                />
              </div>

              <div className="form-group">
                <label>Сообщение автору (озвучивается на стриме или в профиле)</label>
                <textarea
                  rows={2}
                  value={donateMessage}
                  onChange={(e) => setDonateMessage(e.target.value)}
                  placeholder="Ваши слова поддержки..."
                />
              </div>

              <div className="modal-buttons-row">
                <button type="button" className="btn-cancel" onClick={() => setIsDonateOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn-submit-action donate-submit">
                  <Send size={15} /> Отправить {Number(donateAmount || 0).toLocaleString()} ₽
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

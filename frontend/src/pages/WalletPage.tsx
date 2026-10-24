import React, { useState, useEffect, useMemo } from 'react';
import {
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
  Copy,
  HeartHandshake,
  Headphones,
  Briefcase,
  Search,
  QrCode,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  type WalletTransaction
} from '../data/mock';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import './WalletPage.css';

// Модель платной услуги в каталоге цен
export interface CatalogServiceItem {
  id: string;
  category: 'subscriptions' | 'dating' | 'spiritual' | 'business';
  title: string;
  subtitle: string;
  description: string;
  price: number; // в рублях (базовая цена)
  oldPrice?: number;
  currency: string;
  period: string;
  badge?: string;
  badgeType?: 'hit' | 'discount' | 'status' | 'pro' | 'new';
  icon: string;
  popular?: boolean;
  perks: string[];
}

// 4 Ключевые флагманские услуги платформы New Age
const DEFAULT_SERVICES_CATALOG: CatalogServiceItem[] = [
  // 1. Премиум VIP
  {
    id: 'sub_premium_month',
    category: 'subscriptions',
    title: 'New Age Premium (1 месяц)',
    subtitle: 'Максимальный комфорт, статус и возможности',
    description: 'Золотой статус-бейдж в профиле и чатах, 0% комиссии на переводы и маркетплейс, 4K 60fps экспорт видео, закрытые конференции до 500 человек.',
    price: 399,
    oldPrice: 599,
    currency: 'RUB',
    period: 'в месяц',
    badge: 'ХИТ ПРОДАЖ',
    badgeType: 'hit',
    icon: 'Crown',
    popular: true,
    perks: [
      'Золотой бейдж верификации Premium в профиле и чатах',
      '0% комиссии на любые покупки и переводы внутри сети',
      'Экспорт видео в 4K 60fps без водяного знака',
      'Безлимитные свайпы и лайки в Знакомствах',
      'Доступ к закрытым конференциям и трансляциям'
    ]
  },

  // 2. Знакомства & Резонанс
  {
    id: 'dating_boost_7d',
    category: 'dating',
    title: 'Топ-Буст анкеты (7 дней)',
    subtitle: 'В 8 раз больше просмотров и совпадений',
    description: 'Ваша анкета закрепляется на 1-м месте в свайп-ленте и поиске по городу среди всех кандидатов на 7 дней.',
    price: 290,
    oldPrice: 490,
    currency: 'RUB',
    period: 'на 7 дней',
    badge: 'ТОП ВЫБОР',
    badgeType: 'hit',
    icon: 'HeartHandshake',
    popular: true,
    perks: [
      '1-е место в ленте свайпов по вашему городу',
      'В 8 раз больше просмотров и взаимных симпатий',
      'Неоновое сияние карточки в общем каталоге',
      'Уведомления о тех, кто открывал ваш профиль'
    ]
  },

  // 3. Духовные Практики & Ретриты
  {
    id: 'spiritual_freq_pro',
    category: 'spiritual',
    title: 'PRO Доступ: Частоты 432–963 Гц',
    subtitle: 'Безлимитная библиотека саундхилинга и медитаций',
    description: '120+ медитаций в lossless качестве без сжатия, сессии глубокой пранаямы, тибетские чаши и частоты Сольфеджио.',
    price: 590,
    currency: 'RUB',
    period: 'в месяц',
    badge: 'САУНДХИЛИНГ',
    badgeType: 'pro',
    icon: 'Headphones',
    perks: [
      'Полная коллекция частот Сольфеджио (432, 528, 963 Гц)',
      'Оффлайн-загрузка треков в мобильное приложение',
      'Дыхательные практики пранаямы с метрономом',
      'Регулярные еженедельные обновления библиотеки'
    ]
  },

  // 4. Бизнес & Маркетплейс
  {
    id: 'biz_account_pro',
    category: 'business',
    title: 'Бизнес-аккаунт PRO',
    subtitle: 'Фирменная витрина, CRM и эквайринг 0%',
    description: 'Комплексное решение для магазинов, мастеров и брендов. Прием оплат СБП и картами, CRM для ведения заказов, аналитика продаж.',
    price: 1290,
    oldPrice: 1990,
    currency: 'RUB',
    period: 'в месяц',
    badge: 'БИЗНЕС PRO',
    badgeType: 'hit',
    icon: 'Briefcase',
    popular: true,
    perks: [
      'Брендированная страница витрины и каталог товаров',
      'Прием платежей через СБП, карты и криптовалюту',
      'CRM-система учета заказов и остатков на складе',
      '0% эквайринга на первый месяц работы',
      'Интеграция доставки СДЭК и курьерских служб'
    ]
  }
];

// Категории каталога
const CATALOG_CATEGORIES = [
  { id: 'all', label: 'Все услуги' },
  { id: 'subscriptions', label: 'Премиум VIP', icon: Crown },
  { id: 'dating', label: 'Знакомства', icon: HeartHandshake },
  { id: 'spiritual', label: 'Практики & Звук', icon: Headphones },
  { id: 'business', label: 'Бизнес PRO', icon: Briefcase },
];

export const WalletPage: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const { formatPrice } = useCurrency();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<CatalogServiceItem[]>(DEFAULT_SERVICES_CATALOG);
  const [selectedAsset, setSelectedAsset] = useState<'RUB' | 'AGE' | 'USDT' | 'TON'>('RUB');

  // Каталог: категория и поиск
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Фильтр истории транзакций
  const [txFilter, setTxFilter] = useState<'all' | 'deposits' | 'purchases' | 'transfers'>('all');

  // Активные подписки и услуги
  const [activeServiceIds, setActiveServiceIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('newage_active_services');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return ['sub_premium_month']; // Демонстрационный доступ
  });

  // Модальные окна
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('1000');
  const [depositMethod, setDepositMethod] = useState<'sbp' | 'card' | 'crypto' | 'mir'>('sbp');

  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState('500');
  const [donateAuthor, setDonateAuthor] = useState('alex_dev');
  const [donateMessage, setDonateMessage] = useState('Благодарю за полезные практики и видеоуроки!');

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('1000');
  const [withdrawMethod, setWithdrawMethod] = useState<'sbp' | 'card'>('sbp');
  const [withdrawTarget, setWithdrawTarget] = useState('+7 (999) 000-00-00');

  // Модальное окно покупки услуги из каталога
  const [purchasingService, setPurchasingService] = useState<CatalogServiceItem | null>(null);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);

  // Загрузка данных кошелька из API
  const loadWalletData = () => {
    if (isAuthenticated) {
      api.wallet.balance().then(res => {
        const data = res?.data || res;
        if (data) {
          if (typeof data.balance === 'number') {
            setBalance(data.balance);
          }
          if (Array.isArray(data.transactions)) {
            setTransactions(data.transactions);
          }
          if (Array.isArray(data.services) && data.services.length > 0) {
            setServicesCatalog(data.services);
          }
        }
      }).catch(err => {
        console.warn('Wallet load warning:', err);
      });
    }
  };

  useEffect(() => {
    loadWalletData();
  }, [isAuthenticated]);

  // Расчет эквивалента баланса в выбранном активе
  const assetEquivalent = useMemo(() => {
    switch (selectedAsset) {
      case 'AGE':
        return `${(balance / 10).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} AGE`;
      case 'USDT':
        return `${(balance / 92.5).toFixed(2)} USDT`;
      case 'TON':
        return `${(balance / 550).toFixed(2)} TON`;
      default:
        return formatPrice(balance);
    }
  }, [balance, selectedAsset, formatPrice]);

  // Фильтрация каталога цен
  const filteredCatalog = useMemo(() => {
    return servicesCatalog.filter(item => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch = catalogSearch.trim() === '' || 
        item.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(catalogSearch.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [servicesCatalog, activeCategory, catalogSearch]);

  // Фильтрация транзакций
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (txFilter === 'deposits') return tx.amount > 0 && tx.type === 'deposit';
      if (txFilter === 'purchases') return tx.amount < 0 && (tx.type === 'purchase' || tx.type === 'subscription');
      if (txFilter === 'transfers') return tx.type === 'transfer' || tx.type === 'donation_sent';
      return true;
    });
  }, [transactions, txFilter]);

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 760, margin: '2rem auto', padding: '1rem' }}>
        <GuestLockPrompt
          featureName="Кошелёк и New Age Pay"
          title="Финансовый кошелёк привязан к личному профилю"
          description="Пополнение баланса, донаты авторам контента, покупка премиум-подписок и услуг из каталога цен доступны после авторизации."
          actionText="Создать аккаунт для доступа к кошельку"
        />
      </div>
    );
  }

  // Обработчик пополнения
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(depositAmount);
    if (!val || val <= 0) return;

    try {
      const res = await api.wallet.deposit(val, depositMethod);
      if (res?.data?.balance !== undefined) {
        setBalance(res.data.balance);
        if (res.data.transaction) {
          setTransactions([res.data.transaction, ...transactions]);
        }
      } else {
        setBalance(prev => prev + val);
        const newTx: WalletTransaction = {
          id: `tx-dep-${Date.now()}`,
          type: 'deposit',
          amount: val,
          description: `Пополнение баланса (${depositMethod.toUpperCase()})`,
          date: 'Сегодня, только что',
          status: 'completed',
          recipientOrSender: 'New Age Pay'
        };
        setTransactions([newTx, ...transactions]);
      }
      setIsDepositOpen(false);
      setPurchaseSuccessMessage(`Баланс успешно пополнен на ${formatPrice(val)}!`);
      setTimeout(() => setPurchaseSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Deposit error:', err);
      setBalance(prev => prev + val);
      setIsDepositOpen(false);
    }
  };

  // Обработчик доната
  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(donateAmount);
    if (!val || val <= 0) return;

    if (balance < val) {
      alert(`Недостаточно средств на балансе. Требуется ${formatPrice(val)}, на счету: ${formatPrice(balance)}.`);
      return;
    }

    try {
      const cleanUser = donateAuthor.replace(/^@/, '').trim();
      const res = await api.wallet.transfer(cleanUser, val, donateMessage, true);
      if (res?.data?.balance !== undefined) {
        setBalance(res.data.balance);
        if (res.data.transaction) {
          setTransactions([res.data.transaction, ...transactions]);
        }
      } else {
        setBalance(prev => prev - val);
        const newTx: WalletTransaction = {
          id: `tx-don-${Date.now()}`,
          type: 'donation_sent',
          amount: -val,
          description: `Донат автору: @${cleanUser}`,
          date: 'Сегодня, только что',
          status: 'completed',
          recipientOrSender: `@${cleanUser}`
        };
        setTransactions([newTx, ...transactions]);
      }
      setIsDonateOpen(false);
      setPurchaseSuccessMessage(`Вы успешно отправили донат ${formatPrice(val)} автору @${cleanUser}!`);
      setTimeout(() => setPurchaseSuccessMessage(null), 4500);
    } catch (err) {
      console.error('Donation error:', err);
    }
  };

  // Обработчик вывода
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(withdrawAmount);
    if (!val || val <= 0) return;
    if (balance < val) {
      alert('Недостаточно средств для вывода.');
      return;
    }

    setBalance(prev => prev - val);
    const newTx: WalletTransaction = {
      id: `tx-with-${Date.now()}`,
      type: 'withdrawal',
      amount: -val,
      description: `Вывод на ${withdrawMethod === 'sbp' ? 'СБП ' + withdrawTarget : 'карту ' + withdrawTarget}`,
      date: 'Сегодня, только что',
      status: 'completed',
      recipientOrSender: withdrawTarget
    };
    setTransactions([newTx, ...transactions]);
    setIsWithdrawOpen(false);
    setPurchaseSuccessMessage(`Заявка на вывод ${formatPrice(val)} принята в обработку банком!`);
    setTimeout(() => setPurchaseSuccessMessage(null), 4500);
  };

  // Обработчик покупки услуги из каталога
  const handleConfirmPurchase = async () => {
    if (!purchasingService) return;

    if (balance < purchasingService.price) {
      const needed = purchasingService.price - balance;
      setDepositAmount(String(Math.ceil(needed)));
      setPurchasingService(null);
      setIsDepositOpen(true);
      return;
    }

    try {
      const res = await api.wallet.pay(purchasingService.id, purchasingService.price, purchasingService.title);
      if (res?.data?.balance !== undefined) {
        setBalance(res.data.balance);
        if (res.data.transaction) {
          setTransactions([res.data.transaction, ...transactions]);
        }
      } else {
        setBalance(prev => prev - purchasingService.price);
        const newTx: WalletTransaction = {
          id: `tx-srv-${Date.now()}`,
          type: 'purchase',
          amount: -purchasingService.price,
          description: `Оплата услуги «${purchasingService.title}»`,
          date: 'Сегодня, только что',
          status: 'completed',
          recipientOrSender: 'Каталог цен New Age'
        };
        setTransactions([newTx, ...transactions]);
      }

      // Активируем услугу
      const nextActive = [...new Set([...activeServiceIds, purchasingService.id])];
      setActiveServiceIds(nextActive);
      localStorage.setItem('newage_active_services', JSON.stringify(nextActive));

      const title = purchasingService.title;
      setPurchasingService(null);
      setPurchaseSuccessMessage(`Услуга «${title}» успешно активирована!`);
      setTimeout(() => setPurchaseSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Service purchase error:', err);
    }
  };

  // Вспомогательная функция для иконки услуги
  const renderServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crown': return <Crown size={22} />;
      case 'HeartHandshake': return <HeartHandshake size={22} />;
      case 'Headphones': return <Headphones size={22} />;
      case 'Briefcase': return <Briefcase size={22} />;
      default: return <Sparkles size={22} />;
    }
  };

  return (
    <div className="wallet-page-modern">
      {/* Toast успешного действия */}
      {purchaseSuccessMessage && (
        <div className="wallet-toast-banner">
          <CheckCircle2 size={20} className="toast-icon" />
          <span>{purchaseSuccessMessage}</span>
        </div>
      )}

      {/* Верхний Header страницы кошелька */}
      <div className="wallet-top-header">
        <div className="wallet-top-title-wrap">
          <div className="wallet-top-badge">
            <Sparkles size={14} className="sparkle-gold" />
            <span>Цифровой финтех New Age Pay</span>
          </div>
          <h1 className="wallet-main-heading">Кошелёк & Каталог цен</h1>
          <p className="wallet-main-subtext">
            Единый платежный баланс экосистемы, моментальные переводы, донаты авторам и прейскурант всех услуг платформы
          </p>
        </div>

        {/* Переключатель отображаемого актива */}
        <div className="wallet-asset-switcher">
          <span className="switcher-label">Актив баланса:</span>
          <div className="asset-pills">
            {(['RUB', 'AGE', 'USDT', 'TON'] as const).map(asset => (
              <button
                key={asset}
                type="button"
                className={`asset-pill ${selectedAsset === asset ? 'active' : ''}`}
                onClick={() => setSelectedAsset(asset)}
              >
                {asset === 'RUB' && '🇷🇺 RUB'}
                {asset === 'AGE' && '✨ AGE'}
                {asset === 'USDT' && '₮ USDT'}
                {asset === 'TON' && '💎 TON'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Сетка Hero-карточек: Премиальная карта + Финансовые метрики */}
      <div className="wallet-hero-section">
        {/* Премиальная виртуальная карта New Age Pay */}
        <div className="wallet-virtual-card">
          <div className="card-ambient-glow" aria-hidden="true" />

          {/* Верхняя строка карты */}
          <div className="card-top-row">
            <div className="card-brand-badge">
              <div className="card-brand-chip" />
              <span className="card-brand-text">NEW AGE PAY</span>
            </div>
            <div className="card-contactless-wave" title="Бесконтактные защищенные платежи">
              <span className="wave wave-1" />
              <span className="wave wave-2" />
              <span className="wave wave-3" />
            </div>
          </div>

          {/* Центральный блок суммы */}
          <div className="card-balance-center">
            <span className="card-balance-label">Доступный баланс счета</span>
            <div className="card-balance-numbers">
              <h2 className="card-balance-val">{formatPrice(balance)}</h2>
              <div className="card-asset-equiv-badge">
                <span>≈ {assetEquivalent}</span>
              </div>
            </div>
          </div>

          {/* Нижняя строка карты */}
          <div className="card-bottom-row">
            <div className="card-holder-info">
              <span className="holder-label">ВЛАДЕЛЕЦ КАРТЫ</span>
              <span className="holder-name">@{currentUser?.username || 'claower'}</span>
            </div>
            <div className="card-number-box">
              <span className="number-label">НОМЕР СЧЕТА</span>
              <div className="number-row">
                <span className="number-code">•••• 8842</span>
                <button
                  type="button"
                  className="btn-copy-card-num"
                  title="Скопировать реквизиты счета"
                  onClick={() => {
                    navigator.clipboard?.writeText('NEWAGE-PAY-8842-RU');
                    alert('Номер кошелька скопирован!');
                  }}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Быстрые действия на карточке */}
          <div className="card-quick-actions">
            <button
              type="button"
              className="btn-card-act deposit"
              onClick={() => setIsDepositOpen(true)}
            >
              <Plus size={16} />
              <span>Пополнить</span>
            </button>
            <button
              type="button"
              className="btn-card-act transfer"
              onClick={() => setIsWithdrawOpen(true)}
            >
              <ArrowUpRight size={16} />
              <span>Вывести</span>
            </button>
            <button
              type="button"
              className="btn-card-act donate"
              onClick={() => setIsDonateOpen(true)}
            >
              <Heart size={16} />
              <span>Донат</span>
            </button>
            <a
              href="#pricing-catalog-section"
              className="btn-card-act catalog-jump"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('pricing-catalog-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Zap size={16} />
              <span>Каталог цен</span>
            </a>
          </div>
        </div>

        {/* 4 Финтех-виджета со статистикой */}
        <div className="wallet-stats-grid">
          <div className="wallet-stat-card">
            <div className="stat-icon-wrap violet">
              <Crown size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Текущий статус</span>
              <span className="stat-value highlight-gold">
                {activeServiceIds.includes('sub_premium_month') ? 'PREMIUM VIP' : 'Базовый'}
              </span>
              <span className="stat-sub">0% комиссии на маркетплейс</span>
            </div>
          </div>

          <div className="wallet-stat-card">
            <div className="stat-icon-wrap emerald">
              <ShieldCheck size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Защита сделок</span>
              <span className="stat-value text-emerald">100% Escrow</span>
              <span className="stat-sub">Безопасные расчеты в сети</span>
            </div>
          </div>

          <div className="wallet-stat-card">
            <div className="stat-icon-wrap amber">
              <Sparkles size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Бонусы New Age</span>
              <span className="stat-value text-amber">425 AGE</span>
              <span className="stat-sub">Кэшбэк за покупки и практики</span>
            </div>
          </div>

          <div className="wallet-stat-card">
            <div className="stat-icon-wrap blue">
              <Share2 size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Партнёрский доход</span>
              <span className="stat-value text-blue">+4 250 ₽</span>
              <span className="stat-sub">10% от оплат рефералов</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ГЛАВНАЯ СЕКЦИЯ: КАТАЛОГ ЦЕН И УСЛУГ ПЛАТФОРМЫ (4 ФЛАГМАНСКИЕ УСЛУГИ) */}
      {/* ========================================================================= */}
      <section id="pricing-catalog-section" className="pricing-catalog-section">
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="title-icon-badge">
              <Zap size={22} className="text-violet" />
            </div>
            <div>
              <h2 className="section-heading">Каталог цен и услуг платформы</h2>
              <p className="section-subtext">
                4 ключевые флагманские услуги New Age: Премиум-статус, Буст в знакомствах, Библиотека медитаций и Бизнес PRO
              </p>
            </div>
          </div>

          {/* Строка поиска по каталогу */}
          <div className="catalog-search-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              placeholder="Поиск по услугам (буст, саундхилинг, CRM, VIP)..."
              className="catalog-search-input"
            />
            {catalogSearch && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setCatalogSearch('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Категории каталога */}
        <div className="catalog-categories-bar">
          {CATALOG_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = cat.id === 'all'
              ? servicesCatalog.length
              : servicesCatalog.filter(s => s.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                className={`category-tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {Icon && <Icon size={15} />}
                <span>{cat.label}</span>
                <span className="tab-count-tag">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Сетка карточек каталога (4 карточки) */}
        <div className="catalog-cards-grid four-cards-layout">
          {filteredCatalog.map(item => {
            const isPurchased = activeServiceIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`service-pricing-card ${item.popular ? 'is-popular-card' : ''} ${isPurchased ? 'is-purchased-card' : ''}`}
              >
                {/* Бейдж */}
                {item.badge && (
                  <div className={`service-card-badge badge-${item.badgeType || 'hit'}`}>
                    <Sparkles size={12} />
                    <span>{item.badge}</span>
                  </div>
                )}

                {/* Заголовок и иконка */}
                <div className="service-card-top">
                  <div className="service-icon-box">
                    {renderServiceIcon(item.icon)}
                  </div>
                  <div className="service-card-titles">
                    <h3 className="service-item-title">{item.title}</h3>
                    <span className="service-item-sub">{item.subtitle}</span>
                  </div>
                </div>

                <p className="service-item-desc">{item.description}</p>

                {/* Список преимуществ */}
                <ul className="service-perks-list">
                  {item.perks.map((perk, idx) => (
                    <li key={idx} className="perk-item">
                      <Check size={14} className="perk-check-icon" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                {/* Нижний блок с ценой и кнопкой покупки */}
                <div className="service-card-footer">
                  <div className="service-price-block">
                    {item.oldPrice && (
                      <span className="service-old-price">{formatPrice(item.oldPrice)}</span>
                    )}
                    <div className="service-current-price-row">
                      <strong className="service-price-val">{formatPrice(item.price)}</strong>
                      <span className="service-period-val">/ {item.period}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn-buy-service ${isPurchased ? 'btn-already-purchased' : ''}`}
                    onClick={() => {
                      if (!isPurchased) {
                        setPurchasingService(item);
                      }
                    }}
                    disabled={isPurchased}
                  >
                    {isPurchased ? (
                      <>
                        <Check size={15} />
                        <span>Подключено</span>
                      </>
                    ) : (
                      <>
                        <Zap size={15} />
                        <span>Подключить</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* СЕКЦИЯ: РЕФЕРАЛЬНАЯ СИСТЕМА 2.0 */}
      {/* ========================================================================= */}
      <section className="wallet-referral-banner">
        <div className="referral-banner-glow" aria-hidden="true" />
        <div className="referral-content-wrap">
          <div className="referral-title-col">
            <div className="referral-badge">
              <Share2 size={14} />
              <span>Партнерская программа 2.0</span>
            </div>
            <h3 className="referral-heading">Зарабатывайте 10% от всех оплат друзей</h3>
            <p className="referral-desc">
              Делитесь реферальной ссылкой. Вы получаете 10% кэшбэка от всех подписок, курсов и продвижения ваших приглашенных участников прямо на баланс кошелька.
            </p>
          </div>

          <div className="referral-link-box">
            <span className="link-label">Ваша персональная ссылка:</span>
            <div className="link-input-group">
              <code className="referral-code-text">https://newage.network/join?ref={currentUser?.username || 'claower'}</code>
              <button
                type="button"
                className="btn-copy-ref-link"
                onClick={() => {
                  navigator.clipboard?.writeText(`https://newage.network/join?ref=${currentUser?.username || 'claower'}`);
                  alert('Партнерская ссылка скопирована в буфер обмена!');
                }}
              >
                <Copy size={14} />
                <span>Скопировать</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* СЕКЦИЯ: ИСТОРИЯ ОПЕРАЦИЙ */}
      {/* ========================================================================= */}
      <section className="wallet-transactions-section">
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="title-icon-badge">
              <History size={20} className="text-violet" />
            </div>
            <div>
              <h2 className="section-heading">История финансовых операций</h2>
              <p className="section-subtext">Все транзакции: пополнения баланса, покупка услуг, донаты и вывод средств</p>
            </div>
          </div>

          {/* Фильтр операций */}
          <div className="tx-filter-pills">
            <button
              type="button"
              className={`tx-filter-pill ${txFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTxFilter('all')}
            >
              Все операции
            </button>
            <button
              type="button"
              className={`tx-filter-pill ${txFilter === 'deposits' ? 'active' : ''}`}
              onClick={() => setTxFilter('deposits')}
            >
              Пополнения
            </button>
            <button
              type="button"
              className={`tx-filter-pill ${txFilter === 'purchases' ? 'active' : ''}`}
              onClick={() => setTxFilter('purchases')}
            >
              Оплата услуг
            </button>
            <button
              type="button"
              className={`tx-filter-pill ${txFilter === 'transfers' ? 'active' : ''}`}
              onClick={() => setTxFilter('transfers')}
            >
              Донаты
            </button>
          </div>
        </div>

        <div className="transactions-card-table">
          {filteredTransactions.length === 0 ? (
            <div className="transactions-empty-state">
              <History size={36} className="empty-icon" />
              <h4>В этой категории пока нет операций</h4>
              <p>Пополните баланс или выберите услугу из каталога цен выше</p>
            </div>
          ) : (
            <div className="transactions-list-rows">
              {filteredTransactions.map(tx => {
                const isPositive = tx.amount > 0;
                return (
                  <div key={tx.id} className="transaction-item-row">
                    <div className={`tx-icon-container ${isPositive ? 'is-inflow' : 'is-outflow'}`}>
                      {isPositive ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>

                    <div className="tx-info-block">
                      <span className="tx-title-text">{tx.description}</span>
                      <div className="tx-meta-row">
                        <span className="tx-date-str">{tx.date}</span>
                        {tx.recipientOrSender && (
                          <>
                            <span className="tx-dot-sep">•</span>
                            <span className="tx-party-str">{tx.recipientOrSender}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="tx-amount-block">
                      <span className={`tx-amount-sum ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? `+${formatPrice(tx.amount)}` : `-${formatPrice(Math.abs(tx.amount))}`}
                      </span>
                      <span className="tx-status-pill completed">
                        <ShieldCheck size={11} /> Успешно
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* МОДАЛЬНЫЕ ОКНА */}
      {/* ========================================================================= */}

      {/* 1. Модальное окно пополнения баланса */}
      {isDepositOpen && (
        <div className="wallet-modal-overlay" onClick={() => setIsDepositOpen(false)}>
          <div className="wallet-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="modal-title-wrap">
                <CreditCard size={20} className="text-violet" />
                <h3>Пополнение баланса New Age</h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsDepositOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <p className="modal-subtext">Средства мгновенно зачисляются на ваш счет без комиссии</p>

            <form onSubmit={handleDepositSubmit} className="modal-inner-form">
              {/* Выбор способа оплаты */}
              <div className="form-group-block">
                <label className="group-label">Способ пополнения:</label>
                <div className="deposit-methods-grid">
                  <button
                    type="button"
                    className={`method-select-btn ${depositMethod === 'sbp' ? 'active' : ''}`}
                    onClick={() => setDepositMethod('sbp')}
                  >
                    <QrCode size={18} />
                    <span>СБП (0% комиссия)</span>
                  </button>
                  <button
                    type="button"
                    className={`method-select-btn ${depositMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setDepositMethod('card')}
                  >
                    <CreditCard size={18} />
                    <span>Банковская карта</span>
                  </button>
                  <button
                    type="button"
                    className={`method-select-btn ${depositMethod === 'crypto' ? 'active' : ''}`}
                    onClick={() => setDepositMethod('crypto')}
                  >
                    <Sparkles size={18} />
                    <span>USDT / TON Crypto</span>
                  </button>
                  <button
                    type="button"
                    className={`method-select-btn ${depositMethod === 'mir' ? 'active' : ''}`}
                    onClick={() => setDepositMethod('mir')}
                  >
                    <Zap size={18} />
                    <span>Tinkoff / SberPay</span>
                  </button>
                </div>
              </div>

              {/* Быстрые пресеты сумм */}
              <div className="form-group-block">
                <label className="group-label">Сумма пополнения (₽):</label>
                <div className="presets-row">
                  {['500', '1000', '2500', '5000', '10000'].map(preset => (
                    <button
                      type="button"
                      key={preset}
                      className={`preset-chip ${depositAmount === preset ? 'active' : ''}`}
                      onClick={() => setDepositAmount(preset)}
                    >
                      {formatPrice(Number(preset))}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  min="100"
                  required
                  className="modal-number-input"
                  placeholder="Введите произвольную сумму"
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsDepositOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-modal-submit">
                  Пополнить на {formatPrice(Number(depositAmount || 0))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Модальное окно вывода средств */}
      {isWithdrawOpen && (
        <div className="wallet-modal-overlay" onClick={() => setIsWithdrawOpen(false)}>
          <div className="wallet-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="modal-title-wrap">
                <ArrowUpRight size={20} className="text-violet" />
                <h3>Вывод средств с баланса</h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsWithdrawOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <p className="modal-subtext">Вывод на карты РФ и через Систему быстрых платежей (СБП)</p>

            <form onSubmit={handleWithdrawSubmit} className="modal-inner-form">
              <div className="form-group-block">
                <label className="group-label">Куда перевести:</label>
                <div className="deposit-methods-grid">
                  <button
                    type="button"
                    className={`method-select-btn ${withdrawMethod === 'sbp' ? 'active' : ''}`}
                    onClick={() => {
                      setWithdrawMethod('sbp');
                      setWithdrawTarget('+7 (999) 000-00-00');
                    }}
                  >
                    <QrCode size={18} />
                    <span>По номеру телефона (СБП)</span>
                  </button>
                  <button
                    type="button"
                    className={`method-select-btn ${withdrawMethod === 'card' ? 'active' : ''}`}
                    onClick={() => {
                      setWithdrawMethod('card');
                      setWithdrawTarget('2200 •••• •••• 1234');
                    }}
                  >
                    <CreditCard size={18} />
                    <span>На банковскую карту</span>
                  </button>
                </div>
              </div>

              <div className="form-group-block">
                <label className="group-label">
                  {withdrawMethod === 'sbp' ? 'Номер телефона (СБП):' : 'Номер банковской карты:'}
                </label>
                <input
                  type="text"
                  value={withdrawTarget}
                  onChange={e => setWithdrawTarget(e.target.value)}
                  required
                  className="modal-number-input"
                />
              </div>

              <div className="form-group-block">
                <div className="balance-hint-row">
                  <label className="group-label">Сумма вывода (₽):</label>
                  <span className="balance-hint">Доступно: {formatPrice(balance)}</span>
                </div>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  min="100"
                  max={balance}
                  required
                  className="modal-number-input"
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsWithdrawOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={balance < Number(withdrawAmount)}
                >
                  Вывести {formatPrice(Number(withdrawAmount || 0))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Модальное окно доната автору */}
      {isDonateOpen && (
        <div className="wallet-modal-overlay" onClick={() => setIsDonateOpen(false)}>
          <div className="wallet-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="modal-title-wrap">
                <Heart size={20} color="#EF4444" />
                <h3>Отправить донат автору</h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsDonateOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <p className="modal-subtext">Прямая финансовая благодарность автору контента без комиссии</p>

            <form onSubmit={handleDonateSubmit} className="modal-inner-form">
              <div className="form-group-block">
                <label className="group-label">Юзернейм автора (@username):</label>
                <input
                  type="text"
                  value={donateAuthor}
                  onChange={e => setDonateAuthor(e.target.value)}
                  placeholder="alex_guru"
                  required
                  className="modal-number-input"
                />
              </div>

              <div className="form-group-block">
                <label className="group-label">Сумма доната (₽):</label>
                <div className="presets-row">
                  {['200', '500', '1000', '3000'].map(preset => (
                    <button
                      type="button"
                      key={preset}
                      className={`preset-chip ${donateAmount === preset ? 'active' : ''}`}
                      onClick={() => setDonateAmount(preset)}
                    >
                      {formatPrice(Number(preset))}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={donateAmount}
                  onChange={e => setDonateAmount(e.target.value)}
                  min="50"
                  required
                  className="modal-number-input"
                />
              </div>

              <div className="form-group-block">
                <label className="group-label">Тёплое сообщение или пожелание:</label>
                <textarea
                  rows={2}
                  value={donateMessage}
                  onChange={e => setDonateMessage(e.target.value)}
                  placeholder="Спасибо за ваше вдохновение..."
                  className="modal-textarea"
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsDonateOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-modal-submit donate-btn">
                  <Send size={15} />
                  <span>Отправить {formatPrice(Number(donateAmount || 0))}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Модальное окно подтверждения покупки услуги из каталога */}
      {purchasingService && (
        <div className="wallet-modal-overlay" onClick={() => setPurchasingService(null)}>
          <div className="wallet-modal-card purchase-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="modal-title-wrap">
                <Zap size={22} className="text-violet" />
                <h3>Подключение услуги</h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setPurchasingService(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="purchase-service-summary">
              <div className="summary-icon">
                {renderServiceIcon(purchasingService.icon)}
              </div>
              <div className="summary-texts">
                <h4>{purchasingService.title}</h4>
                <p>{purchasingService.subtitle}</p>
              </div>
            </div>

            <div className="purchase-financials-box">
              <div className="fin-row">
                <span>Стоимость услуги:</span>
                <strong>{formatPrice(purchasingService.price)} / {purchasingService.period}</strong>
              </div>
              <div className="fin-row">
                <span>Ваш текущий баланс:</span>
                <span className={balance >= purchasingService.price ? 'text-emerald' : 'text-rose'}>
                  {formatPrice(balance)}
                </span>
              </div>
              <div className="fin-row total-row">
                <span>Остаток после оплаты:</span>
                <strong>
                  {balance >= purchasingService.price
                    ? formatPrice(balance - purchasingService.price)
                    : 'Недостаточно средств'}
                </strong>
              </div>
            </div>

            {balance < purchasingService.price && (
              <div className="insufficient-funds-alert">
                <span>Для оплаты не хватает {formatPrice(purchasingService.price - balance)}. Вы можете быстро пополнить счет.</span>
              </div>
            )}

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setPurchasingService(null)}
              >
                Отмена
              </button>

              {balance >= purchasingService.price ? (
                <button
                  type="button"
                  className="btn-modal-submit"
                  onClick={handleConfirmPurchase}
                >
                  <Check size={16} />
                  <span>Оплатить {formatPrice(purchasingService.price)}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-modal-submit"
                  onClick={handleConfirmPurchase}
                >
                  <Plus size={16} />
                  <span>Пополнить на {formatPrice(purchasingService.price - balance)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

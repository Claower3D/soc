import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Users, Film, Wallet, ShieldAlert, 
  ArrowRight, Sparkles, TrendingUp, Compass, Flower2
} from 'lucide-react';
import { currentUser } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import './ServicesPage.css';

interface ServiceItem {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: typeof ShoppingBag;
  route: string;
  badge?: string;
  colorGradient: string;
  stats: string;
}

const SERVICES: ServiceItem[] = [
  {
    id: 'spiritual',
    title: 'Самопознание и Духовные Практики',
    category: 'Осознанность и Здоровье',
    description: 'Медитации с частотами 432 Гц, авторские комплексы йоги, трансформирующие аффирмации, пранаяма и саундхилинг.',
    icon: Flower2,
    route: '/spiritual',
    badge: 'Новинка',
    colorGradient: 'linear-gradient(135deg, #10B981, #6366F1)',
    stats: '6 направлений практик'
  },
  {
    id: 'marketplace',
    title: 'Маркетплейс',
    category: 'Торговля и товары',
    description: 'Внутренний магазин товаров, авторского мерча и хендмейда с защитой сделок и оплатой New Age Pay.',
    icon: ShoppingBag,
    route: '/marketplace',
    badge: 'Популярно',
    colorGradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    stats: '2 400+ товаров'
  },
  {
    id: 'communities',
    title: 'Сообщества и клубы',
    category: 'Общение и группы',
    description: 'Тематические группы по интересам, встречи, приватные клубы и локальные объединения.',
    icon: Users,
    route: '/communities',
    badge: 'Новинка',
    colorGradient: 'linear-gradient(135deg, #EC4899, #F43F5E)',
    stats: '120+ сообществ'
  },
  {
    id: 'editor',
    title: 'Видеостудия',
    category: 'Создание контента',
    description: 'Встроенный монтажный стол: форматы 9:16/16:9, таймлайн, обрезка, цветовые фильтры и титры.',
    icon: Film,
    route: '/editor',
    badge: 'PRO Studio',
    colorGradient: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
    stats: 'Экспорт в 4K/60fps'
  },
  {
    id: 'wallet',
    title: 'Кошелёк New Age Pay',
    category: 'Финансы и донаты',
    description: 'Управление балансом, прямые донаты авторам, подписки Premium и уровни спонсорства.',
    icon: Wallet,
    route: '/wallet',
    colorGradient: 'linear-gradient(135deg, #10B981, #059669)',
    stats: 'Без комиссии внутри сети'
  },
  {
    id: 'admin',
    title: 'Админ-панель',
    category: 'Управление и модерация',
    description: 'Аналитика аудитории, очередь жалоб на контент, управление верификацией и безопасность.',
    icon: ShieldAlert,
    route: '/admin',
    badge: 'Staff Only',
    colorGradient: 'linear-gradient(135deg, #EF4444, #B91C1C)',
    stats: currentUser.role === 'admin' ? 'Доступ разрешен' : 'Ограниченный доступ'
  }
];

export function ServicesPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="services-page">
        <div className="messenger-guest-lock-container">
          <GuestLockPrompt
            featureName="Сервисы экосистемы"
            title="Сервисы New Age доступны после регистрации"
            description="Маркетплейс, тематические сообщества, профессиональная видеостудия и внутренний кошелёк New Age Pay доступны зарегистрированным участникам."
            actionText="Войти или зарегистрироваться"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="services-page">
      {/* Header Banner */}
      <div className="services-hero">
        <div className="services-hero-content">
          <div className="services-badge-pill">
            <Sparkles size={14} />
            <span>ЭКОСИСТЕМА NEW AGE</span>
          </div>
          <h1 className="services-title">Сервисы и Инструменты</h1>
          <p className="services-subtitle">
            Единое пространство для покупок, объединения в клубы по интересам, профессионального монтажа видео и монетизации вашего творчества.
          </p>
        </div>
        <div className="services-hero-glow" />
      </div>

      {/* Quick Category Bar */}
      <div className="services-meta-bar">
        <div className="meta-item">
          <TrendingUp size={18} className="meta-icon" />
          <span><b>5</b> сервисов экосистемы</span>
        </div>
        <div className="meta-item">
          <Compass size={18} className="meta-icon" />
          <span>Быстрый переход в один клик</span>
        </div>
      </div>

      {/* Services Grid */}
      <div className="services-grid">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <div 
              key={service.id} 
              className="service-card"
              onClick={() => navigate(service.route)}
            >
              <div className="service-card-top">
                <div 
                  className="service-icon-box"
                  style={{ background: service.colorGradient }}
                >
                  <Icon size={26} color="#FFFFFF" />
                </div>
                {service.badge && (
                  <span className={`service-badge ${service.id === 'admin' ? 'admin-badge' : ''}`}>
                    {service.badge}
                  </span>
                )}
              </div>

              <div className="service-card-body">
                <span className="service-category">{service.category}</span>
                <h2 className="service-name">{service.title}</h2>
                <p className="service-desc">{service.description}</p>
              </div>

              <div className="service-card-footer">
                <span className="service-stats">{service.stats}</span>
                <div className="service-action-btn">
                  <span>Открыть</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

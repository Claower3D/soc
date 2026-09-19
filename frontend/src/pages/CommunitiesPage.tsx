import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  CheckCircle2,
  Lock,
  Globe,
  Sparkles,
  Calendar,
  Filter
} from 'lucide-react';
import { type Community } from '../data/mock';
import { api } from '../api';
import { CreateCommunityModal } from '../components/CreateCommunityModal';
import { useAuth } from '../context/AuthContext';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import './CommunitiesPage.css';

const CATEGORIES = [
  'Все направления',
  'IT & Технологии',
  'Дизайн & Арт',
  'Бизнес & Стартапы',
  'Мировоззрение & Философия',
  'Спорт & Здоровье',
  'Наука & Образование',
  'Локальный клуб'
];

export const CommunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все направления');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    api.communities.list().then(data => {
      setCommunities(data);
    }).catch(err => {
      console.warn('Failed to load communities:', err);
    });
  }, []);

  const handleToggleJoin = (e: React.MouseEvent, communityId: string) => {
    e.stopPropagation();
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id === communityId) {
          const joined = !c.isJoined;
          return {
            ...c,
            isJoined: joined,
            membersCount: joined ? c.membersCount + 1 : c.membersCount - 1
          };
        }
        return c;
      })
    );
  };

  const handleCreateCommunity = (newCommunity: Community) => {
    setCommunities([newCommunity, ...communities]);
  };

  const filteredCommunities = communities.filter((comm) => {
    const matchesSearch =
      comm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.handle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'Все направления' || comm.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (!isAuthenticated) {
    return (
      <div className="communities-page">
        <div className="messenger-guest-lock-container">
          <GuestLockPrompt
            featureName="Сообщества и клубы"
            title="Сообщества доступны после регистрации"
            description="Вступайте в тематические клубы по интересам, участвуйте в обсуждениях и создавайте свои собственные сообщества после регистрации в New Age."
            actionText="Войти или зарегистрироваться"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="communities-page">
      {/* Hero Header */}
      <div className="communities-hero-banner">
        <div className="banner-badge">
          <Sparkles size={16} /> Сообщества и Клубы New Age
        </div>
        <h1>Находите единомышленников и создавайте свои группы</h1>
        <p>
          Тематические пространства, открытые диалоги, межконфессиональные встречи и клубы по интересам с единым календарем событий и групповыми чатами.
        </p>

        <div className="banner-actions">
          <button
            className="btn-create-community"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={18} /> Создать сообщество
          </button>
        </div>
      </div>

      {/* Controls: Search & Categories */}
      <div className="communities-controls">
        <div className="search-bar-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Поиск сообществ по названию, тематике или тегу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="categories-pills-row">
          <div className="category-scroll-container">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Communities Grid */}
      <div className="communities-grid">
        {filteredCommunities.map((comm) => (
          <div
            key={comm.id}
            className="community-card"
            onClick={() => navigate(`/community/${comm.id}`)}
          >
            <div
              className="card-cover-bg"
              style={{ backgroundImage: `url(${comm.cover})` }}
            >
              <div className="card-top-tags">
                <span className="category-chip">{comm.category}</span>
                {comm.isPrivate ? (
                  <span className="privacy-chip private">
                    <Lock size={12} /> Закрытое
                  </span>
                ) : (
                  <span className="privacy-chip public">
                    <Globe size={12} /> Открытое
                  </span>
                )}
              </div>
            </div>

            <div className="card-body">
              <div className="avatar-and-names">
                <img
                  src={comm.avatar}
                  alt={comm.name}
                  className="card-avatar"
                />
                <div className="names-text">
                  <div className="name-row">
                    <h3>{comm.name}</h3>
                    {comm.verified && (
                      <CheckCircle2 size={16} className="verified-icon" />
                    )}
                  </div>
                  <span className="card-handle">@{comm.handle}</span>
                </div>
              </div>

              {comm.beliefCategory && (
                <div className="belief-tag-row">
                  <span className="belief-tag">🕊️ {comm.beliefCategory}</span>
                </div>
              )}

              <p className="card-description">{comm.description}</p>

              {comm.events && comm.events.length > 0 && (
                <div className="card-event-badge">
                  <Calendar size={13} />
                  <span>Ближайшая встреча: {comm.events[0].date}</span>
                </div>
              )}

              <div className="card-footer-row">
                <div className="members-indicator">
                  <Users size={15} />
                  <span>{comm.membersCount.toLocaleString()} уч.</span>
                </div>

                <button
                  className={`btn-join-card ${comm.isJoined ? 'joined' : ''}`}
                  onClick={(e) => handleToggleJoin(e, comm.id)}
                >
                  {comm.isJoined ? 'Вы состоите' : '+ Вступить'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCommunities.length === 0 && (
        <div className="empty-communities-box">
          <Filter size={40} color="#94A3B8" />
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить поисковый запрос или выберите другую категорию</p>
          <button
            className="btn-reset-filters"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Все направления');
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      )}

      {/* Create Modal */}
      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCommunity={handleCreateCommunity}
      />
    </div>
  );
};

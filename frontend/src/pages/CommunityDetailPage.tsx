import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Lock,
  Globe,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  Share2,
  Heart,
  Send,
  Shield,
  Award,
  ChevronLeft
} from 'lucide-react';
import { initialCommunities, currentUser, type Community, type CommunityEvent } from '../data/mock';
import './CommunityDetailPage.css';

export const CommunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [community] = useState<Community | undefined>(() =>
    initialCommunities.find((c) => c.id === id) || initialCommunities[0]
  );

  const [activeTab, setActiveTab] = useState<'feed' | 'events' | 'members' | 'rules'>('feed');
  const [isJoined, setIsJoined] = useState<boolean>(!!community?.isJoined);
  const [membersCount, setMembersCount] = useState<number>(community?.membersCount || 0);

  // New post in community feed
  const [newPostText, setNewPostText] = useState('');
  const [posts, setPosts] = useState([
    {
      id: 'cp-1',
      author: community?.creator || currentUser,
      time: '2 часа назад',
      text: `Добро пожаловать в сообщество «${community?.name}»! Здесь мы делимся практическими инсайтами, проводим живые сессии и открытые дискуссии.`,
      likes: 42,
      isLiked: false,
      commentsCount: 9
    },
    {
      id: 'cp-2',
      author: currentUser,
      time: 'Вчера, 18:40',
      text: 'Готовим повестку для ближайшего мероприятия. Напишите в комментариях, какие темы для вас наиболее актуальны в этом месяце?',
      likes: 28,
      isLiked: true,
      commentsCount: 14
    }
  ]);

  const [events, setEvents] = useState<CommunityEvent[]>(community?.events || []);

  if (!community) {
    return (
      <div className="community-not-found">
        <h2>Сообщество не найдено</h2>
        <Link to="/communities" className="btn-back">Вернуться к сообществам</Link>
      </div>
    );
  }

  const handleToggleJoin = () => {
    if (isJoined) {
      setIsJoined(false);
      setMembersCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsJoined(true);
      setMembersCount((prev) => prev + 1);
    }
  };

  const handleToggleAttend = (eventId: string) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === eventId) {
          const attending = !ev.isAttending;
          return {
            ...ev,
            isAttending: attending,
            attendeesCount: attending ? ev.attendeesCount + 1 : ev.attendeesCount - 1
          };
        }
        return ev;
      })
    );
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost = {
      id: `cp-${Date.now()}`,
      author: currentUser,
      time: 'Только что',
      text: newPostText.trim(),
      likes: 1,
      isLiked: true,
      commentsCount: 0
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
  };

  const handleOpenGroupChat = () => {
    navigate('/messenger');
  };

  return (
    <div className="community-detail-page">
      <button className="back-nav-btn" onClick={() => navigate('/communities')}>
        <ChevronLeft size={18} /> Все сообщества
      </button>

      {/* Header Banner & Profile */}
      <div className="community-hero-card">
        <div
          className="community-cover"
          style={{ backgroundImage: `url(${community.cover})` }}
        />

        <div className="community-info-row">
          <div className="avatar-and-titles">
            <img
              src={community.avatar}
              alt={community.name}
              className="community-avatar-large"
            />
            <div className="titles-block">
              <div className="name-and-badges">
                <h1>{community.name}</h1>
                {community.verified && (
                  <CheckCircle2 size={20} className="verified-icon" />
                )}
                {community.isPrivate ? (
                  <span className="privacy-badge private">
                    <Lock size={13} /> Закрытый клуб
                  </span>
                ) : (
                  <span className="privacy-badge public">
                    <Globe size={13} /> Открытое
                  </span>
                )}
              </div>
              <div className="meta-subline">
                <span className="handle">@{community.handle}</span>
                <span className="separator">•</span>
                <span className="category-pill">{community.category}</span>
                {community.beliefCategory && (
                  <>
                    <span className="separator">•</span>
                    <span className="belief-pill">🕊️ {community.beliefCategory}</span>
                  </>
                )}
                <span className="separator">•</span>
                <span className="members-count">
                  <Users size={14} /> {membersCount.toLocaleString()} участников
                </span>
              </div>
            </div>
          </div>

          <div className="community-action-buttons">
            <button
              className={`btn-join-main ${isJoined ? 'joined' : ''}`}
              onClick={handleToggleJoin}
            >
              {isJoined ? 'Вы состоите' : '+ Вступить'}
            </button>
            <button
              className="btn-chat-group"
              onClick={handleOpenGroupChat}
              title="Открыть групповой чат"
            >
              <MessageCircle size={18} /> Чат сообщества
            </button>
            <button
              className="btn-share-icon"
              title="Поделиться"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Ссылка на сообщество скопирована в буфер обмена!');
                }
              }}
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        <p className="community-about-text">{community.description}</p>

        {/* Tab Navigation */}
        <div className="community-tabs-bar">
          <button
            className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            Лента и посты
          </button>
          <button
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Мероприятия ({events.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Участники
          </button>
          <button
            className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            Правила ({community.rules.length})
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="community-tab-content-area">
        {activeTab === 'feed' && (
          <div className="community-feed-layout">
            <div className="feed-posts-column">
              {/* Create Post Box */}
              <form onSubmit={handleCreatePost} className="create-community-post-box">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="post-user-avatar"
                />
                <div className="post-input-wrap">
                  <textarea
                    rows={2}
                    placeholder={`Напишите что-нибудь для участников «${community.name}»...`}
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                  />
                  <div className="post-input-actions">
                    <button type="submit" className="post-submit-btn" disabled={!newPostText.trim()}>
                      <Send size={15} /> Опубликовать
                    </button>
                  </div>
                </div>
              </form>

              {/* Feed Posts */}
              <div className="community-posts-list">
                {posts.map((post) => (
                  <div key={post.id} className="community-post-card">
                    <div className="post-header">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="post-author-avatar"
                      />
                      <div className="post-author-info">
                        <div className="author-name-line">
                          <strong>{post.author.name}</strong>
                          {post.author.id === community.creator.id && (
                            <span className="creator-role-tag">Основатель</span>
                          )}
                        </div>
                        <span className="post-time">{post.time}</span>
                      </div>
                    </div>

                    <div className="post-body-text">{post.text}</div>

                    <div className="post-footer-actions">
                      <button
                        className={`action-btn ${post.isLiked ? 'liked' : ''}`}
                        onClick={() => {
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === post.id
                                ? {
                                    ...p,
                                    isLiked: !p.isLiked,
                                    likes: p.isLiked ? p.likes - 1 : p.likes + 1
                                  }
                                : p
                            )
                          );
                        }}
                      >
                        <Heart
                          size={18}
                          fill={post.isLiked ? '#EF4444' : 'none'}
                          color={post.isLiked ? '#EF4444' : 'currentColor'}
                        />
                        <span>{post.likes}</span>
                      </button>

                      <button className="action-btn">
                        <MessageCircle size={18} />
                        <span>{post.commentsCount}</span>
                      </button>

                      <button className="action-btn">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar widgets */}
            <div className="community-side-column">
              {/* Creator Widget */}
              <div className="side-widget creator-widget">
                <h4>Создатель сообщества</h4>
                <div className="creator-row">
                  <img
                    src={community.creator.avatar}
                    alt={community.creator.name}
                    className="creator-avatar"
                  />
                  <div>
                    <strong>{community.creator.name}</strong>
                    <span>@{community.creator.username}</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Event preview */}
              {events.length > 0 && (
                <div className="side-widget event-mini-widget">
                  <h4>Ближайшая встреча</h4>
                  <div className="event-mini-card">
                    <h5>{events[0].title}</h5>
                    <p className="event-date">
                      <Calendar size={14} /> {events[0].date}, {events[0].time}
                    </p>
                    <button
                      className={`btn-attend-mini ${events[0].isAttending ? 'attending' : ''}`}
                      onClick={() => handleToggleAttend(events[0].id)}
                    >
                      {events[0].isAttending ? '✓ Вы идёте' : 'Пойду на встречу'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="community-events-tab">
            <div className="events-header-bar">
              <div>
                <h3>Мероприятия и круглые столы</h3>
                <p>Онлайн-конференции New Age и живые встречи участников</p>
              </div>
            </div>

            {events.length === 0 ? (
              <div className="empty-events-box">
                <Calendar size={42} color="#94A3B8" />
                <p>Пока нет запланированных мероприятий</p>
              </div>
            ) : (
              <div className="events-grid">
                {events.map((ev) => (
                  <div key={ev.id} className="community-event-card">
                    <div className="event-top-tag">
                      {ev.isOnline ? '🌐 Онлайн в New Age' : '📍 Офлайн встреча'}
                    </div>
                    <h4>{ev.title}</h4>
                    <div className="event-meta-lines">
                      <div className="meta-item">
                        <Calendar size={16} />
                        <span>{ev.date}</span>
                      </div>
                      <div className="meta-item">
                        <Clock size={16} />
                        <span>{ev.time}</span>
                      </div>
                      <div className="meta-item">
                        <MapPin size={16} />
                        <span>{ev.location}</span>
                      </div>
                      <div className="meta-item">
                        <Users size={16} />
                        <span>{ev.attendeesCount} участников идут</span>
                      </div>
                    </div>

                    <div className="event-card-actions">
                      <button
                        className={`btn-attend-event ${ev.isAttending ? 'attending' : ''}`}
                        onClick={() => handleToggleAttend(ev.id)}
                      >
                        {ev.isAttending ? '✓ Вы участвуете' : 'Я пойду'}
                      </button>
                      {ev.isOnline && (
                        <button
                          className="btn-join-room"
                          onClick={() => navigate('/conferences')}
                        >
                          Войти в комнату
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="community-members-tab">
            <div className="members-admin-list">
              <h4>Администрация & Модераторы</h4>
              <div className="member-card admin">
                <img
                  src={community.creator.avatar}
                  alt={community.creator.name}
                  className="member-avatar"
                />
                <div className="member-info">
                  <div className="member-name-row">
                    <strong>{community.creator.name}</strong>
                    <span className="badge-admin">
                      <Award size={12} /> Главный Администратор
                    </span>
                  </div>
                  <span>@{community.creator.username}</span>
                </div>
                <button
                  className="btn-msg-member"
                  onClick={() => navigate('/messenger')}
                >
                  <MessageCircle size={15} /> Написать
                </button>
              </div>
            </div>

            <div className="members-active-list">
              <h4>Участники ({membersCount.toLocaleString()})</h4>
              <div className="members-grid">
                <div className="member-card">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="member-avatar"
                  />
                  <div className="member-info">
                    <strong>{currentUser.name} (Вы)</strong>
                    <span>@{currentUser.username}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="community-rules-tab">
            <div className="rules-card-box">
              <div className="rules-heading">
                <Shield size={24} color="#6366F1" />
                <div>
                  <h3>Правила и регламент сообщества</h3>
                  <p>Соблюдение этих правил обязательно для всех участников</p>
                </div>
              </div>

              <ol className="rules-order-list">
                {community.rules.map((rule, idx) => (
                  <li key={idx}>
                    <div className="rule-item-content">
                      <strong>Правило {idx + 1}</strong>
                      <p>{rule}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="rules-footer-note">
                В случае нарушений правил модераторы могут выдать временный мут или исключить из сообщества.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

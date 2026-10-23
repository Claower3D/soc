import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Search, Calendar as CalendarIcon, Filter, Heart, Share2, X, Plus,
  Sparkles, CheckCircle2, ChevronLeft, ChevronRight, Star, User, Phone,
  Mail, MessageSquare, Compass, Shield, Trash2, ArrowRight, Grid,
  Navigation, ZoomIn, ZoomOut, AlertCircle, RefreshCw, Upload, Users, Check, ExternalLink
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './RetreatMapPage.css';

const FAKE_RETREAT_IDS = new Set([
  'ret_karaganda_yoga',
  'ret_karaganda_mindful',
  'ret_almaty_kolsai',
  'ret_sochi_krasnaya',
  'ret_bali_ubud',
  'ret_altai_shambhala',
  'ret_turkey_oludeniz'
]);

export interface RetreatItem {
  id: string;
  title: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar: string;
  organizerTitle: string;
  organizerVerified: boolean;
  category: string;
  categoryTitle: string;
  badge: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  locationCity: string;
  locationAddress: string;
  country: string;
  latitude: number;
  longitude: number;
  price: number;
  currency: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  rating: number;
  reviewsCount: number;
  images: string[];
  coverImage: string;
  description: string;
  program: string;
  included: string;
  maxSpots: number;
  bookedSpots: number;
  distanceKm?: number;
  createdAt?: string;
}

export interface BookingItem {
  id: string;
  retreatId: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  seatsCount: number;
  comment: string;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
}

export function RetreatMapPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Основные состояния данных
  const [retreats, setRetreats] = useState<RetreatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRetreat, setSelectedRetreat] = useState<RetreatItem | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'catalog' | 'calendar'>('map');

  // Фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRadius, setSelectedRadius] = useState<string>('all'); // 50, 100, 500, all
  const [sortBy, setSortBy] = useState<'nearby' | 'date' | 'rating' | 'price_asc' | 'price_desc'>('nearby');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ lat: 49.8028, lng: 73.0877 });

  // Качественная расширенная фильтрация
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<'all' | 'under20' | '20to50' | 'over50'>('all');
  const [onlyAvailableSpots, setOnlyAvailableSpots] = useState(false);

  // Избранное
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('retreat_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Модальные окна
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBookingsViewOpen, setIsBookingsViewOpen] = useState(false);
  const [retreatBookings, setRetreatBookings] = useState<BookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Слайдер фото в деталях
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Ссылка на карту
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusLayerRef = useRef<L.LayerGroup | null>(null);

  // Форма бронирования
  const [bookForm, setBookForm] = useState({
    fullName: currentUser?.name || '',
    phone: '',
    email: '',
    seatsCount: 1,
    comment: ''
  });
  const [bookSubmitting, setBookSubmitting] = useState(false);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  // Качественная клиентская фильтрация и сортировка
  const filteredRetreats = useMemo(() => {
    return retreats.filter((r) => {
      // 1. По категории
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;

      // 2. Поиск по тексту (название, город, адрес, описание, имя мастера)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = r.title?.toLowerCase().includes(q);
        const matchCity = r.locationCity?.toLowerCase().includes(q);
        const matchAddr = r.locationAddress?.toLowerCase().includes(q);
        const matchDesc = r.description?.toLowerCase().includes(q);
        const matchOrg = r.organizerName?.toLowerCase().includes(q);
        if (!matchTitle && !matchCity && !matchAddr && !matchDesc && !matchOrg) return false;
      }

      // 3. По цене
      if (priceRange === 'under20' && r.price > 20000) return false;
      if (priceRange === '20to50' && (r.price < 20000 || r.price > 50000)) return false;
      if (priceRange === 'over50' && r.price < 50000) return false;

      // 4. Только со свободными местами
      if (onlyAvailableSpots) {
        const remaining = Math.max(0, (r.maxSpots || 15) - (r.bookedSpots || 0));
        if (remaining <= 0) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      if (sortBy === 'date') return new Date(b.createdAt || b.startDate || 0).getTime() - new Date(a.createdAt || a.startDate || 0).getTime();
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'nearby') return (a.distanceKm || 0) - (b.distanceKm || 0);
      return 0;
    });
  }, [retreats, selectedCategory, searchQuery, priceRange, onlyAvailableSpots, sortBy]);

  // Проверка активности расширенных фильтров
  const hasActiveAdvancedFilters = selectedCategory !== 'all' || selectedRadius !== 'all' || priceRange !== 'all' || onlyAvailableSpots || (sortBy !== 'nearby' && sortBy !== 'date');
  // Определение геолокации пользователя
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Дефолтный центр (Караганда)
          setUserLocation({ lat: 49.8028, lng: 73.0877 });
        },
        { timeout: 8000 }
      );
    } else {
      setUserLocation({ lat: 49.8028, lng: 73.0877 });
    }
  }, []);

  // Загрузка ретритов с бэкенда
  const fetchRetreats = async () => {
    setLoading(true);
    try {
      const res = await api.retreats.list({
        q: searchQuery,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        sort: sortBy,
        radius: selectedRadius === 'all' ? undefined : selectedRadius,
        lat: userLocation?.lat,
        lng: userLocation?.lng
      });
      if (res?.retreats) {
        const realRetreats = res.retreats.filter((r: RetreatItem) => 
          !FAKE_RETREAT_IDS.has(r.id) && 
          !r.organizerId?.startsWith('u_aliya_') && 
          !r.organizerId?.startsWith('u_karaganda_')
        );
        setRetreats(realRetreats);
        if (!selectedRetreat && realRetreats.length > 0) {
          setSelectedRetreat(realRetreats[0]);
        } else if (realRetreats.length === 0) {
          setSelectedRetreat(null);
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки ретритов:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetreats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedRadius, sortBy, userLocation?.lat, userLocation?.lng]);

  // Поиск с debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRetreats();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Категории для фильтра
  const categories = useMemo(() => [
    { id: 'all', title: 'Все' },
    { id: 'yoga', title: 'Йога' },
    { id: 'meditation', title: 'Медитация' },
    { id: 'art', title: 'Творчество' },
    { id: 'soundhealing', title: 'Саундхилинг' },
    { id: 'spiritual', title: 'Места силы' },
    { id: 'vipassana', title: 'Випассана' },
    { id: 'nature', title: 'Природа' },
  ], []);

  // Инвалидация размера карты при переключении табов и изменении размера окна
  useEffect(() => {
    const onResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (viewMode === 'map' && mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // Инициализация Leaflet карты
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter: [number, number] = [49.8028, 73.0877]; // Караганда
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 6,
      zoomControl: false,
      attributionControl: false
    });

    // Надежный открытый слой OpenStreetMap без ограничений и ключей API
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Гарантированная перерисовка карты после загрузки
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    const radiusGroup = L.layerGroup().addTo(map);
    radiusLayerRef.current = radiusGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Обновление меток на карте
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (filteredRetreats.length === 0) return;

    const bounds = L.latLngBounds([]);

    filteredRetreats.forEach((ret) => {
      if (!ret.latitude || !ret.longitude) return;

      const isSelected = selectedRetreat?.id === ret.id;
      const pos: [number, number] = [ret.latitude, ret.longitude];
      bounds.extend(pos);

      // Форматирование цены
      const priceStr = `${ret.price.toLocaleString('ru-RU')} ${ret.currency === 'KZT' ? '₸' : ret.currency === 'RUB' ? '₽' : ret.currency === 'USD' ? '$' : '€'}`;

      // Кастомный HTML-маркер в фирменном стиле (как на скринах)
      const iconHtml = `
        <div class="retreat-map-pin ${isSelected ? 'selected' : ''}">
          <div class="pin-badge">
            <span class="pin-dot"></span>
            <span class="pin-title">${ret.locationCity}: ${ret.title.slice(0, 18)}...</span>
            <span class="pin-price">${priceStr}</span>
          </div>
          <div class="pin-stem"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-div-icon',
        html: iconHtml,
        iconSize: [160, 42],
        iconAnchor: [80, 42]
      });

      const marker = L.marker(pos, { icon: customIcon });

      marker.on('click', () => {
        setSelectedRetreat(ret);
        setActivePhotoIdx(0);
        map.setView(pos, Math.max(map.getZoom(), 11), { animate: true });
      });

      markersGroup.addLayer(marker);
    });

    // При загрузке без ограничения радиуса центрируем по меткам
    if (bounds.isValid() && selectedRadius === 'all') {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [retreats, selectedRetreat, selectedRadius]);

  // Перемещение центра округа кликом по карте
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const onMapClick = (e: L.LeafletMouseEvent) => {
      if (selectedRadius !== 'all') {
        setUserLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [selectedRadius]);

  // Отрисовка визуального круга радиуса поиска (Округ) на карте
  useEffect(() => {
    const map = mapInstanceRef.current;
    const radiusGroup = radiusLayerRef.current;
    if (!map || !radiusGroup) return;

    radiusGroup.clearLayers();

    if (selectedRadius === 'all') return;

    const radiusKm = parseFloat(selectedRadius);
    if (!radiusKm || isNaN(radiusKm)) return;

    const center: [number, number] = [userLocation.lat, userLocation.lng];
    const radiusMeters = radiusKm * 1000;

    // Круг радиуса с подсветкой и пунктирной границей
    const circle = L.circle(center, {
      radius: radiusMeters,
      color: '#4F46E5',
      weight: 2.5,
      dashArray: '7, 9',
      fillColor: '#6366F1',
      fillOpacity: 0.12
    });

    circle.bindTooltip(`Округ: ${radiusKm} км`, {
      permanent: true,
      direction: 'top',
      className: 'radius-circle-tooltip'
    });

    // Маркер центра поиска округа
    const centerIcon = L.divIcon({
      className: 'radius-center-div-icon',
      html: `
        <div class="radius-center-pin" title="Центр округа (${radiusKm} км). Нажмите в любое место карты, чтобы переместить">
          <div class="radius-pulse-ring"></div>
          <div class="radius-center-dot"></div>
          <div class="radius-center-label">Округ ${radiusKm} км</div>
        </div>
      `,
      iconSize: [120, 36],
      iconAnchor: [60, 18]
    });

    const centerMarker = L.marker(center, { icon: centerIcon });

    radiusGroup.addLayer(circle);
    radiusGroup.addLayer(centerMarker);

    // Центрируем и масштабируем карту, чтобы круг полностью влез в экран
    map.fitBounds(circle.getBounds(), { padding: [40, 40], maxZoom: 12 });
  }, [selectedRadius, userLocation]);

  // Центрирование карты на выбранном ретрите
  const handleCenterOnRetreat = (ret: RetreatItem) => {
    setSelectedRetreat(ret);
    setActivePhotoIdx(0);
    if (mapInstanceRef.current && ret.latitude && ret.longitude) {
      mapInstanceRef.current.setView([ret.latitude, ret.longitude], 12, { animate: true });
    }
  };

  // Переключение избранного
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('retreat_favorites', JSON.stringify(next));
      return next;
    });
  };

  // Удаление ретрита
  const handleDeleteRetreat = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот ретрит с карты?')) return;
    try {
      await api.retreats.delete(id);
      setRetreats((prev) => prev.filter((r) => r.id !== id));
      if (selectedRetreat?.id === id) {
        setSelectedRetreat(null);
      }
    } catch (err: any) {
      alert(err?.message || 'Не удалось удалить ретрит');
    }
  };

  // Открытие модалки бронирования
  const handleOpenBookModal = () => {
    setBookSuccess(false);
    setBookError(null);
    setBookForm({
      fullName: currentUser?.name || '',
      phone: '',
      email: '',
      seatsCount: 1,
      comment: ''
    });
    setIsBookModalOpen(true);
  };

  // Отправка заявки на бронирование
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRetreat) return;
    if (!bookForm.fullName.trim() || !bookForm.phone.trim()) {
      setBookError('Пожалуйста, заполните имя и контактный телефон');
      return;
    }

    setBookSubmitting(true);
    setBookError(null);
    try {
      await api.retreats.book(selectedRetreat.id, {
        fullName: bookForm.fullName.trim(),
        phone: bookForm.phone.trim(),
        email: bookForm.email.trim(),
        seatsCount: Number(bookForm.seatsCount) || 1,
        comment: bookForm.comment.trim()
      });
      setBookSuccess(true);
      // Обновляем количество мест
      setSelectedRetreat((prev) => prev ? { ...prev, bookedSpots: prev.bookedSpots + (Number(bookForm.seatsCount) || 1) } : null);
    } catch (err: any) {
      setBookError(err?.message || 'Ошибка отправки заявки на бронь');
    } finally {
      setBookSubmitting(false);
    }
  };

  // Просмотр реальных заявок организатором
  const handleOpenBookingsList = async () => {
    if (!selectedRetreat) return;
    setIsBookingsViewOpen(true);
    setLoadingBookings(true);
    try {
      const res = await api.retreats.bookings(selectedRetreat.id);
      setRetreatBookings(res || []);
    } catch (err) {
      console.error('Ошибка загрузки заявок:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Форматирование цен
  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === 'KZT' ? '₸' : currency === 'RUB' ? '₽' : currency === 'USD' ? '$' : '€';
    return `${price.toLocaleString('ru-RU')} ${symbol}`;
  };

  // Форматирование дат
  const formatDateRange = (start?: string, end?: string) => {
    if (!start) return '';
    try {
      const d1 = new Date(start);
      const months = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
      const str1 = `${d1.getDate()} ${months[d1.getMonth()]}`;
      if (!end) return str1;
      const d2 = new Date(end);
      const str2 = `${d2.getDate()} ${months[d2.getMonth()]} ${d2.getFullYear()}`;
      return `${str1} — ${str2}`;
    } catch {
      return start;
    }
  };

  return (
    <div className="retreat-map-container">
      {/* =========================================================================
          ВЕРХНЯЯ ШАПКА RETREAT MAP PRO
      ========================================================================= */}
      <header className="retreat-map-header">
        {/* Переключатель режимов просмотра */}
        <div className="retreat-view-toggle-bar">
          <button
            className={`view-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
          >
            <MapPin size={15} />
            <span>Карта и список</span>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'catalog' ? 'active' : ''}`}
            onClick={() => setViewMode('catalog')}
          >
            <Grid size={15} />
            <span>Каталог</span>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon size={15} />
            <span>Календарь</span>
          </button>
        </div>

        <div className="retreat-header-right">
          <button
            className="create-retreat-btn"
            onClick={() => setIsCreateModalOpen(true)}
            title="Опубликовать свой ретрит на карте"
          >
            <Plus size={16} />
            <span>Создать ретрит</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          ОСНОВНОЕ ТЕЛО (СЕТКА: СПИСОК СЛЕВА, КАРТА ПО ЦЕНТРУ, ДЕТАЛИ СПРАВА)
      ========================================================================= */}
      <main className="retreat-main-workspace">
        {/* ЛЕВАЯ ПАНЕЛЬ: ФИЛЬТРЫ И СПИСОК КАРТОЧЕК */}
        <aside className="retreat-list-sidebar">
          {/* Поле поиска в панели */}
          <div className="retreat-filter-search-box" style={{ position: 'relative' }}>
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              placeholder="Поиск по ретритам, городам и странам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              className={`filter-tune-btn ${hasActiveAdvancedFilters ? 'has-active' : ''}`}
              onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
              title="Настройка фильтрации"
            >
              <Filter size={15} />
              {hasActiveAdvancedFilters && <span className="filter-active-dot-badge" />}
            </button>

            {/* Выпадающая панель качественной фильтрации */}
            {isFilterPopoverOpen && (
              <div className="retreat-filter-popover">
                <div className="popover-header-row">
                  <h4>Параметры фильтрации</h4>
                  <button className="btn-close-popover" onClick={() => setIsFilterPopoverOpen(false)}>
                    <X size={15} />
                  </button>
                </div>

                <div className="popover-section-block">
                  <label>Категория ретрита</label>
                  <div className="filter-chip-row">
                    {categories.map((c) => {
                      const count = c.id === 'all'
                        ? retreats.length
                        : retreats.filter((r) => r.category === c.id).length;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`filter-chip-item ${selectedCategory === c.id ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(c.id)}
                        >
                          {c.title} {count > 0 ? `(${count})` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="popover-section-block">
                  <label>Радиус поиска (округ)</label>
                  <div className="filter-chip-row">
                    {[
                      { id: '50', label: '50 км' },
                      { id: '100', label: '100 км' },
                      { id: '250', label: '250 км' },
                      { id: '500', label: '500 км' },
                      { id: 'all', label: 'Весь мир' }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={`filter-chip-item ${selectedRadius === r.id ? 'active' : ''}`}
                        onClick={() => setSelectedRadius(r.id)}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="popover-section-block">
                  <label>Ценовой диапазон</label>
                  <div className="filter-chip-row">
                    {[
                      { id: 'all', label: 'Все цены' },
                      { id: 'under20', label: 'До 20 000 ₸' },
                      { id: '20to50', label: '20 000 — 50 000 ₸' },
                      { id: 'over50', label: 'От 50 000 ₸' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`filter-chip-item ${priceRange === p.id ? 'active' : ''}`}
                        onClick={() => setPriceRange(p.id as any)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="popover-section-block">
                  <label>Сортировка</label>
                  <div className="filter-chip-row">
                    {[
                      { id: 'nearby', label: 'Рядом' },
                      { id: 'date', label: 'Свежие' },
                      { id: 'price_asc', label: 'Сначала дешевле' },
                      { id: 'price_desc', label: 'Сначала дороже' },
                      { id: 'rating', label: 'По рейтингу' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`filter-chip-item ${sortBy === s.id ? 'active' : ''}`}
                        onClick={() => setSortBy(s.id as any)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="popover-section-block">
                  <div
                    className={`filter-toggle-switch-row ${onlyAvailableSpots ? 'active' : ''}`}
                    onClick={() => setOnlyAvailableSpots(!onlyAvailableSpots)}
                  >
                    <span className="toggle-label-text">Только со свободными местами</span>
                    <div className="toggle-indicator">
                      {onlyAvailableSpots && <Check size={13} strokeWidth={3} />}
                    </div>
                  </div>
                </div>

                <div className="popover-footer-actions">
                  <button
                    type="button"
                    className="btn-reset-filters-text"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedRadius('all');
                      setPriceRange('all');
                      setOnlyAvailableSpots(false);
                      setSortBy('nearby');
                    }}
                  >
                    Сбросить
                  </button>
                  <button
                    type="button"
                    className="btn-apply-filters-main"
                    onClick={() => setIsFilterPopoverOpen(false)}
                  >
                    Применить
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Активные бейджи фильтров, если выбрана категория или радиус */}
          {(selectedCategory !== 'all' || selectedRadius !== 'all') && (
            <div className="active-filters-chips-bar">
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  className="active-filter-pill-tag"
                  onClick={() => setSelectedCategory('all')}
                  title="Сбросить категорию"
                >
                  <span>{categories.find((c) => c.id === selectedCategory)?.title || selectedCategory}</span>
                  <X size={12} />
                </button>
              )}
              {selectedRadius !== 'all' && (
                <button
                  type="button"
                  className="active-filter-pill-tag"
                  onClick={() => setSelectedRadius('all')}
                  title="Сбросить радиус"
                >
                  <span>Округ: {selectedRadius} км</span>
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Строка сортировки */}
          <div className="retreat-sort-row">
            <div className="sort-links">
              <span>Сорт:</span>
              <button
                className={`sort-link ${sortBy === 'nearby' ? 'active' : ''}`}
                onClick={() => setSortBy('nearby')}
              >
                Рядом
              </button>
              <span>·</span>
              <button
                className={`sort-link ${sortBy === 'date' ? 'active' : ''}`}
                onClick={() => setSortBy('date')}
              >
                По дате
              </button>
              <span>·</span>
              <button
                className={`sort-link ${sortBy === 'rating' ? 'active' : ''}`}
                onClick={() => setSortBy('rating')}
              >
                По рейтингу
              </button>
            </div>
            <span className="focus-count">{filteredRetreats.length} в фокусе</span>
          </div>

          {/* Список карточек */}
          <div className="retreat-cards-scroll-list">
            {loading ? (
              <div className="retreat-loading-state">
                <RefreshCw size={24} className="spin-icon" />
                <span>Загрузка ретритов...</span>
              </div>
            ) : filteredRetreats.length === 0 ? (
              <div className="retreat-empty-state">
                <Compass size={36} />
                <h3>Ретриты не найдены</h3>
                <p>Попробуйте расширить радиус поиска, сбросить фильтры или создайте первый ретрит в вашем регионе</p>
                <div className="empty-state-btn-row">
                  <button
                    className="reset-filters-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedRadius('all');
                      setPriceRange('all');
                      setOnlyAvailableSpots(false);
                      setSortBy('nearby');
                    }}
                  >
                    Сбросить фильтры
                  </button>
                  <button
                    className="empty-create-btn"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    + Создать свой ретрит
                  </button>
                </div>
              </div>
            ) : (
              filteredRetreats.map((ret) => {
                const remainingSpots = Math.max(0, (ret.maxSpots || 15) - (ret.bookedSpots || 0));
                const isSelected = selectedRetreat?.id === ret.id;
                const isFav = favorites.includes(ret.id);
                const statusBadge = ret.status === 'completed'
                  ? 'Завершён'
                  : ret.status === 'ongoing'
                  ? 'Идёт сейчас'
                  : 'Ожидается';

                return (
                  <div
                    key={ret.id}
                    className={`retreat-card-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCenterOnRetreat(ret)}
                  >
                    {/* Превью картинки с бейджами */}
                    <div className="card-thumb-wrap">
                      {(ret.coverImage || ret.images?.[0]) ? (
                        <img
                          src={ret.coverImage || ret.images?.[0]}
                          alt={ret.title}
                          className="card-thumb-img"
                        />
                      ) : (
                        <div className="card-thumb-placeholder">
                          <MapPin size={24} color="#6366F1" />
                        </div>
                      )}
                      <div className="thumb-top-badges">
                        <span className={`status-badge-chip ${ret.status}`}>
                          {statusBadge}
                        </span>
                        {ret.distanceKm !== undefined && ret.distanceKm < 200 && (
                          <span className="distance-badge-chip">
                            Близко ({Math.round(ret.distanceKm)} км)
                          </span>
                        )}
                        <button
                          className={`card-heart-btn ${isFav ? 'active' : ''}`}
                          onClick={(e) => toggleFavorite(ret.id, e)}
                        >
                          <Heart size={14} fill={isFav ? '#EF4444' : 'none'} color={isFav ? '#EF4444' : '#FFF'} />
                        </button>
                      </div>

                      <div className="thumb-bottom-info">
                        <span className="thumb-location-pill">
                          {ret.locationCity}
                        </span>
                        <span className="thumb-price-pill">
                          {formatPrice(ret.price, ret.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Текстовая информация */}
                    <div className="card-content-body">
                      <div className="card-category-rating-row">
                        <span className="card-category-tag">{ret.categoryTitle}</span>
                        <div className="card-rating">
                          <Star size={13} fill="#F59E0B" color="#F59E0B" />
                          <span>{ret.rating.toFixed(2)}</span>
                          <span className="reviews-cnt">({ret.reviewsCount})</span>
                        </div>
                      </div>

                      <h4 className="card-title-text">{ret.title}</h4>
                      <div className="card-spots-pill-wrap">
                        <span className={`card-spots-pill ${remainingSpots === 0 ? 'sold-out' : remainingSpots <= 3 ? 'few' : 'available'}`}>
                          <Users size={11} />
                          {remainingSpots === 0 ? 'Мест нет' : `Осталось ${remainingSpots} из ${ret.maxSpots || 15} мест`}
                        </span>
                      </div>
                      <p className="card-excerpt-text">{ret.description}</p>

                      <div className="card-footer-meta">
                        <span className="date-badge">
                          {formatDateRange(ret.startDate, ret.endDate)}
                        </span>
                        <span className="duration-badge">{ret.durationDays} дн.</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Подвал левой панели */}
          <div className="retreat-list-footer">
            <span>В фокусе: {retreats.length} мероприятий</span>
            <button
              className="clear-all-link"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedRadius('all');
              }}
            >
              Сбросить всё
            </button>
          </div>
        </aside>

        {/* ЦЕНТРАЛЬНАЯ КАРТА */}
        <section className={`retreat-map-stage ${viewMode !== 'map' ? 'hidden' : ''}`}>
          <div ref={mapContainerRef} className="leaflet-map-canvas" />

          {/* Плавающий переключатель радиуса округа на карте */}
          <div className="map-floating-radius-widget">
            <div className="floating-radius-label">
              <Compass size={14} color="#4F46E5" />
              <span>Округ:</span>
            </div>
            {[
              { id: '50', label: '50 км' },
              { id: '100', label: '100 км' },
              { id: '250', label: '250 км' },
              { id: '500', label: '500 км' },
              { id: 'all', label: 'Весь мир' }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                className={`floating-radius-btn ${selectedRadius === r.id ? 'active' : ''}`}
                onClick={() => setSelectedRadius(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Плавающий информер в левом нижнем углу карты */}
          <div className="map-floating-status-pill">
            <Compass size={14} />
            <span>Детальный обзор: <b>{retreats.length} мероприятий</b></span>
          </div>

          {/* Кнопки управления картой */}
          <div className="map-custom-controls">
            <button
              className="map-ctrl-btn"
              onClick={() => mapInstanceRef.current?.zoomIn()}
              title="Приблизить"
            >
              <ZoomIn size={16} />
            </button>
            <button
              className="map-ctrl-btn"
              onClick={() => mapInstanceRef.current?.zoomOut()}
              title="Отдалить"
            >
              <ZoomOut size={16} />
            </button>
            <button
              className="map-ctrl-btn"
              onClick={() => {
                if (userLocation && mapInstanceRef.current) {
                  mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 11, { animate: true });
                }
              }}
              title="Моё местоположение"
            >
              <Navigation size={16} />
            </button>
          </div>
        </section>

        {/* РЕЖИМ КАТАЛОГА (СЕТКА) */}
        {viewMode === 'catalog' && (
          <section className="retreat-catalog-grid-stage">
            <div className="catalog-grid-header">
              <h2>Каталог ретритов и туров</h2>
              <p>Исследуйте духовные практики и оздоровительные заезды по всему миру</p>
            </div>
            <div className="catalog-cards-grid">
              {retreats.map((ret) => (
                <div
                  key={ret.id}
                  className="catalog-card"
                  onClick={() => {
                    setSelectedRetreat(ret);
                    setViewMode('map');
                  }}
                >
                  {(ret.coverImage || ret.images?.[0]) ? (
                    <img src={ret.coverImage || ret.images?.[0]} alt={ret.title} className="catalog-card-img" />
                  ) : (
                    <div className="catalog-card-placeholder">
                      <MapPin size={32} color="#6366F1" />
                    </div>
                  )}
                  <div className="catalog-card-body">
                    <span className="catalog-card-cat">{ret.categoryTitle}</span>
                    <h3>{ret.title}</h3>
                    <p>{ret.description.slice(0, 110)}...</p>
                    <div className="catalog-card-foot">
                      <strong>{formatPrice(ret.price, ret.currency)}</strong>
                      <span>{ret.locationCity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* РЕЖИМ КАЛЕНДАРЯ */}
        {viewMode === 'calendar' && (
          <section className="retreat-calendar-stage">
            <div className="calendar-header-box">
              <h2>Календарь заездов 2026</h2>
              <p>Ближайшие даты ретритов и открытые наборы групп</p>
            </div>
            <div className="calendar-events-timeline">
              {retreats.map((ret) => (
                <div
                  key={ret.id}
                  className="calendar-event-row"
                  onClick={() => {
                    setSelectedRetreat(ret);
                    setViewMode('map');
                  }}
                >
                  <div className="event-date-col">
                    <span className="date-month">{formatDateRange(ret.startDate)}</span>
                    <span className="date-dur">{ret.durationDays} дня</span>
                  </div>
                  <div className="event-info-col">
                    <h4>{ret.title}</h4>
                    <span className="event-place">{ret.locationAddress}</span>
                  </div>
                  <div className="event-price-col">
                    <strong>{formatPrice(ret.price, ret.currency)}</strong>
                    <button className="event-book-fast-btn">Смотреть</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ПРАВАЯ ПАНЕЛЬ: ПОДРОБНЫЕ ДЕТАЛИ ВЫБРАННОГО РЕТРИТА */}
        {selectedRetreat && (
          <aside className="retreat-detail-drawer">
            {/* Верхний статус-бар деталей */}
            <div className="drawer-top-bar">
              <div className="drawer-status-chip">
                <span className="dot" />
                <span>
                  {selectedRetreat.status === 'completed'
                    ? 'РЕТРИТ ЗАВЕРШЁН'
                    : selectedRetreat.status === 'ongoing'
                    ? 'ИДЁТ СЕЙЧАС'
                    : 'НАБОР ОТКРЫТ'}
                </span>
              </div>

              <div className="drawer-actions">
                <button
                  className="drawer-icon-btn"
                  title="Поделиться"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: selectedRetreat.title, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Ссылка на ретрит скопирована!');
                    }
                  }}
                >
                  <Share2 size={16} />
                </button>
                <button
                  className={`drawer-icon-btn ${favorites.includes(selectedRetreat.id) ? 'fav-active' : ''}`}
                  onClick={() => toggleFavorite(selectedRetreat.id)}
                  title="В избранное"
                >
                  <Heart
                    size={16}
                    fill={favorites.includes(selectedRetreat.id) ? '#EF4444' : 'none'}
                    color={favorites.includes(selectedRetreat.id) ? '#EF4444' : 'currentColor'}
                  />
                </button>
                <button
                  className="drawer-icon-btn"
                  onClick={() => setSelectedRetreat(null)}
                  title="Закрыть детали"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Скроллируемое тело деталей */}
            <div className="drawer-scroll-body">
              {/* Фотогалерея с переключателем или заглушка */}
              {(selectedRetreat.images && selectedRetreat.images.length > 0) || selectedRetreat.coverImage ? (
                <div className="drawer-photo-gallery">
                  <img
                    src={selectedRetreat.images?.[activePhotoIdx] || selectedRetreat.coverImage}
                    alt={selectedRetreat.title}
                    className="gallery-main-img"
                  />
                  {selectedRetreat.images && selectedRetreat.images.length > 1 && (
                    <>
                      <button
                        className="gallery-arrow left"
                        onClick={() =>
                          setActivePhotoIdx((prev) =>
                            prev === 0 ? selectedRetreat.images.length - 1 : prev - 1
                          )
                        }
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        className="gallery-arrow right"
                        onClick={() =>
                          setActivePhotoIdx((prev) =>
                            prev === selectedRetreat.images.length - 1 ? 0 : prev + 1
                          )
                        }
                      >
                        <ChevronRight size={18} />
                      </button>
                      <div className="gallery-counter-badge">
                        {activePhotoIdx + 1}/{selectedRetreat.images.length} фото
                      </div>
                    </>
                  )}
                  {selectedRetreat.images && selectedRetreat.images.length > 1 && (
                    <div className="gallery-thumbs-row">
                      {selectedRetreat.images.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`gallery-thumb-btn ${activePhotoIdx === i ? 'active' : ''}`}
                          onClick={() => setActivePhotoIdx(i)}
                        >
                          <img src={img} alt={`Миниатюра ${i + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="drawer-photo-placeholder">
                  <MapPin size={32} color="#6366F1" />
                  <span>Фотографии локации не добавлены</span>
                </div>
              )}

              {/* Рейтинг и категории */}
              <div className="drawer-badges-row">
                <span className="drawer-rating-pill">
                  <Star size={13} fill="#F59E0B" color="#F59E0B" />
                  <b>{selectedRetreat.rating.toFixed(2)}</b> ({selectedRetreat.reviewsCount} отзывов)
                </span>
                <span className="drawer-badge-tag">{selectedRetreat.categoryTitle}</span>
                {selectedRetreat.badge && (
                  <span className="drawer-premium-tag"><Sparkles size={13} style={{ marginRight: 4 }} />{selectedRetreat.badge}</span>
                )}
              </div>

              {/* Заголовок и локация */}
              <h2 className="drawer-title">{selectedRetreat.title}</h2>
              <div className="drawer-location-row">
                <MapPin size={15} className="pin-icon" />
                <span>{selectedRetreat.locationAddress}, {selectedRetreat.locationCity}</span>
              </div>

              {/* 2GIS Кнопка точного адреса */}
              <a
                href={`https://2gis.kz/search/${encodeURIComponent((selectedRetreat.locationAddress || '') + ' ' + (selectedRetreat.locationCity || ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-open-2gis"
                title="Открыть точный адрес и проложить маршрут в 2ГИС"
              >
                <Navigation size={14} />
                <span>Открыть в 2ГИС (точный адрес)</span>
                <ExternalLink size={12} />
              </a>

              {/* Блок мест: всего мест и сколько осталось */}
              {(() => {
                const totalSpots = selectedRetreat.maxSpots || 15;
                const booked = selectedRetreat.bookedSpots || 0;
                const remaining = Math.max(0, totalSpots - booked);
                const percent = Math.min(100, Math.round((booked / totalSpots) * 100));
                return (
                  <div className="drawer-spots-card">
                    <div className="spots-header-row">
                      <div className="spots-title-group">
                        <Users size={16} />
                        <span>Места для участников</span>
                      </div>
                      <span className={`spots-badge-pill ${remaining === 0 ? 'sold-out' : remaining <= 3 ? 'few' : 'available'}`}>
                        {remaining === 0 ? 'Все места заняты' : remaining <= 3 ? `Осталось всего ${remaining} мест` : `Свободно ${remaining} мест`}
                      </span>
                    </div>
                    <div className="spots-progress-track">
                      <div
                        className={`spots-progress-fill ${remaining === 0 ? 'full' : remaining <= 3 ? 'warning' : 'ok'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="spots-numbers-subline">
                      <span>Осталось мест: <b>{remaining}</b></span>
                      <span>Всего мест: <b>{totalSpots}</b></span>
                      <span>Забронировано: <b>{booked}</b></span>
                    </div>
                  </div>
                );
              })()}

              {/* Карточка организатора / мастера */}
              <div className="drawer-master-card">
                <img
                  src={selectedRetreat.organizerAvatar || '/default-avatar.svg'}
                  alt={selectedRetreat.organizerName}
                  className="master-avatar-img"
                />
                <div className="master-info-text">
                  <div className="master-name-row">
                    <strong>{selectedRetreat.organizerName}</strong>
                    {selectedRetreat.organizerVerified && (
                      <CheckCircle2 size={15} color="#3B82F6" />
                    )}
                  </div>
                  <span className="master-subtitle">{selectedRetreat.organizerTitle}</span>
                </div>
                <button
                  className="master-profile-btn"
                  onClick={() => navigate(`/profile/@${selectedRetreat.organizerName.replace(/\s+/g, '_')}`)}
                >
                  Профиль
                </button>
              </div>

              {/* Кнопка просмотра заявок (только для организатора или админа) */}
              {(currentUser?.id === selectedRetreat.organizerId || currentUser?.role === 'admin') && (
                <div className="organizer-manage-banner">
                  <div className="manage-text">
                    <Shield size={16} />
                    <span>Вы организатор этого ретрита</span>
                  </div>
                  <button className="view-bookings-btn" onClick={handleOpenBookingsList}>
                    Заявки на бронь ({selectedRetreat.bookedSpots})
                  </button>
                </div>
              )}

              {/* Описание программы */}
              <div className="drawer-section">
                <h3 className="section-heading">ОПИСАНИЕ ПРОГРАММЫ</h3>
                <p className="section-body-text">{selectedRetreat.description}</p>
                {selectedRetreat.program && (
                  <div className="program-schedule-box">
                    <pre className="program-pre">{selectedRetreat.program}</pre>
                  </div>
                )}
              </div>

              {/* Что включено */}
              {selectedRetreat.included && (
                <div className="drawer-section">
                  <h3 className="section-heading">ЧТО ВКЛЮЧЕНО В СТОИМОСТЬ</h3>
                  <p className="included-text">✓ {selectedRetreat.included}</p>
                </div>
              )}

              {/* Детали заезда и окончания */}
              <div className="drawer-section">
                <h3 className="section-heading">ДЕТАЛИ ЗАЕЗДА</h3>
                <div className="checkin-grid">
                  <div className="checkin-box">
                    <span className="checkin-label">НАЧАЛО</span>
                    <strong>{formatDateRange(selectedRetreat.startDate)}</strong>
                    <span className="checkin-time">в 14:00</span>
                  </div>
                  <div className="checkin-box">
                    <span className="checkin-label">ОКОНЧАНИЕ</span>
                    <strong>{formatDateRange(selectedRetreat.endDate)}</strong>
                    <span className="checkin-time">в 21:00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Нижняя фиксированная панель действий */}
            <div className="drawer-sticky-bottom-bar">
              <div className="bottom-price-info">
                <span className="price-sub">Полная стоимость</span>
                <span className="price-main">
                  {formatPrice(selectedRetreat.price, selectedRetreat.currency)}
                  <span className="price-period"> / {selectedRetreat.durationDays} дня</span>
                </span>
              </div>

              <div className="bottom-action-buttons">
                <button
                  className="book-spot-btn"
                  onClick={handleOpenBookModal}
                  disabled={selectedRetreat.status === 'completed'}
                >
                  <Sparkles size={16} />
                  <span>
                    {selectedRetreat.status === 'completed'
                      ? 'Завершён'
                      : 'Забронировать место'}
                  </span>
                </button>

                <div className="bottom-aux-actions">
                  <button
                    className="locate-map-btn"
                    onClick={() => handleCenterOnRetreat(selectedRetreat)}
                    title="Показать центр на карте"
                  >
                    <MapPin size={15} />
                    <span>На карте</span>
                  </button>

                  <a
                    href={`https://2gis.kz/search/${encodeURIComponent((selectedRetreat.locationAddress || '') + ' ' + (selectedRetreat.locationCity || ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="locate-2gis-btn"
                    title="Открыть в приложении или на сайте 2ГИС"
                  >
                    <Navigation size={15} />
                    <span>2ГИС</span>
                  </a>

                  {/* Кнопка удаления для создателя или админа */}
                  {(currentUser?.id === selectedRetreat.organizerId || currentUser?.role === 'admin') && (
                    <button
                      className="delete-retreat-btn"
                      onClick={() => handleDeleteRetreat(selectedRetreat.id)}
                      title="Удалить ретрит"
                    >
                      <Trash2 size={15} />
                      <span>Удалить</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* =========================================================================
          МОДАЛЬНОЕ ОКНО: ОНЛАЙН-БРОНИРОВАНИЕ МЕСТА (РЕАЛЬНЫЙ БЭКЕНД)
      ========================================================================= */}
      {isBookModalOpen && selectedRetreat && (
        <div className="retreat-modal-backdrop" onClick={() => setIsBookModalOpen(false)}>
          <div className="retreat-modal-window" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-icon" onClick={() => setIsBookModalOpen(false)}>
              <X size={18} />
            </button>

            {bookSuccess ? (
              <div className="booking-success-view">
                <CheckCircle2 size={56} color="#10B981" />
                <h2>Место успешно забронировано!</h2>
                <p>
                  Ваша заявка принята и передана мастеру <b>{selectedRetreat.organizerName}</b>.
                  В ближайшее время организатор свяжется с вами по указанному телефону для подтверждения деталей.
                </p>
                <button
                  className="modal-primary-btn"
                  onClick={() => setIsBookModalOpen(false)}
                >
                  Понятно, спасибо
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="booking-form">
                <div className="modal-header-block">
                  <h2>Бронирование места на ретрит</h2>
                  <p className="modal-subtitle">{selectedRetreat.title}</p>
                </div>

                {bookError && (
                  <div className="modal-alert-error">
                    <AlertCircle size={16} />
                    <span>{bookError}</span>
                  </div>
                )}

                <div className="booking-summary-pill">
                  <div>
                    <span>Стоимость за 1 человека:</span>
                    <strong>{formatPrice(selectedRetreat.price, selectedRetreat.currency)}</strong>
                  </div>
                  <div>
                    <span>Даты заезда:</span>
                    <strong>{formatDateRange(selectedRetreat.startDate, selectedRetreat.endDate)}</strong>
                  </div>
                </div>

                <div className="modal-field-group">
                  <label>ФИО участника *</label>
                  <div className="modal-input-wrap">
                    <User size={16} />
                    <input
                      type="text"
                      placeholder="Александр Иванов"
                      value={bookForm.fullName}
                      onChange={(e) => setBookForm({ ...bookForm, fullName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-field-row-2">
                  <div className="modal-field-group">
                    <label>Номер телефона *</label>
                    <div className="modal-input-wrap">
                      <Phone size={16} />
                      <input
                        type="tel"
                        placeholder="+7 (___) ___-__-__"
                        value={bookForm.phone}
                        onChange={(e) => setBookForm({ ...bookForm, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-field-group">
                    <label>Количество мест</label>
                    <div className="modal-input-wrap">
                      <select
                        value={bookForm.seatsCount}
                        onChange={(e) => setBookForm({ ...bookForm, seatsCount: Number(e.target.value) })}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'место' : n < 5 ? 'места' : 'мест'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-field-group">
                  <label>Электронная почта (для подтверждения)</label>
                  <div className="modal-input-wrap">
                    <Mail size={16} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={bookForm.email}
                      onChange={(e) => setBookForm({ ...bookForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-field-group">
                  <label>Пожелания или особенности (питание, опыт йоги)</label>
                  <div className="modal-input-wrap">
                    <MessageSquare size={16} />
                    <textarea
                      placeholder="Например: вегетарианское меню, новичок в практиках..."
                      rows={2}
                      value={bookForm.comment}
                      onChange={(e) => setBookForm({ ...bookForm, comment: e.target.value })}
                    />
                  </div>
                </div>

                <div className="booking-total-row">
                  <span>Итого к оплате:</span>
                  <strong>
                    {formatPrice(selectedRetreat.price * bookForm.seatsCount, selectedRetreat.currency)}
                  </strong>
                </div>

                <button
                  type="submit"
                  className="modal-primary-btn"
                  disabled={bookSubmitting}
                >
                  {bookSubmitting ? 'Отправляем заявку...' : 'Подтвердить бронирование'}
                  <ArrowRight size={17} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          МОДАЛЬНОЕ ОКНО: СОЗДАНИЕ НОВОГО РЕТРИТА
      ========================================================================= */}
      {isCreateModalOpen && (
        <CreateRetreatModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(newRet) => {
            setRetreats((prev) => [newRet, ...prev]);
            setSelectedRetreat(newRet);
            setIsCreateModalOpen(false);
          }}
        />
      )}

      {/* =========================================================================
          МОДАЛЬНОЕ ОКНО: ПРОСМОТР РЕАЛЬНЫХ ЗАЯВОК (ДЛЯ ОРГАНИЗАТОРА)
      ========================================================================= */}
      {isBookingsViewOpen && selectedRetreat && (
        <div className="retreat-modal-backdrop" onClick={() => setIsBookingsViewOpen(false)}>
          <div className="retreat-modal-window wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-icon" onClick={() => setIsBookingsViewOpen(false)}>
              <X size={18} />
            </button>

            <div className="modal-header-block">
              <h2>Заявки на бронирование</h2>
              <p className="modal-subtitle">{selectedRetreat.title}</p>
            </div>

            {loadingBookings ? (
              <div className="bookings-loading">
                <RefreshCw size={24} className="spin-icon" />
                <span>Загрузка реальных заявок...</span>
              </div>
            ) : retreatBookings.length === 0 ? (
              <div className="bookings-empty">
                <p>На данный момент новых заявок нет.</p>
                <span>Когда пользователи нажмут «Забронировать место», их заявки появятся здесь.</span>
              </div>
            ) : (
              <div className="bookings-table-scroll">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Имя участника</th>
                      <th>Телефон</th>
                      <th>Мест</th>
                      <th>Сумма</th>
                      <th>Дата</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retreatBookings.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <strong>{b.fullName}</strong>
                          {b.email && <div className="user-email">{b.email}</div>}
                        </td>
                        <td>
                          <a href={`tel:${b.phone}`}>{b.phone}</a>
                        </td>
                        <td>{b.seatsCount}</td>
                        <td>{formatPrice(b.totalPrice, b.currency)}</td>
                        <td>{new Date(b.createdAt).toLocaleDateString('ru-RU')}</td>
                        <td>
                          <span className={`status-badge-pill ${b.status}`}>
                            {b.status === 'approved' ? 'Подтверждена' : b.status === 'rejected' ? 'Отклонена' : 'Ожидает'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Вспомогательный компонент создания ретрита
function CreateRetreatModal({
  onClose,
  onCreated
}: {
  onClose: () => void;
  onCreated: (ret: RetreatItem) => void;
}) {
  const [form, setForm] = useState({
    title: '',
    category: 'yoga',
    categoryTitle: 'Йога & Пранаяма',
    locationCity: 'Караганда',
    locationAddress: '',
    country: 'Казахстан',
    latitude: 49.8028,
    longitude: 73.0877,
    price: 35000,
    currency: 'KZT',
    durationDays: 2,
    startDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0],
    description: '',
    program: '',
    included: '',
    maxSpots: 15,
    coverImage: '',
    images: [] as string[]
  });

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 2ГИС и геокодинг адресов
  const [addressSuggestions, setAddressSuggestions] = useState<{ title: string; subtitle: string; lat: number; lng: number; city: string; country: string }[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Геокодинг адреса через Nominatim / 2ГИС поиск
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm({ ...form, locationAddress: val });

    if (val.trim().length >= 3) {
      setIsGeocoding(true);
      const query = `${val}, ${form.locationCity}`;
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=4&addressdetails=1`, {
        headers: { 'Accept-Language': 'ru' }
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const sugs = data.map((item: any) => ({
              title: item.display_name.split(',')[0] || val,
              subtitle: item.display_name.split(',').slice(1, 4).join(',').trim(),
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              city: item.address?.city || item.address?.town || item.address?.state || form.locationCity,
              country: item.address?.country || 'Казахстан'
            }));
            setAddressSuggestions(sugs);
          }
        })
        .catch(() => {})
        .finally(() => setIsGeocoding(false));
    } else {
      setAddressSuggestions([]);
    }
  };

  const handleSelectAddressSuggestion = (sug: { title: string; subtitle: string; lat: number; lng: number; city: string; country: string }) => {
    setForm({
      ...form,
      locationAddress: sug.title,
      locationCity: sug.city || form.locationCity,
      country: sug.country || form.country,
      latitude: sug.lat,
      longitude: sug.lng
    });
    setAddressSuggestions([]);
  };

  // Загрузка реальных фото с устройства
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        if (base64) {
          setForm((prev) => {
            const nextImgs = [...prev.images, base64];
            return {
              ...prev,
              images: nextImgs,
              coverImage: nextImgs[0] || ''
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (idx: number) => {
    setForm((prev) => {
      const nextImgs = prev.images.filter((_, i) => i !== idx);
      return {
        ...prev,
        images: nextImgs,
        coverImage: nextImgs[0] || ''
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.locationAddress.trim()) {
      setErr('Заполните название и точный адрес ретрита');
      return;
    }

    setSubmitting(true);
    setErr(null);
    try {
      const res = await api.retreats.create({
        ...form,
        images: form.images,
        coverImage: form.images[0] || ''
      });
      if (res?.data) {
        onCreated(res.data);
      } else {
        onCreated(res);
      }
    } catch (e: any) {
      setErr(e?.message || 'Ошибка публикации ретрита');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="retreat-modal-backdrop" onClick={onClose}>
      <div className="retreat-modal-window wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-icon" onClick={onClose}>
          <X size={18} />
        </button>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="modal-header-block">
            <h2>Создать новый ретрит</h2>
            <p className="modal-subtitle">Опубликуйте событие на интерактивной карте с интеграцией 2ГИС</p>
          </div>

          {err && (
            <div className="modal-alert-error">
              <AlertCircle size={16} />
              <span>{err}</span>
            </div>
          )}

          <div className="modal-field-group">
            <label>Название ретрита *</label>
            <div className="modal-input-wrap">
              <input
                type="text"
                placeholder="Йога и саундхилинг: Гармония внутри"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="modal-field-row-2">
            <div className="modal-field-group">
              <label>Город *</label>
              <div className="modal-input-wrap">
                <input
                  type="text"
                  placeholder="Караганда"
                  value={form.locationCity}
                  onChange={(e) => setForm({ ...form, locationCity: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="modal-field-group">
              <label>Категория</label>
              <div className="modal-input-wrap">
                <select
                  value={form.category}
                  onChange={(e) => {
                    const c = e.target.value;
                    const catMap: Record<string, string> = {
                      yoga: 'Йога & Пранаяма',
                      meditation: 'Медитация тишины',
                      art: 'Арт-терапия',
                      soundhealing: 'Саундхилинг',
                      spiritual: 'Места силы',
                      vipassana: 'Випассана',
                      nature: 'Природа & Походы'
                    };
                    setForm({ ...form, category: c, categoryTitle: catMap[c] || 'Ретрит' });
                  }}
                >
                  <option value="yoga">Йога & Пранаяма</option>
                  <option value="meditation">Медитация тишины</option>
                  <option value="art">Арт-терапия</option>
                  <option value="soundhealing">Саундхилинг</option>
                  <option value="spiritual">Места силы</option>
                  <option value="vipassana">Випассана</option>
                  <option value="nature">Природа & Походы</option>
                </select>
              </div>
            </div>
          </div>

          {/* Интеграция с 2ГИС и точный адрес */}
          <div className="modal-field-group address-autocomplete-group">
            <div className="address-label-row">
              <label>Точный адрес проведения *</label>
              <a
                href={`https://2gis.kz/search/${encodeURIComponent((form.locationAddress || 'Караганда') + ' ' + form.locationCity)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-check-2gis"
                title="Найти точное здание и организацию в 2ГИС"
              >
                <Navigation size={12} />
                <span>Проверить в 2ГИС ↗</span>
              </a>
            </div>
            <div className="modal-input-wrap">
              <MapPin size={16} />
              <input
                type="text"
                placeholder="пр. Бухар-Жырау 55, Эко-центр"
                value={form.locationAddress}
                onChange={handleAddressChange}
                required
              />
              {isGeocoding && <RefreshCw size={14} className="spin-icon" style={{ marginLeft: 8 }} />}
            </div>

            {/* Выпадающий список подсказок 2ГИС / Карты */}
            {addressSuggestions.length > 0 && (
              <div className="address-suggestions-dropdown">
                {addressSuggestions.map((sug, i) => (
                  <div
                    key={i}
                    className="address-suggestion-item"
                    onClick={() => handleSelectAddressSuggestion(sug)}
                  >
                    <MapPin size={14} className="sug-pin" />
                    <div className="sug-text">
                      <strong>{sug.title}</strong>
                      <span>{sug.subtitle}</span>
                    </div>
                    <span className="sug-2gis-tag">2ГИС</span>
                  </div>
                ))}
              </div>
            )}
            <span className="field-hint-text">Начните вводить адрес или проверьте объект в 2ГИС</span>
          </div>

          {/* Вместимость и стоимость */}
          <div className="modal-field-row-2">
            <div className="modal-field-group">
              <label>Количество мест (вместимость) *</label>
              <div className="modal-input-wrap">
                <Users size={16} />
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={form.maxSpots}
                  onChange={(e) => setForm({ ...form, maxSpots: Math.max(1, Number(e.target.value)) })}
                  required
                />
              </div>
              <span className="field-hint-text">Всего участников, сколько сможет принять ретрит</span>
            </div>

            <div className="modal-field-group">
              <label>Стоимость участия</label>
              <div className="modal-input-wrap">
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-field-row-2">
            <div className="modal-field-group">
              <label>Валюта</label>
              <div className="modal-input-wrap">
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  <option value="KZT">Тенге (₸)</option>
                  <option value="RUB">Рубли (₽)</option>
                  <option value="USD">Доллары ($)</option>
                  <option value="EUR">Евро (€)</option>
                </select>
              </div>
            </div>

            <div className="modal-field-group">
              <label>Длительность (дней)</label>
              <div className="modal-input-wrap">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={form.durationDays}
                  onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Загрузка фото и выбор обложки */}
          <div className="modal-field-group">
            <label>Фотографии ретрита (загрузка с устройства)</label>
            <div className="photo-upload-area">
              <input
                type="file"
                id="modal-retreat-file-upload"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="modal-retreat-file-upload" className="photo-upload-btn-label">
                <Upload size={16} />
                <span>Выбрать фотографии</span>
              </label>
              <span className="photo-upload-subtext">Загрузите реальные фото события или локации (первое фото станет обложкой)</span>
            </div>

            {/* Сетка загруженных фото */}
            {form.images.length > 0 && (
              <div className="uploaded-photos-grid">
                {form.images.map((imgUrl, idx) => (
                  <div key={idx} className={`photo-preview-item ${idx === 0 ? 'is-cover' : ''}`}>
                    <img src={imgUrl} alt={`Фото ${idx + 1}`} />
                    {idx === 0 && <span className="cover-badge">Обложка</span>}
                    <button
                      type="button"
                      className="btn-remove-photo"
                      onClick={() => handleRemovePhoto(idx)}
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-field-group">
            <label>Описание программы и практик</label>
            <div className="modal-input-wrap">
              <textarea
                placeholder="Расскажите об атмосфере, практиках, ведущих мастерах..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="modal-primary-btn" disabled={submitting}>
            {submitting ? 'Публикация...' : 'Опубликовать на карте'}
            <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

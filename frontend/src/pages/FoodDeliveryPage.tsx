import { useState } from 'react';
import { 
  UtensilsCrossed, MapPin, Search, Star, Clock, ShoppingBag, 
  X, Plus, Minus, ArrowRight, Check, Bike, Sparkles, Phone,
  CreditCard
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import './FoodDeliveryPage.css';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  minOrder: string;
  freeDeliveryThreshold: number;
  coverUrl: string;
  badge?: string;
}

interface Dish {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  weight: string;
  calories: string;
  imageUrl: string;
  category: string;
  isPopular?: boolean;
}

const RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'Додо & Неаполитана Пицца',
    cuisine: 'Пицца • Итальянская',
    rating: 4.9,
    deliveryTime: '25-35 мин',
    minOrder: '500 ₽',
    freeDeliveryThreshold: 800,
    coverUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
    badge: 'Топ выбор'
  },
  {
    id: 'rest-2',
    name: 'Cyber Burger Lab',
    cuisine: 'Бургеры • Стритфуд',
    rating: 4.85,
    deliveryTime: '20-30 мин',
    minOrder: '600 ₽',
    freeDeliveryThreshold: 900,
    coverUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
    badge: 'Хит сезона'
  },
  {
    id: 'rest-3',
    name: 'Сакура & Токио Wok',
    cuisine: 'Суши • Роллы • Азия',
    rating: 4.95,
    deliveryTime: '30-45 мин',
    minOrder: '700 ₽',
    freeDeliveryThreshold: 1000,
    coverUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=80',
    badge: 'Свежая рыба'
  },
  {
    id: 'rest-4',
    name: 'Zen Green & Superfoods',
    cuisine: 'Здоровая еда • Веган',
    rating: 4.9,
    deliveryTime: '25-35 мин',
    minOrder: '500 ₽',
    freeDeliveryThreshold: 750,
    coverUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
    badge: 'Эко & Веган'
  }
];

const DISHES: Dish[] = [
  {
    id: 'dish-1',
    restaurantId: 'rest-1',
    name: 'Пицца Трюфельная с моцареллой',
    description: 'Неаполитанское тесто 72ч ферментации, сливочный трюфельный соус, моцарелла фьор-ди-латте, лесные грибы.',
    price: 790,
    weight: '480 г',
    calories: '890 ккал',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
    category: 'Пицца',
    isPopular: true
  },
  {
    id: 'dish-2',
    restaurantId: 'rest-1',
    name: 'Пепперони Диабло 4 Сыра',
    description: 'Пряная чоризо, халапеньо, пармезан, горгонзола, моцарелла и домашний томатный соус сан-марцано.',
    price: 690,
    weight: '450 г',
    calories: '920 ккал',
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=80',
    category: 'Пицца',
    isPopular: true
  },
  {
    id: 'dish-3',
    restaurantId: 'rest-2',
    name: 'Black Angus Cyber Burger',
    description: 'Мраморная говядина Prime, карамелизированный лук, двойной чеддер, хрустящий бекон и соус барбекю с бурбоном.',
    price: 590,
    weight: '380 г',
    calories: '820 ккал',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
    category: 'Бургеры',
    isPopular: true
  },
  {
    id: 'dish-4',
    restaurantId: 'rest-2',
    name: 'Картофель фри с трюфельным пармезаном',
    description: 'Хрустящий золотистый картофель с солью fleur de sel, тертым грана падано и трюфельным айоли.',
    price: 320,
    weight: '200 г',
    calories: '340 ккал',
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
    category: 'Бургеры'
  },
  {
    id: 'dish-5',
    restaurantId: 'rest-3',
    name: 'Сет «Филадельфия Deluxe» (32 шт)',
    description: 'Лосось шоковой заморозки с Фарерских островов, сливочный сыр Cremette, авокадо хасс, икра тобико.',
    price: 1490,
    weight: '750 г',
    calories: '1100 ккал',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=80',
    category: 'Суши',
    isPopular: true
  },
  {
    id: 'dish-6',
    restaurantId: 'rest-3',
    name: 'Wok с тигровыми креветками & удон',
    description: 'Лапша удон ручной лепки, тигровые креветки, сладкий перец, ростки сои, кунжут и соус сладкий чили.',
    price: 620,
    weight: '360 г',
    calories: '540 ккал',
    imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=500&auto=format&fit=crop&q=80',
    category: 'Суши'
  },
  {
    id: 'dish-7',
    restaurantId: 'rest-4',
    name: 'Боул с лососем, киноа и эдамаме',
    description: 'Свежий слабосоленый лосось, киноа, авокадо, бобы эдамаме, чука, огурцы и соус понзу.',
    price: 580,
    weight: '340 г',
    calories: '430 ккал',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
    category: 'Здоровая еда',
    isPopular: true
  },
  {
    id: 'dish-8',
    restaurantId: 'rest-4',
    name: 'Зеленый детокс смузи Спирулина & Матча',
    description: 'Яблоко, шпинат, огурец, ананас, спирулина, японская церемониальная матча и семена чиа.',
    price: 350,
    weight: '300 мл',
    calories: '140 ккал',
    imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80',
    category: 'Здоровая еда'
  }
];

const CATEGORIES = ['Все', 'Пицца', 'Бургеры', 'Суши', 'Здоровая еда'];

export function FoodDeliveryPage() {
  const { formatPrice } = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<{ [dishId: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [currentAddress, setCurrentAddress] = useState<string>('Москва, Пресненская наб. 12, офис 402');
  const [promoCode, setPromoCode] = useState<string>('');
  const [isPromoApplied, setIsPromoApplied] = useState<boolean>(false);
  const [activeOrderModal, setActiveOrderModal] = useState<boolean>(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  const addToCart = (dishId: string) => {
    setCart(prev => ({ ...prev, [dishId]: (prev[dishId] || 0) + 1 }));
  };

  const removeFromCart = (dishId: string) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[dishId] > 1) {
        updated[dishId] -= 1;
      } else {
        delete updated[dishId];
      }
      return updated;
    });
  };

  const totalCartCount = Object.values(cart).reduce((sum, count) => sum + count, 0);

  const rawSubtotal = Object.entries(cart).reduce((sum, [id, count]) => {
    const dish = DISHES.find(d => d.id === id);
    return sum + (dish ? dish.price * count : 0);
  }, 0);

  const discount = isPromoApplied ? Math.round(rawSubtotal * 0.2) : 0;
  const deliveryCost = rawSubtotal >= 800 || rawSubtotal === 0 ? 0 : 190;
  const finalTotal = Math.max(0, rawSubtotal - discount + deliveryCost);

  const filteredDishes = DISHES.filter(d => {
    const matchCat = selectedCategory === 'Все' || d.category === selectedCategory;
    const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        d.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRest = !selectedRestaurantId || d.restaurantId === selectedRestaurantId;
    return matchCat && matchSearch && matchRest;
  });

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'NEWAGE') {
      setIsPromoApplied(true);
      alert('Промокод NEWAGE применён: скидка 20%!');
    } else {
      alert('Неверный промокод. Попробуйте промокод NEWAGE');
    }
  };

  const handleCreateOrder = () => {
    if (totalCartCount === 0) return;
    setIsCartOpen(false);
    setActiveOrderModal(true);
  };

  return (
    <div className="food-page">
      {/* Hero Banner */}
      <div className="food-hero">
        <div className="food-hero-glow" />
        <div className="food-hero-content">
          <div className="food-badge-pill">
            <Sparkles size={14} />
            <span>NEW AGE FOOD</span>
          </div>
          <h1 className="food-title">Доставка еды и рестораны</h1>
          <p className="food-subtitle">
            Любимые блюда из лучших заведений города. Быстрая доставка курьером за 25-35 минут прямо к вашей двери.
          </p>

          {/* Address & Quick Search */}
          <div className="food-top-bar">
            <div 
              className="food-address-picker" 
              onClick={() => {
                const newAddr = prompt('Введите адрес доставки:', currentAddress);
                if (newAddr) setCurrentAddress(newAddr);
              }}
              title="Изменить адрес доставки"
            >
              <MapPin size={16} color="#fbbf24" />
              <span>{currentAddress}</span>
            </div>

            <div className="food-search-wrap">
              <Search size={16} className="food-search-icon" />
              <input 
                type="text" 
                placeholder="Поиск пиццы, бургеров, суши, напитков..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="food-search-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="food-container">
        {/* Category Pills Rail */}
        <div className="food-category-rail">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`food-category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedRestaurantId(null);
              }}
            >
              <span>{cat === 'Пицца' ? '🍕' : cat === 'Бургеры' ? '🍔' : cat === 'Суши' ? '🍣' : cat === 'Здоровая еда' ? '🥗' : '🍽️'}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Featured Restaurants */}
        <section>
          <div className="food-section-title">
            <span>Рестораны с быстрой доставкой</span>
            {selectedRestaurantId && (
              <button 
                style={{ fontSize: '0.85rem', color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setSelectedRestaurantId(null)}
              >
                Показать все рестораны
              </button>
            )}
          </div>

          <div className="restaurants-grid">
            {RESTAURANTS.map(rest => (
              <div 
                key={rest.id} 
                className={`restaurant-card ${selectedRestaurantId === rest.id ? 'selected-restaurant' : ''}`}
                onClick={() => setSelectedRestaurantId(selectedRestaurantId === rest.id ? null : rest.id)}
              >
                <div className="restaurant-cover-wrap">
                  <img src={rest.coverUrl} alt={rest.name} className="restaurant-cover-img" />
                  <span className="restaurant-time-tag">
                    <Clock size={12} />
                    <span>{rest.deliveryTime}</span>
                  </span>
                  <span className="restaurant-rating-tag">
                    <Star size={12} fill="#facc15" />
                    <span>{rest.rating}</span>
                  </span>
                </div>

                <div className="restaurant-info">
                  <h3 className="restaurant-name">{rest.name}</h3>
                  <div className="restaurant-meta-row">
                    <span>{rest.cuisine}</span>
                    <span className="free-delivery-badge">От {formatPrice(rest.freeDeliveryThreshold)} бесплатно</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Menu & Dishes */}
        <section>
          <h2 className="food-section-title">Меню и популярные блюда</h2>

          <div className="dishes-grid">
            {filteredDishes.map(dish => {
              const qty = cart[dish.id] || 0;
              return (
                <div key={dish.id} className="dish-card">
                  <div className="dish-thumb-wrap">
                    <img src={dish.imageUrl} alt={dish.name} className="dish-thumb-img" />
                    <span className="dish-weight-tag">{dish.weight} • {dish.calories}</span>
                  </div>

                  <div className="dish-body">
                    <h3 className="dish-title">{dish.name}</h3>
                    <p className="dish-desc">{dish.description}</p>

                    <div className="dish-footer">
                      <span className="dish-price">{formatPrice(dish.price)}</span>
                      
                      {qty === 0 ? (
                        <button className="dish-add-btn" onClick={() => addToCart(dish.id)}>
                          <Plus size={15} />
                          <span>В корзину</span>
                        </button>
                      ) : (
                        <div className="dish-qty-stepper">
                          <button className="stepper-btn" onClick={() => removeFromCart(dish.id)}><Minus size={14} /></button>
                          <span className="stepper-count">{qty}</span>
                          <button className="stepper-btn" onClick={() => addToCart(dish.id)}><Plus size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Floating Sticky Cart Button */}
      {totalCartCount > 0 && (
        <div className="floating-cart-pill" onClick={() => setIsCartOpen(true)}>
          <div className="cart-pill-count">{totalCartCount}</div>
          <ShoppingBag size={20} />
          <span className="cart-pill-price">{formatPrice(finalTotal)}</span>
          <ArrowRight size={18} />
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="cart-drawer-backdrop" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h3 className="cart-drawer-title">Корзина заказа ({totalCartCount})</h3>
              <button className="cart-close-btn" onClick={() => setIsCartOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="cart-items-scroll">
              {Object.entries(cart).map(([dishId, count]) => {
                const dish = DISHES.find(d => d.id === dishId);
                if (!dish) return null;
                return (
                  <div key={dishId} className="cart-item-card">
                    <div className="cart-item-info">
                      <img src={dish.imageUrl} alt={dish.name} className="cart-item-thumb" />
                      <div>
                        <h4 className="cart-item-title">{dish.name}</h4>
                        <span className="cart-item-price">{formatPrice(dish.price * count)}</span>
                      </div>
                    </div>

                    <div className="dish-qty-stepper">
                      <button className="stepper-btn" onClick={() => removeFromCart(dishId)}><Minus size={12} /></button>
                      <span className="stepper-count">{count}</span>
                      <button className="stepper-btn" onClick={() => addToCart(dishId)}><Plus size={12} /></button>
                    </div>
                  </div>
                );
              })}

              {/* Promo Code Input */}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Промокод (NEWAGE)" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.8rem',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
                <button 
                  onClick={handleApplyPromo}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: '#f59e0b',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Применить
                </button>
              </div>

              {/* Delivery Address Review */}
              <div style={{
                marginTop: '1rem',
                padding: '0.8rem',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
                  <MapPin size={14} color="#f59e0b" />
                  <span>Адрес доставки:</span>
                </div>
                <span style={{ color: 'var(--color-text-secondary)' }}>{currentAddress}</span>
              </div>
            </div>

            <div className="cart-drawer-footer">
              <div className="cart-summary-line">
                <span>Сумма блюд:</span>
                <span>{formatPrice(rawSubtotal)}</span>
              </div>
              {isPromoApplied && (
                <div className="cart-summary-line" style={{ color: '#10b981' }}>
                  <span>Скидка промокод (20%):</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="cart-summary-line">
                <span>Доставка:</span>
                <span>{deliveryCost === 0 ? 'Бесплатно' : formatPrice(deliveryCost)}</span>
              </div>
              <div className="cart-summary-line total">
                <span>Итого к оплате:</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>

              <button className="btn-checkout-order" onClick={handleCreateOrder}>
                <CreditCard size={18} />
                <span>Оплатить {formatPrice(finalTotal)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Order Tracker Modal */}
      {activeOrderModal && (
        <div className="tracker-modal-backdrop">
          <div className="tracker-modal-card">
            <div className="tracker-badge-status">
              <Check size={14} />
              <span>ЗАКАЗ №4821 ПРИНЯТ</span>
            </div>

            <h2>Курьер уже мчит к вам!</h2>
            <div className="tracker-eta-time">~24 мин</div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Доставка на {currentAddress}
            </p>

            {/* Steps Progress */}
            <div className="tracker-steps-bar">
              <div className="tracker-step-item">
                <div className="tracker-step-circle active"><Check size={18} /></div>
                <span className="tracker-step-label">Принят</span>
              </div>
              <div className="tracker-step-item">
                <div className="tracker-step-circle active"><UtensilsCrossed size={18} /></div>
                <span className="tracker-step-label">Готовится</span>
              </div>
              <div className="tracker-step-item">
                <div className="tracker-step-circle active" style={{ background: '#f59e0b', borderColor: '#f59e0b' }}><Bike size={18} /></div>
                <span className="tracker-step-label">В пути</span>
              </div>
            </div>

            <div style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Bike size={20} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Курьер Артём</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>На электросамокате • 4.95 ⭐</div>
                </div>
              </div>
              <button 
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}
                onClick={() => alert('Связь с курьером установлена: +7 (999) 000-24-24')}
              >
                <Phone size={14} />
                <span>Позвонить</span>
              </button>
            </div>

            <button 
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '10px',
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              onClick={() => {
                setActiveOrderModal(false);
                setCart({});
              }}
            >
              Понятно, ждать доставку
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

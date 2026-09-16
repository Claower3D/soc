import { useState, useMemo } from 'react';
import { 
  Search, ShoppingBag, Star, ArrowUpDown, Sparkles, Plus 
} from 'lucide-react';
import { initialProducts, type Product, type CartItem } from '../data/mock';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { CartDrawer } from '../components/CartDrawer';
import { CreateProductModal } from '../components/CreateProductModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import './MarketplacePage.css';

const CATEGORIES = [
  'Все товары',
  'Электроника',
  'Книги',
  'Аксессуары',
  'Одежда и стиль',
  'Цифровые товары',
  'Ручная работа'
];

export function MarketplacePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все товары');
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc' | 'rating'>('popular');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);

  const handleAddProduct = (newProd: Product) => {
    setProductsList(prev => [newProd, ...prev]);
    initialProducts.unshift(newProd);
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      const matchesQuery = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = selectedCategory === 'Все товары' || p.category === selectedCategory;
      return matchesQuery && matchesCat;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.reviewsCount - a.reviewsCount; // popular
    });
  }, [productsList, searchQuery, selectedCategory, sortBy]);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  if (!isAuthenticated) {
    return (
      <div className="marketplace-page">
        <div className="messenger-guest-lock-container">
          <GuestLockPrompt
            featureName="Маркетплейс New Age"
            title="Маркетплейс доступен после регистрации"
            description="Покупайте мерч, книги, цифровые товары у любимых авторов с безопасной оплатой через внутренний кошелек New Age Pay."
            actionText="Войти или зарегистрироваться"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-page">
      {/* Top Banner & Search */}
      <div className="market-hero-card">
        <div className="market-hero-content">
          <div className="market-badge">
            <Sparkles size={14} /> Внутренний маркетплейс New Age
          </div>
          <h1>Покупайте товары у любимых авторов и проверенных брендов</h1>
          <p>
            Эксклюзивный мерч, книги, гаджеты и аксессуары с безопасной оплатой через внутренний кошелёк платформы.
          </p>
        </div>

        <div className="market-search-row">
          <div className="market-search-input-box">
            <Search size={18} className="market-search-icon" />
            <input 
              type="text" 
              placeholder="Поиск товаров, брендов или категорий..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="market-actions-group">
            <button 
              type="button" 
              className="market-add-product-btn"
              onClick={() => setIsCreateProductOpen(true)}
              title="Разместить свой товар"
            >
              <Plus size={18} />
              <span>Добавить товар</span>
            </button>

            <button 
              type="button" 
              className="market-cart-trigger"
              onClick={() => setIsCartOpen(true)}
              title="Открыть корзину"
            >
              <ShoppingBag size={20} />
              <span className="cart-trigger-label">Корзина</span>
              {totalCartCount > 0 && (
                <span className="cart-badge-count">{totalCartCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="market-controls-row">
        <div className="market-categories-scroll">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              className={`cat-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="market-sort-box">
          <ArrowUpDown size={15} className="sort-icon" />
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="popular">По популярности</option>
            <option value="price_asc">Сначала дешевле</option>
            <option value="price_desc">Сначала дороже</option>
            <option value="rating">Высокий рейтинг</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="marketplace-grid">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="market-card"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="market-card-img-box">
                <img src={product.images[0]} alt={product.title} />
                <span className="market-cat-badge">{product.category}</span>
                {product.oldPrice && (
                  <span className="market-discount-badge">
                    -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                  </span>
                )}
              </div>

              <div className="market-card-body">
                <div 
                  className="market-seller-row"
                  onClick={e => { e.stopPropagation(); navigate(`/profile/${product.seller.id}`); }}
                >
                  <img src={product.seller.avatar} alt={product.seller.name} className="mini-seller-avatar" />
                  <span className="mini-seller-name">{product.seller.name}</span>
                </div>

                <h3 className="market-item-title">{product.title}</h3>

                <div className="market-rating-row">
                  <Star size={13} fill="#F59E0B" color="#F59E0B" />
                  <strong>{product.rating}</strong>
                  <span className="market-reviews">({product.reviewsCount})</span>
                </div>

                <div className="market-price-row">
                  <div className="market-price-values">
                    <span className="market-main-price">{formatPrice(product.price)}</span>
                    {product.oldPrice && (
                      <span className="market-old-price">{formatPrice(product.oldPrice)}</span>
                    )}
                  </div>
                  <button 
                    type="button" 
                    className="market-btn-add"
                    onClick={e => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    title="Добавить в корзину"
                  >
                    <ShoppingBag size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="market-empty-view">
          <ShoppingBag size={56} className="empty-market-icon" />
          <h3>Товары не найдены</h3>
          <p>Попробуйте изменить запрос в строке поиска или выбрать другую категорию</p>
          <button 
            type="button" 
            className="btn-reset-filters"
            onClick={() => { setSearchQuery(''); setSelectedCategory('Все товары'); }}
          >
            Сбросить фильтры
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={isCreateProductOpen}
        onClose={() => setIsCreateProductOpen(false)}
        onCreateProduct={handleAddProduct}
      />
    </div>
  );
}

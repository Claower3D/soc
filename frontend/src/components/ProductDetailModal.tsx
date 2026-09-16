import { useState } from 'react';
import { 
  X, Star, MessageCircle, ShoppingBag, Truck, ShieldCheck, 
  ChevronRight, CheckCircle2 
} from 'lucide-react';
import { type Product } from '../data/mock';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import './ProductDetailModal.css';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart
}) => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleContactSeller = () => {
    onClose();
    navigate('/messenger');
  };

  return (
    <div className="product-modal-backdrop" onClick={onClose}>
      <div className="product-modal-card" onClick={e => e.stopPropagation()}>
        <button className="product-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="product-modal-grid">
          {/* Left: Gallery */}
          <div className="product-gallery-col">
            <div className="product-main-image-wrap">
              <img 
                src={product.images[selectedImgIndex] || product.images[0]} 
                alt={product.title} 
                className="product-main-image"
              />
              <span className="product-badge-cat">{product.category}</span>
            </div>

            {product.images.length > 1 && (
              <div className="product-thumbs-row">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    className={`product-thumb-btn ${selectedImgIndex === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImgIndex(idx)}
                  >
                    <img src={img} alt="Превью" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info & Checkout */}
          <div className="product-info-col">
            <div className="product-seller-banner" onClick={() => { onClose(); navigate(`/profile/${product.seller.id}`); }}>
              <img src={product.seller.avatar} alt={product.seller.name} className="seller-avatar" />
              <div className="seller-info">
                <span className="seller-name">{product.seller.name}</span>
                <span className="seller-role">Продавец • {product.seller.businessCategory || 'Магазин'}</span>
              </div>
              <ChevronRight size={16} className="seller-arrow" />
            </div>

            <h1 className="product-title">{product.title}</h1>

            <div className="product-rating-row">
              <div className="stars-pill">
                <Star size={15} fill="#F59E0B" color="#F59E0B" />
                <strong>{product.rating}</strong>
              </div>
              <span className="reviews-count">({product.reviewsCount} отзывов)</span>
              <span className="stock-status in-stock">
                <CheckCircle2 size={14} /> В наличии: {product.stockCount} шт.
              </span>
            </div>

            <div className="product-price-box">
              <div className="price-values">
                <span className="main-price">{formatPrice(product.price)}</span>
                {product.oldPrice && (
                  <span className="striked-price">{formatPrice(product.oldPrice)}</span>
                )}
              </div>
              {product.oldPrice && (
                <span className="discount-tag">
                  -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                </span>
              )}
            </div>

            <p className="product-description">{product.description}</p>

            {product.specs && (
              <div className="product-specs-box">
                <h4>Характеристики</h4>
                <div className="specs-list">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="spec-row">
                      <span className="spec-key">{key}</span>
                      <span className="spec-dots" />
                      <span className="spec-val">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="product-guarantees">
              <div className="guarantee-item">
                <Truck size={18} />
                <span>Быстрая доставка курьером или в ПВЗ</span>
              </div>
              <div className="guarantee-item">
                <ShieldCheck size={18} />
                <span>Безопасная сделка через кошелёк New Age</span>
              </div>
            </div>

            {/* Actions */}
            <div className="product-actions-bar">
              <div className="quantity-counter">
                <button 
                  type="button" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button 
                  type="button" 
                  onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                  disabled={quantity >= product.stockCount}
                >
                  +
                </button>
              </div>

              <button 
                type="button" 
                className={`btn-add-cart ${isAdded ? 'added' : ''}`}
                onClick={handleAddToCart}
              >
                <ShoppingBag size={18} />
                {isAdded ? 'Добавлено!' : `В корзину • ${formatPrice(product.price * quantity)}`}
              </button>

              <button 
                type="button" 
                className="btn-chat-seller"
                onClick={handleContactSeller}
                title="Написать продавцу в мессенджер"
              >
                <MessageCircle size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

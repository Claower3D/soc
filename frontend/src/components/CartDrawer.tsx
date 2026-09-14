import { useState } from 'react';
import { 
  X, Trash2, ShoppingBag, ArrowRight, CheckCircle2, 
  CreditCard, Wallet, MapPin 
} from 'lucide-react';
import { type CartItem } from '../data/mock';
import './CartDrawer.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  const [address, setAddress] = useState('Санкт-Петербург, Невский проспект, д. 45, кв. 12');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [orderPlaced, setOrderPlaced] = useState(false);

  if (!isOpen) return null;

  const totalAmount = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderPlaced(true);
    setTimeout(() => {
      onClearCart();
      setOrderPlaced(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="cart-drawer-backdrop" onClick={onClose}>
      <div className="cart-drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="cart-drawer-header">
          <div className="cart-title-row">
            <ShoppingBag size={20} className="cart-icon" />
            <h3>Корзина ({items.length})</h3>
          </div>
          <button className="cart-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {orderPlaced ? (
          <div className="order-success-state">
            <CheckCircle2 size={64} className="order-success-icon" />
            <h3>Заказ успешно оформлен!</h3>
            <p>Сумма: <strong>{totalAmount.toLocaleString('ru-RU')} ₽</strong></p>
            <p className="order-address-hint">Доставка по адресу: {address}</p>
            <span className="order-status-pill">Оплачено через {paymentMethod === 'wallet' ? 'Кошелёк New Age' : 'Карту'}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-empty-state">
            <ShoppingBag size={48} className="empty-icon" />
            <h4>Ваша корзина пуста</h4>
            <p>Выберите интересующие товары в маркетплейсе New Age</p>
            <button className="btn-browse-shop" onClick={onClose}>
              Перейти к покупкам
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <div className="cart-items-list">
              {items.map(item => (
                <div key={item.product.id} className="cart-item-row">
                  <img src={item.product.images[0]} alt={item.product.title} className="cart-item-img" />
                  <div className="cart-item-info">
                    <h4>{item.product.title}</h4>
                    <span className="cart-seller-name">Продавец: {item.product.seller.name}</span>
                    <span className="cart-item-price">{(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
                  </div>

                  <div className="cart-item-actions">
                    <div className="cart-qty-counter">
                      <button type="button" onClick={() => onUpdateQuantity(item.product.id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => onUpdateQuantity(item.product.id, 1)}>+</button>
                    </div>
                    <button 
                      type="button" 
                      className="cart-btn-remove" 
                      onClick={() => onRemoveItem(item.product.id)}
                      title="Удалить из корзины"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleCheckout} className="cart-checkout-footer">
              <div className="checkout-field">
                <label><MapPin size={14} /> Адрес доставки</label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  required 
                />
              </div>

              <div className="checkout-field">
                <label>Способ оплаты</label>
                <div className="payment-options-row">
                  <button 
                    type="button" 
                    className={`pay-opt-btn ${paymentMethod === 'wallet' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('wallet')}
                  >
                    <Wallet size={16} /> Кошелёк New Age
                  </button>
                  <button 
                    type="button" 
                    className={`pay-opt-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard size={16} /> Картой онлайн
                  </button>
                </div>
              </div>

              <div className="cart-summary-box">
                <div className="summary-row">
                  <span>Товары ({items.reduce((c, i) => c + i.quantity, 0)} шт.)</span>
                  <span>{totalAmount.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="summary-row">
                  <span>Доставка New Age</span>
                  <span className="free-delivery">Бесплатно</span>
                </div>
                <div className="summary-total-row">
                  <strong>Итого к оплате</strong>
                  <strong>{totalAmount.toLocaleString('ru-RU')} ₽</strong>
                </div>
              </div>

              <button type="submit" className="btn-order-submit">
                Оформить заказ <ArrowRight size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

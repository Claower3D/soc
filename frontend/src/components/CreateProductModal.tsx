import React, { useState, useRef } from 'react';
import { X, ShoppingBag, Image as ImageIcon, Sparkles, Tag, Layers, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { type Product } from '../data/mock';
import './CreateProductModal.css';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProduct: (newProduct: Product) => void;
}

const PRODUCT_CATEGORIES = [
  'Электроника',
  'Книги',
  'Аксессуары',
  'Одежда и стиль',
  'Цифровые товары',
  'Ручная работа',
];

const SAMPLE_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
];

export function CreateProductModal({ isOpen, onClose, onCreateProduct }: CreateProductModalProps) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [tags, setTags] = useState('');
  const [stockCount, setStockCount] = useState('10');
  const [selectedImage, setSelectedImage] = useState<string>(SAMPLE_PRODUCT_IMAGES[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || isNaN(Number(price))) return;

    const parsedPrice = Math.max(0, Number(price));
    const parsedOldPrice = oldPrice ? Math.max(0, Number(oldPrice)) : undefined;

    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Описание товара от автора',
      price: parsedPrice,
      oldPrice: parsedOldPrice,
      images: [selectedImage],
      seller: currentUser,
      category,
      rating: 5.0,
      reviewsCount: 1,
      inStock: true,
      stockCount: Number(stockCount) || 10,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean).length > 0
        ? tags.split(',').map(t => t.trim()).filter(Boolean)
        : [category, 'New Age'],
      createdAt: new Date().toISOString().split('T')[0],
    };

    onCreateProduct(newProduct);
    setTitle('');
    setDescription('');
    setPrice('');
    setOldPrice('');
    setTags('');
    onClose();
  };

  return (
    <div className="create-product-overlay" onClick={onClose}>
      <div className="create-product-modal" onClick={e => e.stopPropagation()}>
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="create-product-header">
          <div className="create-product-title-row">
            <ShoppingBag size={20} className="product-header-icon" />
            <h3>Добавить товар на маркетплейс</h3>
          </div>
          <button className="create-product-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-product-form">
          <div className="product-form-grid">
            {/* Left: Image Upload & Preview */}
            <div className="product-image-side">
              <label className="product-field-label">Фотография товара</label>
              <div className="product-preview-box">
                <img src={selectedImage} alt="Превью товара" />
                <button
                  type="button"
                  className="product-change-img-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={15} /> Загрузить свое фото
                </button>
              </div>

              <div className="product-samples-gallery">
                <span className="product-samples-hint">Или выберите готовый образец:</span>
                <div className="product-samples-list">
                  {SAMPLE_PRODUCT_IMAGES.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Образец ${i}`}
                      className={`sample-thumb ${selectedImage === img ? 'active' : ''}`}
                      onClick={() => setSelectedImage(img)}
                    />
                  ))}
                </div>
              </div>

              <div className="seller-badge-preview">
                <img src={currentUser.avatar} alt={currentUser.name} className="seller-avatar" />
                <div className="seller-meta">
                  <span className="seller-name">{currentUser.name}</span>
                  <span className="seller-role">Продавец (Маркетплейс)</span>
                </div>
              </div>
            </div>

            {/* Right: Form Inputs */}
            <div className="product-fields-side">
              <div className="product-field-group">
                <label className="product-field-label">Название товара *</label>
                <input
                  type="text"
                  placeholder="Например: Авторский мерч худи New Age 2026"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="product-input"
                  required
                />
              </div>

              <div className="product-prices-row">
                <div className="product-field-group">
                  <label className="product-field-label">
                    <DollarSign size={14} /> Цена (₽) *
                  </label>
                  <input
                    type="number"
                    placeholder="3500"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="product-input"
                    required
                    min="1"
                  />
                </div>
                <div className="product-field-group">
                  <label className="product-field-label">Старая цена (₽)</label>
                  <input
                    type="number"
                    placeholder="4200"
                    value={oldPrice}
                    onChange={e => setOldPrice(e.target.value)}
                    className="product-input"
                    min="1"
                  />
                </div>
              </div>

              <div className="product-prices-row">
                <div className="product-field-group">
                  <label className="product-field-label">
                    <Layers size={14} /> Категория
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="product-select"
                  >
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="product-field-group">
                  <label className="product-field-label">Кол-во на складе</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={stockCount}
                    onChange={e => setStockCount(e.target.value)}
                    className="product-input"
                    min="1"
                  />
                </div>
              </div>

              <div className="product-field-group">
                <label className="product-field-label">Описание товара</label>
                <textarea
                  placeholder="Опишите особенности, материалы, комплектацию или инструкцию..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="product-textarea"
                  rows={3}
                />
              </div>

              <div className="product-field-group">
                <label className="product-field-label">
                  <Tag size={14} /> Теги (через запятую)
                </label>
                <input
                  type="text"
                  placeholder="Мерч, Одежда, Хлопок, New Age"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="product-input"
                />
              </div>
            </div>
          </div>

          <div className="create-product-footer">
            <button type="button" className="btn-cancel-product" onClick={onClose}>
              Отмена
            </button>
            <button
              type="submit"
              className="btn-submit-product"
              disabled={!title.trim() || !price}
            >
              <Sparkles size={16} /> Разместить товар
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

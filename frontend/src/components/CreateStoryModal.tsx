import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Sparkles, Type, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { type Story } from '../data/mock';
import './CreateStoryModal.css';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStory: (newStory: Story) => void;
}

const STORY_PRESETS = [
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
];

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
  'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
];

export function CreateStoryModal({ isOpen, onClose, onCreateStory }: CreateStoryModalProps) {
  const { currentUser } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string>(STORY_PRESETS[0]);
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null);
  const [storyText, setStoryText] = useState('');
  const [textPosition, setTextPosition] = useState<'center' | 'bottom' | 'top'>('center');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setSelectedGradient(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage && !selectedGradient && !storyText.trim()) return;

    const newStory: Story = {
      id: `story_${Date.now()}`,
      user: currentUser,
      viewed: false,
      image: selectedImage || undefined,
      timestamp: 'РўРѕР»СЊРєРѕ С‡С‚Рѕ',
    };

    onCreateStory(newStory);
    setStoryText('');
    onClose();
  };

  return (
    <div className="create-story-overlay" onClick={onClose}>
      <div className="create-story-modal" onClick={e => e.stopPropagation()}>
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Header */}
        <div className="create-story-header">
          <div className="create-story-title-row">
            <Camera size={20} className="story-header-icon" />
            <h3>РќРѕРІР°СЏ РёСЃС‚РѕСЂРёСЏ</h3>
          </div>
          <button className="create-story-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Story Preview & Canvas Area */}
        <div className="create-story-body">
          <div 
            className="story-preview-phone"
            style={{ 
              background: selectedGradient ? selectedGradient : `url(${selectedImage}) center/cover no-repeat` 
            }}
          >
            {/* Top Author Badge */}
            <div className="story-preview-header">
              <div className="story-author-info">
                <img src={currentUser.avatar} alt={currentUser.name} className="story-author-avatar" />
                <div className="story-author-text">
                  <span className="story-author-name">{currentUser.name}</span>
                  <span className="story-author-tag">Р’Р°С€Р° РёСЃС‚РѕСЂРёСЏ</span>
                </div>
              </div>
            </div>

            {/* Overlay Text */}
            {storyText && (
              <div className={`story-text-overlay pos-${textPosition}`}>
                <p>{storyText}</p>
              </div>
            )}
          </div>

          {/* Controls Side Column */}
          <div className="create-story-controls">
            {/* Upload Custom Photo Button */}
            <div className="control-group">
              <label className="control-group-title">Р¤РѕС‚РѕРіСЂР°С„РёСЏ РёСЃС‚РѕСЂРёРё</label>
              <button 
                type="button" 
                className="upload-story-btn" 
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={18} />
                <span>Р—Р°РіСЂСѓР·РёС‚СЊ СЃ СѓСЃС‚СЂРѕР№СЃС‚РІР°</span>
              </button>
            </div>

            {/* Presets Gallery */}
            <div className="control-group">
              <label className="control-group-title">РР»Рё РІС‹Р±РµСЂРёС‚Рµ С„РѕРЅ:</label>
              <div className="story-presets-grid">
                {STORY_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`preset-thumb ${selectedImage === preset && !selectedGradient ? "active" : ""}`}
                    onClick={() => {
                      setSelectedImage(preset);
                      setSelectedGradient(null);
                    }}
                  >
                    <img src={preset} alt={`Пресет ${idx}`} />
                    {selectedImage === preset && !selectedGradient && (
                      <div className="preset-check"><Check size={12} /></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Gradients */}
            <div className="control-group">
              <label className="control-group-title">Р“СЂР°РґРёРµРЅС‚РЅС‹Рµ С„РѕРЅС‹:</label>
              <div className="gradient-presets-row">
                {GRADIENT_PRESETS.map((grad, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`grad-circle ${selectedGradient === grad ? "active" : ""}`}
                    style={{ background: grad }}
                    onClick={() => setSelectedGradient(grad)}
                  />
                ))}
              </div>
            </div>

            {/* Overlay Caption Input */}
            <div className="control-group">
              <div className="text-header-row">
                <label className="control-group-title">
                  <Type size={14} /> РўРµРєСЃС‚ РЅР° РёСЃС‚РѕСЂРёРё
                </label>
                <div className="pos-buttons">
                  <button 
                    type="button" 
                    className={`pos-btn ${textPosition === "top" ? "active" : ""}`}
                    onClick={() => setTextPosition('top')}
                    title="РЎРІРµСЂС…Сѓ"
                  >
                    Р’РІРµСЂС…
                  </button>
                  <button 
                    type="button" 
                    className={`pos-btn ${textPosition === "center" ? "active" : ""}`}
                    onClick={() => setTextPosition('center')}
                    title="РџРѕ С†РµРЅС‚СЂСѓ"
                  >
                    Р¦РµРЅС‚СЂ
                  </button>
                  <button 
                    type="button" 
                    className={`pos-btn ${textPosition === "bottom" ? "active" : ""}`}
                    onClick={() => setTextPosition('bottom')}
                    title="Р’РЅРёР·Сѓ"
                  >
                    РќРёР·
                  </button>
                </div>
              </div>
              <textarea
                placeholder="Р”РѕР±Р°РІСЊС‚Рµ РїРѕРґРїРёСЃСЊ, СЃС‚РёРєРµСЂ РёР»Рё РјС‹СЃР»СЊ Рє РёСЃС‚РѕСЂРёРё..."
                value={storyText}
                onChange={e => setStoryText(e.target.value)}
                maxLength={140}
                rows={3}
                className="story-caption-textarea"
              />
              <span className="caption-char-count">{storyText.length}/140</span>
            </div>

            {/* Action Buttons */}
            <div className="story-actions-footer">
              <button type="button" className="btn-cancel-story" onClick={onClose}>
                РћС‚РјРµРЅР°
              </button>
              <button 
                type="button" 
                className="btn-publish-story"
                onClick={handlePublish}
              >
                <Sparkles size={16} /> РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ РёСЃС‚РѕСЂРёСЋ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

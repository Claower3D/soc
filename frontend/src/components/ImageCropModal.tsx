import { useRef } from 'react';
import './ImageCropModal.css';

interface ImageCropModalProps {
  imageUrl: string;
  onCrop: (croppedUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropModal({ imageUrl, onCrop, onCancel }: ImageCropModalProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  const handleSave = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    
    // We crop a square from the center
    const size = Math.min(img.naturalWidth, img.naturalHeight);
    const startX = (img.naturalWidth - size) / 2;
    const startY = (img.naturalHeight - size) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);
    const croppedUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCrop(croppedUrl);
  };

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal-content">
        <h3 className="crop-modal-title">Выбор миниатюры</h3>
        <div className="crop-image-container">
          <img ref={imageRef} src={imageUrl} alt="Crop preview" className="crop-image-preview" />
          <div className="crop-overlay-box"></div>
        </div>
        <div className="crop-modal-actions">
          <button className="crop-btn-cancel" onClick={onCancel}>Отмена</button>
          <button className="crop-btn-save" onClick={handleSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

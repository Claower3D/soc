import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import './ImageCropModal.css';

interface ImageCropModalProps {
  imageUrl: string;
  onCrop: (croppedUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropModal({ imageUrl, onCrop, onCancel }: ImageCropModalProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (imageLoaded && imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const size = Math.min(img.clientWidth, img.clientHeight) * 0.8;
      setCrop({
        x: (img.clientWidth - size) / 2,
        y: (img.clientHeight - size) / 2,
        size
      });
    }
  }, [imageLoaded]);

  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setInitialCrop({ x: crop.x, y: crop.y });
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging || !imageRef.current) return;
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    
    let newX = initialCrop.x + dx;
    let newY = initialCrop.y + dy;
    
    // Constrain to image bounds
    const maxX = imageRef.current.clientWidth - crop.size;
    const maxY = imageRef.current.clientHeight - crop.size;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    setCrop(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    
    // Calculate actual image crop coordinates based on displayed size vs natural size
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    
    const canvas = document.createElement('canvas');
    const size = crop.size * scaleX; // Assuming square crop and uniform scaling
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      img,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.size * scaleX,
      crop.size * scaleY,
      0,
      0,
      size,
      size
    );
    
    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal-container">
        <button className="crop-close-btn" onClick={onCancel}>
          <X size={20} color="#fff" />
        </button>
        
        <div className="crop-modal-content">
          <h3 className="crop-modal-title">Выбор миниатюры</h3>
          
          <div 
            className="crop-workspace" 
            ref={containerRef}
            onMouseMove={e => isDragging && handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchMove={e => isDragging && handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handlePointerUp}
          >
            <img 
              ref={imageRef} 
              src={imageUrl} 
              alt="Crop" 
              className="crop-image" 
              onLoad={() => setImageLoaded(true)}
              draggable={false}
            />
            
            {imageLoaded && (
              <div className="crop-overlay">
                <div className="crop-mask-dark top" style={{ height: crop.y }} />
                <div className="crop-mask-dark bottom" style={{ top: crop.y + crop.size }} />
                <div className="crop-mask-dark left" style={{ top: crop.y, height: crop.size, width: crop.x }} />
                <div className="crop-mask-dark right" style={{ top: crop.y, height: crop.size, left: crop.x + crop.size }} />
                
                <div 
                  className="crop-selector"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.size,
                    height: crop.size
                  }}
                  onMouseDown={e => handlePointerDown(e.clientX, e.clientY)}
                  onTouchStart={e => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
                >
                  <div className="crop-circle-mask"></div>
                  <div className="crop-handle tl"></div>
                  <div className="crop-handle tr"></div>
                  <div className="crop-handle bl"></div>
                  <div className="crop-handle br"></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="crop-modal-actions">
            <button className="crop-btn-cancel" onClick={onCancel}>Отмена</button>
            <button className="crop-btn-save" onClick={handleSave}>Сохранить</button>
          </div>
        </div>
      </div>
    </div>
  );
}

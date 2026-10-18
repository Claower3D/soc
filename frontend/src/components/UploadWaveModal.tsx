import { useEffect, useState } from 'react';
import { Zap, Loader2, Video as VideoIcon } from 'lucide-react';
import './UploadWaveModal.css';

interface UploadWaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoFile: File | null;
  description: string;
  setDescription: (desc: string) => void;
  onPublish: () => void;
  isPublishing?: boolean;
}

export function UploadWaveModal({
  isOpen,
  onClose,
  videoFile,
  description,
  setDescription,
  onPublish,
  isPublishing = false
}: UploadWaveModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl('');
    }
  }, [videoFile]);

  if (!isOpen || !videoFile) return null;

  return (
    <div className="wave-modal-overlay">
      <div className="wave-modal-content">
        <h2 className="wave-modal-title">Запустить волну</h2>
        
        {previewUrl && (
          <div className="wave-preview-box">
            <video
              src={previewUrl}
              className="wave-preview-video"
              muted
              autoPlay
              loop
              playsInline
            />
            <div className="wave-preview-badge">
              <VideoIcon size={12} />
              <span>Предпросмотр</span>
            </div>
          </div>
        )}

        <div className="wave-file-info">
          <span className="wave-file-icon">⚡</span>
          <span className="wave-file-name">{videoFile.name}</span>
          <span className="wave-file-size">({(videoFile.size / (1024 * 1024)).toFixed(1)} МБ)</span>
        </div>

        <textarea
          className="wave-desc-input"
          placeholder="Описание волны... (необязательно, можно с #тегами)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPublishing}
        />

        <div className="wave-modal-actions">
          <button 
            type="button" 
            className="wave-btn-cancel" 
            onClick={onClose} 
            disabled={isPublishing}
          >
            Отмена
          </button>
          <button 
            type="button" 
            className="wave-btn-publish" 
            onClick={onPublish}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <>
                <Loader2 size={16} className="wave-spinner" />
                <span>Загружаем...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>В эфир</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

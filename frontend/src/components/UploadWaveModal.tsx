import { Zap } from 'lucide-react';
import './UploadWaveModal.css';

interface UploadWaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoFile: File | null;
  description: string;
  setDescription: (desc: string) => void;
  onPublish: () => void;
}

export function UploadWaveModal({
  isOpen,
  onClose,
  videoFile,
  description,
  setDescription,
  onPublish
}: UploadWaveModalProps) {
  if (!isOpen || !videoFile) return null;

  return (
    <div className="wave-modal-overlay">
      <div className="wave-modal-content">
        <h2 className="wave-modal-title">Запустить волну</h2>
        
        <div className="wave-file-info">
          <span className="wave-file-icon">⚡</span>
          <span className="wave-file-name">{videoFile.name}</span>
        </div>

        <textarea
          className="wave-desc-input"
          placeholder="Описание волны... (необязательно)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="wave-modal-actions">
          <button className="wave-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="wave-btn-publish" onClick={onPublish}>
            <Zap size={16} />
            <span>В эфир</span>
          </button>
        </div>
      </div>
    </div>
  );
}

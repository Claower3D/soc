import React from 'react';
import { Lock, Sparkles, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './GuestLockPrompt.css';

interface GuestLockPromptProps {
  title?: string;
  description?: string;
  featureName?: string;
  actionText?: string;
  compact?: boolean;
  onUnlock?: () => void;
}

export const GuestLockPrompt: React.FC<GuestLockPromptProps> = ({
  title = 'Доступно только зарегистрированным участникам',
  description = 'Войдите или зарегистрируйтесь в экосистеме New Age, чтобы получить полный доступ к публикации, общению и всем сервисам.',
  featureName,
  actionText = 'Войти или зарегистрироваться',
  compact = false,
  onUnlock
}) => {
  const { openAuthModal } = useAuth();

  const handleAction = () => {
    if (onUnlock) {
      onUnlock();
    } else {
      openAuthModal('register');
    }
  };

  if (compact) {
    return (
      <div className="guest-lock-compact-pill" onClick={handleAction}>
        <Lock size={14} className="lock-icon" />
        <span>{featureName ? `Требуется аккаунт: ${featureName}` : 'Войдите для доступа'}</span>
        <button type="button" className="lock-pill-btn">
          Войти
        </button>
      </div>
    );
  }

  return (
    <div className="guest-lock-hero-banner">
      <div className="guest-lock-glow" />
      <div className="guest-lock-badge">
        <Lock size={14} />
        <span>{featureName ? `Ограничено: ${featureName}` : 'Гостевой режим'}</span>
      </div>
      <h3 className="guest-lock-title">{title}</h3>
      <p className="guest-lock-desc">{description}</p>
      
      <div className="guest-lock-perks-row">
        <div className="guest-perk-item">
          <ShieldCheck size={16} className="perk-icon" />
          <span>Собственный профиль и канал</span>
        </div>
        <div className="guest-perk-item">
          <Sparkles size={16} className="perk-icon" />
          <span>Публикации, видео и подкасты</span>
        </div>
        <div className="guest-perk-item">
          <Lock size={16} className="perk-icon" />
          <span>Мессенджер и конференции</span>
        </div>
      </div>

      <div className="guest-lock-actions">
        <button type="button" className="guest-lock-btn primary" onClick={handleAction}>
          <LogIn size={17} />
          {actionText}
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
};

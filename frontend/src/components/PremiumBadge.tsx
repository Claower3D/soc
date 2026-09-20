import './PremiumBadge.css';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function PremiumBadge({ size = 'md', showText = false }: PremiumBadgeProps) {
  return (
    <span className={`premium-badge premium-badge-${size}`} title="New Age Premium">
      <span className="premium-badge-icon">👑</span>
      {showText && <span className="premium-badge-text">Premium</span>}
    </span>
  );
}

/** Обёртка для имени пользователя — показывает Premium бейдж если isPremium */
export function UserNameWithBadge({ 
  name, 
  isPremium, 
  isVerified, 
  className = '',
  size = 'md' 
}: { 
  name: string; 
  isPremium?: boolean; 
  isVerified?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <span className={`username-with-badge ${isPremium ? 'is-premium' : ''} ${className}`}>
      <span className="username-text">{name}</span>
      {isVerified && <span className="verified-check-inline" title="Подтверждён">✓</span>}
      {isPremium && <PremiumBadge size={size} />}
    </span>
  );
}

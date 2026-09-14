import React from 'react';
import logoImg from '../assets/logo.png';
import './SacredQrLogo.css';

interface SacredQrLogoProps {
  size?: number;
  dataUrl?: string;
  glowColor?: string;
}

export const SacredQrLogo: React.FC<SacredQrLogoProps> = ({
  size = 240,
  dataUrl = 'https://newage.community/join',
  glowColor = 'rgba(168, 85, 247, 0.4)'
}) => {
  return (
    <div 
      className="sacred-qr-container"
      data-url={dataUrl}
      title={`Sacred New Age QR: ${dataUrl}`}
      style={{
        width: size,
        height: size,
        '--sacred-glow-color': glowColor,
      } as React.CSSProperties}
    >
      {/* Outer Sacred Metatron Geometric Halo Frame */}
      <svg 
        viewBox="0 0 300 300" 
        className="sacred-qr-halo-svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sacredRainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="16%" stopColor="#F59E0B" />
            <stop offset="33%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="66%" stopColor="#3B82F6" />
            <stop offset="83%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>

          <linearGradient id="qrGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <filter id="sacredGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Rotating Sacred Geometry Circles */}
        <circle cx="150" cy="150" r="142" fill="none" stroke="url(#sacredRainbowGrad)" strokeWidth="1.5" opacity="0.6" strokeDasharray="6 4" className="halo-spin-slow" />
        <circle cx="150" cy="150" r="134" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.4" />

        {/* Metatron Cube Hexagram Overlay Lines */}
        <polygon points="150,16 266,216 34,216" fill="none" stroke="url(#sacredRainbowGrad)" strokeWidth="1" opacity="0.4" />
        <polygon points="150,284 266,84 34,84" fill="none" stroke="url(#sacredRainbowGrad)" strokeWidth="1" opacity="0.4" />

        {/* 12 Outer Nodes representing the 12 sacred faiths */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, idx) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 150 + 138 * Math.cos(rad);
          const cy = 150 + 138 * Math.sin(rad);
          return (
            <circle 
              key={idx} 
              cx={cx} 
              cy={cy} 
              r="4" 
              fill={idx % 2 === 0 ? '#F59E0B' : '#8B5CF6'} 
              filter="url(#sacredGlowFilter)"
              opacity="0.9"
            />
          );
        })}
      </svg>

      {/* Internal QR Matrix Layer */}
      <div className="sacred-qr-matrix-card">
        <svg viewBox="0 0 200 200" className="sacred-qr-matrix-svg">
          {/* Clean White/Card Background */}
          <rect width="200" height="200" rx="14" fill="#FFFFFF" />

          {/* Corner Marker 1: Top-Left (Sacred Cross/Sun inspired styling) */}
          <rect x="14" y="14" width="46" height="46" rx="10" fill="url(#sacredRainbowGrad)" />
          <rect x="20" y="20" width="34" height="34" rx="7" fill="#FFFFFF" />
          <rect x="26" y="26" width="22" height="22" rx="5" fill="#1E1B4B" />
          <circle cx="37" cy="37" r="4" fill="#F59E0B" />

          {/* Corner Marker 2: Top-Right (Star of David & Crescent inspired styling) */}
          <rect x="140" y="14" width="46" height="46" rx="10" fill="url(#sacredRainbowGrad)" />
          <rect x="146" y="20" width="34" height="34" rx="7" fill="#FFFFFF" />
          <rect x="152" y="26" width="22" height="22" rx="5" fill="#1E1B4B" />
          <circle cx="163" cy="37" r="4" fill="#10B981" />

          {/* Corner Marker 3: Bottom-Left (Om & Wheel of Dharma inspired styling) */}
          <rect x="14" y="140" width="46" height="46" rx="10" fill="url(#sacredRainbowGrad)" />
          <rect x="20" y="146" width="34" height="34" rx="7" fill="#FFFFFF" />
          <rect x="26" y="152" width="22" height="22" rx="5" fill="#1E1B4B" />
          <circle cx="37" cy="163" r="4" fill="#3B82F6" />

          {/* Intricate Sacred Data Nodes and Alignment Paths */}
          {/* Top Row Data Blocks */}
          <rect x="70" y="18" width="10" height="10" rx="2" fill="#312E81" />
          <rect x="88" y="18" width="18" height="10" rx="2" fill="url(#sacredRainbowGrad)" />
          <rect x="114" y="18" width="12" height="10" rx="2" fill="#312E81" />
          
          <rect x="68" y="34" width="14" height="10" rx="2" fill="url(#sacredRainbowGrad)" />
          <rect x="90" y="34" width="20" height="10" rx="2" fill="#312E81" />
          <rect x="118" y="34" width="10" height="10" rx="2" fill="#F59E0B" />

          {/* Left Middle Data Blocks */}
          <rect x="18" y="70" width="10" height="12" rx="2" fill="#312E81" />
          <rect x="36" y="68" width="16" height="14" rx="2" fill="url(#sacredRainbowGrad)" />
          <rect x="18" y="90" width="14" height="20" rx="2" fill="#312E81" />
          <rect x="40" y="92" width="14" height="12" rx="2" fill="#F59E0B" />
          <rect x="18" y="118" width="12" height="12" rx="2" fill="url(#sacredRainbowGrad)" />
          <rect x="38" y="114" width="16" height="14" rx="2" fill="#312E81" />

          {/* Right Middle Data Blocks */}
          <rect x="144" y="70" width="12" height="14" rx="2" fill="#312E81" />
          <rect x="164" y="68" width="18" height="12" rx="2" fill="url(#sacredRainbowGrad)" />
          <rect x="142" y="92" width="16" height="12" rx="2" fill="#F59E0B" />
          <rect x="166" y="88" width="16" height="22" rx="2" fill="#312E81" />
          <rect x="144" y="114" width="14" height="14" rx="2" fill="url(#sacredRainbowGrad)" />
          <rect x="166" y="118" width="14" height="12" rx="2" fill="#312E81" />

          {/* Bottom Middle Data Blocks */}
          <rect x="70" y="146" width="12" height="12" rx="2" fill="#312E81" />
          <rect x="90" y="142" width="20" height="14" rx="2" fill="url(#sacredRainbowGrad)" />
          <rect x="118" y="146" width="12" height="12" rx="2" fill="#F59E0B" />

          <rect x="68" y="168" width="18" height="14" rx="2" fill="url(#sacredRainbowGrad)" />
          <rect x="94" y="166" width="14" height="16" rx="2" fill="#312E81" />
          <rect x="116" y="168" width="20" height="14" rx="2" fill="url(#sacredRainbowGrad)" />

          {/* Bottom-Right Alignment Anchor (Small 4th Corner Box) */}
          <rect x="144" y="144" width="38" height="38" rx="8" fill="#F59E0B" opacity="0.9" />
          <rect x="150" y="150" width="26" height="26" rx="5" fill="#FFFFFF" />
          <rect x="156" y="156" width="14" height="14" rx="3" fill="#312E81" />

          {/* Concentric Center Protective Cutout for Sacred Emblem */}
          <circle cx="100" cy="100" r="38" fill="#FFFFFF" />
          <circle cx="100" cy="100" r="37" fill="none" stroke="url(#sacredRainbowGrad)" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="33" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 2" />
        </svg>

        {/* Sacred Heart: Center Logo of All World Faiths */}
        <div className="sacred-qr-center-emblem">
          <img 
            src={logoImg} 
            alt="New Age Sacred Metatron Faiths Logo" 
            className="sacred-qr-center-img"
          />
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
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
  const [generatedQr, setGeneratedQr] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(dataUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 360,
      color: {
        dark: '#1E1B4B',
        light: '#FFFFFF',
      },
    }).then((url) => {
      if (active) setGeneratedQr(url);
    }).catch(() => {
      // fallback handled below
    });

    return () => {
      active = false;
    };
  }, [dataUrl]);

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
        {generatedQr ? (
          <img 
            src={generatedQr}
            alt={`Sacred QR: ${dataUrl}`}
            className="sacred-qr-code-real-img"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              background: '#FFFFFF',
            }}
          />
        ) : (
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&ecc=H&data=${encodeURIComponent(dataUrl)}`}
            alt={`Sacred QR: ${dataUrl}`}
            className="sacred-qr-code-real-img"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              background: '#FFFFFF',
            }}
          />
        )}

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

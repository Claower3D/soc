import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './QrScannerModal.css';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, jwtToken } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [errorText, setErrorText] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [detectedSession, setDetectedSession] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Start / stop camera stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setDetectedSession(null);
      setSuccess(false);
      setErrorText(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorText(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 640 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setScanning(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setErrorText('Нет доступа к камере. Вы можете ввести код сессии вручную или ссылку.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  // Continuous frame scanning using BarcodeDetector if available
  useEffect(() => {
    if (!scanning || !isOpen || success || detectedSession) return;

    let animId: number;
    const hasBarcodeDetector = 'BarcodeDetector' in window;
    let detector: any = null;
    if (hasBarcodeDetector) {
      try {
        detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch {}
    }

    const scanFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animId = requestAnimationFrame(scanFrame);
        return;
      }

      if (detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue;
            handleDetectedUrl(rawVal);
            return;
          }
        } catch {}
      }

      animId = requestAnimationFrame(scanFrame);
    };

    animId = requestAnimationFrame(scanFrame);

    return () => cancelAnimationFrame(animId);
  }, [scanning, isOpen, success, detectedSession]);

  const handleDetectedUrl = (val: string) => {
    try {
      let sId = '';
      if (val.includes('session=')) {
        const url = new URL(val, window.location.origin);
        sId = url.searchParams.get('session') || '';
      } else if (val.startsWith('qr_')) {
        sId = val;
      }

      if (sId) {
        if ('vibrate' in navigator) {
          navigator.vibrate([80, 40, 80]);
        }
        setDetectedSession(sId);
        stopCamera();
      }
    } catch {
      if (val.startsWith('qr_')) {
        setDetectedSession(val);
        stopCamera();
      }
    }
  };

  const confirmLogin = async (sessionIdToConfirm?: string) => {
    const sId = sessionIdToConfirm || detectedSession;
    if (!sId) return;

    setConfirming(true);
    setErrorText(null);

    try {
      const token = jwtToken || localStorage.getItem('new_age_jwt_token') || '';
      const res = await fetch('/api/auth/qr/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sessionId: sId,
          token,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setSuccess(true);
        if ('vibrate' in navigator) {
          navigator.vibrate([150, 60, 150]);
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorText(data.message || 'Ошибка подтверждения QR-кода. Возможно, время сессии истекло.');
      }
    } catch {
      setErrorText('Ошибка сети при подтверждении входа.');
    } finally {
      setConfirming(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.trim();
    if (!clean) return;
    handleDetectedUrl(clean);
    confirmLogin(clean.includes('session=') ? new URL(clean, window.location.origin).searchParams.get('session') || clean : clean);
  };

  if (!isOpen) return null;

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="qr-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-topbar">
          <div className="qr-modal-title-box">
            <Camera size={18} className="qr-modal-icon" />
            <span>Сканер QR-кода</span>
          </div>
          <button type="button" className="qr-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="qr-modal-content">
          {success ? (
            <div className="qr-scan-success-view">
              <div className="qr-success-icon-wrap">
                <CheckCircle size={56} color="#10B981" />
              </div>
              <h3>Вход выполнен!</h3>
              <p>Компьютер успешно вошёл в аккаунт @{currentUser?.username || currentUser?.name}.</p>
            </div>
          ) : detectedSession ? (
            <div className="qr-scan-confirm-view">
              <div className="qr-confirm-badge">
                <ShieldCheck size={36} color="#8B5CF6" />
              </div>
              <h3>Подтвердить вход?</h3>
              <p>Устройство запрашивает вход в аккаунт <b>@{currentUser?.username || currentUser?.name}</b></p>
              
              {errorText && (
                <div className="qr-modal-error-box">
                  <AlertCircle size={15} />
                  <span>{errorText}</span>
                </div>
              )}

              <div className="qr-confirm-view-actions">
                <button 
                  type="button" 
                  className="btn btn-primary qr-confirm-action-btn"
                  disabled={confirming}
                  onClick={() => confirmLogin()}
                >
                  {confirming ? 'Подключение...' : '✅ Подтвердить вход'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  disabled={confirming}
                  onClick={() => {
                    setDetectedSession(null);
                    startCamera();
                  }}
                >
                  Сканировать заново
                </button>
              </div>
            </div>
          ) : (
            <div className="qr-camera-stage">
              <div className="qr-viewfinder">
                <video 
                  ref={videoRef} 
                  playsInline 
                  muted 
                  className="qr-video-feed" 
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                <div className="qr-target-frame">
                  <div className="corner-tl" />
                  <div className="corner-tr" />
                  <div className="corner-bl" />
                  <div className="corner-br" />
                  <div className="qr-laser-line" />
                </div>
              </div>

              <p className="qr-camera-hint">
                Наведите камеру на QR-код на экране монитора
              </p>

              {errorText && (
                <div className="qr-modal-error-box">
                  <AlertCircle size={15} />
                  <span>{errorText}</span>
                </div>
              )}

              {/* Ручной ввод ссылки или сессии */}
              <form onSubmit={handleManualSubmit} className="qr-manual-form">
                <input 
                  type="text" 
                  className="qr-manual-input"
                  placeholder="Вставьте ссылку или код сессии..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
                <button type="submit" className="btn btn-primary qr-manual-submit-btn">
                  Войти
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrScannerModal;

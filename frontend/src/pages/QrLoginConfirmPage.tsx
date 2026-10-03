import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Monitor, CheckCircle, XCircle, ShieldCheck, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import logoImg from '../assets/logo.png';
import './QrLoginConfirmPage.css';

export const QrLoginConfirmPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session') || '';
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, jwtToken, openAuthModal } = useAuth();

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'rejected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto redirect if session is completely empty
  useEffect(() => {
    if (!sessionId) {
      setErrorMsg('Недействительная ссылка: параметр сессии не найден.');
    }
  }, [sessionId]);

  const handleConfirm = async () => {
    if (!sessionId) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const token = jwtToken || localStorage.getItem('new_age_jwt_token') || '';
      const res = await fetch('/api/auth/qr/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sessionId,
          token,
          user: currentUser,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.message || 'Не удалось подтвердить вход. Сессия могла истечь.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg('Сетевая ошибка при подтверждении входа.');
    }
  };

  const handleReject = async () => {
    if (sessionId) {
      try {
        await fetch('/api/auth/qr/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch {}
    }
    setStatus('rejected');
    setTimeout(() => navigate('/'), 1500);
  };

  return (
    <div className="qr-confirm-page-container">
      <div className="qr-confirm-card">
        {/* Brand header */}
        <div className="qr-confirm-header">
          <div className="qr-confirm-logo-wrap">
            <img src={logoImg} alt="New Age" className="qr-confirm-logo-img" />
          </div>
          <h2 className="qr-confirm-title">Вход в New Age</h2>
          <p className="qr-confirm-subtitle">Запрос авторизации на компьютере</p>
        </div>

        {status === 'success' ? (
          <div className="qr-confirm-state-box success">
            <div className="qr-state-icon-circle success">
              <CheckCircle size={44} color="#10B981" />
            </div>
            <h3>Вход успешно подтверждён!</h3>
            <p>Вы успешно вошли в аккаунт на компьютере. Можете продолжать работу.</p>
            <button className="btn btn-primary qr-state-btn" onClick={() => navigate('/')}>
              Перейти в ленту <ArrowRight size={16} />
            </button>
          </div>
        ) : status === 'rejected' ? (
          <div className="qr-confirm-state-box rejected">
            <div className="qr-state-icon-circle error">
              <XCircle size={44} color="#EF4444" />
            </div>
            <h3>Вход отклонён</h3>
            <p>Запрос на авторизацию отклонён. Перенаправляем на главную...</p>
          </div>
        ) : !isAuthenticated || !currentUser || currentUser.id === 'guest' ? (
          <div className="qr-confirm-guest-prompt">
            <div className="qr-state-icon-circle info">
              <AlertCircle size={40} color="#6366F1" />
            </div>
            <h3>Требуется вход</h3>
            <p>Чтобы подтвердить вход на компьютере, сначала авторизуйтесь в New Age на этом телефоне.</p>
            <button className="btn btn-primary qr-state-btn" onClick={() => openAuthModal('login')}>
              Войти на телефоне
            </button>
          </div>
        ) : (
          <div className="qr-confirm-body">
            {errorMsg && (
              <div className="qr-confirm-error-alert">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="qr-target-device-card">
              <div className="qr-device-icon-box">
                <Monitor size={28} />
              </div>
              <div className="qr-device-details">
                <span className="qr-device-name">Компьютер / Браузер</span>
                <span className="qr-device-info">Запрашивает вход в экосистему</span>
              </div>
            </div>

            <div className="qr-user-preview-card">
              <img 
                src={currentUser.avatar || logoImg} 
                alt={currentUser.name} 
                className="qr-user-preview-avatar" 
              />
              <div className="qr-user-preview-info">
                <span className="qr-user-name">{currentUser.name}</span>
                <span className="qr-user-handle">@{currentUser.username || currentUser.id}</span>
              </div>
              <div className="qr-user-shield">
                <ShieldCheck size={18} color="#10B981" />
              </div>
            </div>

            <div className="qr-security-note">
              <Sparkles size={14} className="qr-sparkle-icon" />
              <span>Подтверждайте вход только если вы сами сканировали QR-код на своём мониторе.</span>
            </div>

            <div className="qr-confirm-actions">
              <button 
                type="button" 
                className="btn btn-primary qr-confirm-btn"
                disabled={status === 'loading'}
                onClick={handleConfirm}
              >
                {status === 'loading' ? 'Подключение...' : 'Подтвердить вход'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary qr-reject-btn"
                disabled={status === 'loading'}
                onClick={handleReject}
              >
                Отклонить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrLoginConfirmPage;

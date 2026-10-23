import React, { useEffect, useRef, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, RefreshCw, KeyRound } from 'lucide-react';
import { api } from '../api';
import './EmailAuthFlows.css';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
export const isValidEmail = (v: string) => EMAIL_RE.test(v.trim());

const RESEND_SECONDS = 60;

function useCountdown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft] as const;
}

/** Поле ввода 6-значного кода из письма. */
function CodeInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="eaf-code-wrap" onClick={() => ref.current?.focus()}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`eaf-code-cell ${value.length === i ? 'active' : ''} ${value[i] ? 'filled' : ''}`}>
          {value[i] || ''}
        </div>
      ))}
      <input
        ref={ref}
        className="eaf-code-hidden"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      />
    </div>
  );
}

function Alert({ type, text }: { type: 'error' | 'success'; text: string }) {
  return (
    <div className={`eaf-alert ${type}`}>
      {type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      <span>{text}</span>
    </div>
  );
}

interface EmailCodeVerifyProps {
  email: string;
  onVerified: () => void | Promise<void>;
  onBack: () => void;
}

/** Шаг подтверждения почты при регистрации: отправка кода (Bird Verify) и его проверка. */
export function EmailCodeVerify({ email, onVerified, onBack }: EmailCodeVerifyProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [left, setLeft] = useCountdown();
  const sentOnce = useRef(false);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      await api.auth.sendEmailCode(email.trim());
      setInfo(`Код отправлен на ${email.trim()}`);
      setLeft(RESEND_SECONDS);
    } catch (e: any) {
      setError(e?.message || 'Не удалось отправить код');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length < 4) { setError('Введите код из письма'); return; }
    setChecking(true);
    setError(null);
    try {
      await api.auth.verifyEmailCode(email.trim(), code);
      await onVerified();
    } catch (err: any) {
      setError(err?.message || 'Неверный код');
      setCode('');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (code.length === 6 && !checking) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <form className="eaf-card" onSubmit={verify}>
      <div className="eaf-icon"><Mail size={26} /></div>
      <h2 className="eaf-title">Подтвердите почту</h2>
      <p className="eaf-subtitle">Мы отправили 6-значный код на <b>{email.trim()}</b>. Проверьте также папку «Спам».</p>

      {error && <Alert type="error" text={error} />}
      {!error && info && <Alert type="success" text={info} />}

      <CodeInput value={code} onChange={setCode} disabled={checking} />

      <button type="submit" className="eaf-primary" disabled={checking || code.length < 6}>
        <span>{checking ? 'Проверяем...' : 'Подтвердить'}</span>
        <ArrowRight size={17} />
      </button>

      <div className="eaf-row">
        <button type="button" className="eaf-link" onClick={onBack}>
          <ArrowLeft size={14} /> Изменить почту
        </button>
        <button type="button" className="eaf-link" onClick={send} disabled={sending || left > 0}>
          <RefreshCw size={14} /> {left > 0 ? `Отправить снова (${left}с)` : sending ? 'Отправляем...' : 'Отправить снова'}
        </button>
      </div>
    </form>
  );
}

interface PasswordRecoveryProps {
  initialEmail?: string;
  onBack: () => void;
  onRecovered: (token: string, user: any) => void;
}

/** Восстановление доступа: почта → код из письма + новый пароль → автоматический вход. */
export function PasswordRecovery({ initialEmail = '', onBack, onRecovered }: PasswordRecoveryProps) {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState(isValidEmail(initialEmail) ? initialEmail.trim() : '');
  const [code, setCode] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useCountdown();

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!isValidEmail(email)) { setError('Введите корректный адрес электронной почты'); return; }
    setBusy(true);
    try {
      await api.auth.sendRecoveryCode(email.trim());
      setStep('reset');
      setLeft(RESEND_SECONDS);
    } catch (err: any) {
      setError(err?.message || 'Не удалось отправить код');
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.length < 6) { setError('Введите 6-значный код из письма'); return; }
    if (pwd.length < 6) { setError('Пароль должен содержать не менее 6 символов'); return; }
    if (pwd !== pwd2) { setError('Пароли не совпадают'); return; }
    setBusy(true);
    try {
      const res = await api.auth.resetPassword(email.trim(), code, pwd);
      setStep('done');
      if (res?.token && res?.user) {
        setTimeout(() => onRecovered(res.token, res.user), 900);
      }
    } catch (err: any) {
      setError(err?.message || 'Не удалось сменить пароль');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="eaf-card">
        <div className="eaf-icon success"><CheckCircle2 size={28} /></div>
        <h2 className="eaf-title">Доступ восстановлен</h2>
        <p className="eaf-subtitle">Пароль изменён. Входим в ваш профиль...</p>
      </div>
    );
  }

  if (step === 'email') {
    return (
      <form className="eaf-card" onSubmit={sendCode}>
        <div className="eaf-icon"><KeyRound size={26} /></div>
        <h2 className="eaf-title">Восстановление доступа</h2>
        <p className="eaf-subtitle">Укажите почту, привязанную к аккаунту. Мы пришлём код для сброса пароля.</p>
        {error && <Alert type="error" text={error} />}
        <div className="eaf-field">
          <Mail size={17} className="eaf-field-icon" />
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
        </div>
        <button type="submit" className="eaf-primary" disabled={busy}>
          <span>{busy ? 'Отправляем...' : 'Получить код'}</span>
          <ArrowRight size={17} />
        </button>
        <div className="eaf-row center">
          <button type="button" className="eaf-link" onClick={onBack}><ArrowLeft size={14} /> Вернуться ко входу</button>
        </div>
      </form>
    );
  }

  return (
    <form className="eaf-card" onSubmit={reset}>
      <div className="eaf-icon"><Lock size={26} /></div>
      <h2 className="eaf-title">Новый пароль</h2>
      <p className="eaf-subtitle">Введите код из письма на <b>{email.trim()}</b> и придумайте новый пароль.</p>
      {error && <Alert type="error" text={error} />}
      <CodeInput value={code} onChange={setCode} disabled={busy} />
      <div className="eaf-field">
        <Lock size={17} className="eaf-field-icon" />
        <input type={showPwd ? 'text' : 'password'} placeholder="Новый пароль (мин. 6 символов)" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" required />
        <button type="button" className="eaf-eye" onClick={() => setShowPwd(!showPwd)}>{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
      </div>
      <div className="eaf-field">
        <Lock size={17} className="eaf-field-icon" />
        <input type={showPwd ? 'text' : 'password'} placeholder="Повторите пароль" value={pwd2} onChange={(e) => setPwd2(e.target.value)} autoComplete="new-password" required />
      </div>
      <button type="submit" className="eaf-primary" disabled={busy}>
        <span>{busy ? 'Сохраняем...' : 'Сменить пароль и войти'}</span>
        <ArrowRight size={17} />
      </button>
      <div className="eaf-row">
        <button type="button" className="eaf-link" onClick={() => { setStep('email'); setCode(''); setError(null); }}>
          <ArrowLeft size={14} /> Другая почта
        </button>
        <button type="button" className="eaf-link" onClick={() => sendCode()} disabled={busy || left > 0}>
          <RefreshCw size={14} /> {left > 0 ? `Отправить снова (${left}с)` : 'Отправить снова'}
        </button>
      </div>
    </form>
  );
}

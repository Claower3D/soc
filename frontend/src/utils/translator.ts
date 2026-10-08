import { API_BASE_URL } from '../api';

export interface WorldLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  voiceLang: string;
}

export const WORLD_LANGUAGES: WorldLanguage[] = [
  { code: 'en', name: 'Английский', nativeName: 'English', flag: '🇬🇧', voiceLang: 'en-US' },
  { code: 'kk', name: 'Казахский', nativeName: 'Қазақша', flag: '🇰🇿', voiceLang: 'kk-KZ' },
  { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺', voiceLang: 'ru-RU' },
  { code: 'es', name: 'Испанский', nativeName: 'Español', flag: '🇪🇸', voiceLang: 'es-ES' },
  { code: 'de', name: 'Немецкий', nativeName: 'Deutsch', flag: '🇩🇪', voiceLang: 'de-DE' },
  { code: 'fr', name: 'Французский', nativeName: 'Français', flag: '🇫🇷', voiceLang: 'fr-FR' },
  { code: 'zh', name: 'Китайский', nativeName: '中文', flag: '🇨🇳', voiceLang: 'zh-CN' },
  { code: 'tr', name: 'Турецкий', nativeName: 'Türkçe', flag: '🇹🇷', voiceLang: 'tr-TR' },
  { code: 'ar', name: 'Арабский', nativeName: 'العربية', flag: '🇸🇦', voiceLang: 'ar-SA' },
  { code: 'it', name: 'Итальянский', nativeName: 'Italiano', flag: '🇮🇹', voiceLang: 'it-IT' },
  { code: 'ja', name: 'Японский', nativeName: '日本語', flag: '🇯🇵', voiceLang: 'ja-JP' },
  { code: 'ko', name: 'Корейский', nativeName: '한국어', flag: '🇰🇷', voiceLang: 'ko-KR' },
  { code: 'pt', name: 'Португальский', nativeName: 'Português', flag: '🇵🇹', voiceLang: 'pt-PT' },
  { code: 'hi', name: 'Хинди', nativeName: 'हिन्दी', flag: '🇮🇳', voiceLang: 'hi-IN' },
  { code: 'uz', name: 'Узбекский', nativeName: 'Oʻzbekcha', flag: '🇺🇿', voiceLang: 'uz-UZ' },
  { code: 'uk', name: 'Украинский', nativeName: 'Українська', flag: '🇺🇦', voiceLang: 'uk-UA' },
  { code: 'pl', name: 'Польский', nativeName: 'Polski', flag: '🇵🇱', voiceLang: 'pl-PL' },
  { code: 'id', name: 'Индонезийский', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', voiceLang: 'id-ID' },
];

export const POPULAR_LANG_CODES = ['en', 'kk', 'es', 'de', 'fr', 'zh', 'tr', 'ru'];

const translationCache = new Map<string, { text: string; from?: string }>();

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang = 'auto'
): Promise<{ text: string; from?: string }> {
  const clean = text.trim();
  if (!clean) return { text: '' };

  const cacheKey = `${sourceLang}->${targetLang}:${clean}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // 1) Попытка через наш бэкенд /api/ai/translate
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, target: targetLang, source: sourceLang }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.text) {
        const result = { text: String(data.text), from: data.source || data.from };
        translationCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('[Translate] Backend endpoint error, using direct engine:', err);
  }

  // 2) Прямой клиентский Google Translate API (клиент gtx, 130+ языков, без ключа)
  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sourceLang
    )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(gtxUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        let resultText = '';
        for (const part of data[0]) {
          if (Array.isArray(part) && typeof part[0] === 'string') {
            resultText += part[0];
          }
        }
        if (resultText.trim()) {
          const detected = typeof data[2] === 'string' ? data[2] : sourceLang;
          const result = { text: resultText, from: detected };
          translationCache.set(cacheKey, result);
          return result;
        }
      }
    }
  } catch (gtxErr) {
    console.error('[Translate] Direct Google Translate error:', gtxErr);
  }

  return { text: clean };
}

export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Озвучивает текст на выбранном языке мира с нативным произношением.
 * Возвращает функцию остановки воспроизведения.
 */
export function playVoiceSpeech(
  text: string,
  langCode: string,
  options?: {
    isSpeakerLoud?: boolean;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err?: any) => void;
  }
): () => void {
  const clean = cleanTextForSpeech(text);
  if (!clean) {
    options?.onEnd?.();
    return () => {};
  }

  let activeAudio: HTMLAudioElement | null = null;
  let isCancelled = false;

  const cancelSpeech = () => {
    isCancelled = true;
    if (activeAudio) {
      try {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      } catch {}
      activeAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    options?.onEnd?.();
  };

  const fallbackBrowserTTS = () => {
    if (isCancelled) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(clean);
        utter.volume = options?.isSpeakerLoud ? 1.0 : 0.85;
        utter.rate = 1.0;
        utter.pitch = 1.0;

        // Поиск подходящего голоса для данного языка
        const langObj = WORLD_LANGUAGES.find((l) => l.code === langCode);
        const targetVoiceCode = langObj ? langObj.voiceLang : langCode;
        utter.lang = targetVoiceCode;

        const voices = window.speechSynthesis.getVoices();
        const matchVoice =
          voices.find((v) => v.lang.toLowerCase() === targetVoiceCode.toLowerCase()) ||
          voices.find((v) => v.lang.toLowerCase().startsWith(langCode.toLowerCase()));
        if (matchVoice) {
          utter.voice = matchVoice;
        }

        utter.onstart = () => {
          if (!isCancelled) options?.onStart?.();
        };
        utter.onend = () => {
          if (!isCancelled) options?.onEnd?.();
        };
        utter.onerror = (e) => {
          if (!isCancelled) {
            options?.onError?.(e);
            options?.onEnd?.();
          }
        };

        window.speechSynthesis.speak(utter);
      } catch (err) {
        options?.onError?.(err);
        options?.onEnd?.();
      }
    } else {
      options?.onEnd?.();
    }
  };

  try {
    const ttsUrl = `${API_BASE_URL}/api/ai/tts?text=${encodeURIComponent(
      clean
    )}&lang=${encodeURIComponent(langCode)}&voice=Sulafat`;
    const audio = new Audio(ttsUrl);
    activeAudio = audio;
    audio.volume = options?.isSpeakerLoud ? 1.0 : 0.85;

    audio.onplay = () => {
      if (!isCancelled) options?.onStart?.();
    };

    audio.onended = () => {
      activeAudio = null;
      if (!isCancelled) options?.onEnd?.();
    };

    audio.onerror = () => {
      activeAudio = null;
      if (!isCancelled) fallbackBrowserTTS();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        activeAudio = null;
        if (!isCancelled) fallbackBrowserTTS();
      });
    }
  } catch {
    activeAudio = null;
    fallbackBrowserTTS();
  }

  return cancelSpeech;
}

// Telegram Desktop Stickers & Emojis Catalog

export interface StickerItem {
  id: string;
  url: string;
  emoji?: string;
  isFavorite?: boolean;
}

export interface StickerPack {
  id: string;
  title: string;
  avatar: string;
  stickers: StickerItem[];
}

// Helpers to build SVG sticker data URIs
function encodeSvg(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Mr. Meeseeks SVG Stickers
const meeseeksAvatar = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <ellipse cx="50" cy="12" rx="7" ry="9" fill="#e17055"/>
    <ellipse cx="50" cy="54" rx="38" ry="40" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
    <circle cx="36" cy="45" r="5" fill="#2d3436"/>
    <circle cx="64" cy="45" r="5" fill="#2d3436"/>
    <path d="M32 60 Q50 82 68 60" fill="#2d3436" stroke="#2d3436" stroke-width="2"/>
    <path d="M38 61 Q50 70 62 61" fill="#ffffff"/>
  </svg>
`);

const meeseeksScream = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <ellipse cx="60" cy="14" rx="8" ry="11" fill="#e17055"/>
    <ellipse cx="60" cy="58" rx="42" ry="44" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
    <ellipse cx="44" cy="44" rx="7" ry="9" fill="#fff"/>
    <circle cx="45" cy="45" r="4" fill="#2d3436"/>
    <ellipse cx="76" cy="44" rx="7" ry="9" fill="#fff"/>
    <circle cx="75" cy="45" r="4" fill="#2d3436"/>
    <ellipse cx="60" cy="74" rx="22" ry="18" fill="#2d3436"/>
    <path d="M46 82 Q60 74 74 82" fill="#d63031"/>
    <path d="M44 64 Q60 67 76 64" stroke="#ffffff" stroke-width="4" fill="none"/>
    <path d="M22 85 Q12 95 24 110" stroke="#00cec9" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M98 85 Q108 95 96 110" stroke="#00cec9" stroke-width="8" stroke-linecap="round" fill="none"/>
  </svg>
`);

const meeseeksThumbs = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <ellipse cx="60" cy="14" rx="8" ry="11" fill="#e17055"/>
    <ellipse cx="60" cy="55" rx="40" ry="42" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
    <circle cx="45" cy="45" r="5" fill="#2d3436"/>
    <circle cx="75" cy="45" r="5" fill="#2d3436"/>
    <path d="M38 58 Q60 84 82 58" fill="#2d3436"/>
    <path d="M44 59 Q60 70 76 59" fill="#ffffff"/>
    <path d="M18 65 Q8 45 22 40 Q28 48 26 65" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
    <path d="M102 65 Q112 45 98 40 Q92 48 94 65" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
  </svg>
`);

const meeseeksPresent = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <ellipse cx="65" cy="14" rx="8" ry="11" fill="#e17055"/>
    <ellipse cx="65" cy="55" rx="38" ry="40" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
    <circle cx="52" cy="46" r="4.5" fill="#2d3436"/>
    <circle cx="78" cy="46" r="4.5" fill="#2d3436"/>
    <path d="M48 60 Q65 76 82 60" fill="#2d3436"/>
    <path d="M52 61 Q65 68 78 61" fill="#ffffff"/>
    <path d="M30 65 Q10 70 12 85 Q25 90 35 75" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
    <path d="M15 70 Q22 65 26 75" stroke="#e84393" stroke-width="3" fill="none"/>
  </svg>
`);

const meeseeksShock = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <ellipse cx="60" cy="14" rx="8" ry="11" fill="#e17055"/>
    <ellipse cx="60" cy="58" rx="42" ry="44" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
    <ellipse cx="44" cy="42" rx="9" ry="11" fill="#fff"/>
    <circle cx="44" cy="42" r="5" fill="#2d3436"/>
    <ellipse cx="76" cy="42" rx="9" ry="11" fill="#fff"/>
    <circle cx="76" cy="42" r="5" fill="#2d3436"/>
    <ellipse cx="60" cy="74" rx="15" ry="19" fill="#2d3436"/>
    <path d="M50 82 Q60 76 70 82" fill="#d63031"/>
    <path d="M78 65 Q94 60 90 85 Q80 95 72 80" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
  </svg>
`);

const meeseeksWave = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <ellipse cx="55" cy="14" rx="8" ry="11" fill="#e17055"/>
    <ellipse cx="55" cy="58" rx="38" ry="42" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
    <circle cx="44" cy="48" r="4.5" fill="#2d3436"/>
    <circle cx="68" cy="48" r="4.5" fill="#2d3436"/>
    <path d="M42 64 Q55 78 70 64" stroke="#2d3436" stroke-width="3" fill="none"/>
    <path d="M82 60 Q105 40 100 20 Q90 22 86 42" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
  </svg>
`);

const meeseeksRain = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="12" fill="#2d3436"/>
    <path d="M15 15 L20 30 M45 10 L50 25 M85 18 L90 33 M30 35 L35 50 M70 40 L75 55" stroke="#74b9ff" stroke-width="2" stroke-dasharray="3 4"/>
    <ellipse cx="60" cy="22" rx="7" ry="9" fill="#e17055"/>
    <ellipse cx="60" cy="65" rx="34" ry="38" fill="#00cec9" stroke="#0984e3" stroke-width="2.5"/>
    <circle cx="48" cy="55" r="4" fill="#2d3436"/>
    <circle cx="72" cy="55" r="4" fill="#2d3436"/>
    <path d="M48 78 Q60 68 72 78" stroke="#2d3436" stroke-width="3" fill="none"/>
  </svg>
`);

const meeseeksThink = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <ellipse cx="55" cy="14" rx="8" ry="11" fill="#e17055"/>
    <ellipse cx="55" cy="58" rx="40" ry="42" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
    <ellipse cx="44" cy="46" rx="5" ry="6" fill="#2d3436"/>
    <ellipse cx="70" cy="46" rx="5" ry="6" fill="#2d3436"/>
    <ellipse cx="55" cy="68" rx="8" ry="5" fill="#2d3436"/>
    <text x="82" y="32" font-size="22" font-weight="900" fill="#e84393" font-family="Arial">?</text>
    <text x="96" y="50" font-size="16" font-weight="900" fill="#e84393" font-family="Arial">?</text>
    <path d="M68 75 Q78 92 62 88" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
  </svg>
`);

const meeseeksParty = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <polygon points="60,2 45,28 75,28" fill="#fdcb6e" stroke="#d63031" stroke-width="2.5"/>
    <circle cx="60" cy="3" r="4" fill="#e17055"/>
    <circle cx="20" cy="25" r="3" fill="#e84393"/>
    <circle cx="95" cy="22" r="3.5" fill="#00b894"/>
    <circle cx="25" cy="50" r="2.5" fill="#0984e3"/>
    <ellipse cx="60" cy="65" rx="40" ry="42" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
    <circle cx="46" cy="54" r="5" fill="#2d3436"/>
    <circle cx="74" cy="54" r="5" fill="#2d3436"/>
    <path d="M42 66 Q60 88 78 66" fill="#2d3436"/>
    <path d="M48 67 Q60 76 72 67" fill="#ffffff"/>
  </svg>
`);

const meeseeksAngry = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <polygon points="60,16 50,2 70,2" fill="#fdcb6e"/>
    <ellipse cx="60" cy="60" rx="42" ry="44" fill="#d63031" stroke="#b71540" stroke-width="3"/>
    <path d="M38 42 L56 50" stroke="#2d3436" stroke-width="4"/>
    <path d="M82 42 L64 50" stroke="#2d3436" stroke-width="4"/>
    <circle cx="48" cy="53" r="4.5" fill="#2d3436"/>
    <circle cx="72" cy="53" r="4.5" fill="#2d3436"/>
    <path d="M44 76 Q60 64 76 76" stroke="#2d3436" stroke-width="4" fill="none"/>
    <path d="M30 75 Q15 65 10 50 Q20 54 28 68" fill="#d63031" stroke="#b71540" stroke-width="2.5"/>
  </svg>
`);

const meeseeksConfident = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <ellipse cx="60" cy="14" rx="8" ry="11" fill="#e17055"/>
    <ellipse cx="60" cy="52" rx="38" ry="40" fill="#00cec9" stroke="#0984e3" stroke-width="3"/>
    <circle cx="46" cy="44" r="4.5" fill="#2d3436"/>
    <circle cx="74" cy="44" r="4.5" fill="#2d3436"/>
    <path d="M44 58 Q60 72 76 58" stroke="#2d3436" stroke-width="3" fill="none"/>
    <rect x="36" y="85" width="48" height="30" rx="6" fill="#ffffff" stroke="#2d3436" stroke-width="2.5"/>
  </svg>
`);

// Pepe SVG Stickers
const pepeAvatar = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <ellipse cx="50" cy="50" rx="42" ry="40" fill="#6ab04c" stroke="#27ae60" stroke-width="3"/>
    <ellipse cx="36" cy="35" rx="14" ry="12" fill="#fff" stroke="#27ae60" stroke-width="2"/>
    <circle cx="36" cy="35" r="6" fill="#2d3436"/>
    <ellipse cx="68" cy="35" rx="14" ry="12" fill="#fff" stroke="#27ae60" stroke-width="2"/>
    <circle cx="68" cy="35" r="6" fill="#2d3436"/>
    <path d="M25 65 Q50 85 75 65" stroke="#eb4d4b" stroke-width="6" stroke-linecap="round" fill="none"/>
  </svg>
`);

const pepeFeelsGood = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <ellipse cx="60" cy="58" rx="48" ry="44" fill="#6ab04c" stroke="#27ae60" stroke-width="3.5"/>
    <ellipse cx="42" cy="40" rx="16" ry="14" fill="#fff" stroke="#27ae60" stroke-width="2"/>
    <circle cx="44" cy="40" r="7" fill="#2d3436"/>
    <ellipse cx="80" cy="40" rx="16" ry="14" fill="#fff" stroke="#27ae60" stroke-width="2"/>
    <circle cx="78" cy="40" r="7" fill="#2d3436"/>
    <path d="M28 70 Q60 96 92 70" stroke="#eb4d4b" stroke-width="8" stroke-linecap="round" fill="none"/>
  </svg>
`);

const pepeSad = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <ellipse cx="60" cy="58" rx="48" ry="44" fill="#6ab04c" stroke="#27ae60" stroke-width="3.5"/>
    <path d="M30 30 L55 42 M90 30 L65 42" stroke="#2d3436" stroke-width="4"/>
    <ellipse cx="44" cy="46" rx="14" ry="12" fill="#fff"/>
    <circle cx="44" cy="48" r="6" fill="#2d3436"/>
    <ellipse cx="78" cy="46" rx="14" ry="12" fill="#fff"/>
    <circle cx="78" cy="48" r="6" fill="#2d3436"/>
    <path d="M35 84 Q60 68 85 84" stroke="#eb4d4b" stroke-width="7" stroke-linecap="round" fill="none"/>
  </svg>
`);

const pepeSmug = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <ellipse cx="60" cy="58" rx="48" ry="44" fill="#6ab04c" stroke="#27ae60" stroke-width="3.5"/>
    <path d="M30 38 Q45 32 55 42 M65 42 Q75 32 90 38" stroke="#2d3436" stroke-width="4" fill="none"/>
    <circle cx="45" cy="45" r="5" fill="#2d3436"/>
    <circle cx="75" cy="45" r="5" fill="#2d3436"/>
    <path d="M38 72 Q65 60 88 80" stroke="#eb4d4b" stroke-width="7" stroke-linecap="round" fill="none"/>
  </svg>
`);

// Student with finger gun (from Telegram screenshot favorites!)
const studentFingerGun = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="14" fill="#353b48"/>
    <rect x="25" y="65" width="70" height="50" rx="6" fill="#7f8fa6"/>
    <circle cx="60" cy="45" r="22" fill="#f5cd79"/>
    <circle cx="60" cy="38" r="24" fill="#2f3640" clip-path="inset(0 0 45% 0)"/>
    <rect x="50" y="42" width="10" height="6" rx="2" stroke="#111" stroke-width="2" fill="none"/>
    <rect x="62" y="42" width="10" height="6" rx="2" stroke="#111" stroke-width="2" fill="none"/>
    <path d="M52 56 Q60 62 68 56" stroke="#c23616" stroke-width="2.5" fill="none"/>
    <path d="M80 44 L92 36 L100 36 M92 36 L92 48" stroke="#f5cd79" stroke-width="5" stroke-linecap="round"/>
  </svg>
`);

// Borat Thumbs Up
const boratAvatar = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill="#718093"/>
    <ellipse cx="50" cy="46" rx="28" ry="32" fill="#f8c291"/>
    <path d="M22 34 Q50 14 78 34" fill="#2f3542"/>
    <path d="M36 54 Q50 64 64 54" stroke="#2f3542" stroke-width="7" stroke-linecap="round"/>
    <circle cx="40" cy="44" r="3.5" fill="#2f3542"/>
    <circle cx="60" cy="44" r="3.5" fill="#2f3542"/>
  </svg>
`);

const boratGreatSuccess = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <ellipse cx="60" cy="50" rx="34" ry="38" fill="#f8c291"/>
    <path d="M26 32 Q60 10 94 32" fill="#2f3542"/>
    <path d="M42 60 Q60 74 78 60" stroke="#2f3542" stroke-width="8" stroke-linecap="round"/>
    <circle cx="48" cy="48" r="4" fill="#2f3542"/>
    <circle cx="72" cy="48" r="4" fill="#2f3542"/>
    <path d="M16 60 Q6 40 22 32 Q28 42 26 60" fill="#f8c291" stroke="#2f3542" stroke-width="2.5"/>
    <path d="M104 60 Q114 40 98 32 Q92 42 94 60" fill="#f8c291" stroke="#2f3542" stroke-width="2.5"/>
    <text x="60" y="112" font-size="13" font-weight="900" fill="#e1b12c" text-anchor="middle" font-family="Impact">GREAT SUCCESS!</text>
  </svg>
`);

// Doge Wow Sticker
const dogeAvatar = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill="#f6e58d"/>
    <ellipse cx="50" cy="52" rx="36" ry="34" fill="#f9ca24"/>
    <polygon points="20,15 35,40 12,38" fill="#f0932b"/>
    <polygon points="80,15 65,40 88,38" fill="#f0932b"/>
    <ellipse cx="38" cy="48" rx="6" ry="8" fill="#2d3436"/>
    <circle cx="39" cy="46" r="2.5" fill="#ffffff"/>
    <ellipse cx="64" cy="48" rx="6" ry="8" fill="#2d3436"/>
    <circle cx="65" cy="46" r="2.5" fill="#ffffff"/>
    <ellipse cx="51" cy="62" rx="8" ry="6" fill="#2d3436"/>
    <path d="M45 68 Q51 74 57 68" stroke="#eb4d4b" stroke-width="2.5" fill="none"/>
  </svg>
`);

// Anime / Cyber Avatar
const animeAvatar = encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill="#6c5ce7"/>
    <ellipse cx="50" cy="54" rx="30" ry="34" fill="#ffeaa7"/>
    <path d="M18 45 L50 15 L82 45 L70 30 L50 20 L30 30 Z" fill="#e84393"/>
    <circle cx="40" cy="54" r="5" fill="#fd79a8"/>
    <circle cx="60" cy="54" r="5" fill="#fd79a8"/>
    <path d="M44 68 Q50 74 56 68" stroke="#d63031" stroke-width="2" fill="none"/>
  </svg>
`);

export const TELEGRAM_STICKER_PACKS: StickerPack[] = [
  {
    id: 'pack_fav',
    title: 'Избранные',
    avatar: 'bookmark',
    stickers: [
      { id: 'fav_student', url: studentFingerGun, emoji: '🧑‍🏫', isFavorite: true },
      { id: 'fav_ms_scream', url: meeseeksScream, emoji: '😱', isFavorite: true },
      { id: 'fav_pepe_good', url: pepeFeelsGood, emoji: '🐸', isFavorite: true },
      { id: 'fav_borat', url: boratGreatSuccess, emoji: '👍', isFavorite: true }
    ]
  },
  {
    id: 'pack_meeseeks',
    title: 'Mr. Meeseeks',
    avatar: meeseeksAvatar,
    stickers: [
      { id: 'ms_1', url: meeseeksScream, emoji: '😱' },
      { id: 'ms_2', url: meeseeksPresent, emoji: '❤️' },
      { id: 'ms_3', url: meeseeksThumbs, emoji: '👍' },
      { id: 'ms_4', url: meeseeksShock, emoji: '😮' },
      { id: 'ms_5', url: meeseeksWave, emoji: '👋' },
      { id: 'ms_6', url: meeseeksRain, emoji: '😢' },
      { id: 'ms_7', url: meeseeksThink, emoji: '🤔' },
      { id: 'ms_8', url: meeseeksParty, emoji: '🎉' },
      { id: 'ms_9', url: meeseeksAngry, emoji: '😡' },
      { id: 'ms_10', url: meeseeksConfident, emoji: '✨' }
    ]
  },
  {
    id: 'pack_pepe',
    title: 'Pepe & Frog Mood',
    avatar: pepeAvatar,
    stickers: [
      { id: 'pe_1', url: pepeFeelsGood, emoji: '😃' },
      { id: 'pe_2', url: pepeSad, emoji: '😢' },
      { id: 'pe_3', url: pepeSmug, emoji: '😏' },
      { id: 'pe_4', url: studentFingerGun, emoji: '🔫' }
    ]
  },
  {
    id: 'pack_memes',
    title: 'Classic Cinema & Memes',
    avatar: boratAvatar,
    stickers: [
      { id: 'mem_1', url: boratGreatSuccess, emoji: '👍' },
      { id: 'mem_2', url: dogeAvatar, emoji: '🐶' },
      { id: 'mem_3', url: animeAvatar, emoji: '✨' },
      { id: 'mem_4', url: studentFingerGun, emoji: '🧑‍🎓' }
    ]
  }
];

export const STICKER_QUICK_REACTIONS = [
  { emoji: '❤️', label: 'Любовь' },
  { emoji: '👍', label: 'Лайк' },
  { emoji: '👎', label: 'Дизлайк' },
  { emoji: '🎉', label: 'Праздник' },
  { emoji: '😀', label: 'Улыбка' },
  { emoji: '😢', label: 'Грусть' }
];

export interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'recent',
    name: 'Часто используемые',
    icon: '🕒',
    emojis: ['😂', '❤️', '🔥', '👍', '😊', '😍', '🙏', '🎉', '✨', '🥰', '🤣', '😭', '😎', '🙌', '💯', '🤔']
  },
  {
    id: 'smileys',
    name: 'Смайлики и эмоции',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇',
      '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑',
      '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
      '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
      '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮',
      '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
      '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀',
      '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'
    ]
  },
  {
    id: 'people',
    name: 'Люди и жесты',
    icon: '👋',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
      '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏',
      '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦵', '🦶', '👂', '👃',
      '🧠', '🫀', '👀', '👁️', '👅', '👄', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨'
    ]
  },
  {
    id: 'nature',
    name: 'Животные и природа',
    icon: '🐻',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷',
      '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴',
      '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🐢', '🐍', '🐙', '🦑', '🦐', '🦀',
      '🐡', '🐠', '🐟', '🐬', '🐳', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦛'
    ]
  },
  {
    id: 'food',
    name: 'Еда и напитки',
    icon: '🍔',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🍍', '🥥',
      '🥝', '🍅', '🥑', '🥦', '🥒', '🌶️', '🌽', '🥕', '🥔', '🥐', '🍞', '🧀', '🍳',
      '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮',
      '🌯', '🥗', '🍝', '🍜', '🍲', '🍣', '🍱', '🥟', '🍤', '🍙', '🍨', '🍰', '☕'
    ]
  },
  {
    id: 'symbols',
    name: 'Символы и сердца',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞',
      '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '☯️',
      '💯', '💢', '💥', '💫', '💬', '🗯️', '💭', '💤', '💮', '♨️', '🛑', '⛔', '✅',
      '❌', '⭕', '❓', '❔', '❗️', '❕', '⚠️', '⚡', '✨', '🌟', '⭐', '🔥', '🌈'
    ]
  }
];

export const TELEGRAM_GIFS = [
  { id: 'g1', title: 'Party Cat ✨', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80' },
  { id: 'g2', title: 'Fire Flame 🔥', url: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&w=400&q=80' },
  { id: 'g3', title: 'Neon Cyber ⚡', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80' },
  { id: 'g4', title: 'Zen Calm 🌿', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80' },
  { id: 'g5', title: 'Celebration 🎉', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80' },
  { id: 'g6', title: 'Music Vibe 🎧', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80' }
];

import { initialUsers, type User } from '../data/mock';
import type { RegisteredAccount } from '../context/AuthContext';
import { api } from '../api';

const STORAGE_KEY_FOLLOWING = 'new_age_following_map';
const STORAGE_KEY_FOLLOWERS_MAP = 'new_age_custom_followers_map';
const STORAGE_KEY_CRITICS_MAP = 'new_age_critics_map';

// Получить пул всех пользователей (моки + зарегистрированные)
export function getAllUsersPool(currentUser?: User, allAccounts: RegisteredAccount[] = []): User[] {
  const registeredUsers: User[] = allAccounts.map(a => ({
    id: a.id,
    name: a.name,
    username: a.username,
    avatar: a.avatar,
    coverImage: a.coverImage,
    bio: a.bio,
    website: a.website,
    location: a.location,
    online: false,
    followersCount: a.followersCount || 0,
    followingCount: a.followingCount || 0,
    criticsCount: a.criticsCount || 0,
    postsCount: a.postsCount || 0,
    role: a.role,
    beliefType: a.beliefType,
    beliefPrivacy: a.beliefPrivacy,
    verified: a.verified,
  }));

  const map = new Map<string, User>();
  
  initialUsers.forEach(u => {
    if (u && u.id && u.id !== 'guest') map.set(u.id, u);
  });

  registeredUsers.forEach(u => {
    if (u && u.id && u.id !== 'guest') map.set(u.id, u);
  });

  if (currentUser && currentUser.id && currentUser.id !== 'guest') {
    map.set(currentUser.id, currentUser);
  }

  return Array.from(map.values());
}

// ==================== ПОДПИСКИ (FOLLOWING) ====================

export function getStoredFollowingIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOLLOWING);
    if (raw !== null) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function setStoredFollowingIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY_FOLLOWING, JSON.stringify(ids));
  window.dispatchEvent(new Event('follow_change'));
}

export function isUserFollowed(targetUserId: string): boolean {
  return getStoredFollowingIds().includes(targetUserId);
}

// Подписаться/Отписаться — API + кэш
export function toggleUserFollow(targetUserId: string): boolean {
  const ids = getStoredFollowingIds();
  const isCurrentlyFollowing = ids.includes(targetUserId);
  let isNowFollowing: boolean;

  if (isCurrentlyFollowing) {
    setStoredFollowingIds(ids.filter(id => id !== targetUserId));
    isNowFollowing = false;
    api.users.unfollow(targetUserId).catch(() => {});
  } else {
    setStoredFollowingIds([...ids, targetUserId]);
    isNowFollowing = true;
    api.users.follow(targetUserId).catch(() => {});
  }

  return isNowFollowing;
}

// ==================== ПОДПИСЧИКИ (FOLLOWERS) ====================

export function getStoredFollowersMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOLLOWERS_MAP);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function setStoredFollowersMap(map: Record<string, string[]>): void {
  localStorage.setItem(STORAGE_KEY_FOLLOWERS_MAP, JSON.stringify(map));
  window.dispatchEvent(new Event('follow_change'));
}

export function getFollowersForUser(targetUserId: string, allUsers: User[], _currentUserId?: string): User[] {
  const map = getStoredFollowersMap();
  const candidates = allUsers.filter(u => u.id !== targetUserId && u.id !== 'guest');

  if (map[targetUserId] && Array.isArray(map[targetUserId])) {
    const idSet = new Set(map[targetUserId]);
    return candidates.filter(u => idSet.has(u.id));
  }

  return [];
}

export function getFollowingForUser(targetUserId: string, allUsers: User[], isMe: boolean): User[] {
  const candidates = allUsers.filter(u => u.id !== targetUserId && u.id !== 'guest');

  if (isMe) {
    const myFollowingIds = new Set(getStoredFollowingIds());
    return candidates.filter(u => myFollowingIds.has(u.id));
  }

  return [];
}

// ==================== КРИТИКИ ====================

export function getStoredCriticsMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CRITICS_MAP);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function setStoredCriticsMap(map: Record<string, string[]>): void {
  localStorage.setItem(STORAGE_KEY_CRITICS_MAP, JSON.stringify(map));
  window.dispatchEvent(new Event('follow_change'));
}

export function getCriticsForUser(targetUserId: string, allUsers: User[]): User[] {
  const map = getStoredCriticsMap();
  const candidates = allUsers.filter(u => u.id !== targetUserId && u.id !== 'guest');

  if (map[targetUserId] && Array.isArray(map[targetUserId])) {
    const idSet = new Set(map[targetUserId]);
    return candidates.filter(u => idSet.has(u.id));
  }

  return [];
}

export function toggleUserCritic(targetUserId: string, currentUserId: string): boolean {
  const map = getStoredCriticsMap();
  const list = map[targetUserId] ? [...map[targetUserId]] : [];
  const index = list.indexOf(currentUserId);
  let isNowCritic = false;

  if (index >= 0) {
    list.splice(index, 1);
    isNowCritic = false;
  } else {
    list.push(currentUserId);
    isNowCritic = true;
  }

  map[targetUserId] = list;
  setStoredCriticsMap(map);
  return isNowCritic;
}

export function isUserCritic(targetUserId: string, currentUserId: string): boolean {
  const map = getStoredCriticsMap();
  const list = map[targetUserId] || [];
  return list.includes(currentUserId);
}
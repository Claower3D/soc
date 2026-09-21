import { initialUsers, type User } from '../data/mock';
import type { RegisteredAccount } from '../context/AuthContext';
import { api } from '../api';

const STORAGE_KEY_FOLLOWING = 'new_age_following_map';
const STORAGE_KEY_FOLLOWERS_MAP = 'new_age_custom_followers_map';
const STORAGE_KEY_CRITICS_MAP = 'new_age_critics_map';
const STORAGE_KEY_CACHED_USERS = 'new_age_cached_users_pool';

// Кэш внешних пользователей (найденных через поиск/бекенд)
export function getStoredCachedUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CACHED_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

export function cacheUser(user: User): void {
  if (!user || !user.id || user.id === 'guest') return;
  try {
    const current = getStoredCachedUsers().filter(u => u.id !== user.id && u.username !== user.username);
    current.push(user);
    // Ограничиваем кэш последними 200 пользователями
    if (current.length > 200) current.shift();
    localStorage.setItem(STORAGE_KEY_CACHED_USERS, JSON.stringify(current));
  } catch { /* ignore */ }
}

// Получить пул всех пользователей (моки + зарегистрированные + кэшированные с бекенда)
export function getAllUsersPool(currentUser?: User, allAccounts: RegisteredAccount[] = []): User[] {
  const map = new Map<string, User>();

  initialUsers.forEach(u => {
    if (u && u.id && u.id !== 'guest') map.set(u.id, u);
  });

  const cachedUsers = getStoredCachedUsers();
  cachedUsers.forEach(u => {
    if (u && u.id && u.id !== 'guest') map.set(u.id, u);
  });

  allAccounts.forEach(a => {
    if (a && a.id && a.id !== 'guest') {
      map.set(a.id, {
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
      });
    }
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
  if (!targetUserId) return false;
  return getStoredFollowingIds().includes(targetUserId);
}

// Подписаться/Отписаться — синхронизирует и свои подписки, и чужих подписчиков!
export function toggleUserFollow(targetUserId: string, currentUserId?: string, targetUser?: User): boolean {
  if (!targetUserId) return false;

  const followingIds = getStoredFollowingIds();
  const isCurrentlyFollowing = followingIds.includes(targetUserId);
  let isNowFollowing: boolean;

  // 1. Обновляем свой список подписок (following)
  if (isCurrentlyFollowing) {
    setStoredFollowingIds(followingIds.filter(id => id !== targetUserId));
    isNowFollowing = false;
    api.users.unfollow(targetUserId).catch(() => {});
  } else {
    setStoredFollowingIds([...followingIds, targetUserId]);
    isNowFollowing = true;
    api.users.follow(targetUserId).catch(() => {});
  }

  // 2. Обновляем список подписчиков цели (followers map)
  if (currentUserId && currentUserId !== 'guest') {
    const followersMap = getStoredFollowersMap();
    const currentFollowers = followersMap[targetUserId] ? [...followersMap[targetUserId]] : [];
    const index = currentFollowers.indexOf(currentUserId);

    if (isNowFollowing) {
      if (index === -1) currentFollowers.push(currentUserId);
    } else {
      if (index >= 0) currentFollowers.splice(index, 1);
    }

    followersMap[targetUserId] = currentFollowers;
    localStorage.setItem(STORAGE_KEY_FOLLOWERS_MAP, JSON.stringify(followersMap));
  }

  // 3. Сохраняем целевого пользователя в кэш
  if (targetUser) {
    cacheUser(targetUser);
  }

  window.dispatchEvent(new Event('follow_change'));
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

export function getFollowersForUser(targetUserId: string, allUsers: User[], currentUserId?: string): User[] {
  if (!targetUserId) return [];
  const map = getStoredFollowersMap();
  const candidates = allUsers.filter(u => u.id !== targetUserId && u.id !== 'guest');

  if (map[targetUserId] && Array.isArray(map[targetUserId])) {
    const idSet = new Set(map[targetUserId]);
    const list = candidates.filter(u => idSet.has(u.id));
    // Если текущий юзер подписан, но его нет среди кандидатов пула, гарантируем его наличие
    if (currentUserId && idSet.has(currentUserId) && !list.some(u => u.id === currentUserId)) {
      const me = allUsers.find(u => u.id === currentUserId);
      if (me) list.push(me);
    }
    return list;
  }

  return [];
}

export function getFollowingForUser(targetUserId: string, allUsers: User[], isMe: boolean): User[] {
  if (!targetUserId) return [];
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
  if (!targetUserId) return [];
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
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

function getFollowingStorageKey(currentUserId?: string): string {
  if (currentUserId && currentUserId !== 'guest') {
    return `new_age_following_map_${currentUserId}`;
  }
  try {
    const raw = localStorage.getItem('new_age_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id && u.id !== 'guest') return `new_age_following_map_${u.id}`;
    }
  } catch { /* ignore */ }
  return STORAGE_KEY_FOLLOWING;
}

export function getStoredFollowingIds(currentUserId?: string): string[] {
  try {
    const key = getFollowingStorageKey(currentUserId);
    const raw = localStorage.getItem(key);
    let list: string[] = [];
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } else if (key !== STORAGE_KEY_FOLLOWING) {
      const legacyRaw = localStorage.getItem(STORAGE_KEY_FOLLOWING);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        if (Array.isArray(parsed)) list = parsed;
      }
    }
    return Array.from(new Set(list.filter((id: string) => typeof id === 'string' && id && id !== currentUserId && id !== 'guest' && id !== 'me')));
  } catch { /* ignore */ }
  return [];
}

export function setStoredFollowingIds(ids: string[], currentUserId?: string): void {
  const key = getFollowingStorageKey(currentUserId);
  const cleanIds = Array.from(new Set(ids.filter((id: string) => typeof id === 'string' && id && id !== currentUserId && id !== 'guest' && id !== 'me')));
  localStorage.setItem(key, JSON.stringify(cleanIds));
  window.dispatchEvent(new Event('follow_change'));
}

export function isUserFollowed(targetUserId: string, currentUserId?: string): boolean {
  if (!targetUserId) return false;
  const list = getStoredFollowingIds(currentUserId);
  const cleanTarget = targetUserId.replace(/^@+/, '').trim().toLowerCase();
  return list.some(id => {
    const cleanId = id.replace(/^@+/, '').trim().toLowerCase();
    return id === targetUserId || cleanId === cleanTarget;
  });
}

export interface ToggleFollowResult {
  isFollowed: boolean;
  isFriend: boolean;
  status: string;
  followersCount?: number;
  followingCount?: number;
  friendsCount?: number;
}

// Подписаться/Отписаться — синхронизирует и свои подписки, и чужих подписчиков!
export function toggleUserFollow(targetUserId: string, currentUserId?: string, targetUser?: User): boolean {
  if (!targetUserId) return false;

  const followingIds = getStoredFollowingIds(currentUserId);
  const isCurrentlyFollowing = followingIds.includes(targetUserId);
  let isNowFollowing: boolean;

  // 1. Обновляем свой список подписок (following)
  if (isCurrentlyFollowing) {
    setStoredFollowingIds(followingIds.filter(id => id !== targetUserId), currentUserId);
    isNowFollowing = false;
    api.users.unfollow(targetUserId).catch(() => {});
  } else {
    setStoredFollowingIds([...followingIds, targetUserId], currentUserId);
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

// Асинхронная версия с получением точного статуса взаимной дружбы от бекенда
export async function toggleUserFollowAsync(
  targetUserId: string, 
  currentUserId?: string, 
  targetUser?: User
): Promise<ToggleFollowResult> {
  if (!targetUserId) return { isFollowed: false, isFriend: false, status: 'none' };

  const followingIds = getStoredFollowingIds(currentUserId);
  const isCurrentlyFollowing = followingIds.includes(targetUserId);
  let isNowFollowing: boolean;

  let backendData: any = null;
  try {
    if (isCurrentlyFollowing) {
      backendData = await api.users.unfollow(targetUserId);
    } else {
      backendData = await api.users.follow(targetUserId);
    }
  } catch (err) {
    console.warn('Backend follow toggle error, using local fallback:', err);
  }

  if (isCurrentlyFollowing) {
    setStoredFollowingIds(followingIds.filter(id => id !== targetUserId), currentUserId);
    isNowFollowing = false;
  } else {
    setStoredFollowingIds([...followingIds, targetUserId], currentUserId);
    isNowFollowing = true;
  }

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

  if (targetUser) {
    cacheUser(targetUser);
  }

  window.dispatchEvent(new Event('follow_change'));

  return {
    isFollowed: isNowFollowing,
    isFriend: backendData?.isFriend ?? false,
    status: backendData?.status ?? (isNowFollowing ? 'pending' : 'none'),
    followersCount: backendData?.followersCount,
    followingCount: backendData?.followingCount,
    friendsCount: backendData?.friendsCount,
  };
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
  const cleanTarget = targetUserId.replace(/^@+/, '').trim().toLowerCase();
  const map = getStoredFollowersMap();
  const candidates = allUsers.filter(u => {
    const uid = u.id ? String(u.id).toLowerCase() : '';
    const uuser = u.username ? u.username.replace(/^@+/, '').toLowerCase() : '';
    return uid !== cleanTarget && uuser !== cleanTarget && u.id !== 'guest';
  });

  const followersList = map[targetUserId] || map[cleanTarget] || map['@' + cleanTarget] || [];
  if (Array.isArray(followersList) && followersList.length > 0) {
    const idSet = new Set(followersList.map(id => id.replace(/^@+/, '').toLowerCase()));
    const list = candidates.filter(u => {
      const uid = u.id ? String(u.id).toLowerCase() : '';
      const uuser = u.username ? u.username.replace(/^@+/, '').toLowerCase() : '';
      return idSet.has(uid) || idSet.has(uuser);
    });
    if (currentUserId && idSet.has(currentUserId.replace(/^@+/, '').toLowerCase()) && !list.some(u => u.id === currentUserId)) {
      const me = allUsers.find(u => u.id === currentUserId);
      if (me) list.push(me);
    }
    return list;
  }

  return [];
}

export function getFollowingForUser(targetUserId: string, allUsers: User[], isMe: boolean, currentUserId?: string): User[] {
  if (!targetUserId) return [];
  const candidates = allUsers.filter(u => u.id !== targetUserId && u.id !== 'guest');

  if (isMe) {
    const myFollowingIds = new Set(getStoredFollowingIds(currentUserId));
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
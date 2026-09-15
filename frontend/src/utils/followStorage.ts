import { initialUsers, type User } from '../data/mock';
import type { RegisteredAccount } from '../context/AuthContext';

const STORAGE_KEY_FOLLOWING = 'new_age_following_map';
const STORAGE_KEY_FOLLOWERS_MAP = 'new_age_custom_followers_map';
const STORAGE_KEY_CRITICS_MAP = 'new_age_critics_map';

// Get all available system users (mock + registered accounts)
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

// Read following IDs (current user's subscriptions)
export function getStoredFollowingIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOLLOWING);
    if (raw !== null) return JSON.parse(raw);
  } catch {
    // ignore
  }
  // Initial default: 1 follow (Алиса Иванова)
  const defaultFollowing = ['1'];
  localStorage.setItem(STORAGE_KEY_FOLLOWING, JSON.stringify(defaultFollowing));
  return defaultFollowing;
}

// Save following IDs
export function setStoredFollowingIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY_FOLLOWING, JSON.stringify(ids));
  window.dispatchEvent(new Event('follow_change'));
}

// Check if current user is following targetUserId
export function isUserFollowed(targetUserId: string): boolean {
  const ids = getStoredFollowingIds();
  return ids.includes(targetUserId);
}

// Toggle follow/unfollow
export function toggleUserFollow(targetUserId: string): boolean {
  const ids = getStoredFollowingIds();
  const index = ids.indexOf(targetUserId);
  let isNowFollowing = false;
  let nextIds: string[];

  if (index >= 0) {
    nextIds = ids.filter(id => id !== targetUserId);
    isNowFollowing = false;
  } else {
    nextIds = [...ids, targetUserId];
    isNowFollowing = true;
  }

  setStoredFollowingIds(nextIds);
  return isNowFollowing;
}

// --- FOLLOWERS MAP STORAGE ---
export function getStoredFollowersMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOLLOWERS_MAP);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

export function setStoredFollowersMap(map: Record<string, string[]>): void {
  localStorage.setItem(STORAGE_KEY_FOLLOWERS_MAP, JSON.stringify(map));
  window.dispatchEvent(new Event('follow_change'));
}

// Get realistic list of follower User objects for any profile
export function getFollowersForUser(targetUserId: string, allUsers: User[], currentUserId?: string): User[] {
  const map = getStoredFollowersMap();
  const candidates = allUsers.filter(u => u.id !== targetUserId && u.id !== 'guest');

  // If we already saved custom followers for this user
  if (map[targetUserId] && Array.isArray(map[targetUserId])) {
    const idSet = new Set(map[targetUserId]);
    return candidates.filter(u => idSet.has(u.id));
  }

  // Initial defaults based on mock data or registered accounts:
  let defaultIds: string[] = [];
  if (targetUserId === 'me' || targetUserId === currentUserId) {
    // Current user has 6 real followers (users 1, 2, 3, 4, 5, 6)
    defaultIds = ['1', '2', '3', '4', '5', '6'];
  } else {
    // For other users, deterministic slice
    defaultIds = candidates.slice(0, 4).map(u => u.id);
  }

  // Save to map so count is 100% exact and stable
  map[targetUserId] = defaultIds;
  try {
    localStorage.setItem(STORAGE_KEY_FOLLOWERS_MAP, JSON.stringify(map));
  } catch {
    // ignore
  }

  const idSet = new Set(defaultIds);
  return candidates.filter(u => idSet.has(u.id));
}

// Get following User objects for any profile
export function getFollowingForUser(targetUserId: string, allUsers: User[], isMe: boolean): User[] {
  const candidates = allUsers.filter(u => u.id !== targetUserId && u.id !== 'guest');

  if (isMe) {
    const myFollowingIds = new Set(getStoredFollowingIds());
    return candidates.filter(u => myFollowingIds.has(u.id));
  }

  return candidates.filter((_, idx) => idx === 0);
}

// --- CRITICS MAP STORAGE ---
export function getStoredCriticsMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CRITICS_MAP);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

export function setStoredCriticsMap(map: Record<string, string[]>): void {
  localStorage.setItem(STORAGE_KEY_CRITICS_MAP, JSON.stringify(map));
  window.dispatchEvent(new Event('follow_change'));
}

// Get critics User objects for any profile
export function getCriticsForUser(targetUserId: string, allUsers: User[]): User[] {
  const map = getStoredCriticsMap();
  const candidates = allUsers.filter(u => u.id !== targetUserId && u.id !== 'guest');

  if (map[targetUserId] && Array.isArray(map[targetUserId])) {
    const idSet = new Set(map[targetUserId]);
    return candidates.filter(u => idSet.has(u.id));
  }

  // Realistic critics initial list (e.g. 3 users: 2, 4, 7)
  const defaultCritics = candidates.filter((u, idx) => u.role === 'critic' || idx === 1 || idx === 3 || idx === 6);
  const criticIds = defaultCritics.map(u => u.id);
  map[targetUserId] = criticIds;
  try {
    localStorage.setItem(STORAGE_KEY_CRITICS_MAP, JSON.stringify(map));
  } catch {
    // ignore
  }

  return defaultCritics;
}

// Toggle user as critic for target user
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

import { initialUsers, type User } from '../data/mock';
import type { RegisteredAccount } from '../context/AuthContext';

const STORAGE_KEY_FOLLOWING = 'new_age_following_map';
const STORAGE_KEY_FOLLOWERS_MAP = 'new_age_custom_followers_map';

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
    followersCount: a.followersCount || 1,
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
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return ['1', '3', '4', '8'];
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

// Get realistic list of follower User objects for any profile
export function getFollowersForUser(targetUserId: string, allUsers: User[], currentUserId?: string): User[] {
  const candidates = allUsers.filter(u => u.id !== targetUserId && u.id !== 'guest');
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOLLOWERS_MAP);
    if (raw) {
      const map: Record<string, string[]> = JSON.parse(raw);
      if (map[targetUserId] && Array.isArray(map[targetUserId])) {
        const idSet = new Set(map[targetUserId]);
        return candidates.filter(u => idSet.has(u.id));
      }
    }
  } catch {
    // ignore
  }

  // Realistic deterministic follower assignment
  const followers = candidates.filter((u, index) => {
    if (currentUserId && u.id === currentUserId) return false;
    return index % 2 === 0 || index % 3 === 0;
  });

  return followers.length > 0 ? followers : candidates.slice(0, 4);
}

// Get following User objects for any profile
export function getFollowingForUser(targetUserId: string, allUsers: User[], isMe: boolean): User[] {
  const candidates = allUsers.filter(u => u.id !== targetUserId && u.id !== 'guest');

  if (isMe) {
    const myFollowingIds = new Set(getStoredFollowingIds());
    return candidates.filter(u => myFollowingIds.has(u.id));
  }

  return candidates.filter((_, idx) => idx % 2 === 1).slice(0, 5);
}

// Get critics User objects for any profile
export function getCriticsForUser(targetUserId: string, allUsers: User[]): User[] {
  const candidates = allUsers.filter(u => u.id !== targetUserId && u.id !== 'guest');
  return candidates.filter((u, idx) => u.role === 'critic' || idx === 1 || idx === 4);
}

import { api } from '../api';
import { type Story } from '../data/mock';

let isSyncing = false;

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function isStoryExpired(story: Story): boolean {
  if (!story) return true;
  const now = Date.now();
  if (story.expiresAt) {
    const exp = new Date(story.expiresAt).getTime();
    if (!isNaN(exp)) return now >= exp;
  }
  if (story.createdAt) {
    const created = new Date(story.createdAt).getTime();
    if (!isNaN(created)) return now - created >= TWENTY_FOUR_HOURS_MS;
  }
  if (story.id && story.id.startsWith('story_')) {
    const tsStr = story.id.replace('story_', '');
    const ts = parseInt(tsStr, 10);
    if (!isNaN(ts) && ts > 1000000000000) {
      return now - ts >= TWENTY_FOUR_HOURS_MS;
    }
  }
  return false;
}

export async function syncLocalStoriesWithServer(): Promise<Story[]> {
  if (isSyncing) {
    try {
      const res = await api.stories.list();
      const list = Array.isArray(res) ? res : (res?.data || []);
      return list.filter((s: Story) => !isStoryExpired(s));
    } catch {
      return [];
    }
  }

  isSyncing = true;
  try {
    const rawLocal = localStorage.getItem('new_age_user_stories');
    if (rawLocal) {
      try {
        const localStories: Story[] = JSON.parse(rawLocal);
        if (Array.isArray(localStories)) {
          // Filter out stories older than 24 hours
          const validStories = localStories.filter(s => !isStoryExpired(s));
          if (validStories.length !== localStories.length) {
            localStorage.setItem('new_age_user_stories', JSON.stringify(validStories));
          }
          if (validStories.length > 0) {
            await api.stories.sync(validStories).catch(console.warn);
          }
        }
      } catch (parseErr) {
        console.warn('Failed to parse local stories', parseErr);
      }
    }

    const res = await api.stories.list();
    const serverStories = Array.isArray(res) ? res : (res?.data || []);
    return serverStories.filter((s: Story) => !isStoryExpired(s));
  } catch (err) {
    console.warn('Stories sync failed:', err);
    return [];
  } finally {
    isSyncing = false;
  }
}

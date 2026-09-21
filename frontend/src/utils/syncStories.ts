import { api } from '../api';
import { type Story } from '../data/mock';

let isSyncing = false;

export async function syncLocalStoriesWithServer(): Promise<Story[]> {
  if (isSyncing) {
    try {
      const res = await api.stories.list();
      return Array.isArray(res) ? res : (res?.data || []);
    } catch {
      return [];
    }
  }

  isSyncing = true;
  try {
    const rawLocal = localStorage.getItem('new_age_user_stories');
    if (rawLocal) {
      const localStories: Story[] = JSON.parse(rawLocal);
      if (Array.isArray(localStories) && localStories.length > 0) {
        await api.stories.sync(localStories).catch(console.warn);
      }
    }

    const res = await api.stories.list();
    const serverStories = Array.isArray(res) ? res : (res?.data || []);
    return serverStories;
  } catch (err) {
    console.warn('Stories sync failed:', err);
    return [];
  } finally {
    isSyncing = false;
  }
}

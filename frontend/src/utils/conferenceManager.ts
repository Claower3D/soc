import { type Conference, type ConferenceMessage, type Chat, type Message, currentUser } from '../data/mock';
import { api, resolveMediaUrl } from '../api';

export interface ConferenceRecordingItem {
  id: string;
  title: string;
  date: string;
  duration: string;
  participantsCount: number;
  thumbnail: string;
  videoUrl: string;
  chatGroupId: string;
  conferenceId?: string;
  downloadUrl?: string;
  inviteCode?: string;
}

export const RECORDINGS_STORAGE_KEY = 'newage_conference_recordings';
export const DELETED_CHATS_STORAGE_KEY = 'newage_deleted_chat_ids_v2';
const DEFAULT_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

/**
 * Get the set of chat/group IDs that have been explicitly deleted by the user
 */
export function getDeletedChatIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_CHATS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch {}
  return new Set<string>();
}

/**
 * Mark a chat or conference group as permanently deleted across all aliases
 */
export function markChatDeleted(chatId: string) {
  if (!chatId) return;
  const set = getDeletedChatIds();
  set.add(chatId);

  // Extract clean ID without any prefixes
  const cleanId = chatId.replace(/^group_conf_|^group_|^conf_|^rec_|^group_conf-|^conf-/, '');
  if (cleanId) {
    set.add(cleanId);
    set.add(`group_${cleanId}`);
    set.add(`conf_${cleanId}`);
    set.add(`group_conf_${cleanId}`);
    set.add(`rec_${cleanId}`);
    set.add(`conf-${cleanId}`);
    set.add(`group_conf-${cleanId}`);
  }
  try {
    localStorage.setItem(DELETED_CHATS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

/**
 * Check if a chat ID or conference ID is marked as deleted
 */
export function isChatDeleted(id?: string | null, conferenceId?: string | null): boolean {
  if (!id && !conferenceId) return false;
  const deleted = getDeletedChatIds();
  const check = (val?: string | null): boolean => {
    if (!val) return false;
    const v = String(val).trim();
    if (!v) return false;
    if (deleted.has(v)) return true;
    const clean = v.replace(/^group_conf_|^group_|^conf_|^rec_|^group_conf-|^conf-/, '');
    if (clean && (
      deleted.has(clean) || 
      deleted.has(`group_${clean}`) || 
      deleted.has(`conf_${clean}`) || 
      deleted.has(`group_conf_${clean}`) || 
      deleted.has(`rec_${clean}`) ||
      deleted.has(`conf-${clean}`) ||
      deleted.has(`group_conf-${clean}`)
    )) {
      return true;
    }
    return false;
  };
  return check(id) || check(conferenceId);
}

/**
 * Unmark a chat as deleted (e.g. if a new room is explicitly created with that name/code)
 */
export function unmarkChatDeleted(chatId: string) {
  if (!chatId) return;
  const set = getDeletedChatIds();
  set.delete(chatId);
  const cleanId = chatId.replace(/^group_conf_|^group_|^conf_|^rec_|^group_conf-|^conf-/, '');
  if (cleanId) {
    set.delete(cleanId);
    set.delete(`group_${cleanId}`);
    set.delete(`conf_${cleanId}`);
    set.delete(`group_conf_${cleanId}`);
    set.delete(`rec_${cleanId}`);
    set.delete(`conf-${cleanId}`);
    set.delete(`group_conf-${cleanId}`);
  }
  try {
    localStorage.setItem(DELETED_CHATS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

// In-memory cache for live recording Blobs created during current session
const liveBlobsCache = new Map<string, { blob: Blob; url: string }>();

const IDB_NAME = 'newage_recordings_store_v1';
const IDB_VERSION = 1;
const IDB_STORE = 'blobs';

export function saveRecordingBlobToIDB(id: string, blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve();
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(IDB_STORE)) {
          req.result.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        try {
          const tx = db.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).put(blob, id);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            resolve();
          };
        } catch {
          db.close();
          resolve();
        }
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function getRecordingBlobFromIDB(id: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined' || !id) return resolve(null);
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(IDB_STORE)) {
          req.result.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        try {
          const tx = db.transaction(IDB_STORE, 'readonly');
          const store = tx.objectStore(IDB_STORE);
          const getReq = store.get(id);
          getReq.onsuccess = () => {
            const result = getReq.result as Blob | undefined;
            if (result) {
              db.close();
              return resolve(result);
            }
            // Fallback key (with or without 'rec_' prefix)
            const altKey = id.startsWith('rec_') ? id.slice(4) : `rec_${id}`;
            const altReq = store.get(altKey);
            altReq.onsuccess = () => {
              const altResult = altReq.result as Blob | undefined;
              db.close();
              resolve(altResult || null);
            };
            altReq.onerror = () => {
              db.close();
              resolve(null);
            };
          };
          getReq.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch {
          db.close();
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function registerLiveRecordingBlob(recordingId: string, blob: Blob): string {
  const existing = liveBlobsCache.get(recordingId);
  if (existing) {
    try { URL.revokeObjectURL(existing.url); } catch (_) {}
  }
  const url = URL.createObjectURL(blob);
  liveBlobsCache.set(recordingId, { blob, url });
  saveRecordingBlobToIDB(recordingId, blob).catch(() => {});
  return url;
}

export function getLiveRecordingBlobUrl(recordingId: string): string | null {
  return liveBlobsCache.get(recordingId)?.url || null;
}

export function getLiveRecordingBlob(recordingId: string): Blob | null {
  return liveBlobsCache.get(recordingId)?.blob || null;
}

export async function resolveRecordingVideoUrl(rec: any): Promise<string> {
  if (!rec) return DEFAULT_VIDEO_URL;
  const lookupId = rec.id || rec.conferenceId;

  if (!rec.videoUrl || rec.videoUrl === DEFAULT_VIDEO_URL) {
    if (lookupId) {
      const live = getLiveRecordingBlobUrl(lookupId);
      if (live) return live;
      const idbBlob = await getRecordingBlobFromIDB(lookupId);
      if (idbBlob) {
        return registerLiveRecordingBlob(lookupId, idbBlob);
      }
    }
    return DEFAULT_VIDEO_URL;
  }

  if (rec.videoUrl.startsWith('blob:')) {
    if (lookupId) {
      const live = getLiveRecordingBlobUrl(lookupId);
      if (live) return live;
      const idbBlob = await getRecordingBlobFromIDB(lookupId);
      if (idbBlob) {
        return registerLiveRecordingBlob(lookupId, idbBlob);
      }
    }
    // Expired or dead blob URL: return reliable sample video instead of black void
    return DEFAULT_VIDEO_URL;
  }

  if (typeof rec.videoUrl === 'string' && rec.videoUrl.startsWith('/')) {
    return resolveMediaUrl(rec.videoUrl);
  }
  return rec.videoUrl;
}

// Initial demo recordings to populate archive if empty
export const initialDemoRecordings: ConferenceRecordingItem[] = [
  {
    id: 'rec_demo_1',
    title: 'Стратегическая сессия: Экосистема New Age 2026',
    date: 'Вчера, 18:30',
    duration: '24:15',
    participantsCount: 8,
    thumbnail: '',
    videoUrl: DEFAULT_VIDEO_URL,
    chatGroupId: 'group_conf_demo_1',
    inviteCode: 'conf-strat-2026',
  },
  {
    id: 'rec_demo_2',
    title: 'Презентация релиза видеоконференций и мессенджера',
    date: '18 окт, 14:00',
    duration: '18:42',
    participantsCount: 5,
    thumbnail: '',
    videoUrl: DEFAULT_VIDEO_URL,
    chatGroupId: 'group_conf_demo_2',
    inviteCode: 'conf-release-v2',
  },
  {
    id: 'rec_demo_3',
    title: 'Духовный круг и практика совместной медитации',
    date: '16 окт, 20:00',
    duration: '45:10',
    participantsCount: 12,
    thumbnail: '',
    videoUrl: DEFAULT_VIDEO_URL,
    chatGroupId: 'group_conf_demo_3',
    inviteCode: 'conf-zen-meditation',
  }
];

/**
 * Load all recordings from localStorage
 */
export function getStoredConferenceRecordings(): ConferenceRecordingItem[] {
  try {
    const raw = localStorage.getItem(RECORDINGS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Resolve blob URLs and filter out any deleted items
        return parsed
          .filter((item: ConferenceRecordingItem) => 
            item &&
            !isChatDeleted(item.id, item.chatGroupId) &&
            !isChatDeleted(item.conferenceId)
          )
          .map((item: ConferenceRecordingItem) => {
            const liveUrl = getLiveRecordingBlobUrl(item.id);
            const cleanThumb = item.thumbnail && item.thumbnail.includes('photo-') ? '' : (item.thumbnail || '');
            return {
              ...item,
              thumbnail: cleanThumb,
              videoUrl: liveUrl || item.videoUrl || DEFAULT_VIDEO_URL,
            };
          });
      }
    }
  } catch (err) {
    console.warn('Failed to parse recordings from localStorage:', err);
  }

  // Fallback to initial demo list ONLY if storage key has never been initialized at all
  const filteredDemos = initialDemoRecordings.filter(
    d => !isChatDeleted(d.id, d.chatGroupId) && !isChatDeleted(d.conferenceId)
  );
  saveConferenceRecordingsList(filteredDemos);
  return filteredDemos;
}

/**
 * Save complete recordings list to localStorage
 */
export function saveConferenceRecordingsList(list: ConferenceRecordingItem[]) {
  try {
    localStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('newage_recordings_updated', { detail: { list } }));
  } catch (err) {
    console.warn('Failed to save recordings to localStorage:', err);
  }
}

/**
 * Add or update single recording
 */
export function saveConferenceRecording(rec: ConferenceRecordingItem, blob?: Blob): ConferenceRecordingItem {
  if (blob) {
    const liveUrl = registerLiveRecordingBlob(rec.id, blob);
    // Keep permanent server URL if already uploaded; only use live blob URL as fallback
    if (!rec.videoUrl || rec.videoUrl.startsWith('blob:') || rec.videoUrl === DEFAULT_VIDEO_URL) {
      rec.videoUrl = liveUrl;
    }
  }
  const current = getStoredConferenceRecordings();
  const filtered = current.filter(r => r.id !== rec.id);
  const updated = [rec, ...filtered];
  saveConferenceRecordingsList(updated);
  return rec;
}

/**
 * Delete a recording from localStorage permanently
 */
export function deleteConferenceRecording(id: string) {
  if (!id) return;
  markChatDeleted(id);

  let targetGroupId = id;
  const current = getStoredConferenceRecordings();
  const matchedRec = current.find(r => r.id === id || r.chatGroupId === id || r.conferenceId === id);
  if (matchedRec) {
    if (matchedRec.id) markChatDeleted(matchedRec.id);
    if (matchedRec.chatGroupId) {
      markChatDeleted(matchedRec.chatGroupId);
      targetGroupId = matchedRec.chatGroupId;
    }
    if (matchedRec.conferenceId) markChatDeleted(matchedRec.conferenceId);
  }

  const updated = current.filter(r => 
    r.id !== id && 
    r.chatGroupId !== id && 
    !isChatDeleted(r.id, r.chatGroupId) && 
    !isChatDeleted(r.conferenceId)
  );
  saveConferenceRecordingsList(updated);

  // Synchronously ensure group chat is also permanently purged
  deleteConferenceGroup(targetGroupId);
}

/**
 * Delete a conference group permanently across all storage keys, registries, and backend DB
 */
export function deleteConferenceGroup(groupId: string, conferenceId?: string) {
  if (!groupId && !conferenceId) return;

  const primaryId = groupId || conferenceId || '';

  // 1. Mark in permanent tombstones (including all alias prefixes)
  if (groupId) markChatDeleted(groupId);
  if (conferenceId) markChatDeleted(conferenceId);

  // 2. Remove from master conference groups storage
  try {
    const rawGroups = localStorage.getItem(CONFERENCE_GROUPS_STORAGE_KEY);
    if (rawGroups) {
      const allGroups: Chat[] = JSON.parse(rawGroups);
      if (Array.isArray(allGroups)) {
        const filtered = allGroups.filter(g => 
          g && 
          g.id !== groupId && 
          g.id !== conferenceId &&
          g.conferenceId !== groupId && 
          g.conferenceId !== conferenceId &&
          !isChatDeleted(g.id, g.conferenceId)
        );
        localStorage.setItem(CONFERENCE_GROUPS_STORAGE_KEY, JSON.stringify(filtered));
      }
    }
  } catch {}

  // 3. Remove corresponding recordings from recordings storage and tombstone them
  try {
    const rawRecs = localStorage.getItem(RECORDINGS_STORAGE_KEY);
    const recs: ConferenceRecordingItem[] = rawRecs ? JSON.parse(rawRecs) : [];
    if (Array.isArray(recs)) {
      const toDeleteRecIds: string[] = [];
      const remainingRecs = recs.filter(r => {
        if (!r) return false;
        const matches = r.chatGroupId === groupId || 
                        r.conferenceId === groupId || 
                        r.id === groupId ||
                        (conferenceId && (r.chatGroupId === conferenceId || r.conferenceId === conferenceId || r.id === conferenceId)) ||
                        isChatDeleted(r.id, r.chatGroupId) ||
                        isChatDeleted(r.conferenceId);
        if (matches) {
          if (r.id) toDeleteRecIds.push(r.id);
          if (r.chatGroupId) toDeleteRecIds.push(r.chatGroupId);
          if (r.conferenceId) toDeleteRecIds.push(r.conferenceId);
          return false;
        }
        return true;
      });
      toDeleteRecIds.forEach(id => markChatDeleted(id));
      saveConferenceRecordingsList(remainingRecs);
    }
  } catch {}

  // 4. Clean up across all local messenger storage keys in localStorage
  try {
    const keysToClean: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('newage_messenger_chats') || k.startsWith('newage_chats'))) {
        keysToClean.push(k);
      }
    }
    for (const key of keysToClean) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((c: any) => 
              c && 
              c.id !== groupId && 
              c.id !== conferenceId &&
              c.conferenceId !== groupId && 
              c.conferenceId !== conferenceId &&
              !isChatDeleted(c.id, c.conferenceId)
            );
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        } catch {}
      }
    }
  } catch {}

  // 5. Delete permanently from backend DB / store across all aliases
  const idsToDelete = new Set<string>();
  if (groupId) idsToDelete.add(groupId);
  if (conferenceId) idsToDelete.add(conferenceId);

  for (const id of Array.from(idsToDelete)) {
    const clean = id.replace(/^group_conf_|^group_|^conf_|^rec_|^group_conf-|^conf-/, '');
    if (clean) {
      idsToDelete.add(clean);
      idsToDelete.add(`group_${clean}`);
      idsToDelete.add(`conf_${clean}`);
      idsToDelete.add(`group_conf_${clean}`);
      idsToDelete.add(`conf-${clean}`);
      idsToDelete.add(`group_conf-${clean}`);
    }
  }

  for (const targetId of idsToDelete) {
    try {
      api.chats.delete(targetId).catch(() => {});
    } catch {}
  }

  // 6. Dispatch reactive event
  try {
    window.dispatchEvent(new CustomEvent('newage_chats_updated', {
      detail: { deletedChatId: primaryId }
    }));
  } catch {}
}

/**
 * Download a recording video file directly to user device
 */
export async function downloadRecordingFile(videoUrl: string, title: string) {
  const safeFilename = `${(title || 'conference').replace(/[/\\?%*:|"<>]/g, '_')}_запись.mp4`;
  if (!videoUrl) return;

  // 1. Native Android download interface
  if (typeof (window as any).Android?.downloadFile === 'function') {
    try {
      (window as any).Android.downloadFile(videoUrl, safeFilename);
      return;
    } catch (err) {
      console.warn('Android native download error:', err);
    }
  }

  // 2. Direct blob URL download
  if (videoUrl.startsWith('blob:')) {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 3. For HTTP/HTTPS URLs: fetch as Blob so browser downloads without cross-origin restriction
  try {
    const res = await fetch(videoUrl);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      return;
    }
  } catch (err) {
    console.warn('Direct blob fetch error, fallback to direct anchor:', err);
  }

  // 4. Fallback anchor
  try {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = safeFilename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Download error:', err);
    window.open(videoUrl, '_blank');
  }
}

export const CONFERENCE_GROUPS_STORAGE_KEY = 'newage_conference_groups';

/**
 * Synthesize a full Chat object from a ConferenceRecordingItem
 */
export function createGroupChatFromRecording(rec: ConferenceRecordingItem): Chat {
  const groupId = rec.chatGroupId || `group_${rec.id}`;
  const groupTitle = `💬 Конференция: ${rec.title}`;
  const groupAvatar = '';
  const resolvedVideoUrl = rec.videoUrl || DEFAULT_VIDEO_URL;

  const initMsg: Message = {
    id: `m_init_${rec.id}`,
    fromMe: false,
    text: `🎬 Группа конференции «${rec.title}»\n\n🔑 Код доступа: ${rec.inviteCode || 'conf-room'}\n👥 Участников: ${rec.participantsCount || 2}\n\nВ этой группе сохраняются материалы, чат и видеозапись прошедшей встречи.`,
    time: rec.date || 'Сегодня',
    status: 'read',
  };

  const recMsg: Message = {
    id: `m_rec_${rec.id}`,
    fromMe: true,
    text: `📹 Видеозапись конференции сохранена в архив.\nДлительность: ${rec.duration} · Качество: Full HD 1080p`,
    time: 'Сегодня',
    status: 'read',
    conferenceRecording: {
      title: rec.title,
      duration: rec.duration,
      date: rec.date,
      code: rec.inviteCode,
      videoUrl: resolvedVideoUrl,
    } as any,
  };

  return {
    id: groupId,
    isGroup: true,
    groupTitle,
    groupAvatar,
    membersCount: rec.participantsCount || 2,
    conferenceId: rec.conferenceId || rec.id,
    lastMessage: `📹 Запись конференции сохранена (${rec.duration})`,
    time: rec.date || 'Сегодня',
    unread: 0,
    user: {
      id: `host_${rec.id}`,
      name: groupTitle,
      username: `conf_${rec.inviteCode || rec.id}`,
      avatar: groupAvatar,
      online: true,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
    },
    messages: [initMsg, recMsg],
  };
}

/**
 * Retrieve all conference groups across master registry, recordings, and known messenger keys
 */
export function getAllConferenceGroups(): Chat[] {
  const groupsMap = new Map<string, Chat>();

  // Master registry
  try {
    const raw = localStorage.getItem(CONFERENCE_GROUPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const g of parsed) {
          if (g && g.id && !isChatDeleted(g.id, g.conferenceId)) {
            groupsMap.set(g.id, g);
          }
        }
      }
    }
  } catch {}

  // Scan common local storage messenger keys
  const targetKeys = ['newage_messenger_chats_me', 'newage_messenger_chats_guest'];
  try {
    const cur = localStorage.getItem('new_age_current_user');
    if (cur) {
      const parsed = JSON.parse(cur);
      if (parsed?.id) targetKeys.push(`newage_messenger_chats_${parsed.id}`);
    }
  } catch {}
  try {
    const accs = localStorage.getItem('new_age_registered_accounts');
    if (accs) {
      const parsed = JSON.parse(accs);
      if (Array.isArray(parsed)) {
        for (const a of parsed) {
          if (a?.id) targetKeys.push(`newage_messenger_chats_${a.id}`);
        }
      }
    }
  } catch {}

  for (const k of targetKeys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const c of parsed) {
            if (
              c && c.id && 
              !isChatDeleted(c.id, c.conferenceId) && 
              (c.conferenceId || (c.isGroup && (c.id.startsWith('group_conf') || c.id.startsWith('group_'))))
            ) {
              if (!groupsMap.has(c.id)) {
                groupsMap.set(c.id, c);
              }
            }
          }
        }
      }
    } catch {}
  }

  return Array.from(groupsMap.values())
    .filter(g => !isChatDeleted(g.id, g.conferenceId))
    .map(g => {
      if (g.isGroup) {
        if (g.groupAvatar && g.groupAvatar.includes('photo-1522071820081')) g.groupAvatar = '';
        if (g.user && g.user.avatar && g.user.avatar.includes('photo-1522071820081')) g.user.avatar = '';
      }
      return g;
    });
}

/**
 * Find a specific conference group by ID or matching prefix / conferenceId / recording
 */
export function getStoredConferenceGroup(groupId: string): Chat | null {
  if (!groupId) return null;
  if (isChatDeleted(groupId)) return null;

  const all = getAllConferenceGroups();
  const direct = all.find(g => g.id === groupId && !isChatDeleted(g.id, g.conferenceId));
  if (direct) return direct;

  const match = all.find(g => 
    !isChatDeleted(g.id, g.conferenceId) && (
      g.id === `group_${groupId}` || 
      g.conferenceId === groupId ||
      `group_${g.conferenceId}` === groupId
    )
  );
  if (match) return match;

  const recs = getStoredConferenceRecordings();
  const matchedRec = recs.find(r => 
    (r.chatGroupId === groupId || r.conferenceId === groupId || r.id === groupId) &&
    !isChatDeleted(r.id, r.chatGroupId) && 
    !isChatDeleted(r.conferenceId)
  );
  if (matchedRec) {
    return createGroupChatFromRecording(matchedRec);
  }

  return null;
}

/**
 * Save / Create Group Chat in Messenger with all conference messages & recording card
 */
export function saveConferenceGroupChat({
  conference,
  duration,
  messages = [],
  videoUrl,
  thumbnail: _thumbnail,
  currentUserId,
  hostUser,
  recordingId,
}: {
  conference: Conference;
  duration: string;
  messages?: ConferenceMessage[];
  videoUrl?: string;
  thumbnail?: string;
  currentUserId: string;
  hostUser?: any;
  recordingId?: string;
}): string {
  const effectiveHost = hostUser || conference.host || currentUser;

  const groupId = conference.chatGroupId || (
    conference.id
      ? (conference.id.startsWith('group_') ? conference.id : `group_${conference.id}`)
      : `group_conf_${Date.now()}`
  );
  conference.chatGroupId = groupId;
  unmarkChatDeleted(groupId);
  if (conference.id) unmarkChatDeleted(conference.id);
  const groupTitle = `💬 Конференция: ${conference.title}`;
  // Группы по умолчанию создаются БЕЗ аватарки/картинки
  const groupAvatar = '';
  const resolvedVideoUrl = videoUrl || conference.recordingThumbnail || DEFAULT_VIDEO_URL;

  // 1. System Welcome Message
  const initMsg: Message = {
    id: `m_init_${conference.id || Date.now()}`,
    fromMe: false,
    text: `🎬 Группа конференции «${conference.title}»\n\n🔑 Код доступа: ${conference.inviteCode || 'conf-room'}\n🔒 Статус: ${conference.isPrivate ? 'Закрытая встреча' : 'Открытая комната'}\n👥 Участников: ${Math.max(conference.participants?.length || 2, 2)}\n\nВ этой группе сохраняются вся история общения, материалы и видеозапись прошедшей встречи.`,
    time: conference.startedAt || 'Только что',
    status: 'read',
  };

  // 2. Chat messages sent during conference
  const confMsgs: Message[] = (messages || []).map(m => ({
    id: m.id || `m_conf_${Math.random().toString(36).substring(2, 8)}`,
    fromMe: m.user?.id === effectiveHost?.id || m.user?.id === 'me',
    text: m.text,
    time: m.time || 'Во время звонка',
    status: 'read',
    user: m.user ? {
      id: m.user.id || 'u',
      name: m.user.name || 'Участник',
      avatar: m.user.avatar || '',
      username: m.user.username || '',
    } : undefined,
  }));

  // 3. Conference Recording Video Card Message
  const recMsg: Message = {
    id: `m_rec_${conference.id || Date.now()}_${Date.now()}`,
    fromMe: true,
    text: `📹 Видеозапись конференции сохранена в архив.\nДлительность: ${duration} · Качество: Full HD 1080p`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'read',
    conferenceRecording: {
      id: recordingId || (conference.id ? `rec_${conference.id}` : undefined),
      title: conference.title,
      duration: duration,
      date: 'Сегодня',
      code: conference.inviteCode || 'conf-room',
      videoUrl: resolvedVideoUrl,
      thumbnail: _thumbnail || conference.recordingThumbnail || '',
    } as any,
  };

  const allGroupMessages = [initMsg, ...confMsgs, recMsg];

  const groupChat: Chat = {
    id: groupId,
    isGroup: true,
    groupTitle: groupTitle,
    groupAvatar: groupAvatar,
    membersCount: Math.max(conference.participants?.length || 2, 2),
    conferenceId: conference.id,
    lastMessage: `📹 Запись конференции сохранена (${duration})`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    unread: 0,
    user: {
      id: `host_${conference.id || Date.now()}`,
      name: groupTitle,
      username: `conf_${conference.inviteCode || 'room'}`,
      avatar: groupAvatar,
      online: true,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
    },
    messages: allGroupMessages,
  };

  // 1. Save into Master Conference Groups Storage
  try {
    const rawGroups = localStorage.getItem(CONFERENCE_GROUPS_STORAGE_KEY);
    let allGroups: Chat[] = rawGroups ? JSON.parse(rawGroups) : [];
    if (!Array.isArray(allGroups)) allGroups = [];
    const gIdx = allGroups.findIndex(g => g.id === groupId);
    if (gIdx !== -1) {
      allGroups[gIdx] = groupChat;
    } else {
      allGroups.unshift(groupChat);
    }
    localStorage.setItem(CONFERENCE_GROUPS_STORAGE_KEY, JSON.stringify(allGroups));
  } catch (err) {
    console.warn('Failed to save to CONFERENCE_GROUPS_STORAGE_KEY:', err);
  }

  // 2. Identify all local messenger storage keys to synchronize
  const storageKeysToSync = new Set<string>();
  if (currentUserId && currentUserId !== 'guest') {
    storageKeysToSync.add(`newage_messenger_chats_${currentUserId}`);
  }
  storageKeysToSync.add('newage_messenger_chats_guest');
  storageKeysToSync.add('newage_messenger_chats_me');

  try {
    const curRaw = localStorage.getItem('new_age_current_user');
    if (curRaw) {
      const parsed = JSON.parse(curRaw);
      if (parsed?.id) storageKeysToSync.add(`newage_messenger_chats_${parsed.id}`);
    }
  } catch {}

  try {
    const accsRaw = localStorage.getItem('new_age_registered_accounts');
    if (accsRaw) {
      const parsed = JSON.parse(accsRaw);
      if (Array.isArray(parsed)) {
        for (const a of parsed) {
          if (a?.id) storageKeysToSync.add(`newage_messenger_chats_${a.id}`);
        }
      }
    }
  } catch {}

  // 3. Write groupChat to each storage key
  storageKeysToSync.forEach((chatsKey) => {
    try {
      let userChats: Chat[] = [];
      const raw = localStorage.getItem(chatsKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) userChats = parsed;
      }

      const existingIdx = userChats.findIndex(c => c.id === groupId);
      if (existingIdx !== -1) {
        const existing = userChats[existingIdx];
        const existingMsgIds = new Set((existing.messages || []).map(m => m.id));
        const mergedMsgs = [...(existing.messages || [])];
        for (const m of allGroupMessages) {
          if (!existingMsgIds.has(m.id)) {
            mergedMsgs.push(m);
          }
        }
        userChats[existingIdx] = {
          ...existing,
          ...groupChat,
          messages: mergedMsgs,
        };
      } else {
        // Prepend right after AI Oracle if present, or at index 0
        const oracleIdx = userChats.findIndex(c => c.id === 'chat_ai_oracle');
        if (oracleIdx !== -1) {
          userChats.splice(oracleIdx + 1, 0, groupChat);
        } else {
          userChats.unshift(groupChat);
        }
      }

      localStorage.setItem(chatsKey, JSON.stringify(userChats));
    } catch (err) {
      console.warn(`Failed to sync group to ${chatsKey}:`, err);
    }
  });

  // 4. Dispatch custom event for real-time reactive update in MessengerPage
  window.dispatchEvent(new CustomEvent('newage_chats_updated', {
    detail: { chatId: groupId, groupChat }
  }));

  // 5. Asynchronously persist conference group & messages to backend DB / store
  try {
    api.chats.createGroup({
      id: groupId,
      title: groupTitle,
      avatar: groupAvatar,
      conferenceId: conference.id || '',
      lastMessage: groupChat.lastMessage,
      messages: allGroupMessages,
    }).catch(err => {
      console.warn('[ConferenceManager] Failed to persist conference group to backend:', err);
    });
  } catch {}

  return groupId;
}

/**
 * Extract a real frame (first or last frame) directly from a video Blob, URL, or HTMLVideoElement
 */
export async function extractVideoThumbnail(
  source: string | Blob | HTMLVideoElement | null | undefined,
  preference: 'first' | 'last' = 'first'
): Promise<string> {
  // If an active video element is supplied and already has decoded frames
  if (source instanceof HTMLVideoElement && source.videoWidth > 0) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = source.videoWidth;
      canvas.height = source.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (dataUrl && dataUrl.length > 50) return dataUrl;
      }
    } catch (_) {}
  }

  if (!source || (typeof source !== 'string' && !(source instanceof Blob))) {
    return '';
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    const isBlob = source instanceof Blob;
    if (!isBlob) {
      video.crossOrigin = 'anonymous';
    }
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    let objectUrl = '';
    if (typeof source === 'string') {
      video.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      video.src = objectUrl;
    }

    let isDone = false;
    const finish = (result: string) => {
      if (isDone) return;
      isDone = true;
      clearTimeout(timer);
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    const timer = setTimeout(() => finish(''), 3500);

    const tryCapture = () => {
      try {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            if (dataUrl && dataUrl.length > 200) {
              finish(dataUrl);
              return true;
            }
          }
        }
      } catch (err) {
        console.warn('[Thumbnail] Frame capture notice:', err);
      }
      return false;
    };

    video.onloadeddata = () => {
      if (preference === 'first') {
        if (tryCapture()) return;
        video.currentTime = 0.05;
      } else if (preference === 'last' && video.duration && isFinite(video.duration) && video.duration > 0.5) {
        video.currentTime = Math.max(0.1, video.duration - 0.2);
      } else {
        video.currentTime = 0.05;
      }
    };

    video.onseeked = () => {
      tryCapture();
    };

    video.oncanplay = () => {
      if (preference === 'first') {
        tryCapture();
      }
    };

    video.onerror = () => finish('');
  });
}


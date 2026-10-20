import { type Conference, type ConferenceMessage, type Chat, type Message, currentUser } from '../data/mock';

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

const RECORDINGS_STORAGE_KEY = 'newage_conference_recordings';
const DEFAULT_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80';

// In-memory cache for live recording Blobs created during current session
const liveBlobsCache = new Map<string, { blob: Blob; url: string }>();

export function registerLiveRecordingBlob(recordingId: string, blob: Blob): string {
  const existing = liveBlobsCache.get(recordingId);
  if (existing) {
    try { URL.revokeObjectURL(existing.url); } catch (_) {}
  }
  const url = URL.createObjectURL(blob);
  liveBlobsCache.set(recordingId, { blob, url });
  return url;
}

export function getLiveRecordingBlobUrl(recordingId: string): string | null {
  return liveBlobsCache.get(recordingId)?.url || null;
}

export function getLiveRecordingBlob(recordingId: string): Blob | null {
  return liveBlobsCache.get(recordingId)?.blob || null;
}

// Initial demo recordings to populate archive if empty
export const initialDemoRecordings: ConferenceRecordingItem[] = [
  {
    id: 'rec_demo_1',
    title: 'Стратегическая сессия: Экосистема New Age 2026',
    date: 'Вчера, 18:30',
    duration: '24:15',
    participantsCount: 8,
    thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
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
    thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
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
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Resolve blob URLs if any
        return parsed.map((item: ConferenceRecordingItem) => {
          const liveUrl = getLiveRecordingBlobUrl(item.id);
          return {
            ...item,
            videoUrl: liveUrl || item.videoUrl || DEFAULT_VIDEO_URL,
          };
        });
      }
    }
  } catch (err) {
    console.warn('Failed to parse recordings from localStorage:', err);
  }

  // Fallback to initial demo list
  saveConferenceRecordingsList(initialDemoRecordings);
  return initialDemoRecordings;
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
    rec.videoUrl = liveUrl;
  }
  const current = getStoredConferenceRecordings();
  const filtered = current.filter(r => r.id !== rec.id);
  const updated = [rec, ...filtered];
  saveConferenceRecordingsList(updated);
  return rec;
}

/**
 * Delete a recording from localStorage
 */
export function deleteConferenceRecording(id: string) {
  const current = getStoredConferenceRecordings();
  const updated = current.filter(r => r.id !== id);
  saveConferenceRecordingsList(updated);
}

/**
 * Download a recording video file directly to user device
 */
export function downloadRecordingFile(videoUrl: string, title: string) {
  try {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `${title.replace(/[/\\?%*:|"<>]/g, '_')}_запись.mp4`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  const groupAvatar = rec.thumbnail || DEFAULT_THUMBNAIL;
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

  // 1. Master registry
  try {
    const raw = localStorage.getItem(CONFERENCE_GROUPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const g of parsed) {
          if (g && g.id) groupsMap.set(g.id, g);
        }
      }
    }
  } catch {}

  // 2. Scan all recordings in archive
  const recordings = getStoredConferenceRecordings();
  for (const rec of recordings) {
    if (rec.chatGroupId && !groupsMap.has(rec.chatGroupId)) {
      const synthesized = createGroupChatFromRecording(rec);
      groupsMap.set(rec.chatGroupId, synthesized);
    }
  }

  // 3. Scan common local storage messenger keys
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
            if (c && c.id && (c.conferenceId || (c.isGroup && (c.id.startsWith('group_conf') || c.id.startsWith('group_'))))) {
              if (!groupsMap.has(c.id)) {
                groupsMap.set(c.id, c);
              }
            }
          }
        }
      }
    } catch {}
  }

  return Array.from(groupsMap.values());
}

/**
 * Find a specific conference group by ID or matching prefix / conferenceId / recording
 */
export function getStoredConferenceGroup(groupId: string): Chat | null {
  if (!groupId) return null;
  const all = getAllConferenceGroups();
  const direct = all.find(g => g.id === groupId);
  if (direct) return direct;

  const match = all.find(g => 
    g.id === `group_${groupId}` || 
    g.conferenceId === groupId ||
    `group_${g.conferenceId}` === groupId
  );
  if (match) return match;

  const recs = getStoredConferenceRecordings();
  const matchedRec = recs.find(r => r.chatGroupId === groupId || r.conferenceId === groupId || r.id === groupId);
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
  thumbnail,
  currentUserId,
  hostUser,
}: {
  conference: Conference;
  duration: string;
  messages?: ConferenceMessage[];
  videoUrl?: string;
  thumbnail?: string;
  currentUserId: string;
  hostUser?: any;
}): string {
  const effectiveHost = hostUser || conference.host || currentUser;

  const groupId = conference.chatGroupId || (
    conference.id
      ? (conference.id.startsWith('group_') ? conference.id : `group_${conference.id}`)
      : `group_conf_${Date.now()}`
  );
  conference.chatGroupId = groupId;
  const groupTitle = `💬 Конференция: ${conference.title}`;
  const groupAvatar = thumbnail || conference.recordingThumbnail || DEFAULT_THUMBNAIL;
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
      title: conference.title,
      duration: duration,
      date: 'Сегодня',
      code: conference.inviteCode || 'conf-room',
      videoUrl: resolvedVideoUrl,
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

  return groupId;
}

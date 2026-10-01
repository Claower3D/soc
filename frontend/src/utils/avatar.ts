export const DEFAULT_AVATAR = '/default-avatar.svg';

/**
 * Checks whether an avatar string is a real custom user-uploaded picture
 * rather than a placeholder, cartoon face, or external sample photo.
 */
export function isRealCustomAvatar(avatar?: string | null): boolean {
  if (!avatar) return false;
  const trimmed = avatar.trim();
  if (
    trimmed === '' ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed.includes('dicebear') ||
    trimmed.includes('avataaars') ||
    trimmed.includes('images.unsplash.com') ||
    trimmed === '/default-avatar.svg'
  ) {
    return false;
  }
  return true;
}

/**
 * Returns the proper avatar URL: either the user's custom uploaded picture,
 * or the default faceless gray silhouette avatar.
 */
export function getAvatarUrl(user?: { avatar?: string | null } | null): string {
  if (!user || !isRealCustomAvatar(user.avatar)) {
    return DEFAULT_AVATAR;
  }
  return user.avatar!;
}

/**
 * Fallback handler for image load errors to ensure the gray silhouette avatar is always shown.
 */
export function handleAvatarError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.src !== DEFAULT_AVATAR && !target.src.endsWith(DEFAULT_AVATAR)) {
    target.src = DEFAULT_AVATAR;
  }
}

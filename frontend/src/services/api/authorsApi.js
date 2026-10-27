import { API_BASE_URL, authHeader } from './client';

/**
 * Get author profile (bio, avatar from Wikipedia, follower count, isFollowing).
 * Token is optional — if provided, `isFollowing` reflects the current user's status.
 */
export async function getAuthorProfile(authorName, token) {
  if (!authorName) return null;
  const headers = token ? authHeader(token) : {};
  const res = await fetch(
    `${API_BASE_URL}/authors/profile/${encodeURIComponent(authorName.trim())}`,
    { headers }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch author profile');
  }
  return res.json();
}

/**
 * Follow an author by name. Requires authentication.
 * Returns { success, isFollowing, followerCount }
 */
export async function followAuthor(authorName, token) {
  const res = await fetch(
    `${API_BASE_URL}/authors/follow/${encodeURIComponent(authorName.trim())}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to follow author');
  }
  return res.json();
}

/**
 * Unfollow an author by name. Requires authentication.
 * Returns { success, isFollowing, followerCount }
 */
export async function unfollowAuthor(authorName, token) {
  const res = await fetch(
    `${API_BASE_URL}/authors/unfollow/${encodeURIComponent(authorName.trim())}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to unfollow author');
  }
  return res.json();
}

/**
 * Get all authors the authenticated user follows.
 * Returns { success, authors: Array<{ id, name, bio, avatar, followed_at }> }
 */
export async function getFollowedAuthors(token) {
  const res = await fetch(`${API_BASE_URL}/authors/following`, {
    headers: authHeader(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch followed authors');
  }
  return res.json();
}

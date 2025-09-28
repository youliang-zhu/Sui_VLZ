// Simple lightweight storage for forum-related IDs
// Note: Using memory storage since localStorage is not available in Claude artifacts

interface ForumData {
  registryId?: string;
  pollId?: string;
  voteRegistryId?: string;
}

// In-memory storage (would be localStorage in real app)
const storage = new Map<string, ForumData>();

// Forum -> Registry ID mapping
export function saveRegistryId(forumId: string, registryId: string) {
  const existing = storage.get(forumId) || {};
  storage.set(forumId, { ...existing, registryId });
}

export function getRegistryId(forumId: string): string | null {
  return storage.get(forumId)?.registryId || null;
}

// Poll ID storage
export function savePollId(forumId: string, pollId: string) {
  const existing = storage.get(forumId) || {};
  storage.set(forumId, { ...existing, pollId });
}

export function getPollId(forumId: string): string | null {
  return storage.get(forumId)?.pollId || null;
}

// Vote Registry ID storage  
export function saveVoteRegistryId(forumId: string, voteRegistryId: string) {
  const existing = storage.get(forumId) || {};
  storage.set(forumId, { ...existing, voteRegistryId });
}

export function getVoteRegistryId(forumId: string): string | null {
  return storage.get(forumId)?.voteRegistryId || null;
}

// Get all data for a forum
export function getForumData(forumId: string): ForumData {
  return storage.get(forumId) || {};
}
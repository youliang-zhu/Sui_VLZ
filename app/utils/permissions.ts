// Simple permission checking for forum membership

// Simple in-memory membership cache
const membershipCache = new Map<string, Set<string>>(); // forumId -> Set of member addresses

// Cache membership status
export function cacheMembership(forumId: string, memberAddress: string) {
  if (!membershipCache.has(forumId)) {
    membershipCache.set(forumId, new Set());
  }
  membershipCache.get(forumId)!.add(memberAddress);
}

// Check if user is member (from cache)
export function isMemberCached(forumId: string, memberAddress: string): boolean {
  return membershipCache.get(forumId)?.has(memberAddress) || false;
}

// Clear membership cache for a forum
export function clearMembershipCache(forumId: string) {
  membershipCache.delete(forumId);
}

// Check if user can see internal forum data
export function canAccessForumInternals(forumId: string, userAddress?: string): boolean {
  if (!userAddress) return false;
  return isMemberCached(forumId, userAddress);
}
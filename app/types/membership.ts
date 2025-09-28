// Membership related type definitions for Shallot system

import { SuiObjectData } from "@mysten/sui/client";

// Raw Membership NFT data structure from smart contract
export interface MembershipFields {
  id: {
    id: string;
  };
  forum_id: string;
  member: string;
  joined_at: string;
}

// Raw MemberRegistry data structure from smart contract
export interface MemberRegistryFields {
  id: {
    id: string;
  };
  forum_id: string;
  members: {
    type: string;
    fields: {
      id: {
        id: string;
      };
      size: string;
    };
  };
  member_list: string[]; // array of member addresses
  total_count: string;
}

// Processed Membership NFT for frontend use
export interface Membership {
  id: string;
  forumId: string;
  member: string;
  joinedAt: number; // timestamp in milliseconds
}

// Processed Member Registry for frontend use
export interface MemberRegistry {
  id: string;
  forumId: string;
  memberList: string[]; // array of member addresses
  totalCount: number;
}

// Join forum form data
export interface JoinForumFormData {
  password: string;
}

// Join forum transaction arguments
export interface JoinForumArgs {
  forumId: string;
  registryId: string;
  password: string;
}

// Member information for display
export interface MemberInfo {
  address: string;
  joinedAt: number;
  membershipId?: string; // Optional, for the user's own memberships
}

// Member joined event data
export interface MemberJoinedEvent {
  forum_id: string;
  member: string;
  membership_id: string;
  total_members: string;
  timestamp: string;
}

// Membership verification result
export interface MembershipVerificationResult {
  isMember: boolean;
  membership?: Membership;
  error?: string;
}

// Join forum validation result
export interface JoinForumValidationResult {
  isValid: boolean;
  errors: {
    password?: string;
  };
}

// User's membership list item
export interface UserMembershipItem {
  membershipId: string;
  forumId: string;
  forumName: string;
  joinedAt: number;
  memberCount: number;
  hasActivePoll: boolean;
}

// Member statistics for a forum
export interface MemberStats {
  totalMembers: number;
  newMembersThisWeek: number;
  newMembersThisMonth: number;
  avgJoinTime: number; // average time between joins
}

// Member list query options
export interface MemberListQuery {
  forumId: string;
  limit?: number;
  offset?: number;
  sortBy?: 'joinedAt' | 'address';
  sortOrder?: 'asc' | 'desc';
}

// Type guard to check if object is Membership data
export function isMembershipData(obj: SuiObjectData): obj is SuiObjectData & {
  content: {
    dataType: "moveObject";
    fields: MembershipFields;
    type: string;
  };
} {
  return (
    obj.content?.dataType === "moveObject" &&
    obj.content.fields &&
    "forum_id" in obj.content.fields &&
    "member" in obj.content.fields &&
    "joined_at" in obj.content.fields
  );
}

// Type guard to check if object is MemberRegistry data
export function isMemberRegistryData(obj: SuiObjectData): obj is SuiObjectData & {
  content: {
    dataType: "moveObject";
    fields: MemberRegistryFields;
    type: string;
  };
} {
  return (
    obj.content?.dataType === "moveObject" &&
    obj.content.fields &&
    "forum_id" in obj.content.fields &&
    "member_list" in obj.content.fields &&
    "total_count" in obj.content.fields
  );
}

// Helper function to convert raw membership data to processed membership
export function processMembership(data: SuiObjectData): Membership | null {
  if (!isMembershipData(data)) {
    return null;
  }

  const fields = data.content.fields;
  
  return {
    id: fields.id.id,
    forumId: fields.forum_id,
    member: fields.member,
    joinedAt: parseInt(fields.joined_at),
  };
}

// Helper function to convert raw member registry data to processed registry
export function processMemberRegistry(data: SuiObjectData): MemberRegistry | null {
  if (!isMemberRegistryData(data)) {
    return null;
  }

  const fields = data.content.fields;
  
  return {
    id: fields.id.id,
    forumId: fields.forum_id,
    memberList: fields.member_list,
    totalCount: parseInt(fields.total_count),
  };
}

// Helper function to convert member address to member info
export function addressToMemberInfo(
  address: string, 
  membership?: Membership
): MemberInfo {
  return {
    address,
    joinedAt: membership?.joinedAt || 0,
    membershipId: membership?.id,
  };
}

// Helper function to check if user is member of specific forum
export function isUserMemberOfForum(
  userAddress: string,
  registry: MemberRegistry
): boolean {
  return registry.memberList.includes(userAddress);
}
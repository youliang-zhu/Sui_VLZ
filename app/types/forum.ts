// Forum related type definitions for Shallot system

import { SuiObjectData } from "@mysten/sui/client";

// Raw Forum data structure from smart contract
export interface ForumFields {
  id: {
    id: string;
  };
  name: string;
  description: string;
  creator: string;
  verifier: {
    password_hash: number[];
    created_at: string;
  };
  member_count: string;
  active_poll: {
    vec: string[]; // Option<ID> represented as vec
  };
  created_at: string;
}

// Processed Forum data for frontend use
export interface Forum {
  id: string;
  name: string;
  description: string;
  creator: string;
  memberCount: number;
  activePoll: string | null; // Poll ID if active, null if none
  createdAt: number; // timestamp in milliseconds
  passwordHash: number[]; // for verification purposes
}

// Forum creation form data
export interface CreateForumFormData {
  name: string;
  description: string;
  password: string;
}

// Forum creation transaction arguments
export interface CreateForumArgs {
  name: string;
  description: string;
  password: string;
}

// Forum update form data (for polls)
export interface UpdateForumFormData {
  newName: string;
  newDescription: string;
}

// Forum list item (simplified for lists)
export interface ForumListItem {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  hasActivePoll: boolean;
  createdAt: number;
}

// Forum creation event data
export interface ForumCreatedEvent {
  forum_id: string;
  name: string;
  description: string;
  creator: string;
  timestamp: string;
}

// Forum metadata updated event data
export interface ForumMetadataUpdatedEvent {
  forum_id: string;
  poll_id: string;
  old_name: string;
  new_name: string;
  old_description: string;
  new_description: string;
  timestamp: string;
}

// Forum query filters
export interface ForumQueryFilters {
  creator?: string;
  hasActivePoll?: boolean;
  minMembers?: number;
  maxMembers?: number;
  createdAfter?: number;
  createdBefore?: number;
}

// Forum validation result
export interface ForumValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    description?: string;
    password?: string;
  };
}

// Forum statistics
export interface ForumStats {
  totalForums: number;
  totalMembers: number;
  activePolls: number;
  totalPolls: number;
}

// Type guard to check if object is Forum data
export function isForumData(obj: SuiObjectData): obj is SuiObjectData & {
  content: {
    dataType: "moveObject";
    fields: ForumFields;
    type: string;
  };
} {
  return (
    obj.content?.dataType === "moveObject" &&
    obj.content.fields &&
    "name" in obj.content.fields &&
    "description" in obj.content.fields &&
    "creator" in obj.content.fields
  );
}

// Helper function to convert raw forum data to processed forum
export function processForum(data: SuiObjectData): Forum | null {
  if (!isForumData(data)) {
    return null;
  }

  const fields = data.content.fields;
  
  // Safely handle active_poll which might be null
  let activePoll = null;
  try {
    if (fields.active_poll && fields.active_poll.vec && fields.active_poll.vec.length > 0) {
      activePoll = fields.active_poll.vec[0];
    }
  } catch (e) {
    // If active_poll parsing fails, just set to null
    activePoll = null;
  }
  
  return {
    id: fields.id.id,
    name: fields.name,
    description: fields.description,
    creator: fields.creator,
    memberCount: parseInt(fields.member_count),
    activePoll,
    createdAt: parseInt(fields.created_at),
    passwordHash: fields.verifier.password_hash,
  };
}

// Helper function to convert forum to list item
export function forumToListItem(forum: Forum): ForumListItem {
  return {
    id: forum.id,
    name: forum.name,
    description: forum.description,
    memberCount: forum.memberCount,
    hasActivePoll: forum.activePoll !== null,
    createdAt: forum.createdAt,
  };
}
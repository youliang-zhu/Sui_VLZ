// Poll and voting related type definitions for Shallot system

import { SuiObjectData } from "@mysten/sui/client";

// Raw Poll data structure from smart contract
export interface PollFields {
  id: {
    id: string;
  };
  forum_id: string;
  title: string;
  description: string;
  new_name: string;
  new_description: string;
  creator: string;
  start_time: string;
  end_time: string;
  yes_votes: string;
  no_votes: string;
  member_snapshot: string;
  is_executed: boolean;
}

// Raw Ballot data structure from smart contract
export interface BallotFields {
  id: {
    id: string;
  };
  poll_id: string;
  anonymous_voter_id: number[];
  vote: boolean;
  timestamp: string;
}

// Raw VoteRegistry data structure from smart contract
export interface VoteRegistryFields {
  id: {
    id: string;
  };
  poll_id: string;
  voted_addresses: {
    type: string;
    fields: {
      id: {
        id: string;
      };
      size: string;
    };
  };
  total_votes: string;
}

// Processed Poll for frontend use
export interface Poll {
  id: string;
  forumId: string;
  title: string;
  description: string;
  proposedName: string; // new_name
  proposedDescription: string; // new_description
  creator: string;
  startTime: number; // timestamp in milliseconds
  endTime: number; // timestamp in milliseconds
  yesVotes: number;
  noVotes: number;
  memberSnapshot: number; // total members when poll was created
  isExecuted: boolean;
}

// Processed Ballot for frontend use
export interface Ballot {
  id: string;
  pollId: string;
  anonymousVoterId: number[];
  vote: boolean; // true = yes, false = no
  timestamp: number; // timestamp in milliseconds
}

// Processed Vote Registry for frontend use
export interface VoteRegistry {
  id: string;
  pollId: string;
  totalVotes: number;
}

// Create poll form data
export interface CreatePollFormData {
  title: string;
  description: string;
  proposedName: string;
  proposedDescription: string;
  duration: number; // duration in hours
}

// Create poll transaction arguments
export interface CreatePollArgs {
  forumId: string;
  registryId: string;
  title: string;
  description: string;
  newName: string;
  newDescription: string;
  durationMs: number; // duration in milliseconds
}

// Vote transaction arguments
export interface VoteArgs {
  pollId: string;
  voteRegistryId: string;
  memberRegistryId: string;
  choice: boolean; // true = yes, false = no
}

// Poll results summary
export interface PollResults {
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  totalEligibleVoters: number; // member snapshot
  participationRate: number; // percentage
  passed: boolean;
  executed: boolean;
}

// Poll status enum
export enum PollStatus {
  ACTIVE = "active",
  ENDED = "ended", 
  EXECUTED = "executed",
  FAILED = "failed"
}

// Poll list item (simplified for lists)
export interface PollListItem {
  id: string;
  forumId: string;
  title: string;
  status: PollStatus;
  endTime: number;
  participationRate: number;
  passed: boolean;
}

// Vote choice for UI
export interface VoteChoice {
  value: boolean;
  label: string;
  description?: string;
}

// Poll created event data
export interface PollCreatedEvent {
  poll_id: string;
  forum_id: string;
  title: string;
  description: string;
  creator: string;
  start_time: string;
  end_time: string;
  timestamp: string;
}

// Vote received event data
export interface VoteReceivedEvent {
  poll_id: string;
  anonymous_voter_id: number[];
  timestamp: string;
}

// Poll executed event data
export interface PollExecutedEvent {
  poll_id: string;
  forum_id: string;
  yes_votes: string;
  no_votes: string;
  total_participants: string;
  passed: boolean;
  timestamp: string;
}

// Poll validation result
export interface PollValidationResult {
  isValid: boolean;
  errors: {
    title?: string;
    description?: string;
    proposedName?: string;
    proposedDescription?: string;
    duration?: string;
  };
}

// User vote status for a poll
export interface UserVoteStatus {
  hasVoted: boolean;
  canVote: boolean; // is member and poll is active
  voteChoice?: boolean; // user's vote if they voted
  reason?: string; // reason why they can't vote (not member, poll ended, etc.)
}

// Poll statistics
export interface PollStats {
  totalPolls: number;
  activePolls: number;
  executedPolls: number;
  averageParticipation: number;
  averageDuration: number; // in hours
}

// Type guard to check if object is Poll data
export function isPollData(obj: SuiObjectData): obj is SuiObjectData & {
  content: {
    dataType: "moveObject";
    fields: PollFields;
    type: string;
  };
} {
  return (
    obj.content?.dataType === "moveObject" &&
    obj.content.fields &&
    "title" in obj.content.fields &&
    "forum_id" in obj.content.fields &&
    "creator" in obj.content.fields
  );
}

// Type guard to check if object is Ballot data
export function isBallotData(obj: SuiObjectData): obj is SuiObjectData & {
  content: {
    dataType: "moveObject";
    fields: BallotFields;
    type: string;
  };
} {
  return (
    obj.content?.dataType === "moveObject" &&
    obj.content.fields &&
    "poll_id" in obj.content.fields &&
    "vote" in obj.content.fields &&
    "anonymous_voter_id" in obj.content.fields
  );
}

// Helper function to convert raw poll data to processed poll
export function processPoll(data: SuiObjectData): Poll | null {
  if (!isPollData(data)) {
    return null;
  }

  const fields = data.content.fields;
  
  return {
    id: fields.id.id,
    forumId: fields.forum_id,
    title: fields.title,
    description: fields.description,
    proposedName: fields.new_name,
    proposedDescription: fields.new_description,
    creator: fields.creator,
    startTime: parseInt(fields.start_time),
    endTime: parseInt(fields.end_time),
    yesVotes: parseInt(fields.yes_votes),
    noVotes: parseInt(fields.no_votes),
    memberSnapshot: parseInt(fields.member_snapshot),
    isExecuted: fields.is_executed,
  };
}

// Helper function to get poll status
export function getPollStatus(poll: Poll, currentTime: number): PollStatus {
  if (poll.isExecuted) {
    return PollStatus.EXECUTED;
  }
  
  if (currentTime >= poll.endTime) {
    const totalVotes = poll.yesVotes + poll.noVotes;
    const passed = poll.yesVotes > poll.noVotes && totalVotes > 0;
    return passed ? PollStatus.ENDED : PollStatus.FAILED;
  }
  
  return PollStatus.ACTIVE;
}

// Helper function to calculate poll results
export function calculatePollResults(poll: Poll): PollResults {
  const totalVotes = poll.yesVotes + poll.noVotes;
  const participationRate = poll.memberSnapshot > 0 
    ? (totalVotes / poll.memberSnapshot) * 100 
    : 0;
  const passed = poll.yesVotes > poll.noVotes && totalVotes > 0;

  return {
    yesVotes: poll.yesVotes,
    noVotes: poll.noVotes,
    totalVotes,
    totalEligibleVoters: poll.memberSnapshot,
    participationRate,
    passed,
    executed: poll.isExecuted,
  };
}

// Helper function to convert poll to list item
export function pollToListItem(poll: Poll, currentTime: number): PollListItem {
  const results = calculatePollResults(poll);
  
  return {
    id: poll.id,
    forumId: poll.forumId,
    title: poll.title,
    status: getPollStatus(poll, currentTime),
    endTime: poll.endTime,
    participationRate: results.participationRate,
    passed: results.passed,
  };
}

// Helper function to check if poll is active
export function isPollActive(poll: Poll, currentTime: number): boolean {
  return currentTime >= poll.startTime && currentTime < poll.endTime && !poll.isExecuted;
}

// Helper function to get time remaining for poll
export function getTimeRemaining(poll: Poll, currentTime: number): number {
  if (currentTime >= poll.endTime) {
    return 0;
  }
  return poll.endTime - currentTime;
}
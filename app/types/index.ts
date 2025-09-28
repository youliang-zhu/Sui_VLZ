// Central type exports for Shallot decentralized forum system

// Forum types
export type {
  ForumFields,
  Forum,
  CreateForumFormData,
  CreateForumArgs,
  UpdateForumFormData,
  ForumListItem,
  ForumCreatedEvent,
  ForumMetadataUpdatedEvent,
  ForumQueryFilters,
  ForumValidationResult,
  ForumStats,
} from './forum';

export {
  isForumData,
  processForum,
  forumToListItem,
} from './forum';

// Membership types
export type {
  MembershipFields,
  MemberRegistryFields,
  Membership,
  MemberRegistry,
  JoinForumFormData,
  JoinForumArgs,
  MemberInfo,
  MemberJoinedEvent,
  MembershipVerificationResult,
  JoinForumValidationResult,
  UserMembershipItem,
  MemberStats,
  MemberListQuery,
} from './membership';

export {
  isMembershipData,
  isMemberRegistryData,
  processMembership,
  processMemberRegistry,
  addressToMemberInfo,
  isUserMemberOfForum,
} from './membership';

// Poll and voting types
export type {
  PollFields,
  BallotFields,
  VoteRegistryFields,
  Poll,
  Ballot,
  VoteRegistry,
  CreatePollFormData,
  CreatePollArgs,
  VoteArgs,
  PollResults,
  PollListItem,
  VoteChoice,
  PollCreatedEvent,
  VoteReceivedEvent,
  PollExecutedEvent,
  PollValidationResult,
  UserVoteStatus,
  PollStats,
} from './poll';

export {
  PollStatus,
  isPollData,
  isBallotData,
  processPoll,
  getPollStatus,
  calculatePollResults,
  pollToListItem,
  isPollActive,
  getTimeRemaining,
} from './poll';

// Common interfaces used across modules
export interface BaseObject {
  id: string;
  createdAt?: number;
}

export interface TransactionResult {
  success: boolean;
  digest?: string;
  error?: string;
  objectId?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Event subscription types
export interface EventSubscription {
  unsubscribe: () => void;
}

export interface EventFilter {
  eventType?: string;
  packageId?: string;
  moduleId?: string;
  fromAddress?: string;
  toAddress?: string;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Network and connection types
export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  faucetUrl?: string;
  explorerUrl?: string;
}

export interface WalletConnection {
  isConnected: boolean;
  address?: string;
  network?: string;
}

// Form state types
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Utility types for better type safety
export type ObjectId = string;
export type Address = string;
export type Timestamp = number;
export type BigIntString = string; // For large numbers from blockchain

// Event handler types
export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

// Hook return types
export interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseMutationResult<TVariables, TData> {
  mutate: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  isLoading: boolean;
  fallback?: React.ReactNode;
}

export interface ErrorProps extends BaseComponentProps {
  error: string | null;
  onRetry?: () => void;
}

// Re-export constants for convenience
export {
  DEVNET_SHALLOT_PACKAGE_ID,
  TESTNET_SHALLOT_PACKAGE_ID,
  MAINNET_SHALLOT_PACKAGE_ID,
  MODULES,
  FUNCTIONS,
  DEFAULT_GAS_BUDGET,
  TRANSACTION_TIMEOUT,
  EVENT_TYPES,
  VALIDATION,
} from '../constants';
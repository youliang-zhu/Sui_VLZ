// Shallot Forum Package IDs for different networks
export const DEVNET_SHALLOT_PACKAGE_ID = "0xTODO";
export const TESTNET_SHALLOT_PACKAGE_ID = "0x6c45a01c7b03d54948f95bfcbc6a1cf6a032b6cd81c7a5fb2673cefd4fb8c736";
export const MAINNET_SHALLOT_PACKAGE_ID = "0xTODO";

// Module names within the package
export const MODULES = {
  FORUM: "forum",
  MEMBERSHIP: "membership", 
  POLL: "poll",
  BALLOT: "ballot",
  VERIFIER: "verifier",
  EVENTS: "events"
} as const;

// Function names for smart contract calls
export const FUNCTIONS = {
  // Forum functions
  CREATE_FORUM: "create_forum",
  UPDATE_METADATA: "update_metadata",
  
  // Membership functions
  INIT_MEMBER_REGISTRY: "init_member_registry",
  JOIN_FORUM: "join_forum",
  
  // Poll functions
  CREATE_POLL: "create_poll",
  EXECUTE_POLL: "execute_poll",
  
  // Ballot functions
  INIT_VOTE_REGISTRY: "init_vote_registry",
  VOTE: "vote",
  
  // Verifier functions
  CREATE_SIMPLE_PASSWORD_VERIFIER: "create_simple_password_verifier",
  VERIFY_USER: "verify_user"
} as const;

// Default gas budget for transactions
export const DEFAULT_GAS_BUDGET = 10_000_000;

// Transaction timeouts
export const TRANSACTION_TIMEOUT = 30_000; // 30 seconds

// Event types for filtering
export const EVENT_TYPES = {
  FORUM_CREATED: "ForumCreated",
  MEMBER_JOINED: "MemberJoined", 
  POLL_CREATED: "PollCreated",
  VOTE_RECEIVED: "VoteReceived",
  POLL_EXECUTED: "PollExecuted",
  POLL_EXECUTION_FAILED: "PollExecutionFailed",
  FORUM_METADATA_UPDATED: "ForumMetadataUpdated"
} as const;

// Validation constants
export const VALIDATION = {
  MIN_FORUM_NAME_LENGTH: 1,
  MAX_FORUM_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 0,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_PASSWORD_LENGTH: 1,
  MAX_PASSWORD_LENGTH: 128,
  MIN_POLL_DURATION: 60_000, // 1 minute in milliseconds
  MAX_POLL_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
} as const;
// Sui blockchain utility functions for Shallot system

import { SuiClient, SuiObjectResponse, SuiEvent } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { isValidSuiObjectId, isValidSuiAddress, normalizeSuiAddress } from "@mysten/sui/utils";
import { 
  MODULES, 
  FUNCTIONS, 
  DEFAULT_GAS_BUDGET, 
  EVENT_TYPES 
} from "../constants";
import type { 
  TransactionResult, 
  EventFilter,
  ObjectId,
  Address 
} from "../types";

// ===== Object ID and Address Utilities =====

/**
 * Validate if a string is a valid Sui object ID
 */
export function isValidObjectId(id: string): boolean {
  try {
    return isValidSuiObjectId(id);
  } catch {
    return false;
  }
}

/**
 * Validate if a string is a valid Sui address
 */
export function isValidAddress(address: string): boolean {
  try {
    return isValidSuiAddress(address);
  } catch {
    return false;
  }
}

/**
 * Normalize a Sui address to standard format
 */
export function normalizeAddress(address: string): string {
  try {
    return normalizeSuiAddress(address);
  } catch {
    return address;
  }
}

/**
 * Get short display format for object ID or address
 */
export function getShortId(id: string, prefixLength: number = 6, suffixLength: number = 4): string {
  if (!id || id.length <= prefixLength + suffixLength) {
    return id;
  }
  return `${id.slice(0, prefixLength)}...${id.slice(-suffixLength)}`;
}

// ===== Transaction Building Utilities =====

/**
 * Create a new transaction with default settings
 */
export function createTransaction(): Transaction {
  const tx = new Transaction();
  tx.setGasBudget(DEFAULT_GAS_BUDGET);
  return tx;
}

/**
 * Build move call target string
 */
export function buildMoveCallTarget(
  packageId: string,
  module: keyof typeof MODULES,
  functionName: keyof typeof FUNCTIONS
): string {
  return `${packageId}::${MODULES[module]}::${FUNCTIONS[functionName]}`;
}

/**
 * Create Forum creation transaction
 */
export function createForumTransaction(
  packageId: string,
  args: {
    name: string;
    description: string;
    password: string;
  }
): Transaction {
  const tx = createTransaction();
  
  tx.moveCall({
    target: buildMoveCallTarget(packageId, "FORUM", "CREATE_FORUM"),
    arguments: [
      tx.pure.string(args.name),
      tx.pure.string(args.description),
      tx.pure.string(args.password),
      tx.object("0x6"), // Clock object
    ],
  });
  
  return tx;
}

/**
 * Create Member Registry initialization transaction
 */
export function createMemberRegistryTransaction(
  packageId: string,
  forumId: ObjectId
): Transaction {
  const tx = createTransaction();
  
  tx.moveCall({
    target: buildMoveCallTarget(packageId, "MEMBERSHIP", "INIT_MEMBER_REGISTRY"),
    arguments: [
      tx.pure.id(forumId),
    ],
  });
  
  return tx;
}

/**
 * Create Join Forum transaction
 */
export function createJoinForumTransaction(
  packageId: string,
  args: {
    forumId: ObjectId;
    registryId: ObjectId;
    password: string;
  }
): Transaction {
  const tx = createTransaction();
  
  tx.moveCall({
    target: buildMoveCallTarget(packageId, "MEMBERSHIP", "JOIN_FORUM"),
    arguments: [
      tx.object(args.forumId),
      tx.object(args.registryId),
      tx.pure.string(args.password),
      tx.object("0x6"), // Clock object
    ],
  });
  
  return tx;
}

/**
 * Create Poll creation transaction
 */
export function createPollTransaction(
  packageId: string,
  args: {
    forumId: ObjectId;
    registryId: ObjectId;
    title: string;
    description: string;
    newName: string;
    newDescription: string;
    durationMs: number;
  }
): Transaction {
  const tx = createTransaction();
  
  tx.moveCall({
    target: buildMoveCallTarget(packageId, "POLL", "CREATE_POLL"),
    arguments: [
      tx.object(args.forumId),
      tx.object(args.registryId),
      tx.pure.string(args.title),
      tx.pure.string(args.description),
      tx.pure.string(args.newName),
      tx.pure.string(args.newDescription),
      tx.pure.u64(args.durationMs),
      tx.object("0x6"), // Clock object
    ],
  });
  
  return tx;
}

/**
 * Create Vote Registry initialization transaction
 */
export function createVoteRegistryTransaction(
  packageId: string,
  pollId: ObjectId
): Transaction {
  const tx = createTransaction();
  
  tx.moveCall({
    target: buildMoveCallTarget(packageId, "BALLOT", "INIT_VOTE_REGISTRY"),
    arguments: [
      tx.pure.id(pollId),
    ],
  });
  
  return tx;
}

/**
 * Create Vote transaction
 */
export function createVoteTransaction(
  packageId: string,
  args: {
    pollId: ObjectId;
    voteRegistryId: ObjectId;
    memberRegistryId: ObjectId;
    choice: boolean;
  }
): Transaction {
  const tx = createTransaction();
  
  tx.moveCall({
    target: buildMoveCallTarget(packageId, "BALLOT", "VOTE"),
    arguments: [
      tx.object(args.pollId),
      tx.object(args.voteRegistryId),
      tx.object(args.memberRegistryId),
      tx.pure.bool(args.choice),
      tx.object("0x6"), // Clock object
    ],
  });
  
  return tx;
}

/**
 * Create Execute Poll transaction
 */
export function createExecutePollTransaction(
  packageId: string,
  args: {
    forumId: ObjectId;
    pollId: ObjectId;
  }
): Transaction {
  const tx = createTransaction();
  
  tx.moveCall({
    target: buildMoveCallTarget(packageId, "POLL", "EXECUTE_POLL"),
    arguments: [
      tx.object(args.forumId),
      tx.object(args.pollId),
      tx.object("0x6"), // Clock object
    ],
  });
  
  return tx;
}

// ===== Object Query Utilities =====

/**
 * Get object with error handling
 */
export async function getObjectSafe(
  client: SuiClient,
  objectId: ObjectId,
  options?: {
    showContent?: boolean;
    showOwner?: boolean;
    showType?: boolean;
    showBcs?: boolean;
  }
): Promise<SuiObjectResponse | null> {
  try {
    const response = await client.getObject({
      id: objectId,
      options: {
        showContent: true,
        showOwner: true,
        showType: true,
        ...options,
      },
    });
    
    if (response.error) {
      console.error(`Error fetching object ${objectId}:`, response.error);
      return null;
    }
    
    return response;
  } catch (error) {
    console.error(`Failed to fetch object ${objectId}:`, error);
    return null;
  }
}

/**
 * Get multiple objects with error handling
 */
export async function getMultipleObjectsSafe(
  client: SuiClient,
  objectIds: ObjectId[],
  options?: {
    showContent?: boolean;
    showOwner?: boolean;
    showType?: boolean;
    showBcs?: boolean;
  }
): Promise<(SuiObjectResponse | null)[]> {
  try {
    const responses = await client.multiGetObjects({
      ids: objectIds,
      options: {
        showContent: true,
        showOwner: true,
        showType: true,
        ...options,
      },
    });
    
    return responses.map((response, index) => {
      if (response.error) {
        console.error(`Error fetching object ${objectIds[index]}:`, response.error);
        return null;
      }
      return response;
    });
  } catch (error) {
    console.error("Failed to fetch multiple objects:", error);
    return objectIds.map(() => null);
  }
}

// ===== Event Query Utilities =====

/**
 * Query events with filtering
 */
export async function queryEvents(
  client: SuiClient,
  filter: EventFilter,
  options?: {
    limit?: number;
    descending?: boolean;
  }
): Promise<SuiEvent[]> {
  try {
    const eventFilter: any = {};
    
    if (filter.eventType) {
      eventFilter.MoveEventType = `${filter.packageId}::${filter.moduleId}::${filter.eventType}`;
    }
    
    if (filter.fromAddress) {
      eventFilter.Sender = filter.fromAddress;
    }
    
    const response = await client.queryEvents({
      query: eventFilter,
      limit: options?.limit || 50,
      order: options?.descending ? "descending" : "ascending",
    });
    
    return response.data;
  } catch (error) {
    console.error("Failed to query events:", error);
    return [];
  }
}

/**
 * Get Forum creation events
 */
export async function getForumCreatedEvents(
  client: SuiClient,
  packageId: string,
  limit?: number
): Promise<SuiEvent[]> {
  return queryEvents(client, {
    eventType: EVENT_TYPES.FORUM_CREATED,
    packageId,
    moduleId: MODULES.EVENTS,
  }, { limit });
}

/**
 * Get Member joined events for a specific forum
 */
export async function getMemberJoinedEvents(
  client: SuiClient,
  packageId: string,
  forumId?: ObjectId,
  limit?: number
): Promise<SuiEvent[]> {
  const events = await queryEvents(client, {
    eventType: EVENT_TYPES.MEMBER_JOINED,
    packageId,
    moduleId: MODULES.EVENTS,
  }, { limit });
  
  if (forumId) {
    return events.filter(event => 
      event.parsedJson && 
      (event.parsedJson as any).forum_id === forumId
    );
  }
  
  return events;
}

/**
 * Get Poll created events for a specific forum
 */
export async function getPollCreatedEvents(
  client: SuiClient,
  packageId: string,
  forumId?: ObjectId,
  limit?: number
): Promise<SuiEvent[]> {
  const events = await queryEvents(client, {
    eventType: EVENT_TYPES.POLL_CREATED,
    packageId,
    moduleId: MODULES.EVENTS,
  }, { limit });
  
  if (forumId) {
    return events.filter(event => 
      event.parsedJson && 
      (event.parsedJson as any).forum_id === forumId
    );
  }
  
  return events;
}

// ===== Transaction Result Helpers =====

/**
 * Process transaction result
 */
export function processTransactionResult(
  result: any,
  error?: any
): TransactionResult {
  if (error) {
    return {
      success: false,
      error: error.message || "Transaction failed",
    };
  }
  
  if (result?.digest) {
    // Extract created object ID if available
    const objectId = result.effects?.created?.[0]?.reference?.objectId;
    
    return {
      success: true,
      digest: result.digest,
      objectId,
    };
  }
  
  return {
    success: false,
    error: "Invalid transaction result",
  };
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function waitForTransactionWithTimeout(
  client: SuiClient,
  digest: string,
  timeoutMs: number = 30000
): Promise<any> {
  return Promise.race([
    client.waitForTransaction({
      digest,
      options: { showEffects: true, showEvents: true },
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Transaction timeout")), timeoutMs)
    ),
  ]);
}

// ===== Type Checking Utilities =====

/**
 * Check if object is of specific type
 */
export function isObjectOfType(
  object: SuiObjectResponse,
  expectedType: string
): boolean {
  return object.data?.type?.includes(expectedType) || false;
}

/**
 * Extract object fields safely
 */
export function extractObjectFields<T>(
  object: SuiObjectResponse
): T | null {
  if (
    object.data?.content &&
    "dataType" in object.data.content &&
    object.data.content.dataType === "moveObject" &&
    "fields" in object.data.content
  ) {
    return object.data.content.fields as T;
  }
  return null;
}
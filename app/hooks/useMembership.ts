import { useState } from "react";
import { 
  useCurrentAccount, 
  useSuiClient, 
  useSignAndExecuteTransaction
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { 
  createJoinForumTransaction,
  getObjectSafe,
  getMemberJoinedEvents,
  processTransactionResult
} from "../utils/sui";
import { validateJoinForumForm } from "../utils/validation";
import { getRegistryId } from "../utils/storage";
import { cacheMembership, canAccessForumInternals } from "../utils/permissions";
import { 
  type JoinForumFormData,
  type MemberRegistry,
  type Membership,
  type MemberJoinedEvent,
  type TransactionResult,
  processMemberRegistry,
  processMembership
} from "../types";

export function useMembership() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("shallotPackageId");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Join a forum
  const joinForum = async (
    forumId: string,
    formData: JoinForumFormData
  ): Promise<TransactionResult> => {
    if (!currentAccount) {
      throw new Error("Please connect your wallet first");
    }

    if (!packageId) {
      throw new Error("Package ID not configured");
    }

    // Get registry ID from storage
    const registryId = getRegistryId(forumId);
    if (!registryId) {
      throw new Error("Registry ID not found for this forum. The forum may not have been properly created.");
    }

    // Validate form data
    const validation = validateJoinForumForm(formData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(", ");
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('👥 Joining forum:', forumId, 'with registry:', registryId);

      // Create join forum transaction
      const tx = createJoinForumTransaction(packageId, {
        forumId,
        registryId,
        password: formData.password,
      });

      // Execute transaction
      const result = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: resolve,
            onError: reject,
          }
        );
      });

      console.log('✅ Join forum transaction successful:', result.digest);

      // Wait for transaction confirmation
      const txResult = await suiClient.waitForTransaction({
        digest: result.digest,
        options: { showEffects: true, showEvents: true },
      });

      // Extract membership ID from created objects
      const membershipId = txResult.effects?.created?.[0]?.reference?.objectId;
      if (membershipId) {
        console.log('🎫 Membership NFT created with ID:', membershipId);
        // Cache membership for permissions
        cacheMembership(forumId, currentAccount.address);
      }

      return processTransactionResult(result);

    } catch (err: any) {
      console.error('❌ Join forum failed:', err);
      const errorMessage = err.message || "Failed to join forum";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get member registry details
  const getMemberRegistry = async (registryId: string): Promise<MemberRegistry | null> => {
    if (!registryId) return null;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📋 Fetching member registry:', registryId);
      
      const objectResponse = await getObjectSafe(suiClient, registryId);
      if (!objectResponse?.data) {
        throw new Error("Member registry not found");
      }

      const registry = processMemberRegistry(objectResponse.data);
      if (!registry) {
        throw new Error("Invalid member registry data");
      }

      console.log('✅ Member registry retrieved with', registry.totalCount, 'members');
      return registry;

    } catch (err: any) {
      console.error('❌ Failed to get member registry:', err);
      const errorMessage = err.message || "Failed to load member registry";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get membership details by ID
  const getMembershipDetails = async (membershipId: string): Promise<Membership | null> => {
    if (!membershipId) return null;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎫 Fetching membership details:', membershipId);
      
      const objectResponse = await getObjectSafe(suiClient, membershipId);
      if (!objectResponse?.data) {
        throw new Error("Membership not found");
      }

      const membership = processMembership(objectResponse.data);
      if (!membership) {
        throw new Error("Invalid membership data");
      }

      console.log('✅ Membership details retrieved for forum:', membership.forumId);
      return membership;

    } catch (err: any) {
      console.error('❌ Failed to get membership details:', err);
      const errorMessage = err.message || "Failed to load membership";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get member joined events for a forum
  const getForumMembers = async (forumId: string, limit: number = 20): Promise<MemberJoinedEvent[]> => {
    if (!packageId) {
      throw new Error("Package ID not configured");
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('👥 Fetching members for forum:', forumId);
      
      const events = await getMemberJoinedEvents(suiClient, packageId, forumId, limit);
      
      const memberEvents: MemberJoinedEvent[] = events.map(event => {
        const parsedData = event.parsedJson as any;
        return {
          forum_id: parsedData.forum_id,
          member: parsedData.member,
          membership_id: parsedData.membership_id,
          total_members: parsedData.total_members,
          timestamp: parsedData.timestamp,
        };
      });

      console.log(`✅ Found ${memberEvents.length} members for forum`);
      return memberEvents;

    } catch (err: any) {
      console.error('❌ Failed to get forum members:', err);
      const errorMessage = err.message || "Failed to load forum members";
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get current user's memberships
  const getMyMemberships = async (limit: number = 50): Promise<MemberJoinedEvent[]> => {
    if (!currentAccount || !packageId) return [];

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎫 Fetching user memberships...');
      
      // Get all member joined events
      const events = await getMemberJoinedEvents(suiClient, packageId, undefined, limit);
      
      // Filter events for current user
      const userMemberships = events
        .map(event => {
          const parsedData = event.parsedJson as any;
          return {
            forum_id: parsedData.forum_id,
            member: parsedData.member,
            membership_id: parsedData.membership_id,
            total_members: parsedData.total_members,
            timestamp: parsedData.timestamp,
          };
        })
        .filter(event => event.member === currentAccount.address);

      // Cache memberships for permissions
      userMemberships.forEach(membership => {
        cacheMembership(membership.forum_id, currentAccount.address);
      });

      console.log(`✅ Found ${userMemberships.length} memberships for current user`);
      return userMemberships;

    } catch (err: any) {
      console.error('❌ Failed to get user memberships:', err);
      const errorMessage = err.message || "Failed to load user memberships";
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current user is member of a specific forum
  const checkMembership = async (forumId: string): Promise<boolean> => {
    if (!currentAccount) return false;

    try {
      const members = await getForumMembers(forumId);
      return members.some(member => member.member === currentAccount.address);
    } catch (err) {
      console.error('Failed to check membership:', err);
      return false;
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  return {
    // State
    isLoading,
    error,
    
    // Actions
    joinForum,
    getMemberRegistry,
    getMembershipDetails,
    getForumMembers,
    getMyMemberships,
    checkMembership,
    clearError,
    
    // Permissions
    canAccessInternals: (forumId: string) => canAccessForumInternals(forumId, currentAccount?.address),
    
    // Utils
    packageId,
    currentAccount,
  };
}
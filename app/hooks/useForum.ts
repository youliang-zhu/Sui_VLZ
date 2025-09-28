import { useState } from "react";
import { 
  useCurrentAccount, 
  useSuiClient, 
  useSignAndExecuteTransaction
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { Transaction } from "@mysten/sui/transactions";
import { 
  createForumTransaction, 
  createMemberRegistryTransaction,
  getObjectSafe,
  getForumCreatedEvents,
  processTransactionResult
} from "../utils/sui";
import { validateCreateForumForm } from "../utils/validation";
import { saveRegistryId, getRegistryId } from "../utils/storage";
import { 
  type CreateForumFormData,
  type Forum,
  type ForumCreatedEvent,
  type TransactionResult,
  processForum
} from "../types";

export function useForum() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("shallotPackageId");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new forum
  const createForum = async (formData: CreateForumFormData): Promise<TransactionResult> => {
    if (!currentAccount) {
      throw new Error("Please connect your wallet first");
    }

    if (!packageId) {
      throw new Error("Package ID not configured");
    }

    // Validate form data
    const validation = validateCreateForumForm(formData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(", ");
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🏛️ Creating forum:', formData.name);

      // Create forum transaction
      const tx = createForumTransaction(packageId, {
        name: formData.name,
        description: formData.description,
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

      console.log('✅ Forum creation transaction successful:', result.digest);

      // Wait for transaction confirmation
      const txResult = await suiClient.waitForTransaction({
        digest: result.digest,
        options: { showEffects: true, showEvents: true },
      });

      // Extract forum ID from created objects
      const forumId = txResult.effects?.created?.[0]?.reference?.objectId;
      if (!forumId) {
        throw new Error("Failed to get forum ID from transaction");
      }

      console.log('🏛️ Forum created with ID:', forumId);

      // Auto-create member registry
      try {
        console.log('📋 Creating member registry...');
        const registryTx = createMemberRegistryTransaction(packageId, forumId);
        
        const registryResult = await new Promise<any>((resolve, reject) => {
          signAndExecute(
            { transaction: registryTx },
            {
              onSuccess: resolve,
              onError: reject,
            }
          );
        });

        const registryTxResult = await suiClient.waitForTransaction({
          digest: registryResult.digest,
          options: { showEffects: true },
        });

        const registryId = registryTxResult.effects?.created?.[0]?.reference?.objectId;
        if (registryId) {
          console.log('✅ Member registry created with ID:', registryId);
          // Save the registry ID for this forum
          saveRegistryId(forumId, registryId);
        }

      } catch (registryError) {
        console.warn('⚠️ Member registry creation failed:', registryError);
        // Don't fail the whole operation if registry creation fails
      }

      return processTransactionResult(result);

    } catch (err: any) {
      console.error('❌ Forum creation failed:', err);
      const errorMessage = err.message || "Failed to create forum";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get forum details by ID
  const getForumDetails = async (forumId: string): Promise<Forum | null> => {
    if (!forumId) return null;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching forum details:', forumId);
      
      const objectResponse = await getObjectSafe(suiClient, forumId);
      if (!objectResponse?.data) {
        throw new Error("Forum not found");
      }

      const forum = processForum(objectResponse.data);
      if (!forum) {
        throw new Error("Invalid forum data");
      }

      console.log('✅ Forum details retrieved:', forum.name);
      return forum;

    } catch (err: any) {
      console.error('❌ Failed to get forum details:', err);
      const errorMessage = err.message || "Failed to load forum";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get list of all forums
  const getForumList = async (limit: number = 20): Promise<ForumCreatedEvent[]> => {
    if (!packageId) {
      throw new Error("Package ID not configured");
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('📋 Fetching forum list...');
      
      const events = await getForumCreatedEvents(suiClient, packageId, limit);
      
      const forumEvents: ForumCreatedEvent[] = events.map(event => {
        const parsedData = event.parsedJson as any;
        return {
          forum_id: parsedData.forum_id,
          name: parsedData.name,
          description: parsedData.description,
          creator: parsedData.creator,
          timestamp: parsedData.timestamp,
        };
      });

      console.log(`✅ Found ${forumEvents.length} forums`);
      return forumEvents;

    } catch (err: any) {
      console.error('❌ Failed to get forum list:', err);
      const errorMessage = err.message || "Failed to load forums";
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get forums created by current user
  const getMyForums = async (): Promise<ForumCreatedEvent[]> => {
    if (!currentAccount) return [];

    const allForums = await getForumList();
    return allForums.filter(forum => forum.creator === currentAccount.address);
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
    createForum,
    getForumDetails,
    getForumList,
    getMyForums,
    clearError,
    
    // Registry access
    getRegistryId: (forumId: string) => getRegistryId(forumId),
    
    // Utils
    packageId,
    currentAccount,
  };
}
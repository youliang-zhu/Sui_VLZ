'use client'
import { 
  useCurrentAccount, 
  useDisconnectWallet,
  useSuiClient
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LoadingWrapper } from "./components/common/LoadingSpinner";
import { ErrorMessage, SuccessMessage } from "./components/common/ErrorMessage";
import PasswordInput from "./components/common/PasswordInput";
import { useForum } from "./hooks/useForum";
import { useMembership } from "./hooks/useMembership";
import { formatAddress, formatDate } from "./utils/formatting";
import type { CreateForumFormData, JoinForumFormData, ForumCreatedEvent, MemberJoinedEvent } from "./types";

export default function Home() {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const suiClient = useSuiClient();
  const packageId = useNetworkVariable("shallotPackageId");
  
  const { 
    isLoading: forumLoading, 
    error: forumError, 
    createForum, 
    getForumList, 
    getRegistryId,
    clearError: clearForumError 
  } = useForum();
  
  const { 
    isLoading: membershipLoading, 
    error: membershipError, 
    joinForum, 
    getForumMembers, 
    getMyMemberships,
    checkMembership,
    clearError: clearMembershipError 
  } = useMembership();
  
  // Form states
  const [createFormData, setCreateFormData] = useState<CreateForumFormData>({
    name: "",
    description: "",
    password: ""
  });
  
  const [joinFormData, setJoinFormData] = useState<JoinForumFormData>({
    password: ""
  });
  
  // Data states
  const [forums, setForums] = useState<ForumCreatedEvent[]>([]);
  const [selectedForum, setSelectedForum] = useState<ForumCreatedEvent | null>(null);
  const [forumMembers, setForumMembers] = useState<MemberJoinedEvent[]>([]);
  const [myMemberships, setMyMemberships] = useState<MemberJoinedEvent[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [manualRegistryId, setManualRegistryId] = useState<string>("");
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  // View states
  const [activeTab, setActiveTab] = useState<'forums' | 'my-memberships' | 'create'>('forums');

  const isLoading = forumLoading || membershipLoading;
  const error = forumError || membershipError;

  // Network connection info
  const checkNetworkConnection = async () => {
    try {
      const chainId = await suiClient.getChainIdentifier();
      const checkpoint = await suiClient.getLatestCheckpointSequenceNumber();
      const txCount = await suiClient.getTotalTransactionBlocks();
      
      setNetworkInfo({
        chainId,
        checkpoint: checkpoint.toString(),
        totalTransactions: txCount.toString(),
        packageId,
      });
    } catch (err) {
      console.error('Network check failed:', err);
    }
  };

  // Handle form changes
  const handleCreateFormChange = (field: keyof CreateForumFormData, value: string) => {
    setCreateFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleJoinFormChange = (field: keyof JoinForumFormData, value: string) => {
    setJoinFormData(prev => ({ ...prev, [field]: value }));
  };

  // Create forum
  const handleCreateForum = async () => {
    if (!createFormData.name || !createFormData.password) {
      setSuccessMessage("Please fill in forum name and password");
      return;
    }

    try {
      const result = await createForum(createFormData);
      if (result.success) {
        const forumId = result.objectId;
        const registryId = getRegistryId(forumId || "");
        
        setSuccessMessage(
          `Forum "${createFormData.name}" created successfully! 
          Forum ID: ${forumId?.slice(0, 8)}...
          Registry ID: ${registryId?.slice(0, 8)}...`
        );
        
        setCreateFormData({ name: "", description: "", password: "" });
        setTimeout(() => loadForums(), 2000);
      }
    } catch (err: any) {
      console.error("Create forum failed:", err);
    }
  };

  // Load forums
  const loadForums = async () => {
    try {
      const forumList = await getForumList(20);
      setForums(forumList);
    } catch (err: any) {
      console.error("Failed to load forums:", err);
    }
  };

  // Join forum
  const handleJoinForum = async (forumId: string) => {
    if (!joinFormData.password) {
      setSuccessMessage("Please enter forum password");
      return;
    }

    try {
      const result = await joinForum(forumId, joinFormData);
      if (result.success) {
        setSuccessMessage(`Successfully joined forum!`);
        setJoinFormData({ password: "" });
        setTimeout(() => {
          handleGetForumMembers(forumId);
          handleGetMyMemberships();
        }, 2000);
      }
    } catch (err: any) {
      console.error("Join forum failed:", err);
    }
  };

  // Get forum members
  const handleGetForumMembers = async (forumId: string) => {
    try {
      const members = await getForumMembers(forumId);
      setForumMembers(members);
    } catch (err: any) {
      console.error("Get forum members failed:", err);
    }
  };

  // Get my memberships
  const handleGetMyMemberships = async () => {
    try {
      const memberships = await getMyMemberships();
      setMyMemberships(memberships);
    } catch (err: any) {
      console.error("Get my memberships failed:", err);
    }
  };

  // Check membership
  const handleCheckMembership = async (forumId: string) => {
    try {
      const isMember = await checkMembership(forumId);
      setSuccessMessage(`${isMember ? "You are a member of this forum" : "You are not a member of this forum"}`);
    } catch (err: any) {
      console.error("Check membership failed:", err);
    }
  };

  // Manual registry association
  const associateRegistry = async () => {
    if (selectedForum && manualRegistryId) {
      try {
        const { saveRegistryId } = await import("./utils/storage");
        saveRegistryId(selectedForum.forum_id, manualRegistryId);
        setSuccessMessage(`Registry associated with forum: ${selectedForum.name}`);
        setManualRegistryId("");
        setForums([...forums]);
      } catch (err) {
        console.error("Failed to associate registry:", err);
      }
    }
  };

  const clearError = () => {
    clearForumError();
    clearMembershipError();
    setSuccessMessage("");
  };

  // Initial load
  useState(() => {
    loadForums();
    if (currentAccount) {
      handleGetMyMemberships();
    }
    checkNetworkConnection();
  });

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Shallot Forum System
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Decentralized forum voting system with anonymous governance and democratic decision-making
          </p>
        </div>

        {/* Wallet Status */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Wallet Status</h4>
                  <div className="mt-2">
                    {currentAccount ? (
                      <div className="space-y-2">
                        <div className="flex items-center text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Connected
                        </div>
                        <p className="text-sm text-gray-600">
                          Address: {formatAddress(currentAccount.address)}
                        </p>
                        <Button
                          onClick={() => disconnect()}
                          variant="outline"
                          size="sm"
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                        Not Connected
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Network Status</h4>
                  <div className="mt-2">
                    <div className="flex items-center text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Testnet
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Package: {packageId ? formatAddress(packageId) : 'Loading...'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Forum Statistics</h4>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Total Forums: {forums.length}
                    </p>
                    <p className="text-sm text-gray-600">
                      My Memberships: {myMemberships.length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-center">
          <div className="container mx-auto p-6 max-w-6xl">
            <Card className="min-h-[700px]">
              <CardHeader>
                <CardTitle className="text-gray-900">Forum Management</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">

                  {/* Status Messages */}
                  {error && (
                    <ErrorMessage error={error} onRetry={clearError} />
                  )}
                  
                  {successMessage && (
                    <SuccessMessage 
                      message={successMessage} 
                      className="mb-4"
                    />
                  )}

                  {/* Tab Navigation */}
                  <div className="flex justify-center space-x-4 mb-6">
                    <Button
                      variant={activeTab === 'forums' ? 'default' : 'outline'}
                      onClick={() => setActiveTab('forums')}
                      className={activeTab === 'forums' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    >
                      Browse Forums
                    </Button>
                    {currentAccount && (
                      <>
                        <Button
                          variant={activeTab === 'create' ? 'default' : 'outline'}
                          onClick={() => setActiveTab('create')}
                          className={activeTab === 'create' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }
                        >
                          Create Forum
                        </Button>
                        <Button
                          variant={activeTab === 'my-memberships' ? 'default' : 'outline'}
                          onClick={() => {
                            setActiveTab('my-memberships');
                            handleGetMyMemberships();
                          }}
                          className={activeTab === 'my-memberships' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }
                        >
                          My Memberships
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Create Forum Tab */}
                  {activeTab === 'create' && currentAccount && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Create New Forum</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              Forum Name *
                            </label>
                            <input
                              type="text"
                              value={createFormData.name}
                              onChange={(e) => handleCreateFormChange("name", e.target.value)}
                              placeholder="Enter forum name"
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <PasswordInput
                              label="Access Password *"
                              value={createFormData.password}
                              onChange={(e) => handleCreateFormChange("password", e.target.value)}
                              placeholder="Set forum password"
                              showToggle={true}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            value={createFormData.description}
                            onChange={(e) => handleCreateFormChange("description", e.target.value)}
                            placeholder="Enter forum description"
                            rows={3}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <Button
                          onClick={handleCreateForum}
                          disabled={isLoading || !createFormData.name || !createFormData.password}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <LoadingWrapper isLoading={isLoading}>
                            Create Forum
                          </LoadingWrapper>
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Browse Forums Tab */}
                  {activeTab === 'forums' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Available Forums</h3>
                        <Button
                          onClick={loadForums}
                          disabled={isLoading}
                          variant="outline"
                        >
                          Refresh
                        </Button>
                      </div>

                      {forums.length > 0 ? (
                        <div className="space-y-3">
                          {forums.map((forum) => (
                            <Card key={forum.forum_id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{forum.name}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{forum.description}</p>
                                    <div className="text-xs text-gray-500 mt-2">
                                      Created by: {formatAddress(forum.creator)} | 
                                      {formatDate(parseInt(forum.timestamp))}
                                      {getRegistryId(forum.forum_id) && (
                                        <span className="ml-2 text-green-600">✓ Joinable</span>
                                      )}
                                      {!getRegistryId(forum.forum_id) && (
                                        <span className="ml-2 text-red-600">✗ Registry Required</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleGetForumMembers(forum.forum_id)}
                                    >
                                      Members
                                    </Button>
                                    {currentAccount && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleCheckMembership(forum.forum_id)}
                                        className="bg-orange-600 hover:bg-orange-700"
                                      >
                                        Status
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant={selectedForum?.forum_id === forum.forum_id ? "default" : "outline"}
                                      onClick={() => setSelectedForum(forum)}
                                    >
                                      Select
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No forums found. Create the first one!
                        </div>
                      )}
                    </div>
                  )}

                  {/* My Memberships Tab */}
                  {activeTab === 'my-memberships' && currentAccount && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">My Forum Memberships</h3>
                      
                      {myMemberships.length > 0 ? (
                        <div className="space-y-3">
                          {myMemberships.map((membership) => (
                            <Card key={membership.membership_id} className="bg-green-50 border-green-200">
                              <CardContent className="p-4">
                                <div className="text-sm">
                                  <p><strong>Forum ID:</strong> {formatAddress(membership.forum_id)}</p>
                                  <p><strong>Membership ID:</strong> {formatAddress(membership.membership_id)}</p>
                                  <p><strong>Joined:</strong> {formatDate(parseInt(membership.timestamp))}</p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          You haven't joined any forums yet. Browse forums to join!
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Registry Association */}
                  {currentAccount && selectedForum && !getRegistryId(selectedForum.forum_id) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Associate Registry ID</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-medium text-yellow-800 mb-2">Registry Required</h4>
                          <p className="text-sm text-yellow-700">
                            This forum needs a registry ID to enable joining. If you know the registry ID, you can associate it below.
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Selected Forum: <span className="text-blue-600">{selectedForum.name}</span>
                          </p>
                          <input
                            type="text"
                            value={manualRegistryId}
                            onChange={(e) => setManualRegistryId(e.target.value)}
                            placeholder="Enter registry ID (0x...)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <Button
                          onClick={associateRegistry}
                          disabled={!manualRegistryId}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Associate Registry
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Join Forum Form */}
                  {currentAccount && selectedForum && getRegistryId(selectedForum.forum_id) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Join Forum</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-medium text-green-800">Selected: {selectedForum.name}</h4>
                          <p className="text-sm text-green-700">Registry: {formatAddress(getRegistryId(selectedForum.forum_id)!)}</p>
                        </div>
                        
                        <PasswordInput
                          label="Forum Password"
                          value={joinFormData.password}
                          onChange={(e) => handleJoinFormChange("password", e.target.value)}
                          placeholder="Enter forum password"
                        />
                        
                        <Button
                          onClick={() => handleJoinForum(selectedForum.forum_id)}
                          disabled={isLoading || !joinFormData.password}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <LoadingWrapper isLoading={isLoading}>
                            Join Forum
                          </LoadingWrapper>
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Forum Members */}
                  {forumMembers.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Forum Members ({forumMembers.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {forumMembers.map((member, index) => (
                            <div 
                              key={member.membership_id} 
                              className="p-2 border border-gray-200 rounded text-sm"
                            >
                              <p><strong>Member:</strong> {formatAddress(member.member)}</p>
                              <p><strong>Joined:</strong> {formatDate(parseInt(member.timestamp))}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Network Info */}
                  {networkInfo && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Network Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Chain ID:</span>
                            <p className="text-gray-600">{networkInfo.chainId}</p>
                          </div>
                          <div>
                            <span className="font-medium">Latest Checkpoint:</span>
                            <p className="text-gray-600">{networkInfo.checkpoint}</p>
                          </div>
                          <div>
                            <span className="font-medium">Total Transactions:</span>
                            <p className="text-gray-600">{networkInfo.totalTransactions}</p>
                          </div>
                          <div>
                            <span className="font-medium">Package ID:</span>
                            <p className="text-gray-600 break-all">{networkInfo.packageId}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
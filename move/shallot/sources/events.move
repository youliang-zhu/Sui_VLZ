/// Events module for Shallot decentralized forum voting system
/// Defines all system events for monitoring and chain integration
module shallot::events {
    use sui::event;

    // ===== Event Structures =====

    /// Emitted when a new Forum is created
    public struct ForumCreated has copy, drop {
        forum_id: ID,
        name: std::string::String,
        description: std::string::String,
        creator: address,
        timestamp: u64,
    }

    /// Emitted when a new member joins a Forum
    public struct MemberJoined has copy, drop {
        forum_id: ID,
        member: address,
        membership_id: ID,
        total_members: u64,
        timestamp: u64,
    }

    /// Emitted when a new Poll is created
    public struct PollCreated has copy, drop {
        poll_id: ID,
        forum_id: ID,
        title: std::string::String,
        description: std::string::String,
        creator: address,
        start_time: u64,
        end_time: u64,
        timestamp: u64,
    }

    /// Emitted when someone votes (anonymous - only shows anonymous ID)
    public struct VoteReceived has copy, drop {
        poll_id: ID,
        anonymous_voter_id: vector<u8>, // hash(address + poll_id)
        timestamp: u64,
        // Note: We don't include the actual vote choice to maintain privacy
    }

    /// Emitted when a Poll is completed and executed
    public struct PollExecuted has copy, drop {
        poll_id: ID,
        forum_id: ID,
        yes_votes: u64,
        no_votes: u64,
        total_participants: u64,
        passed: bool,
        timestamp: u64,
    }

    /// Emitted when a Poll fails to execute
    public struct PollExecutionFailed has copy, drop {
        poll_id: ID,
        forum_id: ID,
        error_message: std::string::String,
        timestamp: u64,
    }

    /// Emitted when Forum metadata is updated via successful Poll
    public struct ForumMetadataUpdated has copy, drop {
        forum_id: ID,
        poll_id: ID,
        old_name: std::string::String,
        new_name: std::string::String,
        old_description: std::string::String,
        new_description: std::string::String,
        timestamp: u64,
    }

    // ===== Event Emission Functions =====

    /// Emit ForumCreated event
    public(package) fun emit_forum_created(
        forum_id: ID,
        name: std::string::String,
        description: std::string::String,
        creator: address,
        timestamp: u64,
    ) {
        event::emit(ForumCreated {
            forum_id,
            name,
            description,
            creator,
            timestamp,
        });
    }

    /// Emit MemberJoined event
    public(package) fun emit_member_joined(
        forum_id: ID,
        member: address,
        membership_id: ID,
        total_members: u64,
        timestamp: u64,
    ) {
        event::emit(MemberJoined {
            forum_id,
            member,
            membership_id,
            total_members,
            timestamp,
        });
    }

    /// Emit PollCreated event
    public(package) fun emit_poll_created(
        poll_id: ID,
        forum_id: ID,
        title: std::string::String,
        description: std::string::String,
        creator: address,
        start_time: u64,
        end_time: u64,
        timestamp: u64,
    ) {
        event::emit(PollCreated {
            poll_id,
            forum_id,
            title,
            description,
            creator,
            start_time,
            end_time,
            timestamp,
        });
    }

    /// Emit VoteReceived event (anonymous)
    public(package) fun emit_vote_received(
        poll_id: ID,
        anonymous_voter_id: vector<u8>,
        timestamp: u64,
    ) {
        event::emit(VoteReceived {
            poll_id,
            anonymous_voter_id,
            timestamp,
        });
    }

    /// Emit PollExecuted event
    public(package) fun emit_poll_executed(
        poll_id: ID,
        forum_id: ID,
        yes_votes: u64,
        no_votes: u64,
        total_participants: u64,
        passed: bool,
        timestamp: u64,
    ) {
        event::emit(PollExecuted {
            poll_id,
            forum_id,
            yes_votes,
            no_votes,
            total_participants,
            passed,
            timestamp,
        });
    }

    /// Emit PollExecutionFailed event
    public(package) fun emit_poll_execution_failed(
        poll_id: ID,
        forum_id: ID,
        error_message: std::string::String,
        timestamp: u64,
    ) {
        event::emit(PollExecutionFailed {
            poll_id,
            forum_id,
            error_message,
            timestamp,
        });
    }

    /// Emit ForumMetadataUpdated event
    public(package) fun emit_forum_metadata_updated(
        forum_id: ID,
        poll_id: ID,
        old_name: std::string::String,
        new_name: std::string::String,
        old_description: std::string::String,
        new_description: std::string::String,
        timestamp: u64,
    ) {
        event::emit(ForumMetadataUpdated {
            forum_id,
            poll_id,
            old_name,
            new_name,
            old_description,
            new_description,
            timestamp,
        });
    }
}
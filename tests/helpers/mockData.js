/** @format */

// Mock data for community module tests

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  user_details: {
    full_name: "Test User",
    profile_picture: "https://example.com/profile.jpg",
  },
};

const mockUser2 = {
  id: "user-456",
  email: "test2@example.com",
  user_details: {
    full_name: "Test User 2",
    profile_picture: null,
  },
};

const mockCommunity = {
  id: "community-123",
  user_id: "user-123",
  communityTitle: "Test Community",
  description: "This is a test community",
  communityRules: JSON.stringify(["Rule 1", "Rule 2"]),
  privacy: "PUBLIC",
  communityImg: "https://example.com/community.jpg",
  membersCount: 1,
  isApproved: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: mockUser,
};

const mockCommunityMember = {
  id: "member-123",
  community_id: "community-123",
  user_id: "user-123",
  status: "APPROVED",
  isApplied: false,
  community: mockCommunity,
  user: mockUser,
};

const mockPost = {
  id: "post-123",
  community_id: "community-123",
  user_id: "user-123",
  description: "This is a test post",
  postImg: "https://example.com/post.jpg",
  createdAt: new Date(),
  updatedAt: new Date(),
  community: mockCommunity,
  user: mockUser,
};

const mockComment = {
  id: "comment-123",
  community_post_id: "post-123",
  user_id: "user-123",
  text: "This is a test comment",
  created_at: new Date(),
  updated_at: new Date(),
  user: mockUser,
  community_post: mockPost,
};

const mockCommentReply = {
  id: "reply-123",
  post_comment_id: "comment-123",
  user_id: "user-123",
  text: "This is a test reply",
  created_at: new Date(),
  updated_at: new Date(),
  post_comment: mockComment,
  user: mockUser,
};

const mockPostLike = {
  id: "like-123",
  community_post_id: "post-123",
  user_id: "user-123",
  created_at: new Date(),
  updated_at: new Date(),
  user: mockUser,
  community_post: mockPost,
};

const mockCommunityInvite = {
  id: "invite-123",
  community_id: "community-123",
  sender_id: "user-123",
  receiver_id: "user-456",
  status: "PENDING",
  createdAt: new Date(),
  updatedAt: new Date(),
  community: mockCommunity,
  sender: mockUser,
  receiver: mockUser2,
};

module.exports = {
  mockUser,
  mockUser2,
  mockCommunity,
  mockCommunityMember,
  mockPost,
  mockComment,
  mockCommentReply,
  mockPostLike,
  mockCommunityInvite,
};

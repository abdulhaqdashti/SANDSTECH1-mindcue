/** @format */

const CommunityService = require("@api/v1/services/community");
const {
  mockUser,
  mockUser2,
  mockCommunity,
  mockCommunityMember,
  mockPost,
  mockPostLike,
} = require("../../helpers/mockData");

jest.mock("@configs/prisma", () => {
  const { createPrismaMock } = require("../../helpers/prismaMock");
  return {
    prisma: createPrismaMock(),
  };
});

const { prisma } = require("@configs/prisma");
const service = new CommunityService();

describe("CommunityService - Post Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create_post", () => {
    it("should create a post in community", async () => {
      const input = {
        communityId: mockCommunity.id,
        user_id: mockUser.id,
        description: "Test post description",
        postImg: null,
      };

      prisma.community.findUnique.mockResolvedValue(mockCommunity);
      prisma.communityMember.findUnique.mockResolvedValue({
        ...mockCommunityMember,
        status: "APPROVED",
      });
      prisma.communityPost.create.mockResolvedValue(mockPost);

      const result = await service.create_post(input);

      expect(prisma.communityPost.create).toHaveBeenCalledWith({
        data: {
          community_id: input.communityId,
          user_id: input.user_id,
          description: input.description,
          postImg: input.postImg,
        },
        include: expect.any(Object),
      });

      expect(result).toEqual(mockPost);
    });

    it("should throw error if user is not a member", async () => {
      const input = {
        communityId: mockCommunity.id,
        user_id: mockUser2.id,
        description: "Test post",
      };

      prisma.community.findUnique.mockResolvedValue(mockCommunity);
      prisma.communityMember.findUnique.mockResolvedValue(null);

      await expect(service.create_post(input)).rejects.toThrow(
        "You must be a member to create posts"
      );
    });
  });

  describe("get_community_posts", () => {
    it("should get all posts in a community", async () => {
      const input = {
        communityId: mockCommunity.id,
        page: 1,
        limit: 10,
      };

      prisma.communityPost.findMany.mockResolvedValue([mockPost]);
      prisma.communityPost.count.mockResolvedValue(1);

      const result = await service.get_community_posts(input);

      expect(prisma.communityPost.findMany).toHaveBeenCalledWith({
        where: { community_id: input.communityId },
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: expect.any(Object),
      });

      expect(Array.isArray(result.posts)).toBe(true);
      expect(result.pagination).toBeDefined();
    });
  });

  describe("update_post", () => {
    it("should update post if user is the creator", async () => {
      const input = {
        postId: mockPost.id,
        user_id: mockUser.id,
        description: "Updated description",
      };

      prisma.communityPost.findUnique.mockResolvedValue(mockPost);
      prisma.communityPost.update.mockResolvedValue({
        ...mockPost,
        description: input.description,
      });

      const result = await service.update_post(input);

      expect(prisma.communityPost.update).toHaveBeenCalledWith({
        where: { id: input.postId },
        data: expect.objectContaining({
          description: input.description,
        }),
        include: expect.any(Object),
      });

      expect(result).toBeDefined();
    });

    it("should throw error if user is not the creator", async () => {
      const input = {
        postId: mockPost.id,
        user_id: mockUser2.id,
      };

      prisma.communityPost.findUnique.mockResolvedValue(mockPost);

      await expect(service.update_post(input)).rejects.toThrow(
        "Only post creator can update"
      );
    });
  });

  describe("delete_post", () => {
    it("should delete post if user is the creator", async () => {
      const input = {
        postId: mockPost.id,
        user_id: mockUser.id,
      };

      prisma.communityPost.findUnique.mockResolvedValue(mockPost);
      prisma.postLike.deleteMany.mockResolvedValue({ count: 0 });
      prisma.postComment.deleteMany.mockResolvedValue({ count: 0 });
      prisma.communityPost.delete.mockResolvedValue(mockPost);

      const result = await service.delete_post(input);

      expect(prisma.communityPost.delete).toHaveBeenCalledWith({
        where: { id: input.postId },
      });

      expect(result.message).toBe("Post deleted successfully");
    });
  });

  describe("like_post", () => {
    it("should like a post if not already liked", async () => {
      const input = {
        postId: mockPost.id,
        user_id: mockUser.id,
      };

      prisma.communityPost.findUnique.mockResolvedValue(mockPost);
      prisma.postLike.findUnique.mockResolvedValue(null);
      prisma.postLike.create.mockResolvedValue(mockPostLike);

      const result = await service.like_post(input);

      expect(prisma.postLike.create).toHaveBeenCalledWith({
        data: {
          community_post_id: input.postId,
          user_id: input.user_id,
        },
      });

      expect(result.message).toBe("Post liked successfully");
    });

    it("should unlike a post if already liked", async () => {
      const input = {
        postId: mockPost.id,
        user_id: mockUser.id,
      };

      prisma.communityPost.findUnique.mockResolvedValue(mockPost);
      prisma.postLike.findUnique.mockResolvedValue(mockPostLike);
      prisma.postLike.delete.mockResolvedValue(mockPostLike);

      const result = await service.like_post(input);

      expect(prisma.postLike.delete).toHaveBeenCalledWith({
        where: {
          community_post_id_user_id: {
            community_post_id: input.postId,
            user_id: input.user_id,
          },
        },
      });

      expect(result.message).toBe("Post unliked successfully");
    });
  });
});

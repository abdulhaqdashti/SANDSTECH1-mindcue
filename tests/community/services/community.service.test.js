/** @format */

const CommunityService = require("@api/v1/services/community");
const {
  mockUser,
  mockUser2,
  mockCommunity,
  mockCommunityMember,
  mockPost,
  mockComment,
  mockCommentReply,
  mockPostLike,
} = require("../../helpers/mockData");

// Mock Prisma
jest.mock("@configs/prisma", () => {
  const { createPrismaMock } = require("../../helpers/prismaMock");
  return {
    prisma: createPrismaMock(),
  };
});

const { prisma } = require("@configs/prisma");
const service = new CommunityService();

describe("CommunityService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create_community", () => {
    it("should create a community with string rules", async () => {
      const input = {
        user_id: mockUser.id,
        communityTitle: "Test Community",
        description: "Test description",
        communityRules: "Single rule",
        privacy: "PUBLIC",
        communityImg: null,
      };

      prisma.community.create.mockResolvedValue(mockCommunity);
      prisma.communityMember.create.mockResolvedValue(mockCommunityMember);

      const result = await service.create_community(input);

      expect(prisma.community.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: input.user_id,
          communityTitle: input.communityTitle,
          description: input.description,
          communityRules: JSON.stringify([input.communityRules]),
          privacy: input.privacy,
          membersCount: 1,
          isApproved: true,
        }),
        include: expect.any(Object),
      });

      expect(prisma.communityMember.create).toHaveBeenCalledWith({
        data: {
          community_id: mockCommunity.id,
          user_id: input.user_id,
          status: "APPROVED",
          isApplied: false,
        },
      });

      expect(result).toEqual(mockCommunity);
    });

    it("should create a community with array rules", async () => {
      const input = {
        user_id: mockUser.id,
        communityTitle: "Test Community",
        description: "Test description",
        communityRules: ["Rule 1", "Rule 2"],
        privacy: "PRIVATE",
        communityImg: "https://example.com/img.jpg",
      };

      prisma.community.create.mockResolvedValue(mockCommunity);
      prisma.communityMember.create.mockResolvedValue(mockCommunityMember);

      await service.create_community(input);

      expect(prisma.community.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          communityRules: JSON.stringify(input.communityRules),
        }),
        include: expect.any(Object),
      });
    });
  });

  describe("get_all_communities", () => {
    it("should get recommended communities", async () => {
      const input = {
        user_id: mockUser.id,
        type: "recommended",
        page: 1,
        limit: 10,
      };

      prisma.$queryRawUnsafe.mockResolvedValue([mockCommunity]);

      const result = await service.get_all_communities(input);

      expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
      expect(Array.isArray(result.communities)).toBe(true);
    });

    it("should get my communities", async () => {
      const input = {
        user_id: mockUser.id,
        type: "my",
        page: 1,
        limit: 10,
      };

      prisma.community.findMany.mockResolvedValue([mockCommunity]);
      prisma.communityMember.findMany.mockResolvedValue([mockCommunityMember]);

      const result = await service.get_all_communities(input);

      expect(prisma.community.findMany).toHaveBeenCalledWith({
        where: { user_id: input.user_id },
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: expect.any(Object),
      });

      expect(Array.isArray(result.communities)).toBe(true);
    });

    it("should get joined communities", async () => {
      const input = {
        user_id: mockUser.id,
        type: "joined",
        page: 1,
        limit: 10,
      };

      prisma.communityMember.findMany.mockResolvedValue([mockCommunityMember]);
      prisma.community.findMany.mockResolvedValue([mockCommunity]);

      const result = await service.get_all_communities(input);

      expect(prisma.communityMember.findMany).toHaveBeenCalledWith({
        where: {
          user_id: input.user_id,
          status: "APPROVED",
        },
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: expect.any(Object),
      });

      expect(Array.isArray(result.communities)).toBe(true);
    });
  });

  describe("get_community", () => {
    it("should get a single community by ID", async () => {
      const communityId = mockCommunity.id;

      prisma.community.findUnique.mockResolvedValue(mockCommunity);

      const result = await service.get_community({ communityId });

      expect(prisma.community.findUnique).toHaveBeenCalledWith({
        where: { id: communityId },
        include: expect.any(Object),
      });

      expect(result).toEqual(mockCommunity);
    });

    it("should throw error if community not found", async () => {
      const communityId = "non-existent-id";

      prisma.community.findUnique.mockResolvedValue(null);

      await expect(service.get_community({ communityId })).rejects.toThrow();
    });
  });

  describe("update_community", () => {
    it("should update community if user is owner", async () => {
      const input = {
        communityId: mockCommunity.id,
        user_id: mockUser.id,
        communityTitle: "Updated Title",
        description: "Updated description",
      };

      prisma.community.findUnique.mockResolvedValue(mockCommunity);
      prisma.community.update.mockResolvedValue({
        ...mockCommunity,
        ...input,
      });

      const result = await service.update_community(input);

      expect(prisma.community.update).toHaveBeenCalledWith({
        where: { id: input.communityId },
        data: expect.objectContaining({
          communityTitle: input.communityTitle,
          description: input.description,
        }),
        include: expect.any(Object),
      });

      expect(result).toBeDefined();
    });

    it("should throw error if user is not owner", async () => {
      const input = {
        communityId: mockCommunity.id,
        user_id: mockUser2.id,
      };

      prisma.community.findUnique.mockResolvedValue(mockCommunity);

      await expect(service.update_community(input)).rejects.toThrow(
        "Only community owner can update"
      );
    });
  });

  describe("delete_community", () => {
    it("should delete community and all related records", async () => {
      const input = {
        communityId: mockCommunity.id,
        user_id: mockUser.id,
      };

      prisma.community.findUnique.mockResolvedValue(mockCommunity);
      prisma.communityPost.findMany.mockResolvedValue([mockPost]);
      prisma.postComment.findMany.mockResolvedValue([mockComment]);
      prisma.communityPost.deleteMany.mockResolvedValue({ count: 1 });
      prisma.communityMember.deleteMany.mockResolvedValue({ count: 1 });
      prisma.communityInvite.deleteMany.mockResolvedValue({ count: 1 });
      prisma.community.delete.mockResolvedValue(mockCommunity);

      const result = await service.delete_community(input);

      expect(prisma.community.findUnique).toHaveBeenCalled();
      expect(prisma.communityPost.findMany).toHaveBeenCalled();
      expect(result.message).toBe("Community deleted successfully");
    });

    it("should throw error if user is not owner", async () => {
      const input = {
        communityId: mockCommunity.id,
        user_id: mockUser2.id,
      };

      prisma.community.findUnique.mockResolvedValue(mockCommunity);

      await expect(service.delete_community(input)).rejects.toThrow(
        "Only community owner can delete"
      );
    });
  });

  describe("join_community", () => {
    it("should join a public community directly", async () => {
      const input = {
        communityId: mockCommunity.id,
        user_id: mockUser2.id,
      };

      const publicCommunity = { ...mockCommunity, privacy: "PUBLIC" };

      prisma.community.findUnique.mockResolvedValue(publicCommunity);
      prisma.communityMember.findUnique.mockResolvedValue(null);
      prisma.communityMember.create.mockResolvedValue(mockCommunityMember);
      prisma.community.update.mockResolvedValue(publicCommunity);

      const result = await service.join_community(input);

      expect(prisma.communityMember.create).toHaveBeenCalledWith({
        data: {
          community_id: input.communityId,
          user_id: input.user_id,
          status: "APPROVED",
          isApplied: false,
        },
      });

      expect(result).toBeDefined();
    });

    it("should create join request for private community", async () => {
      const input = {
        communityId: mockCommunity.id,
        user_id: mockUser2.id,
      };

      const privateCommunity = { ...mockCommunity, privacy: "PRIVATE" };

      prisma.community.findUnique.mockResolvedValue(privateCommunity);
      prisma.communityMember.findUnique.mockResolvedValue(null);
      prisma.communityMember.create.mockResolvedValue({
        ...mockCommunityMember,
        status: "PENDING",
      });

      const result = await service.join_community(input);

      expect(prisma.communityMember.create).toHaveBeenCalledWith({
        data: {
          community_id: input.communityId,
          user_id: input.user_id,
          status: "PENDING",
          isApplied: true,
        },
      });

      expect(result).toBeDefined();
    });
  });

  describe("leave_community", () => {
    it("should allow member to leave community", async () => {
      const input = {
        communityId: mockCommunity.id,
        user_id: mockUser2.id,
      };

      prisma.community.findUnique.mockResolvedValue(mockCommunity);
      prisma.communityMember.findUnique.mockResolvedValue(mockCommunityMember);
      prisma.communityMember.delete.mockResolvedValue(mockCommunityMember);
      prisma.community.update.mockResolvedValue(mockCommunity);

      const result = await service.leave_community(input);

      expect(prisma.communityMember.delete).toHaveBeenCalled();
      expect(result.message).toBe("Left community successfully");
    });

    it("should not allow owner to leave", async () => {
      const input = {
        communityId: mockCommunity.id,
        user_id: mockUser.id, // Owner
      };

      prisma.community.findUnique.mockResolvedValue(mockCommunity);

      await expect(service.leave_community(input)).rejects.toThrow(
        "Community owner cannot leave"
      );
    });
  });

  describe("search_communities", () => {
    it("should search communities by title", async () => {
      const input = {
        search: "Test",
        page: 1,
        limit: 10,
      };

      prisma.community.findMany.mockResolvedValue([mockCommunity]);
      prisma.community.count.mockResolvedValue(1);

      const result = await service.search_communities(input);

      expect(prisma.community.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              communityTitle: expect.objectContaining({
                contains: input.search,
              }),
            }),
          ]),
        }),
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: expect.any(Object),
      });

      expect(result.communities).toBeDefined();
      expect(result.pagination).toBeDefined();
    });
  });
});

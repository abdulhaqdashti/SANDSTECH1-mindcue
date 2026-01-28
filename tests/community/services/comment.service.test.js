/** @format */

const CommunityService = require("@api/v1/services/community");
const {
  mockUser,
  mockUser2,
  mockPost,
  mockComment,
  mockCommentReply,
} = require("../../helpers/mockData");

jest.mock("@configs/prisma", () => {
  const { createPrismaMock } = require("../../helpers/prismaMock");
  return {
    prisma: createPrismaMock(),
  };
});

const { prisma } = require("@configs/prisma");
const service = new CommunityService();

describe("CommunityService - Comment Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create_comment", () => {
    it("should create a comment on a post", async () => {
      const input = {
        postId: mockPost.id,
        user_id: mockUser.id,
        text: "Test comment",
      };

      prisma.communityPost.findUnique.mockResolvedValue(mockPost);
      prisma.postComment.create.mockResolvedValue(mockComment);

      const result = await service.create_comment(input);

      expect(prisma.postComment.create).toHaveBeenCalledWith({
        data: {
          community_post_id: input.postId,
          user_id: input.user_id,
          text: input.text,
        },
        include: expect.any(Object),
      });

      expect(result).toEqual(mockComment);
    });

    it("should throw error if post not found", async () => {
      const input = {
        postId: "non-existent-id",
        user_id: mockUser.id,
        text: "Test comment",
      };

      prisma.communityPost.findUnique.mockResolvedValue(null);

      await expect(service.create_comment(input)).rejects.toThrow(
        "Post not found"
      );
    });
  });

  describe("get_post_comments", () => {
    it("should get all comments for a post", async () => {
      const input = {
        postId: mockPost.id,
        page: 1,
        limit: 10,
      };

      prisma.postComment.findMany.mockResolvedValue([mockComment]);
      prisma.postComment.count.mockResolvedValue(1);

      const result = await service.get_post_comments(input);

      expect(prisma.postComment.findMany).toHaveBeenCalledWith({
        where: { community_post_id: input.postId },
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: expect.any(Object),
      });

      expect(Array.isArray(result.comments)).toBe(true);
      expect(result.pagination).toBeDefined();
    });
  });

  describe("update_comment", () => {
    it("should update comment if user is the creator", async () => {
      const input = {
        commentId: mockComment.id,
        user_id: mockUser.id,
        text: "Updated comment",
      };

      prisma.postComment.findUnique.mockResolvedValue(mockComment);
      prisma.postComment.update.mockResolvedValue({
        ...mockComment,
        text: input.text,
      });

      const result = await service.update_comment(input);

      expect(prisma.postComment.update).toHaveBeenCalledWith({
        where: { id: input.commentId },
        data: { text: input.text },
        include: expect.any(Object),
      });

      expect(result).toBeDefined();
    });

    it("should throw error if user is not the creator", async () => {
      const input = {
        commentId: mockComment.id,
        user_id: mockUser2.id,
        text: "Updated comment",
      };

      prisma.postComment.findUnique.mockResolvedValue(mockComment);

      await expect(service.update_comment(input)).rejects.toThrow(
        "Only comment creator can update"
      );
    });
  });

  describe("delete_comment", () => {
    it("should delete comment and all replies if user is creator", async () => {
      const input = {
        commentId: mockComment.id,
        user_id: mockUser.id,
      };

      prisma.postComment.findUnique.mockResolvedValue(mockComment);
      prisma.commentReply.deleteMany.mockResolvedValue({ count: 0 });
      prisma.postComment.delete.mockResolvedValue(mockComment);

      const result = await service.delete_comment(input);

      expect(prisma.commentReply.deleteMany).toHaveBeenCalledWith({
        where: { post_comment_id: input.commentId },
      });

      expect(prisma.postComment.delete).toHaveBeenCalledWith({
        where: { id: input.commentId },
      });

      expect(result.message).toBe("Comment deleted successfully");
    });
  });

  describe("create_comment_reply", () => {
    it("should create a reply to a comment", async () => {
      const input = {
        commentId: mockComment.id,
        user_id: mockUser.id,
        text: "Test reply",
      };

      prisma.postComment.findUnique.mockResolvedValue(mockComment);
      prisma.commentReply.create.mockResolvedValue(mockCommentReply);

      const result = await service.create_comment_reply(input);

      expect(prisma.commentReply.create).toHaveBeenCalledWith({
        data: {
          post_comment_id: input.commentId,
          user_id: input.user_id,
          text: input.text,
        },
        include: expect.any(Object),
      });

      expect(result).toEqual(mockCommentReply);
    });
  });

  describe("get_comment_replies", () => {
    it("should get all replies for a comment", async () => {
      const input = {
        commentId: mockComment.id,
        page: 1,
        limit: 10,
      };

      prisma.commentReply.findMany.mockResolvedValue([mockCommentReply]);
      prisma.commentReply.count.mockResolvedValue(1);

      const result = await service.get_comment_replies(input);

      expect(prisma.commentReply.findMany).toHaveBeenCalledWith({
        where: { post_comment_id: input.commentId },
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: expect.any(Object),
      });

      expect(Array.isArray(result.replies)).toBe(true);
      expect(result.pagination).toBeDefined();
    });
  });

  describe("update_comment_reply", () => {
    it("should update reply if user is the creator", async () => {
      const input = {
        replyId: mockCommentReply.id,
        user_id: mockUser.id,
        text: "Updated reply",
      };

      prisma.commentReply.findUnique.mockResolvedValue(mockCommentReply);
      prisma.commentReply.update.mockResolvedValue({
        ...mockCommentReply,
        text: input.text,
      });

      const result = await service.update_comment_reply(input);

      expect(prisma.commentReply.update).toHaveBeenCalledWith({
        where: { id: input.replyId },
        data: { text: input.text },
        include: expect.any(Object),
      });

      expect(result).toBeDefined();
    });
  });

  describe("delete_comment_reply", () => {
    it("should delete reply if user is the creator", async () => {
      const input = {
        replyId: mockCommentReply.id,
        user_id: mockUser.id,
      };

      prisma.commentReply.findUnique.mockResolvedValue(mockCommentReply);
      prisma.commentReply.delete.mockResolvedValue(mockCommentReply);

      const result = await service.delete_comment_reply(input);

      expect(prisma.commentReply.delete).toHaveBeenCalledWith({
        where: { id: input.replyId },
      });

      expect(result.message).toBe("Comment reply deleted successfully");
    });
  });
});

/** @format */

const CommunityController = require("@api/v1/controllers/community");
const CommunityService = require("@api/v1/services/community");
const { mockUser, mockCommunity } = require("../../helpers/mockData");

jest.mock("@api/v1/services/community");

const controller = new CommunityController();
const service = new CommunityService();

describe("CommunityController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { user: mockUser },
      body: {},
      query: {},
      params: {},
      media: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("create_community", () => {
    it("should create a community successfully", async () => {
      req.body = {
        communityTitle: "Test Community",
        description: "Test description",
        communityRules: ["Rule 1"],
        privacy: "PUBLIC",
      };

      service.create_community = jest.fn().mockResolvedValue(mockCommunity);

      await controller.create_community(req, res, next);

      expect(service.create_community).toHaveBeenCalledWith({
        user_id: mockUser.id,
        communityTitle: req.body.communityTitle,
        description: req.body.description,
        communityRules: req.body.communityRules,
        privacy: req.body.privacy,
        communityImg: undefined,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it("should handle errors", async () => {
      const error = new Error("Test error");
      service.create_community = jest.fn().mockRejectedValue(error);

      await controller.create_community(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("get_all_communities", () => {
    it("should get all communities", async () => {
      req.query = { type: "recommended", page: "1", limit: "10" };

      const mockData = {
        communities: [mockCommunity],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      service.get_all_communities = jest.fn().mockResolvedValue(mockData);

      await controller.get_all_communities(req, res, next);

      expect(service.get_all_communities).toHaveBeenCalledWith({
        user_id: mockUser.id,
        type: "recommended",
        page: 1,
        limit: 10,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("get_community", () => {
    it("should get a single community", async () => {
      req.params = { communityId: mockCommunity.id };

      service.get_community = jest.fn().mockResolvedValue(mockCommunity);

      await controller.get_community(req, res, next);

      expect(service.get_community).toHaveBeenCalledWith({
        communityId: mockCommunity.id,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("update_community", () => {
    it("should update a community", async () => {
      req.params = { communityId: mockCommunity.id };
      req.body = { communityTitle: "Updated Title" };

      service.update_community = jest.fn().mockResolvedValue(mockCommunity);

      await controller.update_community(req, res, next);

      expect(service.update_community).toHaveBeenCalledWith({
        communityId: mockCommunity.id,
        user_id: mockUser.id,
        communityTitle: "Updated Title",
        communityImg: undefined,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("delete_community", () => {
    it("should delete a community", async () => {
      req.params = { communityId: mockCommunity.id };

      service.delete_community = jest.fn().mockResolvedValue({
        message: "Community deleted successfully",
      });

      await controller.delete_community(req, res, next);

      expect(service.delete_community).toHaveBeenCalledWith({
        communityId: mockCommunity.id,
        user_id: mockUser.id,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("join_community", () => {
    it("should join a community", async () => {
      req.params = { communityId: mockCommunity.id };

      service.join_community = jest.fn().mockResolvedValue({
        message: "Joined community successfully",
      });

      await controller.join_community(req, res, next);

      expect(service.join_community).toHaveBeenCalledWith({
        communityId: mockCommunity.id,
        user_id: mockUser.id,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("leave_community", () => {
    it("should leave a community", async () => {
      req.params = { communityId: mockCommunity.id };

      service.leave_community = jest.fn().mockResolvedValue({
        message: "Left community successfully",
      });

      await controller.leave_community(req, res, next);

      expect(service.leave_community).toHaveBeenCalledWith({
        communityId: mockCommunity.id,
        user_id: mockUser.id,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("search_communities", () => {
    it("should search communities", async () => {
      req.query = { search: "Test", page: "1", limit: "10" };

      const mockData = {
        communities: [mockCommunity],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      service.search_communities = jest.fn().mockResolvedValue(mockData);

      await controller.search_communities(req, res, next);

      expect(service.search_communities).toHaveBeenCalledWith({
        search: "Test",
        page: 1,
        limit: 10,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });
});

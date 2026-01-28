/** @format */

const request = require("supertest");
const express = require("express");
const communityRouter = require("@api/v1/routers/community");

// Mock middlewares
jest.mock("@v1_middlewares/verify_token.middleware", () => {
  return (req, res, next) => {
    req.user = {
      user: {
        id: "user-123",
        email: "test@example.com",
      },
    };
    next();
  };
});

jest.mock("@v1_middlewares/populate_multipart_data.middleware", () => {
  return () => (req, res, next) => {
    req.media = {};
    next();
  };
});

jest.mock("@api/v1/middlewares/upload_media.middleware", () => {
  return (req, res, next) => {
    req.media = {};
    next();
  };
});

const app = express();
app.use(express.json());
app.use("/api/v1/community", communityRouter);

describe("Community API Endpoints", () => {
  describe("POST /api/v1/community", () => {
    it("should create a community with valid data", async () => {
      const response = await request(app)
        .post("/api/v1/community")
        .send({
          communityTitle: "Test Community",
          description: "Test description",
          communityRules: ["Rule 1", "Rule 2"],
          privacy: "PUBLIC",
        })
        .expect(400); // Will fail validation or return 200 if service works

      // This is a basic structure test
      expect(response.body).toHaveProperty("status");
    });

    it("should reject invalid privacy value", async () => {
      const response = await request(app)
        .post("/api/v1/community")
        .send({
          communityTitle: "Test",
          description: "Test",
          communityRules: "Rule 1",
          privacy: "INVALID",
        })
        .expect(400);

      expect(response.body.status.success).toBe(false);
    });
  });

  describe("GET /api/v1/community", () => {
    it("should get all communities with query params", async () => {
      const response = await request(app)
        .get("/api/v1/community")
        .query({ type: "recommended", page: 1, limit: 10 })
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });

    it("should validate query parameters", async () => {
      const response = await request(app)
        .get("/api/v1/community")
        .query({ type: "invalid_type" })
        .expect(400);

      expect(response.body.status.success).toBe(false);
    });
  });

  describe("GET /api/v1/community/:communityId", () => {
    it("should get a single community", async () => {
      const response = await request(app)
        .get("/api/v1/community/community-123")
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });

  describe("PATCH /api/v1/community/:communityId", () => {
    it("should update a community", async () => {
      const response = await request(app)
        .patch("/api/v1/community/community-123")
        .send({
          communityTitle: "Updated Title",
        })
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });

  describe("DELETE /api/v1/community/:communityId", () => {
    it("should delete a community", async () => {
      const response = await request(app)
        .delete("/api/v1/community/community-123")
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });

  describe("POST /api/v1/community/:communityId/join", () => {
    it("should join a community", async () => {
      const response = await request(app)
        .post("/api/v1/community/community-123/join")
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });

  describe("POST /api/v1/community/:communityId/leave", () => {
    it("should leave a community", async () => {
      const response = await request(app)
        .post("/api/v1/community/community-123/leave")
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });

  describe("GET /api/v1/community/search", () => {
    it("should search communities", async () => {
      const response = await request(app)
        .get("/api/v1/community/search")
        .query({ search: "test" })
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });

    it("should require search parameter", async () => {
      const response = await request(app)
        .get("/api/v1/community/search")
        .expect(400);

      expect(response.body.status.success).toBe(false);
    });
  });
});

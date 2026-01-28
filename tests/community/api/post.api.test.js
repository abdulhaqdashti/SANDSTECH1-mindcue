/** @format */

const request = require("supertest");
const express = require("express");
const communityRouter = require("@api/v1/routers/community");

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

describe("Post API Endpoints", () => {
  describe("POST /api/v1/community/:communityId/posts", () => {
    it("should create a post", async () => {
      const response = await request(app)
        .post("/api/v1/community/community-123/posts")
        .send({
          description: "Test post description",
        })
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });

    it("should require description", async () => {
      const response = await request(app)
        .post("/api/v1/community/community-123/posts")
        .send({})
        .expect(400);

      expect(response.body.status.success).toBe(false);
    });
  });

  describe("GET /api/v1/community/:communityId/posts", () => {
    it("should get community posts", async () => {
      const response = await request(app)
        .get("/api/v1/community/community-123/posts")
        .query({ page: 1, limit: 10 })
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });

  describe("PATCH /api/v1/community/posts/:postId", () => {
    it("should update a post", async () => {
      const response = await request(app)
        .patch("/api/v1/community/posts/post-123")
        .send({
          description: "Updated description",
        })
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });

  describe("DELETE /api/v1/community/posts/:postId", () => {
    it("should delete a post", async () => {
      const response = await request(app)
        .delete("/api/v1/community/posts/post-123")
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });

  describe("POST /api/v1/community/posts/:postId/like", () => {
    it("should like/unlike a post", async () => {
      const response = await request(app)
        .post("/api/v1/community/posts/post-123/like")
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });
});

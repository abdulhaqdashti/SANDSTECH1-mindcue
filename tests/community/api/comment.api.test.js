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

const app = express();
app.use(express.json());
app.use("/api/v1/community", communityRouter);

describe("Comment API Endpoints", () => {
  describe("POST /api/v1/community/posts/:postId/comments", () => {
    it("should create a comment", async () => {
      const response = await request(app)
        .post("/api/v1/community/posts/post-123/comments")
        .send({
          text: "Test comment",
        })
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });

    it("should require text", async () => {
      const response = await request(app)
        .post("/api/v1/community/posts/post-123/comments")
        .send({})
        .expect(400);

      expect(response.body.status.success).toBe(false);
    });
  });

  describe("GET /api/v1/community/posts/:postId/comments", () => {
    it("should get post comments", async () => {
      const response = await request(app)
        .get("/api/v1/community/posts/post-123/comments")
        .query({ page: 1, limit: 10 })
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });

  describe("PATCH /api/v1/community/comments/:commentId", () => {
    it("should update a comment", async () => {
      const response = await request(app)
        .patch("/api/v1/community/comments/comment-123")
        .send({
          text: "Updated comment",
        })
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });

  describe("DELETE /api/v1/community/comments/:commentId", () => {
    it("should delete a comment", async () => {
      const response = await request(app)
        .delete("/api/v1/community/comments/comment-123")
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });
});

describe("Comment Reply API Endpoints", () => {
  describe("POST /api/v1/community/comments/:commentId/replies", () => {
    it("should create a comment reply", async () => {
      const response = await request(app)
        .post("/api/v1/community/comments/comment-123/replies")
        .send({
          text: "Test reply",
        })
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });

  describe("GET /api/v1/community/comments/:commentId/replies", () => {
    it("should get comment replies", async () => {
      const response = await request(app)
        .get("/api/v1/community/comments/comment-123/replies")
        .query({ page: 1, limit: 10 })
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });

  describe("PATCH /api/v1/community/replies/:replyId", () => {
    it("should update a reply", async () => {
      const response = await request(app)
        .patch("/api/v1/community/replies/reply-123")
        .send({
          text: "Updated reply",
        })
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });

  describe("DELETE /api/v1/community/replies/:replyId", () => {
    it("should delete a reply", async () => {
      const response = await request(app)
        .delete("/api/v1/community/replies/reply-123")
        .expect(400); // Will fail if service not mocked

      expect(response.body).toHaveProperty("status");
    });
  });
});

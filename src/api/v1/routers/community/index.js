/** @format */

const express = require("express");
const verify_token = require("@v1_middlewares/verify_token.middleware");
const validate_request = require("@v1_middlewares/validate_request_joi.middleware");
const handle_multipart_data = require("@v1_middlewares/populate_multipart_data.middleware");
const upload_media = require("@api/v1/middlewares/upload_media.middleware");
const CommunitySchema = require("@v1_validations/community");
const CommunityController = require("@api/v1/controllers/community");

const validations = new CommunitySchema();
const controller = new CommunityController();

const router = express.Router();

// ========== COMMUNITY ROUTES ==========

// Create Community
router.post(
  "/",
  verify_token,
  handle_multipart_data([]),
  upload_media,
  validate_request(validations.create_community_schema),
  controller.create_community,
);

// Search Communities (must be before /:communityId)
router.get(
  "/search",
  verify_token,
  validate_request(validations.search_communities_schema),
  controller.search_communities,
);

// Get All Communities (Recommended, My, Joined)
router.get(
  "/",
  verify_token,
  validate_request(validations.get_all_communities_schema),
  controller.get_all_communities,
);

// Get Single Community
router.get(
  "/:communityId",
  verify_token,
  validate_request(validations.get_community_schema),
  controller.get_community,
);

// Update Community
router.patch(
  "/:communityId",
  verify_token,
  handle_multipart_data([]),
  upload_media,
  validate_request(validations.update_community_schema),
  controller.update_community,
);

// Delete Community
router.delete(
  "/:communityId",
  verify_token,
  validate_request(validations.delete_community_schema),
  controller.delete_community,
);

// Send Join Request (for Private Communities)
router.post(
  "/:communityId/send-request",
  verify_token,
  validate_request(validations.send_join_request_schema),
  controller.send_join_request,
);

// Join Community (for Public Communities - auto-approve)
router.post(
  "/:communityId/join",
  verify_token,
  validate_request(validations.join_community_schema),
  controller.join_community,
);

// Leave Community
router.post(
  "/:communityId/leave",
  verify_token,
  validate_request(validations.leave_community_schema),
  controller.leave_community,
);

// Report Community
router.post(
  "/:communityId/report",
  verify_token,
  // validate_request(validations.report_community_schema),
  controller.report_community,
);

// Get Join Requests (for my communities)
router.get(
  "/join-requests",
  verify_token,
  validate_request(validations.get_join_requests_schema),
  controller.get_join_requests,
);

// Accept/Reject Join Request
router.post(
  "/join-requests/:requestId",
  verify_token,
  validate_request(validations.handle_join_request_schema),
  controller.handle_join_request,
);

// ========== POST ROUTES ==========

// Create Post
router.post(
  "/:communityId/posts",
  verify_token,
  handle_multipart_data([]),
  upload_media,
  validate_request(validations.create_post_schema),
  controller.create_post,
);

// Get Community Posts
router.get(
  "/:communityId/posts",
  verify_token,
  validate_request(validations.get_community_posts_schema),
  controller.get_community_posts,
);

// Update Post
router.patch(
  "/posts/:postId",
  verify_token,
  handle_multipart_data([]),
  upload_media,
  validate_request(validations.update_post_schema),
  controller.update_post,
);

// Delete Post
router.delete(
  "/posts/:postId",
  verify_token,
  validate_request(validations.delete_post_schema),
  controller.delete_post,
);

// Like/Unlike Post
router.post(
  "/posts/:postId/like",
  verify_token,
  validate_request(validations.like_post_schema),
  controller.like_post,
);

// ========== COMMENT ROUTES ==========

// Create Comment
router.post(
  "/posts/:postId/comments",
  verify_token,
  validate_request(validations.create_comment_schema),
  controller.create_comment,
);

// Get Post Comments
router.get(
  "/posts/:postId/comments",
  verify_token,
  validate_request(validations.get_post_comments_schema),
  controller.get_post_comments,
);

// Update Comment
router.patch(
  "/comments/:commentId",
  verify_token,
  validate_request(validations.update_comment_schema),
  controller.update_comment,
);

// Delete Comment
router.delete(
  "/comments/:commentId",
  verify_token,
  validate_request(validations.delete_comment_schema),
  controller.delete_comment,
);

// ========== COMMENT REPLY ROUTES ==========

// Create Comment Reply
router.post(
  "/comments/:commentId/replies",
  verify_token,
  validate_request(validations.create_comment_reply_schema),
  controller.create_comment_reply,
);

// Get Comment Replies
router.get(
  "/comments/:commentId/replies",
  verify_token,
  validate_request(validations.get_comment_replies_schema),
  controller.get_comment_replies,
);

// Update Comment Reply
router.patch(
  "/replies/:replyId",
  verify_token,
  validate_request(validations.update_comment_reply_schema),
  controller.update_comment_reply,
);

// Delete Comment Reply
router.delete(
  "/replies/:replyId",
  verify_token,
  validate_request(validations.delete_comment_reply_schema),
  controller.delete_comment_reply,
);
router.get("/users/get", verify_token, controller.get_all_users);
router.post("/send-invite", verify_token, controller.invite_user);
router.get("/users/invite", verify_token, controller.get_user_invites);
router.post(
  "/send-private-join",
  verify_token,
  controller.send_community_request,
);
router.get(
  "/get-private-join/:communityId",
  verify_token,
  controller.get_community_requests,
);

module.exports = router;

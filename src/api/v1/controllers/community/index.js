/** @format */

const CommunityService = require("@api/v1/services/community");
const Responses = require("@constants/responses");

const service = new CommunityService();
const responses = new Responses();

class CommunityController {
  // Create Community
  create_community = async (req, res, next) => {
    try {
      const { user } = req.user;
      const {
        communityTitle,
        description,
        communityRules,
        privacy,
        communityImg,
      } = req.body;

      const data = await service.create_community({
        user_id: user.id,
        communityTitle,
        description,
        communityRules,
        privacy,
        communityImg: req.media?.communityImg?.[0]?.path || communityImg,
      });

      const response = responses.ok_response(
        data,
        "Community created successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get All Communities
  get_all_communities = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { type, page, limit } = req.query;

      const data = await service.get_all_communities({
        user_id: user.id,
        type,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });

      const response = responses.ok_response(
        data,
        "Communities fetched successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get Single Community
  get_community = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { communityId } = req.params;

      const data = await service.get_community({
        communityId,
        user_id: user.id,
      });

      const response = responses.ok_response(
        data,
        "Community fetched successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Update Community
  update_community = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { communityId } = req.params;
      const updateData = { ...req.body };

      if (req.media?.communityImg?.[0]?.path) {
        updateData.communityImg = req.media.communityImg[0].path;
      }

      const data = await service.update_community({
        communityId,
        user_id: user.id,
        data: updateData,
      });

      const response = responses.ok_response(
        data,
        "Community updated successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Delete Community
  delete_community = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { communityId } = req.params;

      const data = await service.delete_community({
        communityId,
        user_id: user.id,
      });

      const response = responses.ok_response(
        data,
        "Community deleted successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Send Join Request (for Private Communities)
  send_join_request = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { communityId } = req.params;

      const data = await service.send_join_request({
        communityId,
        user_id: user.id,
      });

      const response = responses.ok_response(
        data,
        data.message || "Join request sent successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Join Community (for Public Communities - auto-approve)
  join_community = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { communityId } = req.params;

      const data = await service.join_community({
        communityId,
        user_id: user.id,
      });

      const response = responses.ok_response(
        data,
        data.status === "APPROVED"
          ? "Joined community successfully"
          : "Join request sent successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Handle Join Request (Accept/Reject)
  handle_join_request = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { requestId } = req.params;
      const { action } = req.body;

      const data = await service.handle_join_request({
        requestId,
        user_id: user.id,
        action,
      });

      const response = responses.ok_response(
        data,
        action === "accept" ? "Join request accepted" : "Join request rejected",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get Join Requests
  get_join_requests = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { communityId, page, limit } = req.query;

      const data = await service.get_join_requests({
        user_id: user.id,
        communityId,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });

      const response = responses.ok_response(
        data,
        "Join requests fetched successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Leave Community
  leave_community = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { communityId } = req.params;

      const data = await service.leave_community({
        communityId,
        user_id: user.id,
      });

      const response = responses.ok_response(
        data,
        "Left community successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Report Community
  report_community = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { communityId } = req.params;
      const { reason } = req.body;

      if (!reason || (Array.isArray(reason) && reason.length === 0)) {
        return res
          .status(400)
          .json({ message: "Please provide at least one reason" });
      }

      const data = await service.report_community({
        communityId,
        user_id: user.id,
        reason,
      });

      const response = responses.ok_response(
        data,
        "Community reported successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Search Communities
  search_communities = async (req, res, next) => {
    try {
      const { search, page, limit } = req.query;

      const data = await service.search_communities({
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });

      const response = responses.ok_response(
        data,
        "Search results fetched successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // ========== POST CONTROLLERS ==========

  // Create Post
  create_post = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { communityId } = req.params;
      const { description, postImg } = req.body;

      const data = await service.create_post({
        communityId,
        user_id: user.id,
        description,
        postImg: req.media?.postImg?.[0]?.path || postImg,
      });

      const response = responses.ok_response(data, "Post created successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get Community Posts
  get_community_posts = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { communityId } = req.params;
      const { page, limit } = req.query;

      const data = await service.get_community_posts({
        communityId,
        user_id: user.id,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });

      const response = responses.ok_response(
        data,
        "Posts fetched successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Update Post
  update_post = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { postId } = req.params;
      const updateData = { ...req.body };

      if (req.media?.postImg?.[0]?.path) {
        updateData.postImg = req.media.postImg[0].path;
      }

      const data = await service.update_post({
        postId,
        user_id: user.id,
        data: updateData,
      });

      const response = responses.ok_response(data, "Post updated successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Delete Post
  delete_post = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { postId } = req.params;

      const data = await service.delete_post({
        postId,
        user_id: user.id,
      });

      const response = responses.ok_response(data, "Post deleted successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Like/Unlike Post
  like_post = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { postId } = req.params;

      const data = await service.like_post({
        postId,
        user_id: user.id,
      });

      const response = responses.ok_response(
        data,
        data.isLiked ? "Post liked" : "Post unliked",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // ========== COMMENT CONTROLLERS ==========

  // Create Comment
  create_comment = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { postId } = req.params;
      const { text } = req.body;

      const data = await service.create_comment({
        postId,
        user_id: user.id,
        text,
      });

      const response = responses.ok_response(
        data,
        "Comment added successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get Post Comments
  get_post_comments = async (req, res, next) => {
    try {
      const { postId } = req.params;
      const { page, limit } = req.query;

      const data = await service.get_post_comments({
        postId,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });

      const response = responses.ok_response(
        data,
        "Comments fetched successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Update Comment
  update_comment = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { commentId } = req.params;
      const { text } = req.body;

      const data = await service.update_comment({
        commentId,
        user_id: user.id,
        text,
      });

      const response = responses.ok_response(
        data,
        "Comment updated successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Delete Comment
  delete_comment = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { commentId } = req.params;

      const data = await service.delete_comment({
        commentId,
        user_id: user.id,
      });

      const response = responses.ok_response(
        data,
        "Comment deleted successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // ========== COMMENT REPLY CONTROLLERS ==========

  // Create Comment Reply
  create_comment_reply = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { commentId } = req.params;
      const { text } = req.body;

      const data = await service.create_comment_reply({
        commentId,
        user_id: user.id,
        text,
      });

      const response = responses.ok_response(data, "Reply added successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get Comment Replies
  get_comment_replies = async (req, res, next) => {
    try {
      const { commentId } = req.params;
      const { page, limit } = req.query;

      const data = await service.get_comment_replies({
        commentId,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });

      const response = responses.ok_response(
        data,
        "Replies fetched successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Update Comment Reply
  update_comment_reply = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { replyId } = req.params;
      const { text } = req.body;

      const data = await service.update_comment_reply({
        replyId,
        user_id: user.id,
        text,
      });

      const response = responses.ok_response(
        data,
        "Reply updated successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Delete Comment Reply
  delete_comment_reply = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { replyId } = req.params;

      const data = await service.delete_comment_reply({
        replyId,
        user_id: user.id,
      });

      const response = responses.ok_response(
        data,
        "Reply deleted successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };
  get_all_users = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { communityId, search } = req.query;

      const data = await service.get_all_users({
        user_id: user.id,
        communityId,
        search,
      });

      const response = responses.ok_response(
        data,
        "Users fetched successfully",
      );

      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  invite_user = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { invitedUserId, communityId } = req.body;

      if (!invitedUserId || !communityId) {
        return res.status(400).json({
          status: { code: 400, success: false },
          message: "invitedUserId and communityId are required",
          data: null,
        });
      }

      const data = await service.invite_user({
        communityId,
        user_id: user.id,
        invitedUserId,
      });

      const response = responses.ok_response(data, data.message);
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };
  get_user_invites = async (req, res, next) => {
    try {
      const { user } = req.user; // logged-in user
      const data = await service.get_user_invites({ user_id: user.id });

      const response = responses.ok_response(
        data,
        "Pending invites fetched successfully",
      );

      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Send Join Request to Community Owner
  // Toggle request API
  send_community_request = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { communityId } = req.body;

      const data = await service.send_community_request({
        communityId,
        user_id: user.id,
      });

      const response = responses.ok_response(data, data.message);
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get pending requests API
  get_community_requests = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { communityId } = req.params;

      const data = await service.get_community_requests({
        communityId,
        user_id: user.id,
      });

      const response = responses.ok_response(
        data,
        "Join requests fetched successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = CommunityController;

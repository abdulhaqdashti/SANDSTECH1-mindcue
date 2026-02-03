/** @format */

const Joi = require("joi");

class CommunitySchema {
  // Create Community
  create_community_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      communityTitle: Joi.string().required(),
      description: Joi.string().required(),
      communityRules: Joi.alternatives()
        .try(Joi.string(), Joi.array().items(Joi.string()).min(1))
        .required(),
      privacy: Joi.string().valid("PUBLIC", "PRIVATE").required(),
      communityImg: Joi.string().optional(),
    }),
  });

  // Get All Communities (Recommended, My, Joined)
  get_all_communities_schema = Joi.object({
    query: Joi.object({
      type: Joi.string().valid("recommended", "my", "joined").optional(),
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
    }).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Get Single Community Details
  get_community_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({
      communityId: Joi.string().required(),
    }),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Update Community
  update_community_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      communityId: Joi.string().required(),
    }),
    body: Joi.object({
      communityTitle: Joi.string().optional(),
      description: Joi.string().optional(),
      communityRules: Joi.alternatives()
        .try(Joi.string(), Joi.array().items(Joi.string()).min(1))
        .optional(),
      privacy: Joi.string().valid("PUBLIC", "PRIVATE").optional(),
      communityImg: Joi.string().optional(),
    }),
  });

  // Delete Community
  delete_community_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      communityId: Joi.string().required(),
    }),
    body: Joi.object({}),
  });

  // Send Join Request (for Private Communities)
  send_join_request_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      communityId: Joi.string().required(),
    }),
    body: Joi.object({}),
  });

  // Join Community Request (for Public Communities)
  join_community_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      communityId: Joi.string().required(),
    }),
    body: Joi.object({}),
  });

  // Accept/Reject Join Request
  handle_join_request_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      requestId: Joi.string().required(),
    }),
    body: Joi.object({
      action: Joi.string().valid("accept", "reject").required(),
    }),
  });

  // Get Join Requests for My Community
  get_join_requests_schema = Joi.object({
    query: Joi.object({
      communityId: Joi.string().optional(),
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
    }).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Leave Community
  leave_community_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      communityId: Joi.string().required(),
    }),
    body: Joi.object({}),
  });

  // Report Community
  report_community_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      communityId: Joi.string().required(),
    }),
    body: Joi.object({
      reason: Joi.string().optional(),
    }),
  });

  // Search Communities
  search_communities_schema = Joi.object({
    query: Joi.object({
      search: Joi.string().required(),
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
    }).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Create Post
  create_post_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      communityId: Joi.string().required(),
    }),
    body: Joi.object({
      description: Joi.string().max(10000).optional().allow("", null),
      postImg: Joi.string().optional().allow("", null),
      isImageEdit: Joi.boolean().optional(),
    }),
  });

  // Get Community Posts
  get_community_posts_schema = Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
    }).unknown(true),
    params: Joi.object({
      communityId: Joi.string().required(),
    }),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Get Single Post
  get_single_post_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({
      postId: Joi.string().required(),
    }),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Update Post
  update_post_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      postId: Joi.string().required(),
    }),
    body: Joi.object({
      description: Joi.string().optional(),
      postImg: Joi.string().optional(),
      isImageEdit: Joi.boolean().optional(),
    }),
  });

  // Delete Post
  delete_post_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      postId: Joi.string().required(),
    }),
    body: Joi.object({}),
  });

  // Report Post
  report_post_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({
      postId: Joi.string().required(),
    }),
    body: Joi.object({
      reason: Joi.alternatives()
        .try(Joi.string(), Joi.array().items(Joi.string()))
        .optional()
        .default(""),
    }),
  });

  // Like/Unlike Post
  like_post_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      postId: Joi.string().required(),
    }),
    body: Joi.object({}),
  });

  // Create Comment
  create_comment_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      postId: Joi.string().required(),
    }),
    body: Joi.object({
      text: Joi.string().required(),
    }),
  });

  // Get Post Comments
  get_post_comments_schema = Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
    }).unknown(true),
    params: Joi.object({
      postId: Joi.string().required(),
    }),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Update Comment
  update_comment_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      commentId: Joi.string().required(),
    }),
    body: Joi.object({
      text: Joi.string().required(),
    }),
  });

  // Delete Comment
  delete_comment_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      commentId: Joi.string().required(),
    }),
    body: Joi.object({}),
  });

  // Delete Comment or Reply (unified – id = commentId or replyId)
  delete_comment_or_reply_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({
      id: Joi.string().required(),
    }),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Create Comment Reply
  create_comment_reply_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      commentId: Joi.string().required(),
    }),
    body: Joi.object({
      text: Joi.string().required(),
    }),
  });

  // Get Comment Replies
  get_comment_replies_schema = Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
    }).unknown(true),
    params: Joi.object({
      commentId: Joi.string().required(),
    }),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Update Comment Reply
  update_comment_reply_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      replyId: Joi.string().required(),
    }),
    body: Joi.object({
      text: Joi.string().required(),
    }),
  });

  // Delete Comment Reply (kept for backward compatibility; prefer delete_comment_or_reply)
  delete_comment_reply_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      replyId: Joi.string().required(),
    }),
    body: Joi.object({}),
  });
}

module.exports = CommunitySchema;

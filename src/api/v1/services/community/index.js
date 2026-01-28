/** @format */

const { prisma } = require("@configs/prisma");
const Responses = require("@constants/responses");

const responses = new Responses();

class CommunityService {
  // Create Community
  create_community = async ({
    user_id,
    communityTitle,
    description,
    communityRules,
    privacy,
    communityImg,
  }) => {
    // Convert rules to array if string, then to JSON string
    let rulesArray = communityRules;
    if (typeof communityRules === "string") {
      rulesArray = [communityRules];
    }
    const rulesJson = JSON.stringify(rulesArray);

    const community = await prisma.community.create({
      data: {
        user_id,
        communityTitle,
        description,
        communityRules: rulesJson,
        privacy,
        communityImg,
        membersCount: 1, // Creator is first member
        isApproved: true, // Auto-approve for now
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: {
                full_name: true,
                profile_picture: true,
              },
            },
          },
        },
      },
    });

    // Auto-add creator as approved member
    await prisma.communityMember.create({
      data: {
        community_id: community.id,
        user_id,
        status: "APPROVED",
        isApplied: false,
      },
    });

    // Parse rules back to array for response
    return {
      ...community,
      communityRules: JSON.parse(community.communityRules),
    };
  };

  // Get All Communities (Recommended, My, Joined)
  // get_all_communities = async ({ user_id, type, page = 1, limit = 10 }) => {
  //   const skip = (page - 1) * limit;

  //   let where = {};
  //   let include = {
  //     user: {
  //       select: {
  //         id: true,
  //         email: true,
  //         user_details: {
  //           select: {
  //             full_name: true,
  //             profile_picture: true,
  //           },
  //         },
  //       },
  //     },
  //     _count: {
  //       select: {
  //         members: true,
  //         posts: true,
  //       },
  //     },
  //   };

  //   if (type === "my") {
  //     // My communities (created by me)
  //     where.user_id = user_id;
  //   } else if (type === "joined") {
  //     where.members = {
  //       some: {
  //         user_id,
  //         status: "APPROVED",
  //       },
  //     };

  //     where.user_id = {
  //       not: user_id, // ❗ exclude my created communities
  //     };
  //   } else {
  //     // Recommended communities (public + private, not joined, not mine)
  //     where.members = {
  //       none: {
  //         user_id,
  //       },
  //     };

  //     where.user_id = {
  //       not: user_id, // Exclude my own communities
  //     };
  //   }

  //   const [communities, total] = await Promise.all([
  //     prisma.community.findMany({
  //       where,
  //       include,
  //       skip,
  //       take: limit,
  //       orderBy: {
  //         createdAt: "desc",
  //       },
  //     }),
  //     prisma.community.count({ where }),
  //   ]);

  //   // Parse rules for each community
  //   const parsedCommunities = communities.map((community) => ({
  //     ...community,
  //     communityRules: JSON.parse(community.communityRules || "[]"),
  //     membersCount: community._count.members || 0,
  //     postsCount: community._count.posts || 0,
  //   }));

  //   return {
  //     communities: parsedCommunities,
  //     pagination: {
  //       page,
  //       limit,
  //       total,
  //       totalPages: Math.ceil(total / limit),
  //     },
  //   };
  // };

  get_all_communities = async ({ user_id, type, page = 1, limit = 10 }) => {
    const skip = (page - 1) * limit;

    let where = {};
    let include = {
      user: {
        select: {
          id: true,
          email: true,
          user_details: {
            select: {
              full_name: true,
              profile_picture: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    };

    if (type === "my") {
      // My communities (created by me)
      where.user_id = user_id;
    } else if (type === "joined") {
      // Communities where user is already approved
      where.members = {
        some: {
          user_id,
          status: "APPROVED",
        },
      };
      where.user_id = {
        not: user_id, // exclude my own communities
      };
    } else {
      // Recommended communities (exclude only APPROVED members)
      where.members = {
        none: {
          user_id,
          status: "APPROVED", // ❗ ignore pending requests
        },
      };
      where.user_id = {
        not: user_id, // exclude my own communities
      };
    }

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc", // Assuming your schema still has createdAt
        },
      }),
      prisma.community.count({ where }),
    ]);

    // Parse rules for each community
    const parsedCommunities = communities.map((community) => ({
      ...community,
      communityRules: JSON.parse(community.communityRules || "[]"),
      membersCount: community._count.members || 0,
      postsCount: community._count.posts || 0,
    }));

    return {
      communities: parsedCommunities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  // Get Single Community Details
  get_community = async ({ communityId, user_id }) => {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: {
                full_name: true,
                profile_picture: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
    });

    if (!community) {
      throw responses.not_found_response("Community not found");
    }

    // Check if user is member
    let isMember = false;
    let memberStatus = null;
    if (user_id) {
      const member = await prisma.communityMember.findUnique({
        where: {
          community_id_user_id: {
            community_id: communityId,
            user_id,
          },
        },
      });
      isMember = member?.status === "APPROVED";
      memberStatus = member?.status || null;
    }

    return {
      ...community,
      communityRules: JSON.parse(community.communityRules || "[]"),
      membersCount: community._count.members || 0,
      postsCount: community._count.posts || 0,
      isMember,
      memberStatus,
      isOwner: community.user_id === user_id,
    };
  };

  // Update Community
  update_community = async ({ communityId, user_id, data }) => {
    // Check if user is owner
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw responses.not_found_response("Community not found");
    }

    if (community.user_id !== user_id) {
      throw responses.forbidden_response("Only community owner can update");
    }

    // Convert rules to array if string, then to JSON string
    if (data.communityRules) {
      let rulesArray = data.communityRules;
      if (typeof data.communityRules === "string") {
        rulesArray = [data.communityRules];
      }
      data.communityRules = JSON.stringify(rulesArray);
    }

    const updated = await prisma.community.update({
      where: { id: communityId },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: {
                full_name: true,
                profile_picture: true,
              },
            },
          },
        },
      },
    });

    return {
      ...updated,
      communityRules: JSON.parse(updated.communityRules || "[]"),
    };
  };

  // Delete Community
  delete_community = async ({ communityId, user_id }) => {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw responses.not_found_response("Community not found");
    }

    if (community.user_id !== user_id) {
      throw responses.forbidden_response("Only community owner can delete");
    }

    // Delete all related records in correct order (using transaction)
    await prisma.$transaction(async (tx) => {
      // 1. Get all posts in this community
      const posts = await tx.communityPost.findMany({
        where: { community_id: communityId },
        select: { id: true },
      });

      const postIds = posts.map((post) => post.id);

      if (postIds.length > 0) {
        // 2. Delete comment replies (depends on PostComment)
        const comments = await tx.postComment.findMany({
          where: { community_post_id: { in: postIds } },
          select: { id: true },
        });

        const commentIds = comments.map((comment) => comment.id);

        if (commentIds.length > 0) {
          await tx.commentReply.deleteMany({
            where: { post_comment_id: { in: commentIds } },
          });
        }

        // 3. Delete post comments (depends on CommunityPost)
        await tx.postComment.deleteMany({
          where: { community_post_id: { in: postIds } },
        });

        // 4. Delete post likes (depends on CommunityPost)
        await tx.postLike.deleteMany({
          where: { community_post_id: { in: postIds } },
        });
      }

      // 5. Delete community posts (depends on Community)
      await tx.communityPost.deleteMany({
        where: { community_id: communityId },
      });

      // 6. Delete community members (depends on Community)
      await tx.communityMember.deleteMany({
        where: { community_id: communityId },
      });

      // 7. Delete community invites (depends on Community)
      await tx.communityInvite.deleteMany({
        where: { community_id: communityId },
      });

      // 8. Finally, delete the community
      await tx.community.delete({
        where: { id: communityId },
      });
    });

    return { message: "Community deleted successfully" };
  };

  // Send Join Request (for Private Communities)
  send_join_request = async ({ communityId, user_id }) => {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw responses.not_found_response("Community not found");
    }

    // Only allow requests for private communities
    if (community.privacy !== "PRIVATE") {
      throw responses.bad_request_response(
        "Join requests can only be sent for private communities. Use join endpoint for public communities.",
      );
    }

    // Check if already a member
    const existingMember = await prisma.communityMember.findUnique({
      where: {
        community_id_user_id: {
          community_id: communityId,
          user_id,
        },
      },
    });

    if (existingMember) {
      if (existingMember.status === "APPROVED") {
        throw responses.bad_request_response(
          "Already a member of this community",
        );
      }
      if (existingMember.status === "PENDING") {
        throw responses.bad_request_response("Join request already pending");
      }
    }

    // Create join request (PENDING status for private communities)
    const member = await prisma.communityMember.create({
      data: {
        community_id: communityId,
        user_id,
        status: "PENDING",
        isApplied: true,
      },
    });

    return {
      request_id: member.id,
      community_id: communityId,
      user_id,
      status: "PENDING",
      message: "Join request sent successfully. Waiting for owner approval.",
    };
  };

  // Join Community Request (for Public Communities - auto-approve)
  join_community = async ({ communityId, user_id }) => {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw responses.not_found_response("Community not found");
    }

    // Check if already a member
    const existingMember = await prisma.communityMember.findUnique({
      where: {
        community_id_user_id: {
          community_id: communityId,
          user_id,
        },
      },
    });

    if (existingMember) {
      if (existingMember.status === "APPROVED") {
        throw responses.bad_request_response(
          "Already a member of this community",
        );
      }
      if (existingMember.status === "PENDING") {
        throw responses.bad_request_response("Join request already pending");
      }
    }

    // Create join request
    const member = await prisma.communityMember.create({
      data: {
        community_id: communityId,
        user_id,
        status: community.privacy === "PUBLIC" ? "APPROVED" : "PENDING",
        isApplied: true,
      },
    });

    // If public, auto-approve and increment member count
    if (community.privacy === "PUBLIC") {
      await prisma.community.update({
        where: { id: communityId },
        data: {
          membersCount: {
            increment: 1,
          },
        },
      });
    }

    return member;
  };

  // Accept/Reject Join Request
  handle_join_request = async ({ requestId, user_id, action }) => {
    const request = await prisma.communityMember.findUnique({
      where: { id: requestId },
      include: {
        community: true,
      },
    });

    if (!request) {
      throw responses.not_found_response("Join request not found");
    }

    // Check if user is community owner
    if (request.community.user_id !== user_id) {
      throw responses.forbidden_response(
        "Only community owner can handle join requests",
      );
    }

    if (request.status !== "PENDING") {
      throw responses.bad_request_response("Request already processed");
    }

    const status = action === "accept" ? "APPROVED" : "DECLINED";

    const updated = await prisma.communityMember.update({
      where: { id: requestId },
      data: { status },
    });

    // If accepted, increment member count
    if (action === "accept") {
      await prisma.community.update({
        where: { id: request.community_id },
        data: {
          membersCount: {
            increment: 1,
          },
        },
      });
    }

    return updated;
  };

  // Get Join Requests for My Community
  get_join_requests = async ({
    user_id,
    communityId,
    page = 1,
    limit = 10,
  }) => {
    const skip = (page - 1) * limit;

    let where = {
      status: "PENDING",
      community: {
        user_id, // Only communities owned by user
      },
    };

    if (communityId) {
      where.community_id = communityId;
    }

    const [requests, total] = await Promise.all([
      prisma.communityMember.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              user_details: {
                select: {
                  full_name: true,
                  profile_picture: true,
                },
              },
            },
          },
          community: {
            select: {
              id: true,
              communityTitle: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.communityMember.count({ where }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  // Leave Community
  leave_community = async ({ communityId, user_id }) => {
    const member = await prisma.communityMember.findUnique({
      where: {
        community_id_user_id: {
          community_id: communityId,
          user_id,
        },
      },
      include: {
        community: true,
      },
    });

    if (!member) {
      throw responses.not_found_response(
        "You are not a member of this community",
      );
    }

    if (member.community.user_id === user_id) {
      throw responses.bad_request_response(
        "Community owner cannot leave. Delete community instead.",
      );
    }

    await prisma.communityMember.delete({
      where: {
        community_id_user_id: {
          community_id: communityId,
          user_id,
        },
      },
    });

    // Decrement member count if was approved
    if (member.status === "APPROVED") {
      await prisma.community.update({
        where: { id: communityId },
        data: {
          membersCount: {
            decrement: 1,
          },
        },
      });
    }

    return { message: "Left community successfully" };
  };

  // Report Community
  report_community = async ({ communityId, user_id, reason }) => {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw responses.not_found_response("Community not found");
    }

    // Single reason ya array handle karna
    const reasonsArray = Array.isArray(reason) ? reason : [reason];

    // Database me insert
    const report = await prisma.report.create({
      data: {
        communityId,
        userId: user_id,
        reasons: JSON.stringify(reasonsArray), // Array ko JSON string me save karenge
      },
    });

    return {
      message: "Community reported successfully",
      report,
    };
  };

  // Search Communities
  search_communities = async ({ search, page = 1, limit = 10 }) => {
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { communityTitle: { contains: search } },
        { description: { contains: search } },
      ],
    };

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              user_details: {
                select: {
                  full_name: true,
                  profile_picture: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              posts: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.community.count({ where }),
    ]);

    const parsedCommunities = communities.map((community) => ({
      ...community,
      communityRules: JSON.parse(community.communityRules || "[]"),
      membersCount: community._count.members || 0,
      postsCount: community._count.posts || 0,
    }));

    return {
      communities: parsedCommunities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  // ========== POST METHODS ==========

  // Create Post
  create_post = async ({ communityId, user_id, description, postImg }) => {
    // Check if user is member
    const member = await prisma.communityMember.findUnique({
      where: {
        community_id_user_id: {
          community_id: communityId,
          user_id,
        },
      },
    });

    if (!member || member.status !== "APPROVED") {
      throw responses.forbidden_response("You must be a member to post");
    }

    const post = await prisma.communityPost.create({
      data: {
        community_id: communityId,
        user_id,
        description,
        postImg,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: {
                full_name: true,
                profile_picture: true,
              },
            },
          },
        },
        _count: {
          select: {
            post_like: true,
            post_comment: true,
          },
        },
      },
    });

    return {
      ...post,
      likesCount: post._count.post_like || 0,
      commentsCount: post._count.post_comment || 0,
    };
  };

  // Get Community Posts
  get_community_posts = async ({
    communityId,
    user_id,
    page = 1,
    limit = 10,
  }) => {
    const skip = (page - 1) * limit;

    // Check if user is member
    const member = await prisma.communityMember.findUnique({
      where: {
        community_id_user_id: {
          community_id: communityId,
          user_id,
        },
      },
    });

    if (!member || member.status !== "APPROVED") {
      throw responses.forbidden_response("You must be a member to view posts");
    }

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where: { community_id: communityId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              user_details: {
                select: {
                  full_name: true,
                  profile_picture: true,
                },
              },
            },
          },
          _count: {
            select: {
              post_like: true,
              post_comment: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.communityPost.count({
        where: { community_id: communityId },
      }),
    ]);

    // Check which posts user has liked
    const postIds = posts.map((p) => p.id);
    const userLikes = await prisma.postLike.findMany({
      where: {
        community_post_id: { in: postIds },
        user_id,
      },
      select: {
        community_post_id: true,
      },
    });

    const likedPostIds = new Set(userLikes.map((l) => l.community_post_id));

    const postsWithLikes = posts.map((post) => ({
      ...post,
      likesCount: post._count.post_like || 0,
      commentsCount: post._count.post_comment || 0,
      isLiked: likedPostIds.has(post.id),
    }));

    return {
      posts: postsWithLikes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  // Update Post
  update_post = async ({ postId, user_id, data }) => {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw responses.not_found_response("Post not found");
    }

    if (post.user_id !== user_id) {
      throw responses.forbidden_response("Only post author can update");
    }

    const updated = await prisma.communityPost.update({
      where: { id: postId },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: {
                full_name: true,
                profile_picture: true,
              },
            },
          },
        },
        _count: {
          select: {
            post_like: true,
            post_comment: true,
          },
        },
      },
    });

    return {
      ...updated,
      likesCount: updated._count.post_like || 0,
      commentsCount: updated._count.post_comment || 0,
    };
  };

  // Delete Post
  delete_post = async ({ postId, user_id }) => {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw responses.not_found_response("Post not found");
    }

    if (post.user_id !== user_id) {
      throw responses.forbidden_response("Only post author can delete");
    }

    await prisma.communityPost.delete({
      where: { id: postId },
    });

    return { message: "Post deleted successfully" };
  };

  // Like/Unlike Post
  like_post = async ({ postId, user_id }) => {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw responses.not_found_response("Post not found");
    }

    // Check if already liked
    const existingLike = await prisma.postLike.findFirst({
      where: {
        community_post_id: postId,
        user_id,
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: { id: existingLike.id },
      });
      return { isLiked: false, message: "Post unliked" };
    } else {
      // Like
      await prisma.postLike.create({
        data: {
          community_post_id: postId,
          user_id,
        },
      });
      return { isLiked: true, message: "Post liked" };
    }
  };

  // ========== COMMENT METHODS ==========

  // Create Comment
  create_comment = async ({ postId, user_id, text }) => {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw responses.not_found_response("Post not found");
    }

    const comment = await prisma.postComment.create({
      data: {
        community_post_id: postId,
        user_id,
        text,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: {
                full_name: true,
                profile_picture: true,
              },
            },
          },
        },
        _count: {
          select: {
            comment_reply: true,
          },
        },
      },
    });

    return {
      ...comment,
      repliesCount: comment._count.comment_reply || 0,
    };
  };

  // Get Post Comments
  get_post_comments = async ({ postId, page = 1, limit = 10 }) => {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.postComment.findMany({
        where: { community_post_id: postId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              user_details: {
                select: {
                  full_name: true,
                  profile_picture: true,
                },
              },
            },
          },
          _count: {
            select: {
              comment_reply: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.postComment.count({
        where: { community_post_id: postId },
      }),
    ]);

    const commentsWithCounts = comments.map((comment) => ({
      ...comment,
      repliesCount: comment._count.comment_reply || 0,
    }));

    return {
      comments: commentsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  // Update Comment
  update_comment = async ({ commentId, user_id, text }) => {
    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw responses.not_found_response("Comment not found");
    }

    if (comment.user_id !== user_id) {
      throw responses.forbidden_response("Only comment author can update");
    }

    const updated = await prisma.postComment.update({
      where: { id: commentId },
      data: { text },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: {
                full_name: true,
                profile_picture: true,
              },
            },
          },
        },
        _count: {
          select: {
            comment_reply: true,
          },
        },
      },
    });

    return {
      ...updated,
      repliesCount: updated._count.comment_reply || 0,
    };
  };

  // Delete Comment
  delete_comment = async ({ commentId, user_id }) => {
    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw responses.not_found_response("Comment not found");
    }

    if (comment.user_id !== user_id) {
      throw responses.forbidden_response("Only comment author can delete");
    }

    await prisma.postComment.delete({
      where: { id: commentId },
    });

    return { message: "Comment deleted successfully" };
  };

  // ========== COMMENT REPLY METHODS ==========

  // Create Comment Reply
  create_comment_reply = async ({ commentId, user_id, text }) => {
    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw responses.not_found_response("Comment not found");
    }

    const reply = await prisma.commentReply.create({
      data: {
        post_comment_id: commentId,
        user_id,
        text,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: {
                full_name: true,
                profile_picture: true,
              },
            },
          },
        },
      },
    });

    return reply;
  };

  // Get Comment Replies
  get_comment_replies = async ({ commentId, page = 1, limit = 10 }) => {
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      prisma.commentReply.findMany({
        where: { post_comment_id: commentId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              user_details: {
                select: {
                  full_name: true,
                  profile_picture: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.commentReply.count({
        where: { post_comment_id: commentId },
      }),
    ]);

    return {
      replies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  // Update Comment Reply
  update_comment_reply = async ({ replyId, user_id, text }) => {
    const reply = await prisma.commentReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw responses.not_found_response("Reply not found");
    }

    if (reply.user_id !== user_id) {
      throw responses.forbidden_response("Only reply author can update");
    }

    const updated = await prisma.commentReply.update({
      where: { id: replyId },
      data: { text },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: {
                full_name: true,
                profile_picture: true,
              },
            },
          },
        },
      },
    });

    return updated;
  };

  // Delete Comment Reply
  delete_comment_reply = async ({ replyId, user_id }) => {
    const reply = await prisma.commentReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw responses.not_found_response("Reply not found");
    }

    if (reply.user_id !== user_id) {
      throw responses.forbidden_response("Only reply author can delete");
    }

    await prisma.commentReply.delete({
      where: { id: replyId },
    });

    return { message: "Reply deleted successfully" };
  };
  get_all_users = async ({ user_id, search, communityId }) => {
    if (!communityId) {
      throw responses.bad_request_response("communityId is required");
    }

    const where = {
      id: { not: user_id },
      is_blocked: false,
      is_approved: true,
    };

    if (search && search.trim() !== "") {
      where.OR = [
        { email: { contains: search } },
        { user_details: { full_name: { contains: search } } },
      ];
    }

    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        email: true,
        user_details: {
          select: {
            full_name: true,
            profile_picture: true,
          },
        },
        // Check if this user is already invited to this community
        communityMembers: {
          where: { community_id: communityId },
          select: { id: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Map users with isInvited flag
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      user_details: u.user_details,
      isInvited: u.communityMembers.length > 0, // true if already invited
    }));
  };

  invite_user = async ({ communityId, user_id, invitedUserId }) => {
    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });
    if (!community) {
      throw responses.not_found_response("Community not found");
    }

    // Only owner can invite
    if (community.user_id !== user_id) {
      throw responses.unauthorized_response("You are not the owner");
    }

    // Check if invite already exists
    const existingInvite = await prisma.communityMember.findUnique({
      where: {
        community_id_user_id: {
          community_id: communityId,
          user_id: invitedUserId,
        },
      },
    });

    if (existingInvite) {
      // If exists, cancel the invite
      await prisma.communityMember.delete({
        where: {
          community_id_user_id: {
            community_id: communityId,
            user_id: invitedUserId,
          },
        },
      });
      return { isInvited: false, message: "Invite cancelled successfully" };
    }

    // Otherwise create invite
    const invite = await prisma.communityMember.create({
      data: {
        community_id: communityId,
        user_id: invitedUserId,
        status: "PENDING",
        isApplied: true,
      },
    });

    return { isInvited: true, message: "User invited successfully", invite };
  };
  get_user_invites = async ({ user_id }) => {
    // Get all pending invites for logged-in user
    const invites = await prisma.communityMember.findMany({
      where: {
        user_id, // jo user login hai
        status: "PENDING",
      },
      include: {
        community: {
          select: {
            id: true,
            communityTitle: true,
            user: {
              // owner info
              select: {
                id: true,
                email: true,

                user_details: {
                  select: { full_name: true, profile_picture: true },
                },
              },
            },
          },
        },
      },
      orderBy: { id: "desc" }, // createdAt ignore, order by id
    });

    return invites.map((invite) => ({
      inviteId: invite.id,
      communityId: invite.community_id,
      communityTitle: invite.community.communityTitle,
      owner: invite.community.user
        ? {
            id: invite.community.user.id,
            full_name: invite.community.user.user_details?.full_name || "",
            email: invite.community.user.email || "",
            profileImg: invite.community.user.user_details.profile_picture,
          }
        : null,
      status: invite.status,
      isApplied: invite.isApplied,
    }));
  };

  send_community_request = async ({ communityId, user_id }) => {
    // 1. Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw responses.not_found_response("Community not found");
    }

    // 2. Check if user already requested or member
    const existing = await prisma.communityMember.findFirst({
      where: {
        community_id: communityId,
        user_id,
      },
    });

    if (existing) {
      if (existing.status === "PENDING") {
        // If pending, cancel the request
        await prisma.communityMember.delete({
          where: { id: existing.id },
        });
        return {
          message: "Join request cancelled",
          status: "CANCELLED",
        };
      } else if (existing.status === "APPROVED") {
        // Already a member
        throw responses.bad_request_response(
          "Already a member of this community",
        );
      }
    }

    // 3. Create PENDING request
    const request = await prisma.communityMember.create({
      data: {
        community_id: communityId,
        user_id,
        status: "PENDING",
        isApplied: true,
      },
    });

    return {
      requestId: request.id,
      status: request.status,
      message: "Join request sent to community owner",
    };
  };

  get_community_requests = async ({ communityId, user_id }) => {
    // 1. Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw responses.not_found_response("Community not found");
    }

    // 2. Only owner can see requests
    if (community.user_id !== user_id) {
      throw responses.forbidden_response("Only owner can view requests");
    }

    // 3. Fetch pending requests
    const requests = await prisma.communityMember.findMany({
      where: {
        community_id: communityId,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: {
                full_name: true,
                profile_picture: true,
              },
            },
          },
        },
      },
    });

    return requests;
  };
}

module.exports = CommunityService;

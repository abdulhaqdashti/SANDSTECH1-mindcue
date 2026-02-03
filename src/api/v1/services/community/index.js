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
      where.members = {
        some: {
          user_id,
          status: "APPROVED",
        },
      };

      where.user_id = {
        not: user_id, // ❗ exclude my created communities
      };
    } else {
      // Recommended communities (public + private, not joined, not mine)
      where.members = {
        none: {
          user_id,
        },
      };

      where.user_id = {
        not: user_id, // Exclude my own communities
      };
    }

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
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
      isOwner: community.user_id === user_id,
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

  // get_all_communities = async ({ communityId, user_id }) => {
  //   const community = await prisma.community.findUnique({
  //     where: { id: communityId },
  //     include: {
  //       user: {
  //         select: {
  //           id: true,
  //           email: true,
  //           user_details: {
  //             select: {
  //               full_name: true,
  //               profile_picture: true,
  //             },
  //           },
  //         },
  //       },
  //       _count: {
  //         select: {
  //           members: true,
  //           posts: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!community) {
  //     throw responses.not_found_response("Community not found");
  //   }

  //   // Check if user is member / invited
  //   let isMember = false;
  //   let memberStatus = null;
  //   let isInvited = false;

  //   if (user_id) {
  //     const member = await prisma.communityMember.findUnique({
  //       where: {
  //         community_id_user_id: {
  //           community_id: communityId,
  //           user_id,
  //         },
  //       },
  //     });

  //     isMember = member?.status === "APPROVED";
  //     memberStatus = member?.status || null;
  //     isInvited = member?.isInvited || false;
  //   }

  //   return {
  //     ...community,
  //     communityRules: JSON.parse(community.communityRules || "[]"),
  //     membersCount: community._count.members || 0,
  //     postsCount: community._count.posts || 0,
  //     isMember,
  //     memberStatus,
  //     isOwner: community.user_id === user_id,
  //     isInvited, // ✅ ye field add ki
  //   };
  // };

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
  //     // Communities where user is already approved
  //     where.members = {
  //       some: {
  //         user_id,
  //         status: "APPROVED",
  //       },
  //     };
  //     where.user_id = {
  //       not: user_id, // exclude my own communities
  //     };
  //   } else {
  //     // Recommended communities (exclude only APPROVED members)
  //     where.members = {
  //       none: {
  //         user_id,
  //         status: "APPROVED", // ❗ ignore pending requests
  //       },
  //     };
  //     where.user_id = {
  //       not: user_id, // exclude my own communities
  //     };
  //   }

  //   const [communities, total] = await Promise.all([
  //     prisma.community.findMany({
  //       where,
  //       include,
  //       skip,
  //       take: limit,
  //       orderBy: {
  //         createdAt: "desc", // Assuming your schema still has createdAt
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

  // Get Single Community Details
  // get_community = async ({ communityId, user_id }) => {
  //   const community = await prisma.community.findUnique({
  //     where: { id: communityId },
  //     include: {
  //       user: {
  //         select: {
  //           id: true,
  //           email: true,
  //           user_details: {
  //             select: {
  //               full_name: true,
  //               profile_picture: true,
  //             },
  //           },
  //         },
  //       },
  //       _count: {
  //         select: {
  //           members: true,
  //           posts: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!community) {
  //     throw responses.not_found_response("Community not found");
  //   }

  //   // Check if user is member
  //   let isMember = false;
  //   let memberStatus = null;
  //   if (user_id) {
  //     const member = await prisma.communityMember.findUnique({
  //       where: {
  //         community_id_user_id: {
  //           community_id: communityId,
  //           user_id,
  //         },
  //       },
  //     });
  //     isMember = member?.status === "APPROVED";
  //     memberStatus = member?.status || null;
  //   }

  //   return {
  //     ...community,
  //     communityRules: JSON.parse(community.communityRules || "[]"),
  //     membersCount: community._count.members || 0,
  //     postsCount: community._count.posts || 0,
  //     isMember,
  //     memberStatus,
  //     isOwner: community.user_id === user_id,
  //   };
  // };

  // Update Community
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

    // Check if user is member / invited
    let isMember = false;
    let memberStatus = null;
    let isInvited = false;

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
      isInvited = member?.isInvited || false; // ✅ yahan add kiya
    }

    return {
      ...community,
      communityRules: JSON.parse(community.communityRules || "[]"),
      membersCount: community._count.members || 0,
      postsCount: community._count.posts || 0,
      isMember,
      memberStatus,
      isOwner: community.user_id === user_id,
      isInvited, // ✅ frontend ke liye ab aa jayega
    };
  };

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
        "Join requests can only be sent for private communities. Use join endpoint for public communities."
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
          "Already a member of this community"
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
  // join_community = async ({ communityId, user_id }) => {
  //   const community = await prisma.community.findUnique({
  //     where: { id: communityId },
  //   });

  //   if (!community) {
  //     throw responses.not_found_response("Community not found");
  //   }

  //   // Check if already a member
  //   const existingMember = await prisma.communityMember.findUnique({
  //     where: {
  //       community_id_user_id: {
  //         community_id: communityId,
  //         user_id,
  //       },
  //     },
  //   });

  //   if (existingMember) {
  //     if (existingMember.status === "APPROVED") {
  //       throw responses.bad_request_response(
  //         "Already a member of this community",
  //       );
  //     }
  //     if (existingMember.status === "PENDING") {
  //       throw responses.bad_request_response("Join request already pending");
  //     }
  //   }

  //   // Create join request
  //   const member = await prisma.communityMember.create({
  //     data: {
  //       community_id: communityId,
  //       user_id,
  //       status: community.privacy === "PUBLIC" ? "APPROVED" : "PENDING",
  //       isApplied: true,
  //     },
  //   });

  //   // If public, auto-approve and increment member count
  //   if (community.privacy === "PUBLIC") {
  //     await prisma.community.update({
  //       where: { id: communityId },
  //       data: {
  //         membersCount: {
  //           increment: 1,
  //         },
  //       },
  //     });
  //   }

  //   return member;
  // };
  join_community = async ({ communityId, user_id }) => {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw responses.not_found_response("Community not found");
    }

    const existingMember = await prisma.communityMember.findUnique({
      where: {
        community_id_user_id: {
          community_id: communityId,
          user_id,
        },
      },
    });

    // 🔥 PUBLIC COMMUNITY OVERRIDE (NO PENDING CONCEPT)
    if (community.privacy === "PUBLIC") {
      // Already approved
      if (existingMember?.status === "APPROVED") {
        throw responses.bad_request_response(
          "Already a member of this community"
        );
      }

      // Pending → APPROVE
      if (existingMember?.status === "PENDING") {
        const approved = await prisma.communityMember.update({
          where: {
            community_id_user_id: {
              community_id: communityId,
              user_id,
            },
          },
          data: {
            status: "APPROVED",
            isApplied: false,
          },
        });

        await prisma.community.update({
          where: { id: communityId },
          data: {
            membersCount: { increment: 1 },
          },
        });

        return approved;
      }

      // No record → CREATE APPROVED
      const member = await prisma.communityMember.create({
        data: {
          community_id: communityId,
          user_id,
          status: "APPROVED",
          isApplied: true,
        },
      });

      await prisma.community.update({
        where: { id: communityId },
        data: {
          membersCount: { increment: 1 },
        },
      });

      return member;
    }

    // 🔒 PRIVATE COMMUNITY LOGIC
    if (existingMember?.status === "APPROVED") {
      throw responses.bad_request_response(
        "Already a member of this community"
      );
    }

    if (existingMember?.status === "PENDING") {
      throw responses.bad_request_response("Join request already pending");
    }

    return prisma.communityMember.create({
      data: {
        community_id: communityId,
        user_id,
        status: "PENDING",
        isApplied: true,
      },
    });
  };

  // Accept/Reject Join Request
  handle_join_request = async ({ requestId, user_id, action }) => {
    // 1. Find request with community
    const request = await prisma.communityMember.findUnique({
      where: { id: requestId },
      include: { community: true },
    });

    if (!request) {
      throw responses.not_found_response("Join request not found");
    }

    // 2. Only community owner can handle
    if (request.community.user_id !== user_id) {
      throw responses.forbidden_response(
        "Only community owner can handle join requests"
      );
    }

    // 3. Check if request still pending
    if (request.status !== "PENDING") {
      throw responses.bad_request_response("Request already processed");
    }

    // 4. Handle actions
    if (action === "accept") {
      // Accept → update status + increment membersCount
      const updated = await prisma.communityMember.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          isApplied: false,
          isInvited: false,
        },
      });

      await prisma.community.update({
        where: { id: request.community_id },
        data: { membersCount: { increment: 1 } },
      });

      return {
        message: "Join request accepted",
        status: "APPROVED",
        request: updated,
      };
    } else if (action === "reject") {
      // Reject → delete request from DB
      await prisma.communityMember.delete({
        where: { id: requestId },
      });

      return {
        message: "Join request rejected and deleted from database",
        status: "DELETED",
      };
    } else {
      throw responses.bad_request_response("Invalid action");
    }
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
        "You are not a member of this community"
      );
    }

    if (member.community.user_id === user_id) {
      throw responses.bad_request_response(
        "Community owner cannot leave. Delete community instead."
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
  create_post = async ({ communityId, user_id, description, postImg, isImageEdit }) => {
    const cid = (communityId || "").trim();
    const community = await prisma.community.findUnique({
      where: { id: cid },
      select: { user_id: true },
    });
    if (!community) {
      throw responses.not_found_response("Community not found");
    }
    // Community owner can always post; others must be APPROVED member
    if (community.user_id !== user_id) {
      const member = await prisma.communityMember.findUnique({
        where: {
          community_id_user_id: {
            community_id: cid,
            user_id,
          },
        },
      });
      if (!member || member.status !== "APPROVED") {
        throw responses.forbidden_response("You must be a member to post");
      }
    }

    const desc = (description ?? "").slice(0, 10000);
    const finalPostImg = isImageEdit === true ? (postImg ?? null) : null;
    const post = await prisma.communityPost.create({
      data: {
        community_id: cid,
        user_id,
        description: desc,
        postImg: finalPostImg,
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

    const { _count, ...postData } = post;
    return {
      ...postData,
      likesCount: _count?.post_like ?? 0,
      commentsCount: _count?.post_comment ?? 0,
      isOwner: post.user_id === user_id,
      likedByImages: [],
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
    const cid = (communityId || "").trim();

    const community = await prisma.community.findUnique({
      where: { id: cid },
      select: { user_id: true },
    });
    if (!community) {
      throw responses.not_found_response("Community not found");
    }
    // Community owner can always view; others must be APPROVED member
    if (community.user_id !== user_id) {
      const member = await prisma.communityMember.findUnique({
        where: {
          community_id_user_id: {
            community_id: cid,
            user_id,
          },
        },
      });
      if (!member || member.status !== "APPROVED") {
        throw responses.forbidden_response("You must be a member to view posts");
      }
    }

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where: { community_id: cid },
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
        where: { community_id: cid },
      }),
    ]);

    // Check which posts user has liked
    const postIds = posts.map((p) => p.id);
    const [userLikes, allLikes] = await Promise.all([
      prisma.postLike.findMany({
        where: {
          community_post_id: { in: postIds },
          user_id,
        },
        select: { community_post_id: true },
      }),
      prisma.postLike.findMany({
        where: { community_post_id: { in: postIds } },
        select: {
          community_post_id: true,
          user_id: true,
          user: {
            select: {
              user_details: { select: { profile_picture: true } },
            },
          },
        },
      }),
    ]);

    const likedPostIds = new Set(userLikes.map((l) => l.community_post_id));
    const likersByPostId = new Map();
    for (const like of allLikes) {
      if (!likersByPostId.has(like.community_post_id)) {
        likersByPostId.set(like.community_post_id, []);
      }
      const pic = like.user?.user_details?.profile_picture ?? null;
      likersByPostId.get(like.community_post_id).push({ user_id: like.user_id, profile_picture: pic });
    }

    const postsWithLikes = posts.map((post) => {
      const { _count, ...postData } = post;
      const likers = likersByPostId.get(post.id) || [];
      const withMeFirst = likers.slice().sort((a, b) => (a.user_id === user_id ? -1 : b.user_id === user_id ? 1 : 0));
      const likedByImages = withMeFirst
      .slice(0, 3)
      .map((l) => l.profile_picture ?? "")
      .filter((pic) => pic !== "");
      return {
        ...postData,
        likesCount: _count?.post_like ?? 0,
        commentsCount: _count?.post_comment ?? 0,
        isLiked: likedPostIds.has(post.id),
        isOwner: post.user_id === user_id,
        likedByImages,
      };
    });

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

  // Get Single Post
  get_single_post = async ({ postId, user_id }) => {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: { full_name: true, profile_picture: true },
            },
          },
        },
        _count: {
          select: { post_like: true, post_comment: true },
        },
      },
    });
    if (!post) {
      throw responses.not_found_response("Post not found");
    }
    const cid = (post.community_id || "").trim();
    const community = await prisma.community.findUnique({
      where: { id: cid },
      select: { user_id: true },
    });
    if (!community) {
      throw responses.not_found_response("Community not found");
    }
    if (community.user_id !== user_id) {
      const member = await prisma.communityMember.findUnique({
        where: {
          community_id_user_id: { community_id: cid, user_id },
        },
      });
      if (!member || member.status !== "APPROVED") {
        throw responses.forbidden_response("You must be a member to view this post");
      }
    }
    const [userLike, likers] = await Promise.all([
      prisma.postLike.findFirst({
        where: { community_post_id: postId, user_id },
      }),
      prisma.postLike.findMany({
        where: { community_post_id: postId },
        select: {
          user_id: true,
          user: { select: { user_details: { select: { profile_picture: true } } } },
        },
      }),
    ]);
    const withMeFirst = likers.slice().sort((a, b) => (a.user_id === user_id ? -1 : b.user_id === user_id ? 1 : 0));
    const likedByImages = withMeFirst
      .slice(0, 3)
      .map((l) => l.user?.user_details?.profile_picture ?? "")
      .filter((pic) => pic !== "");
    const { _count, ...postData } = post;
    return {
      ...postData,
      likesCount: _count?.post_like ?? 0,
      commentsCount: _count?.post_comment ?? 0,
      isLiked: !!userLike,
      isOwner: post.user_id === user_id,
      likedByImages,
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

    const likers = await prisma.postLike.findMany({
      where: { community_post_id: postId },
      select: {
        user_id: true,
        user: { select: { user_details: { select: { profile_picture: true } } } },
      },
    });
    const withMeFirst = likers.slice().sort((a, b) => (a.user_id === user_id ? -1 : b.user_id === user_id ? 1 : 0));
    const likedByImages = withMeFirst
      .slice(0, 3)
      .map((l) => l.user?.user_details?.profile_picture ?? "")
      .filter((pic) => pic !== "");

    const { _count, ...postData } = updated;
    return {
      ...postData,
      likesCount: _count?.post_like ?? 0,
      commentsCount: _count?.post_comment ?? 0,
      isOwner: updated.user_id === user_id,
      likedByImages,
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

  // Report Post
  report_post = async ({ postId, user_id, reason }) => {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw responses.not_found_response("Post not found");
    }
    const cid = (post.community_id || "").trim();
    const community = await prisma.community.findUnique({
      where: { id: cid },
      select: { user_id: true },
    });
    if (!community) {
      throw responses.not_found_response("Community not found");
    }
    if (community.user_id !== user_id) {
      const member = await prisma.communityMember.findUnique({
        where: {
          community_id_user_id: { community_id: cid, user_id },
        },
      });
      if (!member || member.status !== "APPROVED") {
        throw responses.forbidden_response("You must be a member to report this post");
      }
    }
    const reasonsArray = Array.isArray(reason) ? reason : reason ? [reason] : [];
    const report = await prisma.postReport.create({
      data: {
        post_id: postId,
        user_id,
        reasons: JSON.stringify(reasonsArray),
      },
    });
    return { message: "Post reported successfully", report: { id: report.id } };
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

  // Get Post Comments (with nested replies – no separate get replies API needed)
  get_post_comments = async ({ postId, user_id, page = 1, limit = 10 }) => {
    const skip = (page - 1) * limit;

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { user_id: true },
    });
    const postOwnerId = post?.user_id ?? null;

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
          comment_reply: {
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
            orderBy: { created_at: "desc" },
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

    const commentsWithReplies = comments.map((comment) => {
      const { comment_reply, ...rest } = comment;
      const replies = (comment_reply || []).map((r) => ({
        ...r,
        isCommentOwner: r.user_id === user_id,
      }));
      return {
        ...rest,
        replies,
        repliesCount: replies.length,
        isPostOwner: postOwnerId === user_id,
        isCommentOwner: comment.user_id === user_id,
      };
    });

    return {
      comments: commentsWithReplies,
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

  // Delete Comment or Reply (unified – id can be commentId or replyId)
  // Post owner can delete any comment/reply; otherwise only comment/reply author can delete
  delete_comment_or_reply = async ({ id, user_id }) => {
    const comment = await prisma.postComment.findUnique({
      where: { id },
      include: {
        community_post: { select: { user_id: true } },
      },
    });
    if (comment) {
      const postOwnerId = comment.community_post?.user_id ?? null;
      const isPostOwner = postOwnerId === user_id;
      const isCommentOwner = comment.user_id === user_id;
      if (!isPostOwner && !isCommentOwner) {
        throw responses.forbidden_response("Only post owner or comment author can delete");
      }
      await prisma.postComment.delete({ where: { id } });
      return { message: "Comment deleted successfully" };
    }
    const reply = await prisma.commentReply.findUnique({
      where: { id },
      include: {
        post_comment: {
          include: {
            community_post: { select: { user_id: true } },
          },
        },
      },
    });
    if (reply) {
      const postOwnerId = reply.post_comment?.community_post?.user_id ?? null;
      const isPostOwner = postOwnerId === user_id;
      const isReplyOwner = reply.user_id === user_id;
      if (!isPostOwner && !isReplyOwner) {
        throw responses.forbidden_response("Only post owner or reply author can delete");
      }
      await prisma.commentReply.delete({ where: { id } });
      return { message: "Reply deleted successfully" };
    }
    throw responses.not_found_response("Comment or reply not found");
  };
  // get_all_users = async ({ user_id, search, communityId }) => {
  //   if (!communityId) {
  //     throw responses.bad_request_response("communityId is required");
  //   }

  //   const where = {
  //     id: { not: user_id },
  //     is_blocked: false,
  //     is_approved: true,
  //   };

  //   if (search && search.trim() !== "") {
  //     where.OR = [
  //       { email: { contains: search } },
  //       { user_details: { full_name: { contains: search } } },
  //     ];
  //   }

  //   const users = await prisma.users.findMany({
  //     where,
  //     select: {
  //       id: true,
  //       email: true,
  //       user_details: {
  //         select: {
  //           full_name: true,
  //           profile_picture: true,
  //         },
  //       },
  //       // Check if this user is already invited to this community
  //       communityMembers: {
  //         where: { community_id: communityId },
  //         select: { id: true },
  //       },
  //     },
  //     orderBy: { created_at: "desc" },
  //   });

  //   // Map users with isInvited flag
  //   return users.map((u) => ({
  //     id: u.id,
  //     email: u.email,
  //     user_details: u.user_details,
  //     isInvited: u.communityMembers.length > 0, // true if already invited
  //   }));
  // };

  // invite_user = async ({ communityId, user_id, invitedUserId }) => {
  //   // Check if community exists
  //   const community = await prisma.community.findUnique({
  //     where: { id: communityId },
  //   });
  //   if (!community) {
  //     throw responses.not_found_response("Community not found");
  //   }

  //   // Only owner can invite
  //   if (community.user_id !== user_id) {
  //     throw responses.unauthorized_response("You are not the owner");
  //   }

  //   // Check if invite already exists
  //   const existingInvite = await prisma.communityMember.findUnique({
  //     where: {
  //       community_id_user_id: {
  //         community_id: communityId,
  //         user_id: invitedUserId,
  //       },
  //     },
  //   });

  //   if (existingInvite) {
  //     // If exists, cancel the invite
  //     await prisma.communityMember.delete({
  //       where: {
  //         community_id_user_id: {
  //           community_id: communityId,
  //           user_id: invitedUserId,
  //         },
  //       },
  //     });
  //     return { isInvited: false, message: "Invite cancelled successfully" };
  //   }

  //   // Otherwise create invite
  //   const invite = await prisma.communityMember.create({
  //     data: {
  //       community_id: communityId,
  //       user_id: invitedUserId,
  //       status: "PENDING",
  //       isApplied: true,
  //     },
  //   });

  //   return { isInvited: true, message: "User invited successfully", invite };
  // };
  get_all_users = async ({ user_id, search, communityId }) => {
    if (!communityId) {
      throw responses.bad_request_response("communityId is required");
    }

    const where = {
      id: { not: user_id }, // khud ko exclude
      is_blocked: false,
      is_approved: true,
      // ✅ Jo already member nahi hai
      communityMembers: {
        none: {
          community_id: communityId,
        },
      },
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
        // Ye ab optional, frontend ke liye
        communityMembers: {
          where: { community_id: communityId },
          select: { id: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      user_details: u.user_details,
      isInvited: u.communityMembers.length > 0, // mostly false, because none filter
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

    if (!existingInvite) {
      // First time → create PENDING invite
      const invite = await prisma.communityMember.create({
        data: {
          community_id: communityId,
          user_id: invitedUserId,
          status: "PENDING",
          isApplied: false, // ❌ user ne apply nahi ki
          isInvited: true, // ✅ owner ne invite kiya
        },
      });

      return { isInvited: true, message: "User invited successfully", invite };
    }

    if (existingInvite.status === "DECLINED") {
      // Previously declined → reset to PENDING
      const updated = await prisma.communityMember.update({
        where: {
          community_id_user_id: {
            community_id: communityId,
            user_id: invitedUserId,
          },
        },
        data: {
          status: "PENDING",
          isApplied: false,
          isInvited: true,
        },
      });

      return {
        isInvited: true,
        message: "Request send successfully",
        invite: updated,
      };
    }

    if (existingInvite.status === "PENDING") {
      // Pending → delete from DB (cancel)
      await prisma.communityMember.delete({
        where: {
          community_id_user_id: {
            community_id: communityId,
            user_id: invitedUserId,
          },
        },
      });

      return { isInvited: false, message: "Pending invite cancelled" };
    }

    // For APPROVED or other statuses, just return
    return {
      isInvited: false,
      message: `Cannot invite, status is ${existingInvite.status}`,
      invite: existingInvite,
    };
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
      owner: {
        id: invite.community.user.id,
        full_name: invite.community.user.user_details.full_name,
        profileImg: invite.community.user.user_details.profile_picture,
      },
      status: invite.status,
      isInvited: invite.isInvited, // ✅ frontend clear
    }));
  };
  // Accept/Reject Community Invite
  handle_invite = async ({ inviteId, user_id, action }) => {
    const invite = await prisma.communityMember.findUnique({
      where: { id: inviteId },
      include: { community: true },
    });

    if (!invite) {
      throw responses.not_found_response("Invite not found");
    }

    if (invite.user_id !== user_id) {
      throw responses.forbidden_response("This invite does not belong to you");
    }

    if (invite.status !== "PENDING") {
      throw responses.bad_request_response("Invite already processed");
    }

    const status = action === "accept" ? "APPROVED" : "DECLINED";

    const updated = await prisma.communityMember.update({
      where: { id: inviteId },
      data: {
        status: status, // use dynamic
        isApplied: false,
        isInvited: false,
      },
    });

    // If accepted, increment community membersCount
    if (action === "accept") {
      await prisma.community.update({
        where: { id: invite.community_id },
        data: {
          membersCount: { increment: 1 },
        },
      });
    }

    return {
      message:
        action === "accept"
          ? "Invite accepted. You joined the community."
          : "Invite rejected.",
      invite: updated,
    };
  };
  // handle_invite = async ({ inviteId, user_id, action }) => {
  //   const invite = await prisma.communityMember.findUnique({
  //     where: { id: inviteId },
  //     include: { community: true },
  //   });

  //   if (!invite) {
  //     throw responses.not_found_response("Invite not found");
  //   }

  //   if (invite.user_id !== user_id) {
  //     throw responses.forbidden_response("This invite does not belong to you");
  //   }

  //   if (invite.status !== "PENDING") {
  //     throw responses.bad_request_response("Invite already processed");
  //   }

  //   if (action === "accept") {
  //     // Accept → APPROVED
  //     const updated = await prisma.communityMember.update({
  //       where: { id: inviteId },
  //       data: { status: "APPROVED" },
  //     });

  //     // Increment community member count
  //     await prisma.community.update({
  //       where: { id: invite.community_id },
  //       data: { membersCount: { increment: 1 } },
  //     });

  //     return {
  //       message: "Invite accepted. You joined the community.",
  //       invite: updated,
  //     };
  //   } else if (action === "reject") {
  //     // Reject → delete from DB
  //     await prisma.communityMember.delete({
  //       where: { id: inviteId },
  //     });

  //     return {
  //       message: "Invite rejected and removed.",
  //       inviteId,
  //     };
  //   } else {
  //     throw responses.bad_request_response("Invalid action");
  //   }
  // };

  // send_community_request = async ({ communityId, user_id }) => {
  //   // 1. Check community
  //   const community = await prisma.community.findUnique({
  //     where: { id: communityId },
  //   });

  //   if (!community) {
  //     throw responses.not_found_response("Community not found");
  //   }

  //   // 2. Check existing record
  //   const existing = await prisma.communityMember.findUnique({
  //     where: {
  //       community_id_user_id: {
  //         community_id: communityId,
  //         user_id,
  //       },
  //     },
  //   });

  //   // ❌ Already member
  //   if (existing && existing.status === "APPROVED") {
  //     throw responses.bad_request_response(
  //       "You are already a member of this community",
  //     );
  //   }

  //   // ❌ Request already pending
  //   if (existing && existing.status === "PENDING") {
  //     throw responses.bad_request_response("Join request already pending");
  //   }

  //   // 3. Create request ONLY if not exists
  //   const request = await prisma.communityMember.create({
  //     data: {
  //       community_id: communityId,
  //       user_id,
  //       status: "PENDING",
  //       isApplied: true,
  //     },
  //   });

  //   return {
  //     requestId: request.id,
  //     status: request.status,
  //     message: "Join request sent successfully",
  //   };
  // };
  send_community_request = async ({ communityId, user_id }) => {
    // Ensure user_id is a string (UUID)
    if (!user_id || typeof user_id !== "string") {
      throw responses.bad_request_response("Invalid user_id");
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });
    if (!community) throw responses.not_found_response("Community not found");

    const existing = await prisma.communityMember.findUnique({
      where: { community_id_user_id: { community_id: communityId, user_id } },
    });

    if (existing && existing.status === "APPROVED") {
      throw responses.bad_request_response(
        "You are already a member of this community"
      );
    }

    return await prisma.$transaction(async (tx) => {
      if (existing && existing.status === "PENDING") {
        await tx.communityMember.delete({ where: { id: existing.id } });
        return {
          message: "Pending join request cancelled",
          status: "CANCELLED",
        };
      }

      const request = await tx.communityMember.create({
        data: {
          community_id: communityId,
          user_id,
          status: "PENDING",
          isApplied: true, // ✅ user ne apply kiya
          isInvited: false, // ❌ invite nahi
        },
      });

      return {
        requestId: request.id,
        status: request.status,
        message: "Join request sent successfully",
      };
    });
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
  get_all_community_member = async ({ user_id, search, communityId }) => {
    if (!communityId) {
      throw this.responses.bad_request_response("communityId is required");
    }

    // 1️⃣ Get community
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw this.responses.not_found_response("Community not found");
    }

    const ownerId = community.user_id;

    // 2️⃣ Get owner separately
    const owner = await prisma.users.findUnique({
      where: { id: ownerId },
      select: {
        id: true,
        email: true,
        user_details: { select: { full_name: true, profile_picture: true } },
      },
    });

    const ownerMapped = {
      ...owner,
      isInvited: true,
      isOwner: true,
    };

    // 3️⃣ Get all members (excluding owner)
    const members = await prisma.users.findMany({
      where: {
        id: { not: ownerId }, // exclude owner
        is_blocked: false,
        is_approved: true,
        communityMembers: {
          some: { community_id: communityId },
        },
        ...(search && search.trim() !== ""
          ? {
              OR: [
                { email: { contains: search } },
                { user_details: { full_name: { contains: search } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        user_details: { select: { full_name: true, profile_picture: true } },
        communityMembers: {
          where: { community_id: communityId },
          select: { id: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // 4️⃣ Map members
    const membersMapped = members.map((u) => ({
      id: u.id,
      email: u.email,
      user_details: u.user_details,
      isInvited: u.communityMembers.length > 0,
      isOwner: false,
    }));

    // 5️⃣ Return owner + members (owner top pe)
    return [ownerMapped, ...membersMapped];
  };

  remove_community_member = async ({ communityId, user_id, memberId }) => {
    const cId = String(communityId || "").trim();
    const mId = String(memberId || "").trim();

    // 1. Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: cId },
    });

    if (!community) {
      throw { status: 404, message: "Community not found" };
    }

    // 2. Only owner can remove
    if (community.user_id !== user_id) {
      throw { status: 403, message: "Only owner can remove members" };
    }

    // 3. Find member: memberId from get-members is the user_id of the member
    let member = await prisma.communityMember.findFirst({
      where: {
        community_id: cId,
        user_id: mId,
      },
    });

    // If not found by user_id, try memberId as CommunityMember record id
    if (!member) {
      member = await prisma.communityMember.findFirst({
        where: {
          community_id: cId,
          id: mId,
        },
      });
    }

    if (!member) {
      throw { status: 400, message: "This user is not a member" };
    }

    const targetUserId = member.user_id;

    // Owner cannot be removed via this endpoint
    if (targetUserId === community.user_id) {
      throw { status: 400, message: "Community owner cannot be removed" };
    }

    // 4. Delete the member (by primary id)
    await prisma.communityMember.delete({
      where: { id: member.id },
    });

    // 5. Decrement membersCount only if they were approved
    if (member.status === "APPROVED") {
      await prisma.community.update({
        where: { id: cId },
        data: { membersCount: { decrement: 1 } },
      });
    }

    return { message: "Member removed successfully" };
  };
}

module.exports = CommunityService;

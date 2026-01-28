/** @format */

const { prisma } = require("@configs/prisma");
const Responses = require("@constants/responses");

const responses = new Responses();

class ReferralService {
  // Get Referral Link
  get_referral_link = async ({ user_id }) => {
    let referralCode = await prisma.referal_code.findUnique({
      where: { user_id },
    });

    // If referral code doesn't exist, create it
    if (!referralCode) {
      const UserServiceHelpers = require("@api/v1/helpers/user_service_helper");
      const helper = new UserServiceHelpers();
      
      referralCode = await helper.initiat_user_referral_code({
        user_id,
      });
    }

    // Generate referral link (adjust base URL as needed)
    const baseUrl = process.env.FRONTEND_DOMAIN || "https://loremipsum.com";
    const referralLink = `${baseUrl}/${referralCode.code}`;

    return {
      referralCode: referralCode.code,
      referralLink,
    };
  };

  // Get Referral Rewards Status
  get_referral_rewards = async ({ user_id }) => {
    // Get referral code
    let referralCode = await prisma.referal_code.findUnique({
      where: { user_id },
    });

    // If referral code doesn't exist, create it
    if (!referralCode) {
      const UserServiceHelpers = require("@api/v1/helpers/user_service_helper");
      const helper = new UserServiceHelpers();
      
      referralCode = await helper.initiat_user_referral_code({
        user_id,
      });
    }

    // Get all rewards for this user (as referrer)
    const rewards = await prisma.referral_reward.findMany({
      where: {
        referrer_id: user_id,
        is_active: true,
      },
      include: {
        referred: {
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
      orderBy: {
        created_at: "desc",
      },
    });

    // Calculate totals
    const totalReferrals = rewards.length;
    const totalAIPrompts = rewards
      .filter((r) => r.reward_type === "AI_PROMPTS" && r.is_claimed)
      .reduce((sum, r) => sum + (r.reward_amount || 0), 0);
    const totalPremiumDays = rewards
      .filter((r) => r.reward_type === "PREMIUM_TRIAL_DAYS" && r.is_claimed)
      .reduce((sum, r) => sum + (r.reward_amount || 0), 0);

    // Generate referral link
    const baseUrl = process.env.FRONTEND_DOMAIN || "https://loremipsum.com";
    const referralLink = `${baseUrl}/${referralCode.code}`;

    return {
      referralCode: referralCode.code,
      referralLink,
      totalReferrals,
      totalAIPrompts,
      totalPremiumDays,
      rewards: rewards.map((reward) => ({
        id: reward.id,
        referredUser: reward.referred
          ? {
              id: reward.referred.id,
              email: reward.referred.email,
              fullName: reward.referred.user_details?.full_name,
              profilePicture: reward.referred.user_details?.profile_picture,
            }
          : null,
        rewardType: reward.reward_type,
        rewardAmount: reward.reward_amount,
        isClaimed: reward.is_claimed,
        createdAt: reward.created_at,
      })),
    };
  };
}

module.exports = ReferralService;

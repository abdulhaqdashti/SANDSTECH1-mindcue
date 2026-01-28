/** @format */

const ReferralService = require("@api/v1/services/referral");
const Responses = require("@constants/responses");

const service = new ReferralService();
const responses = new Responses();

class ReferralController {
  // Get Referral Link
  get_referral_link = async (req, res, next) => {
    try {
      const { user } = req.user;

      const data = await service.get_referral_link({
        user_id: user.id,
      });

      const response = responses.ok_response(data, "Referral link fetched successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get Referral Rewards
  get_referral_rewards = async (req, res, next) => {
    try {
      const { user } = req.user;

      const data = await service.get_referral_rewards({
        user_id: user.id,
      });

      const response = responses.ok_response(data, "Referral rewards fetched successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ReferralController;

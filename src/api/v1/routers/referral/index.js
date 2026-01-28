/** @format */

const express = require("express");
const verify_token = require("@v1_middlewares/verify_token.middleware");
const validate_request = require("@v1_middlewares/validate_request_joi.middleware");
const ReferralSchema = require("@v1_validations/referral");
const ReferralController = require("@api/v1/controllers/referral");

const validations = new ReferralSchema();
const controller = new ReferralController();

const router = express.Router();

// ========== REFERRAL ROUTES ==========

// Get Referral Link
router.get(
  "/link",
  verify_token,
  validate_request(validations.get_referral_link_schema),
  controller.get_referral_link
);

// Get Referral Rewards
router.get(
  "/rewards",
  verify_token,
  validate_request(validations.get_referral_rewards_schema),
  controller.get_referral_rewards
);

module.exports = router;

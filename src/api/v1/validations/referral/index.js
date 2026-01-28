/** @format */

const Joi = require("joi");

class ReferralSchema {
  // Get Referral Link
  get_referral_link_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Get Referral Rewards
  get_referral_rewards_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({}).unknown(true).allow(null),
  });
}

module.exports = ReferralSchema;

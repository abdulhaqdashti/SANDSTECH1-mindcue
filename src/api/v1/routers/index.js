const express = require("express");
const error_middleware = require("@v1_middlewares/error_handler.middleware");
const verify_token = require("@v1_middlewares/verify_token.middleware");
const validate_request = require("@v1_middlewares/validate_request_joi.middleware");
const router = express.Router();

const about_app_router = require("./about_app");
const help_and_feedback_router = require("./help_and_feedback");
const privacy_policy_router = require("./privacy_policy");
const term_and_conditions_router = require("./terms_and_conditions");

const chat_router = require("./chat");
const notification_router = require("./notifications");

const user_router = require("./user");
const community_router = require("./community");
const CommunityController = require("@api/v1/controllers/community");
const CommunitySchema = require("@v1_validations/community");
const community_controller = new CommunityController();
const community_validations = new CommunitySchema();

const session_router = require("./session");
const card_details_router = require("./card_details");
const settings_router = require("./settings");
const referral_router = require("./referral");
const faq_router = require("./faq");

const public_router = require("./public");

/**@PRIVATE */
router.use("/user", user_router);
// DELETE /api/v1/:communityId/member/:memberId (alias - frontend uses this path)
router.delete(
  "/:communityId/member/:memberId",
  verify_token,
  community_controller.remove_member.bind(community_controller),
);
// GET /api/v1/post/:postId (alias - frontend uses singular "post")
router.get(
  "/post/:postId",
  verify_token,
  validate_request(community_validations.get_single_post_schema),
  community_controller.get_single_post.bind(community_controller),
);
router.use("/community", community_router);
router.use("/session", session_router);
router.use("/payment-details", card_details_router);
router.use("/settings", settings_router);
router.use("/referral", referral_router);
router.use("/notifications", notification_router);
router.use("/chat", chat_router);

/**@PUBLIC */
router.use("/help_and_feedback", help_and_feedback_router);
router.use("/privacy_policy", privacy_policy_router);
router.use("/terms_and_conditions", term_and_conditions_router);
router.use("/about-app", about_app_router);
router.use("/faq", faq_router);

/**@SEEDING_DATA */
router.use("/public", public_router);

router.get("/", (_, res) => {
  try {
    res.send("server working of v1 router -- Share berry");
  } catch (error) {
    res.send(error.message);
  }
});

router.use(error_middleware);

module.exports = router;

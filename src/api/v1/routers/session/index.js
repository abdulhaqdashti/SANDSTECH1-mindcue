/** @format */

const express = require("express");
const verify_token = require("@v1_middlewares/verify_token.middleware");
const validate_request = require("@v1_middlewares/validate_request_joi.middleware");
const SessionSchema = require("@v1_validations/session");
const SessionController = require("@api/v1/controllers/session");

const validations = new SessionSchema();
const controller = new SessionController();

const router = express.Router();

// ========== SESSION ROUTES ==========

// Create Session
router.post(
  "/",
  verify_token,
  validate_request(validations.create_session_schema),
  controller.create_session
);

// Get All Sessions
router.get(
  "/",
  verify_token,
  validate_request(validations.get_all_sessions_schema),
  controller.get_all_sessions
);

// Get Progress Summary (Streak, Recent Score, Today Words) - MUST BE BEFORE /:sessionId
router.get(
  "/progress/summary",
  verify_token,
  validate_request(validations.get_progress_summary_schema),
  controller.get_progress_summary
);

// Get Streak Only - MUST BE BEFORE /:sessionId
router.get(
  "/streak",
  verify_token,
  validate_request(validations.get_streak_schema),
  controller.get_streak
);

// Get Progress Tracker (Complete Dashboard) - MUST BE BEFORE /:sessionId
router.get(
  "/progress/tracker",
  verify_token,
  validate_request(validations.get_progress_tracker_schema),
  controller.get_progress_tracker
);

// Get Single Session
router.get(
  "/:sessionId",
  verify_token,
  validate_request(validations.get_session_schema),
  controller.get_session
);

// Update Session
router.patch(
  "/:sessionId",
  verify_token,
  validate_request(validations.update_session_schema),
  controller.update_session
);

// Delete Session
router.delete(
  "/:sessionId",
  verify_token,
  validate_request(validations.delete_session_schema),
  controller.delete_session
);

// Start Practice Session
router.post(
  "/:sessionId/start",
  verify_token,
  validate_request(validations.start_practice_schema),
  controller.start_practice
);

// Save Practice Result
router.post(
  "/:sessionId/practice-result",
  verify_token,
  validate_request(validations.save_practice_result_schema),
  controller.save_practice_result
);

// Get Session Practices (History)
router.get(
  "/:sessionId/practices",
  verify_token,
  validate_request(validations.get_session_practices_schema),
  controller.get_session_practices
);

module.exports = router;

/** @format */

const express = require("express");
const verify_token = require("@v1_middlewares/verify_token.middleware");
const validate_request = require("@v1_middlewares/validate_request_joi.middleware");
const SettingsSchema = require("@v1_validations/settings");
const SettingsController = require("@api/v1/controllers/settings");

const validations = new SettingsSchema();
const controller = new SettingsController();

const router = express.Router();

// ========== SETTINGS ROUTES ==========

// Get All Settings
router.get(
  "/",
  verify_token,
  validate_request(validations.get_settings_schema),
  controller.get_settings
);

// Update Notifications
router.patch(
  "/notifications",
  verify_token,
  validate_request(validations.update_notifications_schema),
  controller.update_notifications
);

// Update Word Cue Number
router.patch(
  "/word-cue-number",
  verify_token,
  validate_request(validations.update_word_cue_number_schema),
  controller.update_word_cue_number
);

// Update Pause Duration
router.patch(
  "/pause-duration",
  verify_token,
  validate_request(validations.update_pause_duration_schema),
  controller.update_pause_duration
);

// Connect Social Media
router.post(
  "/social/connect",
  verify_token,
  validate_request(validations.connect_social_media_schema),
  controller.connect_social_media
);

// Disconnect Social Media
router.post(
  "/social/disconnect",
  verify_token,
  validate_request(validations.disconnect_social_media_schema),
  controller.disconnect_social_media
);

// Delete Account
router.delete(
  "/account",
  verify_token,
  validate_request(validations.delete_account_schema),
  controller.delete_account
);

module.exports = router;

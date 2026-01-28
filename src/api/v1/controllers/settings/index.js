/** @format */

const SettingsService = require("@api/v1/services/settings");
const Responses = require("@constants/responses");

const service = new SettingsService();
const responses = new Responses();

class SettingsController {
  // Get All Settings
  get_settings = async (req, res, next) => {
    try {
      const { user } = req.user;

      const data = await service.get_settings({
        user_id: user.id,
      });

      const response = responses.ok_response(data, "Settings fetched successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Update Notifications
  update_notifications = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { enabled } = req.body;

      const data = await service.update_notifications({
        user_id: user.id,
        enabled,
      });

      const response = responses.ok_response(data, "Notifications updated successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Update Word Cue Number
  update_word_cue_number = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { wordCueNumber } = req.body;

      const data = await service.update_word_cue_number({
        user_id: user.id,
        wordCueNumber,
      });

      const response = responses.ok_response(data, "Word cue number updated successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Update Pause Duration
  update_pause_duration = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { pauseDuration } = req.body;

      const data = await service.update_pause_duration({
        user_id: user.id,
        pauseDuration,
      });

      const response = responses.ok_response(data, "Pause duration updated successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Connect Social Media
  connect_social_media = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { platform, token } = req.body;

      const data = await service.connect_social_media({
        user_id: user.id,
        platform,
        token,
      });

      const response = responses.ok_response(data, "Social media connected successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Disconnect Social Media
  disconnect_social_media = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { platform } = req.body;

      const data = await service.disconnect_social_media({
        user_id: user.id,
        platform,
      });

      const response = responses.ok_response(data, "Social media disconnected successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Delete Account (Direct delete - no password verification)
  delete_account = async (req, res, next) => {
    try {
      const { user } = req.user;

      const data = await service.delete_account({
        user_id: user.id,
      });

      const response = responses.ok_response(data, "Account deleted successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = SettingsController;

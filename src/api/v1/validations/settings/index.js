/** @format */

const Joi = require("joi");

class SettingsSchema {
  // Get All Settings
  get_settings_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Update Notifications
  update_notifications_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({
      enabled: Joi.boolean().required(),
    }),
  });

  // Update Word Cue Number
  update_word_cue_number_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({
      wordCueNumber: Joi.number().integer().min(1).max(10).required(),
    }),
  });

  // Update Pause Duration
  update_pause_duration_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({
      pauseDuration: Joi.number().integer().min(1).max(10).required(),
    }),
  });

  // Connect Social Media
  connect_social_media_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({
      platform: Joi.string()
        .valid("FACEBOOK", "GOOGLE", "APPLE")
        .required(),
      token: Joi.string().optional(),
    }),
  });

  // Disconnect Social Media
  disconnect_social_media_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({
      platform: Joi.string()
        .valid("FACEBOOK", "GOOGLE", "APPLE")
        .required(),
    }),
  });

  // Delete Account (Direct delete - no password verification)
  delete_account_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({}).unknown(true).allow(null),
  });
}

module.exports = SettingsSchema;

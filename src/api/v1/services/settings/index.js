/** @format */

const { prisma } = require("@configs/prisma");
const Responses = require("@constants/responses");

const responses = new Responses();

class SettingsService {
  // Get All Settings
  get_settings = async ({ user_id }) => {
    // Get user details for word_cue_number and pause_duration
    const userDetails = await prisma.user_details.findUnique({
      where: { user_id },
      select: {
        word_cue_number: true,
        pause_duration: true,
      },
    });

    // Get user settings
    let userSettings = await prisma.user_settings.findUnique({
      where: { user_id },
    });

    // If settings don't exist, create default
    if (!userSettings) {
      userSettings = await prisma.user_settings.create({
        data: {
          user_id,
          notifications: true,
          facebook_connected: false,
          google_connected: false,
          apple_connected: false,
        },
      });
    }

    // Get user's mute_notifications from users table
    const user = await prisma.users.findUnique({
      where: { id: user_id },
      select: {
        mute_notifications: true,
      },
    });

    return {
      notifications: !user?.mute_notifications || false, // Inverted: mute_notifications = false means notifications ON
      wordCueNumber: userDetails?.word_cue_number || 2,
      pauseDuration: userDetails?.pause_duration || 2,
      facebookConnected: userSettings.facebook_connected || false,
      googleConnected: userSettings.google_connected || false,
      appleConnected: userSettings.apple_connected || false,
    };
  };

  // Update Notifications
  update_notifications = async ({ user_id, enabled }) => {
    // Update mute_notifications (inverted: enabled = true means mute_notifications = false)
    await prisma.users.update({
      where: { id: user_id },
      data: {
        mute_notifications: !enabled,
      },
    });

    // Also update user_settings if exists
    await prisma.user_settings.upsert({
      where: { user_id },
      update: {
        notifications: enabled,
      },
      create: {
        user_id,
        notifications: enabled,
      },
    });

    return { notifications: enabled };
  };

  // Update Word Cue Number
  update_word_cue_number = async ({ user_id, wordCueNumber }) => {
    if (wordCueNumber < 1 || wordCueNumber > 10) {
      throw responses.bad_request_response(
        "Word cue number must be between 1 and 10"
      );
    }

    const userDetails = await prisma.user_details.findUnique({
      where: { user_id },
    });

    if (!userDetails) {
      throw responses.not_found_response("User details not found");
    }

    await prisma.user_details.update({
      where: { user_id },
      data: {
        word_cue_number: wordCueNumber,
      },
    });

    return { wordCueNumber };
  };

  // Update Pause Duration
  update_pause_duration = async ({ user_id, pauseDuration }) => {
    if (pauseDuration < 1 || pauseDuration > 10) {
      throw responses.bad_request_response(
        "Pause duration must be between 1 and 10 seconds"
      );
    }

    const userDetails = await prisma.user_details.findUnique({
      where: { user_id },
    });

    if (!userDetails) {
      throw responses.not_found_response("User details not found");
    }

    await prisma.user_details.update({
      where: { user_id },
      data: {
        pause_duration: pauseDuration,
      },
    });

    return { pauseDuration };
  };

  // Connect Social Media
  connect_social_media = async ({ user_id, platform, token }) => {
    const platforms = {
      FACEBOOK: {
        field: "facebook_connected",
        tokenField: "facebook_token",
      },
      GOOGLE: {
        field: "google_connected",
        tokenField: "google_token",
      },
      APPLE: {
        field: "apple_connected",
        tokenField: "apple_token",
      },
    };

    const platformConfig = platforms[platform.toUpperCase()];
    if (!platformConfig) {
      throw responses.bad_request_response(
        "Invalid platform. Use FACEBOOK, GOOGLE, or APPLE"
      );
    }

    await prisma.user_settings.upsert({
      where: { user_id },
      update: {
        [platformConfig.field]: true,
        [platformConfig.tokenField]: token,
      },
      create: {
        user_id,
        [platformConfig.field]: true,
        [platformConfig.tokenField]: token,
        notifications: true,
      },
    });

    return {
      platform: platform.toUpperCase(),
      connected: true,
    };
  };

  // Disconnect Social Media
  disconnect_social_media = async ({ user_id, platform }) => {
    const platforms = {
      FACEBOOK: {
        field: "facebook_connected",
        tokenField: "facebook_token",
      },
      GOOGLE: {
        field: "google_connected",
        tokenField: "google_token",
      },
      APPLE: {
        field: "apple_connected",
        tokenField: "apple_token",
      },
    };

    const platformConfig = platforms[platform.toUpperCase()];
    if (!platformConfig) {
      throw responses.bad_request_response(
        "Invalid platform. Use FACEBOOK, GOOGLE, or APPLE"
      );
    }

    const userSettings = await prisma.user_settings.findUnique({
      where: { user_id },
    });

    if (!userSettings) {
      throw responses.not_found_response("User settings not found");
    }

    await prisma.user_settings.update({
      where: { user_id },
      data: {
        [platformConfig.field]: false,
        [platformConfig.tokenField]: null,
      },
    });

    return {
      platform: platform.toUpperCase(),
      connected: false,
    };
  };

  // Delete Account (Direct delete - no password verification)
  delete_account = async ({ user_id }) => {
    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      throw responses.not_found_response("User not found");
    }

    // Delete user (cascade will handle related records)
    await prisma.users.delete({
      where: { id: user_id },
    });

    return { message: "Account deleted successfully" };
  };
}

module.exports = SettingsService;

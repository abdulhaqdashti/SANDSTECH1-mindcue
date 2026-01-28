/** @format */

const { user_type } = require("@prisma/client");
const Joi = require("joi");

class UserSchema {
  register_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      identifier: Joi.string().max(100).required(),
      password: Joi.string()
        .pattern(/^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .max(16)
        .required(),
      user_type: Joi.string()
        .valid(...Object.keys(user_type))
        .required(),
    }),
  });

  login_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      identifier: Joi.string().max(100).required(),
      fcm_token: Joi.string(),
      password: Joi.string()
        .pattern(/^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .max(16)
        .required(),
    }),
  });

  verify_otp_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      identifier: Joi.string().max(100).required(),
      otp: Joi.number().integer().min(0).max(999999).required(),
      fcm_token: Joi.string(),
    }),
  });

  forget_password_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      identifier: Joi.string().max(100).required(),
      fcm_token: Joi.string().optional(),
    }),
  });

  reset_password_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      password: Joi.string()
        .pattern(/^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .max(16)
        .required(),
    }),
  });

  reset_password_with_otp_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      identifier: Joi.string().max(100).required(),
      otp: Joi.number().integer().min(0).max(999999).required(),
      password: Joi.string()
        .pattern(/^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .max(16)
        .required(),
      confirm_password: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
          "any.only": "Passwords do not match",
        }),
    }),
  });

  verify_otp_forget_password_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      identifier: Joi.string().max(100).required(),
      otp: Joi.number().integer().min(0).max(999999).required(),
      fcm_token: Joi.string().optional(),
    }),
  });

  resend_otp_forget_password_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      identifier: Joi.string().max(100).required(),
    }),
  });

  change_password_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      password: Joi.string()
        .pattern(/^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .max(16)
        .required(),
      old_password: Joi.string()
        .pattern(/^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .max(16)
        .required(),
    }),
  });

  resend_otp_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      identifier: Joi.string().max(100).required(),
    }),
  });

  social_login_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      token: Joi.string().required(),
      fcm_token: Joi.string(),
      user_type: Joi.string().valid("CONTENT_CREATOR", "USER"),
      social_type: Joi.string().valid("GOOGLE", "APPLE").required(),
    }),
  });

  logout_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      refresh_token: Joi.string().required(),
    }),
  });

  get_all_users_schema = Joi.object({
    query: Joi.object({ user_name: Joi.string() }),
    params: Joi.object({}),
    body: Joi.object({}),
  });

  get_referral_schema = Joi.object({
    query: Joi.object({ user_name: Joi.string() }),
    params: Joi.object({}),
    body: Joi.object({}),
  });

  get_by_id_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({ userId: Joi.string().required() }),
    body: Joi.object({}),
  });

  edit_user_profile_picture_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({}),
  });

  get_about_of_self_user_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({}),
  });

  get_single_provider = Joi.object({
    query: Joi.object({}),
    params: Joi.object({
      provider_id: Joi.string().required(),
    }),
    body: Joi.object({}),
  });

  edit_user_profile_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      first_name: Joi.string().required(),
      last_name: Joi.string().required(),
      location: Joi.string().required(),
      date_of_birth: Joi.date().required(),
      latitude: Joi.string().required(),
      longitude: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      contact_email: Joi.string().email(),
      contact_phone: Joi.string().required(),
    }),
  });

  update_profile_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      full_name: Joi.string().optional(),
      gender: Joi.string().valid("Male", "Female", "Rather Not To Mention").optional(),
      age: Joi.alternatives().try(
        Joi.number().integer().min(0).max(100),
        Joi.string().pattern(/^\d+(\.0)?$/)
      ).optional(),
      range: Joi.alternatives().try(
        Joi.string().pattern(/^\d+(\.0)?\s*-\s*\d+(\.0)?$/),
        Joi.string().pattern(/^\d+\s*-\s*\d+$/)
      ).optional(),
      profile_picture: Joi.string().optional(),
    }).custom((value, helpers) => {
      if (value.range) {
        // Parse range to validate min <= max (handles "35-40", "35 - 40", "35.0-40.0", etc.)
        const rangeParts = value.range.split('-').map(s => parseFloat(s.trim()));
        if (rangeParts.length === 2 && rangeParts[0] > rangeParts[1]) {
          return helpers.error("any.invalid");
        }
      }
      return value;
    }, "Age range validation")
    .messages({
      "any.invalid": "Minimum age cannot be greater than maximum age",
    }),
  });

  create_user_profile_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      first_name: Joi.string().required(),
      last_name: Joi.string().required(),
      location: Joi.string().required(),
      date_of_birth: Joi.date().required(),
      latitude: Joi.string().required(),
      longitude: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      contact_email: Joi.string().email(),
      contact_phone: Joi.string().required(),
    }),
  });

  user_documnets_upload = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({}),
  });

  change_location = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      latitude: Joi.string().required(),
      longitude: Joi.string().required(),
    }),
  });

  update_fcm = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      refresh_token: Joi.string().required(),
      fcm_token: Joi.string().required(),
    }),
  });

  // Step 1: Add full name, gender, age range, profile picture, email (sends OTP)
  signup_step1_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      full_name: Joi.string().required(),
      gender: Joi.string().valid("Male", "Female", "Rather Not To Mention").required(),
      age: Joi.alternatives().try(
        Joi.number().integer().min(0).max(100),
        Joi.string().pattern(/^\d+(\.0)?$/)
      ).optional(),
      range: Joi.alternatives().try(
        Joi.string().pattern(/^\d+(\.0)?\s*-\s*\d+(\.0)?$/),
        Joi.string().pattern(/^\d+\s*-\s*\d+$/)
      ).required(),
      user_type: Joi.string()
        .valid(...Object.keys(user_type))
        .required(),
      profile_picture: Joi.string().optional(),
      email: Joi.string().email().required(),
      fcm_token: Joi.string().optional(),
    }).custom((value, helpers) => {
      if (value.range) {
        // Parse range to validate min <= max (handles "35-40", "35 - 40", "35.0-40.0", etc.)
        const rangeParts = value.range.split('-').map(s => parseFloat(s.trim()));
        if (rangeParts.length === 2 && rangeParts[0] > rangeParts[1]) {
          return helpers.error("any.invalid");
        }
      }
      return value;
    }, "Age range validation")
    .messages({
      "any.invalid": "Minimum age cannot be greater than maximum age",
    }),
  });

  // Step 2: Verify OTP (email already added in step 1)
  signup_step2_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      otp: Joi.number().integer().min(0).max(999999).required(),
      fcm_token: Joi.string().optional(),
    }),
  });

  // Step 3: Set password (REQUIRED - account only created when password is set)
  signup_step3_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({
      password: Joi.string()
        .pattern(/^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .max(16)
        .required(),
      confirm_password: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
          "any.only": "Passwords do not match",
        }),
    }),
  });

  // Resend OTP for signup flow
  resend_otp_signup_schema = Joi.object({
    query: Joi.object({}),
    params: Joi.object({}),
    body: Joi.object({}),
  });
}

module.exports = UserSchema;

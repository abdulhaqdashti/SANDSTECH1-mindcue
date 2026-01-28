/** @format */

const UserService = require("@api/v1/services/user");
const Responses = require("@constants/responses");

const responses = new Responses();
const service = new UserService();

class UserController {
  register_user = async (req, res, next) => {
    try {
      const { identifier, password, user_type } = req.body;

      const { otp, user } = await service.register_user({
        identifier,
        password,
        user_type,
      });

      const response = responses.ok_response(
        { user, otp },
        "User created successfully. Please verify otp",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  login_user = async (req, res, next) => {
    try {
      const { identifier, password, fcm_token } = req.body;

      const data = await service.login_user({
        identifier,
        password,
        fcm_token,
      });

      const response = responses.ok_response(data, "Login Success.");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  verify_otp = async (req, res, next) => {
    try {
      const { otp, identifier, fcm_token } = req.body;

      const { access_token, refresh_token, is_profile_completed } =
        await service.verify_otp({ otp, identifier, fcm_token });

      const response = responses.ok_response(
        { access_token, refresh_token, is_profile_completed },
        "User OTP verified.",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  forget_password = async (req, res, next) => {
    try {
      const { identifier, fcm_token } = req.body;

      const { otp, access_token, refresh_token } =
        await service.forget_password({
          identifier,
          fcm_token,
        });

      const response = responses.ok_response(
        { otp, access_token, refresh_token },
        "OTP sent successfully. Please verify OTP to reset password",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  reset_password = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { password } = req.body;

      await service.reset_password({ user, password });

      const response = responses.ok_response(
        null,
        "Password reset successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Reset Password with OTP (for forget password flow)
  reset_password_with_otp = async (req, res, next) => {
    try {
      const { identifier, otp, password } = req.body;

      await service.reset_password_with_otp({ identifier, otp, password });

      const response = responses.ok_response(
        null,
        "Password reset successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Verify OTP for Forget Password - Returns access_token
  verify_otp_forget_password = async (req, res, next) => {
    try {
      const { identifier, otp, fcm_token } = req.body;

      const { access_token, refresh_token, message } =
        await service.verify_otp_forget_password({
          identifier,
          otp,
          fcm_token,
        });

      const response = responses.ok_response(
        { access_token, refresh_token },
        message,
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Resend OTP for forget password
  resend_otp_forget_password = async (req, res, next) => {
    try {
      const { identifier } = req.body;

      const { otp } = await service.resend_otp_forget_password({ identifier });

      const response = responses.ok_response(
        { otp },
        "OTP resent successfully. Please verify OTP",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  change_password = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { password, old_password } = req.body;

      await service.change_password({ user, password, old_password });

      const response = responses.ok_response(
        null,
        "Password changed successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  resend_otp = async (req, res, next) => {
    try {
      const { identifier } = req.body;

      const { otp } = await service.resend_otp({ identifier });

      const response = responses.ok_response(
        { otp },
        "OTP resent successfully. Please verify OTP",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  social_login = async (req, res, next) => {
    try {
      const { token, fcm_token, user_type, social_type } = req.body;

      const { access_token, refresh_token, is_profile_completed } =
        await service.social_login({
          token,
          fcm_token,
          user_type,
          social_type,
        });

      const response = responses.ok_response(
        {
          access_token,
          refresh_token,
          is_profile_completed,
        },
        "User login successful.",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  delete_user = async (req, res, next) => {
    try {
      const { user } = req.user;

      await service.delete_user({ user });

      const response = responses.ok_response(
        null,
        `User deleted successfully.`,
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  logout_user = async (req, res, next) => {
    try {
      const { refresh_token } = req.body;

      await service.logout_user({ refresh_token });

      const response = responses.ok_response(null, "User logout successful.");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  refresh_user = async (req, res, next) => {
    try {
      const { refresh_token } = req.body;

      const { access_token } = await service.refresh_user({
        refresh_token,
      });

      const response = responses.ok_response(
        { access_token },
        "New Access Token generated successfully.",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  get_me = async (req, res, next) => {
    try {
      const { user } = req.user;

      const { db_user } = await service.get_user_profile({ id: user.id });

      const response = responses.ok_response(db_user, "User Data");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  get_user_by_id = async (req, res, next) => {
    try {
      const { user_id } = req.params;

      const { db_user } = await service.get_user_profile({ id: user_id });

      const response = responses.ok_response(db_user, "User Data");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  edit_user_profile = async (req, res, next) => {
    try {
      const { user } = req.user;
      const profile_picture = req.media?.profile_picture?.[0]?.path || null;

      await service.edit_profile({
        id: user.id,
        data: { ...req.body, ...(profile_picture && { profile_picture }) },
      });

      const response = responses.ok_response(
        null,
        "Your profile updated successfully.",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Update Profile (simpler alias)
  update_profile = async (req, res, next) => {
    try {
      const { user } = req.user;
      const profile_picture = req.media?.profile_picture?.[0]?.path || null;

      // Extract age and range from body
      const { age, range, ...restData } = req.body;

      // Convert age and range to min_age and max_age
      let updateData = { ...restData };

      // Parse range or age to min_age and max_age
      if (range) {
        // Parse range: "35-40" or "35.0 - 40.0" -> min_age: 35, max_age: 40
        const rangeParts = range.split("-").map((s) => parseInt(s.trim()));
        if (rangeParts.length === 2) {
          updateData.min_age = rangeParts[0];
          updateData.max_age = rangeParts[1];
        }
      } else if (age !== undefined) {
        // If only age provided, set both min_age and max_age to the same value
        const ageValue = typeof age === "string" ? parseInt(age) : age;
        updateData.min_age = ageValue;
        updateData.max_age = ageValue;
      }

      await service.edit_profile({
        id: user.id,
        data: { ...updateData, ...(profile_picture && { profile_picture }) },
      });

      const response = responses.ok_response(
        null,
        "Your profile updated successfully.",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  edit_profile_picture = async (req, res, next) => {
    try {
      const { user } = req.user;

      await service.update_profile_picture({
        id: user.id,
        data: { profile_picture: req.media.profile_picture[0].path },
      });

      const response = responses.ok_response(
        null,
        "Your profile updated successfully.",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  create_user_profile = async (req, res, next) => {
    try {
      const { user } = req.user;

      await service.create_profile({
        user,
        data: {
          ...req.body,
          ...(req.media?.profile_picture?.[0]?.path
            ? { profile_picture: req.media.profile_picture[0].path }
            : {}),
        },
      });

      const response = responses.ok_response(
        null,
        "Your profile created successfully.",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  get_all_users = async (_, res) => {
    try {
      const { users } = await service.get_all_user();

      const response = responses.ok_response(users, "All users.");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  get_about = async (req, res, next) => {
    try {
      const { user } = req.user;

      const data = await service.get_about({ user_id: user.id });

      const response = responses.ok_response(
        data,
        "Profile fetched successfully",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  get_user_referral_code = async (req, res, next) => {
    try {
      const { user } = req.user;

      const data = await service.get_referral({ user_id: user.id });

      const response = responses.ok_response(
        data,
        "Successfully fetched top performerce",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  create_user_documents = async (req, res, next) => {
    try {
      const id_front = req.media.id_front[0].path;
      const id_back = req.media.id_back[0].path;
      const { user } = req.user;

      await service.create_documents({
        id_front,
        id_back,
        user_id: user.id,
      });

      const response = responses.ok_response(
        null,
        "Successfully uploaded documents",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  update_fcm_token = async (req, res, next) => {
    try {
      const { refresh_token, fcm_token } = req.body;

      await service.change_fcm({ refresh_token, fcm_token });

      const response = responses.update_success_response(
        null,
        "Successfully updated user fcm",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  change_location = async (req, res, next) => {
    try {
      const { user } = req.user;

      await service.edit_profile({
        id: user.id,
        data: req.body,
      });

      const response = responses.ok_response(
        null,
        "Your profile location updated.",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Step 1: Add full name, gender, age range, profile picture, email (sends OTP)
  signup_step1 = async (req, res, next) => {
    try {
      const {
        full_name,
        gender,
        age,
        range,
        user_type,
        profile_picture,
        email,
        fcm_token,
      } = req.body;

      // Convert age and range to min_age and max_age
      let min_age, max_age;
      if (range) {
        // Parse range: "35.0 - 40.0" -> min_age: 35, max_age: 40
        const rangeParts = range.split("-").map((s) => parseInt(s.trim()));
        if (rangeParts.length === 2) {
          min_age = rangeParts[0];
          max_age = rangeParts[1];
        } else {
          throw new Error("Invalid range format");
        }
      } else if (age) {
        // If only age provided, set both min_age and max_age to the same value
        const ageValue = parseInt(age);
        min_age = ageValue;
        max_age = ageValue;
      } else {
        throw new Error("Either age or range is required");
      }

      const {
        user_id,
        full_name: user_full_name,
        email: user_email,
        otp,
        access_token,
        refresh_token,
      } = await service.signup_step1({
        full_name,
        gender,
        min_age,
        max_age,
        user_type,
        profile_picture:
          req.media?.profile_picture?.[0]?.path || profile_picture,
        email,
        fcm_token,
      });

      const response = responses.ok_response(
        {
          user_id,
          full_name: user_full_name,
          email: user_email,
          otp, // Remove in production
          access_token,
          refresh_token,
        },
        "Step 1 completed. OTP sent to your email. Please verify in step 2.",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Step 2: Verify OTP (email already added in step 1)
  signup_step2 = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { otp, fcm_token } = req.body;

      const { access_token, refresh_token, is_email_verified } =
        await service.signup_step2({ user_id: user.id, otp, fcm_token });

      const response = responses.ok_response(
        { access_token, refresh_token, is_email_verified },
        "Step 2 completed. Email verified. Please set password in step 3 (optional).",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Step 3: Set password (REQUIRED - account only created when password is set)
  signup_step3 = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { password } = req.body;

      if (!password) {
        const response = responses.bad_request_response(
          "Password is required to complete signup. Account will not be created until password is set.",
        );
        return res.status(response.status.code).json(response);
      }

      const { user_id, message, account_created } = await service.signup_step3({
        user_id: user.id,
        password,
      });

      const response = responses.ok_response(
        { user_id, account_created },
        message,
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Resend OTP for signup flow
  resend_otp_signup = async (req, res, next) => {
    try {
      const { user } = req.user;

      const { otp } = await service.resend_otp_signup({ user_id: user.id });

      const response = responses.ok_response(
        { otp },
        "OTP resent successfully. Please verify OTP",
      );
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };
}
module.exports = UserController;

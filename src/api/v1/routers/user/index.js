/** @format */

const express = require("express");
const user_type_check = require("@v1_middlewares/user_type_check.middleware");
const validate_request = require("@v1_middlewares/validate_request_joi.middleware");
const verify_token = require("@v1_middlewares/verify_token.middleware");
const handle_multipart_data = require("@v1_middlewares/populate_multipart_data.middleware");
const upload_media = require("@api/v1/middlewares/upload_media.middleware");
const UserSchema = require("@v1_validations/user");
const UserController = require("@api/v1/controllers/user");

const validations = new UserSchema();
const controller = new UserController();

const router = express.Router();

//register
router.post(
  "/register",
  validate_request(validations.register_schema),
  controller.register_user,
);

// Step-by-step signup flow (3 steps)
// Step 1: Add full name, gender, age range, profile picture (optional), email (sends OTP)
router.post(
  "/signup",
  handle_multipart_data([]), // Empty array - profile_picture is optional
  upload_media,
  validate_request(validations.signup_step1_schema),
  controller.signup_step1,
);

// Step 2: Verify OTP (email already added in step 1)
router.post(
  "/verify_otp",
  verify_token,
  validate_request(validations.signup_step2_schema),
  controller.signup_step2,
);

// Step 3: Set password (optional - if password provided, account created; if not, user can come back later)
router.post(
  "/set_password",
  verify_token,
  validate_request(validations.signup_step3_schema),
  controller.signup_step3,
);

// Resend OTP for signup flow
router.post(
  "/signup/resend_otp",
  verify_token,
  validate_request(validations.resend_otp_signup_schema),
  controller.resend_otp_signup,
);

//verify_otp_forget_password (returns access_token)
router.post(
  "/forget_password/verify_otp",
  validate_request(validations.verify_otp_forget_password_schema),
  controller.verify_otp_forget_password,
);

//resend_otp_forget_password
router.post(
  "/forget_password/resend_otp",
  validate_request(validations.resend_otp_forget_password_schema),
  controller.resend_otp_forget_password,
);

//login
router.post(
  "/login",
  validate_request(validations.login_schema),
  controller.login_user,
);

//forget_password
router.post(
  "/forget_password",
  validate_request(validations.forget_password_schema),
  controller.forget_password,
);

//reset_password (with JWT token)
router.post(
  "/reset_password",
  verify_token,
  validate_request(validations.reset_password_schema),
  controller.reset_password,
);

//change_password
router.post(
  "/change_password",
  verify_token,
  validate_request(validations.change_password_schema),
  controller.change_password,
);

//social_login
router.post(
  "/social_login",
  validate_request(validations.social_login_schema),
  controller.social_login,
);

//delete
router.delete("/", verify_token, controller.delete_user);

//get_all
router.get("/", verify_token, controller.get_all_users);

//logout
router.post(
  "/logout",
  validate_request(validations.logout_schema),
  verify_token,
  controller.logout_user,
);

//refresh_token
router.post(
  "/refresh_token",
  validate_request(validations.logout_schema),
  controller.refresh_user,
);

//create_user_profile
router.post(
  "/create_user_profile",
  verify_token,
  handle_multipart_data(),
  upload_media,
  user_type_check("USER"),
  validate_request(validations.create_user_profile_schema),
  controller.create_user_profile,
);

//edit_user_profile
router.patch(
  "/update_user_profile",
  verify_token,
  handle_multipart_data(),
  upload_media,
  validate_request(validations.edit_user_profile_schema),
  controller.edit_user_profile,
);

//update_profile (simpler alias)
router.patch(
  "/update_profile",
  verify_token,
  handle_multipart_data([]),
  upload_media,
  validate_request(validations.update_profile_schema),
  controller.update_profile,
);

//edit_user_profile_picture
router.patch(
  "/profile_picture",
  verify_token,
  handle_multipart_data(["profile_picture"]),
  upload_media,
  validate_request(validations.edit_user_profile_picture_schema),
  controller.edit_profile_picture,
);

router.get(
  "/me",
  verify_token,
  validate_request(validations.get_about_of_self_user_schema),
  controller.get_about,
);

router.patch(
  "/update_fcm",
  verify_token,
  validate_request(validations.update_fcm),
  controller.update_fcm_token,
);

module.exports = router;

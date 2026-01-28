/** @format */

const { prisma } = require("@configs/prisma");
const UserServiceHelpers = require("@api/v1/helpers/user_service_helper");
const Responses = require("@constants/responses");

const responses = new Responses();
const helper = new UserServiceHelpers();

class UserService {
  // Removed #calculate_age - now using age range (min_age, max_age) directly

  //Register User
  register_user = async ({ identifier, password, user_type }) => {
    const identifier_type = helper.validate_identifier(identifier);

    const already_user = await helper.get_already_user({
      identifier,
      identifier_type,
    });

    //if user is already registered
    if (already_user && already_user[`is_${identifier_type}_verified`]) {
      throw responses.bad_request_response(
        `${identifier_type} ${identifier} already associated with another account`,
      );
    }

    //hashing password and saving in db
    const hashed_password = await helper.hash_password({
      password,
      identifier,
    });

    //data for new user
    const otp = helper.generate_random_numeric_code({
      length: 6,
    }); //otp
    const _exp = new Date(new Date().getTime() + 60 * 1000).toISOString(); // expires-in
    const data = {
      user_type,
      user_secrets: {
        create: {
          otp,
          otp_expiration: _exp,
          password: hashed_password,
        },
      },
    };
    data[`${identifier_type}`] = identifier;

    if (!already_user) {
      //create a new user

      const user = await prisma.users.create({
        data: {
          ...data,
          ...(data.user_type === "PROVIDER" && {
            is_approved: false,
          }),
        },
      });
      return { otp, user };
    } else {
      //updating with new otp and expiration time
      await helper.update_user_secret({
        otp,
        _exp,
        id: already_user.user_secrets.id,
      });
      return { otp, user: already_user };
    }
  };

  //Login User
  login_user = async ({ identifier, password, fcm_token }) => {
    const identifier_type = helper.validate_identifier(identifier);
    const already_user = await helper.get_already_user({
      identifier,
      identifier_type,
    });

    if (
      !already_user ||
      (!already_user.is_email_verified && !already_user.is_phone_verified)
    ) {
      throw responses.bad_request_response(
        `This email is not associated with any user`,
      );
    }

    //matching password from bcrypt
    const match = await helper.match_password({
      password,
      identifier,
      hashed_password: already_user.user_secrets.password,
    });

    if (!match) {
      throw responses.bad_request_response(
        `Either email or password is incorrect`,
      );
    }

    const { access_token, refresh_token } = await helper.create_user_session({
      user: already_user,
      fcm_token,
    });

    return {
      access_token,
      refresh_token,
      is_profile_completed: already_user.is_completed,
    };
  };

  //Verify OTP
  verify_otp = async ({ otp, identifier, fcm_token }) => {
    const identifier_type = helper.validate_identifier(identifier);

    const already_user = await helper.get_already_user({
      identifier,
      identifier_type,
    });

    if (!already_user) {
      throw responses.bad_request_response(
        `Invalid ${identifier_type} provided.`,
      );
    }

    //matching otp and expirtion time
    if (
      new Date(already_user.user_secrets.otp_expiration).getTime() >
        new Date().getTime() &&
      already_user.user_secrets.otp == otp
    ) {
      //data for updating user
      const data = {};
      data[`is_${identifier_type}_verified`] = true;
      await prisma.users.update({
        where: {
          id: already_user.id,
        },
        data,
      });
    } else {
      throw responses.bad_request_response("Invalid or Expired OTP.");
    }

    const { access_token, refresh_token } = await helper.create_user_session({
      user: already_user,
      fcm_token,
    });

    return {
      access_token,
      refresh_token,
      is_profile_completed: already_user.is_completed,
    };
  };

  //Forget Password - Returns OTP and Access Token
  forget_password = async ({ identifier, fcm_token }) => {
    const identifier_type = helper.validate_identifier(identifier);

    const already_user = await helper.get_already_user({
      identifier,
      identifier_type,
    });
    if (!already_user) {
      throw responses.not_found_response(
        "This email is not associated with any user.",
      );
    }

    //updating user secrets
    const otp = helper.generate_random_numeric_code({
      length: 6,
    });
    const _exp = new Date(new Date().getTime() + 60 * 1000).toISOString();
    await helper.update_user_secret({
      _exp,
      otp,
      id: already_user.user_secrets.id,
    });

    // Create session and generate tokens
    const { access_token, refresh_token } = await helper.create_user_session({
      user: already_user,
      fcm_token,
    });

    return { otp, access_token, refresh_token };
  };

  // Verify OTP for Forget Password - Returns access_token
  verify_otp_forget_password = async ({ identifier, otp, fcm_token }) => {
    const identifier_type = helper.validate_identifier(identifier);

    const already_user = await helper.get_already_user({
      identifier,
      identifier_type,
    });

    if (!already_user) {
      throw responses.not_found_response(
        "This email is not associated with any user.",
      );
    }

    if (!already_user.user_secrets) {
      throw responses.bad_request_response(
        "OTP not generated. Please request OTP first.",
      );
    }

    // Verify OTP and expiration time (convert both to string for comparison)
    const storedOtp = String(already_user.user_secrets.otp);
    const providedOtp = String(otp);

    if (
      new Date(already_user.user_secrets.otp_expiration).getTime() >
        new Date().getTime() &&
      storedOtp === providedOtp
    ) {
      // Create session and generate tokens
      const { access_token, refresh_token } = await helper.create_user_session({
        user: already_user,
        fcm_token,
      });

      return {
        access_token,
        refresh_token,
        message: "OTP verified successfully. You can now reset your password.",
      };
    } else {
      throw responses.bad_request_response("Invalid or Expired OTP.");
    }
  };

  //Reset Password (with JWT token - for authenticated users)
  reset_password = async ({ user, password }) => {
    const already_user = await helper.get_already_user({
      find_user_obj: { id: user.id },
    });
    if (!already_user) {
      throw responses.not_found_response(
        "This email is not associated with any user.",
      );
    }
    let identifier = already_user.email;
    if (!identifier) identifier = already_user.phone;

    const hashed_password = await helper.hash_password({
      password,
      identifier,
    });

    await helper.update_user_secret({
      password: hashed_password,
      id: already_user.user_secrets.id,
    });
  };

  //Reset Password with OTP (for forget password flow)
  reset_password_with_otp = async ({ identifier, otp, password }) => {
    const identifier_type = helper.validate_identifier(identifier);

    const already_user = await helper.get_already_user({
      identifier,
      identifier_type,
    });

    if (!already_user) {
      throw responses.not_found_response(
        "This email is not associated with any user.",
      );
    }

    if (!already_user.user_secrets) {
      throw responses.bad_request_response(
        "OTP not generated. Please request OTP first.",
      );
    }

    // Verify OTP and expiration time
    if (
      new Date(already_user.user_secrets.otp_expiration).getTime() >
        new Date().getTime() &&
      already_user.user_secrets.otp == otp
    ) {
      // Hash password
      const hashed_password = await helper.hash_password({
        password,
        identifier,
      });

      // Update password
      await helper.update_user_secret({
        password: hashed_password,
        id: already_user.user_secrets.id,
      });
    } else {
      throw responses.bad_request_response("Invalid or Expired OTP.");
    }
  };

  //Resend OTP for forget password
  resend_otp_forget_password = async ({ identifier }) => {
    const identifier_type = helper.validate_identifier(identifier);

    const already_user = await helper.get_already_user({
      identifier,
      identifier_type,
    });

    if (!already_user) {
      throw responses.not_found_response(
        "This email is not associated with any user.",
      );
    }

    // Generate new OTP
    const otp = helper.generate_random_numeric_code({ length: 6 });
    const _exp = new Date(new Date().getTime() + 60 * 1000).toISOString();

    // Update user secrets with new OTP
    if (already_user.user_secrets) {
      await helper.update_user_secret({
        otp,
        _exp,
        id: already_user.user_secrets.id,
      });
    } else {
      await prisma.user_secrets.create({
        data: {
          user_id: already_user.id,
          otp,
          otp_expiration: _exp,
        },
      });
    }

    return { otp };
  };

  //Change Password
  change_password = async ({ user, password, old_password }) => {
    const already_user = await helper.get_already_user({
      find_user_obj: { id: user.id },
    });
    if (!already_user) {
      throw responses.not_found_response(
        "This email is not associated with any user.",
      );
    }

    let identifier = already_user.email;
    if (!identifier) already_user.phone;

    const match = await helper.match_password({
      password: old_password,
      identifier,
      hashed_password: already_user.user_secrets.password,
    });

    //matching password
    if (!match) {
      throw responses.bad_request_response("Old password is incorrect.");
    }

    const hashed_password = await helper.hash_password({
      password,
      identifier,
    });
    await helper.update_user_secret({
      password: hashed_password,
      id: already_user.user_secrets.id,
    });
  };

  create_documents = async ({ id_front, id_back, user_id }) => {
    const user = await helper.get_already_user({
      find_user_obj: {
        id: user_id,
      },
    });

    if (user.user_documents) {
      throw responses.conflict_response("Already submitted docu");
    }

    return await prisma.user_documents.create({
      data: {
        id_back,
        id_front,
        user_id,
      },
    });
  };

  //Resend OTP
  resend_otp = async ({ identifier }) => {
    const identifier_type = helper.validate_identifier(identifier);
    const already_user = await helper.get_already_user({
      identifier,
      identifier_type,
    });

    if (!already_user) {
      throw responses.not_found_response(
        "This email is not associated with any user.",
      );
    }

    //update otp and expiration time
    const otp = helper.generate_random_numeric_code({
      length: 6,
    });
    const _exp = new Date(new Date().getTime() + 60 * 1000).toISOString();
    await helper.update_user_secret({
      otp,
      _exp,
      id: already_user.user_secrets.id,
    });

    return { otp };
  };

  //Social Login
  social_login = async ({ token, fcm_token, user_type, social_type }) => {
    const { email, profile_picture, user_name } =
      social_type == "GOOGLE"
        ? await helper.verify_google_token({ token })
        : await helper.verify_apple_token({ token });

    const already_user = await helper.get_already_user({
      find_user_obj: { email, is_email_verified: true },
    });

    if (already_user) {
      const { access_token, refresh_token } = helper.create_user_session({
        fcm_token,
        user: already_user,
      });
      return {
        access_token,
        refresh_token,
        is_profile_completed: already_user.is_completed,
      };
    }

    //creating data for new user
    const data = {
      user_type,
      is_email_verified: true,
    };
    email && (data.email = email);
    user_name && (data.user_name = user_name + `${new Date().getTime()}`);
    profile_picture &&
      (data.user_details = {
        create: {
          profile_picture,
        },
      });
    const new_user = await prisma.users.create({
      data,
    });

    //creating session
    const { access_token, refresh_token } = helper.create_user_session({
      fcm_token,
      user: new_user,
    });
    return {
      access_token,
      refresh_token,
      is_profile_completed: new_user.is_completed,
    };
  };

  //Delete User
  delete_user = async ({ user }) => {
    await prisma.users.delete({
      where: {
        id: user.id,
      },
    });
  };

  //Logout User
  logout_user = async ({ refresh_token }) => {
    const user_session = await prisma.user_sessions.deleteMany({
      where: {
        refresh_token,
      },
    });
    if (!user_session.count) {
      throw responses.bad_request_response("Invalid refresh token");
    }
  };

  //Refresh Access Token
  refresh_user = async ({ refresh_token }) => {
    const access_token = helper.refresh_access_token(refresh_token);
    if (!access_token) {
      throw responses.bad_request_response("Invalid refresh token.");
    }
    return { access_token };
  };

  //Get User Profile
  get_user_profile = async ({ id }) => {
    const db_user = await prisma.users.findFirst({
      where: {
        id,
      },
      include: {
        user_details: {
          include: {
            content_creator_types: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!db_user) {
      throw responses.not_found_response("User not Valid.");
    }
    return { db_user };
  };

  //Edit User Profile
  edit_profile = async ({ id, data }) => {
    const db_user = await helper.get_already_user({
      find_user_obj: { id },
    });
    if (!db_user.user_details.id) {
      throw responses.bad_request_response("Unable to update");
    }
    await prisma.$transaction(async (tx) => {
      //updating user details
      await helper.update_user_details({
        data,
        id: db_user.user_details.id,
        tx,
      });
    });
  };

  //Update Profile Picture
  update_profile_picture = async ({ id, data }) => {
    const db_user = await helper.get_already_user({
      find_user_obj: { id },
    });
    if (!db_user.user_details.id) {
      throw responses.bad_request_response("Unable to update");
    }

    await helper.update_user_details({
      data,
      id: db_user.user_details.id,
    });
  };

  mark_profile_completed = async ({ id, tx }) => {
    await helper.mark_completed_user({ id, tx });
  };

  //Create User Profile
  create_profile = async ({ user, data }) => {
    if (user.is_completed) {
      throw responses.bad_request_response("Profile already created.");
    }
    await prisma.$transaction(async (tx) => {
      await helper.create_user_details({
        data: {
          ...data,
          user_id: user.id,
        },
        tx,
      });

      await this.mark_profile_completed({ id: user.id, tx });
    });
  };

  //Get All Users
  get_all_user = async () => {
    const users = await prisma.users.findMany({
      include: {
        user_details: true,
      },
      where: {
        user_type: {
          not: "ADMIN",
        },
      },
    });
    return { users };
  };

  get_about = async ({ user_id }) => {
    if (!user_id) {
      throw responses.bad_request_response("user_id is required");
    }

    const user = await prisma.users.findUnique({
      where: { id: user_id },
      include: {
        user_details: true,
        userSettings: true,
      },
    });

    if (!user) {
      throw responses.not_found_response("User not found");
    }

    const userDetails = user.user_details;
    const notifications = user.userSettings?.notifications ?? true;

    // Convert min_age/max_age to age and range format
    const min_age = userDetails?.min_age;
    const max_age = userDetails?.max_age;
    let age = null;
    let range = null;

    if (
      min_age !== null &&
      min_age !== undefined &&
      max_age !== null &&
      max_age !== undefined
    ) {
      age = `${max_age}.0`;
      range = `${min_age}.0 - ${max_age}.0`;
    } else if (max_age !== null && max_age !== undefined) {
      age = `${max_age}.0`;
      range = `${max_age}.0 - ${max_age}.0`;
    } else if (min_age !== null && min_age !== undefined) {
      age = `${min_age}.0`;
      range = `${min_age}.0 - ${min_age}.0`;
    }

    return {
      user_id: user.id,
      email: user.email,
      push_notification: notifications ? 1 : 0,
      full_name: userDetails?.full_name || null,
      age: age,
      range: range,
      gender: userDetails?.gender || null,
      profile_picture: userDetails?.profile_picture || null,
    };
  };

  get_referral = async ({ user_id }) => {
    const data = await prisma.referal_code.findFirst({
      where: {
        user_id,
      },
      select: {
        code: true,
      },
    });

    return { referral_code: data.code };
  };

  change_fcm = async ({ refresh_token, fcm_token }) => {
    return await prisma.user_sessions.updateMany({
      where: {
        refresh_token,
      },
      data: {
        fcm_token,
      },
    });
  };

  // Step 1: Create user with profile info (full name, gender, age range, profile picture, email) and send OTP
  signup_step1 = async ({
    full_name,
    gender,
    min_age,
    max_age,
    user_type,
    profile_picture,
    email,
    fcm_token,
  }) => {
    // Validate age range
    if (min_age && max_age) {
      if (min_age < 0 || max_age < 0) {
        throw responses.bad_request_response("Age values must be positive");
      }
      if (min_age > max_age) {
        throw responses.bad_request_response(
          "Minimum age cannot be greater than maximum age",
        );
      }
    }

    // Check if email already exists
    let user = null;
    if (email) {
      const existing_user = await helper.get_already_user({
        identifier: email,
        identifier_type: "email",
      });

      // If user exists and account is completed, throw error
      if (existing_user && existing_user.is_completed) {
        throw responses.bad_request_response(
          "Email already associated with another account",
        );
      }

      // If user exists but account is incomplete, update existing user instead of creating new one
      if (existing_user && !existing_user.is_completed) {
        // Update existing user with new data
        user = await prisma.users.update({
          where: { id: existing_user.id },
          data: {
            user_type,
            is_email_verified: false, // Reset email verification - need to verify again
            user_details: {
              update: {
                full_name,
                gender,
                ...(min_age !== undefined && { min_age }),
                ...(max_age !== undefined && { max_age }),
                ...(profile_picture && { profile_picture }), // Optional - only add if provided
              },
            },
          },
          include: {
            user_details: true,
            user_secrets: true,
          },
        });
      }
    }

    // If no existing user found, create new user
    if (!user) {
      user = await prisma.users.create({
        data: {
          user_type,
          ...(email && { email }),
          is_completed: false, // Explicitly set to false - will be true only when password is set
          is_email_verified: false, // Will be true after OTP verification
          user_details: {
            create: {
              full_name,
              gender,
              ...(min_age !== undefined && { min_age }),
              ...(max_age !== undefined && { max_age }),
              ...(profile_picture && { profile_picture }), // Optional - only add if provided
            },
          },
        },
        include: {
          user_details: true,
          user_secrets: true,
        },
      });

      // Create referral code for new user
      await helper.initiat_user_referral_code({
        user_id: user.id,
      });
    }

    // Generate OTP and send to email if email provided
    let otp = null;
    if (email) {
      otp = helper.generate_random_numeric_code({ length: 6 });
      const _exp = new Date(new Date().getTime() + 60 * 1000).toISOString();

      // Create or update user_secrets with new OTP
      if (user.user_secrets) {
        await helper.update_user_secret({
          otp,
          _exp,
          id: user.user_secrets.id,
        });
      } else {
        await prisma.user_secrets.create({
          data: {
            user_id: user.id,
            otp,
            otp_expiration: _exp,
          },
        });
      }
    }

    // Create session and generate tokens
    const { access_token, refresh_token } = await helper.create_user_session({
      user,
      fcm_token,
    });

    return {
      user_id: user.id,
      full_name: user.user_details?.full_name || full_name,
      email: email || null,
      otp: otp || null, // Return OTP for testing (remove in production)
      access_token,
      refresh_token,
    };
  };

  // Step 2: Verify OTP (email already added in step 1)
  signup_step2 = async ({ user_id, otp, fcm_token }) => {
    // Get the user
    const user = await helper.get_already_user({
      find_user_obj: { id: user_id },
    });

    if (!user) {
      throw responses.not_found_response("User not found");
    }

    if (!user.email) {
      throw responses.bad_request_response(
        "Email not set. Please complete step 1 first",
      );
    }

    if (!user.user_secrets) {
      throw responses.bad_request_response(
        "OTP not generated. Please complete step 1 first",
      );
    }

    // Verify OTP and expiration time
    if (
      new Date(user.user_secrets.otp_expiration).getTime() >
        new Date().getTime() &&
      user.user_secrets.otp == otp
    ) {
      // Mark email as verified
      await prisma.users.update({
        where: { id: user_id },
        data: { is_email_verified: true },
      });

      // Create or update session
      const { access_token, refresh_token } = await helper.create_user_session({
        user,
        fcm_token,
      });

      return {
        access_token,
        refresh_token,
        is_email_verified: true,
      };
    } else {
      throw responses.bad_request_response("Invalid or Expired OTP.");
    }
  };

  // Step 3: Set password (optional - if password provided, account created; if not, user can come back later)
  signup_step3 = async ({ user_id, password }) => {
    // Get the user
    const user = await helper.get_already_user({
      find_user_obj: { id: user_id },
    });

    if (!user) {
      throw responses.not_found_response("User not found");
    }

    if (!user.email) {
      throw responses.bad_request_response(
        "Email not set. Please complete step 1 first",
      );
    }

    if (!user.is_email_verified) {
      throw responses.bad_request_response(
        "Please complete step 2 (verify OTP) first",
      );
    }

    // Password is REQUIRED to complete signup - account only created when password is set
    if (!password) {
      throw responses.bad_request_response(
        "Password is required to complete signup. Account will not be created until password is set.",
      );
    }

    // Hash password
    const hashed_password = await helper.hash_password({
      password,
      identifier: user.email,
    });

    // Create or update user_secrets with password
    if (user.user_secrets) {
      await helper.update_user_secret({
        password: hashed_password,
        id: user.user_secrets.id,
      });
    } else {
      await prisma.user_secrets.create({
        data: {
          user_id,
          password: hashed_password,
        },
      });
    }

    // Mark account as completed - ONLY when password is set
    await prisma.users.update({
      where: { id: user_id },
      data: { is_completed: true },
    });

    return {
      user_id,
      message: "Password set successfully. Account created!",
      account_created: true,
    };
  };

  // Resend OTP for signup flow (uses user_id instead of identifier)
  resend_otp_signup = async ({ user_id }) => {
    const user = await helper.get_already_user({
      find_user_obj: { id: user_id },
    });

    if (!user) {
      throw responses.not_found_response("User not found");
    }

    if (!user.email) {
      throw responses.bad_request_response(
        "Email not set. Please complete step 2 first",
      );
    }

    // Generate new OTP
    const otp = helper.generate_random_numeric_code({ length: 6 });
    const _exp = new Date(new Date().getTime() + 60 * 1000).toISOString();

    // Create or update user_secrets with OTP
    if (user.user_secrets) {
      await helper.update_user_secret({
        otp,
        _exp,
        id: user.user_secrets.id,
      });
    } else {
      await prisma.user_secrets.create({
        data: {
          user_id,
          otp,
          otp_expiration: _exp,
        },
      });
    }

    return { otp };
  };
}

module.exports = UserService;

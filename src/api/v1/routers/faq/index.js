/** @format */

const express = require("express");
const verify_token = require("@v1_middlewares/verify_token.middleware");
const validate_request = require("@v1_middlewares/validate_request_joi.middleware");
const user_type_check = require("@api/v1/middlewares/user_type_check.middleware");
const FAQSchema = require("@v1_validations/faq");
const FAQController = require("@api/v1/controllers/faq");

const validations = new FAQSchema();
const controller = new FAQController();

const router = express.Router();

// ========== FAQ ROUTES ==========

// Create FAQ (Admin only)
router.post(
  "/",
  verify_token,
  user_type_check("ADMIN"),
  validate_request(validations.create_faq_schema),
  controller.create_faq
);

// Get All FAQs (Public - no auth required)
router.get(
  "/",
  validate_request(validations.get_all_faqs_schema),
  controller.get_all_faqs
);

module.exports = router;

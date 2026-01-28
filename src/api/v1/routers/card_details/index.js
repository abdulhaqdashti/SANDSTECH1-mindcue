/** @format */

const express = require("express");
const verify_token = require("@v1_middlewares/verify_token.middleware");
const validate_request = require("@v1_middlewares/validate_request_joi.middleware");
const CardDetailsSchema = require("@v1_validations/card_details");
const CardDetailsController = require("@api/v1/controllers/card_details");

const validations = new CardDetailsSchema();
const controller = new CardDetailsController();

const router = express.Router();

// ========== CARD DETAILS ROUTES ==========

// Add Card Detail
router.post(
  "/",
  verify_token,
  validate_request(validations.add_card_detail_schema),
  controller.add_card_detail
);

// Get All Cards
router.get(
  "/",
  verify_token,
  validate_request(validations.get_all_cards_schema),
  controller.get_all_cards
);

// Delete Card
router.delete(
  "/:cardId",
  verify_token,
  validate_request(validations.delete_card_schema),
  controller.delete_card
);

module.exports = router;

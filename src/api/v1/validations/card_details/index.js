/** @format */

const Joi = require("joi");

class CardDetailsSchema {
  // Add Card Detail
  add_card_detail_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({
      cardType: Joi.string()
        .valid("PAYPAL", "GOOGLE_PAY", "APPLE_PAY", "STRIPE", "OTHER")
        .optional()
        .default("STRIPE"),
      cardNumber: Joi.string()
        .pattern(/^[\d\s]{13,19}$/)
        .required()
        .messages({
          "string.pattern.base": "Card number must be 13-19 digits",
        }),
      cardholderName: Joi.string().min(2).max(255).required(),
      expiryMonth: Joi.number().integer().min(1).max(12).required(),
      expiryYear: Joi.number().integer().min(new Date().getFullYear()).required(),
      cvv: Joi.string()
        .pattern(/^\d{3,4}$/)
        .required()
        .messages({
          "string.pattern.base": "CVV must be 3 or 4 digits",
        }),
      brand: Joi.string()
        .valid("VISA", "MASTERCARD", "AMEX", "DISCOVER", "OTHER")
        .optional(),
      isDefault: Joi.boolean().optional().default(false),
      stripeCardId: Joi.string().optional(),
    }),
  });

  // Get All Cards
  get_all_cards_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Delete Card
  delete_card_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({
      cardId: Joi.string().required(),
    }),
    body: Joi.object({}).unknown(true).allow(null),
  });
}

module.exports = CardDetailsSchema;

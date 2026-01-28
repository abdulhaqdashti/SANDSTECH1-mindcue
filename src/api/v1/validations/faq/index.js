/** @format */

const Joi = require("joi");

class FAQSchema {
  // Create FAQ (Admin only)
  create_faq_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({
      question: Joi.string().required(),
      answer: Joi.string().required(),
      order: Joi.number().integer().min(0).optional(),
    }),
  });

  // Get All FAQs
  get_all_faqs_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({}).unknown(true).allow(null),
  });
}

module.exports = FAQSchema;

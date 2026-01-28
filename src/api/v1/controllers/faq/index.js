/** @format */

const FAQService = require("@api/v1/services/faq");
const Responses = require("@constants/responses");

const service = new FAQService();
const responses = new Responses();

class FAQController {
  // Create FAQ (Admin only)
  create_faq = async (req, res, next) => {
    try {
      const { faq } = await service.create_faq({
        data: req.body,
      });

      const response = responses.ok_response(faq, "FAQ created successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get All FAQs
  get_all_faqs = async (req, res, next) => {
    try {
      const data = await service.get_all_faqs();

      const response = responses.ok_response(data, "FAQs fetched successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = FAQController;

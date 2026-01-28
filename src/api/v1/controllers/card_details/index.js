/** @format */

const CardDetailsService = require("@api/v1/services/card_details");
const Responses = require("@constants/responses");

const service = new CardDetailsService();
const responses = new Responses();

class CardDetailsController {
  // Add Card Detail
  add_card_detail = async (req, res, next) => {
    try {
      const { user } = req.user;
      const {
        cardType,
        cardNumber,
        cardholderName,
        expiryMonth,
        expiryYear,
        cvv,
        brand,
        isDefault,
        stripeCardId,
      } = req.body;

      const data = await service.add_card_detail({
        user_id: user.id,
        cardType,
        cardNumber,
        cardholderName,
        expiryMonth,
        expiryYear,
        cvv,
        brand,
        isDefault,
        stripeCardId,
      });

      const response = responses.ok_response(data, "Card added successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get All Cards
  get_all_cards = async (req, res, next) => {
    try {
      const { user } = req.user;

      const data = await service.get_all_cards({
        user_id: user.id,
      });

      const response = responses.ok_response(data, "Cards fetched successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Delete Card
  delete_card = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { cardId } = req.params;

      const data = await service.delete_card({
        cardId,
        user_id: user.id,
      });

      const response = responses.ok_response(data, "Card deleted successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = CardDetailsController;

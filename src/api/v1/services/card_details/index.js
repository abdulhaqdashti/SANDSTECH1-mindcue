/** @format */

const { prisma } = require("@configs/prisma");
const Responses = require("@constants/responses");

const responses = new Responses();

class CardDetailsService {
  // Add Card Detail
  add_card_detail = async ({
    user_id,
    cardType,
    cardNumber,
    cardholderName,
    expiryMonth,
    expiryYear,
    cvv,
    brand,
    isDefault = false,
    stripeCardId,
  }) => {
    // Mask card number - store only last 4 digits
    let maskedCardNumber = null;
    if (cardNumber) {
      // Remove spaces and get last 4 digits
      const cleanedNumber = cardNumber.replace(/\s/g, "");
      if (cleanedNumber.length >= 4) {
        maskedCardNumber = `****${cleanedNumber.slice(-4)}`;
      } else {
        maskedCardNumber = cardNumber;
      }
    }

    // If this is set as default, unset other default cards
    if (isDefault) {
      await prisma.paymentCard.updateMany({
        where: {
          user_id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const card = await prisma.paymentCard.create({
      data: {
        user_id,
        cardType: cardType || "STRIPE",
        cardNumber: maskedCardNumber,
        cardholderName,
        expiryMonth,
        expiryYear,
        cvv, // In production, this should be encrypted
        brand,
        isDefault,
        stripeCardId,
      },
    });

    // Remove CVV from response for security
    const { cvv: _, ...cardResponse } = card;
    return cardResponse;
  };

  // Get All Cards
  get_all_cards = async ({ user_id }) => {
    const cards = await prisma.paymentCard.findMany({
      where: {
        user_id,
      },
      orderBy: [
        { isDefault: "desc" }, // Default cards first
        { createdAt: "desc" }, // Then by newest
      ],
    });

    // Remove CVV from all cards for security
    const cardsWithoutCvv = cards.map((card) => {
      const { cvv: _, ...cardWithoutCvv } = card;
      return cardWithoutCvv;
    });

    return { cards: cardsWithoutCvv };
  };

  // Delete Card
  delete_card = async ({ cardId, user_id }) => {
    // Verify card belongs to user
    const card = await prisma.paymentCard.findFirst({
      where: {
        id: cardId,
        user_id,
      },
    });

    if (!card) {
      throw responses.not_found_response("Card not found");
    }

    await prisma.paymentCard.delete({
      where: {
        id: cardId,
      },
    });

    return { message: "Card deleted successfully" };
  };
}

module.exports = CardDetailsService;

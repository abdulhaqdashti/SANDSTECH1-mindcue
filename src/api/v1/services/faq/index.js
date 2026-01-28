/** @format */

const { prisma } = require("@configs/prisma");
const Responses = require("@constants/responses");

const responses = new Responses();

class FAQService {
  // Create FAQ (Admin only)
  create_faq = async ({ data }) => {
    const faq = await prisma.faq.create({
      data: {
        question: data.question,
        answer: data.answer,
        order: data.order || 0,
      },
    });

    return { faq };
  };

  // Get All FAQs
  get_all_faqs = async () => {
    const faqs = await prisma.faq.findMany({
      orderBy: {
        order: "asc",
      },
    });

    return { faqs };
  };
}

module.exports = FAQService;

/** @format */

const { prisma } = require("@configs/prisma");
const TokenService = require("@api/v1/services/token");
const Responses = require("@constants/responses");

const reponses = new Responses();
const token_service = new TokenService(process.env.JWT_SECRET_KEY);

const verify_token = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    const response = reponses.unauthorized_response(
      "Unauthorized. Cookie not found."
    );
    return res.status(response.status.code).json(response);
  }
  
  // Extract token from "Bearer <token>" format or use directly
  const access_token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7).trim() 
    : authHeader.trim();
  
  const id = token_service.verify_access_token(access_token)?.id;
  if (!id) {
    const response = reponses.session_expired_response("Access Token Expired.");
    return res.status(response.status.code).json(response);
  }

  const user = await prisma.users.findFirst({
    where: { id: `${id}` },
  });

  if (!user) {
    const response = reponses.unauthorized_response("User not found.");
    return res.status(response.status.code).json(response);
  }
  req.user = { user };
  next();
};

module.exports = verify_token;

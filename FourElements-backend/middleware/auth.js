const jwt = require("jsonwebtoken");

const JWT_SECRET = "a1b2c3"; // Use process.env.JWT_SECRET in production

const jwtVerificationMiddleware = {
  before: async (request) => {
    const token = request.event.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      request.event.user = decoded; // Attach decoded token to the event
    } catch (error) {
      console.error("Token verification failed:", error.message);
      throw new Error("Unauthorized: Invalid token");
    }
  },
};

module.exports = { jwtVerificationMiddleware };
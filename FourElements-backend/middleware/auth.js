const jwt = require("jsonwebtoken");

const JWT_SECRET = "a1b2c3"; // Use process.env.JWT_SECRET in production

const generateToken = (userId) => {
  if(!userId) throw new Error("userId is required")
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
};

const verifyToken = (userId, token) => {
  if(!userId || !token) throw new Error("userId and token are required")
  return jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return {verified: false, message: "Invalid token"}
    if (responses.userId !== userId) return {verified: false, message: "userId mismatch"}
    return {verified: true, message: "Token is valid"}
  });
};

export default { generateToken, verifyToken };

// module.exports.generateToken = generateToken;
// module.exports.verifyToken = verifyToken;

// const jwtVerificationMiddleware = {
//   before: async (request) => {
//     const token = request.event.headers.authorization?.replace("Bearer ", "");

//     if (!token) {
//       throw new Error("Unauthorized: No token provided");
//     }

//     try {
//       const decoded = jwt.verify(token, JWT_SECRET);
//       request.event.user = decoded; // Attach decoded token to the event
//     } catch (error) {
//       console.error("Token verification failed:", error.message);
//       throw new Error("Unauthorized: Invalid token");
//     }
//   },
// };

// module.exports = { jwtVerificationMiddleware };
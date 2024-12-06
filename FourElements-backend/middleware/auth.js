import roles from "../services/roles";
const jwt = require("jsonwebtoken");
const JWT_SECRET = "a1b2c3"; // Use process.env.JWT_SECRET in production

const generateToken = (userId) => {
  if(!userId) throw new Error("userId is required")
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
};

const verifyToken = (userId, token) => {
  if(!userId || !token) throw new Error("userId and token are required")
  return jwt.verify(token, JWT_SECRET, (err, response) => {
    if (err) return {verified: false, message: "Invalid token"}
    if (response.userId !== userId) return {verified: false, message: "userId mismatch"}
    return {verified: true, message: "Token is valid"}
  });
};

const authMiddleware = (allowedRoles = []) => ({
  before: async (request) => {
    const { Authorization } = request.event.headers || {};
    const token = Authorization?.replace("Bearer ", "");

    if (!token) {
      throw new Error("Unauthorized: Token and userId are required.");
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { userId, role } = decoded
    if (!allowedRoles.includes(role)) {
      throw new Error(`Forbidden: Access denied for role ${role}`);
    }

    // Attach userId to the request for downstream use
    request.event.authenticatedUserId = userId;
    request.event.userRole = role;
  },
});


export default { generateToken, verifyToken, authMiddleware };
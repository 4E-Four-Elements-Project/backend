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

export default { generateToken, verifyToken };
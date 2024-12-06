import roles from "../services/roles";
const jwt = require("jsonwebtoken");
const JWT_SECRET = "a1b2c3"; // Use process.env.JWT_SECRET in production
import responseHandler from '../responses/index'
const {sendResponse, sendError} = responseHandler

const generateToken = (userId, role) => {
  if(!userId || !role) throw new Error("userId is required")
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "1h" });
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
    const { headers } = request.event || {};
    const token = headers?.authorization?.replace("Bearer ", "");
    console.log('Header: ', headers?.authorization);
    console.log('request', request);
    console.log('token', token);
    
    
    if (!token) return sendError(401, "Unauthorized: Token and userId are required.");

    const decoded = jwt.verify(token, JWT_SECRET);
    const { userId, role } = decoded

    if (!allowedRoles.includes(role)) {
      return sendError(401, `Forbidden: Access denied for role ${role}`);
    }

    // Attach userId to the request for downstream use
    request.event.authenticatedUserId = userId;
    request.event.userRole = role;
  },
});

const guestMiddleWare = () => ({
  before: async (request) => {
    console.log('request: ', request);
    
    const { Authorization } = request.event.headers || {};
    if (!Authorization) {
      request.event.userRole = "guest";
      return;
    }
    console.log('Authorization:', Authorization);
    

    const token = Authorization?.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);
    request.event.authenticatedUserId = decoded.userId;
    request.event.userRole = decoded.role;
  },
});


export default { generateToken, verifyToken, authMiddleware, guestMiddleWare };
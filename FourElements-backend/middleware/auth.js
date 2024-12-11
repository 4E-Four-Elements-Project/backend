import roles from "../services/roles";
const JWT_SECRET = "a1b2c3"; // Use process.env.JWT_SECRET in production
import responseHandler from '../responses/index'
import {SignJWT, jwtVerify} from 'jose'
const {sendResponse, sendError} = responseHandler

const generateToken = async (userId, role) => {
  if(!userId || !role) sendError(500, "userId and role are required")
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  
  return await new SignJWT({ userId, role })
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('1h')
  .sign(secretKey);

}

const verifyToken = (userId, token) => {
  if(!userId || !token) sendError(500, "userId and token are required")
  
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  try {
    const { payload } = jwtVerify(token, secretKey);
    if(payload.userId !== userId) sendError(401, "userId mismatch")
    return {verified: true, message: "Token is valid"}
  } catch (err) {
    return {verified: false, message: "Invalid token"}
  }
  
};

const authMiddleware = (allowedRoles = []) => ({
  before: async (request) => {
    const { headers } = request.event || {};
    const token = headers?.authorization?.replace("Bearer ", "");
    console.log('Header: ', headers?.authorization);
    console.log('request', request);
    console.log('token', token);
    
    
    if (!token) return sendError(401, "Unauthorized: Token and userId are required.");
    try {
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secretKey);

      const { userId, role } = payload;

      if (!allowedRoles.includes(role)) {
        return sendError(401, `Forbidden: Access denied for role ${role}`);
      }

      // Attach userId to the request for downstream use
      request.event.authenticatedUserId = userId;
      request.event.userRole = role;
    } catch (err) {
      console.error("Token verification error:", err);
      return sendError(401, "Unauthorized: Invalid token.");
    }

  },
});

const guestMiddleWare = () => ({
  before: async (request) => {
    console.log("request: ", request);

    const { Authorization } = request.event.headers || {};
    if (!Authorization) {
      request.event.userRole = "guest";
      return;
    }

    console.log("Authorization:", Authorization);

    const token = Authorization?.replace("Bearer ", "");
    try {
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secretKey);

      request.event.authenticatedUserId = payload.userId;
      request.event.userRole = payload.role;
    } catch (err) {
      console.error("Token verification error:", err);
      request.event.userRole = "guest"; // Default to guest on token failure
    }
  },
});


export default { generateToken, verifyToken, authMiddleware, guestMiddleWare };
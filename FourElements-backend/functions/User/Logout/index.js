import responseHandler from '../../../responses/index'
import db from '../../../services/db';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import middy from '@middy/core';
// import validator from '@middy/validator'
// import { transpileSchema } from '@middy/validator/transpile'
// import httpErrorHandler from '@middy/http-error-handler'
import { jwtVerify } from "jose"; // Import jwtVerify

const JWT_SECRET = "a1b2c3"; // Replace with process.env.JWT_SECRET in production
const {sendResponse, sendError} = responseHandler

async function logout (event) {
    // Extract userId from token    
    const authorizationHeader = event.headers?.authorization;
    console.log('authorizationHeader: ', authorizationHeader);
    
    const token = authorizationHeader?.replace("Bearer ", "");
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    
    if (token) {
      try {
        const { payload } = await jwtVerify(token, secretKey);
        console.log('payload', payload);
        
        const userId = payload?.userId;
        const params = {
            TableName: "UsersTable",
            Key: {
                userId: userId
            },
            UpdateExpression: "REMOVE tokens",
            ReturnValues: "UPDATED_NEW"
        }
    
        try{
            await db.send(new UpdateCommand(params))
            return sendResponse("User logged out successfully")
        } catch (error) {
            console.error('Error logging out:', error)
            return sendError(500, "Failed to logout user")
        }

      } catch (err) {
        console.error("Token verification error:", err);
        return sendError(401, "Unauthorized: Invalid token.");
      }
    }
}

export const handler = middy(logout)
//   .use(validator({ eventSchema: transpileSchema(schema) }))
//   .use(httpErrorHandler())
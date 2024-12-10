import responseHandler from '../../../responses/index'
import db from '../../../services/db';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import middy from '@middy/core';
// import validator from '@middy/validator'
// import { transpileSchema } from '@middy/validator/transpile'
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler'
import auth from '../../../middleware/auth';
import getUser from '../../../middleware/getUserDetails';

const {sendResponse, sendError} = responseHandler
const { verifyToken } = auth;

async function logout(event){
    const {username, token} = event.body;

    if(!username || !token) return sendError(400, "Username and token are required")
    
    const foundUser = await getUser(username)
    if(!foundUser) return sendError(400, "User not found")
    console.log('foundUser: ', foundUser);
    console.log('foundUser.userId: ', foundUser.userId.S);

    const userId = foundUser.userId?.S
    const storedToked = foundUser.tokens?.S
    console.log('storedToken: ', storedToked);
    console.log('token: ', token);
    
    
    if(storedToked !== token) return sendError(400, "Token mismatch")
    
    // const verificationResponse = verifyToken(foundUser.userId.S, token)
    // if(!verificationResponse.verified) return sendError(400, verificationResponse.message)
    

    // const tokens = foundUser.tokens?.L.map(item => item.S) || []
    // console.log('extracted tokens: ', tokens);
    
    // if(!tokens.includes(token)) return sendError(400, "Token not found")
    
    // const tokenArray = tokens.filter(currToken => currToken !== token)

    const params = {
        TableName: "UsersTable",
        Key: {
            userId: userId
        },
        UpdateExpression: "REMOVE tokens",
        // ExpressionAttributeValues: {
        //     ":tokens": tokenArray.map(token => ({S: token}))
        // },
        ReturnValues: "UPDATED_NEW"
    }

    try{
        await db.send(new UpdateCommand(params))
        return sendResponse("User logged out successfully")
    } catch (error) {
        console.error('Error logging out:', error)
        return sendError(500, "Failed to logout user")
    }
}

// const schema = {
//     type: 'object',
//     properties: {
//         body: {
//             type: 'object',
//             properties: {
//                 username: { type: 'string', minLength: 4 },
//                 token: { type: 'string', minLength: 10 },
//             },
//             required: ['username', 'token'],
//         },
//     },
// }

export const handler = middy(logout)
  .use(jsonBodyParser())
//   .use(validator({ eventSchema: transpileSchema(schema) }))
  .use(httpErrorHandler())
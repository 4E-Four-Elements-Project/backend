import responseHandler from '../../../responses/index'
const {sendResponse, sendError} = responseHandler
import middy from '@middy/core';
import auth from '../../../middleware/auth';
const { verifyToken } = auth;
import getUserId from '../../../middleware/getUserId';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import jsonBodyParser from '@middy/http-json-body-parser';
import db from '../../../services/db';


async function logout(event){
    const {username, token} = event.body;
    console.log('event: ', event);
    console.log('username: ', username);
    console.log('token: ', token);
    
    
    if(!username || !token) return sendError(400, "Username and token are required")
    
    const foundUser = await getUserId(username)
    console.log('foundUser: ', foundUser);
    console.log('foundUser.userId: ', foundUser.userId.S);
    
    const verificationResponse = verifyToken(foundUser.userId.S, token)
    if(!verificationResponse.verified) return sendError(400, verificationResponse.message)
    
    
    if(!foundUser) return sendError(400, "User not found")

    const tokens = foundUser.tokens?.L.map(item => item.S) || []
    console.log('extracted tokens: ', tokens);
    
    if(!tokens.includes(token)) return sendError(400, "Token not found")
    
    const tokenArray = tokens.filter(currToken => currToken !== token)

    const params = {
        TableName: "UsersTable",
        Key: {
            userId: foundUser.userId.S
        },
        UpdateExpression: "SET tokens = :tokens",
        ExpressionAttributeValues: {
            ":tokens": tokenArray.map(token => ({S: token}))
        },
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

module.exports.handler = middy(logout)
  .use(jsonBodyParser())
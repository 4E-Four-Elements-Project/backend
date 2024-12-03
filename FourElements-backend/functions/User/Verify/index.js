import responseHandler from '../../../responses/index'
const {sendResponse, sendError} = responseHandler
import middy from '@middy/core';
import auth from '../../../middleware/auth';
const { verifyToken } = auth;
import getUserId from '../../../middleware/getUserId';

async function verify(userId, token){
    if(!userId || !token) return sendError(400, "Username and token are required")

    const verificationResponse = verifyToken(userId, token)
    if(!verificationResponse.verified) return sendError(400, verificationResponse.message)
    
    const foundUser = await getUserId(username)
    if(!foundUser) return sendError(400, "User not found")
    if(!foundUser.tokens.includes(token)) return sendError(400, "Token not found")
    
    return sendResponse('Successfull verification of token')
}

module.exports.handler = middy(verify)
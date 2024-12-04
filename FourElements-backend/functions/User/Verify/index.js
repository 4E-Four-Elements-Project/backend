import responseHandler from '../../../responses/index'
const {sendResponse, sendError} = responseHandler
import middy from '@middy/core';
import auth from '../../../middleware/auth';
const { verifyToken } = auth;
import getUserId from '../../../middleware/getUserId';
import jsonBodyParser from '@middy/http-json-body-parser';

async function verify(event){

    const {username, token} = event.body;

    if(!username || !token) return sendError(400, "Username and token are required")

    const foundUser = await getUserId(username)
    // console.log('foundUserResult: ', foundUserResult);
    if (!foundUser) {
        return sendError(400, "User not found");
    }
    // const foundUser = foundUserResult.Items[0]
    console.log('foundUser: ', foundUser);
    
    const userId = foundUser.userId.S
    const tokens = foundUser.tokens?.L?.map(item => item.S) || []
    if (!tokens.includes(token)) {
        return sendError(400, "Token not found");
    }

    const verificationResponse = verifyToken(userId, token)
    if(!verificationResponse.verified) return sendError(400, verificationResponse.message)
    
    return sendResponse('Successfull verification of token')
}

module.exports.handler = middy(verify)
    .use(jsonBodyParser())
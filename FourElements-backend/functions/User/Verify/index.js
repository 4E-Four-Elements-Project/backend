import responseHandler from '../../../responses/index'
import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import validator from '@middy/validator'
import { transpileSchema } from '@middy/validator/transpile'
import httpErrorHandler from '@middy/http-error-handler'
import auth from '../../../middleware/auth';
import getUser from '../../../middleware/getUserDetails';

const {sendResponse, sendError} = responseHandler
const { verifyToken } = auth;

async function verify(event){

    //Get the username and token from the event body
    const {username, token} = event.body;

    //Error message if either username or token is missing
    if(!username || !token) return sendError(400, "Username and token are required")

    //Check the database to see if user exist in database and save details in variable
    const foundUser = await getUser(username)

    //Error message if user isn't in database
    if (!foundUser) {
        return sendError(400, "User not found");
    }
    
    //If user is found save user details in variables
    const userId = foundUser.userId.S
    const tokens = foundUser.tokens?.L?.map(item => item.S) || []
    if (!tokens.includes(token)) {
        return sendError(400, "Token not found");
    }

    //Verify that the token is valid
    const verificationResponse = verifyToken(userId, token)

    //Error message if token isn't valid
    if(!verificationResponse.verified) return sendError(400, verificationResponse.message)
    
    //Success message if token is valid
    return sendResponse('Successfull verification of token')
}

const schema = {
    type: 'object',
    properties: {
        body: {
            type: 'object',
            properties: {
                username: { type: 'string', minLength: 4 },
                token: { type: 'string', minLength: 10 },
            },
            required: ['username', 'token'],
        },
    },
}

module.exports.handler = middy(verify)
    .use(jsonBodyParser())
    .use(validator({ eventSchema: transpileSchema(schema) }))
    .use(httpErrorHandler())
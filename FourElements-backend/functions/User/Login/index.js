import responseHandler from '../../../responses/index'
import db from '../../../services/db';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import hash from '../../../middleware/hash'
import auth from '../../../middleware/auth';
import getUser from '../../../middleware/getUserDetails';
import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';

const { comparePassword } = hash
const { sendResponse, sendError } = responseHandler
const { generateToken } = auth;

async function loginHandler(event) {

    const {username, password} = event.body;
    
    //Check that the required parameters is in body
    if (!username || !password) {
        sendError(400, "Username and password are required")
    }

    try {
        //Check if user exist in database and save user details
        const user = await getUser(username)
        const userId = user?.userId.S
        const hashedPassword = user?.password?.S
        const role = user?.role?.S

        //Check if input password is a match to hashedpassword in database
        const passwordMatch = await comparePassword(password, hashedPassword)
        if(!passwordMatch) {
            return sendError(401, "Invalid password")
        }

        //Generate token valid for 1h
        const token = generateToken(userId, role)        
        if(!token) return sendError(500, "Failed to generate token")
        
        //Save token in array
        const tokenArray = user?.tokens.L || []
        tokenArray.push(token)

        //Params for database
        const params = {
            TableName: "UsersTable",
            Key: {
                userId: userId
            },
            UpdateExpression: "SET tokens = :value",
            ExpressionAttributeValues: {
                ":value": tokenArray
            },
            ReturnValues: "UPDATED_NEW"
        }
        
        //Format response
        const response = {
            userId: userId,
            username: username,
            token: token,
            role: role
        }

        //Update the database
        await db.send(new UpdateCommand(params))
        return sendResponse(`User logged in successfully, token: ${response.token}`)
    } catch (error) {
        console.error('Error logging in:', error)
        return sendError(500, "Failed to login user")
    }

}

module.exports.handler = middy(loginHandler)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
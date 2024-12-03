import hash from '../../../middleware/hash'
const {comparePassword} = hash
import db from '../../../services/db';
import responseHandler from '../../../responses/index'
const {sendResponse, sendError} = responseHandler
import getUserId from '../../../middleware/getUserId';
import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import auth from '../../../middleware/auth';
const { generateToken, verifyToken } = auth;
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'

async function loginHandler(event) {

    const {username, password} = event.body;
    
    //Check that the required parameters is in body
    if (!username || !password) {
        sendError(400, "Username and password are required")
    }
    // console.log(username, password);

    //Get the user info from the database
    const user = await getUserId(username)
    if (!user) {
        return sendError(404, "User not found")
    }

    //Save userId and hashedpassword check if the provided password is correct
    const userId = user.userId.S
    const hashedPassword = user.password?.S
    // console.log('user:', user)
    // console.log('userId: ', userId);
    // console.log('hashedPassword: ', hashedPassword);

    //Check if password input and stored hashedpassword is a match
    const passwordMatch = await comparePassword(password, hashedPassword)
    if(!passwordMatch) {
        return sendError(401, "Invalid password")
    }

    //Generate token that encapsulates userId
    const token = generateToken(userId)
    if(!token) return sendError(500, "Failed to generate token")
    console.log('token: ', token);

    const tokenArray = user.tokens?.L.map || []
    tokenArray.push(token)
    const params = {
        TableName: "LoginTable",
        Key: {
            userId: userId
        },
        UpdateExpression: "SET tokens = :tokens",
        ExpressionAttributeValues: {
            ":tokens": tokenArray
        },
        ReturnValues: "UPDATED_NEW"
    }
    console.log('tokenArray: ', tokenArray);
    
    console.log('params: ', params);
    

    const response = {
        userId: userId,
        username: username,
        token: token
    }

    console.log('response: ', response);
    
    try{
        await db.send(new UpdateCommand(params))
        return sendResponse("User logged in successfully", response)
    } catch (error) {
        console.error('Error logging in:', error)
        return sendError(500, "Failed to login user")
    }

}

module.exports.handler = middy(loginHandler)
  .use(jsonBodyParser())
import hash from '../../../middleware/hash'
const {comparePassword} = hash
import db from '../../../services/db';
import responseHandler from '../../../responses/index'
const {sendResponse, sendError} = responseHandler
import getUserId from '../../../middleware/getUserId';
import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';

async function loginHandler(event) {

    const {username, password} = event.body;
    
    if (!username || !password) {
        sendError(400, "Username and password are required")
    }
    console.log(username, password);

    const user = await getUserId(username)
    if (!user) {
        return sendError(404, "User not found")
    }

    const userId = user.userId.S
    const hashedPassword = user.password?.S
    console.log('user:', user)
    console.log('userId: ', userId);
    console.log('hashedPassword: ', hashedPassword);

    const passwordMatch = await comparePassword(password, hashedPassword)
    if(!passwordMatch) {
        return sendError(401, "Invalid password")
    }
    return sendResponse('Login successful');

}

module.exports.handler = middy(loginHandler)
  .use(jsonBodyParser())
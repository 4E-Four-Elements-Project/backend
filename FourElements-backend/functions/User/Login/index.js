import {comparePassword} from '../../../middleware/hash'
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

    const userId = await getUserId(username)
    if (!userId) {
        return sendError(404, "User not found")
    }
    console.log('userId:', userId)
    return sendResponse(userId);

}

module.exports.handler = middy(loginHandler)
  .use(jsonBodyParser())
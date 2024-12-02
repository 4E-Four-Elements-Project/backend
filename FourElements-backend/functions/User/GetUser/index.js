import responseHandler from '../../../responses/index'
const {sendResponse, sendError} = responseHandler
import db from '../../../services/db'
import middy from '@middy/core'
// import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import { GetCommand } from '@aws-sdk/lib-dynamodb'

const TABLE_NAME = "UsersTable";

const getUserHandler = async (event) => {
  console.log('event:', event);
  
  try {
    const userId = event.pathParameters.userId
    console.log('userId: ', userId);
    
    const params = {
    TableName: TABLE_NAME,
    Key: { userId: userId },
  };
  console.log('params: ', params);
  

  const result = await db.send(new GetCommand(params));
  console.log('result: ', result);
  
  if (!result.Item) {
    sendError(404, "User not found");
  }

  sendResponse({ user: result.Item });

  } catch (error) {
    console.error("Error fetching user:", error);
    sendError(500, "Failed to fetch user");
  };
}

module.exports.handler = middy(getUserHandler)
  .use(httpErrorHandler())

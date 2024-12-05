import responseHandler from '../../../responses/index'
import db from '../../../services/db'
import { ScanCommand } from '@aws-sdk/client-dynamodb'
import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import validator from '@middy/validator'
import { transpileSchema } from '@middy/validator/transpile'

const { sendResponse, sendError } = responseHandler

const getUserHandler = async (event) => {
  
  try {
    //Get the userId from the path parameter
    const userId = event.pathParameters?.userId
    if (!userId) {
      return sendError(400, "Missing userId in request");
    }

    //Save params for database
    const params = {
      TableName: "UsersTable",
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": {S: userId},
      },
    };
    
    //Save result
    const result = await db.send(new ScanCommand(params));
    if (!result || !result?.Items || result.Items.length === 0) {
      return sendError(404, "User not found");
    }
    
    //Return result
    return sendResponse(result.Items);

  } catch (error) {
    console.error("Error fetching user:", error);
    return sendError(500, "Failed to fetch user");
  };
}

const schema = {
  type: 'object',
  properties: {
    pathParameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', minLength: 10 },
      },
      required: ['userId'],
    },
  },
}

module.exports.handler = middy(getUserHandler)
  .use(httpErrorHandler())
  .use(validator({ eventSchema: transpileSchema(schema) }))
  .use(httpErrorHandler())

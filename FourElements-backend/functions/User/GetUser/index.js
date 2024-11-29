import responseHandler from '../../../responses/index'
const {sendResponse, sendError} = responseHandler
import db from '../../../services/db'
import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import { ScanCommand } from '@aws-sdk/client-dynamodb'

const TABLE_NAME = "UsersTable";

const getUserHandler = async (event) => {
  
  try {
    const userId = event.pathParameters?.userId
    if (!userId) {
      return sendError(400, "Missing userId in request");
    }

    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": {S: userId},
      },
    
  };
  
  console.log("Scan parameters:", JSON.stringify(params, null, 2));
  
  const result = await db.send(new ScanCommand(params));

  console.log("ScanCommand result:", JSON.stringify(result, null, 2));
  console.log("ScanCommand result metadata:", JSON.stringify(result.$metadata, null, 2));

  if (!result || !result?.Items || result.Items.length === 0) {
    return sendError(404, "User not found");
  }
 
  return sendResponse(result.Items);

  } catch (error) {
    console.error("Error fetching user:", error);
    return sendError(500, "Failed to fetch user");
  };
}

module.exports.handler = middy(getUserHandler)
  .use(httpErrorHandler())

import responseHandler from '../../../responses/index';
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";


export const handler = async (event) => {
  try {
    const { orderId } = event.pathParameters;
    const { userId } = JSON.parse(event.body || "{}");

    if (!orderId || !userId) {
      return sendError(400, "Invalid input: 'orderId' and 'userId' is required.");
    }

   
    // const key = { orderId };
    // if (userId) {
    //   key.userId = userId;       
    // }

    // console.log('key: ', key, 'oderId: ', orderId, 'userId: ', userId);
    
    
    const deleteParams = {
      TableName: "OrderTable",
      Key: {orderId, userId},
      ConditionExpression: "attribute_exists(orderId)", 
    };
    console.log('deleteParams: ', deleteParams);;
    

    await db.send(new DeleteCommand(deleteParams));

    return sendResponse({
      message: `Order item '${orderId}' for user ${userId} deleted successfully.`,
    });
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      console.error("Order item does not exist:", error);
      return sendError(404, `Order item with orderId '${event.pathParameters.orderId}' does not exist.`);
    }

    console.error("Error deleting order item:", error);
    return sendError(500, error.message || "Error deleting order item");
  }
};

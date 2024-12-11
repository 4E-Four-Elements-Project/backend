import responseHandler from '../../../responses/index';
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";


export const handler = async (event) => {
  try {
    console.log(event.body);
    const orderId = JSON.parse(event.body).orderId;
    
    if (!orderId) {
      return sendError(400, "Invalid input: 'orderId' is required.");
    }

    //Query the order to get the userId
    const orderQueryParams = {
      TableName: "OrderTable",
      KeyConditionExpression: "orderId = :orderId",
      ExpressionAttributeValues: {
        ":orderId": orderId,
      },
    };

    const queryResult = await db.send(new QueryCommand(orderQueryParams));
    const item = queryResult.Items?.[0];

    if(!item) {
      return sendError(404, `Order with orderId '${orderId}' does not exist.`);
    }

    const {userId} = item
    
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

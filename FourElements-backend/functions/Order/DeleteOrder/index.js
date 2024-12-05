import responseHandler from '../../../responses/index';
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
  try {
    const { orderId } = event.pathParameters;
    const { userId } = JSON.parse(event.body || "{}");

    if (!orderId) {
      return sendError(400, "Invalid input: 'orderId' is required.");
    }

    const key = { orderId };
    if (userId) {
      key.userId = userId; 
    }

    const deleteParams = {
      TableName: "OrderTable",
      Key: key,
      ConditionExpression: "attribute_exists(orderId)", 
    };

    await db.send(new DeleteCommand(deleteParams));

    return sendResponse({
      message: `Order item '${orderId}' deleted successfully.`,
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

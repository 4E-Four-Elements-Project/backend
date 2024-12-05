import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index";
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";

export const handler = async (event) => {
  try {
    const orderId = event.pathParameters.orderId;

    // Validate input
    if (!orderId) {
      return sendError(400, "Invalid input: 'orderId' is required.");
    }

    // Query all items in the cart
    const queryParams = {
      TableName: "OrderTable",
      KeyConditionExpression: "orderId = :orderId",
      ExpressionAttributeValues: {
        ":orderId": orderId,
      },
    };

    const result = await db.send(new QueryCommand(queryParams));

    return sendResponse({
      message: "Order items fetched successfully.",
      orderId,
      "Order details": result.Items,
    });
  } catch (error) {
    console.error("Error fetching order items:", error);
    return sendError(500, error.message || "Error fetching order items");
  }
};

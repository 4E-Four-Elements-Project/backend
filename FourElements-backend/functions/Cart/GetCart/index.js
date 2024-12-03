import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index";
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";

export const handler = async (event) => {
  try {
    const cartId = event.pathParameters.cartId;

    // Validate input
    if (!cartId) {
      return sendError(400, "Invalid input: 'cartId' is required.");
    }

    // Query all items in the cart
    const queryParams = {
      TableName: "CartTable",
      KeyConditionExpression: "cartId = :cartId",
      ExpressionAttributeValues: {
        ":cartId": cartId,
      },
    };

    const result = await db.send(new QueryCommand(queryParams));

    return sendResponse({
      cartId,
      items: result.Items,
    });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return sendError(500, error.message || "Error fetching cart items");
  }
};

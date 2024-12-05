import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index.js";
import db from "../../../services/db.js";

const { sendResponse, sendError } = responseHandler;

export const handler = async (event) => {
  try {
    const orderId = event.pathParameters.orderId;
    const { menuId, quantity, price, userId = "guest", comment, orderLocked } = JSON.parse(event.body);

    // Validate required fields
    if (!orderId || !menuId || price === undefined || quantity === undefined) {
      return sendError(400, "Invalid input: 'orderId', 'menuId', 'price', and 'quantity' are required.");
    }

    // Validate quantity and price
    if (typeof quantity !== "number" || quantity <= 0) {
      return sendError(400, "Invalid input: 'quantity' must be a positive number.");
    }
    if (typeof price !== "number" || price <= 0) {
      return sendError(400, "Invalid input: 'price' must be a positive number.");
    }

    // Initialize UpdateExpression and related variables
    let updateExpression = "SET";
    const expressionAttributeValues = {};
    const expressionAttributeNames = {}; // Ensure this is initialized

    if (price !== undefined) {
      updateExpression += " price = :price,";
      expressionAttributeValues[":price"] = price;
    }

    if (quantity !== undefined) {
      updateExpression += " quantity = :quantity,";
      expressionAttributeValues[":quantity"] = quantity;
    }

    if (comment !== undefined) {
      updateExpression += " #comment = :comment,"; // Use alias for reserved keyword
      expressionAttributeValues[":comment"] = comment;
      expressionAttributeNames["#comment"] = "comment"; // Define the alias
    }

    if (orderLocked !== undefined) {
      updateExpression += " orderLocked = :orderLocked,";
      expressionAttributeValues[":orderLocked"] = orderLocked;
    }

    // Remove trailing comma
    updateExpression = updateExpression.slice(0, -1);

    // Restrict updates if orderLocked is already true
    const updateParams = {
      TableName: "OrderTable",
      Key: {
        orderId,
        userId,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: {
        ...expressionAttributeValues,
        ":locked": false, // Ensure the order is not locked
      },
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length ? expressionAttributeNames : undefined,
      ConditionExpression: "attribute_exists(orderId) AND attribute_exists(userId) AND orderLocked = :locked",
    };

    console.log("Updating order with params:", updateParams);

    // Execute update operation
    await db.send(new UpdateCommand(updateParams));

    return sendResponse({
      message: `Order with orderId '${orderId}' updated successfully.`,
    });
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return sendError(403, `Order with orderId '${event.pathParameters.orderId}' is locked and cannot be updated.`);
    }

    console.error("Error updating order:", error);
    return sendError(500, error.message || "Error updating order.");
  }
};

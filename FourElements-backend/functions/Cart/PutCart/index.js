import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index.js";
import db from "../../../services/db.js";

const { sendResponse, sendError } = responseHandler;

export const handler = async (event) => {
  try {
    const cartId = event.pathParameters.cartId;
    const { menuId, quantity, price } = JSON.parse(event.body);

    if (!cartId || !menuId || quantity === undefined) {
      return sendError(400, "Invalid input: 'cartId', 'menuId', and 'quantity' are required.");
    }
    if (price === undefined) {
      return sendError(400, "Invalid input:'price' is required.");
    }

    let updateExpression = "SET";
    const expressionAttributeValues = {};

    if (price !== undefined) {
      updateExpression += " price = :price,";
      expressionAttributeValues[":price"] = price;
    }

    if (quantity !== undefined) {
      updateExpression += " quantity = :quantity,";
      expressionAttributeValues[":quantity"] = quantity;
    }

    // Remove trailing comma
    updateExpression = updateExpression.slice(0, -1);
    
    const updateParams = {
      TableName: "CartTable",
      Key: {
        cartId,
        menuId,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: "attribute_exists(cartId) AND attribute_exists(menuId)",
    };

    await db.send(new UpdateCommand(updateParams));

    return sendResponse({
      message: `Item with menuId '${menuId}' updated successfully in cart '${cartId}'.`,
    });
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return sendError(404, `Item with menuId '${menuId}' not found in cart '${cartId}'.`);
    }

    console.error("Error updating item in cart:", error);
    return sendError(500, error.message || "Error updating item in cart");
  }
};

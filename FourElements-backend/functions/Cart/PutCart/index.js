import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index.js";
import db from "../../../services/db.js";

const { sendResponse, sendError } = responseHandler;

export const handler = async (event) => {
  try {
    const cartId = event.pathParameters.cartId;
    const { menuId, quantity } = JSON.parse(event.body);

    if (!cartId || !menuId || quantity === undefined) {
      return sendError(400, "Invalid input: 'cartId', 'menuId', and 'quantity' are required.");
    }

    const updateParams = {
      TableName: "CartTable",
      Key: {
        cartId,
        menuId,
      },
      UpdateExpression: "SET quantity = :quantity",
      ExpressionAttributeValues: {
        ":quantity": quantity,
      },
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

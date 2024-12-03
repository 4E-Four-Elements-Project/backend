import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index.js";
import db from "../../../services/db.js";

const { sendResponse, sendError } = responseHandler;

export const handler = async (event) => {
  try {
    const cartId = event.pathParameters.cartId;
    const { menuId } = JSON.parse(event.body);

    console.log("Delete Request Params:", { cartId, menuId });

    if (!cartId || !menuId) {
      console.error("Validation Error: Missing cartId or menuId");
      return sendError(400, "Invalid input: 'cartId' and 'menuId' are required.");
    }

    const deleteParams = {
      TableName: "CartTable",
      Key: {
        cartId, // Partition key
        menuId, // Sort key
      },
      ConditionExpression: "attribute_exists(menuId)", // Ensure the item exists
    };

    console.log("Delete Params:", deleteParams);

    await db.send(new DeleteCommand(deleteParams));

    return sendResponse({
      message: `Item with menuId '${menuId}' deleted successfully from cart '${cartId}'.`,
    });
  } catch (error) {
    console.error("Error deleting item from cart:", error);

    if (error.name === "ConditionalCheckFailedException") {
      return sendError(404, `Item with menuId '${menuId}' not found in cart '${cartId}'.`);
    }

    return sendError(500, "Oh my.. something went terribly wrong!");
  }
};

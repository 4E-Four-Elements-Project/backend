import { DeleteCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index.js";
import db from "../../../services/db.js";

const { sendResponse, sendError } = responseHandler;

export const handler = async (event) => {
  try {
    const cartId = event.pathParameters.cartId;
    const { menuId } = JSON.parse(event.body);

    console.log("Delete Request Params:", { cartId, menuId });

    if (!cartId) {
      console.error("Validation Error: Missing cartId");
      return sendError(400, "Invalid input: 'cartId' is required.");
    }

    // Retrieve the menu item to get the ingredients
    const menuParams = {
      TableName: "MenuTable",
      Key: { menuId },
    };

    const menuResult = await db.send(new GetCommand(menuParams));
    if (!menuResult.Item) {
      return sendError(404, `Menu item with menuId '${menuId}' not found.`);
    }

    const menuItem = menuResult.Item;

    // Restore inventory for each ingredient
    for (const ingredient of menuItem.ingredients) {
      const updateParams = {
        TableName: "InventoryTable",
        Key: { inventoryId: ingredient },
        UpdateExpression: "SET quantity = quantity + :increment",
        ExpressionAttributeValues: {
          ":increment": 1, // Adjust as per recipe requirements
        },
        ReturnValues: "UPDATED_NEW",
      };

      try {
        await db.send(new UpdateCommand(updateParams));
      } catch (error) {
        console.error(`Error updating inventory for ingredient '${ingredient}':`, error);
        throw new Error(`Failed to update inventory for ingredient '${ingredient}'.`);
      }
    }

    //Delete cart item
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

import responseHandler from '../../../responses/index';
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
  try {
    // Extract the inventoryId from the path parameters
    const { inventoryId } = event.pathParameters;

    if (!inventoryId) {
      return sendError(400, "Missing inventoryId in request");
    }

    const deleteItemParams = {
      TableName: "InventoryTable",
      Key: {
        inventoryId, 
      },
      ConditionExpression: "attribute_exists(inventoryId)",
    };

    await db.send(new DeleteCommand(deleteItemParams));

    return sendResponse({ message: `Item with inventoryId ${inventoryId} deleted successfully!` });
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      console.error("Item does not exist:", error);
      return sendError(404, "Item not found in inventory.");
    }

    console.error("Error deleting inventory item:", error);
    return sendError(500, error.message || "Error deleting inventory item");
  }
};

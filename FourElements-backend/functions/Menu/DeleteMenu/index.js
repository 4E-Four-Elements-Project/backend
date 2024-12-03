import responseHandler from '../../../responses/index';
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
  try {
    const { menuId } = event.pathParameters;

    if (!menuId) {
      return sendError(400, "Invalid input: 'menuId' is required.");
    }

    const deleteParams = {
      TableName: "MenuTable",
      Key: { menuId },
      ConditionExpression: "attribute_exists(menuId)", 
    };

    await db.send(new DeleteCommand(deleteParams));

    return sendResponse({
      message: `Menu item '${menuId}' deleted successfully.`,
    });
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      console.error("Menu item does not exist:", error);
      return sendError(404, `Menu item with menuId '${event.pathParameters.menuId}' does not exist.`);
    }

    console.error("Error deleting menu item:", error);
    return sendError(500, error.message || "Error deleting menu item");
  }
};

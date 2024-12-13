import responseHandler from '../../../responses/index';
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import auth from '../../../middleware/auth';
const { authMiddleware} = auth
import httpErrorHandler from '@middy/http-error-handler';
import roles from '../../../services/roles';

const deleteMenuHandler = async (event) => {
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
    // return sendError(500, error.message || "Error deleting menu item");
    return sendError(500, "Error deleting menu item");
  }
};

export const handler = middy(deleteMenuHandler)
  .use(authMiddleware(["staff"])) // Only allow staff role
  .use(httpErrorHandler());
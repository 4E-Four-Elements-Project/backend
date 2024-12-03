import responseHandler from '../../../responses/index';
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { menuId, ingredients } = body;

    // Validate input
    if (!menuId || !ingredients || !Array.isArray(ingredients)) {
      return sendError(400, "Invalid input: 'menuId' and 'ingredients' are required. 'ingredients' must be an array.");
    }

    const updateParams = {
      TableName: "MenuTable",
      Key: { menuId }, 
      UpdateExpression: "SET ingredients = :ingredients",
      ExpressionAttributeValues: {
        ":ingredients": ingredients,
      },
      ConditionExpression: "attribute_exists(menuId)", 
      ReturnValues: "UPDATED_NEW", 
    };

    const result = await db.send(new UpdateCommand(updateParams));

    return sendResponse({
      message: `Menu item '${menuId}' updated successfully.`,
      updatedAttributes: result.Attributes,
    });
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      console.error("Menu item does not exist:", error);
      return sendError(404, `Menu item with menuId '${body.menuId}' does not exist.`);
    }

    console.error("Error updating menu item:", error);
    return sendError(500, error.message || "Error updating menu item");
  }
};

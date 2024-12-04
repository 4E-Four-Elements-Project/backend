import responseHandler from '../../../responses/index';
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { menuId, price, category, description, ingredients } = body;

    if (!menuId || !price || !category || !description || !ingredients || !Array.isArray(ingredients)) {
      return sendError(400, "Invalid input: 'menuId', 'price', 'category', 'ingredients' are required. 'ingredients' must be an array.");
    }

    const newMenuItem = {
      menuId,
      price,
      category,
      description,
      ingredients,
    };

    const params = {
      TableName: "MenuTable",
      Item: newMenuItem,
      ConditionExpression: "attribute_not_exists(menuId)", 
    };

    await db.send(new PutCommand(params));

    return sendResponse({ message: `Menu item '${menuId}' added successfully!`, menuItem: newMenuItem });
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      console.error("Menu item already exists:", error);
      return sendError(409, `Menu item with menuId '${JSON.parse(event.body).menuId}' already exists.`);
    }

    console.error("Error adding menu item:", error);
    return sendError(500, error.message || "Error adding menu item");
  }
};

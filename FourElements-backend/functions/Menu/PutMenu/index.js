import responseHandler from '../../../responses/index';
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { menuId, price, category, description, ingredients } = body;

    // Validate input
    if (!menuId) {
      return sendError(400, "Invalid input: 'menuId' is required.");
    }

    if (!price && !category && !description && !ingredients) {
      return sendError(400, "Invalid input: At least one field ('price', 'category', 'description', 'ingredients') must be provided for update.");
    }

    let updateExpression = "SET";
    const expressionAttributeValues = {};

    if (price !== undefined) {
      updateExpression += " price = :price,";
      expressionAttributeValues[":price"] = price;
    }

    if (category !== undefined) {
      updateExpression += " category = :category,";
      expressionAttributeValues[":category"] = category;
    }

    if (description !== undefined) {
      updateExpression += " description = :description,";
      expressionAttributeValues[":description"] = description;
    }

    if (ingredients !== undefined) {
      if (!Array.isArray(ingredients)) {
        return sendError(400, "Invalid input: 'ingredients' must be an array.");
      }
      updateExpression += " ingredients = :ingredients,";
      expressionAttributeValues[":ingredients"] = ingredients;
    }

    // Remove trailing comma
    updateExpression = updateExpression.slice(0, -1);

    const updateParams = {
      TableName: "MenuTable",
      Key: { menuId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: "attribute_exists(menuId)", 
      ReturnValues: "UPDATED_NEW", // Return only the updated attributes
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

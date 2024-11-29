import responseHandler from '../../../responses/index'
const {sendResponse, sendError} = responseHandler
import db from "../../../services/db";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { item, quantity = 0 } = body;

    const allowedItems = ["salad", "meat", "sauce", "soup"];
    if (!allowedItems.includes(item)) {
      return sendError(400, `Invalid item. Allowed items: ${allowedItems.join(", ")}`);
    }

    const addItemParams = {
      TableName: "InventoryTable",
      Item: {
        inventoryId: item,
        quantity,
      },
      ConditionExpression: "attribute_not_exists(inventoryId)",
    };

    await db.send(new PutCommand(addItemParams));

    return sendResponse({ message: `${item} added successfully!` });
  } catch (error) {
    console.error("Error processing inventory:", error);
    return sendError(500, error.message || "Error processing inventory");
  }
};
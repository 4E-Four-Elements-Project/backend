import responseHandler from '../../../responses/index';
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import auth from '../../../middleware/auth';
const { authMiddleware} = auth
import httpErrorHandler from '@middy/http-error-handler';
import roles from '../../../services/roles';

const putInventoryHandler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { item: inventoryId, quantity } = body;

    if (!inventoryId || quantity === undefined) {
      return sendError(400, "Missing required fields: inventoryId and/or quantity");
    }

    const updateItemParams = {
      TableName: "InventoryTable",
      Key: { inventoryId }, 
      UpdateExpression: "SET quantity = :quantity",
      ExpressionAttributeValues: {
        ":quantity": quantity,
      },
      ConditionExpression: "attribute_exists(inventoryId)", 
      ReturnValues: "UPDATED_NEW", 
    };

    const result = await db.send(new UpdateCommand(updateItemParams));
    return sendResponse({
      message: `Item with inventoryId ${inventoryId} updated successfully`,
      updatedAttributes: result.Attributes,
    });
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      console.error("Item does not exist:", error);
      return sendError(404, `Item with inventoryId ${body.Item} does not exist.`);
    }

    console.error("Error updating inventory item:", error);
    return sendError(500, error.message || "Error updating inventory item");
  }
};

module.exports.handler = middy(putInventoryHandler)
.use(authMiddleware(["staff"])) // Only allow staff role
.use(httpErrorHandler());
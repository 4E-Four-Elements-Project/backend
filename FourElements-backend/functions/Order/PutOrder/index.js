import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index.js";
import db from "../../../services/db.js";


const { sendResponse, sendError } = responseHandler;

export const handler = async (event) => {
  try {
    const orderId = event.pathParameters.orderId;
    const { menuDetails, totalPrice, comment, paymentMethod, orderStatus, orderLocked, userId } = JSON.parse(event.body);
    

    // Construct update expressions
    let updateExpression = "SET";
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (menuDetails) {
      updateExpression += " menuDetails = :menuDetails,";
      expressionAttributeValues[":menuDetails"] = menuDetails;
    }

    if (totalPrice !== undefined) {
      updateExpression += " totalPrice = :totalPrice,";
      expressionAttributeValues[":totalPrice"] = totalPrice;
    }

    if (comment !== undefined) {
      updateExpression += " #comment = :comment,";
      expressionAttributeValues[":comment"] = comment;
      expressionAttributeNames["#comment"] = "comment";
    }

    if (paymentMethod !== undefined) {
      updateExpression += " paymentMethod = :paymentMethod,";
      expressionAttributeValues[":paymentMethod"] = paymentMethod;
    }

    if (orderStatus !== undefined) {
      updateExpression += " orderStatus = :orderStatus,";
      expressionAttributeValues[":orderStatus"] = orderStatus;
    }

    if (orderLocked !== undefined) {
      updateExpression += " orderLocked = :orderLocked,";
      expressionAttributeValues[":orderLocked"] = orderLocked;
    }

    updateExpression = updateExpression.slice(0, -1);

    const updateParams = {
      TableName: "OrderTable",
      Key: { orderId, userId }, 
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames }),
      ConditionExpression: "attribute_exists(orderId) AND attribute_exists(userId)",
    };

    await db.send(new UpdateCommand(updateParams));

    return sendResponse({
      message: `Order with orderId '${orderId}' updated successfully.`,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return sendError(500, error.message || "Error updating order.");
  }
};

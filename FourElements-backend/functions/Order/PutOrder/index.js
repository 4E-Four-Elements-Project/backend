import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index.js";
import db from "../../../services/db.js";

const { sendResponse, sendError } = responseHandler;

export const handler = async (event) => {

  //Lägg till att den ska kolla vilken status det är, om status är "kitchen"
  //ska endast staff kunna göra ändringar
  try {
    const orderId = event.pathParameters.orderId;
    console.log(event);
    
    const { menuId, quantity, price, userId = "guest", comment, orderLocked, paymentMethod, orderStatus } = JSON.parse(event.body);

    const validMethods = ["Pay Online", "Pay on Pickup"];
    if (paymentMethod && !validMethods.includes(paymentMethod)) {
      return sendError(400, "Invalid input: 'paymentMethod' must be a valid payment type.");
    }

    if (!orderId || !menuId || price === undefined || quantity === undefined) {
      return sendError(400, "Invalid input: 'orderId', 'menuId', 'price', and 'quantity' are required.");
    }

    if (typeof quantity !== "number" || quantity <= 0) {
      return sendError(400, "Invalid input: 'quantity' must be a positive number.");
    }
    if (typeof price !== "number" || price <= 0) {
      return sendError(400, "Invalid input: 'price' must be a positive number.");
    }

    //lägg till ändra status !!


    let updateExpression = "SET";
    const expressionAttributeValues = { ":locked": false };
    const expressionAttributeNames = {};

    if (price !== undefined) {
      updateExpression += " price = :price,";
      expressionAttributeValues[":price"] = price;
    }

    if (paymentMethod !== undefined) {
      updateExpression += " paymentMethod = :paymentMethod,";
      expressionAttributeValues[":paymentMethod"] = paymentMethod;
    }

    if (quantity !== undefined) {
      updateExpression += " quantity = :quantity,";
      expressionAttributeValues[":quantity"] = quantity;
    }

    if (comment !== undefined) {
      updateExpression += " #comment = :comment,";
      expressionAttributeValues[":comment"] = comment;
      expressionAttributeNames["#comment"] = "comment";
    }

    if (orderLocked !== undefined) {
      updateExpression += " orderLocked = :orderLocked,";
      expressionAttributeValues[":orderLocked"] = orderLocked;
    }

    if (orderStatus !== undefined) {
      updateExpression += " orderStatus = :orderStatus,";
      expressionAttributeValues[":orderStatus"] = orderStatus;
    }

    updateExpression = updateExpression.slice(0, -1);

    // Prepare DynamoDB update parameters
    const updateParams = {
      TableName: "OrderTable",
      Key: { orderId, userId },

      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames }),
      ConditionExpression: "attribute_exists(orderId) AND attribute_exists(userId) AND orderLocked = :locked",
    };

    console.log("Updating order:", updateParams);


    await db.send(new UpdateCommand(updateParams));

    return sendResponse({
      message: `Order with orderId '${orderId}' updated successfully.`,
    });
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return sendError(403, `Order with orderId '${event.pathParameters.orderId}' is locked and cannot be updated.`);
    }

    console.error("Error updating order:", error);
    return sendError(500, error.message || "Error updating order.");
  }
};

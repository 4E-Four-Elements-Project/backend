import { v4 as uuidv4 } from 'uuid'; // Import uuid library
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index";
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body); // Parse incoming body
    const { menuId, quantity, price, cartId, userId, comment } = body;

    const orderLocked = false;

    // Validate input
    if (!menuId || !quantity || !price || !cartId) {
      return sendError(400, "Invalid input: 'menuId' and 'quantity' are required.");
    }

    if (comment && comment.length > 255) {
      return sendError(400, "Invalid input: 'comment' must be 255 characters or fewer.");
    }

    // Generate a new orderId if not provided
    const orderId = body.orderId || uuidv4();

    // Create a new order item
    const orderItem = {
      orderId,
      cartId,
      comment: comment || null,
      orderLocked,
      userId: userId || "guest",
      quantity,
      price,
      menuId,
      createdAt: new Date().toISOString(),
    };

    // Save to DynamoDB
    const params = {
      TableName: "OrderTable",
      Item: orderItem,
    };

    await db.send(new PutCommand(params));




    return sendResponse({
      message: "Order added successfully.",
      orderItem,
    });
  } catch (error) {
    console.error("Error adding order:", error);
    return sendError(500, error.message || "Error adding order.");
  }
};

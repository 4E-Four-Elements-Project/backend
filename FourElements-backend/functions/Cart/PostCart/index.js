import { v4 as uuidv4 } from 'uuid'; // Import uuid library
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index";
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body); // Parse incoming body
    const { menuId, quantity, price } = body;

    // Validate input
    if (!menuId || !quantity || !price) {
      return sendError(400, "Invalid input: 'menuId' and 'quantity' are required.");
    }

    // Generate a new cartId if not provided
    const cartId = body.cartId || uuidv4();

    const totalPrice = quantity * price;

    // Create a new cart item
    const cartItem = {
      cartId,
      menuId,
      quantity,
      price,
      createdAt: new Date().toISOString(),
      totalPrice: totalPrice,
    };

    // Save to DynamoDB
    const params = {
      TableName: "CartTable",
      Item: cartItem,
    };

    await db.send(new PutCommand(params));

    return sendResponse({
      message: "Cart item added successfully.",
      cartItem,
    });
  } catch (error) {
    console.error("Error adding cart item:", error);
    return sendError(500, error.message || "Error adding cart item.");
  }
};

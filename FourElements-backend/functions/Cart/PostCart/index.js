import { v4 as uuidv4 } from 'uuid'; // Import uuid library
import { PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index";
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { jwtVerify } from "jose"; // Import jwtVerify
const JWT_SECRET = "a1b2c3"; // Replace with process.env.JWT_SECRET in production


export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body); // Parse incoming body
    const { menuId, price } = body;
        
    // Validate input
    if (!menuId || !price) {
      return sendError(400, "Invalid input: 'menuId' and 'price' are required.");
    }

    //Check if menuItem exist in menu
    const menuParams = {
      TableName: "MenuTable",
      Key: { menuId },
    };

    const menuResult = await db.send(new GetCommand(menuParams)); 
    if (!menuResult.Item) {
      return sendError(404, `Menu item with menuId '${menuId}' not found.`);
    }

    // Extract userId from token if present
    let userId;

    if(event.headers?.authorization){
      const authorizationHeader = event.headers.authorization;
      const token = authorizationHeader.replace("Bearer ", "");
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secretKey);
      userId = payload.userId;
    } else {
      userId = "guest";
    }

    let cartId = uuidv4()

    // Create a new cart item
    const cartItem = {
      cartId,
      userId,
      menuId,
      price,
      createdAt: new Date().toISOString(),
    };

    // Save to DynamoDB
    const params = {
      TableName: "CartTable",
      Item: cartItem,
    };

    await db.send(new PutCommand(params));

    return sendResponse({
      message: `${menuId} added successfully to cart`,
      cartItem,
    });
  } catch (error) {
    console.error("Error adding cart item:", error);
    return sendError(500, error.message || "Error adding cart item.");
  }
};

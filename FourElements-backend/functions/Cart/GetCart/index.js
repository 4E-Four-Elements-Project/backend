import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index";
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { jwtVerify } from "jose"; // Import jwtVerify
const JWT_SECRET = "a1b2c3"; // Replace with process.env.JWT_SECRET in production
import { v4 as uuidv4 } from "uuid";

export const handler = async (event) => {
  try {
    // Extract userId from token if present
    let userId;

    if (event.headers?.authorization) {
      const authorizationHeader = event.headers.authorization;
      const token = authorizationHeader.replace("Bearer ", "");
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secretKey);
      userId = payload.userId;
    } else {
      userId = "guest";
    }

    // Query all items in the cart
    const queryParams = {
      TableName: "CartTable",
      IndexName: "userId-cartId-index", 
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const result = await db.send(new QueryCommand(queryParams));

    if (!result.Items || result.Items.length === 0) {
      return sendError(404, "No items found in the cart.");
    }

    // Aggregate menuIds and calculate total price
    const groupedItems = {};
    let totalPrice = 0;

    result.Items.forEach((item) => {
      const { menuId, price } = item;

      if (!groupedItems[menuId]) {
        groupedItems[menuId] = { quantity: 0, price };
      }

      groupedItems[menuId].quantity += 1;
      totalPrice += price;
    });

     // Format response
     const aggregatedItems = Object.entries(groupedItems).map(([menuId, details]) => ({
      menuId,
      quantity: details.quantity,
      price: details.price,
    }));

    return sendResponse({
      userId,
      totalPrice,
      items: aggregatedItems,
    });

  } catch (error) {
    console.error("Error fetching cart items:", error);
    return sendError(500, error.message || "Error fetching cart items");
  }
};

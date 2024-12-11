import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index";
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { jwtVerify } from "jose"; // Import jwtVerify
const JWT_SECRET = "a1b2c3"; // Replace with process.env.JWT_SECRET in production

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

    // const cartId = event.pathParameters.cartId;

    // Validate input
    // if (!cartId) {
    //   return sendError(400, "Invalid input: 'cartId' is required.");
    // }

    // Validate userId
    if (!userId) {
      return sendError(400, "User is not authenticated.");
    }

    // Query all items in the cart
    const queryParams = {
      TableName: "CartTable",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const result = await db.send(new QueryCommand(queryParams));

    if (!result.Items || result.Items.length === 0) {
      return sendError(404, "No items found in the cart.");
    }

    // Initialize variables for the response
    let totalPrice = 0;
    const groupedItems = {};

    // Loop through each cart item and aggregate the data
    result.Items.forEach(item => {
      const { menuId, price } = item;

      // Initialize the item if not already grouped
      if (!groupedItems[menuId]) {
        groupedItems[menuId] = { quantity: 0, price: price };
      }

      // Increment the quantity for the menu item
      groupedItems[menuId].quantity += 1;

      // Add to the total price
      totalPrice += price;
    });

    const newCartId = uuidv4();

    // Prepare new cart items to insert into the CartTable
    const newCartItems = Object.entries(groupedItems).map(([menuId, item]) => ({
      cartId: newCartId,
      userId,
      menuId,
      quantity: item.quantity,
      price: item.price,
      createdAt: new Date().toISOString(),
    }));

    // Insert the new cart items into CartTable
    const batchWriteParams = {
      RequestItems: {
        CartTable: newCartItems.map(cartItem => ({
          PutRequest: {
            Item: cartItem,
          },
        })),
      },
    };

    // Perform batch write to insert all new cart items
    await db.send(new PutCommand(batchWriteParams));

    // Return the response
    return sendResponse({
      cartId: newCartId,
      totalPrice,
      data: groupedItems,
    });

    // Prepare the final response
    // const responseData = {
    //   cartId,
    //   totalPrice,
    //   data: groupedItems,
    // };
    // return sendResponse(responseData);

    // return sendResponse({
    //   cartId,
    //   items: result.Items,
    // });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return sendError(500, error.message || "Error fetching cart items");
  }
};

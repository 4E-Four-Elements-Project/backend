import { v4 as uuidv4 } from 'uuid'; // Import uuid library
import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index";
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { jwtVerify } from "jose"; // Import jwtVerify

const JWT_SECRET = "a1b2c3"; // Replace with process.env.JWT_SECRET in production
const generateShortUUID = () => {
  const uuid = uuidv4();
  // Convert the UUID to a buffer, then encode it as base64
  const encodedUUID = Buffer.from(uuid.replace(/-/g, ''), 'hex').toString('base64');
  
  // Replace URL-unfriendly characters for path compatibility
  const urlSafeEncodedUUID = encodedUUID
    .replace(/\+/g, '-')   // Replace '+' with '-'
    .replace(/\//g, '_')   // Replace '/' with '_'
    .replace(/=+$/, '');    // Remove padding

  return urlSafeEncodedUUID;
};

const getCartIds = async (userId) => {
  const queryParams = {
    TableName: "CartTable",
    IndexName: "userId-cartId-index",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId || "guest",
    },
  };
  console.log('Fetching cart items for userId:', userId);
  const result = await db.send(new QueryCommand(queryParams));
  console.log('get cart items result', result);

  if (!result.Items || result.Items.length === 0) {
    console.log('No cart items found for userId:', userId);
    return [];
  }

  // Map the result to an array of cartId and menuId pairs
  return result.Items.map((item) => ({
    cartId: item.cartId,
    menuId: item.menuId,
  }));
};

export const handler = async (event) => {
  console.log('event: ', event);
  
  try {
    const body = JSON.parse(event.body);
    const { comment, paymentMethod } = body;

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
    
    const validMethods = ["Pay Online", "Pay on Pickup"];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return sendError(400, "Invalid input: 'paymentMethod' must be a valid payment type.");
    }

    if (comment && comment.length > 255) {
      return sendError(400, "Invalid input: 'comment' must be 255 characters or fewer.");
    }

    const cartQueryParams = {
      TableName: "CartTable",
      IndexName: "userId-cartId-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId || "guest",
      },
    };

    const cartResult = await db.send(new QueryCommand(cartQueryParams));
    console.log('cartResult:', cartResult);
    
    if (!cartResult.Items || cartResult.Items.length === 0) {
      return sendError(404, "No items found in the cart.");
    }

    // Aggregate menuIds, prices, and quantities
    const menuIdCounts = {};
    const menuIdPrices = {};
    let totalPrice = 0;

    cartResult.Items.forEach((item) => {
      const { menuId, price } = item;
      menuIdCounts[menuId] = (menuIdCounts[menuId] || 0) + 1; // Increment count for the menuId
      menuIdPrices[menuId] = price; // Store the price for the menuId
      totalPrice += price; // Add price to total
    });

    // Convert menuIdCounts to an array of { menuId, quantity } objects
    const menuDetails = Object.entries(menuIdCounts).map(([menuId, quantity]) => ({
      menuId,
      price: menuIdPrices[menuId],
      quantity,
    }));

    console.log('menuDetails', menuDetails);
    

    const orderId = generateShortUUID();

    const orderItem = {
      orderId,
      paymentMethod,
      comment: comment || null,
      orderLocked: false,
      orderStatus: "pending",
      userId: userId || "guest",
      menuDetails, // Store as an array of { menuId, quantity } objects
      totalPrice,
      createdAt: new Date().toISOString(),
    };

    const params = {
      TableName: "OrderTable",
      Item: orderItem,
    };

    await db.send(new PutCommand(params));

    // Delete cart items
    const cartDetails = await getCartIds(userId);
    if (cartDetails.length === 0) {
      return sendError(404, "No items found in the cart.");
    }

      const deletePromises = cartDetails.map(({ cartId, menuId }) => {
        const deleteParamsForItem = {
          TableName: "CartTable",
          Key: {
            cartId, // Partition Key
            menuId, // Sort Key
          },
        };
        console.log('Deleting cart item:', deleteParamsForItem);
        return db.send(new DeleteCommand(deleteParamsForItem));
      });
  
      // Wait for all deletions to complete
      await Promise.all(deletePromises);


    return sendResponse({
      message: "Order added successfully.",
      orderItem,
    });
  } catch (error) {
    console.error("Error adding order:", error);
    return sendError(500, error.message || "Error adding order.");
  }
};

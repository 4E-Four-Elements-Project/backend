import { v4 as uuidv4 } from 'uuid'; // Import uuid library
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
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

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body); // Parse incoming body
    const { comment, paymentMethod } = body;

    // Extract userId from token
    let userId;
    const authorizationHeader = event.headers?.authorization;
    const token = authorizationHeader?.replace("Bearer ", "");
    const secretKey = new TextEncoder().encode(JWT_SECRET);

    if (token) {
      try {
        const { payload } = await jwtVerify(token, secretKey);
        userId = payload.userId;
      } catch (err) {
        console.error("Token verification error:", err);
        userId = "guest";
      }
    }

    console.log("Extracted userId from token: ", userId);

    const validMethods = ["Pay Online", "Pay on Pickup"];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return sendError(400, "Invalid input: 'paymentMethod' must be a valid payment type.");
    }

    if (comment && comment.length > 255) {
      return sendError(400, "Invalid input: 'comment' must be 255 characters or fewer.");
    }

    // Fetch existing cart items for the user
    const cartQueryParams = {
      TableName: "CartTable",
      IndexName: "userId-cartId-index", 
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId || "guest",
      },
    };

    const cartResult = await db.send(new QueryCommand(cartQueryParams));

    if (!cartResult.Items || cartResult.Items.length === 0) {
      return sendError(404, "No items found in the cart.");
    }

    // Aggregate menuIds, prices, and quantities
    const menuIds = [];
    let totalPrice = 0;
    let totalQuantity = 0;

    cartResult.Items.forEach((item) => {
      const { menuId, price, quantity = 1 } = item;
      if (!menuIds.includes(menuId)) {
        menuIds.push(menuId);
      }
      totalPrice += price * quantity;
      totalQuantity += quantity;
    });

    // Generate a new orderId
    const orderId = generateShortUUID();

    // Create a new order item
    const orderItem = {
      orderId,
      paymentMethod,
      comment: comment || null,
      orderLocked: false,
      orderStatus: "pending", // Options: "pending", "cooking", "done"
      userId: userId || "guest",
      menuIds: menuIds.join(", "), // Convert menuIds array to string for easy storage
      totalPrice,
      totalQuantity,
      createdAt: new Date().toISOString(),
    };

    // Save to OrderTable
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
}

// export const handler = async (event) => {

//   try {
//     const body = JSON.parse(event.body); // Parse incoming body
//     const { menuId, quantity, price, cartId, comment, paymentMethod } = body;

//     // Extract userId from token
//     let userId;

//     const authorizationHeader = event.headers?.authorization;
//     const token = authorizationHeader?.replace("Bearer ", "");
//     const secretKey = new TextEncoder().encode(JWT_SECRET);

//     if (token) {
//       try {
//         const { payload } = await jwtVerify(token, secretKey);
//         userId = payload.userId;
//       } catch (err) {
//         console.error("Token verification error:", err);
//         userId = "guest";
//       }
//     }

//     console.log('Extracted userId from token: ', userId);
    
//     const validMethods = ["Pay Online", "Pay on Pickup"];
//     const selectedPaymentMethod = paymentMethod;
    
//     if (!selectedPaymentMethod || !validMethods.includes(selectedPaymentMethod)) {
//       return sendError(400, "Invalid input: 'paymentMethod' must be a valid payment type.");
//     }
//     // Validate input
//     if (!menuId || !quantity || !price || !cartId) {
//       return sendError(400, "Invalid input: 'menuId' and 'quantity' are required.");
//     }
//     //KOLLA OM DEN ÄR OBLIGATORISK GÅR ATT 
//     if (comment && comment.length > 255) {
//       return sendError(400, "Invalid input: 'comment' must be 255 characters or fewer.");
//     }

//     const orderLocked = false;

//     // Calculate total price
//     const totalPrice = quantity * price;

//     // Generate a new orderId if not provided
//     const orderId = body.orderId || generateShortUUID();

//     // Create a new order item
//     const orderItem = {
//       orderId,
//       cartId,
//       paymentMethod: selectedPaymentMethod,
//       comment: comment || null,
//       orderLocked: orderLocked,
//       orderStatus: "pending", //cooking//done
//       userId: userId || "guest",
//       quantity,
//       price,
//       menuId,
//       createdAt: new Date().toISOString(),
//       totalPrice: totalPrice,
//     };

//     // Save to DynamoDB
//     const params = {
//       TableName: "OrderTable",
//       Item: orderItem,
//     };

//     await db.send(new PutCommand(params));




//     return sendResponse({
//       message: "Order added successfully.",
//       orderItem,
//     });
//   } catch (error) {
//     console.error("Error adding order:", error);
//     return sendError(500, error.message || "Error adding order.");
//   }
// };

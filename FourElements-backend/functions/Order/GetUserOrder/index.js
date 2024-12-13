import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index";
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { jwtVerify } from "jose"; // Import jwtVerify


const JWT_SECRET = "a1b2c3"; // Replace with process.env.JWT_SECRET in production

export const handler = async (event) => {
  try {
    // const userId = event.pathParameters?.userId; 
    console.log('event', event);
    
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

    // // Validate input
    // if (!userId) {
    //   return sendError(400, "Invalid input: 'userId' is required.");
    // }

    const queryParams = {
      TableName: "OrderTable",
      FilterExpression: "userId = :userId", 
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const result = await db.send(new ScanCommand(queryParams));
    console.log('result: ', result);

    if(result.Items.length === 0) {
      return sendError(404, "Order not found for this user.");
    }

    // Sort orders by orderDate in descending order (newest to oldest)
    const sortedOrders = result.Items.sort((a, b) => {
      const aDate = new Date(a.orderDate).getTime();
      const bDate = new Date(b.orderDate).getTime();
      return bDate - aDate; // For descending order (newest to oldest)
    });

    return sendResponse({
      message: "Orders fetched and sorted successfully.",
      userId,
      orders: sortedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return sendError(500, error.message || "Error fetching orders");
  }
};

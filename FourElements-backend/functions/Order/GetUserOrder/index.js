import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import responseHandler from "../../../responses/index";
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";

export const handler = async (event) => {
  try {
    const userId = event.pathParameters?.userId; 

    // Validate input
    if (!userId) {
      return sendError(400, "Invalid input: 'userId' is required.");
    }

    const scanParams = {
      TableName: "OrderTable",
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const result = await db.send(new ScanCommand(scanParams));

    return sendResponse({
      message: "Orders fetched successfully.",
      userId,
      orders: result.Items || [], 
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return sendError(500, error.message || "Error fetching orders");
  }
};

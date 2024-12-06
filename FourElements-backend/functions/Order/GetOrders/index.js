import responseHandler from '../../../responses/index'
const {sendResponse, sendError} = responseHandler
import db from "../../../services/db";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

module.exports.handler = async (event) => {
  console.log("Event received:", event);

  const getOrderParams = {
    TableName: "OrderTable",
  };

  try {
    const { Items } = await db.send(new ScanCommand(getOrderParams));
    console.log("Retrieved items:", Items); 
    return sendResponse(Items);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return sendError(404, error.message || "Error fetching orders");
  }
};

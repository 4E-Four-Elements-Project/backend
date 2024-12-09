import responseHandler from '../../../responses/index'
const {sendResponse, sendError} = responseHandler
import db from "../../../services/db";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import auth from '../../../middleware/auth';
const { authMiddleware} = auth
import httpErrorHandler from '@middy/http-error-handler';
import roles from '../../../services/roles';

const getInventoryHandler = async (event) => {
  console.log("Event received:", event);

  const getInventoryParams = {
    TableName: "InventoryTable",
  };

  try {
    const { Items } = await db.send(new ScanCommand(getInventoryParams));
    console.log("Retrieved items:", Items); 
    return sendResponse(Items);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return sendError(404, error.message || "Error fetching inventory");
  }
};

module.exports.handler = middy(getInventoryHandler)
.use(authMiddleware(["staff"])) // Only allow staff role
.use(httpErrorHandler());
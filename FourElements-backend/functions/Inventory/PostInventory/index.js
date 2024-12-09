import responseHandler from '../../../responses/index'
const {sendResponse, sendError} = responseHandler
import db from "../../../services/db";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import validator from '@middy/validator'
import { transpileSchema } from '@middy/validator/transpile'
import auth from '../../../middleware/auth';
const { authMiddleware} = auth
import roles from '../../../services/roles';



const postInventoryHandler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { item, quantity = 0 } = body;

    const addItemParams = {
      TableName: "InventoryTable",
      Item: {
        inventoryId: item,
        quantity,
      },
    };

    await db.send(new PutCommand(addItemParams));

    return sendResponse({ message: `${item} added successfully!` });
  } catch (error) {
    console.error("Error processing inventory:", error);
    return sendError(500, error.message || "Error processing inventory");
  }
};


const schema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        item: { 
          type: 'string', 
          enum: ["salad", "meat", "sauce", "soup"], // Allowed values
        },
        quantity: { 
          type: 'number', 
          minimum: 0, // Non-negative
        },
      },
      required: ['item', 'quantity'], // Both fields are required
    },
  },
};



module.exports.handler = middy(postInventoryHandler)
  .use(authMiddleware(["staff"])) // Only allow staff role
  .use(jsonBodyParser())
  .use(validator({ eventSchema: transpileSchema(schema) }))
  .use(httpErrorHandler());

  
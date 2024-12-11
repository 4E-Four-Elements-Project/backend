import { v4 as uuidv4 } from 'uuid'; // Import uuid library
import { PutCommand, GetCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
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

    const menuItem = menuResult.Item;

       //Check inventory availability
       for (const ingredient of menuItem.ingredients) {
        const inventoryParams = {
          TableName: "InventoryTable",
          Key: { inventoryId: ingredient },
        };
  
        const inventoryResult = await db.send(new GetCommand(inventoryParams));
        if (!inventoryResult.Item || inventoryResult.Item.quantity <= 0) {
          return sendError(404, `Insufficient inventory for ingredient: ${ingredient}`);
        }
  
        const inventoryItem = inventoryResult.Item;
  
        if (inventoryItem.quantity < ingredient.quantity) {
          return sendError(400, `Insufficient quantity for ingredient '${ingredient.ingredientId}'.`);
        }
      }
  
      // Deduct ingredients from inventory
      for (const ingredient of menuItem.ingredients) {
        const inventoryParams = {
          TableName: "InventoryTable",
          Key: { inventoryId: ingredient },
          UpdateExpression: "SET quantity = quantity - :decrement",
          ExpressionAttributeValues: {
            ":decrement": 1, // Adjust as per recipe requirements
          },
          ConditionExpression: "quantity >= :decrement", // Ensure sufficient stock
          ReturnValues: "UPDATED_NEW",
        };
  
        try {
          await db.send(new UpdateCommand(inventoryParams));
        } catch (error) {
          if (error.name === "ConditionalCheckFailedException") {
            return sendError(400, `Insufficient inventory for ingredient: ${ingredient}`);
          }
          throw error;
        }
      }
      // Extract userId from token if present
      let userId = "guest"

      if(event.headers?.authorization){
        const authorizationHeader = event.headers.authorization;
        const token = authorizationHeader.replace("Bearer ", "");
        const secretKey = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        userId = payload.userId;
      } 
      console.log('userId', userId);
    
      // Add the item to the CartTable
      const cartId = uuidv4(); // Generate a unique cart ID
      const newCartItem = {
        cartId,
        menuId,
        userId,
        price,
        createdAt: new Date().toISOString(),
      };  

      const createCartParams = {
        TableName: "CartTable",
        Item: newCartItem,
      };

      await db.send(new PutCommand(createCartParams));

      return sendResponse({
        message: `${menuId} added to cart successfully.`,
        cartItem: newCartItem,
      });

    } catch (error) {
        console.error("Error adding to cart:", error);
        return sendError(500, error.message || "Error adding to cart.");
      }
    };

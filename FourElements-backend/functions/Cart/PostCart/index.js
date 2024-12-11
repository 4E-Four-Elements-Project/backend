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

    // Extract userId from token if present
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

    console.log('userId', userId);
    

     // Check if the user already has items in the cart
     const existingCartParams = {
      TableName: "CartTable",
      IndexName: "userId-cartId-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const existingCartResult = await db.send(new QueryCommand(existingCartParams));

    let cartId;
    let totalPrice = 0;

    if (existingCartResult.Items.length > 0) {
      // User has existing cart, retrieve the cartId and calculate total price
      cartId = existingCartResult.Items[0].cartId;
      totalPrice = existingCartResult.Items.reduce((sum, item) => sum + item.price, 0);
      
      // Update the cart item with new menuId and price
      const updateCartItemParams = {
        TableName: "CartTable",
        Key: { cartId, menuId },
        UpdateExpression: "SET price = :price, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":price": price,
          ":updatedAt": new Date().toISOString(),
        },
      };
      await db.send(new UpdateCommand(updateCartItemParams));
    
    } else {
      // No existing cart, generate a new cartId
      cartId = uuidv4();
    }

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

    //Add new cart item
    const cartItem = {
      cartId,
      userId,
      menuId,
      price,
      createdAt: new Date().toISOString(),
    };

    // Save to DynamoDB (only if cart item is new)
    if (existingCartResult.Items.length === 0) {
      const params = {
        TableName: "CartTable",
        Item: cartItem,
      };

      await db.send(new PutCommand(params));
    }

    // Update total price if the user already has a cart
    if (existingCartResult.Items.length > 0) {
      totalPrice += price;

      const updateTotalPriceParams = {
        TableName: "CartTable",
        Key: {
          cartId, // Partition key is cartId
          menuId, // Sort key is menuId
        },
        UpdateExpression: "SET totalPrice = :totalPrice",
        ExpressionAttributeValues: {
          ":totalPrice": totalPrice,
        },
      };

      await db.send(new UpdateCommand(updateTotalPriceParams));
    }

    return sendResponse({
      message: `${menuId} added successfully to cart`,
      cartItem,
    });
  } catch (error) {
    console.error("Error adding cart item:", error);
    return sendError(500, error.message || "Error adding cart item.");
  }
};

import responseHandler from '../../../responses/index.js';
const { sendResponse, sendError } = responseHandler;
import db from "../../../services/db";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async () => {
  try {
    const menuParams = {
      TableName: "MenuTable",
    };
    const menuData = await db.send(new ScanCommand(menuParams));
    const menuItems = menuData.Items;

    const inventoryParams = {
      TableName: "InventoryTable",
    };
    const inventoryData = await db.send(new ScanCommand(inventoryParams));
    const inventoryItems = inventoryData.Items;

    const inventoryMap = inventoryItems.reduce((map, item) => {
      map[item.inventoryId] = item.quantity;
      return map;
    }, {});

    const enrichedMenu = menuItems.map((menuItem) => {
      const { menuId, price, category, description, ingredients } = menuItem;
      const missingIngredients = ingredients.filter(
        (ingredient) => !inventoryMap[ingredient] || inventoryMap[ingredient] <= 0
      );
      const possibleToOrder = missingIngredients.length === 0 ? "yes" : "no";

      return {
        menuId,
        price,
        category,
        description,
        ingredients,
        possibleToOrder,
        missingIngredients, // Show missing items for unavailable dishes
      };
    });

    return sendResponse({
      message: "Menu retrieved successfully",
      menu: enrichedMenu,
    });
  } catch (error) {
    console.error("Error fetching menu:", error);
    return sendError(500, error.message || "Error fetching menu");
  }
};

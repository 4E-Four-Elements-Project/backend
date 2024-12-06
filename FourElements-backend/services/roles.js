export const roles = {
    guest: ["placeOrder", "viewOrder", "updateOrder", "deleteOrder", ], // Limited permissions
    user: ["placeOrder", "viewOrder", "updateOrder", "deleteOrder", "viewOrderHistory"], // Add order access
    staff: ["manageMenu", "viewOrders", "manageOrders", "updateOrderStatus"], // Manage orders
    chef: ["viewOrders", "updateOrderStatus"], // Kitchen-specific tasks
  };
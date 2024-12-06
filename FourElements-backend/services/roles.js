const roles = {
    guest: ["readMenu", "placeOrder"], // Limited permissions
    user: ["readMenu", "placeOrder", "getOrderHistory"], // Add order access
    staff: ["readMenu", "manageMenu", "viewOrders", "manageOrders"], // Manage orders
    chef: ["viewOrders", "updateOrderStatus"], // Kitchen-specific tasks
  };

  module.exports = roles;
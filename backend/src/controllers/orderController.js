const orderService = require("../services/orderService");

// @desc    Create new order & Checkout
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req,res) => {
          const order = await orderService.createOrder(req.user._id, req.body);
          res.status(201).json(order);
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrder = async (req,res) => {
          res.json(await orderService.getMyOrders(req.user._id));
};

// @desc    Get order by ID (owner or admin)
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req,res) => {
          res.json(await orderService.getOrderById(req.user, req.params.id));
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrder = async (req,res) => {
          res.json(await orderService.getAllOrders());
};

// @desc    Update order to delivered (Admin only)
// @route   PUT /api/orders/:id/delivery
// @access  Private/Admin
exports.updateOrderToDelivered = async (req,res) => {
          res.json(await orderService.markOrderDelivered(req.params.id));
};

const cartService = require('../services/cartService');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req,res) => {
          res.json(await cartService.getCart(req.user._id));
};

// @desc    Add item to cart or update quantity if exists
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req,res) => {
          res.json(await cartService.addToCart(req.user._id, req.body));
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/:bookId
// @access  Private
exports.updateCartItem = async (req,res) => {
          res.json(await cartService.updateCartItem(req.user._id, req.params.bookId, req.body));
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:bookId
// @access  Private
exports.removeFromCart = async (req,res) => {
          res.json(await cartService.removeFromCart(req.user._id, req.params.bookId));
};

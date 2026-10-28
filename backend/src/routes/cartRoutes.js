const express = require('express');
const router = express.Router();

const {getCart,addToCart,updateCartItem,removeFromCart} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
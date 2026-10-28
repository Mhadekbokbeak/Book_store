const express = require("express");
const router = express.Router();


const {createOrder,getMyOrder,getOrderById} = require("../controllers/orderController");
const {protect} = require("../middleware/authMiddleware");

router.route('/')
          .post(protect,createOrder);

router.route('/myorders')
          .get(protect,getMyOrder);

router.route('/:id')
          .get(protect,getOrderById);

module.exports = router;
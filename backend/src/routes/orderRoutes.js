const express = require("express");
const router = express.Router();


const {createOrder,getMyOrder,getOrderById,getAllOrder,updateOrderToDelivered} = require("../controllers/orderController");
const {protect} = require("../middleware/authMiddleware");
const {admin} = require("../middleware/adminMiddleware");

router.route('/')
          .post(protect,createOrder);

router.route('/myorders')
          .get(protect,getMyOrder);

router.route('/:id')
          .get(protect,getOrderById);

router.route('/admin/all')
          .get(protect,admin,getAllOrder);
router.route('/:id/delivery')
          .put(protect,admin,updateOrderToDelivered);
module.exports = router;
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Book = require("../models/Book");

// @desc    Create new order & Checkout
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req,res) => {
          try {
                    const {shippingAddress,paymentMethod} = req.body;

                    // get cart data From userId
                    const cart = await Cart.findOne({user:req.user._id}).populate('items.book');

                    if (!cart || cart.items.length === 0){
                              return res.status(400).json({ message : 'No items in cart'});
                    }

                    let totalPrice = 0;
                    const orderItems = [];

                    // check stock and cal price 
                    for (const item of cart.items) {
                              const book = await Book.findById(item.book._id);

                              if (!book){
                                        return res.status(404).json({message:`Book not found: ${item.book._id}`})
                              }

                              if (book.stock < item.quantity) {
                                        return res.status(400).json({
                                                  message:`Insufficient stock for book: ${book.title} (Available: ${book.stock})`
                                        })
                              }


                              // cal stock
                              book.stock -= item.quantity;
                              await book.save();

                              // save on product in orderItem
                              orderItems.push({
                                        book:book._id,
                                        title:book.title,
                                        quantity:item.quantity,
                                        price:book.price,
                              })

                              totalPrice += book.price * item.quantity
                    }

                    // Create new order
                    const order = await Order.create({
                              user:req.user._id,
                              orderItems,
                              shippingAddress,
                              paymentMethod,
                              totalPrice,
                    });

                    // clear cart after payment suc
                    cart.items = []
                    await cart.save();

                    res.status(201).json(order)
          } catch (error) {
                    return res.status(500).json({ message : error.message});
          }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrder = async (req,res) => {
          try {
                    const orders = await Order.find({ user:req.user._id}).sort({ createdAt:-1});
                    res.json(orders)
          } catch (error){
                    return res.status(500).json({ message : error.message});
          }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req,res) => {
          try {
                    const order = await Order.findById(req.body.id).populate('user','name email');

                    if(order) {
                              return res.status(404).json({ message : 'Order not found'});
                    }

                    // check this own order or admin?
                    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                              return res.status(403).json({ message : 'Not authorized to view this order'});
                    }

                    res.json(order);
          } catch (error){
                    return res.status(500).json({message:error.message});
          }
}


// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrder = async (req,res) => {
          try {
                    const orders = await Order.findOne({}).populate('user','id name email');
                    res.json(orders);
          } catch (error) {
                    return res.status(500).json({ message : error.message});
          }
}

// @desc    Update order to delivered (Admin only)
// @route   GET /api/orders/:id/deliver หรือ PUT /api/orders/:id/deliver
// @access  Private/Admin
exports.updateOrderToDelivered = async (req,res) => {
          try {
                    const order = await Order.findById(req.params.id);

                    if(!order) {
                              return res.status(404).json({ message : 'Order not found'});
                    }

                    order.idDelivered = true;
                    order.deliveryAt = Date.now();

                    const updatedOrder = await order.save();
                    res.json(updatedOrder);
          } catch (error) {
                    return res.status(500).json({message:error.message});
          }
}
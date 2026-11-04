const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const HttpError = require('../utils/httpError');
const { loadCart } = require('./cartService');
const { requireObjectId, requireString } = require('../utils/validators');

const { PAYMENT_METHODS } = Order;
const CASH_ON_DELIVERY = 'Cash on Delivery';

const parseShippingAddress = (shippingAddress) => {
          if (!shippingAddress || typeof shippingAddress !== 'object' || Array.isArray(shippingAddress)) {
                    throw new HttpError(400, 'Shipping address is required');
          }

          const { address, city, postalCode, country } = shippingAddress;
          return {
                    address: requireString(address, 'Address', { max: 200 }),
                    city: requireString(city, 'City', { max: 100 }),
                    // Accept 10110 or "10110", always store text
                    postalCode: requireString(typeof postalCode === 'number' ? String(postalCode) : postalCode, 'Postal code', { max: 20 }),
                    country: requireString(country, 'Country', { max: 100 }),
          };
};

// Case-insensitive match against the allowed list; missing means cash on delivery
const parsePaymentMethod = (paymentMethod) => {
          if (paymentMethod === undefined) return CASH_ON_DELIVERY;

          const method = typeof paymentMethod === 'string'
                    && PAYMENT_METHODS.find((allowed) => allowed.toLowerCase() === paymentMethod.trim().toLowerCase());
          if (!method) {
                    throw new HttpError(400, `Payment method not supported. Available: ${PAYMENT_METHODS.join(', ')}`);
          }
          return method;
};

// Give stock back for books that were already reserved by a failed checkout
const releaseStock = async (reservations) => {
          try {
                    await Promise.all(reservations.map(({ bookId, quantity }) =>
                              Book.updateOne({ _id: bookId }, { $inc: { stock: quantity } })
                    ));
          } catch (error) {
                    // Stock is now wrong and needs a manual fix, so log every detail
                    console.error('Failed to release reserved stock', reservations, error);
          }
};

const roundMoney = (value) => Math.round(value * 100) / 100;

// Checkout.
// Each book's stock is decremented with ONE atomic query that only matches when enough stock is left:
//   findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })
// Two parallel checkouts can therefore never both take the last copy.
// If any later step fails, the stock already taken is given back (compensation).
// Why not a transaction: they need a replica set and the local MongoDB is standalone.
// If you move to a replica set (e.g. MongoDB Atlas), a transaction would also cover a server crash mid-checkout.
exports.createOrder = async (userId, { shippingAddress, paymentMethod } = {}) => {
          const cleanAddress = parseShippingAddress(shippingAddress);
          const cleanPaymentMethod = parsePaymentMethod(paymentMethod);

          const { cart, removedCount } = await loadCart(userId);
          if (removedCount > 0) {
                    throw new HttpError(409, 'Some books in your cart are no longer available. Your cart was updated, please review it.');
          }
          if (cart.items.length === 0) {
                    throw new HttpError(400, 'No items in cart');
          }

          const reservations = [];
          const orderItems = [];
          let order;

          try {
                    for (const item of cart.items) {
                              const book = await Book.findOneAndUpdate(
                                        { _id: item.book._id, stock: { $gte: item.quantity } },
                                        { $inc: { stock: -item.quantity } },
                                        { returnDocument: 'after' }
                              );

                              if (!book) {
                                        const current = await Book.findById(item.book._id).select('title stock');
                                        throw new HttpError(409, current
                                                  ? `Insufficient stock for book: ${current.title} (Available: ${current.stock})`
                                                  : `Book is no longer available: ${item.book.title}`);
                              }

                              reservations.push({ bookId: book._id, quantity: item.quantity });

                              // Copy title and price so the order stays correct if the book changes later
                              orderItems.push({
                                        book: book._id,
                                        title: book.title,
                                        quantity: item.quantity,
                                        price: book.price,
                              });
                    }

                    order = await Order.create({
                              user: userId,
                              orderItems,
                              shippingAddress: cleanAddress,
                              paymentMethod: cleanPaymentMethod,
                              totalPrice: roundMoney(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)),
                    });
          } catch (error) {
                    await releaseStock(reservations);
                    throw error;
          }

          // clear cart after the order is saved
          await Cart.updateOne({ _id: cart._id }, { $set: { items: [] } });

          return order;
};

exports.getMyOrders = (userId) => Order.find({ user: userId }).sort({ createdAt: -1 });

exports.getOrderById = async (user, id) => {
          const order = await Order.findById(requireObjectId(id, 'order id')).populate('user', 'name email');
          if (!order) {
                    throw new HttpError(404, 'Order not found');
          }

          // Owner or admin only. order.user can be null if the account was deleted
          const isOwner = order.user && order.user._id.equals(user._id);
          if (!isOwner && user.role !== 'admin') {
                    throw new HttpError(403, 'Not authorized to view this order');
          }

          return order;
};

exports.getAllOrders = () => Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });

// Cash on delivery is paid when the parcel is handed over, so delivery also marks it paid.
// $set (not order.save()) so older orders with legacy values are not re-validated and rejected.
exports.markOrderDelivered = async (id) => {
          const order = await Order.findById(requireObjectId(id, 'order id'));
          if (!order) {
                    throw new HttpError(404, 'Order not found');
          }
          if (order.isDelivered) {
                    return order;
          }

          const now = new Date();
          const update = { isDelivered: true, deliveryAt: now };
          if (!order.isPaid && order.paymentMethod.toLowerCase() === CASH_ON_DELIVERY.toLowerCase()) {
                    update.isPaid = true;
                    update.paidAt = now;
          }

          return Order.findByIdAndUpdate(order._id, { $set: update }, { returnDocument: 'after' });
};

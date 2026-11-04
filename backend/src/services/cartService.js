const Cart = require('../models/Cart');
const Book = require('../models/Book');
const HttpError = require('../utils/httpError');
const { requireObjectId, requireInteger } = require('../utils/validators');

const { MAX_QUANTITY } = Cart;
const BOOK_FIELDS = 'title author price coverImage stock';

// Get the user's cart (created on first use) with book details.
// Items whose book no longer exists are removed, and removedCount tells the caller.
const loadCart = async (userId) => {
          // Upsert instead of find-then-create: two parallel requests cannot create two carts
          const cart = await Cart.findOneAndUpdate(
                    { user: userId },
                    { $setOnInsert: { items: [] } },
                    { upsert: true, returnDocument: 'after' }
          ).populate({ path: 'items.book', select: BOOK_FIELDS });

          const missingIds = cart.items.filter((item) => !item.book).map((item) => item._id);
          if (missingIds.length > 0) {
                    await Cart.updateOne({ _id: cart._id }, { $pull: { items: { _id: { $in: missingIds } } } });
                    cart.items = cart.items.filter((item) => item.book);
          }

          return { cart, removedCount: missingIds.length };
};

const requireQuantity = (value) => requireInteger(value, 'Quantity', { min: 1, max: MAX_QUANTITY });

const requireStockFor = async (bookId, quantity) => {
          const book = await Book.findById(bookId).select('stock');
          if (!book) {
                    throw new HttpError(404, 'Book not found');
          }
          if (quantity > book.stock) {
                    throw new HttpError(400, `Not enough stock available (Available: ${book.stock})`);
          }
};

exports.loadCart = loadCart;

exports.getCart = async (userId) => (await loadCart(userId)).cart;

// Add a book, or increase its quantity if it is already in the cart
exports.addToCart = async (userId, { bookId, quantity = 1 } = {}) => {
          const id = requireObjectId(bookId, 'book id');
          const addQuantity = requireQuantity(quantity);

          const cart = await Cart.findOne({ user: userId });
          const existingItem = cart?.items.find((item) => item.book.equals(id));
          const newQuantity = (existingItem?.quantity ?? 0) + addQuantity;

          if (newQuantity > MAX_QUANTITY) {
                    throw new HttpError(400, `You can add at most ${MAX_QUANTITY} copies of one book`);
          }
          await requireStockFor(id, newQuantity);

          if (existingItem) {
                    existingItem.quantity = newQuantity;
                    await cart.save();
          } else if (cart) {
                    cart.items.push({ book: id, quantity: newQuantity });
                    await cart.save();
          } else {
                    await Cart.create({ user: userId, items: [{ book: id, quantity: newQuantity }] });
          }

          return exports.getCart(userId);
};

exports.updateCartItem = async (userId, bookId, { quantity } = {}) => {
          const id = requireObjectId(bookId, 'book id');
          const newQuantity = requireQuantity(quantity);

          const cart = await Cart.findOne({ user: userId });
          const item = cart?.items.find((cartItem) => cartItem.book.equals(id));
          if (!item) {
                    throw new HttpError(404, 'Item not found in cart');
          }

          await requireStockFor(id, newQuantity);

          item.quantity = newQuantity;
          await cart.save();
          return exports.getCart(userId);
};

// Removing a book that is not in the cart is not an error: the result is the same
exports.removeFromCart = async (userId, bookId) => {
          const id = requireObjectId(bookId, 'book id');
          await Cart.updateOne({ user: userId }, { $pull: { items: { book: id } } });
          return exports.getCart(userId);
};

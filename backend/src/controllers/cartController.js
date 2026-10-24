const Cart = require('../models/Cart');
const Book = require('../models/Book');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req,res) => {
          try {
                    let cart = await Cart.findOne({ user : req.user._id}).populate({
                              path:'items.book',
                              select:'title author price coverImage stock',
                    });

                    if(!cart) {
                              // if not cart , build emthy cart
                              cart = await Cart.create({ user:req.user._id,items:[]});
                    }

                    res.json(cart);
          } catch (error) {
                    return res.status(500).json({ message: error.message});
          }
};

// @desc    Add item to cart or update quantity if exists
// @route   POST /api/cart
// @access  Private

exports.addToCart = async (req,res) => {
          try {
                    const { bookId, quantity = 1} = req.body;

                    // check if have real book and have stock
                    const book = await Book.findOne({bookId});
                    if(!book) {
                              return res.status(404).json({ message : 'Book not found'});
                    }

                    if (book.stock < quantity) {
                              return res.status(404).json({ message: 'Not enough stock available'});
                    }

                    let cart = await Cart.findOne({ user: req.user._id});
                    if(!cart) {
                              // haven't cart
                              cart = await Cart.create({
                                        user:req.user._id,
                                        items:[{ book:bookId,quantity}],
                              });
                    } else {
                              // Check this book have in cart or not
                              const itemIndex = cart.items.findIndex(
                                        (item) => item.book.toString() == bookId
                              );


                              if (itemIndex > -1){
                                        // If have ++ quantity
                                        const newQuantity = cart.items[itemIndex].quantity + quantity;
                                        if(book.stock < newQuantity) {
                                                  return res.status(400).json({ message : 'Exceeds available stock'});
                                        }
                                        cart.items[itemIndex].quantity = newQuantity
                              } else {
                                        // If not have give push in array
                                        cart.items.push({ book : bookId,quantity});
                              }

                              await cart.save();
                    }

                    // populate book data before send res
                    cart = await Cart.findById(cart._id).populate({
                              path:'items.book',
                              select:'title author price coverImage stock',
                    });

                    res.json(cart);
          } catch (error) {
                    res.status(500).json({message:error.message})
          }
}
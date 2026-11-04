const bookService = require('../services/bookService');

// @desc    Get all books (with Search, Category Filter, and Pagination)
// @route   GET /api/books?keyword=&category=&page=&limit=
// @access  Public
exports.getBooks = async (req,res) => {
          res.json(await bookService.getBooks(req.query));
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
exports.getBookById = async (req,res) => {
          res.json(await bookService.getBookById(req.params.id));
};

// @desc    Create a new book
// @route   POST /api/books
// @access  Private/Admin
exports.createBook = async (req,res) => {
          const book = await bookService.createBook(req.body);
          res.status(201).json(book);
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private/Admin
exports.updateBook = async (req,res) => {
          res.json(await bookService.updateBook(req.params.id, req.body));
};

// @desc    Delete book (also removes it from every cart)
// @route   DELETE /api/books/:id
// @access  Private/Admin
exports.deleteBook = async (req,res) => {
          await bookService.deleteBook(req.params.id);
          res.json({ message : 'Book deleted successfully'});
};

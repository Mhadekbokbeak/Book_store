const Book = require('../models/Book');


// @desc Get all books (with Search , Category Filter, and Pagination);
// @route GET /api/books
// @access Publice
exports.getBooks = async (req,res) => {
          try {
                    const page = Number(req.query.page) || 1;
                    const limit = Number(req.query.limit) || 10;
                    const skip = (page - 1) * limit;

                    const query = {};

                    // Filter follow Category ID
                    if(req.query.category){
                              query.category = req.query.category;
                    }

                    // Search follow name of book'author
                    if (req.query.keyword) {
                              query.$or = [
                                        { title : {$regex: req.query.keyword, $options: 'i'}},
                                        { author : {$regex: req.query.keyword, $options: 'i'}},
                              ];
                    }

                    const count = await Book.countDocuments(query);
                    const books = await Book.find(query)
                              .populate('category','name')
                              .limit(limit)
                              .skip(skip)
                              .sort({ createAt : -1});
                    res.json({
                              books,
                              page,
                              pages:Math.ceil(count / limit),
                              totalBooks:count,
                    });
          } catch (error) {
                    res.status(500).json({ message : error.message});
          }
}

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
exports.getBookById = async (req,res) => {
          try {
                    const book = await Book.findById(req.params.id).populate('category', 'name description');

                    if(!book) {
                              return res.status(404).json({ message : 'Book not found'});

                    } 

                    res.json(book);
          } catch (error) {
                    return res.status(500).json({ message : error.message});
          }
};

// @desc    Create a new book
// @route   POST /api/books
// @access  Private/Admin
exports.createBook = async (req,res) => {
          try {
                    const { title , author, price, stock, description, coverImage, category } = req.body;

                    const book = Book.create({
                              title,
                              author,
                              price,
                              stock,
                              description,
                              coverImage,
                              category,
                    });

                    res.status(201).json(book);
          } catch (error) {
                    return res.status(500).json({ message : error.message});
          }
};

// @desc    Update book
// @route   PUT /api/books
// @access  Private/Admin
exports.updateBook = async (req,res) => {
          try {
                    const book = await Book.findByIdAndUpdate(
                              req.params.id,
                              req.body,
                              { new:true,runValidators:true}
                    );

                    if (!book) {
                              return res.status(404).json({ message : 'Book not found'});
                    }

                    res.json(book);
          } catch (error){
                    return res.status(500).json({ message : error.message});
          }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private/Admin
exports.deleteBook = async (req,res) => {
          try {
                    const book = await Book.findByIdAndDelete(req.params.id);

                    if (!book) {
                              return res.status(404).json({ message : 'Book not found'});
                    }

                    res.json({ message : 'Book deleted successfully'});
          } catch (error) {
                    return res.status(500).json({message :error.message});
          }
}
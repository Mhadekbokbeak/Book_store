const Book = require('../models/Book');
const Cart = require('../models/Cart');
const Category = require('../models/Category');
const HttpError = require('../utils/httpError');
const { requireObjectId, requireString, parsePagination, escapeRegex } = require('../utils/validators');

const findBookOr404 = async (id) => {
          const book = await Book.findById(requireObjectId(id, 'book id'));
          if (!book) {
                    throw new HttpError(404, 'Book not found');
          }
          return book;
};

const requireExistingCategory = async (value) => {
          const id = requireObjectId(value, 'category id');
          if (!(await Category.exists({ _id: id }))) {
                    throw new HttpError(400, 'Category not found');
          }
          return id;
};

const requireCoverImage = (value) => {
          const url = requireString(value, 'Cover image', { max: 500, optional: true });
          if (url && !/^https?:\/\//i.test(url)) {
                    throw new HttpError(400, 'Cover image must be an http(s) URL');
          }
          return url;
};

// Whitelist + validate the editable fields. Only fields present in the input are returned.
// price and stock are checked by the schema (min 0, stock must be an integer).
const buildBookFields = async (input) => {
          const fields = {};

          if (input.title !== undefined) fields.title = requireString(input.title, 'Book title', { max: 200 });
          if (input.author !== undefined) fields.author = requireString(input.author, 'Author name', { max: 200 });
          if (input.price !== undefined) fields.price = input.price;
          if (input.stock !== undefined) fields.stock = input.stock;
          if (input.description !== undefined) {
                    fields.description = requireString(input.description, 'Description', { max: 2000, optional: true }) ?? '';
          }
          if (input.coverImage !== undefined) fields.coverImage = requireCoverImage(input.coverImage) ?? '';
          if (input.category !== undefined) fields.category = await requireExistingCategory(input.category);

          return fields;
};

exports.getBooks = async (query) => {
          const { page, limit, skip } = parsePagination(query);
          const filter = {};

          // Filter follow Category ID
          if (query.category) {
                    filter.category = requireObjectId(query.category, 'category id');
          }

          // Search by title or author (escaped, so "(" or a crafted pattern cannot break or hang the query)
          if (query.keyword) {
                    const keyword = escapeRegex(String(query.keyword).slice(0, 100));
                    filter.$or = [
                              { title: { $regex: keyword, $options: 'i' } },
                              { author: { $regex: keyword, $options: 'i' } },
                    ];
          }

          const [count, books] = await Promise.all([
                    Book.countDocuments(filter),
                    Book.find(filter)
                              .populate('category', 'name')
                              .sort({ createdAt: -1 })
                              .skip(skip)
                              .limit(limit),
          ]);

          return {
                    books,
                    page,
                    pages: Math.ceil(count / limit),
                    totalBooks: count,
          };
};

exports.getBookById = async (id) => {
          const book = await Book.findById(requireObjectId(id, 'book id')).populate('category', 'name description');
          if (!book) {
                    throw new HttpError(404, 'Book not found');
          }
          return book;
};

exports.createBook = async (input = {}) => {
          const fields = await buildBookFields(input);
          if (!fields.category) {
                    throw new HttpError(400, 'Book must belong to a category');
          }
          return Book.create(fields);
};

// Load, change, save: runs the full schema validation (findByIdAndUpdate skips parts of it)
exports.updateBook = async (id, input = {}) => {
          const book = await findBookOr404(id);
          book.set(await buildBookFields(input));
          return book.save();
};

// Also remove the book from every cart so carts never contain a missing book.
// Past orders keep their own copy of title/price, so they are not affected.
exports.deleteBook = async (id) => {
          const book = await findBookOr404(id);
          await book.deleteOne();
          await Cart.updateMany({ 'items.book': book._id }, { $pull: { items: { book: book._id } } });
};

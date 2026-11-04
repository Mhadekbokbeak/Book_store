const Category = require('../models/Category');
const Book = require('../models/Book');
const HttpError = require('../utils/httpError');
const { requireObjectId, requireString } = require('../utils/validators');

const findCategoryOr404 = async (id) => {
          const category = await Category.findById(requireObjectId(id, 'category id'));
          if (!category) {
                    throw new HttpError(404, 'Category is not found');
          }
          return category;
};

exports.getCategories = () => Category.find().sort({ name: 1 });

exports.createCategory = async ({ name, description } = {}) => {
          const cleanName = requireString(name, 'Category name', { max: 80 });
          const cleanDescription = requireString(description, 'Description', { max: 300, optional: true });

          if (await Category.exists({ name: cleanName })) {
                    throw new HttpError(409, 'Category already exists');
          }

          return Category.create({ name: cleanName, description: cleanDescription });
};

// Only name and description can change (no mass assignment of other fields)
exports.updateCategory = async (id, { name, description } = {}) => {
          const category = await findCategoryOr404(id);

          if (name !== undefined) {
                    category.name = requireString(name, 'Category name', { max: 80 });
          }
          if (description !== undefined) {
                    category.description = requireString(description, 'Description', { max: 300, optional: true }) ?? '';
          }

          return category.save();
};

// A category that still has books cannot be deleted, otherwise those books point at nothing
exports.deleteCategory = async (id) => {
          const category = await findCategoryOr404(id);

          const bookCount = await Book.countDocuments({ category: category._id });
          if (bookCount > 0) {
                    throw new HttpError(409, `Cannot delete category: ${bookCount} book(s) still use it. Move or delete them first.`);
          }

          await category.deleteOne();
};

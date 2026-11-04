const categoryService = require("../services/categoryService");

// @desc Get all categories
// @route GET /api/categories
// @access Public
exports.getCategories = async (req,res) => {
          res.json(await categoryService.getCategories());
};

// @desc Create a new category
// @route POST /api/categories
// @access Private/Admin
exports.createCategory = async (req,res) => {
          const category = await categoryService.createCategory(req.body);
          res.status(201).json(category);
};

// @desc Update category
// @route PUT /api/categories/:id
// @access Private/Admin
exports.updateCategory = async (req,res) => {
          res.json(await categoryService.updateCategory(req.params.id, req.body));
};

// @desc Delete category (only when no book uses it)
// @route DELETE /api/categories/:id
// @access Private/Admin
exports.deleteCategory = async (req,res) => {
          await categoryService.deleteCategory(req.params.id);
          res.json({ message : 'Category deleted successfully'});
};

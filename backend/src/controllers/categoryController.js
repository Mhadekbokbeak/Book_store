const Category = require("../models/Category");

// @desc Get all categories
// @route Get /api/categories
// @access Publice
exports.getCategories = async (req,res) => {
          try {
                    const categories = await Category.find().sort({ name:1 });
                    res.json(categories);
          } catch (error) {
                    return res.status(500).json({ message : error.message});
          }
};


// @desc Create a new category 
// @route POST /api/categories
// @acess Private/Admin
exports.createCategory = async (req,res) => {
          try {
                    const { name , description } = req.body;

                    const existingCategory = await Category.findOne({ name });
                    if (existingCategory) {
                              return res.status(400).json({ message : ' Category already exists'});
                    }

                    const category = await Category.create({ name , description});
                    res.status(201).json(category);
          } catch (error) {
                    return res.status(500).json({message:error.message});
          }
};

// @desc Update category
// @route PUT /api/category/:id
// @acess Private/Admin
exports.updateCategory = async (req,res) => {
          try {
                    const category = await Category.findByIdAndUpdate(
                              req.params.id,
                              req.body,
                              { new : true,runValidators:true}
                    );

                    if (!category) {
                              return res.status(404).json({ message: 'Category is not found'});
                    };

                    res.json(category);
          } catch (error){
                    return res.status(500).json({message : error.message});
          }
};

// @desc Delete category
// @route DELETE /api/category/:id
// @acess Private/Admin
exports.deleteCategory = async (req,res) => {
          try {
                    const category = await Category.findByIdAndDelete(req.params.id);

                    if (!category) {
                              return res.status(404).json({ message: 'Category is not found'});
                    };

                    res.json({ message : 'Category deleted successfully'});
          } catch (error){
                    return res.status(500).json({ message : error.message});
          }
};
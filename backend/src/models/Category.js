const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "Category name is required"],
    unique: true, 
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
},{timestamps:true});

module.exports = mongoose.model('Category', categorySchema); // Exports model Category Schema that Format Structure
const mongoose = require('mongoose');


const bookSchema = new mongoose.Schema({
          title:{
                    type:String,
                    required:[true,'Book title is required'],
                    trim:true,
          },
          author:{
                    type:String,
                    required:[true,'Author name is required'],
                    trim:true,
          },
          price:{
                    type:Number,
                    required:[true,'Price is requied'],
                    min:[0,'Price cannot be negative'],
          },
          stock:{
                    type:Number,
                    required:[true,'Stock count is required'],
                    default:0,
                    min:[0,'Stock cannot be negative'],

          },
          description:{
                    type:String,
                    default:''
          },
          coverImage:{
                    type:String,// URL Imaging
                    default:''
          },
          category:{
                    type:mongoose.Schema.Types.ObjectId,
                    ref:'Category',
                    required:[true,'Book must belong to a category'],
          }
},{timestamps:true});

module.exports = mongoose.model('Book',bookSchema)
const mongoose = require('mongoose');

const MAX_QUANTITY = 99; // max copies of one book per cart

const cartSchema = new mongoose.Schema({
          user:{
                    type:mongoose.Schema.Types.ObjectId,
                    ref:'User',
                    required:true,
                    unique:true // one user have one cart
          },
          items:[
                    {
                              book:{
                                        type:mongoose.Schema.Types.ObjectId,
                                        ref:'Book',
                                        required:true,
                              },
                              quantity:{
                                        type:Number,
                                        required:true,
                                        min:[1,'Quantity cannot be less than 1'],
                                        max:[MAX_QUANTITY,`Quantity cannot be more than ${MAX_QUANTITY}`],
                                        validate:{
                                                  validator:Number.isInteger,
                                                  message:'Quantity must be a whole number',
                                        },
                                        default:1,
                              }
                    }
          ]
},{timestamps:true});

module.exports = mongoose.model('Cart', cartSchema);
module.exports.MAX_QUANTITY = MAX_QUANTITY;
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
          user:{
                    type:mongoose.Schema.Types.ObjectId,
                    ref:'user',
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
                                        default:1,
                              }
                    }
          ]
},{timestamps:true});

module.exports = mongoose.model('Cart', cartSchema);
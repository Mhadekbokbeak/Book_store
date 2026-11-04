const mongoose = require('mongoose');

// Only cash on delivery is implemented. Add a method here only after its payment flow exists.
const PAYMENT_METHODS = ['Cash on Delivery'];

const orderSchema = new mongoose.Schema(
          {
                    user:{
                              type:mongoose.Schema.Types.ObjectId,
                              required:true,
                              ref:"User",
                    },
                    orderItems:[
                              {
                                        book:{
                                                  type:mongoose.Schema.Types.ObjectId,
                                                  required:true,
                                                  ref:"Book",
                                        },
                                        title:{type:String,required:true},
                                        quantity:{type:Number,required:true,min:1},
                                        price:{type:Number,required:true,min:0},
                              },
                    ],
                    shippingAddress:{
                              address:{type:String,required:true,trim:true},
                              city:{type:String,required:true,trim:true},
                              // String, not Number: keeps leading zeros ("01234") and allows letters ("SW1A 1AA")
                              postalCode:{type:String,required:true,trim:true},
                              country:{type:String,required:true,trim:true},
                    },
                    paymentMethod:{
                              type:String,
                              required:true,
                              enum:PAYMENT_METHODS,
                              default:'Cash on Delivery',
                    },
                    totalPrice:{
                              type:Number,
                              required:true,
                              default:0.0
                    },
                    isPaid:{
                              type:Boolean,
                              required:true,
                              default:false,
                    },
                    paidAt:{
                              type:Date,

                    },
                    isDelivered:{
                              type:Boolean,
                              required:true,
                              default:false,
                    },
                    deliveryAt:{
                              type:Date,
                    },
          },
          {timestamps:true}
);

module.exports = mongoose.model("Order",orderSchema);
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;

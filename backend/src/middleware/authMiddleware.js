// Authorization Header (Bearer Token) Before enter Private Routes
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

exports.protect = async (req,res,next) => {
          let token;

          if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                    try {

                              // get token out of Header ('Bearer <TOKEN>')
                              token = req.headers.authorization.split(' ')[1];

                              // chech token
                              const decoded = jwt.verify(token,process.env.JWT_SECRET);

                              // get user data in req.user (not include password)
                              const user = await User.findById(decoded.id).select('-password');
                              if (!user) {
                                        return res.status(401).json({ message: 'Not authorized, user no longer exists' });
                              }

                              req.user = user;

                              return next();
                    } catch (error){
                              return res.status(401).json( {message : "Not authorized , token failed"});
                    }
          }

          if (!token) {
                    return res.status(401).json({ message : 'Not authorized, no token provided' });
          }

}
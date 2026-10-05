const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Help for create JWT token
const generateToken = (id) => {
          return jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRE,
          });
};


// @desc Register new user
// @route POST /api/auth/register
exports.registerUser = async (req,res) => {
          try {
                    const { name, email, password} = req.body;

                    // Check email exists ?
                    const userExists = await User.findOne({ email });
                    if (userExists) {
                              return res.status(400).json({ message : 'Email already exists!'});
                    }

                    // Create new user
                    const user = await User.create({ name , email, password});

                    res.status(200).json({
                              _id:user._id,
                              name:user.name,
                              email:user.email,
                              role:user.role,
                              token:generateToken(user._id),
                    })
          } catch (error) {
                    res.status(500).json({ message : error.message});
          }
};
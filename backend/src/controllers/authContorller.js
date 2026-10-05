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

// @desc Login user
// @routes POST /api/auth/login
exports.loginUser = async (req,res) => {
          try {
                    const {email,password} = req.body;

                    // Find user follow email req
                    const user = await User.findOne({ email }).select('+password');

                    // Check user and compare password
                    if (user && (await user.matchPassword(password))) {
                              return res.json({
                                        _id:user._id,
                                        name:user.name,
                                        email:user.email,
                                        role:user.role,
                                        token:generateToken(user._id),
                              });
                    } 
                    else {
                              return res.status(401).json({ message : "Invalid email or password"});
                    }
          } catch (error) {
                    return res.status(500).json({ message : error.message});
          }
};


// @desc Get user profile (Protect route)
// @Route  GET /api/auth/me

exports.getMe = async (req,res) => {
          try {
                    const user = await User.findById(req.user.id).select('-password');
                    res.json(user);
          } catch (error){
                    return res.status(500).json({ message : error.message });
          }
}
const authService = require('../services/authService');

// Controllers only translate HTTP <-> service calls.
// Errors thrown here are passed to errorMiddleware automatically (Express 5 handles rejected promises).

// @desc Register new user
// @route POST /api/auth/register
// @access Public
exports.registerUser = async (req,res) => {
          const user = await authService.registerUser(req.body);
          res.status(201).json(user);
};

// @desc Login user
// @route POST /api/auth/login
// @access Public
exports.loginUser = async (req,res) => {
          const user = await authService.loginUser(req.body);
          res.json(user);
};

// @desc Get user profile
// @route GET /api/auth/me
// @access Private
// protect middleware already loaded the user (without password), no second query needed
exports.getMe = async (req,res) => {
          res.json(req.user);
};

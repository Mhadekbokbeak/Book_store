const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const { requireString, requireEmail } = require('../utils/validators');

// Help for create JWT token
const generateToken = (id) => {
          return jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRE || '7d',
          });
};

const toAuthResponse = (user) => ({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
});

// role is never read from the request: every new account is a normal user
exports.registerUser = async ({ name, email, password } = {}) => {
          const cleanName = requireString(name, 'Name', { max: 50 });
          const cleanEmail = requireEmail(email);

          // Passwords are not trimmed: spaces are valid characters
          if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
                    throw new HttpError(400, 'Password must be 6-128 characters');
          }

          if (await User.exists({ email: cleanEmail })) {
                    throw new HttpError(409, 'Email already exists!');
          }

          // A parallel request can still win the race; the unique index then raises E11000 -> 409
          const user = await User.create({ name: cleanName, email: cleanEmail, password });
          return toAuthResponse(user);
};

exports.loginUser = async ({ email, password } = {}) => {
          // Reject objects like { "$gt": "" } before they reach the query
          if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
                    throw new HttpError(400, 'Email and password are required');
          }

          const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

          // Same message for both cases so attackers cannot tell which emails exist
          if (!user || !(await user.matchPassword(password))) {
                    throw new HttpError(401, 'Invalid email or password');
          }

          return toAuthResponse(user);
};

// Authorization Header (Bearer Token) Before enter Private Routes
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req,res,next) => {
          const header = req.headers.authorization;

          if (!header || !header.startsWith('Bearer ')) {
                    return res.status(401).json({ message : 'Not authorized, no token provided' });
          }

          let decoded;
          try {
                    // get token out of Header ('Bearer <TOKEN>') and check it
                    decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
          } catch {
                    return res.status(401).json({ message : 'Not authorized, token failed' });
          }

          // Load the user from the DB every time, so role changes and deleted accounts apply immediately.
          // A database error here goes to errorMiddleware (500) instead of looking like a bad token.
          const user = await User.findById(decoded.id).select('-password');
          if (!user) {
                    return res.status(401).json({ message: 'Not authorized, user no longer exists' });
          }

          req.user = user;
          return next();
};

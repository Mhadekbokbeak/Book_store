const express = require('express');
const router = express.Router();
const { registerUser,loginUser,getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

// Slow down password guessing: 20 login/register attempts per IP every 15 minutes
const authLimiter = createRateLimiter({
          windowMs: 15 * 60 * 1000,
          max: 20,
          message: 'Too many attempts, please try again later.',
});

router.post('/register',authLimiter,registerUser);
router.post('/login',authLimiter,loginUser);
router.get('/me',protect,getMe);


module.exports = router;

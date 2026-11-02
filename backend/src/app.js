const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

dotenv.config();

const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
          console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
          process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
          if (!process.env.CLIENT_ORIGINS) {
                    console.error('CLIENT_ORIGINS must be configured in production.');
                    process.exit(1);
          }

          if (process.env.JWT_SECRET.length < 32) {
                    console.error('JWT_SECRET must be at least 32 characters in production.');
                    process.exit(1);
          }
}

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
          console.error('CLIENT_ORIGINS must contain at least one valid origin.');
          process.exit(1);
}

app.use(cors({
          origin(origin, callback) {
                    if (!origin || allowedOrigins.includes(origin)) {
                              return callback(null, true);
                    }

                    return callback(null, false);
          },
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories',require('./routes/categoryRoutes'));
app.use('/api/books',require('./routes/bookRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require("./routes/orderRoutes"));
// Health Check
app.get("/api/health", (req,res) => {
          const databaseReady = mongoose.connection.readyState === 1;
          res.status(databaseReady ? 200 : 503).json({
                    status:databaseReady ? 'OK' : 'UNAVAILABLE',
                    message:databaseReady ? 'Backend and database are ready' : 'Database is unavailable',
                    timestamp:new Date().toISOString()
          });
});
const PORT = process.env.PORT || 5000;

const startServer = async () => {
          try {
                    await connectDB();
                    app.listen(PORT, () => {
                              console.log(`Server is listening on port ${PORT}`);
                    });
          } catch (error) {
                    console.error(`Server startup failed: ${error.message}`);
                    process.exit(1);
          }
};

startServer();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { getAllowedOrigins } = require("./config/env");
const { securityHeaders } = require("./middleware/securityMiddleware");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Builds the Express app only. server.js loads env, connects to MongoDB and starts listening.
// Keeping them apart lets tests start the app on a random port with a test database.
const app = express();
const allowedOrigins = getAllowedOrigins();

app.disable('x-powered-by');

// Behind a hosting proxy, req.ip is the proxy's IP unless we trust it.
// Set TRUST_PROXY to the number of proxies in front of the app (usually 1).
const trustProxyHops = Number(process.env.TRUST_PROXY);
if (Number.isInteger(trustProxyHops) && trustProxyHops > 0) {
          app.set('trust proxy', trustProxyHops);
}

app.use(securityHeaders);
app.use(cors({
          origin(origin, callback) {
                    if (!origin || allowedOrigins.includes(origin)) {
                              return callback(null, true);
                    }

                    return callback(null, false);
          },
}));
app.use(express.json({ limit: '10kb' }));

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

app.use(notFound);
app.use(errorHandler);

module.exports = app;

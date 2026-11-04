// Run directly (`node src/app.js`, the old start command some hosts still use):
// load .env before anything reads process.env. The server itself starts at the bottom of this file.
const runDirectly = require.main === module;
if (runDirectly) {
          require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { getAllowedOrigins } = require("./config/env");
const connectDB = require("./config/db");
const { securityHeaders } = require("./middleware/securityMiddleware");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// server.js connects before listening; the middleware below also connects when
// Vercel loads this Express app directly.
// Keeping them apart lets tests start the app on a random port with a test database.
// `npm start` (node src/server.js) is the normal way to run it; node src/app.js also works (see bottom).
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

app.use('/api', async (_req, res, next) => {
          try {
                    await connectDB();
                    return next();
          } catch (error) {
                    console.error(`MongoDB connection failed: ${error.message}`);
                    return res.status(503).json({
                              status: 'UNAVAILABLE',
                              message: 'Database is unavailable',
                              timestamp: new Date().toISOString(),
                    });
          }
});

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

// Started with `node src/app.js`: hand over to server.js, which validates env,
// connects to MongoDB and listens. Without this the process would build the app and exit silently.
// (module.exports is set above, so server.js receives this same app.)
if (runDirectly) {
          require("./server");
}

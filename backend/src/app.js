const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");


dotenv.config();

// Connect DB mongo
connectDB();

// Use Express assign app !
const app = express();

// Middleware 
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories',require('./routes/categoryRoutes'));
app.use('/api/books',require('./routes/bookRoutes'));

// Health Check
app.get("/api/health", (req,res) => {
          res.status(200).json({
                    status:'OK',
                    message:"Book store Backend is running smoothly",
                    timestamp:new Date().toISOString()
          });
});
const PORT = process.env.PORT || 5000;

app.listen(PORT,() => {
          console.log(`Server is running on http://localhost:${PORT}/api/health`)
});
const mongoose = require("mongoose"); // Connected MongoDB

// Throws on failure; server.js decides to stop the process
const connectDB = async () => {
          const conn = await mongoose.connect(process.env.MONGO_URI);
          console.log(`MongoDB Connected: ${conn.connection.host}`);
};

module.exports = connectDB;

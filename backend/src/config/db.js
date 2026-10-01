const mongoose = require("mongoose"); // Connected MongoDB
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
          try {
                    const conn = await mongoose.connect(process.env.MONGO_URI);
                    console.log(`MongoDB Connected: ${conn.connection.host}`);
          } catch (err) {
                    console.error(`Error connecting to MongoDB: ${err.message}`);
                    process.exit(1) // Stop When DB can't connected
          }
};

module.exports = connectDB;
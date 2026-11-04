const mongoose = require("mongoose");

let connectionPromise;

const connectDB = async () => {
          if (mongoose.connection.readyState === 1) {
                    return mongoose.connection;
          }

          if (connectionPromise) {
                    return connectionPromise;
          }

          if (mongoose.connection.readyState === 2) {
                    return mongoose.connection.asPromise();
          }

          if (!process.env.MONGO_URI) {
                    throw new Error("MONGO_URI is required to connect to MongoDB");
          }

          connectionPromise = mongoose.connect(process.env.MONGO_URI)
                    .then((conn) => {
                              console.log(`MongoDB Connected: ${conn.connection.host}`);
                              return conn;
                    })
                    .finally(() => {
                              connectionPromise = null;
                    });

          return connectionPromise;
};

module.exports = connectDB;

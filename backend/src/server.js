// Load .env once, before anything reads process.env
require("dotenv").config();

const { validateEnv } = require("./config/env");

const problems = validateEnv();
if (problems.length > 0) {
          problems.forEach((problem) => console.error(problem));
          process.exit(1);
}

const app = require("./app");
const connectDB = require("./config/db");

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

// Read and validate environment variables in one place

exports.getAllowedOrigins = () => (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean);

// Returns a list of problems; empty list means the config is usable
exports.validateEnv = () => {
          const problems = [];

          const missingEnv = ['MONGO_URI', 'JWT_SECRET'].filter((key) => !process.env[key]);
          if (missingEnv.length > 0) {
                    problems.push(`Missing required environment variables: ${missingEnv.join(', ')}`);
          }

          if (process.env.NODE_ENV === 'production') {
                    if (!process.env.CLIENT_ORIGINS || exports.getAllowedOrigins().length === 0) {
                              problems.push('CLIENT_ORIGINS must contain at least one valid origin in production.');
                    }

                    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
                              problems.push('JWT_SECRET must be at least 32 characters in production.');
                    }
          }

          return problems;
};

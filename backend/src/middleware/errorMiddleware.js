const HttpError = require('../utils/httpError');

exports.notFound = (req, res) => {
          res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler: known errors become 4xx, anything else is logged and hidden behind a generic 500
// Express recognises error handlers by their 4 parameters, so `next` must stay even though it is unused
exports.errorHandler = (err, req, res, next) => {
          if (err instanceof HttpError) {
                    return res.status(err.status).json({ message: err.message });
          }

          // Body parser errors (bad JSON / body too large)
          if (err.type === 'entity.parse.failed') {
                    return res.status(400).json({ message: 'Request body is not valid JSON' });
          }
          if (err.type === 'entity.too.large') {
                    return res.status(413).json({ message: 'Request body is too large' });
          }

          if (err.name === 'ValidationError') {
                    const message = Object.values(err.errors).map((error) => error.message).join(', ');
                    return res.status(400).json({ message });
          }
          if (err.name === 'CastError') {
                    return res.status(400).json({ message: `Invalid ${err.path}` });
          }

          // Duplicate key from a unique index (e.g. two registrations with the same email at once)
          if (err.code === 11000) {
                    const field = Object.keys(err.keyValue || {})[0] || 'Value';
                    return res.status(409).json({ message: `${field} already exists` });
          }

          console.error(err);
          return res.status(500).json({ message: 'Internal server error' });
};

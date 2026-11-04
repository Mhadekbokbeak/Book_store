// Error with an HTTP status code. Thrown by services, turned into a response by errorMiddleware
class HttpError extends Error {
          constructor(status, message) {
                    super(message);
                    this.name = 'HttpError';
                    this.status = status;
          }
}

module.exports = HttpError;

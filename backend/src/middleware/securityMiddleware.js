// Basic security headers for a JSON API (a small subset of what the helmet package sets)
exports.securityHeaders = (req, res, next) => {
          res.set({
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'DENY',
                    'Referrer-Policy': 'no-referrer',
                    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
          });

          if (process.env.NODE_ENV === 'production') {
                    res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
          }

          next();
};

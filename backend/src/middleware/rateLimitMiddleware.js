// Simple in-memory fixed-window rate limiter keyed by client IP.
// Note: counts live in this process only. If you run several server instances,
// move this to a shared store (e.g. Redis).
exports.createRateLimiter = ({ windowMs, max, message }) => {
          const hits = new Map();

          // Drop expired entries so the map does not grow forever
          const cleanup = setInterval(() => {
                    const now = Date.now();
                    for (const [key, entry] of hits) {
                              if (entry.resetAt <= now) hits.delete(key);
                    }
          }, windowMs);
          cleanup.unref();

          return (req, res, next) => {
                    const now = Date.now();
                    const key = req.ip;

                    let entry = hits.get(key);
                    if (!entry || entry.resetAt <= now) {
                              entry = { count: 0, resetAt: now + windowMs };
                              hits.set(key, entry);
                    }

                    entry.count += 1;
                    if (entry.count > max) {
                              res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
                              return res.status(429).json({ message });
                    }

                    return next();
          };
};

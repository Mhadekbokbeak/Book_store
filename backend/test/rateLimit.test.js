const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimiter } = require('../src/middleware/rateLimitMiddleware');

// Minimal fake req/res, no server or database needed
const call = (limiter, ip) => {
          const result = { status: 200, nextCalled: false };
          const res = {
                    set() { return res; },
                    status(code) { result.status = code; return res; },
                    json() { return res; },
          };
          limiter({ ip }, res, () => { result.nextCalled = true; });
          return result;
};

describe('rate limiter', () => {
          it('allows max requests per IP, then responds 429', () => {
                    const limiter = createRateLimiter({ windowMs: 60_000, max: 2, message: 'slow down' });

                    assert.equal(call(limiter, '1.1.1.1').nextCalled, true);
                    assert.equal(call(limiter, '1.1.1.1').nextCalled, true);
                    assert.equal(call(limiter, '1.1.1.1').status, 429);
                    // other IPs are counted separately
                    assert.equal(call(limiter, '2.2.2.2').nextCalled, true);
          });
});

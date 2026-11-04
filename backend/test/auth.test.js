const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, stopTestServer, request } = require('./helpers');

describe('auth', () => {
          before(() => startTestServer('auth'));
          after(stopTestServer);

          it('registers a user with 201, normalises email and ignores a role in the body', async () => {
                    const res = await request('POST', '/auth/register', {
                              body: { name: ' Alice ', email: ' Alice@Example.com ', password: 'secret123', role: 'admin' },
                    });

                    assert.equal(res.status, 201);
                    assert.equal(res.body.name, 'Alice');
                    assert.equal(res.body.email, 'alice@example.com');
                    assert.equal(res.body.role, 'user');
                    assert.ok(res.body.token);
                    assert.equal(res.body.password, undefined);
          });

          it('rejects a duplicate email with 409', async () => {
                    const res = await request('POST', '/auth/register', {
                              body: { name: 'Again', email: 'alice@example.com', password: 'secret123' },
                    });
                    assert.equal(res.status, 409);
          });

          it('validates register input with 400', async () => {
                    const badEmail = await request('POST', '/auth/register', { body: { name: 'B', email: 'nope', password: 'secret123' } });
                    const shortPassword = await request('POST', '/auth/register', { body: { name: 'B', email: 'b@example.com', password: '123' } });
                    const noBody = await request('POST', '/auth/register');

                    assert.equal(badEmail.status, 400);
                    assert.equal(shortPassword.status, 400);
                    assert.equal(noBody.status, 400);
          });

          it('returns 400 for malformed JSON', async () => {
                    const res = await request('POST', '/auth/login', { rawBody: '{"email":' });
                    assert.equal(res.status, 400);
          });

          it('logs in with correct password (email case-insensitive) and rejects a wrong one', async () => {
                    const ok = await request('POST', '/auth/login', { body: { email: 'ALICE@example.com', password: 'secret123' } });
                    const wrong = await request('POST', '/auth/login', { body: { email: 'alice@example.com', password: 'wrong-pass' } });

                    assert.equal(ok.status, 200);
                    assert.ok(ok.body.token);
                    assert.equal(wrong.status, 401);
          });

          it('rejects NoSQL operator objects in login', async () => {
                    const res = await request('POST', '/auth/login', { body: { email: { $gt: '' }, password: { $gt: '' } } });
                    assert.equal(res.status, 400);
          });

          it('GET /auth/me returns the user without password, and 401 without a valid token', async () => {
                    const login = await request('POST', '/auth/login', { body: { email: 'alice@example.com', password: 'secret123' } });
                    const me = await request('GET', '/auth/me', { token: login.body.token });
                    const noToken = await request('GET', '/auth/me');
                    const badToken = await request('GET', '/auth/me', { token: 'not-a-jwt' });

                    assert.equal(me.status, 200);
                    assert.equal(me.body.email, 'alice@example.com');
                    assert.equal(me.body.password, undefined);
                    assert.equal(noToken.status, 401);
                    assert.equal(badToken.status, 401);
          });

          it('sends security headers and a JSON 404 for unknown routes', async () => {
                    const res = await request('GET', '/does-not-exist');

                    assert.equal(res.status, 404);
                    assert.match(res.body.message, /Route not found/);
                    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
                    assert.equal(res.headers.get('x-powered-by'), null);
          });
});

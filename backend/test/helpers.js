// Test helpers: start the real app on a random port against a throwaway database.
// Needs TEST_MONGO_URI, e.g. mongodb://127.0.0.1:27017/bookstore_test
// The database name must contain "test" because every run DROPS it.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-that-is-long-enough-123';

const { once } = require('node:events');
const mongoose = require('mongoose');
const User = require('../src/models/User');

let server;
let baseUrl;

// suffix gives every test file its own database
const startTestServer = async (suffix) => {
          const uri = process.env.TEST_MONGO_URI;
          if (!uri) {
                    throw new Error('Set TEST_MONGO_URI to run tests, e.g. mongodb://127.0.0.1:27017/bookstore_test');
          }

          const dbName = uri.replace(/^mongodb(\+srv)?:\/\/[^/]+\/?/, '').split('?')[0];
          if (!/test/i.test(dbName)) {
                    throw new Error('TEST_MONGO_URI database name must contain "test" (it is dropped on every run)');
          }

          await mongoose.connect(uri, { dbName: `${dbName}_${suffix}` });
          const app = require('../src/app');
          await mongoose.connection.dropDatabase();
          // dropDatabase removes indexes too; rebuild the unique ones (email, cart.user, category name)
          await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));

          server = app.listen(0, '127.0.0.1');
          await once(server, 'listening');
          baseUrl = `http://127.0.0.1:${server.address().port}/api`;
};

const stopTestServer = async () => {
          await new Promise((resolve) => server.close(resolve));
          await mongoose.disconnect();
};

const request = async (method, path, { token, body, rawBody } = {}) => {
          const headers = {};
          if (token) headers.Authorization = `Bearer ${token}`;
          if (body !== undefined || rawBody !== undefined) headers['Content-Type'] = 'application/json';

          const response = await fetch(`${baseUrl}${path}`, {
                    method,
                    headers,
                    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
          });
          const data = await response.json().catch(() => null);
          return { status: response.status, body: data, headers: response.headers };
};

let userCounter = 0;

// Register a fresh user (optionally promoted to admin) and return its token
const createUser = async ({ admin = false } = {}) => {
          userCounter += 1;
          const email = `user${userCounter}@example.com`;
          const res = await request('POST', '/auth/register', {
                    body: { name: `User ${userCounter}`, email, password: 'secret123' },
          });
          if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`);

          if (admin) await User.updateOne({ email }, { role: 'admin' });
          return { token: res.body.token, id: res.body._id, email };
};

module.exports = { startTestServer, stopTestServer, request, createUser };

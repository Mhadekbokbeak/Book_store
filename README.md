# Book Store

## Backend deployment

Deploy the `backend` directory with Node.js 20.19 or newer. Install with
`npm ci` and start with `npm start`. Copy `backend/.env.example` to `.env` for
local development. In production, configure these environment variables in
the hosting provider:

- `MONGO_URI`: MongoDB connection string. Ensure the database allows
  connections from the backend host.
- `JWT_SECRET`: random secret of at least 32 characters.
- `CLIENT_ORIGINS`: comma-separated frontend origins, with no trailing slash.
- `PORT`: use the port assigned by the hosting provider.
- `JWT_EXPIRE`: optional token lifetime; defaults to `7d`.
- `NODE_ENV`: set to `production`.
- `TRUST_PROXY`: number of reverse proxies in front of the backend (usually
  `1` on hosting platforms). Without it, login rate limiting counts all users
  as one IP.

The backend will not start if required variables are missing, or if production
is missing `CLIENT_ORIGINS` / has a short `JWT_SECRET`. Check
`/api/health` after deployment.

## Frontend deployment

Deploy the `frontend` directory with Node.js 20.19 or newer. Install with
`npm ci`, set `VITE_API_URL` to the backend's public URL ending in `/api`, run
`npm run build`, and publish `dist`. Configure the static host to rewrite
client-side routes to `index.html`; otherwise direct visits to `/profile` or
`/orders` may return 404. See `frontend/README.md` for details.

Before using the admin features, register an account, promote its `role` to
`admin` in MongoDB, and create at least one book category through the protected
`POST /api/categories` endpoint. The book schema requires a category.

Cash on delivery is the only payment method. The backend rejects any other
`paymentMethod` until a payment gateway is integrated (add it to
`PAYMENT_METHODS` in `backend/src/models/Order.js` together with its payment
flow). Marking a cash-on-delivery order as delivered also marks it paid.

## Backend tests

Tests use Node's built-in test runner and need a MongoDB the tests may wipe:

```sh
cd backend
TEST_MONGO_URI=mongodb://127.0.0.1:27017/bookstore_test npm test
```

The database name must contain `test`; it is dropped on every run.

## Upgrading existing data

Orders created before the order-schema fix use the old field `idDelivered`,
numeric postal codes, and `Cash on delivery`. Run this once against each
existing database (it is safe to run again):

```sh
cd backend
npm run migrate:orders
```

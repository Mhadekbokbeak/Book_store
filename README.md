# Soul BookShop

A full-stack online bookstore: customers browse and search books, keep a cart,
and check out with cash on delivery; admins manage categories, books, and
deliveries.

**Stack:** Node.js · Express 5 · MongoDB / Mongoose 9 · JWT · bcrypt ·
React 19 · Vite · React Router 7 · Tailwind CSS 4

## Highlights

### Checkout that cannot oversell

The usual "read stock → check → save" approach breaks when two customers buy
the last copy at the same time: both read `stock = 1`, both pass the check.
Here each book's stock is decremented by **one atomic, conditional query**:

```js
Book.findOneAndUpdate(
  { _id: bookId, stock: { $gte: quantity } }, // matches only if enough is left
  { $inc: { stock: -quantity } }
);
```

If any step after that fails (another book is out of stock, the order cannot be
saved), the stock already taken is given back. A test fires three parallel
checkouts at a book with one copy and asserts exactly one succeeds and stock
ends at 0.

Each order also stores a copy of every book's title and price, so past orders
stay correct after prices change or books are deleted.

### Clear layered architecture

```
route → middleware (auth, admin, rate limit) → controller → service → model
                                    errors from any layer → central error handler
```

- **Controllers** are one or two lines: they translate HTTP to a service call.
- **Services** (`backend/src/services`) hold all business rules, so they can be
  read and tested without thinking about Express.
- **One error handler** turns validation, cast, and duplicate-key errors into
  `400` / `409` responses, and hides internal details behind a generic `500`.

### Security built in

- Passwords hashed with bcrypt and never returned by the API.
- The user's role is loaded from the database on every request, never trusted
  from the token or the request body. Registration can never create an admin.
- Every input is validated: ObjectIds, whole-number quantities, string lengths,
  email format, bounded pagination.
- Login rejects operator objects such as `{ "$gt": "" }` (NoSQL injection).
- Search keywords are escaped before use in a regex (no ReDoS).
- Updates accept only whitelisted fields (no mass assignment).
- Rate limiting on login/register, security headers, a 10 kb body limit, and a
  strict CORS allowlist.
- The server refuses to start with missing secrets, or in production with a
  short `JWT_SECRET`.

### Data stays consistent

- A category that still has books cannot be deleted.
- Deleting a book removes it from every cart; carts never contain a missing book.
- One cart per user, enforced by a unique index and an upsert, so parallel
  requests cannot create two carts.
- Card payments are rejected until a payment gateway exists.
- A re-runnable migration script upgrades orders saved in the old format.

### Tested with zero extra dependencies

25 tests use Node's built-in `node:test` and `fetch`. They start the real app
on a random port against a throwaway database (which must have `test` in its
name, so a real database is never wiped). They cover auth, validation,
permissions, the concurrent checkout, and the data migration.

### A friendly frontend

- Designed for right-handed use: the main action is always bottom-right, delete
  buttons stay away from it, and the hamburger menu sits top-right and slides
  in from the right.
- Pop-ups (native `<dialog>`) for adding to the cart, placing an order, and
  confirming deletes, which turn into bottom sheets on phones.
- Category filter (kept in the URL) and "Load more" paging on the shop page.
- Protected routes for logged-in and admin-only pages.
- Automatic logout when the token expires, then a return to the original page
  after logging in again.
- Light and dark theme.

## Features

| Customer | Admin |
|---|---|
| Register, log in, view profile | Create, edit, and delete categories |
| Browse, search, and filter books with pagination | Add, edit, and delete books |
| Cart: add, change quantity, remove | View all orders |
| Checkout with cash on delivery | Mark orders delivered (cash orders become paid) |
| Order history and delivery status | |

In the frontend, admins can manage categories (create, rename, delete), add
books, and delete books from the shop page. Editing books, viewing all orders,
and marking delivery are available through the API.

## API overview

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Public (rate limited) |
| GET | `/api/auth/me` | User |
| GET | `/api/categories` | Public |
| POST / PUT / DELETE | `/api/categories[/:id]` | Admin |
| GET | `/api/books?keyword=&category=&page=&limit=`, `/api/books/:id` | Public |
| POST / PUT / DELETE | `/api/books[/:id]` | Admin |
| GET / POST | `/api/cart` | User |
| PUT / DELETE | `/api/cart/:bookId` | User |
| POST | `/api/orders` | User |
| GET | `/api/orders/myorders` | User |
| GET | `/api/orders/:id` | Owner or admin |
| GET | `/api/orders/admin/all` | Admin |
| PUT | `/api/orders/:id/delivery` | Admin |
| GET | `/api/health` | Public |

## Project structure

```
backend/
  src/
    server.js        load env, connect MongoDB, start listening
    app.js           Express app: middleware, routes, error handling
    config/          env validation, DB connection
    routes/          URL → middleware → controller
    controllers/     HTTP in/out only
    services/        business logic
    models/          Mongoose schemas
    middleware/      auth, admin, rate limit, security headers, errors
    utils/           validators, HttpError
  scripts/           data migrations
  test/              node:test suites
frontend/
  src/
    pages/           Home, Cart, Checkout, MyOrders, Profile, Login, Register, AdminAddBook
    components/      Navbar, ProtectedRoute
    context/         AuthContext
    services/        axios instance with token + 401 handling
```

## Run locally

Requirements: Node.js 20.19+ and a MongoDB server.

```sh
# Backend (http://localhost:5000)
cd backend
cp .env.example .env   # then set JWT_SECRET
npm install
npm run dev

# Frontend (http://localhost:5173), in a second terminal
cd frontend
cp .env.example .env
npm install
npm run dev
```

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

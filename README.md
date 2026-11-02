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

The checkout currently offers a credit/debit card choice, but no payment
gateway is integrated. Do not accept card orders in production until a payment
provider is connected; cash on delivery is the only implemented payment flow.

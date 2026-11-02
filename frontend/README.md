# React + Vite

## Backend API URL

The frontend reads its backend URL from `VITE_API_URL`. The value must include
the `/api` path, for example:

```env
VITE_API_URL=http://localhost:5000/api
```

For local development, copy `.env.example` to `.env`. The app reports a
configuration error at runtime if a production API URL is missing. For deployment, set
`VITE_API_URL` in the frontend hosting provider's environment settings to your
deployed backend URL, such as `https://your-backend.example.com/api`, then
rebuild or redeploy the frontend. Vite embeds `VITE_` variables into the
frontend at build time, so this value is public and must not contain secrets.

Deploy the `frontend` directory as a static Vite app with `npm ci` and
`npm run build`; publish the generated `dist` directory. Configure the static
host to rewrite client-side routes to `index.html` so direct visits to paths
such as `/profile` continue to work.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

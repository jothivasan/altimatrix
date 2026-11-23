# Altimatrix browser dashboard

From the repository root, run `bun run dev:web` and open
[localhost:5173](http://localhost:5173). The launcher starts the factory from
`packages/core` and the Vite dashboard.

The dashboard uses React, TanStack Router, and TanStack Query. Routes live under
`src/routes`. Vite forwards same-origin `/api` requests to the factory and adds
the bearer token. Run `bun run --filter altimatrix-web build` from the root to
build the frontend.

The API client hooks are in [src/modules/api](src/modules/api) and the views are in [src/screens](src/screens). Change a route in [src/routes](src/routes) and let the TanStack Router Vite plugin regenerate the route tree. Run `bun run --filter altimatrix-web typecheck` from the root to check the frontend against the core API types.

The production build emits static assets under `app/web/dist`. The authenticated API proxy is configured on the development server. Serving the static assets alone does not start the factory. For port and authentication problems, see [troubleshooting](../../docs/TROUBLESHOOTING.md).

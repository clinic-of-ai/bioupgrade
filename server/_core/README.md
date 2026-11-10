# Recovered server core

The omitted source was reconstructed from the exported `dist/index.js` module boundaries. The original Manus Connect OAuth endpoints, JWT/session shape, storage presign transport and owner-notification endpoint are retained. Security checks missing from the export have been added; there are no fake users, development auth bypasses, synthetic scheduled-task identities or replacement OAuth providers.

## Environment requirements

| Capability | Canonical variables | Adopted legacy aliases |
| --- | --- | --- |
| Project JWT verification | `MANUS_PROJECT_ID`, `MANUS_JWT_SECRET` | `VITE_APP_ID`, `JWT_SECRET` |
| Manus authorization browser portal | `MANUS_OAUTH_PORTAL_URL` | `VITE_OAUTH_PORTAL_URL` |
| Manus token exchange / identity | `MANUS_OAUTH_API_URL` | `OAUTH_SERVER_URL` |
| Persisted application users | `DATABASE_URL` | None |
| Storage and owner notifications | `MANUS_API_URL`, `MANUS_API_KEY` | `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` |
| Explicit browser origin | `APP_ORIGIN` | `PUBLIC_APP_URL` |
| Additional exact browser origins | Comma-separated `TRUSTED_ORIGINS` | None |
| Stripe readiness | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Owned by the commerce implementation |

Canonical nonempty names take priority. Values are read at call time, never printed or compiled into browser bundles. Public browser variables used by the legacy map component must contain only browser-safe credentials. OAuth no longer requires a browser-side `VITE_APP_ID` or portal URL: `startLogin()` obtains an authorization URL from the server.

Use the actual frontend origin for `APP_ORIGIN`, for example `https://your-application.example`. Configure it explicitly when the reverse proxy replaces the request Host. If no explicit origin list is configured, the core accepts only an exact match between the browser Origin's host and the incoming Host; it never trusts an arbitrary forwarded Host or a wildcard Manus domain. HTTP is accepted only for loopback development URLs. Browser mutations must send a trusted Origin; missing/null/foreign Origins are rejected. Nonbrowser mutation clients must also supply that trusted Origin. Stripe webhooks are outside this guard and validate their raw-body signatures separately.

## Authentication behavior

`auth.me` remains nullable for logged-out and invalid-session requests. `useAuth()` preserves `user`, `isAuthenticated`, `loading`, `error`, `logout` and `refresh`, and also exposes `authConfigured` and `login`. The hook retrieves `system.authStatus` so missing OAuth/database configuration appears as an honest logged-out error state. `startLogin()` handles unavailable configuration and network errors with a toast and resolves `false`, rather than throwing into a React handler or constructing an undefined URL.

JWTs must use HS256, have an unexpired numeric `exp`, and contain the current project's exact `appId` and a nonempty `openId`. Signing uses `MANUS_JWT_SECRET` or its adopted alias, without assumptions about platform secret length. Identity/roles are resolved from the real application database. A missing database, unresolved persisted user or unavailable identity service cannot create an authenticated account.

Both `webdev_app_session` and the preserved shared `COOKIE_NAME = app_session_id` are accepted and issued for this adopted export. The current cookie takes priority; an invalid supplied cookie is not rescued by another bearer identity. The original Preview `manus-cookie` bearer mirror remains supported on the client, but is validated like every other session. Logout clears both names and removes the bearer mirror and authenticated query cache. The existing `routers.ts` clears the legacy cookie; core tRPC middleware additionally clears the current Preview cookie. Do not add a second modern-cookie clear in the router without removing that middleware behavior.

`POST /api/oauth/login` accepts `{origin: window.location.origin}` after trusted-Origin validation, generates a random nonce, and sets a ten-minute HttpOnly nonce cookie. State encodes `{redirectUri, nonce}` and the server stores the exact callback binding. `GET /api/oauth/callback` verifies and atomically consumes the nonce before exchanging a code, persists/resolves the returned real identity, then redirects only to `/account`. Bare legacy state links without a nonce are deliberately rejected. Public HTTPS cookies are `SameSite=None; Secure`, even when Express sees internal HTTP; plain HTTP loopback uses separate Lax cookies.

The nonce store is bounded, single-process memory. Restarting the process invalidates pending login attempts. Multiple server instances require sticky login/callback routing or replacement with an atomic shared TTL store; another instance fails closed instead of accepting unverifiable state. This implementation does not provision a Redis service or write an OAuth-state schema outside the assigned scope.

## Runtime and services

`server/_core/index.ts` is the package-script entrypoint. It binds `0.0.0.0` on the exact supplied `PORT`, defaulting to 3000. Invalid/busy ports fail startup without selecting another port. Vite uses the project's existing config in middleware mode in development. Production serves the real project `dist/public` directory. Unknown `/api` and `/manus-storage` routes return JSON 404s before any SPA fallback, and missing file assets are not turned into HTML.

- `GET /api/health` is unauthenticated listener health: HTTP 200 may correctly report `configured: false`.
- `GET /api/ready` reports configuration readiness and returns 503 while auth/database/payments are missing. `connectivityVerified: false` explicitly avoids claiming tested live upstream connectivity.
- `GET /api/oauth/config` and `system.authStatus` expose sign-in configuration without credentials.
- OAuth login, unresolved protected account access, storage and owner notifications fail closed with service-unavailable errors when their required service is absent.
- Stripe's raw webhook registration precedes every JSON/urlencoded parser.

The storage proxy only submits validated object keys to the configured credentialed `v1/storage/presign/get` service. Its redirect destination must be an HTTPS URL returned by that service; it does not accept or fetch user-supplied URLs. Storage and OAuth transports refuse upstream redirects that could send service credentials elsewhere. No upload, database migration, provider provisioning or production write was performed during recovery.

## Validation and parent integration

`pnpm exec vitest run server/core-auth.test.ts` exercises 44 isolated mocked tests: JWT project/expiry/algorithm/signature checks, both cookie names and bearer fallback, real-user resolution, state mismatch/replay/tampering/expiry, unavailable persistence/configuration, official transport payloads, HTTPS iframe and loopback cookie behavior, trusted-Origin mutation checks, raw webhook ordering, readiness, API/static routing, fixed-port conflict failure, safe storage and non-crashing client login. These tests never connect to a production database or an external OAuth/Stripe/storage service.

The full `pnpm check` passed during integration, and server esbuild plus Vite production builds completed in temporary output directories without replacing the original exported bundle. Vite reported existing undefined analytics placeholders and a large-client-chunk warning; those are parent-owned frontend/configuration concerns. A source production smoke confirmed the requested fixed listener, health 200/configured false, readiness 503, auth.me null, OAuth/storage 503 and unknown API JSON 404 without credentials.

The pre-existing `server/auth.logout.test.ts` asserts exactly one cleared cookie. Update that parent-owned test to expect the preserved legacy cookie plus `webdev_app_session`; the extra clear is required to actually log out current Preview sessions. `shared/types.ts` also requires the recovered parent-owned `shared/_core/errors.ts` export. Commerce/database/schema fixes and active UI/configuration changes remain outside core ownership. The legacy map component and presentational AIChatBox do not establish live service readiness by themselves; no new AI/map transport was invented.

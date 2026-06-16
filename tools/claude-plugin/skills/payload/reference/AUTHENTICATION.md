# Authentication

Use when configuring user auth on a Payload collection — login options, JWT/cookie strategy, API keys, custom strategies, email verification, token data, or auth operations. Also covers CSRF defense and cross-domain cookie setup.

## Quick Reference

| Task                                    | Solution                                                 | Section                                                                      |
| --------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Enable auth on a collection             | `auth: true` or `auth: { ... }` on the collection config | [Auth Config Options](#auth-config-options)                                  |
| Set JWT expiry                          | `auth.tokenExpiration` (seconds)                         | [Auth Config Options](#auth-config-options)                                  |
| Lock out after N failed logins          | `auth.maxLoginAttempts` + `auth.lockTime`                | [Auth Config Options](#auth-config-options)                                  |
| Allow username login                    | `auth.loginWithUsername`                                 | [Auth Config Options](#auth-config-options)                                  |
| Authenticate via `Authorization` header | `Authorization: JWT <token>`                             | [JWT](#jwt)                                                                  |
| Authenticate via API key                | `Authorization: <slug> API-Key <key>`                    | [API Keys](#api-keys)                                                        |
| Add a custom auth strategy              | `auth.strategies` array                                  | [Custom Strategies](#custom-strategies)                                      |
| Defend against CSRF                     | `csrf: [...]` in root config                             | [Cookies + CSRF](#cookies--csrf)                                             |
| Cross-domain cookie auth                | `auth.cookies.sameSite: 'None'` + `secure: true`         | [Cookies + CSRF](#cookies--csrf)                                             |
| Send field data in the JWT              | `saveToJWT: true` on the field                           | [saveToJWT](#savetojwt)                                                      |
| Get current user in server code         | `payload.auth({ headers })`                              | [Operations](#operations)                                                    |
| Require email verification              | `auth.verify: true`                                      | [Email Verification + Forgot Password](#email-verification--forgot-password) |

## Auth Config Options

Set `auth: true` on a collection for defaults, or pass an object to tune behavior:

```ts
// see test/auth/config.ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7200, // seconds; default 7200 (2 h)
    maxLoginAttempts: 5, // set to 0 to disable lockout
    lockTime: 600 * 1000, // ms; default 10 min
    verify: false, // set to true or an object — see Email Verification
    depth: 0, // how deep to populate user doc on JWT creation; default 0
    useAPIKey: true, // enable API key per-user; see API Keys
    disableLocalStrategy: false, // disable email+password login entirely
    removeTokenFromResponses: false, // omit token from login/refresh responses
    useSessions: true, // false = stateless JWT only (no session)
    cookies: {
      sameSite: 'Lax',
      secure: false, // set to true in production
      domain: undefined,
    },
    loginWithUsername: false, // see Login With Username below
    forgotPassword: {
      expiration: 3600000, // ms; default 1 h
    },
  },
}
```

### Login With Username

```ts
// see test/login-with-username/config.ts
auth: {
  loginWithUsername: true, // shorthand — username only, no email fallback
}

// or object form for finer control:
auth: {
  loginWithUsername: {
    allowEmailLogin: true,   // allow login with either username or email; default false
    requireEmail: false,     // require email on user creation; default false
    requireUsername: false,  // require username on user creation; default false
  },
}
```

`loginWithUsername: true` shorthand disables email login — to keep email as a fallback, use the object form with `allowEmailLogin: true`.

### `admin.autoLogin` and `admin.autoRefresh`

```ts
// see test/auth/config.ts
import { buildConfig } from 'payload'

export default buildConfig({
  admin: {
    // Skip the login screen in development only
    autoLogin:
      process.env.NODE_ENV === 'development'
        ? { email: 'dev@example.com', password: 'test', prefillOnly: true }
        : false,

    // Keep the token alive while the admin panel is open
    autoRefresh: true,
  },
})
```

Never set `autoLogin` unconditionally — gate it behind an environment check or it will be active in production.

## Strategies

### Local Strategy (default)

Email + password login. Enabled by default on any auth collection. To disable it entirely (e.g., API-key-only collection), set `disableLocalStrategy: true`:

```ts
// see test/auth/config.ts — apiKeysSlug collection
auth: {
  useAPIKey: true,
  disableLocalStrategy: true,
}
```

With `disableLocalStrategy: { enableFields: true }` the DB columns (`hash`, `salt`, etc.) are still created but login via email/password is blocked, which is useful when you want to store credentials but authenticate via a custom strategy.

### API Keys

Enable per-user API keys with `useAPIKey: true`. Each user document gets an **API Key** field in the admin panel.

**HTTP header format:**

```
Authorization: <collection-slug> API-Key <apiKey>
```

```ts
// see test/auth/config.ts — apiKeysSlug collection
const response = await fetch('http://localhost:3000/api/pages', {
  headers: {
    Authorization: `api-keys API-Key ${apiKey}`,
  },
})
```

API keys are encrypted with `PAYLOAD_SECRET`. Rotating `PAYLOAD_SECRET` **invalidates all existing API keys and JWTs** — plan a re-issue process before rotating in production.

### Custom Strategies

Register one or more custom strategies on the collection:

```ts
// see test/auth/custom-strategy/
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    disableLocalStrategy: true,
    strategies: [
      {
        name: 'header-code',
        authenticate: async ({ payload, headers, canSetHeaders, isGraphQL }) => {
          const usersQuery = await payload.find({
            collection: 'users',
            where: {
              code: { equals: headers.get('x-code') },
              secret: { equals: headers.get('x-secret') },
            },
          })

          return {
            // Must include the collection slug on the user object
            user: usersQuery.docs[0] ? { collection: 'users', ...usersQuery.docs[0] } : null,

            // Optionally set response headers (only when canSetHeaders is true)
            responseHeaders: new Headers({ 'x-auth-status': 'ok' }),
          }
        },
      },
    ],
  },
  fields: [
    { name: 'code', type: 'text', index: true, unique: true },
    { name: 'secret', type: 'text' },
  ],
}
```

**`authenticate` arguments:**

| Argument        | Description                                                           |
| --------------- | --------------------------------------------------------------------- |
| `payload`       | Payload instance for DB lookups                                       |
| `headers`       | Incoming request headers                                              |
| `canSetHeaders` | `false` when response headers can't be set (e.g., streaming contexts) |
| `isGraphQL`     | `true` when called from the GraphQL endpoint                          |

**Dev restart caveat:** Changes to custom strategies require a full server restart — they are not hot-reloaded during development.

## JWT

Payload issues a JWT on login, refresh, and me operations. Use the `Authorization` header to authenticate REST or GraphQL requests without a cookie:

```ts
const { token } = await fetch('http://localhost:3000/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'pass' }),
}).then((r) => r.json())

// subsequent request
const res = await fetch('http://localhost:3000/api/posts', {
  headers: { Authorization: `JWT ${token}` },
})
```

### `removeTokenFromResponses`

Omit the JWT from `login`, `refresh`, and `me` response bodies (cookie-only flow):

```ts
// see test/auth/config.ts — removed-token directory pattern
auth: {
  removeTokenFromResponses: true,
}
```

### External JWT Validation

When validating Payload JWTs in an external service, Payload processes `PAYLOAD_SECRET` before using it as the signing key. Do not pass the raw secret to `jsonwebtoken`:

```ts
// see docs/authentication/jwt.mdx
import crypto from 'node:crypto'

const jwtSecret = crypto
  .createHash('sha256')
  .update(process.env.PAYLOAD_SECRET)
  .digest('hex')
  .slice(0, 32)

// Use jwtSecret with your JWT library (e.g. jsonwebtoken.verify(token, jwtSecret))
```

## Cookies + CSRF

Payload sets an **HTTP-only** cookie on login. Browsers include it automatically on same-origin requests; for `fetch` calls include `credentials: 'include'`:

```ts
const res = await fetch('http://localhost:3000/api/posts', {
  credentials: 'include',
})
```

HTTP-only cookies **cannot be read from JavaScript** — `document.cookie` will not see them. To get the current user from client code, call `/api/users/me` instead.

### CSRF Allow-list

Add trusted frontend origins to the root `csrf` array. Without this, cross-origin cookie-authenticated requests are blocked:

```ts
// see docs/authentication/cookies.mdx
import { buildConfig } from 'payload'

export default buildConfig({
  serverURL: 'https://api.myapp.com',
  csrf: [
    'https://app.myapp.com',
    'https://staging.myapp.com',
    // serverURL is included automatically
  ],
})
```

### Cross-Domain Cookies

If the frontend and API are on different domains (not subdomains), configure the cookie for third-party use:

```ts
// see test/auth/config.ts — cookies config
auth: {
  cookies: {
    sameSite: 'None', // allow cross-domain
    secure: true,     // required with SameSite: None; requires HTTPS
  },
}
```

`secure: true` does not work on `http://localhost` — gate it behind an environment variable in development.

## Email Verification + Forgot Password

### Email Verification

Require users to verify their email before they can authenticate:

```ts
// see test/auth/config.ts — publicUsersSlug collection
auth: {
  verify: true,
}
```

Customize the verification email:

```ts
auth: {
  verify: {
    generateEmailHTML: ({ req, token, user }) => {
      const url = `https://app.myapp.com/verify?token=${token}`
      return `<p>Hi ${user.email}, <a href="${url}">verify your account</a></p>`
    },
    generateEmailSubject: ({ user }) => `Verify your account, ${user.email}`,
  },
}
```

If you redirect users to your own frontend for verification, your frontend must call `POST /api/[slug]/verify/:token` (or the GraphQL `verifyEmail` mutation) with the token.

### Forgot Password

```ts
auth: {
  forgotPassword: {
    expiration: 3600000, // token valid for 1 h (ms)
    generateEmailHTML: ({ req, token, user }) => {
      const url = `https://app.myapp.com/reset-password?token=${token}`
      return `<p>Click <a href="${url}">here</a> to reset your password.</p>`
    },
    generateEmailSubject: ({ user }) => `Reset your password, ${user.email}`,
  },
}
```

The built-in reset page is at `${serverURL}/admin/reset/${token}` — link there if you don't have a custom frontend.

## `saveToJWT`

Fields marked `saveToJWT` are encoded in the JWT and available at `req.user` in hooks and access control — no DB query needed.

```ts
// see test/auth/config.ts
fields: [
  {
    name: 'roles',
    type: 'select',
    hasMany: true,
    options: ['admin', 'editor', 'user'],
    saveToJWT: true, // stored under 'roles' key in JWT
  },
  {
    name: 'tenantId',
    type: 'text',
    saveToJWT: 'x-tenant-id', // string value renames the key in the JWT
  },
  {
    name: 'profile',
    type: 'group',
    saveToJWT: true, // entire group object stored under 'profile' key
    fields: [
      { name: 'plan', type: 'text', saveToJWT: true },
      { name: 'internalNote', type: 'text', saveToJWT: false }, // excluded
    ],
  },
]
```

**Group/tab nesting semantics:**

- `saveToJWT: true` on a named group/tab → the whole object is stored nested under the group name.
- `saveToJWT: true` on a field inside a group where the group itself has no `saveToJWT` → the field is **lifted** to the JWT root level.
- `saveToJWT: 'key'` on any field (including inside a group) → always stored at the root JWT under that key.

## Operations

### REST Endpoints

All endpoints are relative to `/api/[collection-slug]`:

| Operation       | Method + Path                    | Notes                                        |
| --------------- | -------------------------------- | -------------------------------------------- |
| Login           | `POST /login`                    | Returns `{ user, token, exp }` + sets cookie |
| Logout          | `POST /logout?allSessions=false` | `allSessions=true` ends all sessions         |
| Me              | `GET /me`                        | Returns current user or null                 |
| Refresh         | `POST /refresh-token`            | Renews token + cookie                        |
| Forgot password | `POST /forgot-password`          | Sends reset email                            |
| Reset password  | `POST /reset-password`           | Accepts `{ token, password }`                |
| Verify email    | `POST /verify/:token`            | Sets `_verified: true`                       |
| Unlock          | `POST /unlock`                   | Clears lockout; requires `unlock` access     |
| Access snapshot | `GET /api/access`                | Returns all permissions for current user     |

### Local API

```ts
// see docs/authentication/operations.mdx
// Authenticate from server-side code (e.g., middleware, custom endpoints)
const { user, collection } = await payload.auth({ headers, canSetHeaders: false })

// Other auth operations
await payload.login({ collection: 'users', data: { email, password } })
await payload.logout({ collection: 'users', req })
await payload.forgotPassword({ collection: 'users', data: { email } })
await payload.resetPassword({ collection: 'users', data: { token, password } })
await payload.verifyEmail({ collection: 'users', token })
await payload.unlock({ collection: 'users', data: { email } })
```

### Server Functions (`@payloadcms/next/auth`)

Payload ships ready-to-use server functions for the most common operations:

```ts
import { login, logout, refresh } from '@payloadcms/next/auth'

// In a Next.js Server Action:
export async function loginAction(email: string, password: string) {
  'use server'
  return login({ collection: 'users', data: { email, password } })
}
```

See `docs/local-api/server-functions` for the full list and signatures.

## Override Default Auth Fields

Override `email`, `password`, or `username` in the collection's `fields` array to add access control or other options. The field must keep the same `name` — Payload merges your definition over the injected defaults:

```ts
// see docs/authentication/overview.mdx — Access Control section
fields: [
  {
    name: 'email',
    type: 'text',
    access: {
      create: () => true,
      read: ({ req }) => req.user?.roles?.includes('admin') ?? false,
      update: () => false,
    },
  },
  {
    name: 'password',
    type: 'text',
    hidden: true, // prevents duplicate field in the admin panel
    access: {
      update: () => false,
    },
  },
]
```

## Gotchas

1. **Overriding auth fields must preserve behavior.** Redeclaring `email` or `username` with `read: () => false` disables the **Unlock** action in the admin panel — Payload needs access to the user-identifying field to perform unlocks. Restrict `update` instead of `read` when possible.

2. **`PAYLOAD_SECRET` rotation invalidates all tokens and API keys.** API keys are encrypted with the secret; JWTs are signed with a SHA-256 derivative of it. Rotating the secret in production requires a re-issue plan for all API keys and forces all users to log in again.

3. **CSRF allow-list omission causes cross-domain failures.** If your frontend and API are on different origins and you rely on cookie auth, requests will fail with a 403 unless the frontend origin is listed in `csrf`. The `serverURL` is included automatically.

4. **HTTP-only means JavaScript can't read the cookie.** `document.cookie` returns nothing for Payload's auth cookie. To get the current user in a client component, call `GET /api/[slug]/me` with `credentials: 'include'`.

5. **`loginWithUsername: true` disables email login.** The shorthand form disables `allowEmailLogin`. Use the object form `{ allowEmailLogin: true }` if you want users to log in with either username or email.

6. **`auth.depth` affects JWT size and performance.** Increasing `depth` causes Payload to populate related documents into the JWT payload on every request. Keep it at `0` (default) and use `saveToJWT` on specific fields to include only what's needed.

7. **Custom strategies require a server restart.** Auth strategies are not hot-reloaded. Use `nodemon` or equivalent in development.

## Related

- [ACCESS-CONTROL.md](ACCESS-CONTROL.md) — `unlock` access function, `readVersions`, field-access side effects
- [COLLECTIONS.md](COLLECTIONS.md) — `auth: true` collection config, full collection options
- [HOOKS.md](HOOKS.md) — `beforeLogin`, `afterLogin`, `afterLogout`, `afterMe`, `afterRefresh`, `afterForgotPassword` auth hooks
- [PRODUCTION.md](PRODUCTION.md) — `PAYLOAD_SECRET` management, secure cookie setup, CORS + CSRF in prod

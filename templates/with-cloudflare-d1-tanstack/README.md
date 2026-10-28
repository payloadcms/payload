# Payload + TanStack Start on Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/payloadcms/payload/tree/main/templates/with-cloudflare-d1-tanstack)

A minimal full-stack example that runs the Payload admin, Payload REST API, and a TanStack Start frontend in one Cloudflare Worker.

- **TanStack Start** handles SSR, routing, and server functions.
- **Payload 4** provides the admin UI, auth, Local API, and REST API.
- **Cloudflare D1** stores users, posts, preferences, and migration state.
- **Cloudflare R2** stores Payload media uploads.

The implementation combines Payload's official `blank-tanstack` template with the D1/R2 and deployment approach from its `with-cloudflare-d1` template.

> [!IMPORTANT]
> Payload's TanStack Start adapter is currently available in Payload 4 beta. Payload's Worker bundle also generally requires a paid Workers plan because it exceeds the free plan's compressed script-size limit.

## Deploy to Cloudflare

Click the button above to create a copy of this template in your Git provider and deploy it to Cloudflare Workers. Cloudflare provisions the D1 database and R2 bucket from `wrangler.jsonc` and prompts you to configure `PAYLOAD_SECRET` during setup.

## Requirements

- Node.js 24.22.1 or newer
- pnpm 9, 10, or 11
- A Cloudflare account for remote deployment

## Run locally

```bash
pnpm install
cp .dev.vars.example .dev.vars
# Replace PAYLOAD_SECRET in .dev.vars with: openssl rand -hex 32
pnpm dev
```

Open:

- Frontend: <http://localhost:3000>
- Payload admin: <http://localhost:3000/admin>
- Posts REST API: <http://localhost:3000/api/posts>

Wrangler supplies local D1 and R2 bindings to TanStack's Node development server. On the first admin visit, create the first user, then add a Post with a publish date to render it on the homepage.

To exercise the built application in the actual Workers runtime, run `pnpm preview`. This builds first and then starts Cloudflare's local preview server at <http://localhost:4173>.

## Cloudflare setup

Authenticate Wrangler and create the two resources:

```bash
pnpm wrangler login
pnpm wrangler d1 create my-app
pnpm wrangler r2 bucket create my-app
```

Copy the D1 `database_id` returned by Wrangler into [`wrangler.jsonc`](./wrangler.jsonc). The configured D1 database and R2 bucket names must match the names you created.

Add the production Payload secret:

```bash
pnpm wrangler secret put PAYLOAD_SECRET
```

Generate and commit a migration whenever the Payload schema changes:

```bash
pnpm migrate:create
```

Then deploy:

```bash
pnpm deploy
```

`pnpm deploy` applies Payload migrations to the remote D1 database, builds the TanStack/Payload Worker, and deploys it with Wrangler.

## Useful commands

| Command               | Purpose                                                      |
| --------------------- | ------------------------------------------------------------ |
| `pnpm dev`            | Run TanStack's fast Node dev server with local D1/R2 proxies |
| `pnpm build`          | Build the Cloudflare Worker and static assets                |
| `pnpm preview`        | Build and preview in the local Workers runtime               |
| `pnpm generate:types` | Regenerate Cloudflare and Payload types                      |
| `pnpm migrate:create` | Create a migration after schema changes                      |
| `pnpm migrate`        | Apply migrations to local D1                                 |
| `pnpm migrate:remote` | Apply migrations to remote D1                                |
| `pnpm test:int`       | Run Local API integration tests                              |
| `pnpm lint`           | Run ESLint                                                   |

## How the pieces connect

`vite.config.ts` composes Payload's TanStack adapter with Cloudflare's Vite plugin for builds and Worker previews. The SSR environment is the Worker entry and owns TanStack's RSC child environment. A small build-only compatibility plugin bundles Payload's Node-oriented package boundaries and supplies fallback module URLs for CLI-only code paths, because Workerd has no Node module loader and does not define `import.meta.url` for generated modules. Normal `pnpm dev` intentionally uses TanStack's Node runtime because Payload 4's beta dev optimizer and Cloudflare's optimizer currently select different conditional exports.

`src/payload.config.ts` imports a small runtime binding module. Vite aliases it to `cloudflare:workers` for production builds; Node development and Payload CLI commands use Wrangler's `getPlatformProxy` instead. That keeps the same Payload config usable for development, tests, type generation, migrations, and the deployed Worker.

`src/app/_frontend/posts.functions.ts` demonstrates Payload's Local API inside a TanStack server function. The generated REST routes remain available under `/api`, while Payload's admin routes remain available under `/admin`.

## Current limitations

- This example intentionally disables image cropping and focal-point transforms because Workers does not provide Payload's normal `sharp` runtime.
- Payload's reference Cloudflare template notes that GraphQL support on Workers is not yet guaranteed. This example focuses on the Local and REST APIs.
- If you add a named Wrangler environment, set `CLOUDFLARE_ENV` when running Payload migration commands so the CLI selects the same bindings.

## Upstream references

- [Payload TanStack template](https://github.com/payloadcms/payload/tree/main/templates/blank-tanstack)
- [Payload Cloudflare D1 template](https://github.com/payloadcms/payload/tree/main/templates/with-cloudflare-d1)
- [Cloudflare's TanStack Start guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)

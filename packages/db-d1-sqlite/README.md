# Payload D1 SQLite Adapter

Official D1 SQLite adapter for [Payload](https://payloadcms.com).

- [Main Repository](https://github.com/payloadcms/payload)
- [Payload Docs](https://payloadcms.com/docs)

## Installation

```bash
npm install @payloadcms/db-d1-sqlite
```

## Usage

### Cloudflare Workers (D1 binding)

```ts
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'

export default buildConfig({
  // Your config goes here
  collections: [
    // Collections go here
  ],
  // Configure the D1 adapter here
  db: sqliteD1Adapter({
    // D1-specific arguments go here.
    // `binding` should match the D1 database binding in your Cloudflare Worker environment.
    binding: cloudflare.env.D1,
  }),
})
```

### HTTP (REST API — Vercel, Node, etc.)

Use the [D1 HTTP API](https://developers.cloudflare.com/d1/build-with-d1/d1-api/) when you do not have a D1 binding (for example on Vercel). Provide a Cloudflare API token with D1 permissions and your account and database IDs.

Expect higher latency than a Workers binding (one HTTP request per query, plus network). Read replica routing (`readReplicas`) is not available over the HTTP API; use a Cloudflare Workers deployment with a D1 binding if you need it.

```ts
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'

export default buildConfig({
  collections: [
    // Collections go here
  ],
  db: sqliteD1Adapter({
    http: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID,
    },
  }),
})
```

More detailed usage can be found in the [Payload Docs](https://payloadcms.com/docs/database/sqlite).

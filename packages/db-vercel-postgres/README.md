# Payload Postgres Adapter

[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) adapter for [Payload](https://payloadcms.com).

- [Main Repository](https://github.com/payloadcms/payload)
- [Payload Docs](https://payloadcms.com/docs)

## Installation

```bash
npm install @payloadcms/db-vercel-postgres
```

## Usage

### Explicit Connection String

```ts
import { buildConfig } from 'payload'
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'

export default buildConfig({
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  // ...rest of config
})
```

### Automatic Connection String Detection

Have Vercel automatically detect from environment variable (typically `process.env.POSTGRES_URL`)

```ts
export default buildConfig({
  db: postgresAdapter(),
  // ...rest of config
})
```

More detailed usage can be found in the [Payload Docs](https://payloadcms.com/docs/configuration/overview).

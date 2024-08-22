# Payload Postgres Adapter

Official Postgres adapter for [Payload](https://payloadcms.com).

- [Main Repository](https://github.com/payloadcms/payload)
- [Payload Docs](https://payloadcms.com/docs)

## Installation

```bash
npm install @payloadcms/db-postgres
```

## Usage

### Explicit Connection String

```ts
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  // ...rest of config
})
```

### Automatic Connection String Detection

Have Vercel automatically detect from environment variable (typically `process.env.DATABASE_URL`)

```ts
export default buildConfig({
  db: postgresAdapter(),
  // ...rest of config
})
```

More detailed usage can be found in the [Payload Docs](https://payloadcms.com/docs/configuration/overview).

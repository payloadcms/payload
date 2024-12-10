# Payload MongoDB Adapter

Official MongoDB adapter for [Payload](https://payloadcms.com).

- [Main Repository](https://github.com/payloadcms/payload)
- [Payload Docs](https://payloadcms.com/docs)

## Installation

```bash
npm install @payloadcms/db-mongodb
```

## Usage

```ts
import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  // ...rest of config
})
```

More detailed usage can be found in the [Payload Docs](https://payloadcms.com/docs/configuration/overview).

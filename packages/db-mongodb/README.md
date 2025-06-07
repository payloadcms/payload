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
    // Enable manual join mode when using Firestore's Mongo compatibility layer
    // or other databases that do not support $lookup pipelines
    manualJoins: true,
  }),
  // ...rest of config
})
```

`manualJoins` disables `$lookup` stages in aggregation pipelines. Joins are
resolved in Node.js instead, allowing the adapter to run against Mongo
compatibility layers that lack full aggregation support.

More detailed usage can be found in the [Payload Docs](https://payloadcms.com/docs/configuration/overview).

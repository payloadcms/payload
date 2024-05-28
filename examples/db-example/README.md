# Example Database Adapter for Payload

- [Main Repository](https://github.com/payloadcms/payload)
- [Payload Docs](https://payloadcms.com/docs)

## Installation

```bash
npm install @payloadcms/db-example
```

## Usage

```ts
import { buildConfig } from 'payload/config'
import { exampleAdapter } from '@payloadcms/db-example'

export default buildConfig({
  db: exampleAdapter({
    url: process.env.DATABASE_URI,
  }),
  // ...rest of config
})
```

More detailed usage can be found in the [Payload Docs](https://payloadcms.com/docs/configuration/overview).

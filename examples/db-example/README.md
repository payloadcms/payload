# Example Database Adapter for Payload

- [Main Repository](https://github.com/payloadcms/payload)
- [Payload Docs](https://payloadcms.com/docs)

To build a fully working database adapter for Payload you must implement the database adapter interface. There is a mix
of required and not required methods depending on the areas you need to support. Payload will call the adapter's `init`
function followed by the `connect` method if it exists. The adapter must create any schema necessary on the target
database in the init function. The adapter can be extended as needed to keep track of models for collections and other
artifacts necessary to perform all the needed operations.

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

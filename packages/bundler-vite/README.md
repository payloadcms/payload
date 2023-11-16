# Payload Vite Adapter

Official Vite adapter for [Payload](https://payloadcms.com).

- [Main Repository](https://github.com/payloadcms/payload)
- [Payload Docs](https://payloadcms.com/docs)

## Installation

```bash
npm install @payloadcms/bundler-vite
```

## Usage

```ts
import { buildConfig } from 'payload/config'
import { viteBundler } from '@payloadcms/bundler-vite'

export default buildConfig({
  bundler: viteBundler(),
  // ...rest of config
})

```

More detailed usage can be found in the [Payload Docs](https://payloadcms.com/docs/configuration/overview).


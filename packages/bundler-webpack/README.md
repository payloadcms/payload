# Payload Webpack Adapter

Official Webpack adapter for [Payload](https://payloadcms.com).

- [Main Repository](https://github.com/payloadcms/payload)
- [Payload Docs](https://payloadcms.com/docs)

## Installation

```bash
npm install @payloadcms/bundler-webpack
```

## Usage

```ts
import { buildConfig } from 'payload/config'
import { webpackBundler } from '@payloadcms/bundler-webpack'

export default buildConfig({
  bundler: webpackBundler()
  // ...rest of config
})

```

More detailed usage can be found in the [Payload Docs](https://payloadcms.com/docs/configuration/overview).


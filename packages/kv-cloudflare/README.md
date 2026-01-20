# Cloudflare KV Adapter for Payload (beta)

This package lets you back Payload's KV API with [Cloudflare KV](https://developers.cloudflare.com/kv/).

## Installation

```sh
pnpm add @payloadcms/kv-cloudflare
```

## Usage

Provide a Cloudflare KV binding (Workers/Pages/Miniflare):

```ts
import { cloudflareKVAdapter } from '@payloadcms/kv-cloudflare'

export default buildConfig({
  collections: [Media],
  kv: cloudflareKVAdapter({
    // Cloudflare KV namespace binding (required)
    binding: env.PAYLOAD_KV,
    // Optional prefix to isolate keys, defaults to 'payload-kv:'
    keyPrefix: 'payload-kv:',
  }),
})
```

Then access it through `payload.kv`:

```ts
await payload.kv.set('key', { value: 1 })
const data = await payload.kv.get('key')
payload.logger.info(data)
```

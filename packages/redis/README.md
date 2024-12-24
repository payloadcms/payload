# Redis KV Adapter for Payload (beta)

This package provides a way to use [Redis](https://redis.io) as a KV adapter with Payload.

## Installation

```sh
pnpm add @payloadcms/kv-redis
```

## Usage

```ts
import { redisKVAdapter } from '@payloadcms/kv-redis'

export default buildConfig({
  collections: [Media],
  kv: redisKVAdapter({
    // Redis connection URL. Defaults to process.env.REDIS_URL
    redisURL: 'redis://localhost:6379',
    // Optional prefix for Redis keys to isolate the store. Defaults to 'payload-kv'
    prefix: 'kv-storage',
  }),
})
```

Then you can access the KV storage using `payload.kv`:

```ts
await payload.kv.set('key', { value: 1 })
const data = await payload.kv.get('key')
payload.loger.info(data)
```

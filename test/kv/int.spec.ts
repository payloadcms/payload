import type { CloudflareKVNamespace } from '@payloadcms/kv-cloudflare'
import type { KVAdapterResult, Payload } from 'payload'

import { cloudflareKVAdapter } from '@payloadcms/kv-cloudflare'
import { RedisKVAdapter, redisKVAdapter } from '@payloadcms/kv-redis'
import { Miniflare } from 'miniflare'
import path from 'path'
import { inMemoryKVAdapter } from 'payload'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload
let kvBinding: CloudflareKVNamespace
let mf: Miniflare

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('KV Adapters', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    mf = new Miniflare({
      kvNamespaces: ['PAYLOAD_KV'],
      modules: true,
      script: 'export default {}',
    })
    kvBinding = (await mf.getKVNamespace('PAYLOAD_KV')) as CloudflareKVNamespace

    const initialized = await initPayloadInt(dirname)
    ;({ payload } = initialized)
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
    if (mf) {
      await mf.dispose()
    }
  })

  const testKVAdapter = async (adapter?: KVAdapterResult) => {
    if (adapter) {
      payload.kv = adapter.init({ payload })
    }

    await payload.kv.set('my-key-1', { userID: 1 })
    await payload.kv.set('my-key-2', { userID: 2 })

    expect(await payload.kv.get('my-key-1')).toStrictEqual({ userID: 1 })
    expect(await payload.kv.get('my-key-2')).toStrictEqual({ userID: 2 })
    expect(await payload.kv.get('my-key-3')).toBeNull()

    expect(await payload.kv.has('my-key-1')).toBeTruthy()
    expect(await payload.kv.has('my-key-2')).toBeTruthy()
    expect(await payload.kv.has('my-key-3')).toBeFalsy()

    let keys = await payload.kv.keys()
    expect(keys).toHaveLength(2)
    expect(keys).toContain('my-key-1')
    expect(keys).toContain('my-key-2')

    await payload.kv.set('my-key-1', { userID: 10 })
    expect(await payload.kv.get('my-key-1')).toStrictEqual({ userID: 10 })

    await payload.kv.delete('my-key-1')
    expect(await payload.kv.get('my-key-1')).toBeNull()
    expect(await payload.kv.has('my-key-1')).toBeFalsy()
    keys = await payload.kv.keys()
    expect(keys).toHaveLength(1)
    expect(keys).toContain('my-key-2')

    await payload.kv.clear()
    expect(await payload.kv.get('my-key-2')).toBeNull()
    expect(await payload.kv.has('my-key-2')).toBeFalsy()
    keys = await payload.kv.keys()
    expect(keys).toHaveLength(0)

    if (payload.kv instanceof RedisKVAdapter) {
      await payload.kv.redisClient.quit()
    }

    return true
  }

  it('databaseKVAdapter', async () => {
    // default
    expect(await testKVAdapter()).toBeTruthy()
  })

  it('inMemoryKVAdapter', async () => {
    expect(await testKVAdapter(inMemoryKVAdapter())).toBeTruthy()
  })

  it('redisKVAdapter', async () => {
    expect(await testKVAdapter(redisKVAdapter())).toBeTruthy()
  })

  it('cloudflareKVAdapter', async () => {
    expect(await testKVAdapter(cloudflareKVAdapter({ binding: kvBinding }))).toBeTruthy()
  })
})

import type { CloudflareKVNamespace } from '@payloadcms/kv-cloudflare'
import type { KVAdapter, KVAdapterResult, Payload } from 'payload'

import { cloudflareKVAdapter } from '@payloadcms/kv-cloudflare'
import { RedisKVAdapter, redisKVAdapter } from '@payloadcms/kv-redis'
import { Miniflare } from 'miniflare'
import path from 'path'
import { inMemoryKVAdapter } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

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

  describe('Cloudflare KV Pagination', () => {
    let kvAdapter: KVAdapter

    beforeAll(() => {
      kvAdapter = cloudflareKVAdapter({
        binding: kvBinding,
        keyPrefix: 'pagination-test:',
      }).init({ payload })
    })

    beforeEach(async () => {
      await kvAdapter.clear()
    })

    afterEach(async () => {
      await kvAdapter.clear()
    })

    it.each([
      { keyCount: 999, description: 'under boundary (list_complete: true)' },
      { keyCount: 1000, description: 'exact boundary' },
      { keyCount: 1500, description: 'over boundary (multiple pages)' },
    ])('should handle pagination with $keyCount keys ($description)', async ({ keyCount }) => {
      await Promise.all(
        Array.from({ length: keyCount }, (_, i) =>
          kvAdapter.set(`key-${String(i).padStart(5, '0')}`, { index: i }),
        ),
      )

      const allKeys = await kvAdapter.keys()
      expect(allKeys).toHaveLength(keyCount)
      expect(allKeys).toContain('key-00000')
      expect(allKeys).toContain(`key-${String(keyCount - 1).padStart(5, '0')}`)
    })

    it('should respect keyPrefix during pagination', async () => {
      const keyCount = 1200

      // Create keys with pagination-test prefix
      await Promise.all(
        Array.from({ length: keyCount }, (_, i) =>
          kvAdapter.set(`key-${String(i).padStart(5, '0')}`, { index: i }),
        ),
      )

      // Create keys with different prefix (noise)
      const noiseAdapter = cloudflareKVAdapter({
        binding: kvBinding,
        keyPrefix: 'noise:',
      }).init({ payload })

      await noiseAdapter.set('noise-key-1', { data: 'noise' })
      await noiseAdapter.set('noise-key-2', { data: 'noise' })

      // Should only get keys with pagination-test prefix
      const allKeys = await kvAdapter.keys()
      expect(allKeys).toHaveLength(keyCount)
      expect(allKeys.every((k: string) => !k.startsWith('noise'))).toBe(true)

      await noiseAdapter.clear()
    })
  })
})

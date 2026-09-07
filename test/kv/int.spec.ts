import type { KVAdapterResult, Payload } from 'payload'

import { RedisKVAdapter, redisKVAdapter } from '@payloadcms/kv-redis'
import { inMemoryKVAdapter } from 'payload'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { suite, test } from '../__helpers/int/vitest.js'

suite('KV Adapters', { config: './config.ts' }, () => {
  const testKVAdapter = async (payload: Payload, adapter?: KVAdapterResult) => {
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

  test('databaseKVAdapter', async ({ payload }) => {
    // default
    expect(await testKVAdapter(payload)).toBeTruthy()
  })

  test('inMemoryKVAdapter', async ({ payload }) => {
    expect(await testKVAdapter(payload, inMemoryKVAdapter())).toBeTruthy()
  })

  test('redisKVAdapter', async ({ payload }) => {
    expect(await testKVAdapter(payload, redisKVAdapter())).toBeTruthy()
  })
})

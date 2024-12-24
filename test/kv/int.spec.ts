import type { KVAdapterResult, Payload, PubSubAdapterResult } from 'payload'

import { RedisKVAdapter, redisKVAdapter, redisPubSubAdapter } from '@payloadcms/redis'
import path from 'path'
import { inMemoryKVAdapter, inMemoryPubSubAdapter } from 'payload'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('KV / PubSub Adapters', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload } = initialized)
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  const testKVAdapter = async (adapter: KVAdapterResult) => {
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

  const testPubSubAdapter = async (adapter?: PubSubAdapterResult) => {
    payload.pubSub = adapter.init({ payload })

    const channel = 'my-channel'

    let receivedMessage: null | string = null

    // Subscribe to the channel
    await payload.pubSub.subscribe(channel, (message) => {
      receivedMessage = message
    })

    // Publish a message to the channel
    await payload.pubSub.publish(channel, 'Hello, world!')

    let retries = 0
    while (!receivedMessage) {
      if (retries++ > 10) {
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 30))
    }

    expect(receivedMessage).toBe('Hello, world!')

    await payload.pubSub.unsubscribe(channel)

    return true
  }

  it('inMemoryKVAdapter', async () => {
    expect(await testKVAdapter(inMemoryKVAdapter())).toBeTruthy()
  })

  it('redisKVAdapter', async () => {
    expect(await testKVAdapter(redisKVAdapter())).toBeTruthy()
  })

  it('inMemoryPubSubAdapter', async () => {
    expect(await testPubSubAdapter(inMemoryPubSubAdapter())).toBeTruthy()
  })

  it('redisPubSubAdapter', async () => {
    expect(await testPubSubAdapter(redisPubSubAdapter())).toBeTruthy()
  })
})

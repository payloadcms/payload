import type { KVAdapter, KVAdapterResult, KVStoreValue } from 'payload'

import { Redis } from 'ioredis'

export class RedisKVAdapter implements KVAdapter {
  redisClient: Redis

  constructor(
    readonly keyPrefix: string,
    redisURL: string,
  ) {
    this.redisClient = new Redis(redisURL)
  }

  async clear(): Promise<void> {
    const keys = await this.redisClient.keys(`${this.keyPrefix}*`)

    if (keys.length > 0) {
      await this.redisClient.del(keys)
    }
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(`${this.keyPrefix}${key}`)
  }

  async get(key: string): Promise<KVStoreValue | null> {
    const data = await this.redisClient.get(`${this.keyPrefix}${key}`)

    if (data === null) {
      return data
    }

    return JSON.parse(data)
  }

  async has(key: string): Promise<boolean> {
    const exists = await this.redisClient.exists(`${this.keyPrefix}${key}`)
    return exists === 1
  }

  async keys(): Promise<string[]> {
    const prefixedKeys = await this.redisClient.keys(`${this.keyPrefix}*`)

    if (this.keyPrefix) {
      return prefixedKeys.map((key) => key.replace(this.keyPrefix, ''))
    }

    return prefixedKeys
  }

  async set(key: string, data: KVStoreValue): Promise<void> {
    await this.redisClient.set(`${this.keyPrefix}${key}`, JSON.stringify(data))
  }
}

export type RedisKVAdapterOptions = {
  /**
   * Optional prefix for Redis keys to isolate the store
   *
   * @default 'payload-kv:'
   */
  keyPrefix?: string
  /** Redis connection URL (e.g., 'redis://localhost:6379'). Defaults to process.env.REDIS_URL */
  redisURL?: string
}

export const redisKVAdapter = (options: RedisKVAdapterOptions = {}): KVAdapterResult => {
  const keyPrefix = options.keyPrefix ?? 'payload-kv:'
  const redisURL = options.redisURL ?? process.env.REDIS_URL

  if (!redisURL) {
    throw new Error('redisURL or REDIS_URL env variable is required')
  }

  return {
    init: () => new RedisKVAdapter(keyPrefix, redisURL),
  }
}

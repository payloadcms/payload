/* eslint-disable @typescript-eslint/require-await */
import type { KVAdapter, KVAdapterResult, KVStoreValue } from '../index.js'

export class InMemoryKVAdapter implements KVAdapter {
  store = new Map<string, KVStoreValue>()

  async clear(): Promise<void> {
    this.store.clear()
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async get<T extends KVStoreValue>(key: string): Promise<null | T> {
    const value = this.store.get(key) as T | undefined

    if (typeof value === 'undefined') {
      return null
    }

    return value
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key)
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys())
  }

  async mget<T extends KVStoreValue>(keys: readonly string[]): Promise<Array<null | T>> {
    return keys.map((key) => {
      const value = this.store.get(key) as T | undefined
      return typeof value === 'undefined' ? null : value
    })
  }

  async set(key: string, value: KVStoreValue): Promise<void> {
    this.store.set(key, value)
  }
}

export const inMemoryKVAdapter = (): KVAdapterResult => {
  return {
    init: () => new InMemoryKVAdapter(),
  }
}

import type { KVNamespace } from '@cloudflare/workers-types'
import type { KVAdapter, KVAdapterResult, KVStoreValue } from 'payload'

export type CloudflareKVNamespace = KVNamespace

const defaultPrefix = 'payload-kv:'

export class CloudflareKVAdapter implements KVAdapter {
  constructor(
    readonly binding: CloudflareKVNamespace,
    readonly keyPrefix: string,
  ) {}

  private prefixKey(key: string): string {
    return `${this.keyPrefix}${key}`
  }

  async clear(): Promise<void> {
    let cursor: string | undefined

    while (true) {
      const result = await this.binding.list({
        cursor,
        prefix: this.keyPrefix || undefined,
      })

      const { keys, list_complete } = result
      const nextCursor = 'cursor' in result ? result.cursor : undefined

      if (keys.length) {
        await Promise.all(keys.map(({ name }) => this.binding.delete(name)))
      }

      if (list_complete || !nextCursor) {
        break
      }
      cursor = nextCursor
    }
  }

  async delete(key: string): Promise<void> {
    await this.binding.delete(this.prefixKey(key))
  }

  async get<T extends KVStoreValue>(key: string): Promise<null | T> {
    const value = await this.binding.get(this.prefixKey(key))

    if (value === null) {
      return null
    }

    return JSON.parse(value) as T
  }

  async has(key: string): Promise<boolean> {
    const value = await this.binding.get(this.prefixKey(key))
    return value !== null
  }

  async keys(): Promise<string[]> {
    const keys: string[] = []
    let cursor: string | undefined

    while (true) {
      const result = await this.binding.list({
        cursor,
        prefix: this.keyPrefix || undefined,
      })

      const { keys: batch, list_complete } = result
      const nextCursor = 'cursor' in result ? result.cursor : undefined

      if (batch.length) {
        keys.push(
          ...batch.map(({ name }) => (this.keyPrefix ? name.replace(this.keyPrefix, '') : name)),
        )
      }

      if (list_complete || !nextCursor) {
        break
      }
      cursor = nextCursor
    }

    return keys
  }

  async set(key: string, data: KVStoreValue): Promise<void> {
    await this.binding.put(this.prefixKey(key), JSON.stringify(data))
  }
}

export type CloudflareKVAdapterOptions = {
  /**
   * Cloudflare KV namespace binding (required)
   */
  binding: CloudflareKVNamespace
  /**
   * Optional prefix for keys in the namespace
   *
   * @default 'payload-kv:'
   */
  keyPrefix?: string
}

export const cloudflareKVAdapter = (options: CloudflareKVAdapterOptions): KVAdapterResult => {
  const keyPrefix = options.keyPrefix ?? defaultPrefix
  const { binding } = options

  if (!binding) {
    throw new Error('Cloudflare KV binding is required')
  }

  return {
    init: () => new CloudflareKVAdapter(binding, keyPrefix),
  }
}

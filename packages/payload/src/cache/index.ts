import type { CollectionConfig } from '../collections/config/types.js'
import type { Payload } from '../types/index.js'

export interface PayloadCache<Data extends Record<string, unknown> = Record<string, unknown>> {
  clear(): Promise<void> | void

  delete(key: string): Promise<void> | void

  getAll(): { data: Data; key: string }[] | Promise<{ data: Data; key: string }[]>

  getByKey(key: string): Data | null | Promise<Data | null>

  getKeys(): Promise<string[]> | string[]

  set(key: string, data: Data): Promise<void> | void

  type: string
}

export type PayloadCacheConstructor<
  Data extends Record<string, unknown> = Record<string, unknown>,
> = {
  getPayloadCacheCollection?(): CollectionConfig
  new (payload: Payload): PayloadCache<Data>
}

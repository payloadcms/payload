import type { CollectionConfig } from '../collections/config/types.js'
import type { Payload } from '../types/index.js'

export type KVStoreValue = NonNullable<unknown>

export interface KVAdapter {
  /**
   * Clears all entries in the store.
   * @returns A promise that resolves once the store is cleared.
   */
  clear(): Promise<void>

  /**
   * Deletes a value from the store by its key.
   * @param key - The key to delete.
   * @returns A promise that resolves once the key is deleted.
   */
  delete(key: string): Promise<void>

  /**
   * Retrieves a value from the store by its key.
   * @param key - The key to look up.
   * @returns A promise that resolves to the value, or `null` if not found.
   */
  get(key: string): Promise<KVStoreValue | null>

  /**
   * Checks if a key exists in the store.
   * @param key - The key to check.
   * @returns A promise that resolves to `true` if the key exists, otherwise `false`.
   */
  has(key: string): Promise<boolean>

  /**
   * Retrieves all the keys in the store.
   * @returns A promise that resolves to an array of keys.
   */
  keys(): Promise<string[]>

  /**
   * Sets a value in the store with the given key.
   * @param key - The key to associate with the value.
   * @param value - The value to store.
   * @returns A promise that resolves once the value is stored.
   */
  set(key: string, value: KVStoreValue): Promise<void>
}

export interface KVAdapterResult {
  init(args: { payload: Payload }): KVAdapter

  /** Adapter can create additional collection if needed */
  kvCollection?: CollectionConfig
}

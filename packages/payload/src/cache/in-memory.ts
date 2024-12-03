import type { PayloadCache } from './index.js'

export class InMemoryCache<Data extends Record<string, unknown> = Record<string, unknown>>
  implements PayloadCache<Data>
{
  store = new Map<string, Data>()
  type = 'local'

  clear(): void {
    this.store.clear()
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  getAll(): { data: Data; key: string }[] {
    const result: { data: Data; key: string }[] = []

    this.store.forEach((data, key) => {
      result.push({ data, key })
    })

    return result
  }

  getByKey(key: string): Data | null {
    return this.store.get(key) ?? null
  }

  getKeys(): string[] {
    return Array.from(this.store.keys())
  }

  set(key: string, data: Data): void {
    this.store.set(key, data)
  }
}

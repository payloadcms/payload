import type { Payload } from 'payload'

import { describe, expect, it } from 'vitest'

import { attributeBranchPerformance } from './attribution.js'

describe('native performance attribution boundaries', () => {
  it('should identify adapter-find timing as incomplete when native readiness bypasses adapter.find', async () => {
    const nativeReadStates = () => Promise.resolve([{ generation: 1 }])
    const read = () => Promise.resolve(true)
    const find = () => Promise.resolve({ docs: [] })
    const snapshot = async ({
      read: callback,
    }: {
      read: (args: { req: object }) => Promise<unknown>
    }) => callback({ req: {} })
    const branching = {
      withReadSnapshot: snapshot,
      queryProjection: { readStates: nativeReadStates },
    }
    const payload = {
      db: { find, branching },
      collections: { articles: { config: { access: { read } } } },
    }
    const samples = await attributeBranchPerformance({
      payload: payload as unknown as Payload,
      iterations: 2,
      source: 'articles',
      statements: [],
      run: () =>
        branching.withReadSnapshot({
          read: async () => {
            await payload.collections.articles.config.access.read()
            return nativeReadStates()
          },
        }),
    })

    expect(samples).toHaveLength(2)
    for (const sample of samples) {
      expect(sample.adapterFindMilliseconds).toBe(0)
      expect(sample.adapterFindTimingBoundary).toBe('adapter.find only; excludes native readStates')
      expect(sample).not.toHaveProperty('guardReadMilliseconds')
      expect(sample).not.toHaveProperty('callbackAfterGuardMilliseconds')
    }
    expect(payload.db.find).toBe(find)
    expect(payload.db.branching.withReadSnapshot).toBe(snapshot)
    expect(payload.collections.articles.config.access.read).toBe(read)
  })
})

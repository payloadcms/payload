import type { RequireDrizzleKit } from '../types.js'

import { describe, expect, it } from 'vitest'

import { createRequireDrizzleKit } from './createRequireDrizzleKit.js'

const drizzleKit = {
  generateDrizzleJson: async (args: Record<string, unknown>) => ({ args, version: '7' }),
  generateMigration: async () => ['CREATE TABLE posts;'],
  pushSchema: async () => ({
    apply: async () => undefined,
    hasDataLoss: false,
    warnings: [],
  }),
} as unknown as ReturnType<RequireDrizzleKit>

describe('createRequireDrizzleKit', () => {
  it('should defer loading Drizzle Kit until schema tooling runs', async () => {
    let loadCount = 0
    const requireDrizzleKit = createRequireDrizzleKit({
      load: async () => {
        loadCount++
        return drizzleKit
      },
    })

    const facade = requireDrizzleKit()

    expect(loadCount).toBe(0)

    await facade.generateDrizzleJson({ posts: true })

    expect(loadCount).toBe(1)
  })

  it('should load Drizzle Kit only once across schema tooling operations', async () => {
    let loadCount = 0
    const requireDrizzleKit = createRequireDrizzleKit({
      load: async () => {
        loadCount++
        return drizzleKit
      },
    })
    const facade = requireDrizzleKit()

    await facade.generateDrizzleJson({ posts: true })
    await facade.generateMigration({} as never, {} as never)

    expect(loadCount).toBe(1)
  })

  it('should share an in-flight load across concurrent schema tooling operations', async () => {
    let loadCount = 0
    let resolveLoad: ((value: typeof drizzleKit) => void) | undefined
    const requireDrizzleKit = createRequireDrizzleKit({
      load: () => {
        loadCount++
        return new Promise((resolve) => {
          resolveLoad = resolve
        })
      },
    })
    const facade = requireDrizzleKit()

    const snapshotPromise = facade.generateDrizzleJson({ posts: true })
    const migrationPromise = facade.generateMigration({} as never, {} as never)

    expect(loadCount).toBe(1)

    resolveLoad?.(drizzleKit)
    await Promise.all([snapshotPromise, migrationPromise])

    expect(loadCount).toBe(1)
  })

  it('should retry loading Drizzle Kit after a failed load', async () => {
    let loadCount = 0
    const requireDrizzleKit = createRequireDrizzleKit({
      load: async () => {
        loadCount++

        if (loadCount === 1) {
          throw new Error('temporary load failure')
        }

        return drizzleKit
      },
    })
    const facade = requireDrizzleKit()

    await expect(facade.generateDrizzleJson({ posts: true })).rejects.toThrow(
      'temporary load failure',
    )
    await expect(facade.generateDrizzleJson({ posts: true })).resolves.toEqual({
      args: { posts: true },
      version: '7',
    })

    expect(loadCount).toBe(2)
  })

  it('should return results from the loaded Drizzle Kit', async () => {
    const requireDrizzleKit = createRequireDrizzleKit({ load: async () => drizzleKit })
    const facade = requireDrizzleKit()

    const snapshot = await facade.generateDrizzleJson({ posts: true })
    const statements = await facade.generateMigration({} as never, {} as never)
    const pushResult = await facade.pushSchema({}, {} as never)

    expect(snapshot).toEqual({ args: { posts: true }, version: '7' })
    expect(statements).toEqual(['CREATE TABLE posts;'])
    expect(pushResult).toMatchObject({ hasDataLoss: false, warnings: [] })
  })
})

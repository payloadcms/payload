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

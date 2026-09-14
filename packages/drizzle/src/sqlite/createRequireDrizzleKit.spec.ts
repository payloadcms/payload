import type { RequireDrizzleKit } from '../types.js'

import { dynamicImport } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createRequireDrizzleKit } from './createRequireDrizzleKit.js'

vi.mock('payload', () => ({ dynamicImport: vi.fn() }))

const drizzleKit = {
  generateDrizzleJson: async (args: Record<string, unknown>) => ({ args, version: '7' }),
  generateMigration: async () => ['CREATE TABLE posts;'],
  pushSchema: async () => ({
    apply: async () => undefined,
    hasDataLoss: false,
    warnings: [],
  }),
} as unknown as ReturnType<RequireDrizzleKit>

const packageName = '@payloadcms/db-sqlite'
const from = 'file:///adapter/index.js'
const api = {
  generateSQLiteDrizzleJson: drizzleKit.generateDrizzleJson,
  generateSQLiteMigration: drizzleKit.generateMigration,
  pushSQLiteSchema: drizzleKit.pushSchema,
}

beforeEach(() => {
  vi.mocked(dynamicImport).mockReset().mockResolvedValue(api)
})

describe('createRequireDrizzleKit', () => {
  it('should defer loading Drizzle Kit until schema tooling runs', async () => {
    let loadCount = 0
    vi.mocked(dynamicImport).mockImplementation(async () => {
      loadCount++
      return api
    })
    const requireDrizzleKit = createRequireDrizzleKit({ from, packageName })

    const facade = requireDrizzleKit()

    expect(loadCount).toBe(0)

    await facade.generateDrizzleJson({ posts: true })

    expect(loadCount).toBe(1)
    expect(dynamicImport).toHaveBeenCalledWith('drizzle-kit/api', { from })
  })

  it('should load Drizzle Kit only once across schema tooling operations', async () => {
    let loadCount = 0
    vi.mocked(dynamicImport).mockImplementation(async () => {
      loadCount++
      return api
    })
    const requireDrizzleKit = createRequireDrizzleKit({ from, packageName })
    const facade = requireDrizzleKit()

    await facade.generateDrizzleJson({ posts: true })
    await facade.generateMigration({} as never, {} as never)

    expect(loadCount).toBe(1)
  })

  it('should share an in-flight load across concurrent schema tooling operations', async () => {
    let loadCount = 0
    let resolveLoad: ((value: typeof api) => void) | undefined
    vi.mocked(dynamicImport).mockImplementation(() => {
      loadCount++
      return new Promise((resolve) => {
        resolveLoad = resolve
      })
    })
    const requireDrizzleKit = createRequireDrizzleKit({ from, packageName })
    const facade = requireDrizzleKit()

    const snapshotPromise = facade.generateDrizzleJson({ posts: true })
    const migrationPromise = facade.generateMigration({} as never, {} as never)

    expect(loadCount).toBe(1)

    resolveLoad?.(api)
    await Promise.all([snapshotPromise, migrationPromise])

    expect(loadCount).toBe(1)
  })

  it('should explain what Drizzle Kit is needed for when the load fails', async () => {
    vi.mocked(dynamicImport).mockImplementation(() =>
      Promise.reject(new Error("Cannot find module 'drizzle-kit/api'")),
    )
    const requireDrizzleKit = createRequireDrizzleKit({ from, packageName })
    const facade = requireDrizzleKit()

    await expect(facade.generateDrizzleJson({ posts: true })).rejects.toThrow(
      `Could not load drizzle-kit, which ${packageName} needs to generate migrations and to push schema changes. Drizzle Kit is not needed to serve requests, so it is often left out of a production bundle. Generate migrations before you deploy, or make drizzle-kit available in this environment.`,
    )
  })

  it('should keep the original load failure as the error cause', async () => {
    const loadError = new Error("Cannot find module 'drizzle-kit/api'")
    vi.mocked(dynamicImport).mockImplementation(() => Promise.reject(loadError))
    const requireDrizzleKit = createRequireDrizzleKit({ from, packageName })
    const facade = requireDrizzleKit()

    await expect(facade.generateDrizzleJson({ posts: true })).rejects.toMatchObject({
      cause: loadError,
    })
  })

  it('should retry loading Drizzle Kit after a failed load', async () => {
    let loadCount = 0
    vi.mocked(dynamicImport).mockImplementation(async () => {
      loadCount++

      if (loadCount === 1) {
        throw new Error('temporary load failure')
      }

      return api
    })
    const requireDrizzleKit = createRequireDrizzleKit({ from, packageName })
    const facade = requireDrizzleKit()

    await expect(facade.generateDrizzleJson({ posts: true })).rejects.toThrow(
      'Could not load drizzle-kit',
    )
    await expect(facade.generateDrizzleJson({ posts: true })).resolves.toEqual({
      args: { posts: true },
      version: '7',
    })

    expect(loadCount).toBe(2)
  })

  it('should return results from the loaded Drizzle Kit', async () => {
    vi.mocked(dynamicImport).mockImplementation(async () => api)
    const requireDrizzleKit = createRequireDrizzleKit({ from, packageName })
    const facade = requireDrizzleKit()

    const snapshot = await facade.generateDrizzleJson({ posts: true })
    const statements = await facade.generateMigration({} as never, {} as never)
    const pushResult = await facade.pushSchema({}, {} as never)

    expect(snapshot).toEqual({ args: { posts: true }, version: '7' })
    expect(statements).toEqual(['CREATE TABLE posts;'])
    expect(pushResult).toMatchObject({ hasDataLoss: false, warnings: [] })
  })
})

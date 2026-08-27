import { describe, expect, it } from 'vitest'

import { parseMigrateAPIKeysArgs } from './parseMigrateAPIKeysArgs.js'

describe('parseMigrateAPIKeysArgs', () => {
  it('should default to no dry run, no batch size override, and no collection filter', () => {
    expect(parseMigrateAPIKeysArgs({ _: ['migrate:api-keys'] })).toEqual({
      batchSize: undefined,
      collections: undefined,
      dryRun: false,
    })
  })

  it('should read --dry-run', () => {
    expect(parseMigrateAPIKeysArgs({ _: [], 'dry-run': true }).dryRun).toBe(true)
  })

  it('should read --batch-size as a number', () => {
    expect(parseMigrateAPIKeysArgs({ _: [], 'batch-size': '50' }).batchSize).toBe(50)
    expect(parseMigrateAPIKeysArgs({ _: [], 'batch-size': 50 }).batchSize).toBe(50)
  })

  it('should split --collections on commas and trim whitespace', () => {
    expect(
      parseMigrateAPIKeysArgs({ _: [], collections: 'users, customers ,admins' }).collections,
    ).toEqual(['users', 'customers', 'admins'])
  })
})

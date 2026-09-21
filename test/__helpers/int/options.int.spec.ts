/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- These regression tests use Payload's custom test API. */
import path from 'node:path'
import { expect } from 'vitest'

import { getCurrentDatabaseAdapter } from '../../dbAdapters.js'
import { isMongo, test } from './vitest.js'

test.suite('integration test options', {}, () => {
  let predicateAdapter: string | undefined

  test.options('should retain fixtures without a database filter', {}, ({ testDir }) => {
    expect(path.basename(testDir)).toBe('int')
  })

  test.options(
    'should forward the timeout',
    { db: 'all' },
    ({ task }) => {
      expect(task.timeout).toBe(12345)
    },
    12345,
  )

  test.options('should run a MongoDB test only on MongoDB adapters', { db: 'mongo' }, () => {
    expect(isMongo).toBe(true)
  })

  test.options('should run a Drizzle test only on Drizzle adapters', { db: 'drizzle' }, () => {
    expect(isMongo).toBe(false)
  })

  test.options(
    'should pass the adapter to a custom predicate',
    {
      db: (adapter) => {
        predicateAdapter = adapter
        return adapter === getCurrentDatabaseAdapter()
      },
    },
    () => {
      expect(predicateAdapter).toBe(getCurrentDatabaseAdapter())
    },
  )

  test.options('should skip when the predicate returns false', { db: () => false }, () => {
    expect.unreachable('A filtered test must not run')
  })

  test.options.describe('MongoDB group', { db: 'mongo' }, () => {
    test('should preserve fixtures and filter the whole group', ({ testDir }) => {
      expect(path.basename(testDir)).toBe('int')
      expect(isMongo).toBe(true)
    })
  })

  test.options.describe('Drizzle group', { db: 'drizzle' }, () => {
    test('should preserve fixtures and filter the whole group', ({ testDir }) => {
      expect(path.basename(testDir)).toBe('int')
      expect(isMongo).toBe(false)
    })
  })
})

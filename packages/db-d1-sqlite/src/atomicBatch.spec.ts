import type { BranchingAdapter, Payload } from 'payload'
import type { PlatformProxy } from 'wrangler'

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { getPlatformProxy } from 'wrangler'

import type { Args } from './types.js'

import { sqliteD1Adapter } from './index.js'

type Statement = Parameters<
  NonNullable<BranchingAdapter['executeAtomicBatch']>
>[0]['statements'][number]

describe('D1 native guarded branch batches', () => {
  let directory: string
  let platform: PlatformProxy<{ DB: Args['binding'] }>
  let binding: Args['binding']
  let branching: BranchingAdapter

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'payload-branch-d1-'))

    const configPath = join(directory, 'wrangler.json')

    await writeFile(
      configPath,
      JSON.stringify({
        name: 'payload-branch-batch-test',
        compatibility_date: '2025-01-01',
        d1_databases: [
          {
            binding: 'DB',
            database_name: 'payload-branch-batch-test',
            database_id: '00000000-0000-0000-0000-000000000001',
          },
        ],
      }),
    )
    platform = await getPlatformProxy({
      configPath,
      persist: false,
      remoteBindings: false,
      envFiles: [],
    })
    binding = platform.env.DB
    branching = sqliteD1Adapter({ binding }).init({ payload: {} as Payload }).branching

    await binding.prepare('CREATE TABLE heads (id INTEGER PRIMARY KEY, generation INTEGER)').run()
  }, 30_000)

  beforeEach(async () => {
    await binding.batch([
      binding.prepare('DELETE FROM heads'),
      binding.prepare('INSERT INTO heads VALUES (1, 1)'),
    ])
  })

  afterAll(async () => {
    await platform?.dispose()

    if (directory) {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it('should advertise atomic batches only when the native binding supports them', async () => {
    await expect(branching.capabilities({})).resolves.toMatchObject({
      atomicBatch: true,
      interactiveTransactions: false,
    })
  })

  it('should commit guarded writes and return only requested statement results', async () => {
    const result = await branching.executeAtomicBatch({
      statements: [
        {
          sql: 'UPDATE heads SET generation = ? WHERE id = ? AND generation = ?',
          params: [2, 1, 1],
          expectedChanges: 1,
        },
        { sql: 'SELECT generation FROM heads WHERE id = ?', params: [1] },
      ],
    })

    expect(result).toEqual([
      { changes: 1, rows: [] },
      { changes: 0, rows: [{ generation: 2 }] },
    ])
  })

  it('should lazily evaluate the failing assertion and allow an expected zero-row write', async () => {
    await expect(
      branching.executeAtomicBatch({
        statements: [{ sql: 'DELETE FROM heads WHERE id = 999', expectedChanges: 0 }],
      }),
    ).resolves.toEqual([{ changes: 0, rows: [] }])
  })

  it('should roll back when the first guarded write matches no rows', async () => {
    await expect(
      branching.executeAtomicBatch({
        statements: [
          { sql: 'UPDATE heads SET generation = 2 WHERE generation = 9', expectedChanges: 1 },
          { sql: 'INSERT INTO heads VALUES (2, 1)' },
        ],
      }),
    ).rejects.toThrow(/^D1 branch atomic batch conflict\.$/)
    expect((await binding.prepare('SELECT * FROM heads').all()).results).toEqual([
      { id: 1, generation: 1 },
    ])
  })

  it('should roll back earlier successful writes when a later guard is stale', async () => {
    await expect(
      branching.executeAtomicBatch({
        statements: [
          { sql: 'INSERT INTO heads VALUES (2, 1)', expectedChanges: 1 },
          { sql: 'UPDATE heads SET generation = 2 WHERE generation = 9', expectedChanges: 1 },
        ],
      }),
    ).rejects.toThrow(/^D1 branch atomic batch conflict\.$/)
    expect((await binding.prepare('SELECT * FROM heads').all()).results).toEqual([
      { id: 1, generation: 1 },
    ])
  })

  it('should roll back a successful guard if a later native statement fails', async () => {
    await expect(
      branching.executeAtomicBatch({
        statements: [
          { sql: 'UPDATE heads SET generation = 2 WHERE id = 1', expectedChanges: 1 },
          { sql: 'INSERT INTO heads VALUES (1, 3)' },
        ],
      }),
    ).rejects.toThrow(/^D1 branch atomic batch failed\.$/)
    expect((await binding.prepare('SELECT generation FROM heads').all()).results).toEqual([
      { generation: 1 },
    ])
  })

  it('should preserve native unguarded statements without inventing row-count requirements', async () => {
    await expect(
      branching.executeAtomicBatch({ statements: [{ sql: 'DELETE FROM heads WHERE id = 999' }] }),
    ).resolves.toEqual([{ changes: 0, rows: [] }])
  })

  it('should allow only one competing generation guard to commit', async () => {
    const results = await Promise.allSettled(
      [2, 3].map((generation) =>
        branching.executeAtomicBatch({
          statements: [
            {
              sql: 'UPDATE heads SET generation = ? WHERE id = 1 AND generation = 1',
              params: [generation],
              expectedChanges: 1,
            },
          ],
        }),
      ),
    )

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(results.filter(({ status }) => status === 'rejected')).toEqual([
      { status: 'rejected', reason: new Error('D1 branch atomic batch conflict.') },
    ])
    expect((await binding.prepare('SELECT generation FROM heads').all()).results).toEqual([
      { generation: expect.toBeOneOf([2, 3]) },
    ])
  })

  it('should distinguish native integer overflow from a failed branch guard', async () => {
    await expect(
      branching.executeAtomicBatch({
        statements: [
          { sql: 'UPDATE heads SET generation = 2 WHERE id = 1', expectedChanges: 1 },
          { sql: 'SELECT abs(-9223372036854775808)' },
        ],
      }),
    ).rejects.toThrow(/^D1 branch atomic batch failed\.$/)
    expect((await binding.prepare('SELECT generation FROM heads').all()).results).toEqual([
      { generation: 1 },
    ])
  })

  it('should reject caller transactions before executing any writes', async () => {
    await expect(
      branching.executeAtomicBatch({
        req: { transactionID: Promise.resolve('caller-session') },
        statements: [{ sql: 'DELETE FROM heads' }],
      }),
    ).rejects.toThrow('cannot join an interactive caller transaction')
    expect((await binding.prepare('SELECT count(*) AS count FROM heads').all()).results).toEqual([
      { count: 1 },
    ])
  })

  it.each([
    [],
    Array.from({ length: 101 }, () => ({ sql: 'SELECT 1' })),
    Array.from({ length: 51 }, () => ({ sql: 'DELETE FROM heads', expectedChanges: 0 })),
    [{ sql: 'DELETE FROM heads', expectedChanges: -1 }],
    [{ sql: 'DELETE FROM heads', expectedChanges: 0.5 }],
    [{ sql: 'DELETE FROM heads', expectedChanges: Number.MAX_SAFE_INTEGER + 1 }],
    [{ sql: 'SELECT 1', expectedChanges: 0 }],
    [{ sql: 'DELETE FROM heads; SELECT 1' }],
    [{ sql: 'BEGIN TRANSACTION' }],
    [{ sql: 'SELECT 1', params: Array.from({ length: 101 }, () => 1) }],
    [{ sql: 'SELECT ?', params: [Number.NaN] }],
    [{ sql: 'SELECT ?', params: [Number.POSITIVE_INFINITY] }],
    [{ sql: 'SELECT ?', params: [true] }],
    [{ sql: 'SELECT ?', params: ['x'.repeat(1_000_001)] }],
    [{ sql: `SELECT '${'x'.repeat(100_000)}'` }],
  ])(
    'should reject invalid or unbounded requests before submitting a batch (%#)',
    async (...statements) => {
      await expect(
        branching.executeAtomicBatch({ statements: statements as Statement[] }),
      ).rejects.toThrow('D1 branch atomic batch')
      expect((await binding.prepare('SELECT count(*) AS count FROM heads').all()).results).toEqual([
        { count: 1 },
      ])
    },
  )
})

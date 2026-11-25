import type { Payload } from 'payload'

import fs from 'fs'
import os from 'os'
import path from 'path'
import { integer as pgInteger, pgTable, text as pgText } from 'drizzle-orm/pg-core'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { DrizzleSnapshotJSON } from '../types.js'

import { defaultDrizzleSnapshot } from '../postgres/defaultSnapshot.js'
import { requireDrizzleKit as requirePostgresKit } from '../postgres/requireDrizzleKit.js'
import { createRequireDrizzleKit } from '../sqlite/createRequireDrizzleKit.js'
import { readPreviousSchemaState } from './readPreviousSchemaState.js'

const requireSQLiteKit = createRequireDrizzleKit({ from: import.meta.url })

const tempDirs: string[] = []

const makeMigrationDir = (snapshots: Record<string, unknown>) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'previous-schema-state-'))
  tempDirs.push(dir)

  for (const [fileName, snapshot] of Object.entries(snapshots)) {
    fs.writeFileSync(path.join(dir, fileName), JSON.stringify(snapshot))
  }

  return dir
}

const makePayload = () => ({ logger: { warn: vi.fn() } }) as unknown as Payload

const columnNames = (state: DrizzleSnapshotJSON | undefined) =>
  (state?.ddl ?? []).filter(({ entityType }) => entityType === 'columns').map(({ name }) => name)

const posts = (columns: Record<string, ReturnType<typeof pgText>> = {}) => ({
  posts: pgTable('posts', { id: pgInteger().primaryKey(), title: pgText(), ...columns }),
})

/** A drizzle-kit 0.x snapshot, as older Payload projects have committed. */
const legacySnapshot = {
  id: '11111111-1111-1111-1111-111111111111',
  _meta: { columns: {}, schemas: {}, tables: {} },
  dialect: 'postgresql',
  enums: {},
  policies: {},
  prevId: '00000000-0000-0000-0000-000000000000',
  roles: {},
  schemas: {},
  sequences: {},
  tables: {
    'public.posts': {
      name: 'posts',
      checkConstraints: {},
      columns: {
        id: { name: 'id', type: 'integer', notNull: true, primaryKey: true },
        title: { name: 'title', type: 'text', notNull: false, primaryKey: false },
      },
      compositePrimaryKeys: {},
      foreignKeys: {},
      indexes: {},
      isRLSEnabled: false,
      policies: {},
      schema: '',
      uniqueConstraints: {},
    },
  },
  version: '7',
  views: {},
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { force: true, recursive: true })
  }
})

describe('readPreviousSchemaState', () => {
  it('should return undefined when the migrations directory has no snapshots', async () => {
    const dir = makeMigrationDir({ 'notes.json': { unrelated: true } })

    await expect(
      readPreviousSchemaState({ dir, kit: await requirePostgresKit(), payload: makePayload() }),
    ).resolves.toBeUndefined()
  })

  it('should rebuild the Postgres state from 0.x, full and delta snapshots without rewriting them', async () => {
    const kit = await requirePostgresKit()
    const fullState = await kit.generateDrizzleJson(posts({ body: pgText() }))
    const dir = makeMigrationDir({
      '20250101_000000.json': legacySnapshot,
      '20260101_000000.json': fullState,
    })
    const previous = await readPreviousSchemaState({ dir, kit, payload: makePayload() })
    const { snapshot } = await kit.generateMigration(
      previous!,
      await kit.generateDrizzleJson(posts({ body: pgText(), slug: pgText() })),
    )

    fs.writeFileSync(path.join(dir, '20260102_000000.json'), JSON.stringify(snapshot))

    const state = await readPreviousSchemaState({ dir, kit, payload: makePayload() })

    expect(snapshot?.type).toBe('diff')
    expect(columnNames(state)).toEqual(['id', 'title', 'body', 'slug'])
    expect(JSON.parse(fs.readFileSync(path.join(dir, '20250101_000000.json'), 'utf8'))).toEqual(
      legacySnapshot,
    )
  })

  it('should build on the newest branch and warn when migrations were created on separate branches', async () => {
    const kit = await requirePostgresKit()
    const { snapshot: base } = await kit.generateMigration(
      defaultDrizzleSnapshot,
      await kit.generateDrizzleJson(posts()),
    )
    const baseState = await kit.reconstruct!({ 'base.json': base! })
    const { snapshot: branchA } = await kit.generateMigration(
      baseState,
      await kit.generateDrizzleJson(posts({ fromA: pgText() })),
    )
    const { snapshot: branchB } = await kit.generateMigration(
      baseState,
      await kit.generateDrizzleJson(posts({ fromB: pgText() })),
    )
    const payload = makePayload()
    const dir = makeMigrationDir({
      '20260101_000000.json': base,
      '20260102_000000_a.json': branchA,
      '20260102_000001_b.json': branchB,
    })

    const state = await readPreviousSchemaState({ dir, kit, payload })

    expect(columnNames(state)).toEqual(['id', 'title', 'fromB'])
    expect(payload.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('were created on separate branches'),
    )
  })

  it('should return the newest SQLite full state, upgraded to the current format', async () => {
    const kit = await requireSQLiteKit()
    const first = await kit.generateDrizzleJson({
      posts: sqliteTable('posts', { id: integer().primaryKey() }),
    })
    const latest = await kit.generateDrizzleJson({
      posts: sqliteTable('posts', { id: integer().primaryKey(), title: text() }),
    })
    const dir = makeMigrationDir({ '20260101_000000.json': first, '20260102_000000.json': latest })

    const state = await readPreviousSchemaState({ dir, kit, payload: makePayload() })

    expect(columnNames(state)).toEqual(['id', 'title'])
  })
})

import { integer, PgDialect, pgTable, serial, text } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'

import { getTableColumnFromPath } from './getTableColumnFromPath.js'

// Mirrors issue #18312: a `blocks` field nested inside an `array` field.
// Block tables are always created under the root/collection table (see
// packages/drizzle/src/schema/traverseFields.ts), never under the array's
// table, so `events_blocks_artist` exists but `events_lineup_blocks_artist`
// does not.

const events = pgTable('events', {
  id: serial('id').primaryKey(),
})

const eventsLineup = pgTable('events_lineup', {
  _order: integer('_order'),
  _parentID: integer('_parent_id'),
  id: serial('id').primaryKey(),
})

const eventsBlocksArtist = pgTable('events_blocks_artist', {
  _parentID: integer('_parent_id'),
  _path: text('_path'),
  artistID: integer('artist_id'),
  id: serial('id').primaryKey(),
})

const artists = pgTable('artists', {
  id: serial('id').primaryKey(),
})

const adapter = {
  idType: 'serial',
  name: 'postgres',
  payload: {
    blocks: {},
    collections: {
      artists: {
        config: {
          flattenedFields: [],
          slug: 'artists',
        },
      },
    },
    config: {},
  },
  relationshipsSuffix: '_rels',
  tableNameMap: new Map([
    ['artists', 'artists'],
    ['events', 'events'],
    ['events_blocks_artist', 'events_blocks_artist'],
    ['events_lineup', 'events_lineup'],
  ]),
  tables: {
    artists,
    events,
    events_blocks_artist: eventsBlocksArtist,
    events_lineup: eventsLineup,
  },
} as never

const fields = [
  {
    flattenedFields: [
      {
        blocks: [
          {
            flattenedFields: [
              {
                name: 'artist',
                relationTo: 'artists',
                type: 'relationship',
              },
            ],
            slug: 'artist',
          },
        ],
        name: 'performers',
        type: 'blocks',
      },
    ],
    name: 'lineup',
    type: 'array',
  },
] as never

const eventsBlocksVenue = pgTable('events_blocks_venue', {
  _parentID: integer('_parent_id'),
  _path: text('_path'),
  id: serial('id').primaryKey(),
  name: text('name'),
})

const multiBlockTypeAdapter = {
  idType: 'serial',
  name: 'postgres',
  payload: {
    blocks: {},
    collections: {},
    config: {},
  },
  relationshipsSuffix: '_rels',
  tableNameMap: new Map([
    ['events', 'events'],
    ['events_blocks_artist', 'events_blocks_artist'],
    ['events_blocks_venue', 'events_blocks_venue'],
  ]),
  tables: {
    events,
    events_blocks_artist: eventsBlocksArtist,
    events_blocks_venue: eventsBlocksVenue,
  },
} as never

// A `blocks` field with more than one possible block type, where only a
// later block type has the queried subfield. `constraintPath` must not
// accumulate across the `.some()` attempts over `field.blocks`, or the
// `_path` LIKE constraint built for the second (matching) block type ends up
// scoped to the first (non-matching) block type's failed attempt.
const multiBlockTypeFields = [
  {
    blocks: [
      {
        flattenedFields: [{ name: 'foo', type: 'text' }],
        slug: 'artist',
      },
      {
        flattenedFields: [{ name: 'name', type: 'text' }],
        slug: 'venue',
      },
    ],
    name: 'performers',
    type: 'blocks',
  },
] as never

const dialect = new PgDialect()

describe('getTableColumnFromPath: blocks field with multiple block types', () => {
  it('does not accumulate constraintPath across .some() attempts over block types', () => {
    const joins: { condition?: unknown; table?: { [key: string]: unknown } }[] = []

    getTableColumnFromPath({
      adapter: multiBlockTypeAdapter,
      collectionPath: 'events',
      fields: multiBlockTypeFields,
      joins: joins as never,
      parentIsLocalized: false,
      pathSegments: ['performers', 'name'],
      selectFields: {},
      tableName: 'events',
      value: 'x',
    })

    expect(joins).toHaveLength(1)

    const rendered = dialect.sqlToQuery(joins[0].condition as never)

    // The `_path` value real block rows are written with (see
    // `transformBlocks` in blocks.ts) is just `performers`, not
    // `performers.%.performers`.
    expect(rendered.params).toEqual(['performers'])
  })
})

describe('getTableColumnFromPath: blocks field nested inside an array field', () => {
  it('resolves the blocks table against the root table, not the array table', () => {
    const joins: { condition?: unknown; table?: { [key: string]: unknown } }[] = []

    // Should not throw, and should join against the root `events` table's id,
    // not the `events_lineup` array row's id, since `_parent_id` on the
    // blocks table always references the root document.
    expect(() =>
      getTableColumnFromPath({
        adapter,
        collectionPath: 'events',
        fields,
        joins: joins as never,
        parentIsLocalized: false,
        pathSegments: ['lineup', 'performers', 'artist'],
        selectFields: {},
        tableName: 'events',
        value: '1',
      }),
    ).not.toThrow()

    // Two joins should have been added: the `events_lineup` array table, and
    // the blocks table -- joined to the root `events` table (not the
    // `events_lineup` array table), scoped to the correct array index via a
    // `_path` LIKE constraint.
    expect(joins).toHaveLength(2)

    const blockJoin = joins[1]

    expect(blockJoin.table).toBe(eventsBlocksArtist)

    const rendered = dialect.sqlToQuery(blockJoin.condition as never)

    expect(rendered.sql).toBe(
      '("events"."id" = "events_blocks_artist"."_parent_id" and "events_blocks_artist"."_path" like $1)',
    )
    expect(rendered.params).toEqual(['lineup.%.performers'])
  })
})

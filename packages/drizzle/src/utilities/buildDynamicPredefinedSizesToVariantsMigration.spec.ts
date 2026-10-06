import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'

import { buildDynamicPredefinedSizesToVariantsMigration } from './buildDynamicPredefinedSizesToVariantsMigration.js'
import {
  findSizesToVariantsFieldCollision,
  getSizesToVariantsRenames,
} from './getSizesToVariantsRenames.js'

const tempDirs: string[] = []

const makeMigrationDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sizes-to-variants-'))
  tempDirs.push(dir)
  return dir
}

/** A 3.x snapshot: a camelCase `heroLarge` size stored as `sizes_*`, plus an unrelated table. */
const legacySnapshot = {
  id: 'previous-snapshot-id',
  tables: {
    'public.media': {
      name: 'media',
      columns: {
        id: { name: 'id' },
        sizes_hero_large_filename: { name: 'sizes_hero_large_filename' },
      },
      indexes: {
        media_sizes_hero_large_sizes_hero_large_filename_idx: {
          name: 'media_sizes_hero_large_sizes_hero_large_filename_idx',
          columns: [{ expression: 'sizes_hero_large_filename', isExpression: false }],
        },
      },
    },
    'public.posts': {
      name: 'posts',
      columns: { title: { name: 'title' } },
      indexes: {},
    },
  },
  version: '7',
}

const makePayload = ({ migrationDir }: { migrationDir: string }) =>
  ({
    db: {
      migrationDir,
      payload: {
        config: {
          collections: [
            {
              slug: 'media',
              upload: { variants: [{ name: 'heroLarge' }] },
            },
          ],
        },
      },
      rawTables: {
        media: {
          name: 'media',
          columns: {
            id: { name: 'id' },
            variants_heroLarge_filename: { name: 'variants_hero_large_filename' },
          },
          indexes: {
            media_variants_hero_large_variants_hero_large_filename_idx: {
              name: 'media_variants_hero_large_variants_hero_large_filename_idx',
              on: 'variants_heroLarge_filename',
            },
          },
        },
      },
      requireDrizzleKit: () => ({ generateDrizzleJson: () => Promise.resolve({ version: '7' }) }),
      schema: {},
      tableNameMap: new Map([['media', 'media']]),
      versionsSuffix: '_v',
    },
  }) as any

describe('buildDynamicPredefinedSizesToVariantsMigration', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { force: true, recursive: true })
    }
  })

  it('should write the previous snapshot with only the sizes-to-variants renames applied', async () => {
    const migrationDir = makeMigrationDir()
    const filePath = path.join(migrationDir, '20260102_000000_sizes_to_variants')

    fs.writeFileSync(
      path.join(migrationDir, '20260101_000000_initial.json'),
      JSON.stringify(legacySnapshot),
    )

    await buildDynamicPredefinedSizesToVariantsMigration({
      packageName: '@payloadcms/db-postgres',
    })({
      filePath,
      payload: makePayload({ migrationDir }),
    })

    const written = JSON.parse(fs.readFileSync(`${filePath}.json`, 'utf8'))
    const media = written.tables['public.media']

    expect(Object.keys(media.columns)).toEqual(['id', 'variants_hero_large_filename'])
    expect(media.indexes).toEqual({
      media_variants_hero_large_variants_hero_large_filename_idx: {
        name: 'media_variants_hero_large_variants_hero_large_filename_idx',
        columns: [{ expression: 'variants_hero_large_filename', isExpression: false }],
      },
    })
    expect(written.tables['public.posts']).toEqual(legacySnapshot.tables['public.posts'])
    expect(written.prevId).toBe(legacySnapshot.id)
  })

  it('should not write a snapshot when the project has no previous one', async () => {
    const migrationDir = makeMigrationDir()
    const filePath = path.join(migrationDir, '20260102_000000_sizes_to_variants')

    await buildDynamicPredefinedSizesToVariantsMigration({
      packageName: '@payloadcms/db-postgres',
    })({
      filePath,
      payload: makePayload({ migrationDir }),
    })

    expect(fs.existsSync(`${filePath}.json`)).toBe(false)
  })

  it('should only plan columns for configured generated variants', () => {
    const migrationDir = makeMigrationDir()
    const payload = makePayload({ migrationDir })
    const collection = payload.db.payload.config.collections[0]

    collection.fields = [
      {
        fields: [{ name: 'customValue', type: 'text' }],
        name: 'variants',
        type: 'group',
      },
    ]
    payload.db.rawTables.media.columns.variants_heroLarge_credit = {
      name: 'variants_hero_large_credit',
    }

    expect(getSizesToVariantsRenames({ adapter: payload.db, direction: 'up' })[0]?.columns).toEqual(
      [
        {
          from: 'sizes_hero_large_filename',
          to: 'variants_hero_large_filename',
        },
      ],
    )
  })

  it('should plan the generated nested field index name in both directions', () => {
    const payload = makePayload({ migrationDir: makeMigrationDir() })

    expect(getSizesToVariantsRenames({ adapter: payload.db, direction: 'up' })[0]?.indexes).toEqual(
      [
        {
          columns: ['variants_hero_large_filename'],
          legacyNameBase: 'media_sizes_hero_large_sizes_hero_large_filename',
          to: 'media_variants_hero_large_variants_hero_large_filename_idx',
          unique: false,
        },
      ],
    )
    expect(
      getSizesToVariantsRenames({ adapter: payload.db, direction: 'down' })[0]?.indexes,
    ).toEqual([
      {
        columns: ['sizes_hero_large_filename'],
        from: 'media_variants_hero_large_variants_hero_large_filename_idx',
        legacyNameBase: 'media_sizes_hero_large_sizes_hero_large_filename',
        to: 'media_sizes_hero_large_sizes_hero_large_filename_idx',
        unique: false,
      },
    ])
  })

  it('should reject a snapshot that contains both source and destination columns', async () => {
    const migrationDir = makeMigrationDir()
    const filePath = path.join(migrationDir, '20260102_000000_sizes_to_variants')
    const snapshotWithCollision = structuredClone(legacySnapshot)

    snapshotWithCollision.tables['public.media'].columns.variants_hero_large_filename = {
      name: 'variants_hero_large_filename',
    }

    fs.writeFileSync(
      path.join(migrationDir, '20260101_000000_initial.json'),
      JSON.stringify(snapshotWithCollision),
    )

    await expect(
      buildDynamicPredefinedSizesToVariantsMigration({
        packageName: '@payloadcms/db-postgres',
      })({
        filePath,
        payload: makePayload({ migrationDir }),
      }),
    ).rejects.toThrow(
      'contains both "sizes_hero_large_filename" and "variants_hero_large_filename"',
    )

    expect(fs.existsSync(`${filePath}.json`)).toBe(false)
  })

  it('should reject a snapshot that contains legacy sizes and a disjoint custom variants field', async () => {
    const migrationDir = makeMigrationDir()
    const filePath = path.join(migrationDir, '20260102_000000_sizes_to_variants')
    const snapshotWithCustomVariants = structuredClone(legacySnapshot)

    snapshotWithCustomVariants.tables['public.media'].columns.variants_custom_value = {
      name: 'variants_custom_value',
    }

    fs.writeFileSync(
      path.join(migrationDir, '20260101_000000_initial.json'),
      JSON.stringify(snapshotWithCustomVariants),
    )

    await expect(
      buildDynamicPredefinedSizesToVariantsMigration({
        packageName: '@payloadcms/db-postgres',
      })({
        filePath,
        payload: makePayload({ migrationDir }),
      }),
    ).rejects.toThrow('contains both the "sizes" and "variants" fields')

    expect(fs.existsSync(`${filePath}.json`)).toBe(false)
  })

  it.each([
    {
      columns: [{ from: 'sizes_thumbnail_filename', to: 'variants_thumbnail_filename' }],
      existingColumns: new Set(['sizes_thumbnail_filename', 'variants']),
      expected: { from: 'sizes', to: 'variants' },
    },
    {
      columns: [
        {
          from: 'version_sizes_thumbnail_filename',
          to: 'version_variants_thumbnail_filename',
        },
      ],
      existingColumns: new Set(['version_sizes_thumbnail_filename', 'version_variants']),
      expected: { from: 'version.sizes', to: 'version.variants' },
    },
  ])(
    'should detect an exact scalar destination column at the renamed field path',
    ({ columns, existingColumns, expected }) => {
      expect(findSizesToVariantsFieldCollision({ columns, existingColumns })).toEqual(expected)
    },
  )

  it('should reject a snapshot that contains both source and destination indexes', async () => {
    const migrationDir = makeMigrationDir()
    const filePath = path.join(migrationDir, '20260102_000000_sizes_to_variants')
    const snapshotWithCollision = structuredClone(legacySnapshot)

    snapshotWithCollision.tables[
      'public.media'
    ].indexes.media_variants_hero_large_variants_hero_large_filename_idx = {
      name: 'media_variants_hero_large_variants_hero_large_filename_idx',
      columns: [{ expression: 'variants_hero_large_filename', isExpression: false }],
    }

    fs.writeFileSync(
      path.join(migrationDir, '20260101_000000_initial.json'),
      JSON.stringify(snapshotWithCollision),
    )

    await expect(
      buildDynamicPredefinedSizesToVariantsMigration({
        packageName: '@payloadcms/db-postgres',
      })({
        filePath,
        payload: makePayload({ migrationDir }),
      }),
    ).rejects.toThrow(
      'contains both indexes "media_sizes_hero_large_sizes_hero_large_filename_idx" and "media_variants_hero_large_variants_hero_large_filename_idx"',
    )

    expect(fs.existsSync(`${filePath}.json`)).toBe(false)
  })
})

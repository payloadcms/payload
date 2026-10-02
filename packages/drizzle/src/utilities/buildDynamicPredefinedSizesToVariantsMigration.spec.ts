import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'

import { buildDynamicPredefinedSizesToVariantsMigration } from './buildDynamicPredefinedSizesToVariantsMigration.js'

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
      payload: { config: { collections: [{ slug: 'media', upload: {} }] } },
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
})

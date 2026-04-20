import type { CollectionConfig, CollectionSlug, Payload } from 'payload'

import { existsSync, readdirSync, readFileSync, rmSync } from 'fs'
import path from 'path'
import { buildConfig, getPayload } from 'payload'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const describeToUse = process.env.PAYLOAD_DATABASE === 'postgres' ? describe : describe.skip

const PG_MAX_IDENTIFIER_LENGTH = 63

type IdentifierCategory = 'COLUMN' | 'CONSTRAINT' | 'FK_TABLE_REF' | 'INDEX' | 'TABLE' | 'TYPE'

type CategorizedIdentifiers = Record<IdentifierCategory, string[]>

const identifierPatterns: { label: IdentifierCategory; regex: RegExp }[] = [
  { label: 'TABLE', regex: /CREATE\s+TABLE\s+"(?:public"\.)?"([^"]+)"/gi },
  { label: 'TYPE', regex: /CREATE\s+TYPE\s+"(?:public"\.)?"([^"]+)"/gi },
  {
    label: 'INDEX',
    regex: /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?"([^"]+)"/gi,
  },
  { label: 'CONSTRAINT', regex: /CONSTRAINT\s+"([^"]+)"/gi },
  {
    label: 'COLUMN',
    regex:
      /^\s+"([^"]+)"\s+(?:varchar|integer|numeric|boolean|timestamp|jsonb|serial|text|uuid|bigint)/gim,
  },
  { label: 'COLUMN', regex: /ADD\s+COLUMN\s+"([^"]+)"/gi },
  { label: 'FK_TABLE_REF', regex: /REFERENCES\s+"(?:public"\.)?"([^"]+)"/gi },
  { label: 'TYPE', regex: /ALTER\s+TYPE\s+"(?:public"\.)?"([^"]+)"/gi },
]

/**
 * Extracts all SQL identifiers from migration SQL, categorized by PostgreSQL object type.
 */
function extractIdentifiers(migrationSQL: string): CategorizedIdentifiers {
  const result: CategorizedIdentifiers = {
    COLUMN: [],
    CONSTRAINT: [],
    FK_TABLE_REF: [],
    INDEX: [],
    TABLE: [],
    TYPE: [],
  }

  for (const { label, regex } of identifierPatterns) {
    for (const match of migrationSQL.matchAll(regex)) {
      const name = match?.[1]
      if (name && !result[label].includes(name)) {
        result[label].push(name)
      }
    }
  }

  return result
}

/**
 * Creates a fresh copy of collections designed to generate identifiers exceeding 63 chars.
 *
 * Table names stay within 63 chars, but auto-generated Drizzle FK names for
 * single-relation relationship fields in deeply nested versioned arrays exceed it.
 *
 * Example too-long auto-generated FK (by Drizzle, without compression):
 *   _recipe_configs_v_version_prep_instructions_instruction_items_related_item_id_related_items_id_fk
 *   (97 chars)
 *
 * Deepest versioned table name (fits within 63 chars):
 *   _recipe_configs_v_version_prep_instructions_instruction_items
 *   (62 chars)
 */
function createCollections(): CollectionConfig[] {
  return [
    {
      slug: 'recipe-configs',
      fields: [
        {
          name: 'prep_instructions',
          type: 'array',
          fields: [
            {
              name: 'localized_ref',
              type: 'relationship',
              localized: true,
              relationTo: 'related-items' as CollectionSlug,
            },
            {
              name: 'poly_ref',
              type: 'relationship',
              relationTo: ['related-items' as CollectionSlug, 'recipe-configs' as CollectionSlug],
            },
            {
              name: 'tag_categories',
              type: 'text',
              hasMany: true,
            },
            {
              name: 'rating_scores',
              type: 'number',
              hasMany: true,
            },
            {
              name: 'instruction_items',
              type: 'array',
              fields: [
                {
                  name: 'description',
                  type: 'text',
                },
                {
                  name: 'related_item',
                  type: 'relationship',
                  relationTo: 'related-items' as CollectionSlug,
                },
                {
                  name: 'related_item_with_a_very_long',
                  type: 'relationship',
                  relationTo: 'related-items' as CollectionSlug,
                },
                {
                  name: 'replacement_item',
                  type: 'relationship',
                  relationTo: 'related-items' as CollectionSlug,
                },
                {
                  name: 'step_image',
                  type: 'upload',
                  relationTo: 'recipe-images' as CollectionSlug,
                },
              ],
            },
          ],
        },
        {
          name: 'content_blocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'ingredient_detail',
              fields: [
                {
                  name: 'block_ref',
                  type: 'relationship',
                  relationTo: 'related-items' as CollectionSlug,
                },
              ],
            },
          ],
        },
      ],
      versions: { drafts: true, maxPerDoc: 5 },
    },
    {
      // Similar name and structure to recipe-configs to test collision avoidance.
      // Both collections produce similarly compressed identifiers, but the
      // deterministic hash suffix should keep them distinct.
      slug: 'recipe-options',
      fields: [
        {
          name: 'prep_instructions',
          type: 'array',
          fields: [
            {
              name: 'instruction_items',
              type: 'array',
              fields: [
                {
                  name: 'related_item',
                  type: 'relationship',
                  relationTo: 'related-items' as CollectionSlug,
                },
              ],
            },
          ],
        },
      ],
      versions: { drafts: true },
    },
    {
      slug: 'related-items',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'recipe-images',
      fields: [],
      upload: true,
    },
  ]
}

const clearMigrations = (dir: string) => {
  if (existsSync(dir)) {
    rmSync(dir, { force: true, recursive: true })
  }
}

function readMigrationSQL(migrationDir: string): string {
  const migrationFiles = readdirSync(migrationDir).filter(
    (f) => f.endsWith('.ts') && f !== 'index.ts',
  )
  const migrationFile = migrationFiles[0]
  if (!migrationFile) {
    throw new Error('No migration files found')
  }

  return readFileSync(path.resolve(migrationDir, migrationFile), 'utf-8')
}

function expectNoneExceedLimit(category: IdentifierCategory, names: string[]) {
  const oversized = names.filter((n) => n.length > PG_MAX_IDENTIFIER_LENGTH)
  expect(oversized, `${category} identifiers exceeding ${PG_MAX_IDENTIFIER_LENGTH} chars`).toEqual(
    [],
  )
}

type GlobalConfigInput = Parameters<typeof buildConfig>[0]['globals'] extends
  | (infer T)[]
  | undefined
  ? T
  : never

type CompressedMigrationArgs = {
  collections?: CollectionConfig[]
  fn: (args: {
    categorized: CategorizedIdentifiers
    payload: Payload
    sql: string
  }) => Promise<void> | void
  globals?: GlobalConfigInput[]
  key: string
  localization?: { defaultLocale: string; locales: string[] }
  migrationDir: string
  runMigrations?: boolean
}

/**
 * Sets up a Payload instance with identifier compression enabled, generates a migration,
 * exposes the parsed identifiers to the caller, and tears everything down afterward.
 *
 * Restores `databaseAdapter.init` after running so tests don't leak wrappers into each other.
 */
async function withCompressedMigration({
  collections,
  fn,
  globals,
  key,
  localization,
  migrationDir,
  runMigrations = false,
}: CompressedMigrationArgs): Promise<void> {
  clearMigrations(migrationDir)

  try {
    const { databaseAdapter } = await import(path.resolve(dirname, '../../databaseAdapter.js'))

    const originalInit = databaseAdapter.init

    databaseAdapter.init = ({ payload }: { payload: Payload }) => {
      const adapter = originalInit({ payload })
      adapter.migrationDir = migrationDir
      adapter.push = false
      adapter.shouldCompressIdentifiers = true
      adapter.maxIdentifierLength = PG_MAX_IDENTIFIER_LENGTH
      return adapter
    }

    try {
      const config = await buildConfig({
        collections,
        db: databaseAdapter,
        globals,
        localization,
        secret: 'secret',
      })

      const payload = await getPayload({ config, key })

      await payload.db.createMigration({ payload })

      const sql = readMigrationSQL(migrationDir)
      const categorized = extractIdentifiers(sql)

      if (runMigrations) {
        await payload.db.migrate()
      }

      await fn({ categorized, payload, sql })

      await payload.db.dropDatabase({ adapter: payload.db as any })
      await payload.destroy()
    } finally {
      databaseAdapter.init = originalInit
    }
  } finally {
    clearMigrations(migrationDir)
  }
}

describeToUse('Identifier compression', () => {
  it('should generate FK identifiers exceeding 63 chars without compression', async () => {
    const migrationDir = path.resolve(dirname, 'migrations-no-compress')

    clearMigrations(migrationDir)

    try {
      const { databaseAdapter } = await import(path.resolve(dirname, '../../databaseAdapter.js'))

      const init = databaseAdapter.init

      databaseAdapter.init = ({ payload }: { payload: Payload }) => {
        const adapter = init({ payload })
        adapter.migrationDir = migrationDir
        adapter.push = false
        return adapter
      }

      const config = await buildConfig({
        collections: createCollections(),
        db: databaseAdapter,
        localization: { defaultLocale: 'en', locales: ['en', 'es'] },
        secret: 'secret',
      })

      const payload = await getPayload({ config, key: 'no-compress' })

      await payload.db.createMigration({ payload })

      const migrationSQL = readMigrationSQL(migrationDir)
      const categorized = extractIdentifiers(migrationSQL)

      // Without compression, auto-generated Drizzle FK/constraint names for relationship
      // fields in deeply nested versioned tables exceed PostgreSQL's 63-char limit.
      const oversizedConstraints = categorized.CONSTRAINT.filter(
        (id) => id.length > PG_MAX_IDENTIFIER_LENGTH,
      )

      expect(oversizedConstraints.length).toBeGreaterThan(0)

      // Tables, types, and columns should still fit (Payload validates table names separately)
      for (const name of categorized.TABLE) {
        expect(name.length).toBeLessThanOrEqual(PG_MAX_IDENTIFIER_LENGTH)
      }

      for (const name of categorized.TYPE) {
        expect(name.length).toBeLessThanOrEqual(PG_MAX_IDENTIFIER_LENGTH)
      }

      await payload.db.dropDatabase({ adapter: payload.db as any })
      await payload.destroy()
    } finally {
      clearMigrations(migrationDir)
    }
  })

  it('should fail migration without compression due to duplicate truncated FK names', async () => {
    const migrationDir = path.resolve(dirname, 'migrations-duplicate-fk')

    clearMigrations(migrationDir)

    try {
      const { databaseAdapter } = await import(path.resolve(dirname, '../../databaseAdapter.js'))

      const init = databaseAdapter.init

      databaseAdapter.init = ({ payload }: { payload: Payload }) => {
        const adapter = init({ payload })
        adapter.migrationDir = migrationDir
        adapter.push = false
        return adapter
      }

      const config = await buildConfig({
        collections: createCollections(),
        db: databaseAdapter,
        localization: { defaultLocale: 'en', locales: ['en', 'es'] },
        secret: 'secret',
      })

      const payload = await getPayload({ config, key: 'duplicate-fk' })

      await payload.db.createMigration({ payload })

      // Verify constraint names collide after 63-char truncation.
      // The versioned table name is 61 chars, so FK names starting with the same
      // letter truncate to the same 63 chars, causing Postgres to see duplicates.
      const migrationSQL = readMigrationSQL(migrationDir)
      const categorized = extractIdentifiers(migrationSQL)
      const oversizedConstraints = categorized.CONSTRAINT.filter(
        (id) => id.length > PG_MAX_IDENTIFIER_LENGTH,
      )

      const truncatedNames = oversizedConstraints.map((id) => id.slice(0, PG_MAX_IDENTIFIER_LENGTH))
      const duplicateTruncated = truncatedNames.filter(
        (name, i) => truncatedNames.indexOf(name) !== i,
      )

      expect(duplicateTruncated.length).toBeGreaterThan(0)

      // Running this migration on Postgres should fail due to duplicate constraint names
      await expect(payload.db.migrate()).rejects.toThrow()

      await payload.db.dropDatabase({ adapter: payload.db as any })
      await payload.destroy()
    } finally {
      clearMigrations(migrationDir)
    }
  })

  it('should compress all identifiers within 63 chars and run migration successfully', async () => {
    const migrationDir = path.resolve(dirname, 'migrations-compressed')

    clearMigrations(migrationDir)

    try {
      const { databaseAdapter } = await import(path.resolve(dirname, '../../databaseAdapter.js'))

      const init = databaseAdapter.init

      databaseAdapter.init = ({ payload }: { payload: Payload }) => {
        const adapter = init({ payload })
        adapter.migrationDir = migrationDir
        adapter.push = false
        adapter.shouldCompressIdentifiers = true
        adapter.maxIdentifierLength = PG_MAX_IDENTIFIER_LENGTH
        return adapter
      }

      const config = await buildConfig({
        collections: createCollections(),
        db: databaseAdapter,
        localization: { defaultLocale: 'en', locales: ['en', 'es'] },
        secret: 'secret',
      })

      const payload = await getPayload({ config, key: 'compressed' })

      // Generate migration
      await payload.db.createMigration({ payload })

      const migrationSQL = readMigrationSQL(migrationDir)
      const categorized = extractIdentifiers(migrationSQL)

      // Every category of identifier should fit within PostgreSQL's 63-char limit
      for (const [category, names] of Object.entries(categorized)) {
        const oversized = names.filter((id) => id.length > PG_MAX_IDENTIFIER_LENGTH)
        expect(
          oversized,
          `${category} identifiers exceeding ${PG_MAX_IDENTIFIER_LENGTH} chars`,
        ).toEqual([])
      }

      // No duplicate identifiers within each category
      for (const [category, names] of Object.entries(categorized)) {
        const seen = new Set<string>()
        const duplicates: string[] = []

        for (const name of names) {
          if (seen.has(name)) {
            duplicates.push(name)
          }
          seen.add(name)
        }

        expect(duplicates, `duplicate ${category} identifiers`).toEqual([])
      }

      // Migration should run up and down successfully
      await payload.db.migrate()
      await payload.db.migrateDown()

      await payload.db.dropDatabase({ adapter: payload.db as any })
      await payload.destroy()
    } finally {
      clearMigrations(migrationDir)
    }
  })

  it('should produce deterministic identifiers across separate generations', async () => {
    const migrationDir1 = path.resolve(dirname, 'migrations-determinism-1')
    const migrationDir2 = path.resolve(dirname, 'migrations-determinism-2')

    clearMigrations(migrationDir1)
    clearMigrations(migrationDir2)

    try {
      // First generation
      const { databaseAdapter: da1 } = await import(
        path.resolve(dirname, '../../databaseAdapter.js')
      )

      const init1 = da1.init

      da1.init = ({ payload }: { payload: Payload }) => {
        const adapter = init1({ payload })
        adapter.migrationDir = migrationDir1
        adapter.push = false
        adapter.shouldCompressIdentifiers = true
        adapter.maxIdentifierLength = PG_MAX_IDENTIFIER_LENGTH
        return adapter
      }

      const config1 = await buildConfig({
        collections: createCollections(),
        db: da1,
        localization: { defaultLocale: 'en', locales: ['en', 'es'] },
        secret: 'secret',
      })

      const payload1 = await getPayload({ config: config1, key: 'determinism-1' })

      await payload1.db.createMigration({ payload: payload1 })

      const categorized1 = extractIdentifiers(readMigrationSQL(migrationDir1))

      await payload1.db.dropDatabase({ adapter: payload1.db as any })
      await payload1.destroy()

      // Second generation — same config, fresh Payload instance
      const { databaseAdapter: da2 } = await import(
        path.resolve(dirname, '../../databaseAdapter.js')
      )

      const init2 = da2.init

      da2.init = ({ payload }: { payload: Payload }) => {
        const adapter = init2({ payload })
        adapter.migrationDir = migrationDir2
        adapter.push = false
        adapter.shouldCompressIdentifiers = true
        adapter.maxIdentifierLength = PG_MAX_IDENTIFIER_LENGTH
        return adapter
      }

      const config2 = await buildConfig({
        collections: createCollections(),
        db: da2,
        localization: { defaultLocale: 'en', locales: ['en', 'es'] },
        secret: 'secret',
      })

      const payload2 = await getPayload({ config: config2, key: 'determinism-2' })

      await payload2.db.createMigration({ payload: payload2 })

      const categorized2 = extractIdentifiers(readMigrationSQL(migrationDir2))

      await payload2.db.dropDatabase({ adapter: payload2.db as any })
      await payload2.destroy()

      // Both generations should produce identical identifiers per category
      for (const category of Object.keys(categorized1) as IdentifierCategory[]) {
        expect(categorized1[category], `${category} identifiers should be deterministic`).toEqual(
          categorized2[category],
        )
      }
    } finally {
      clearMigrations(migrationDir1)
      clearMigrations(migrationDir2)
    }
  })

  // ─── Focused gap tests ─────────────────────────────────────────────────────
  // Each test isolates a single overflow shape so failures pinpoint the gap.

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long nested table names (createTableName gap)', async () => {
    // An array nested inside a long-slug collection produces a nested table name
    // of `<slug>_<array_field>` which exceeds 63 chars without compression.
    // createTableName currently throws at 63 with throwValidationError: true.
    await withCompressedMigration({
      collections: [
        {
          slug: 'a_very_long_collection_slug_that_forces_nested_table_compress',
          fields: [
            {
              name: 'deeply_nested_array_field',
              type: 'array',
              fields: [{ name: 'title', type: 'text' }],
            },
          ],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TABLE', categorized.TABLE)
      },
      key: 'gap-nested-table',
      migrationDir: path.resolve(dirname, 'migrations-gap-nested-table'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long enum names for select fields', async () => {
    // enum name = `enum_<parent_table>_<field>` — overflows fast inside versioned arrays.
    await withCompressedMigration({
      collections: [
        {
          slug: 'collection_with_nested_select_fields_for_enum_overflow',
          fields: [
            {
              name: 'nested_array',
              type: 'array',
              fields: [
                {
                  name: 'a_select_field_with_a_rather_long_name',
                  type: 'select',
                  options: ['alpha', 'beta', 'gamma'],
                },
              ],
            },
          ],
          versions: { drafts: true },
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TYPE', categorized.TYPE)
      },
      key: 'gap-enum-select',
      migrationDir: path.resolve(dirname, 'migrations-gap-enum-select'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long enum names for radio fields', async () => {
    // radio fields use the same createTableName({ target: 'enumName' }) path as select.
    await withCompressedMigration({
      collections: [
        {
          slug: 'collection_with_nested_radio_fields_for_enum_overflow',
          fields: [
            {
              name: 'nested_array',
              type: 'array',
              fields: [
                {
                  name: 'a_radio_field_with_a_rather_long_name',
                  type: 'radio',
                  options: ['alpha', 'beta', 'gamma'],
                },
              ],
            },
          ],
          versions: { drafts: true },
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TYPE', categorized.TYPE)
      },
      key: 'gap-enum-radio',
      migrationDir: path.resolve(dirname, 'migrations-gap-enum-radio'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long select-hasMany table names', async () => {
    // select + hasMany produces its own join table at
    // `createTableName(prefix: \`${parentTable}_\`)` — separate from the enum name.
    await withCompressedMigration({
      collections: [
        {
          slug: 'collection_hosting_a_long_select_hasmany_field_name',
          fields: [
            {
              name: 'nested_array',
              type: 'array',
              fields: [
                {
                  name: 'a_select_hasmany_field_with_a_long_field_name',
                  type: 'select',
                  hasMany: true,
                  options: ['alpha', 'beta', 'gamma'],
                },
              ],
            },
          ],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TABLE', categorized.TABLE)
        expectNoneExceedLimit('TYPE', categorized.TYPE)
      },
      key: 'gap-select-hasmany',
      migrationDir: path.resolve(dirname, 'migrations-gap-select-hasmany'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long block table names', async () => {
    // Block tables go through createTableName with
    // `prefix: \`${rootTableName}_blocks_\`` — overflows via long parent slug + block slug.
    await withCompressedMigration({
      collections: [
        {
          slug: 'a_collection_with_a_moderately_long_name_for_block_tests',
          fields: [
            {
              name: 'content_blocks',
              type: 'blocks',
              blocks: [
                {
                  slug: 'a_block_slug_with_a_long_name_for_overflow_tests',
                  fields: [{ name: 'title', type: 'text' }],
                },
              ],
            },
          ],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TABLE', categorized.TABLE)
      },
      key: 'gap-block-table',
      migrationDir: path.resolve(dirname, 'migrations-gap-block-table'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long derived table names (_locales / _rels / _texts / _numbers)', async () => {
    // Collection slug long enough that `<slug>_relationships` > 63 chars.
    // Fields chosen to force creation of all four derived tables.
    await withCompressedMigration({
      collections: [
        {
          slug: 'an_extremely_long_collection_name_for_derived_subtable_test_x',
          fields: [
            { name: 'loc_text', type: 'text', localized: true },
            // hasMany or polymorphic relationship → produces the `_rels` table
            {
              name: 'rel_field',
              type: 'relationship',
              hasMany: true,
              relationTo: 'other_col' as CollectionSlug,
            },
            { name: 'many_text', type: 'text', hasMany: true },
            { name: 'many_num', type: 'number', hasMany: true },
          ],
        },
        {
          slug: 'other_col',
          fields: [{ name: 'title', type: 'text' }],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TABLE', categorized.TABLE)
      },
      key: 'gap-derived-tables',
      localization: { defaultLocale: 'en', locales: ['en', 'es'] },
      migrationDir: path.resolve(dirname, 'migrations-gap-derived'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long column names from deeply nested groups', async () => {
    // columnName grows via `columnPrefix = \`${columnName}_\`` at each group level.
    // 3 levels of groups with long names easily exceed 63 chars.
    await withCompressedMigration({
      collections: [
        {
          slug: 'col_deep_groups',
          fields: [
            {
              name: 'group_level_one_with_a_long_name',
              type: 'group',
              fields: [
                {
                  name: 'group_level_two_with_a_long_name',
                  type: 'group',
                  fields: [
                    {
                      name: 'a_field_with_a_longer_name_that_pushes_over',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('COLUMN', categorized.COLUMN)
      },
      key: 'gap-column-names',
      migrationDir: path.resolve(dirname, 'migrations-gap-columns'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long single-relation FK column names', async () => {
    // The column name for a single relationship is `<columnName>_id`.
    // When the relationship lives inside deeply nested groups, `<columnName>` is already long.
    await withCompressedMigration({
      collections: [
        {
          slug: 'col_rel_col_name',
          fields: [
            {
              name: 'outer_group_with_a_long_name',
              type: 'group',
              fields: [
                {
                  name: 'inner_group_with_a_long_name',
                  type: 'group',
                  fields: [
                    {
                      name: 'a_relationship_field_with_a_long_name',
                      type: 'relationship',
                      relationTo: 'target_col' as CollectionSlug,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          slug: 'target_col',
          fields: [{ name: 'title', type: 'text' }],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('COLUMN', categorized.COLUMN)
      },
      key: 'gap-rel-col',
      migrationDir: path.resolve(dirname, 'migrations-gap-rel-col'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long block-disambiguation table names', async () => {
    // Two `blocks` fields use the same block slug but with different shapes.
    // The second occurrence gets a `_2` suffix which can push past 63 chars.
    await withCompressedMigration({
      collections: [
        {
          slug: 'a_collection_name_long_enough_to_stress_block_suffix',
          fields: [
            {
              name: 'first_blocks',
              type: 'blocks',
              blocks: [
                {
                  slug: 'shared_block_slug_with_a_long_name',
                  fields: [{ name: 'a', type: 'text' }],
                },
              ],
            },
            {
              name: 'second_blocks',
              type: 'blocks',
              blocks: [
                {
                  slug: 'shared_block_slug_with_a_long_name',
                  fields: [{ name: 'b', type: 'number' }],
                },
              ],
            },
          ],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TABLE', categorized.TABLE)
      },
      key: 'gap-block-disambig',
      migrationDir: path.resolve(dirname, 'migrations-gap-block-disambig'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long _texts table names (text hasMany)', async () => {
    // hasMany text fields produce a `<rootTableName>_texts` table at build.ts:372.
    await withCompressedMigration({
      collections: [
        {
          slug: 'a_long_collection_slug_that_forces_texts_table_overflow_xy',
          fields: [{ name: 'many_text', type: 'text', hasMany: true, index: true }],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TABLE', categorized.TABLE)
      },
      key: 'gap-texts-table',
      migrationDir: path.resolve(dirname, 'migrations-gap-texts'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long _numbers table names (number hasMany)', async () => {
    // hasMany number fields produce a `<rootTableName>_numbers` table at build.ts:506.
    await withCompressedMigration({
      collections: [
        {
          slug: 'a_long_collection_slug_that_forces_numbers_table_overflow',
          fields: [{ name: 'many_num', type: 'number', hasMany: true, index: true }],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TABLE', categorized.TABLE)
      },
      key: 'gap-numbers-table',
      migrationDir: path.resolve(dirname, 'migrations-gap-numbers'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long _locales table names (localized field)', async () => {
    // Localized scalar fields produce a `<tableName>_locales` table at build.ts:192.
    await withCompressedMigration({
      collections: [
        {
          slug: 'a_long_collection_slug_that_forces_locales_table_overflow',
          fields: [{ name: 'loc_text', type: 'text', localized: true }],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TABLE', categorized.TABLE)
      },
      key: 'gap-locales-table',
      localization: { defaultLocale: 'en', locales: ['en', 'es'] },
      migrationDir: path.resolve(dirname, 'migrations-gap-locales'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long _rels table names (hasMany relationship)', async () => {
    // hasMany or polymorphic relationship fields produce a `<tableName>_rels`
    // table at build.ts:664.
    await withCompressedMigration({
      collections: [
        {
          slug: 'a_long_collection_slug_that_forces_rels_table_overflow_ab',
          fields: [
            {
              name: 'many_rel',
              type: 'relationship',
              hasMany: true,
              relationTo: 'target_col' as CollectionSlug,
            },
          ],
        },
        {
          slug: 'target_col',
          fields: [{ name: 'title', type: 'text' }],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TABLE', categorized.TABLE)
      },
      key: 'gap-rels-hasmany',
      migrationDir: path.resolve(dirname, 'migrations-gap-rels-hasmany'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long _rels table names (polymorphic relationship)', async () => {
    // Array relationTo also routes through the `<tableName>_rels` table.
    await withCompressedMigration({
      collections: [
        {
          slug: 'a_long_collection_slug_that_forces_rels_table_overflow_cd',
          fields: [
            {
              name: 'poly_rel',
              type: 'relationship',
              relationTo: ['target_a' as CollectionSlug, 'target_b' as CollectionSlug],
            },
          ],
        },
        {
          slug: 'target_a',
          fields: [{ name: 'title', type: 'text' }],
        },
        {
          slug: 'target_b',
          fields: [{ name: 'title', type: 'text' }],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TABLE', categorized.TABLE)
      },
      key: 'gap-rels-poly',
      migrationDir: path.resolve(dirname, 'migrations-gap-rels-poly'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long _rels table names (hasMany upload)', async () => {
    // Upload fields share the relationship code path; hasMany upload → _rels.
    await withCompressedMigration({
      collections: [
        {
          slug: 'a_long_collection_slug_that_forces_rels_table_overflow_ef',
          fields: [
            {
              name: 'many_upload',
              type: 'upload',
              hasMany: true,
              relationTo: 'media_col' as CollectionSlug,
            },
          ],
        },
        {
          slug: 'media_col',
          fields: [],
          upload: true,
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TABLE', categorized.TABLE)
      },
      key: 'gap-rels-upload',
      migrationDir: path.resolve(dirname, 'migrations-gap-rels-upload'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long versioned table names', async () => {
    // Version tables are `_<slug>_v` — created via createTableName at
    // buildRawSchema.ts:38 / :127. Long slug + `_v` can exceed 63 on its own.
    await withCompressedMigration({
      collections: [
        {
          slug: 'a_very_long_versioned_collection_slug_for_forcing_overflow_now',
          fields: [{ name: 'title', type: 'text' }],
          versions: { drafts: true },
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TABLE', categorized.TABLE)
      },
      key: 'gap-versioned-table',
      migrationDir: path.resolve(dirname, 'migrations-gap-versioned'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long _rels column names from long target-collection slugs', async () => {
    // At build.ts:760 the `_rels` table gets a column `<formattedRelationTo>_id`.
    // When the target collection's table name is long, that column overflows 63 chars.
    await withCompressedMigration({
      collections: [
        {
          slug: 'src_col',
          fields: [
            {
              name: 'many_rel',
              type: 'relationship',
              hasMany: true,
              relationTo:
                'a_target_collection_slug_that_forces_rels_col_name_overflow' as CollectionSlug,
            },
          ],
        },
        {
          slug: 'a_target_collection_slug_that_forces_rels_col_name_overflow',
          fields: [{ name: 'title', type: 'text' }],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('COLUMN', categorized.COLUMN)
      },
      key: 'gap-rels-col-name',
      migrationDir: path.resolve(dirname, 'migrations-gap-rels-col-name'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long column names from deeply nested named tabs', async () => {
    // Named `tabs` share the `group` code path (case 'group': case 'tab' in
    // traverseFields.ts), so columnPrefix grows the same way.
    await withCompressedMigration({
      collections: [
        {
          slug: 'col_deep_tabs',
          fields: [
            {
              type: 'tabs',
              tabs: [
                {
                  name: 'outer_tab_with_a_long_name',
                  fields: [
                    {
                      type: 'tabs',
                      tabs: [
                        {
                          name: 'inner_tab_with_a_long_name',
                          fields: [
                            {
                              name: 'a_field_with_a_longer_name_that_pushes_over',
                              type: 'text',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      fn: ({ categorized }) => {
        expectNoneExceedLimit('COLUMN', categorized.COLUMN)
      },
      key: 'gap-tabs-columns',
      migrationDir: path.resolve(dirname, 'migrations-gap-tabs'),
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should compress long global table names (and their derived tables)', async () => {
    // Globals go through createTableName at buildRawSchema.ts:107 / :127.
    // A long global slug produces an overflowing base + versions + locales table
    // set exactly like collections.
    await withCompressedMigration({
      fn: ({ categorized }) => {
        expectNoneExceedLimit('TABLE', categorized.TABLE)
      },
      globals: [
        {
          slug: 'a_very_long_global_slug_that_forces_table_name_compression_x',
          fields: [
            { name: 'title', type: 'text' },
            { name: 'loc_text', type: 'text', localized: true },
          ],
          versions: { drafts: true },
        },
      ],
      key: 'gap-global-table',
      localization: { defaultLocale: 'en', locales: ['en', 'es'] },
      migrationDir: path.resolve(dirname, 'migrations-gap-global'),
    })
  })

  it('should map unique-violation errors back to the field after compression', async () => {
    // adapter.fieldConstraints is keyed by the UNCOMPRESSED `<columnName>_idx`
    // at traverseFields.ts:166. When the generated index name is compressed,
    // handleUpsertError must still resolve the field — this test verifies the
    // end-to-end path for a deeply-nested unique field.
    await withCompressedMigration({
      collections: [
        {
          slug: 'unique_col',
          fields: [
            {
              name: 'nested_group_with_a_name',
              type: 'group',
              fields: [
                {
                  name: 'a_unique_field_with_a_rather_long_name',
                  type: 'text',
                  unique: true,
                },
              ],
            },
          ],
        },
      ],
      fn: async ({ payload }) => {
        const data = {
          nested_group_with_a_name: {
            a_unique_field_with_a_rather_long_name: 'duplicate-value',
          },
        }

        await payload.create({ collection: 'unique_col', data } as any)

        await expect(
          payload.create({ collection: 'unique_col', data } as any),
        ).rejects.toMatchObject({
          name: 'ValidationError',
          data: {
            errors: [
              expect.objectContaining({
                path: expect.stringContaining('a_unique_field_with_a_rather_long_name'),
              }),
            ],
          },
        })
      },
      key: 'gap-unique-violation',
      migrationDir: path.resolve(dirname, 'migrations-gap-unique'),
      runMigrations: true,
    })
  })

  it('should round-trip documents against the compressed schema', async () => {
    // Migration-SQL inspection alone can't catch runtime lookup bugs, e.g. a
    // compressed table key in adapter.tables that isn't mirrored at read time.
    // This test actually migrates up and exercises create / findByID round-trips.
    await withCompressedMigration({
      collections: createCollections(),
      fn: async ({ payload }) => {
        const related = await payload.create({
          collection: 'related-items',
          data: { title: 'Base related' },
        } as any)

        const created = await payload.create({
          collection: 'recipe-configs',
          data: {
            content_blocks: [
              {
                block_ref: related.id,
                blockType: 'ingredient_detail',
              },
            ],
            prep_instructions: [
              {
                instruction_items: [
                  {
                    description: 'step 1',
                    related_item: related.id,
                    replacement_item: related.id,
                  },
                ],
                localized_ref: related.id,
                poly_ref: { relationTo: 'related-items', value: related.id },
                rating_scores: [1, 2],
                tag_categories: ['tag1', 'tag2'],
              },
            ],
          },
        } as any)

        const found = (await payload.findByID({
          id: created.id,
          collection: 'recipe-configs',
          depth: 1,
        } as any)) as any

        expect(found.id).toBe(created.id)
        expect(found.prep_instructions?.[0]?.tag_categories).toEqual(['tag1', 'tag2'])
        expect(found.prep_instructions?.[0]?.rating_scores).toEqual([1, 2])
        expect(found.prep_instructions?.[0]?.instruction_items?.[0]?.description).toBe('step 1')
      },
      key: 'runtime-roundtrip',
      localization: { defaultLocale: 'en', locales: ['en', 'es'] },
      migrationDir: path.resolve(dirname, 'migrations-runtime-roundtrip'),
      runMigrations: true,
    })
  })

  it('should round-trip localized docs when base table name forces _locales compression', async () => {
    const longSlug = 'an_extremely_long_collection_slug_that_approaches_the_limit_ab' // 62 chars
    await withCompressedMigration({
      collections: [
        {
          slug: longSlug,
          fields: [
            { name: 'title', type: 'text' },
            { name: 'loc_field', type: 'text', localized: true },
          ],
        },
      ],
      fn: async ({ payload }) => {
        const created = await payload.create({
          collection: longSlug,
          data: { loc_field: 'A', title: 'T1' },
        } as any)
        const found = (await payload.findByID({
          id: created.id,
          collection: longSlug,
          depth: 0,
        } as any)) as any
        expect(found.title).toBe('T1')
        expect(found.loc_field).toBe('A')
      },
      key: 'runtime-locales-compress',
      localization: { defaultLocale: 'en', locales: ['en', 'es'] },
      migrationDir: path.resolve(dirname, 'migrations-runtime-locales-compress'),
      runMigrations: true,
    })
  })

  it('should query localized docs via where clause when base table name forces _locales compression', async () => {
    const longSlug = 'an_extremely_long_collection_slug_that_approaches_the_limit_ab' // 62 chars
    await withCompressedMigration({
      collections: [
        {
          slug: longSlug,
          fields: [
            { name: 'title', type: 'text' },
            { name: 'loc_field', type: 'text', localized: true },
          ],
        },
      ],
      fn: async ({ payload }) => {
        await payload.create({
          collection: longSlug,
          data: { loc_field: 'needle', title: 'T1' },
        } as any)
        await payload.create({
          collection: longSlug,
          data: { loc_field: 'other', title: 'T2' },
        } as any)

        const result = (await payload.find({
          collection: longSlug,
          where: { loc_field: { equals: 'needle' } },
        } as any)) as any

        expect(result.docs).toHaveLength(1)
        expect(result.docs[0].title).toBe('T1')
      },
      key: 'runtime-locales-where',
      localization: { defaultLocale: 'en', locales: ['en', 'es'] },
      migrationDir: path.resolve(dirname, 'migrations-runtime-locales-where'),
      runMigrations: true,
    })
  })
})

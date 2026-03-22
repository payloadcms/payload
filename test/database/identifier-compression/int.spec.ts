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
      versions: { drafts: true },
      fields: [
        {
          name: 'prep_instructions',
          type: 'array',
          fields: [
            {
              name: 'localized_ref',
              type: 'relationship',
              relationTo: 'related-items' as CollectionSlug,
              localized: true,
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
    },
    {
      // Similar name and structure to recipe-configs to test collision avoidance.
      // Both collections produce similarly compressed identifiers, but the
      // deterministic hash suffix should keep them distinct.
      slug: 'recipe-options',
      versions: { drafts: true },
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
      upload: true,
      fields: [],
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
        db: databaseAdapter,
        localization: { defaultLocale: 'en', locales: ['en', 'es'] },
        secret: 'secret',
        collections: createCollections(),
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
        db: databaseAdapter,
        localization: { defaultLocale: 'en', locales: ['en', 'es'] },
        secret: 'secret',
        collections: createCollections(),
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
        db: databaseAdapter,
        localization: { defaultLocale: 'en', locales: ['en', 'es'] },
        secret: 'secret',
        collections: createCollections(),
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
        db: da1,
        localization: { defaultLocale: 'en', locales: ['en', 'es'] },
        secret: 'secret',
        collections: createCollections(),
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
        db: da2,
        localization: { defaultLocale: 'en', locales: ['en', 'es'] },
        secret: 'secret',
        collections: createCollections(),
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
})

import type { Payload, PayloadRequest } from 'payload'

import { migrateSizesToVariants as migrateMongoSizesToVariants } from '@payloadcms/db-mongodb/migration-utils'
import { migrateSizesToVariants as migratePostgresSizesToVariants } from '@payloadcms/db-postgres/migration-utils'
import { migrateSizesToVariants as migrateSqliteSizesToVariants } from '@payloadcms/db-sqlite/migration-utils'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'
import { commitTransaction, initTransaction } from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { camelCaseVariantName, mediaSlug, variantName } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const variantFilenameColumn = `variants_${variantName}_filename`
const legacyFilenameColumn = `sizes_${variantName}_filename`
const quotedIdentifierCollectionSlug = 'quoted-identifiers'
const quotedIdentifierColumn = `variants_v_"'\``
const quotedIdentifierIndex = `i_"'\``
const quotedIdentifierTable = `m_"'\``

const getQuotedIdentifierMigrationPayload = ({ payload }: { payload: Payload }): Payload => {
  const adapter = payload.db as any

  return {
    db: {
      payload: {
        config: {
          collections: [
            {
              slug: quotedIdentifierCollectionSlug,
              upload: { variants: [{ name: 'v' }] },
            },
          ],
        },
      },
      rawTables: {
        [quotedIdentifierTable]: {
          name: quotedIdentifierTable,
          columns: {
            variants_v_value: { name: quotedIdentifierColumn },
          },
          indexes: {
            variant: {
              name: quotedIdentifierIndex,
              on: 'variants_v_value',
            },
          },
        },
      },
      schemaName: adapter.schemaName,
      tableNameMap: new Map([['quoted_identifiers', quotedIdentifierTable]]),
      versionsSuffix: adapter.versionsSuffix,
    },
    logger: payload.logger,
  } as Payload
}

const createMedia = async ({ payload }: { payload: Payload }) => {
  const doc = await payload.create({
    collection: mediaSlug,
    data: {},
    filePath: path.resolve(dirname, '../uploads/image.png'),
    overrideAccess: true,
  })

  const variantFilename = doc.variants?.[variantName]?.filename

  if (!variantFilename) {
    throw new Error(`Expected the "${variantName}" variant to be generated`)
  }

  return { id: doc.id, filename: doc.filename!, variantFilename }
}

/** The index names the current schema expects on a table's variant filename columns. */
const getExpectedIndexNames = ({
  payload,
  tableName,
}: {
  payload: Payload
  tableName: string
}): string[] => {
  const rawTable = (payload.db as any).rawTables[tableName]

  return [variantName, camelCaseVariantName].map((name) => {
    // Raw index `on` holds the column's schema key, which keeps the camelCase variant name.
    const columnKey = `variants_${name}_filename`
    const index = Object.values<{ name: string; on: string | string[] }>(
      rawTable.indexes ?? {},
    ).find((rawIndex) => [rawIndex.on].flat().includes(columnKey))

    if (!index) {
      throw new Error(`Expected an index on ${columnKey}`)
    }

    return index.name
  })
}

test.suite('sizes-to-variants migration', { config: './config.ts' }, () => {
  test.afterEach(() => {
    fs.rmSync(path.resolve(dirname, 'media'), { force: true, recursive: true })
  })

  test('should not return the legacy sizes field', async ({ payload }) => {
    const { id } = await createMedia({ payload })

    const doc = await payload.findByID({ id, collection: mediaSlug, overrideAccess: true })

    expect(doc).not.toHaveProperty('sizes')
  })

  test.options.describe(
    'PostgreSQL',
    { db: (adapter) => adapter.startsWith('postgres') || adapter.startsWith('vercel-postgres') },
    () => {
      const getColumns = async ({
        payload,
        tableName,
      }: {
        payload: Payload
        tableName: string
      }) => {
        const schemaName = (payload.db as any).schemaName || 'public'
        const result = await (payload.db as any).drizzle.execute(sql`
          SELECT column_name FROM information_schema.columns
          WHERE table_schema = ${schemaName} AND table_name = ${tableName}
        `)

        return result.rows.map((row: { column_name: string }) => row.column_name) as string[]
      }

      const getIndexNames = async ({
        payload,
        tableName,
      }: {
        payload: Payload
        tableName: string
      }) => {
        const schemaName = (payload.db as any).schemaName || 'public'
        const result = await (payload.db as any).drizzle.execute(sql`
          SELECT indexname FROM pg_indexes WHERE schemaname = ${schemaName} AND tablename = ${tableName}
        `)

        return result.rows.map((row: { indexname: string }) => row.indexname) as string[]
      }

      const migrate = ({ direction, payload }: { direction: 'down' | 'up'; payload: Payload }) =>
        migratePostgresSizesToVariants({ db: (payload.db as any).drizzle, direction, payload })

      test('should move legacy sizes columns to variants in Postgres without losing data', async ({
        payload,
      }) => {
        const { id, variantFilename } = await createMedia({ payload })

        await migrate({ direction: 'down', payload })

        expect(await getColumns({ payload, tableName: mediaSlug })).toContain(legacyFilenameColumn)
        expect(await getColumns({ payload, tableName: `_${mediaSlug}_v` })).toContain(
          `version_${legacyFilenameColumn}`,
        )

        await migrate({ direction: 'up', payload })

        const columns = await getColumns({ payload, tableName: mediaSlug })

        expect(columns).toContain(variantFilenameColumn)
        expect(columns).not.toContain(legacyFilenameColumn)
        expect(await getColumns({ payload, tableName: `_${mediaSlug}_v` })).toContain(
          `version_${variantFilenameColumn}`,
        )

        const doc = await payload.findByID({ id, collection: mediaSlug, overrideAccess: true })

        expect(doc.variants?.[variantName]?.filename).toBe(variantFilename)
      })

      test('should rename the variant indexes to the names the current schema expects', async ({
        payload,
      }) => {
        await createMedia({ payload })

        const expectedIndexNames = getExpectedIndexNames({ payload, tableName: mediaSlug })

        await migrate({ direction: 'down', payload })

        expect(await getIndexNames({ payload, tableName: mediaSlug })).not.toEqual(
          expect.arrayContaining(expectedIndexNames),
        )

        await migrate({ direction: 'up', payload })

        expect(await getIndexNames({ payload, tableName: mediaSlug })).toEqual(
          expect.arrayContaining(expectedIndexNames),
        )
      })

      test('should be safe to re-run once the columns are renamed', async ({ payload }) => {
        const { id, variantFilename } = await createMedia({ payload })

        await migrate({ direction: 'up', payload })

        const doc = await payload.findByID({ id, collection: mediaSlug, overrideAccess: true })

        expect(doc.variants?.[variantName]?.filename).toBe(variantFilename)
      })

      test('should reject a PostgreSQL source and destination column collision before changing the table', async ({
        payload,
      }) => {
        await createMedia({ payload })
        await migrate({ direction: 'down', payload })

        const db = (payload.db as any).drizzle
        const schemaName = (payload.db as any).schemaName || 'public'

        await db.execute(sql`
          ALTER TABLE ${sql.identifier(schemaName)}.${sql.identifier(mediaSlug)}
          ADD COLUMN ${sql.identifier(variantFilenameColumn)} varchar
        `)

        try {
          await expect(migrate({ direction: 'up', payload })).rejects.toThrow(
            `contains both "${legacyFilenameColumn}" and "${variantFilenameColumn}"`,
          )

          const columns = await getColumns({ payload, tableName: mediaSlug })

          expect(columns).toContain(legacyFilenameColumn)
          expect(columns).toContain(variantFilenameColumn)
        } finally {
          await db.execute(sql`
            ALTER TABLE ${sql.identifier(schemaName)}.${sql.identifier(mediaSlug)}
            DROP COLUMN ${sql.identifier(variantFilenameColumn)}
          `)
          await migrate({ direction: 'up', payload })
        }
      })

      test('should reject disjoint custom variants columns in PostgreSQL before changing the table', async ({
        payload,
      }) => {
        await createMedia({ payload })
        await migrate({ direction: 'down', payload })

        const customVariantsColumn = 'variants_custom_value'
        const db = (payload.db as any).drizzle
        const schemaName = (payload.db as any).schemaName || 'public'

        await db.execute(sql`
          ALTER TABLE ${sql.identifier(schemaName)}.${sql.identifier(mediaSlug)}
          ADD COLUMN ${sql.identifier(customVariantsColumn)} varchar
        `)

        try {
          await expect(migrate({ direction: 'up', payload })).rejects.toThrow(
            'contains both the "sizes" and "variants" fields',
          )

          expect(await getColumns({ payload, tableName: mediaSlug })).toContain(
            legacyFilenameColumn,
          )
        } finally {
          await db.execute(sql`
            ALTER TABLE ${sql.identifier(schemaName)}.${sql.identifier(mediaSlug)}
            DROP COLUMN ${sql.identifier(customVariantsColumn)}
          `)
          await migrate({ direction: 'up', payload })
        }
      })

      test('should migrate quoted PostgreSQL identifiers', async ({ payload }) => {
        const db = (payload.db as any).drizzle
        const schemaName = (payload.db as any).schemaName || 'public'
        const migrationPayload = getQuotedIdentifierMigrationPayload({ payload })

        await db.execute(sql`
          CREATE TABLE ${sql.identifier(schemaName)}.${sql.identifier(quotedIdentifierTable)} (
            ${sql.identifier(quotedIdentifierColumn)} varchar
          )
        `)
        await db.execute(sql`
          CREATE INDEX ${sql.identifier(quotedIdentifierIndex)}
          ON ${sql.identifier(schemaName)}.${sql.identifier(quotedIdentifierTable)}
          (${sql.identifier(quotedIdentifierColumn)})
        `)

        try {
          await migratePostgresSizesToVariants({ db, direction: 'down', payload: migrationPayload })
          await migratePostgresSizesToVariants({ db, payload: migrationPayload })

          expect(await getColumns({ payload, tableName: quotedIdentifierTable })).toContain(
            quotedIdentifierColumn,
          )
        } finally {
          await db.execute(sql`
            DROP TABLE IF EXISTS ${sql.identifier(schemaName)}.${sql.identifier(quotedIdentifierTable)}
          `)
        }
      })
    },
  )

  test.options.describe('SQLite', { db: (adapter) => adapter.startsWith('sqlite') }, () => {
    const getColumns = async ({ payload, tableName }: { payload: Payload; tableName: string }) => {
      const rows: { name: string }[] = await (payload.db as any).drizzle.all(
        sql.raw(`SELECT name FROM pragma_table_info('${tableName}')`),
      )

      return rows.map(({ name }) => name)
    }

    const getIndexNames = async ({
      payload,
      tableName,
    }: {
      payload: Payload
      tableName: string
    }) => {
      const rows: { name: string }[] = await (payload.db as any).drizzle.all(
        sql.raw(`SELECT name FROM pragma_index_list('${tableName}')`),
      )

      return rows.map(({ name }) => name)
    }

    const migrate = ({ direction, payload }: { direction: 'down' | 'up'; payload: Payload }) =>
      migrateSqliteSizesToVariants({ db: (payload.db as any).drizzle, direction, payload })

    test('should move legacy sizes columns to variants in SQLite without losing data', async ({
      payload,
    }) => {
      const { id, variantFilename } = await createMedia({ payload })

      await migrate({ direction: 'down', payload })

      expect(await getColumns({ payload, tableName: mediaSlug })).toContain(legacyFilenameColumn)
      expect(await getColumns({ payload, tableName: `_${mediaSlug}_v` })).toContain(
        `version_${legacyFilenameColumn}`,
      )

      await migrate({ direction: 'up', payload })

      const columns = await getColumns({ payload, tableName: mediaSlug })

      expect(columns).toContain(variantFilenameColumn)
      expect(columns).not.toContain(legacyFilenameColumn)

      const doc = await payload.findByID({ id, collection: mediaSlug, overrideAccess: true })

      expect(doc.variants?.[variantName]?.filename).toBe(variantFilename)
    })

    test('should recreate the variant indexes under the names the current schema expects', async ({
      payload,
    }) => {
      await createMedia({ payload })

      const expectedIndexNames = getExpectedIndexNames({ payload, tableName: mediaSlug })

      await migrate({ direction: 'down', payload })

      expect(await getIndexNames({ payload, tableName: mediaSlug })).not.toEqual(
        expect.arrayContaining(expectedIndexNames),
      )

      await migrate({ direction: 'up', payload })

      expect(await getIndexNames({ payload, tableName: mediaSlug })).toEqual(
        expect.arrayContaining(expectedIndexNames),
      )
    })

    test('should reject a SQLite source and destination column collision before changing the table', async ({
      payload,
    }) => {
      await createMedia({ payload })
      await migrate({ direction: 'down', payload })

      const db = (payload.db as any).drizzle

      await db.run(sql`
        ALTER TABLE ${sql.identifier(mediaSlug)}
        ADD COLUMN ${sql.identifier(variantFilenameColumn)} text
      `)

      try {
        await expect(migrate({ direction: 'up', payload })).rejects.toThrow(
          `contains both "${legacyFilenameColumn}" and "${variantFilenameColumn}"`,
        )

        const columns = await getColumns({ payload, tableName: mediaSlug })

        expect(columns).toContain(legacyFilenameColumn)
        expect(columns).toContain(variantFilenameColumn)
      } finally {
        await db.run(sql`
          ALTER TABLE ${sql.identifier(mediaSlug)}
          DROP COLUMN ${sql.identifier(variantFilenameColumn)}
        `)
        await migrate({ direction: 'up', payload })
      }
    })

    test('should restore a missing destination index when retrying after a partial failure', async ({
      payload,
    }) => {
      await createMedia({ payload })

      const expectedIndexNames = getExpectedIndexNames({ payload, tableName: mediaSlug })

      await migrate({ direction: 'down', payload })

      const db = (payload.db as any).drizzle
      const legacyIndexRows: { index_name: string }[] = await db.all(sql`
        SELECT il.name AS index_name
        FROM pragma_index_list(${mediaSlug}) AS il
        JOIN pragma_index_info(il.name) AS ii
        WHERE il.origin = 'c' AND ii.name = ${legacyFilenameColumn}
      `)
      const legacyIndexName = legacyIndexRows[0]?.index_name

      expect(legacyIndexName).toBeDefined()

      await db.run(sql`
        ALTER TABLE ${sql.identifier(mediaSlug)}
        RENAME COLUMN ${sql.identifier(legacyFilenameColumn)}
        TO ${sql.identifier(variantFilenameColumn)}
      `)
      await db.run(sql`DROP INDEX ${sql.identifier(legacyIndexName)}`)

      await migrate({ direction: 'up', payload })

      expect(await getIndexNames({ payload, tableName: mediaSlug })).toContain(
        expectedIndexNames[0],
      )
    })

    test('should preserve a custom index on a destination column when re-running', async ({
      payload,
    }) => {
      await createMedia({ payload })
      await migrate({ direction: 'down', payload })
      await migrate({ direction: 'up', payload })

      const customIndexName = 'custom_variant_filename_idx'
      const db = (payload.db as any).drizzle

      await db.run(sql`
        CREATE INDEX ${sql.identifier(customIndexName)}
        ON ${sql.identifier(mediaSlug)} (${sql.identifier(variantFilenameColumn)})
      `)

      try {
        await migrate({ direction: 'up', payload })

        expect(await getIndexNames({ payload, tableName: mediaSlug })).toContain(customIndexName)
      } finally {
        await db.run(sql`DROP INDEX IF EXISTS ${sql.identifier(customIndexName)}`)
      }
    })

    test('should preserve a custom index when repairing a missing destination index', async ({
      payload,
    }) => {
      await createMedia({ payload })

      const [destinationIndexName] = getExpectedIndexNames({ payload, tableName: mediaSlug })
      const customIndexName = 'custom_variant_filename_repair_idx'
      const db = (payload.db as any).drizzle

      await db.run(sql`DROP INDEX ${sql.identifier(destinationIndexName)}`)
      await db.run(sql`
        CREATE INDEX ${sql.identifier(customIndexName)}
        ON ${sql.identifier(mediaSlug)} (${sql.identifier(variantFilenameColumn)})
      `)

      try {
        await migrate({ direction: 'up', payload })

        const indexNames = await getIndexNames({ payload, tableName: mediaSlug })

        expect(indexNames).toContain(destinationIndexName)
        expect(indexNames).toContain(customIndexName)
      } finally {
        await db.run(sql`DROP INDEX IF EXISTS ${sql.identifier(customIndexName)}`)
      }
    })

    test('should reject disjoint custom variants columns in SQLite before changing the table', async ({
      payload,
    }) => {
      await createMedia({ payload })
      await migrate({ direction: 'down', payload })

      const customVariantsColumn = 'variants_custom_value'
      const db = (payload.db as any).drizzle

      await db.run(sql`
        ALTER TABLE ${sql.identifier(mediaSlug)}
        ADD COLUMN ${sql.identifier(customVariantsColumn)} text
      `)

      try {
        await expect(migrate({ direction: 'up', payload })).rejects.toThrow(
          'contains both the "sizes" and "variants" fields',
        )

        expect(await getColumns({ payload, tableName: mediaSlug })).toContain(legacyFilenameColumn)
      } finally {
        await db.run(sql`
          ALTER TABLE ${sql.identifier(mediaSlug)}
          DROP COLUMN ${sql.identifier(customVariantsColumn)}
        `)
        await migrate({ direction: 'up', payload })
      }
    })

    test('should migrate quoted SQLite identifiers', async ({ payload }) => {
      const db = (payload.db as any).drizzle
      const migrationPayload = getQuotedIdentifierMigrationPayload({ payload })

      await db.run(sql`
        CREATE TABLE ${sql.identifier(quotedIdentifierTable)} (
          ${sql.identifier(quotedIdentifierColumn)} text
        )
      `)
      await db.run(sql`
        CREATE INDEX ${sql.identifier(quotedIdentifierIndex)}
        ON ${sql.identifier(quotedIdentifierTable)} (${sql.identifier(quotedIdentifierColumn)})
      `)

      try {
        await migrateSqliteSizesToVariants({ db, direction: 'down', payload: migrationPayload })
        await migrateSqliteSizesToVariants({ db, payload: migrationPayload })

        const rows: { name: string }[] = await db.all(
          sql`SELECT name FROM pragma_table_info(${quotedIdentifierTable})`,
        )

        expect(rows.map(({ name }) => name)).toContain(quotedIdentifierColumn)
      } finally {
        await db.run(sql`DROP TABLE IF EXISTS ${sql.identifier(quotedIdentifierTable)}`)
      }
    })

    test('should skip indexes when the configured table does not exist', async ({ payload }) => {
      const db = (payload.db as any).drizzle
      const migrationPayload = getQuotedIdentifierMigrationPayload({ payload })

      await expect(
        migrateSqliteSizesToVariants({ db, payload: migrationPayload }),
      ).resolves.toBeUndefined()
    })
  })

  test.options.describe('MongoDB', { db: 'mongo' }, () => {
    test.beforeEach(async () => {
      // Let Mongo finish the index builds the fixture reset triggers before indexes are re-keyed.
      await wait(1000)
    })

    const getRawDocument = ({ filename, payload }: { filename: string; payload: Payload }) =>
      (payload.db as any).collections[mediaSlug].collection.findOne({ filename })

    const getIndexKeys = async ({ payload }: { payload: Payload }) => {
      const indexes: { key: Record<string, unknown> }[] = await (payload.db as any).collections[
        mediaSlug
      ].collection.indexes()

      return indexes.flatMap(({ key }) => Object.keys(key))
    }

    const getIndexes = ({ payload }: { payload: Payload }) =>
      (payload.db as any).collections[mediaSlug].collection.indexes() as Promise<
        {
          collation?: { locale?: string; strength?: number }
          hidden?: boolean
          key: Record<string, number>
          name: string
          partialFilterExpression?: Record<string, unknown>
          unique?: boolean
          weights?: Record<string, number>
        }[]
      >

    test('should move a legacy sizes field to variants without losing data', async ({
      payload,
    }) => {
      const { id, filename, variantFilename } = await createMedia({ payload })

      await migrateMongoSizesToVariants({ direction: 'down', payload })

      const legacyDocument = await getRawDocument({ filename, payload })

      expect(legacyDocument.sizes?.[variantName]?.filename).toBe(variantFilename)
      expect(legacyDocument.variants).toBeUndefined()

      await migrateMongoSizesToVariants({ payload })

      const migratedDocument = await getRawDocument({ filename, payload })

      expect(migratedDocument.sizes).toBeUndefined()
      expect(migratedDocument.variants?.[variantName]?.filename).toBe(variantFilename)

      const doc = await payload.findByID({ id, collection: mediaSlug, overrideAccess: true })

      expect(doc.variants?.[variantName]?.filename).toBe(variantFilename)
    })

    test('should migrate inside the transaction payload migrate runs it in', async ({
      payload,
    }) => {
      const { id, variantFilename } = await createMedia({ payload })

      await migrateMongoSizesToVariants({ direction: 'down', payload })

      const req = { payload } as unknown as PayloadRequest

      await initTransaction(req)
      await migrateMongoSizesToVariants({ payload, req })
      await commitTransaction(req)

      const doc = await payload.findByID({ id, collection: mediaSlug, overrideAccess: true })

      expect(doc.variants?.[variantName]?.filename).toBe(variantFilename)
    })

    test('should re-key indexes on the legacy sizes field', async ({ payload }) => {
      await createMedia({ payload })

      await migrateMongoSizesToVariants({ direction: 'down', payload })

      expect(await getIndexKeys({ payload })).toContain(`sizes.${variantName}.filename`)

      await migrateMongoSizesToVariants({ payload })

      const keys = await getIndexKeys({ payload })

      expect(keys).toContain(`variants.${variantName}.filename`)
      expect(keys).not.toContain(`sizes.${variantName}.filename`)
    })

    test('should reject documents with both source and destination fields before changing indexes', async ({
      payload,
    }) => {
      await createMedia({ payload })

      await migrateMongoSizesToVariants({ direction: 'down', payload })

      const collection = (payload.db as any).collections[mediaSlug].collection
      const legacyPath = `sizes.${variantName}.filename`
      const legacyIndex = (await getIndexes({ payload })).find(({ key }) => legacyPath in key)

      await collection.insertOne({
        filename: 'custom-variants-only.jpg',
        variants: { [variantName]: { credit: 'Custom credit' } },
      })

      try {
        await expect(migrateMongoSizesToVariants({ payload })).rejects.toThrow(
          'contains both "sizes" and "variants" data',
        )

        expect((await getIndexes({ payload })).map(({ name }) => name)).toContain(legacyIndex?.name)
      } finally {
        await collection.deleteOne({ filename: 'custom-variants-only.jpg' })
        await migrateMongoSizesToVariants({ payload })
      }
    })

    test('should re-key text indexes on the legacy sizes field', async ({ payload }) => {
      await createMedia({ payload })
      await migrateMongoSizesToVariants({ direction: 'down', payload })

      const collection = (payload.db as any).collections[mediaSlug].collection
      const legacyPath = `sizes.${variantName}.filename`
      const destinationPath = `variants.${variantName}.filename`
      const sourceIndexName = 'legacy_variant_filename_text'

      await collection.createIndex(
        { [legacyPath]: 'text' },
        { name: sourceIndexName, weights: { [legacyPath]: 7 } },
      )

      try {
        await migrateMongoSizesToVariants({ payload })

        const indexes = await getIndexes({ payload })
        const destinationIndex = indexes.find(({ weights }) => destinationPath in (weights ?? {}))

        expect(destinationIndex?.weights).toEqual({ [destinationPath]: 7 })
        expect(indexes.map(({ name }) => name)).not.toContain(sourceIndexName)
      } finally {
        const indexes = await getIndexes({ payload })

        for (const index of indexes) {
          if (legacyPath in (index.weights ?? {}) || destinationPath in (index.weights ?? {})) {
            await collection.dropIndex(index.name)
          }
        }
      }
    })

    test('should rewrite partial filters and preserve index options', async ({ payload }) => {
      await createMedia({ payload })
      await migrateMongoSizesToVariants({ direction: 'down', payload })

      const collection = (payload.db as any).collections[mediaSlug].collection
      const legacyPath = `sizes.${variantName}.filename`
      const destinationPath = `variants.${variantName}.filename`
      const legacyIndex = (await getIndexes({ payload })).find(({ key }) => legacyPath in key)

      expect(legacyIndex).toBeDefined()

      await collection.dropIndex(legacyIndex!.name)
      await collection.createIndex(
        { [legacyPath]: 1 },
        {
          name: legacyIndex!.name,
          collation: { locale: 'en', strength: 2 },
          hidden: true,
          partialFilterExpression: { [legacyPath]: { $exists: true } },
          unique: true,
        },
      )

      try {
        await migrateMongoSizesToVariants({ payload })

        const destinationIndex = (await getIndexes({ payload })).find(
          ({ key }) => destinationPath in key,
        )

        expect(destinationIndex).toMatchObject({
          collation: { locale: 'en', strength: 2 },
          hidden: true,
          partialFilterExpression: { [destinationPath]: { $exists: true } },
          unique: true,
        })
      } finally {
        const indexes = await getIndexes({ payload })

        for (const index of indexes) {
          if (legacyPath in index.key || destinationPath in index.key) {
            await collection.dropIndex(index.name)
          }
        }

        await collection.createIndex({ [destinationPath]: 1 })
      }
    })

    test('should reject an incompatible destination index before removing the source index', async ({
      payload,
    }) => {
      await createMedia({ payload })
      await migrateMongoSizesToVariants({ direction: 'down', payload })

      const collection = (payload.db as any).collections[mediaSlug].collection
      const legacyPath = `sizes.${variantName}.filename`
      const destinationPath = `variants.${variantName}.filename`
      const sourceIndex = (await getIndexes({ payload })).find(({ key }) => legacyPath in key)

      expect(sourceIndex).toBeDefined()

      await collection.createIndex({ incompatibleDestination: 1 }, { name: `${destinationPath}_1` })

      try {
        await expect(migrateMongoSizesToVariants({ payload })).rejects.toThrow()

        expect((await getIndexes({ payload })).map(({ name }) => name)).toContain(sourceIndex!.name)
      } finally {
        await collection.dropIndex(`${destinationPath}_1`)
        await migrateMongoSizesToVariants({ payload })
      }
    })
  })
})

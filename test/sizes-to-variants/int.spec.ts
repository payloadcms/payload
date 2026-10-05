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
  })
})

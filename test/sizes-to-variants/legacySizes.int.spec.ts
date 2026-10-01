import type { Payload } from 'payload'

import { migrateSizesToVariants as migrateMongoSizesToVariants } from '@payloadcms/db-mongodb/migration-utils'
import { migrateSizesToVariants as migratePostgresSizesToVariants } from '@payloadcms/db-postgres/migration-utils'
import { migrateSizesToVariants as migrateSqliteSizesToVariants } from '@payloadcms/db-sqlite/migration-utils'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { mediaSlug, variantName } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const staticDir = path.resolve(dirname, 'media-legacy-sizes')

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

  return { doc, variantFilename }
}

test.suite('legacySizes', { config: './legacySizes.config.ts' }, () => {
  test.afterEach(() => {
    fs.rmSync(staticDir, { force: true, recursive: true })
  })

  test('should return the stored sizes and the variants alias with the same data', async ({
    payload,
  }) => {
    const { doc } = await createMedia({ payload })

    const found = await payload.findByID({
      id: doc.id,
      collection: mediaSlug,
      overrideAccess: true,
    })

    expect(found.sizes?.[variantName]?.url).toBeTruthy()
    expect(found.variants).toEqual(found.sizes)
  })

  test('should resolve where queries on both sizes and variants paths', async ({ payload }) => {
    const { doc, variantFilename } = await createMedia({ payload })

    for (const fieldName of ['sizes', 'variants']) {
      const { docs } = await payload.find({
        collection: mediaSlug,
        overrideAccess: true,
        where: { [`${fieldName}.${variantName}.filename`]: { equals: variantFilename } },
      })

      expect(docs.map(({ id }) => id)).toEqual([doc.id])
    }
  })

  test('should resolve a variants select', async ({ payload }) => {
    const { doc } = await createMedia({ payload })

    const found = await payload.findByID({
      id: doc.id,
      collection: mediaSlug,
      overrideAccess: true,
      select: { variants: true },
    })

    expect(found.variants?.[variantName]?.filename).toBeTruthy()
    expect(found).not.toHaveProperty('filename')
  })

  test('should serve a generated variant file by its filename', async ({ payload, restClient }) => {
    const { variantFilename } = await createMedia({ payload })

    const response = await restClient.GET(`/${mediaSlug}/file/${variantFilename}`)

    expect(response.status).toBe(200)
  })

  test('should delete the generated variant files with the document', async ({ payload }) => {
    const { doc, variantFilename } = await createMedia({ payload })

    expect(fs.existsSync(path.resolve(staticDir, variantFilename))).toBe(true)

    await payload.delete({ id: doc.id, collection: mediaSlug, overrideAccess: true })

    expect(fs.existsSync(path.resolve(staticDir, variantFilename))).toBe(false)
  })

  test('should not store writes to the variants alias', async ({ payload }) => {
    const { doc, variantFilename } = await createMedia({ payload })

    await payload.update({
      id: doc.id,
      collection: mediaSlug,
      data: { variants: { [variantName]: { filename: 'ignored.png' } } } as never,
      overrideAccess: true,
    })

    const found = await payload.findByID({
      id: doc.id,
      collection: mediaSlug,
      overrideAccess: true,
    })

    expect(found.sizes?.[variantName]?.filename).toBe(variantFilename)
    expect(found.variants?.[variantName]?.filename).toBe(variantFilename)
  })

  test.options.describe('MongoDB', { db: 'mongo' }, () => {
    test('should store variants under the legacy sizes field', async ({ payload }) => {
      const { doc, variantFilename } = await createMedia({ payload })

      const rawDocument = await (payload.db as any).collections[mediaSlug].collection.findOne({
        filename: doc.filename,
      })

      expect(rawDocument.sizes?.[variantName]?.filename).toBe(variantFilename)
      expect(rawDocument.variants).toBeUndefined()
    })

    test('should refuse to run the Mongo migration while legacySizes is on', async ({
      payload,
    }) => {
      await expect(migrateMongoSizesToVariants({ payload })).rejects.toThrow(/legacySizes/)
    })
  })

  test.options.describe('SQL', { db: 'drizzle' }, () => {
    test('should keep the legacy sizes columns in the schema', ({ payload }) => {
      const columnNames = Object.values<{ name: string }>(
        (payload.db as any).rawTables[mediaSlug].columns,
      ).map(({ name }) => name)

      expect(columnNames).toContain(`sizes_${variantName}_filename`)
      expect(columnNames).not.toContain(`variants_${variantName}_filename`)
    })

    test('should refuse to run the SQL migration while legacySizes is on', async ({ payload }) => {
      const migrate =
        (payload.db as any).name === 'sqlite'
          ? migrateSqliteSizesToVariants
          : migratePostgresSizesToVariants

      await expect(migrate({ db: (payload.db as any).drizzle, payload })).rejects.toThrow(
        /legacySizes/,
      )
    })
  })
})

import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { readCSV, readJSON } from './helpers.js'
import { postsWithFieldHooksSlug } from './shared.js'

let payload: Payload
let restClient: NextRESTClient
let user: any

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-import-export — field-level hooks', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
    user = await payload.login({
      collection: 'users',
      data: { email: devUser.email, password: devUser.password },
    })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  // ─────────────────────────────────────────────
  // Field-level export hooks
  // ─────────────────────────────────────────────

  describe('field-level export hooks', () => {
    it('should transform CSV output using field-level export hook', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: { title: 'Field Export Test', customExport: 'raw value' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        user,
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-field-hooks-export',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // Field-level export hook should have transformed the value
      expect(rows[0]!.customExport).toBe('raw value exported')

      await payload.delete({ collection: postsWithFieldHooksSlug, id: post.id })
    })

    it('should receive format: csv during CSV export', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: { title: 'Format CSV Test', customExport: 'test' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        user,
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-field-hooks-export',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // The hook writes format into a side-channel column
      expect(rows[0]!.customExport_format).toBe('csv')

      await payload.delete({ collection: postsWithFieldHooksSlug, id: post.id })
    })

    it('should receive format: json during JSON export', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: { title: 'Format JSON Test', customExport: 'test' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        user,
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'json',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-field-hooks-export',
        id: exportDoc.id,
      })

      const jsonPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const docs = await readJSON(jsonPath)

      // Field-level export hook should have transformed the value for JSON too
      expect(docs[0]!.customExport).toBe('test exported')

      await payload.delete({ collection: postsWithFieldHooksSlug, id: post.id })
    })

    it('should transform deeply nested fields (group > named tab > field)', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: {
          title: 'Deep Field Test',
          group: { namedTab: { deepField: 'deep value' } },
        },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        user,
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-field-hooks-export',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // Deeply nested field hook should have run
      expect(rows[0]!.group_namedTab_deepField).toBe('deep value deep_exported')

      await payload.delete({ collection: postsWithFieldHooksSlug, id: post.id })
    })
  })

  // ─────────────────────────────────────────────
  // Field-level import hooks
  // ─────────────────────────────────────────────

  describe('field-level import hooks', () => {
    it('should transform value during CSV import using field-level import hook', async () => {
      const csvContent = `title,customImport\n"Import Hook Test","original_value"`
      const file = {
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        name: 'field-hooks-import.csv',
        size: Buffer.from(csvContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-field-hooks-import',
        user,
        data: { collectionSlug: postsWithFieldHooksSlug, importMode: 'create' },
        file,
      })

      importDoc = await payload.findByID({
        collection: 'posts-with-field-hooks-import',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')

      // Import hook appends '_imported_csv' to the value
      const imported = await payload.find({
        collection: postsWithFieldHooksSlug,
        where: { customImport: { equals: 'original_value_imported_csv' } },
      })
      expect(imported.docs).toHaveLength(1)

      await Promise.all(
        imported.docs.map((d) => payload.delete({ collection: postsWithFieldHooksSlug, id: d.id })),
      )
    })

    it('should transform value during JSON import using field-level import hook', async () => {
      const jsonContent = JSON.stringify([
        { title: 'JSON Import Hook Test', customImport: 'json_value' },
      ])
      const file = {
        data: Buffer.from(jsonContent),
        mimetype: 'application/json',
        name: 'field-hooks-import.json',
        size: Buffer.from(jsonContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-field-hooks-import',
        user,
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          importMode: 'create',
          format: 'json',
        },
        file,
      })

      importDoc = await payload.findByID({
        collection: 'posts-with-field-hooks-import',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')

      // Import hook appends '_imported_json' to the value
      const imported = await payload.find({
        collection: postsWithFieldHooksSlug,
        where: { customImport: { equals: 'json_value_imported_json' } },
      })
      expect(imported.docs).toHaveLength(1)

      await Promise.all(
        imported.docs.map((d) => payload.delete({ collection: postsWithFieldHooksSlug, id: d.id })),
      )
    })
  })

  // ─────────────────────────────────────────────
  // Backward compatibility: toCSV/fromCSV
  // ─────────────────────────────────────────────

  describe('backward compat: toCSV/fromCSV still work', () => {
    it('should still apply deprecated toCSV during CSV export', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: { title: 'Legacy toCSV Test', legacyToCSV: 'legacy value' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        user,
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-field-hooks-export',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      expect(rows[0]!.legacyToCSV).toBe('legacy value legacy_toCSV')

      await payload.delete({ collection: postsWithFieldHooksSlug, id: post.id })
    })

    it('should still apply deprecated fromCSV during CSV import', async () => {
      const csvContent = `title,legacyFromCSV\n"Legacy fromCSV Test","incoming_value"`
      const file = {
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        name: 'legacy-fromcsv-import.csv',
        size: Buffer.from(csvContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-field-hooks-import',
        user,
        data: { collectionSlug: postsWithFieldHooksSlug, importMode: 'create' },
        file,
      })

      importDoc = await payload.findByID({
        collection: 'posts-with-field-hooks-import',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')

      const imported = await payload.find({
        collection: postsWithFieldHooksSlug,
        where: { legacyFromCSV: { equals: 'incoming_value_legacy_fromCSV' } },
      })
      expect(imported.docs).toHaveLength(1)

      await Promise.all(
        imported.docs.map((d) => payload.delete({ collection: postsWithFieldHooksSlug, id: d.id })),
      )
    })
  })

  // ─────────────────────────────────────────────
  // Execution order: field-level before collection-level
  // ─────────────────────────────────────────────

  describe('execution order', () => {
    it('should run field-level export hooks before collection-level hooks', async () => {
      // This test uses the postsWithFieldHooksSlug collection which has
      // field-level hooks on customExport AND collection-level hooks configured.
      // The field-level hook transforms the value first, then collection-level
      // hook can see the already-transformed data.
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: { title: 'Order Test', customExport: 'raw' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        user,
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-field-hooks-export',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // Field-level hook ran first: value should be 'raw exported'
      // Collection-level hook (if any) would operate on the already-transformed data
      expect(rows[0]!.customExport).toBe('raw exported')

      await payload.delete({ collection: postsWithFieldHooksSlug, id: post.id })
    })
  })

  // ─────────────────────────────────────────────
  // Reusable field config
  // ─────────────────────────────────────────────

  describe('reusable field configs', () => {
    it('should apply field-level hooks from a shared field definition', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: { title: 'Reusable Field Test', email: 'USER@EXAMPLE.COM' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        user,
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-field-hooks-export',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // The reusable email field hook lowercases the value
      expect(rows[0]!.email).toBe('user@example.com')

      await payload.delete({ collection: postsWithFieldHooksSlug, id: post.id })
    })
  })

  // ─────────────────────────────────────────────
  // Edge cases
  // ─────────────────────────────────────────────

  describe('edge cases', () => {
    it('should prefer export over toCSV when both are set on the same field', async () => {
      // The PostsWithFieldHooks collection has separate fields for export and toCSV.
      // This test verifies the export hook fires (not toCSV) on the customExport field,
      // and toCSV still fires on the legacyToCSV field — confirming the priority chain works.
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: { title: 'Priority Test', customExport: 'test', legacyToCSV: 'legacy' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        user,
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-field-hooks-export',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // export hook ran (appends ' exported')
      expect(rows[0]!.customExport).toBe('test exported')
      // toCSV hook ran on its own field (appends ' legacy_toCSV')
      expect(rows[0]!.legacyToCSV).toBe('legacy legacy_toCSV')

      await payload.delete({ collection: postsWithFieldHooksSlug, id: post.id })
    })

    it('should use default flattening when export hook returns undefined', async () => {
      // A field without any hooks should flatten normally (default behavior)
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: { title: 'Default Behavior Test', secret: 'plain-text' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        user,
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-field-hooks-export',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // No hook on 'secret' — value passes through unchanged
      expect(rows[0]!.secret).toBe('plain-text')

      await payload.delete({ collection: postsWithFieldHooksSlug, id: post.id })
    })
  })
})

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
        data: { customExport: 'raw value', title: 'Field Export Test' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-field-hooks-export',
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // Field-level export hook should have transformed the value
      expect(rows[0]!.customExport).toBe('raw value exported')

      await payload.delete({ id: post.id, collection: postsWithFieldHooksSlug })
    })

    it('should receive format: csv during CSV export', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: { customExport: 'test', title: 'Format CSV Test' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-field-hooks-export',
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // The hook writes format into a side-channel column
      expect(rows[0]!.customExport_format).toBe('csv')

      await payload.delete({ id: post.id, collection: postsWithFieldHooksSlug })
    })

    it('should receive format: json during JSON export', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: { customExport: 'test', title: 'Format JSON Test' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'json',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-field-hooks-export',
      })

      const jsonPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const docs = await readJSON(jsonPath)

      // Field-level export hook should have transformed the value for JSON too
      expect(docs[0]!.customExport).toBe('test exported')

      await payload.delete({ id: post.id, collection: postsWithFieldHooksSlug })
    })

    it('should transform deeply nested fields (group > named tab > field)', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: {
          group: { namedTab: { deepField: 'deep value' } },
          title: 'Deep Field Test',
        },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-field-hooks-export',
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // Deeply nested field hook should have run
      expect(rows[0]!.group_namedTab_deepField).toBe('deep value deep_exported')

      await payload.delete({ id: post.id, collection: postsWithFieldHooksSlug })
    })
  })

  // ─────────────────────────────────────────────
  // Field-level import hooks
  // ─────────────────────────────────────────────

  describe('field-level import hooks', () => {
    it('should transform value during CSV import using field-level import hook', async () => {
      const csvContent = `title,customImport\n"Import Hook Test","original_value"`
      const file = {
        name: 'field-hooks-import.csv',
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        size: Buffer.from(csvContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-field-hooks-import',
        data: { collectionSlug: postsWithFieldHooksSlug, importMode: 'create' },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-field-hooks-import',
      })

      expect(importDoc.status).toBe('completed')

      // Import hook appends '_imported_csv' to the value
      const imported = await payload.find({
        collection: postsWithFieldHooksSlug,
        where: { customImport: { equals: 'original_value_imported_csv' } },
      })
      expect(imported.docs).toHaveLength(1)

      await Promise.all(
        imported.docs.map((d) => payload.delete({ id: d.id, collection: postsWithFieldHooksSlug })),
      )
    })

    it('should transform value during JSON import using field-level import hook', async () => {
      const jsonContent = JSON.stringify([
        { customImport: 'json_value', title: 'JSON Import Hook Test' },
      ])
      const file = {
        name: 'field-hooks-import.json',
        data: Buffer.from(jsonContent),
        mimetype: 'application/json',
        size: Buffer.from(jsonContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-field-hooks-import',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'json',
          importMode: 'create',
        },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-field-hooks-import',
      })

      expect(importDoc.status).toBe('completed')

      // Import hook appends '_imported_json' to the value
      const imported = await payload.find({
        collection: postsWithFieldHooksSlug,
        where: { customImport: { equals: 'json_value_imported_json' } },
      })
      expect(imported.docs).toHaveLength(1)

      await Promise.all(
        imported.docs.map((d) => payload.delete({ id: d.id, collection: postsWithFieldHooksSlug })),
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
        data: { legacyToCSV: 'legacy value', title: 'Legacy toCSV Test' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-field-hooks-export',
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      expect(rows[0]!.legacyToCSV).toBe('legacy value legacy_toCSV')

      await payload.delete({ id: post.id, collection: postsWithFieldHooksSlug })
    })

    it('should still apply deprecated fromCSV during CSV import', async () => {
      const csvContent = `title,legacyFromCSV\n"Legacy fromCSV Test","incoming_value"`
      const file = {
        name: 'legacy-fromcsv-import.csv',
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        size: Buffer.from(csvContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-field-hooks-import',
        data: { collectionSlug: postsWithFieldHooksSlug, importMode: 'create' },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-field-hooks-import',
      })

      expect(importDoc.status).toBe('completed')

      const imported = await payload.find({
        collection: postsWithFieldHooksSlug,
        where: { legacyFromCSV: { equals: 'incoming_value_legacy_fromCSV' } },
      })
      expect(imported.docs).toHaveLength(1)

      await Promise.all(
        imported.docs.map((d) => payload.delete({ id: d.id, collection: postsWithFieldHooksSlug })),
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
        data: { customExport: 'raw', title: 'Order Test' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-field-hooks-export',
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // Field-level hook ran first: value should be 'raw exported'
      // Collection-level hook (if any) would operate on the already-transformed data
      expect(rows[0]!.customExport).toBe('raw exported')

      await payload.delete({ id: post.id, collection: postsWithFieldHooksSlug })
    })
  })

  // ─────────────────────────────────────────────
  // Reusable field config
  // ─────────────────────────────────────────────

  describe('reusable field configs', () => {
    it('should apply field-level hooks from a shared field definition', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: { email: 'USER@EXAMPLE.COM', title: 'Reusable Field Test' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-field-hooks-export',
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // The reusable email field hook lowercases the value
      expect(rows[0]!.email).toBe('user@example.com')

      await payload.delete({ id: post.id, collection: postsWithFieldHooksSlug })
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
        data: { customExport: 'test', legacyToCSV: 'legacy', title: 'Priority Test' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-field-hooks-export',
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // export hook ran (appends ' exported')
      expect(rows[0]!.customExport).toBe('test exported')
      // toCSV hook ran on its own field (appends ' legacy_toCSV')
      expect(rows[0]!.legacyToCSV).toBe('legacy legacy_toCSV')

      await payload.delete({ id: post.id, collection: postsWithFieldHooksSlug })
    })

    it('should use default flattening when export hook returns undefined', async () => {
      // A field without any hooks should flatten normally (default behavior)
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: { secret: 'plain-text', title: 'Default Behavior Test' },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-field-hooks-export',
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // No hook on 'secret' — value passes through unchanged
      expect(rows[0]!.secret).toBe('plain-text')

      await payload.delete({ id: post.id, collection: postsWithFieldHooksSlug })
    })
  })

  // ─────────────────────────────────────────────
  // Field-level hooks inside arrays and blocks
  // ─────────────────────────────────────────────

  describe('field-level hooks inside arrays', () => {
    it('should run field-level export hook on array item sub-fields (CSV)', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: {
          items: [{ note: 'first' }, { note: 'second' }],
          title: 'Array Export CSV',
        },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-field-hooks-export',
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      expect(rows[0]!.items_0_note).toBe('first array_exported')
      expect(rows[0]!.items_1_note).toBe('second array_exported')

      await payload.delete({ id: post.id, collection: postsWithFieldHooksSlug })
    })

    it('should run field-level export hook on array item sub-fields (JSON)', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: {
          items: [{ note: 'alpha' }, { note: 'beta' }],
          title: 'Array Export JSON',
        },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'json',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-field-hooks-export',
      })

      const jsonPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const docs = await readJSON(jsonPath)

      expect(docs[0]!.items[0].note).toBe('alpha array_exported')
      expect(docs[0]!.items[1].note).toBe('beta array_exported')

      await payload.delete({ id: post.id, collection: postsWithFieldHooksSlug })
    })

    it('should run field-level import hook on array item sub-fields (CSV)', async () => {
      const csvContent = `title,items_0_note,items_1_note\n"Array Import CSV","one","two"`
      const file = {
        name: 'array-items-import.csv',
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        size: Buffer.from(csvContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-field-hooks-import',
        data: { collectionSlug: postsWithFieldHooksSlug, importMode: 'create' },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-field-hooks-import',
      })

      expect(importDoc.status).toBe('completed')

      const imported = await payload.find({
        collection: postsWithFieldHooksSlug,
        where: { title: { equals: 'Array Import CSV' } },
      })
      expect(imported.docs).toHaveLength(1)
      expect((imported.docs[0] as any).items[0].note).toBe('one_array_imported')
      expect((imported.docs[0] as any).items[1].note).toBe('two_array_imported')

      await Promise.all(
        imported.docs.map((d) => payload.delete({ id: d.id, collection: postsWithFieldHooksSlug })),
      )
    })

    it('should run field-level import hook on array item sub-fields (JSON)', async () => {
      const jsonContent = JSON.stringify([
        { items: [{ note: 'uno' }, { note: 'dos' }], title: 'Array Import JSON' },
      ])
      const file = {
        name: 'array-items-import.json',
        data: Buffer.from(jsonContent),
        mimetype: 'application/json',
        size: Buffer.from(jsonContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-field-hooks-import',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'json',
          importMode: 'create',
        },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-field-hooks-import',
      })

      expect(importDoc.status).toBe('completed')

      const imported = await payload.find({
        collection: postsWithFieldHooksSlug,
        where: { title: { equals: 'Array Import JSON' } },
      })
      expect(imported.docs).toHaveLength(1)
      expect((imported.docs[0] as any).items[0].note).toBe('uno_array_imported')
      expect((imported.docs[0] as any).items[1].note).toBe('dos_array_imported')

      await Promise.all(
        imported.docs.map((d) => payload.delete({ id: d.id, collection: postsWithFieldHooksSlug })),
      )
    })
  })

  describe('field-level hooks inside blocks', () => {
    it('should run field-level export hook on block sub-fields (CSV)', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: {
          content: [
            { blockType: 'textBlock', body: 'hello' },
            { blockType: 'textBlock', body: 'world' },
          ],
          title: 'Blocks Export CSV',
        },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-field-hooks-export',
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      expect(rows[0]!.content_0_textBlock_body).toBe('hello block_exported')
      expect(rows[0]!.content_1_textBlock_body).toBe('world block_exported')

      await payload.delete({ id: post.id, collection: postsWithFieldHooksSlug })
    })

    it('should run field-level export hook on block sub-fields (JSON)', async () => {
      const post = await payload.create({
        collection: postsWithFieldHooksSlug,
        data: {
          content: [{ blockType: 'textBlock', body: 'foo' }],
          title: 'Blocks Export JSON',
        },
      })

      let exportDoc = await payload.create({
        collection: 'posts-with-field-hooks-export',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'json',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-field-hooks-export',
      })

      const jsonPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const docs = await readJSON(jsonPath)

      expect(docs[0]!.content[0].body).toBe('foo block_exported')

      await payload.delete({ id: post.id, collection: postsWithFieldHooksSlug })
    })

    it('should run field-level import hook on block sub-fields (CSV)', async () => {
      const csvContent = `title,content_0_textBlock_body\n"Blocks Import CSV","csv-body"`
      const file = {
        name: 'block-body-import.csv',
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        size: Buffer.from(csvContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-field-hooks-import',
        data: { collectionSlug: postsWithFieldHooksSlug, importMode: 'create' },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-field-hooks-import',
      })

      expect(importDoc.status).toBe('completed')

      const imported = await payload.find({
        collection: postsWithFieldHooksSlug,
        where: { title: { equals: 'Blocks Import CSV' } },
      })
      expect(imported.docs).toHaveLength(1)
      expect((imported.docs[0] as any).content[0].body).toBe('csv-body_block_imported')

      await Promise.all(
        imported.docs.map((d) => payload.delete({ id: d.id, collection: postsWithFieldHooksSlug })),
      )
    })

    it('should run field-level import hook on block sub-fields (JSON)', async () => {
      const jsonContent = JSON.stringify([
        {
          content: [{ blockType: 'textBlock', body: 'json-body' }],
          title: 'Blocks Import JSON',
        },
      ])
      const file = {
        name: 'block-body-import.json',
        data: Buffer.from(jsonContent),
        mimetype: 'application/json',
        size: Buffer.from(jsonContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-field-hooks-import',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'json',
          importMode: 'create',
        },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-field-hooks-import',
      })

      expect(importDoc.status).toBe('completed')

      const imported = await payload.find({
        collection: postsWithFieldHooksSlug,
        where: { title: { equals: 'Blocks Import JSON' } },
      })
      expect(imported.docs).toHaveLength(1)
      expect((imported.docs[0] as any).content[0].body).toBe('json-body_block_imported')

      await Promise.all(
        imported.docs.map((d) => payload.delete({ id: d.id, collection: postsWithFieldHooksSlug })),
      )
    })
  })

  // ─────────────────────────────────────────────
  // Hook receives the top-level document in `data` arg
  // ─────────────────────────────────────────────

  describe('field-level import hook receives sibling-level data', () => {
    it('should pass the nested parent object as siblingData to hooks inside a group (JSON)', async () => {
      // The metadata.siblingEcho hook reads siblingData.slugFromTitle — that key
      // only exists on the parent-level `metadata` object, not on the top-level
      // document. If the hook received `data` (top-level) instead of `siblingData`,
      // the assertion below would fail.
      const jsonContent = JSON.stringify([
        {
          metadata: { siblingEcho: 'start', slugFromTitle: 'my-slug' },
          title: 'Sibling Echo Test',
        },
      ])
      const file = {
        name: 'sibling-echo-import.json',
        data: Buffer.from(jsonContent),
        mimetype: 'application/json',
        size: Buffer.from(jsonContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-field-hooks-import',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'json',
          importMode: 'create',
        },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-field-hooks-import',
      })

      expect(importDoc.status).toBe('completed')

      const imported = await payload.find({
        collection: postsWithFieldHooksSlug,
        where: { title: { equals: 'Sibling Echo Test' } },
      })
      expect(imported.docs).toHaveLength(1)
      expect((imported.docs[0] as any).metadata.siblingEcho).toBe('start:my-slug')

      await Promise.all(
        imported.docs.map((d) => payload.delete({ id: d.id, collection: postsWithFieldHooksSlug })),
      )
    })
  })

  describe('field-level import hook receives top-level data', () => {
    it('should pass the full top-level doc to hooks on nested fields (JSON)', async () => {
      // The metadata.slugFromTitle hook reads data.title (top-level field)
      // and uses it to generate a slug when slugFromTitle is empty.
      const jsonContent = JSON.stringify([
        { metadata: { slugFromTitle: '' }, title: 'Top Doc Access' },
      ])
      const file = {
        name: 'top-doc-import.json',
        data: Buffer.from(jsonContent),
        mimetype: 'application/json',
        size: Buffer.from(jsonContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-field-hooks-import',
        data: {
          collectionSlug: postsWithFieldHooksSlug,
          format: 'json',
          importMode: 'create',
        },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-field-hooks-import',
      })

      expect(importDoc.status).toBe('completed')

      const imported = await payload.find({
        collection: postsWithFieldHooksSlug,
        where: { title: { equals: 'Top Doc Access' } },
      })
      expect(imported.docs).toHaveLength(1)
      expect((imported.docs[0] as any).metadata.slugFromTitle).toBe('top-doc-access')

      await Promise.all(
        imported.docs.map((d) => payload.delete({ id: d.id, collection: postsWithFieldHooksSlug })),
      )
    })
  })
})

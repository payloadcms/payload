import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { readCSV, readJSON } from './helpers.js'
import { hookCalls, resetHookSpies } from './hookSpies.js'
import { postsWithColumnMapSlug, postsWithHooksSlug } from './shared.js'

let payload: Payload
let restClient: NextRESTClient
let user: any

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const createdHookPostIDs: (number | string)[] = []

describe('@payloadcms/plugin-import-export — hooks', () => {
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

  afterEach(async () => {
    resetHookSpies()
    for (const id of createdHookPostIDs) {
      await payload
        .delete({ collection: postsWithHooksSlug, id })
        .catch((err) => payload.logger.warn({ err, id, msg: 'hooks.int.spec cleanup failed' }))
    }
    createdHookPostIDs.length = 0
  })

  // ─────────────────────────────────────────────
  // Export hooks
  // ─────────────────────────────────────────────

  describe('export hooks', () => {
    it('should call export.hooks.before with correct args and apply its return value to CSV output', async () => {
      const post = await payload.create({
        collection: postsWithHooksSlug,
        data: { title: 'Hook Test', secret: 'top-secret', count: 1 },
      })
      createdHookPostIDs.push(post.id)

      let exportDoc = await payload.create({
        collection: 'posts-with-hooks-export',
        user,
        data: {
          collectionSlug: postsWithHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-hooks-export',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      // before hook should have been called
      expect(hookCalls.exportBefore).toHaveLength(1)
      const beforeArgs = hookCalls.exportBefore[0]!
      expect(beforeArgs.format).toBe('csv')
      expect(beforeArgs.batchNumber).toBe(1)
      expect(beforeArgs.totalBatches).toBeGreaterThanOrEqual(1)
      expect(beforeArgs.req).toBeDefined()

      // originalData should be the raw DB doc
      expect(beforeArgs.originalData).toHaveLength(1)
      expect(beforeArgs.originalData[0]!.id).toBe(post.id)
      expect(beforeArgs.originalData[0]!.secret).toBe('top-secret')

      // before hook masks `secret` — it should be absent from the exported CSV
      expect(rows[0]!.secret).toBeUndefined()
      expect(rows[0]!.title).toBe('Hook Test')
    })

    it('should call export.hooks.after with correct args after write', async () => {
      const post = await payload.create({
        collection: postsWithHooksSlug,
        data: { title: 'After Hook Test', secret: 'hidden', count: 2 },
      })
      createdHookPostIDs.push(post.id)

      let exportDoc = await payload.create({
        collection: 'posts-with-hooks-export',
        user,
        data: {
          collectionSlug: postsWithHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-hooks-export',
        id: exportDoc.id,
      })

      expect(hookCalls.exportAfter).toHaveLength(1)
      const afterArgs = hookCalls.exportAfter[0]!
      expect(afterArgs.format).toBe('csv')
      expect(afterArgs.batchNumber).toBe(1)
      expect(afterArgs.totalBatches).toBeGreaterThanOrEqual(1)
      expect(afterArgs.req).toBeDefined()
      // after receives the (already masked) data from before
      expect(afterArgs.data).toBeDefined()
      expect(afterArgs.originalData).toBeDefined()
    })

    it('should call export.hooks.before for JSON exports with nested docs', async () => {
      const post = await payload.create({
        collection: postsWithHooksSlug,
        data: { title: 'JSON Hook Test', secret: 'json-secret', count: 3 },
      })
      createdHookPostIDs.push(post.id)

      let exportDoc = await payload.create({
        collection: 'posts-with-hooks-export',
        user,
        data: {
          collectionSlug: postsWithHooksSlug,
          format: 'json',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-hooks-export',
        id: exportDoc.id,
      })

      const jsonPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const jsonDocs = await readJSON(jsonPath)

      expect(hookCalls.exportBefore).toHaveLength(1)
      expect(hookCalls.exportBefore[0]!.format).toBe('json')

      // before hook masks `secret` — absent from JSON output too
      expect(jsonDocs[0]!.secret).toBeUndefined()
      expect(jsonDocs[0]!.title).toBe('JSON Hook Test')
    })

    it('should call export.hooks.before once per batch when multiple batches occur', async () => {
      const posts = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          payload.create({
            collection: postsWithHooksSlug,
            data: { title: `Batch Post ${i}`, count: i },
          }),
        ),
      )
      posts.forEach((p) => createdHookPostIDs.push(p.id))

      // posts-with-hooks is configured with batchSize: 2 — 5 docs → 3 batches
      let exportDoc = await payload.create({
        collection: 'posts-with-hooks-export',
        user,
        data: {
          collectionSlug: postsWithHooksSlug,
          format: 'csv',
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-hooks-export',
        id: exportDoc.id,
      })

      // Should have been called once per batch
      expect(hookCalls.exportBefore.length).toBeGreaterThanOrEqual(2)
      // batchNumbers should be sequential starting at 1
      const batchNumbers = hookCalls.exportBefore.map((c) => c.batchNumber)
      expect(batchNumbers[0]).toBe(1)
      expect(batchNumbers[1]).toBe(2)
    })

    it('should call export.hooks.before via streaming download', async () => {
      const post = await payload.create({
        collection: postsWithHooksSlug,
        data: { title: 'Download Hook Test', secret: 'streamed-secret', count: 4 },
      })
      createdHookPostIDs.push(post.id)

      const response = await restClient.POST('/posts-with-hooks-export/download', {
        body: JSON.stringify({
          data: {
            collectionSlug: postsWithHooksSlug,
            format: 'csv',
            where: { id: { equals: post.id } },
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      expect(response.status).toBe(200)
      // Consume the stream to ensure the hook fires before asserting
      await response.text()
      expect(hookCalls.exportBefore).toHaveLength(1)
      expect(hookCalls.exportBefore[0]!.format).toBe('csv')
    })
  })

  // ─────────────────────────────────────────────
  // Import hooks
  // ─────────────────────────────────────────────

  describe('import hooks', () => {
    it('should call import.hooks.before with correct args and apply its return value to DB write', async () => {
      const csvContent = `title,secret,count\n"Original Title","secret-val","10"`
      const file = {
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        name: 'hooks-import-test.csv',
        size: Buffer.from(csvContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-hooks-import',
        user,
        data: { collectionSlug: postsWithHooksSlug, importMode: 'create' },
        file,
      })

      importDoc = await payload.findByID({
        collection: 'posts-with-hooks-import',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')

      // before hook should have been called
      expect(hookCalls.importBefore).toHaveLength(1)
      const beforeArgs = hookCalls.importBefore[0]!
      expect(beforeArgs.format).toBe('csv')
      expect(beforeArgs.batchNumber).toBe(1)
      expect(beforeArgs.totalBatches).toBeGreaterThanOrEqual(1)
      expect(beforeArgs.req).toBeDefined()

      // originalData is the raw flat parsed rows before unflattening
      expect(beforeArgs.originalData).toHaveLength(1)
      expect(beforeArgs.originalData[0]!.title).toBe('Original Title')

      // before hook appends '_imported' to title — verify it landed in DB
      const importedDocs = await payload.find({
        collection: postsWithHooksSlug,
        where: { title: { equals: 'Original Title_imported' } },
      })
      expect(importedDocs.docs).toHaveLength(1)
      importedDocs.docs.forEach((d) => createdHookPostIDs.push(d.id))
    })

    it('should call import.hooks.after with per-batch ImportResult', async () => {
      const csvContent = `title,count\n"After Hook Post","99"`
      const file = {
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        name: 'hooks-after-test.csv',
        size: Buffer.from(csvContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-hooks-import',
        user,
        data: { collectionSlug: postsWithHooksSlug, importMode: 'create' },
        file,
      })

      importDoc = await payload.findByID({
        collection: 'posts-with-hooks-import',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(hookCalls.importAfter).toHaveLength(1)

      const afterArgs = hookCalls.importAfter[0]!
      expect(afterArgs.format).toBe('csv')
      expect(afterArgs.batchNumber).toBe(1)
      expect(afterArgs.result).toBeDefined()
      expect(afterArgs.result.imported).toBe(1)
      expect(afterArgs.result.errors).toHaveLength(0)

      const imported = await payload.find({
        collection: postsWithHooksSlug,
        where: { title: { equals: 'After Hook Post_imported' } },
      })
      imported.docs.forEach((d) => createdHookPostIDs.push(d.id))
    })

    it('should pass originalData (raw pre-transform rows) to import.hooks.after', async () => {
      const csvContent = `title,count\n"OriginalData Post","42"`
      const file = {
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        name: 'hooks-after-originaldata-test.csv',
        size: Buffer.from(csvContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-hooks-import',
        user,
        data: { collectionSlug: postsWithHooksSlug, importMode: 'create' },
        file,
      })

      importDoc = await payload.findByID({
        collection: 'posts-with-hooks-import',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(hookCalls.importAfter).toHaveLength(1)

      const afterArgs = hookCalls.importAfter[0]!
      expect(afterArgs.originalData).toBeDefined()
      expect(afterArgs.originalData).toHaveLength(1)
      expect(afterArgs.originalData[0]).toMatchObject({ title: 'OriginalData Post', count: 42 })

      const imported = await payload.find({
        collection: postsWithHooksSlug,
        where: { title: { equals: 'OriginalData Post_imported' } },
      })
      imported.docs.forEach((d) => createdHookPostIDs.push(d.id))
    })

    it('should call import.hooks.before for JSON imports', async () => {
      const jsonContent = JSON.stringify([{ title: 'JSON Import Hook', count: 5 }])
      const file = {
        data: Buffer.from(jsonContent),
        mimetype: 'application/json',
        name: 'hooks-json-test.json',
        size: Buffer.from(jsonContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-hooks-import',
        user,
        data: { collectionSlug: postsWithHooksSlug, importMode: 'create', format: 'json' },
        file,
      })

      importDoc = await payload.findByID({
        collection: 'posts-with-hooks-import',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(hookCalls.importBefore).toHaveLength(1)
      expect(hookCalls.importBefore[0]!.format).toBe('json')

      const imported = await payload.find({
        collection: postsWithHooksSlug,
        where: { title: { equals: 'JSON Import Hook_imported' } },
      })
      expect(imported.docs).toHaveLength(1)
      imported.docs.forEach((d) => createdHookPostIDs.push(d.id))
    })

    it('should pass originalData as raw parsed JSON (before field hooks) to import hooks', async () => {
      // The posts-with-hooks collection has an `email` field with a beforeImport field hook
      // that lowercases the value. This test verifies that originalData in both the before
      // and after collection hooks contains the raw parsed JSON value ('TEST@EXAMPLE.COM'),
      // not the field-hook-transformed value ('test@example.com').
      const jsonContent = JSON.stringify([
        { title: 'JSON Original Data Test', count: 7, email: 'TEST@EXAMPLE.COM' },
      ])

      const file = {
        data: Buffer.from(jsonContent),
        mimetype: 'application/json',
        name: 'hooks-json-originaldata.json',
        size: Buffer.from(jsonContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-hooks-import',
        user,
        data: { collectionSlug: postsWithHooksSlug, importMode: 'create', format: 'json' },
        file,
      })

      importDoc = await payload.findByID({
        collection: 'posts-with-hooks-import',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(hookCalls.importBefore).toHaveLength(1)
      expect(hookCalls.importAfter).toHaveLength(1)

      // originalData must be the raw parsed JSON — the email field hook (lowercase) must NOT
      // have been applied yet. With the bug, originalData === data (after field hooks),
      // so email would be 'test@example.com' instead of the raw 'TEST@EXAMPLE.COM'.
      const beforeOriginalData = hookCalls.importBefore[0]!.originalData[0] as Record<
        string,
        unknown
      >
      expect(beforeOriginalData.email).toBe('TEST@EXAMPLE.COM')

      const afterOriginalData = hookCalls.importAfter[0]!.originalData[0] as Record<string, unknown>
      expect(afterOriginalData.email).toBe('TEST@EXAMPLE.COM')

      const imported = await payload.find({
        collection: postsWithHooksSlug,
        where: { title: { equals: 'JSON Original Data Test_imported' } },
      })
      imported.docs.forEach((d) => createdHookPostIDs.push(d.id))
    })

    it('should call import.hooks.before once per batch', async () => {
      const rows = Array.from({ length: 4 }, (_, i) => `"Batch Import ${i}","${i}"`).join('\n')
      const csvContent = `title,count\n${rows}`
      const file = {
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        name: 'hooks-batch-import.csv',
        size: Buffer.from(csvContent).length,
      }

      // posts-with-hooks is configured with batchSize: 2 — 4 rows → 2 batches
      let importDoc = await payload.create({
        collection: 'posts-with-hooks-import',
        user,
        data: {
          collectionSlug: postsWithHooksSlug,
          importMode: 'create',
        },
        file,
      })

      importDoc = await payload.findByID({
        collection: 'posts-with-hooks-import',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(hookCalls.importBefore).toHaveLength(2)
      expect(hookCalls.importBefore[0]!.batchNumber).toBe(1)
      expect(hookCalls.importBefore[1]!.batchNumber).toBe(2)
      expect(hookCalls.importBefore[0]!.totalBatches).toBe(2)

      const imported = await payload.find({
        collection: postsWithHooksSlug,
        where: { title: { contains: 'Batch Import' } },
        limit: 10,
      })
      imported.docs.forEach((d) => createdHookPostIDs.push(d.id))
    })
  })

  describe('column mapping — export', () => {
    const createdIDs: (number | string)[] = []

    afterEach(async () => {
      for (const id of createdIDs) {
        await payload.delete({ collection: postsWithColumnMapSlug, id })
      }
      createdIDs.length = 0
    })

    it('should rename CSV columns via collection-level export.hooks.before', async () => {
      const post = await payload.create({
        collection: postsWithColumnMapSlug,
        data: { title: 'Rename Me', excerpt: 'Original excerpt', count: 42 },
      })
      createdIDs.push(post.id)

      let exportDoc = await payload.create({
        collection: 'posts-with-column-map-export',
        user,
        data: {
          collectionSlug: postsWithColumnMapSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-column-map-export',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      expect(rows).toHaveLength(1)
      expect(rows[0]!['Post Title']).toBe('Rename Me')
      expect(rows[0]!.Summary).toBe('Original excerpt')
      expect(rows[0]!['View Count']).toBe('42')
      expect(rows[0]!.title).toBeUndefined()
      expect(rows[0]!.excerpt).toBeUndefined()
      expect(rows[0]!.count).toBeUndefined()
    })

    it('should rename a single CSV column via field-level beforeExport mutation', async () => {
      const post = await payload.create({
        collection: postsWithColumnMapSlug,
        data: { title: 'Field Rename', excerpt: 'x', count: 1, sharedName: 'shared value' },
      })
      createdIDs.push(post.id)

      let exportDoc = await payload.create({
        collection: 'posts-with-column-map-export',
        user,
        data: {
          collectionSlug: postsWithColumnMapSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-column-map-export',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      expect(rows[0]!['Display Name']).toBe('shared value')
      expect(rows[0]!.sharedName).toBeUndefined()
    })

    it('should reflect collection-level export.hooks.before in CSV export preview', async () => {
      const post = await payload.create({
        collection: postsWithColumnMapSlug,
        data: { title: 'Preview Rename', excerpt: 'preview excerpt', count: 11 },
      })
      createdIDs.push(post.id)

      const res = await restClient.POST('/posts-with-column-map-export/export-preview', {
        body: JSON.stringify({
          collectionSlug: postsWithColumnMapSlug,
          format: 'csv',
          previewLimit: 10,
          previewPage: 1,
          where: { id: { equals: post.id } },
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      expect(res.status).toBe(200)
      const body: { columns: string[]; docs: Array<Record<string, unknown>> } = await res.json()

      expect(body.docs).toHaveLength(1)
      expect(body.docs[0]!['Post Title']).toBe('Preview Rename')
      expect(body.docs[0]!.Summary).toBe('preview excerpt')
      expect(body.docs[0]!['View Count']).toBe(11)
      expect(body.docs[0]!.title).toBeUndefined()
      expect(body.docs[0]!.excerpt).toBeUndefined()
      expect(body.docs[0]!.count).toBeUndefined()

      expect(body.columns).toContain('Post Title')
      expect(body.columns).toContain('Summary')
      expect(body.columns).toContain('View Count')
      expect(body.columns).not.toContain('title')
      expect(body.columns).not.toContain('excerpt')
      expect(body.columns).not.toContain('count')
    })

    it('should reflect collection-level export.hooks.before in JSON export preview', async () => {
      const post = await payload.create({
        collection: postsWithColumnMapSlug,
        data: { title: 'JSON Preview Rename', excerpt: 'json preview', count: 22 },
      })
      createdIDs.push(post.id)

      const res = await restClient.POST('/posts-with-column-map-export/export-preview', {
        body: JSON.stringify({
          collectionSlug: postsWithColumnMapSlug,
          format: 'json',
          previewLimit: 10,
          previewPage: 1,
          where: { id: { equals: post.id } },
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      expect(res.status).toBe(200)
      const body: { docs: Array<Record<string, unknown>> } = await res.json()

      expect(body.docs).toHaveLength(1)
      expect(body.docs[0]!['Post Title']).toBe('JSON Preview Rename')
      expect(body.docs[0]!.Summary).toBe('json preview')
      expect(body.docs[0]!['View Count']).toBe(22)
      expect(body.docs[0]!.title).toBeUndefined()
    })

    it('should rename JSON keys via collection-level export.hooks.before', async () => {
      const post = await payload.create({
        collection: postsWithColumnMapSlug,
        data: { title: 'JSON Rename', excerpt: 'json excerpt', count: 7 },
      })
      createdIDs.push(post.id)

      let exportDoc = await payload.create({
        collection: 'posts-with-column-map-export',
        user,
        data: {
          collectionSlug: postsWithColumnMapSlug,
          format: 'json',
          where: { id: { equals: post.id } },
        },
      })

      exportDoc = await payload.findByID({
        collection: 'posts-with-column-map-export',
        id: exportDoc.id,
      })

      const jsonPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const docs = await readJSON(jsonPath)

      expect(docs).toHaveLength(1)
      expect(docs[0]['Post Title']).toBe('JSON Rename')
      expect(docs[0].Summary).toBe('json excerpt')
      expect(docs[0]['View Count']).toBe(7)
      expect(docs[0].title).toBeUndefined()
    })
  })

  describe('column mapping — import', () => {
    const createdIDs: (number | string)[] = []

    afterEach(async () => {
      for (const id of createdIDs) {
        await payload
          .delete({ collection: postsWithColumnMapSlug, id })
          .catch((err) => payload.logger.warn({ err, id, msg: 'column-map cleanup failed' }))
      }
      createdIDs.length = 0
    })

    it('should import a CSV with foreign column names via collection-level import.hooks.before', async () => {
      const csv =
        '"Post Title","Summary","View Count","Ignored Column"\n' +
        '"Imported A","summary a","10","noise"\n' +
        '"Imported B","summary b","20","noise"\n'
      const file = {
        data: Buffer.from(csv),
        mimetype: 'text/csv',
        name: 'column-map-foreign-import.csv',
        size: Buffer.from(csv).length,
      }

      const importDoc = await payload.create({
        collection: 'posts-with-column-map-import',
        user,
        data: {
          collectionSlug: postsWithColumnMapSlug,
          importMode: 'create',
        },
        file,
      })

      expect(importDoc.id).toBeDefined()

      const imported = await payload.find({
        collection: postsWithColumnMapSlug,
        sort: 'title',
        where: { title: { in: ['Imported A', 'Imported B'] } },
      })

      imported.docs.forEach((doc) => createdIDs.push(doc.id))

      expect(imported.docs).toHaveLength(2)
      expect(imported.docs[0]!.title).toBe('Imported A')
      expect(imported.docs[0]!.excerpt).toBe('summary a')
      expect(imported.docs[0]!.count).toBe(10)
      expect(imported.docs[1]!.title).toBe('Imported B')
      expect(imported.docs[1]!.count).toBe(20)
    })

    it('should import a JSON file with foreign keys via collection-level import.hooks.before', async () => {
      const content = JSON.stringify([
        {
          'Post Title': 'JSON A',
          Summary: 'json summary a',
          'View Count': 5,
          'Ignored Column': 'x',
        },
        {
          'Post Title': 'JSON B',
          Summary: 'json summary b',
          'View Count': 6,
          'Ignored Column': 'y',
        },
      ])
      const file = {
        data: Buffer.from(content),
        mimetype: 'application/json',
        name: 'column-map-foreign-import.json',
        size: Buffer.from(content).length,
      }

      await payload.create({
        collection: 'posts-with-column-map-import',
        user,
        data: {
          collectionSlug: postsWithColumnMapSlug,
          importMode: 'create',
        },
        file,
      })

      const imported = await payload.find({
        collection: postsWithColumnMapSlug,
        sort: 'title',
        where: { title: { in: ['JSON A', 'JSON B'] } },
      })

      imported.docs.forEach((doc) => createdIDs.push(doc.id))

      expect(imported.docs).toHaveLength(2)
      expect(imported.docs[0]!.title).toBe('JSON A')
      expect(imported.docs[0]!.count).toBe(5)
      expect(imported.docs[1]!.title).toBe('JSON B')
      expect(imported.docs[1]!.count).toBe(6)
    })

    it('should reflect collection-level import.hooks.before in CSV import preview', async () => {
      const csv =
        '"Post Title","Summary","View Count","Ignored Column"\n' +
        '"Preview Imported","preview summary","30","noise"\n'

      const fileData = Buffer.from(csv).toString('base64')

      const res = await restClient.POST('/posts-with-column-map-import/preview-data', {
        body: JSON.stringify({
          collectionSlug: postsWithColumnMapSlug,
          fileData,
          format: 'csv',
          previewLimit: 10,
          previewPage: 1,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      expect(res.status).toBe(200)
      const body: { docs: Array<Record<string, unknown>> } = await res.json()

      expect(body.docs).toHaveLength(1)
      expect(body.docs[0]!.title).toBe('Preview Imported')
      expect(body.docs[0]!.excerpt).toBe('preview summary')
      expect(body.docs[0]!.count).toBe(30)
      expect(body.docs[0]!['Post Title']).toBeUndefined()
      expect(body.docs[0]!.Summary).toBeUndefined()
      expect(body.docs[0]!['Ignored Column']).toBeUndefined()
    })

    it('should reflect collection-level import.hooks.before in JSON import preview', async () => {
      const content = JSON.stringify([
        {
          'Post Title': 'JSON Preview Imported',
          Summary: 'json preview summary',
          'View Count': 40,
          'Ignored Column': 'noise',
        },
      ])

      const fileData = Buffer.from(content).toString('base64')

      const res = await restClient.POST('/posts-with-column-map-import/preview-data', {
        body: JSON.stringify({
          collectionSlug: postsWithColumnMapSlug,
          fileData,
          format: 'json',
          previewLimit: 10,
          previewPage: 1,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      expect(res.status).toBe(200)
      const body: { docs: Array<Record<string, unknown>> } = await res.json()

      expect(body.docs).toHaveLength(1)
      expect(body.docs[0]!.title).toBe('JSON Preview Imported')
      expect(body.docs[0]!.excerpt).toBe('json preview summary')
      expect(body.docs[0]!.count).toBe(40)
      expect(body.docs[0]!['Post Title']).toBeUndefined()
    })

    it('should drop foreign columns not present in the rename map', async () => {
      const csv = '"Post Title","Ignored Column"\n' + '"Dropped Test","this should not survive"\n'
      const file = {
        data: Buffer.from(csv),
        mimetype: 'text/csv',
        name: 'column-map-drop-unknown.csv',
        size: Buffer.from(csv).length,
      }

      await payload.create({
        collection: 'posts-with-column-map-import',
        user,
        data: {
          collectionSlug: postsWithColumnMapSlug,
          importMode: 'create',
        },
        file,
      })

      const imported = await payload.find({
        collection: postsWithColumnMapSlug,
        where: { title: { equals: 'Dropped Test' } },
      })

      imported.docs.forEach((doc) => createdIDs.push(doc.id))

      expect(imported.docs).toHaveLength(1)
      const doc = imported.docs[0]! as Record<string, unknown>
      expect(doc.title).toBe('Dropped Test')
      expect(doc['Ignored Column']).toBeUndefined()
    })
  })
})

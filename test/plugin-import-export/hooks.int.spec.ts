import type { AuthenticatedUser, Payload, Where } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { readCSV, readJSON } from './helpers.js'
import { hookCalls, resetHookSpies } from './hookSpies.js'
import {
  batchRefFieldName,
  postsWithColumnMapSlug,
  postsWithHooksExportSlug,
  postsWithHooksImportSlug,
  postsWithHooksJobsExportSlug,
  postsWithHooksJobsImportSlug,
  postsWithHooksJobsSlug,
  postsWithHooksSlug,
} from './shared.js'

let payload: Payload
let restClient: NextRESTClient
let user: AuthenticatedUser

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const createdHookPostIDs: (number | string)[] = []

describe('@payloadcms/plugin-import-export — hooks', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
    const loginResult = await payload.login({
      collection: 'users',
      data: { email: devUser.email, password: devUser.password },
    })

    user = loginResult.user!
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    resetHookSpies()
    for (const id of createdHookPostIDs) {
      await payload
        .delete({ id, collection: postsWithHooksSlug })
        .catch((err) => payload.logger.warn({ id, err, msg: 'hooks.int.spec cleanup failed' }))
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
        data: { count: 1, secret: 'top-secret', title: 'Hook Test' },
      })
      createdHookPostIDs.push(post.id)

      let exportDoc = await payload.create({
        collection: 'posts-with-hooks-export',
        data: {
          collectionSlug: postsWithHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-hooks-export',
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
        data: { count: 2, secret: 'hidden', title: 'After Hook Test' },
      })
      createdHookPostIDs.push(post.id)

      let exportDoc = await payload.create({
        collection: 'posts-with-hooks-export',
        data: {
          collectionSlug: postsWithHooksSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-hooks-export',
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
        data: { count: 3, secret: 'json-secret', title: 'JSON Hook Test' },
      })
      createdHookPostIDs.push(post.id)

      let exportDoc = await payload.create({
        collection: 'posts-with-hooks-export',
        data: {
          collectionSlug: postsWithHooksSlug,
          format: 'json',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-hooks-export',
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
            data: { count: i, title: `Batch Post ${i}` },
          }),
        ),
      )
      posts.forEach((p) => createdHookPostIDs.push(p.id))

      // posts-with-hooks is configured with batchSize: 2 — 5 docs → 3 batches
      let exportDoc = await payload.create({
        collection: 'posts-with-hooks-export',
        data: {
          collectionSlug: postsWithHooksSlug,
          format: 'csv',
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-hooks-export',
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
        data: { count: 4, secret: 'streamed-secret', title: 'Download Hook Test' },
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
        name: 'hooks-import-test.csv',
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        size: Buffer.from(csvContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-hooks-import',
        data: { collectionSlug: postsWithHooksSlug, importMode: 'create' },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-hooks-import',
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
        name: 'hooks-after-test.csv',
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        size: Buffer.from(csvContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-hooks-import',
        data: { collectionSlug: postsWithHooksSlug, importMode: 'create' },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-hooks-import',
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
        name: 'hooks-after-originaldata-test.csv',
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        size: Buffer.from(csvContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-hooks-import',
        data: { collectionSlug: postsWithHooksSlug, importMode: 'create' },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-hooks-import',
      })

      expect(importDoc.status).toBe('completed')
      expect(hookCalls.importAfter).toHaveLength(1)

      const afterArgs = hookCalls.importAfter[0]!
      expect(afterArgs.originalData).toBeDefined()
      expect(afterArgs.originalData).toHaveLength(1)
      expect(afterArgs.originalData[0]).toMatchObject({ count: 42, title: 'OriginalData Post' })

      const imported = await payload.find({
        collection: postsWithHooksSlug,
        where: { title: { equals: 'OriginalData Post_imported' } },
      })
      imported.docs.forEach((d) => createdHookPostIDs.push(d.id))
    })

    it('should call import.hooks.before for JSON imports', async () => {
      const jsonContent = JSON.stringify([{ count: 5, title: 'JSON Import Hook' }])
      const file = {
        name: 'hooks-json-test.json',
        data: Buffer.from(jsonContent),
        mimetype: 'application/json',
        size: Buffer.from(jsonContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-hooks-import',
        data: { collectionSlug: postsWithHooksSlug, format: 'json', importMode: 'create' },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-hooks-import',
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
        { count: 7, email: 'TEST@EXAMPLE.COM', title: 'JSON Original Data Test' },
      ])

      const file = {
        name: 'hooks-json-originaldata.json',
        data: Buffer.from(jsonContent),
        mimetype: 'application/json',
        size: Buffer.from(jsonContent).length,
      }

      let importDoc = await payload.create({
        collection: 'posts-with-hooks-import',
        data: { collectionSlug: postsWithHooksSlug, format: 'json', importMode: 'create' },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-hooks-import',
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
        name: 'hooks-batch-import.csv',
        data: Buffer.from(csvContent),
        mimetype: 'text/csv',
        size: Buffer.from(csvContent).length,
      }

      // posts-with-hooks is configured with batchSize: 2 — 4 rows → 2 batches
      let importDoc = await payload.create({
        collection: 'posts-with-hooks-import',
        data: {
          collectionSlug: postsWithHooksSlug,
          importMode: 'create',
        },
        file,
        user,
      })

      importDoc = await payload.findByID({
        id: importDoc.id,
        collection: 'posts-with-hooks-import',
      })

      expect(importDoc.status).toBe('completed')
      expect(hookCalls.importBefore).toHaveLength(2)
      expect(hookCalls.importBefore[0]!.batchNumber).toBe(1)
      expect(hookCalls.importBefore[1]!.batchNumber).toBe(2)
      expect(hookCalls.importBefore[0]!.totalBatches).toBe(2)

      const imported = await payload.find({
        collection: postsWithHooksSlug,
        limit: 10,
        where: { title: { contains: 'Batch Import' } },
      })
      imported.docs.forEach((d) => createdHookPostIDs.push(d.id))
    })
  })

  describe('column mapping — export', () => {
    const createdIDs: (number | string)[] = []

    afterEach(async () => {
      for (const id of createdIDs) {
        await payload.delete({ id, collection: postsWithColumnMapSlug })
      }
      createdIDs.length = 0
    })

    it('should rename CSV columns via collection-level export.hooks.before', async () => {
      const post = await payload.create({
        collection: postsWithColumnMapSlug,
        data: { count: 42, excerpt: 'Original excerpt', title: 'Rename Me' },
      })
      createdIDs.push(post.id)

      let exportDoc = await payload.create({
        collection: 'posts-with-column-map-export',
        data: {
          collectionSlug: postsWithColumnMapSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-column-map-export',
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
        data: { count: 1, excerpt: 'x', sharedName: 'shared value', title: 'Field Rename' },
      })
      createdIDs.push(post.id)

      let exportDoc = await payload.create({
        collection: 'posts-with-column-map-export',
        data: {
          collectionSlug: postsWithColumnMapSlug,
          format: 'csv',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-column-map-export',
      })

      const csvPath = path.join(dirname, 'uploads', exportDoc.filename as string)
      const rows = await readCSV(csvPath)

      expect(rows[0]!['Display Name']).toBe('shared value')
      expect(rows[0]!.sharedName).toBeUndefined()
    })

    it('should reflect collection-level export.hooks.before in CSV export preview', async () => {
      const post = await payload.create({
        collection: postsWithColumnMapSlug,
        data: { count: 11, excerpt: 'preview excerpt', title: 'Preview Rename' },
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
        data: { count: 22, excerpt: 'json preview', title: 'JSON Preview Rename' },
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
        data: { count: 7, excerpt: 'json excerpt', title: 'JSON Rename' },
      })
      createdIDs.push(post.id)

      let exportDoc = await payload.create({
        collection: 'posts-with-column-map-export',
        data: {
          collectionSlug: postsWithColumnMapSlug,
          format: 'json',
          where: { id: { equals: post.id } },
        },
        user,
      })

      exportDoc = await payload.findByID({
        id: exportDoc.id,
        collection: 'posts-with-column-map-export',
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
          .delete({ id, collection: postsWithColumnMapSlug })
          .catch((err) => payload.logger.warn({ id, err, msg: 'column-map cleanup failed' }))
      }
      createdIDs.length = 0
    })

    it('should import a CSV with foreign column names via collection-level import.hooks.before', async () => {
      const csv =
        '"Post Title","Summary","View Count","Ignored Column"\n' +
        '"Imported A","summary a","10","noise"\n' +
        '"Imported B","summary b","20","noise"\n'
      const file = {
        name: 'column-map-foreign-import.csv',
        data: Buffer.from(csv),
        mimetype: 'text/csv',
        size: Buffer.from(csv).length,
      }

      const importDoc = await payload.create({
        collection: 'posts-with-column-map-import',
        data: {
          collectionSlug: postsWithColumnMapSlug,
          importMode: 'create',
        },
        file,
        user,
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
          'Ignored Column': 'x',
          'Post Title': 'JSON A',
          Summary: 'json summary a',
          'View Count': 5,
        },
        {
          'Ignored Column': 'y',
          'Post Title': 'JSON B',
          Summary: 'json summary b',
          'View Count': 6,
        },
      ])
      const file = {
        name: 'column-map-foreign-import.json',
        data: Buffer.from(content),
        mimetype: 'application/json',
        size: Buffer.from(content).length,
      }

      await payload.create({
        collection: 'posts-with-column-map-import',
        data: {
          collectionSlug: postsWithColumnMapSlug,
          importMode: 'create',
        },
        file,
        user,
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
          'Ignored Column': 'noise',
          'Post Title': 'JSON Preview Imported',
          Summary: 'json preview summary',
          'View Count': 40,
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
        name: 'column-map-drop-unknown.csv',
        data: Buffer.from(csv),
        mimetype: 'text/csv',
        size: Buffer.from(csv).length,
      }

      await payload.create({
        collection: 'posts-with-column-map-import',
        data: {
          collectionSlug: postsWithColumnMapSlug,
          importMode: 'create',
        },
        file,
        user,
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

  // ─────────────────────────────────────────────
  // importDoc / exportDoc hook args
  // ─────────────────────────────────────────────

  describe('importDoc / exportDoc hook args', () => {
    const createdJobsPostIDs: (number | string)[] = []
    const createdImportExportDocs: { collection: string; id: number | string }[] = []

    const findJobIDs = async () => {
      const { docs } = await payload.find({
        collection: 'payload-jobs',
        limit: 0,
        pagination: false,
      })

      return docs.map((doc) => doc.id)
    }

    /**
     * The job records present before a test ran. Only the ones a test adds on top of these get
     * deleted, so cleanup never reaches beyond what the test created.
     */
    let preexistingJobIDs = new Set<number | string>()

    beforeEach(async () => {
      preexistingJobIDs = new Set(await findJobIDs())
    })

    /**
     * Deleting an import or export document removes the file it owns, so the uploaded CSVs and
     * the generated export files need no separate cleanup. Failures are not caught — a delete
     * that does not succeed means the test tracked the wrong thing, which is worth failing on.
     */
    afterEach(async () => {
      for (const { id, collection } of createdImportExportDocs) {
        await payload.delete({ id, collection })
      }
      createdImportExportDocs.length = 0

      for (const id of createdJobsPostIDs) {
        await payload.delete({ id, collection: postsWithHooksJobsSlug })
      }
      createdJobsPostIDs.length = 0

      // The queued paths leave a completed job record behind
      const jobIDsToDelete = (await findJobIDs()).filter((id) => !preexistingJobIDs.has(id))

      for (const id of jobIDsToDelete) {
        await payload.delete({ id, collection: 'payload-jobs' })
      }
    })

    const buildCSVFile = ({ name, rows }: { name: string; rows: string[] }) => {
      const data = Buffer.from(`title,count\n${rows.join('\n')}`)

      return { name, data, mimetype: 'text/csv', size: data.length }
    }

    const createImportDoc = async ({
      name,
      batchRef,
      importCollection,
      rows,
      targetCollection,
    }: {
      batchRef: string
      importCollection: string
      name: string
      rows: string[]
      targetCollection: string
    }) => {
      const doc = await payload.create({
        collection: importCollection,
        data: {
          [batchRefFieldName]: batchRef,
          collectionSlug: targetCollection,
          importMode: 'create',
        },
        file: buildCSVFile({ name, rows }),
        user,
      })

      createdImportExportDocs.push({ id: doc.id, collection: importCollection })

      return doc
    }

    const createExportDoc = async ({
      batchRef,
      exportCollection,
      targetCollection,
      where,
    }: {
      batchRef: string
      exportCollection: string
      targetCollection: string
      where: Where
    }) => {
      const doc = await payload.create({
        collection: exportCollection,
        data: {
          [batchRefFieldName]: batchRef,
          collectionSlug: targetCollection,
          format: 'csv',
          where,
        },
        user,
      })

      createdImportExportDocs.push({ id: doc.id, collection: exportCollection })

      return doc
    }

    /** Creates a post to export and tracks it for the shared afterEach. */
    const createTargetPost = async ({
      collection,
      data,
    }: {
      collection: string
      data: Record<string, unknown>
    }) => {
      const post = await payload.create({ collection, data })

      const trackedIDs =
        collection === postsWithHooksJobsSlug ? createdJobsPostIDs : createdHookPostIDs

      trackedIDs.push(post.id)

      return post
    }

    /**
     * Posts to the download endpoint and drains the stream, so the hooks have fired by the time
     * it returns.
     */
    const requestDownload = async ({
      id,
      batchRef,
      postID,
    }: {
      batchRef: string
      /** Set only to check that a submitted id cannot pass for a saved document. */
      id?: string
      postID: number | string
    }) => {
      const response = await restClient.POST(`/${postsWithHooksExportSlug}/download`, {
        body: JSON.stringify({
          data: {
            ...(id ? { id } : {}),
            [batchRefFieldName]: batchRef,
            collectionSlug: postsWithHooksSlug,
            format: 'csv',
            where: { id: { equals: postID } },
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      expect(response.status).toBe(200)
      await response.text()

      return response
    }

    /** Track the posts an import created so the shared afterEach can remove them. */
    const trackImportedPosts = async ({
      collection,
      title,
    }: {
      collection: string
      title: string
    }) => {
      const imported = await payload.find({
        collection,
        where: { title: { contains: title } },
      })

      const trackedIDs =
        collection === postsWithHooksJobsSlug ? createdJobsPostIDs : createdHookPostIDs

      imported.docs.forEach((doc) => trackedIDs.push(doc.id))

      return imported.docs
    }

    describe('import', () => {
      it('should pass importDoc to the before hook on the synchronous path', async () => {
        const importDoc = await createImportDoc({
          name: 'import-doc-sync.csv',
          batchRef: 'SYNC-REF',
          importCollection: postsWithHooksImportSlug,
          rows: ['"Sync ImportDoc","1"'],
          targetCollection: postsWithHooksSlug,
        })

        expect(hookCalls.importBefore).toHaveLength(1)

        const beforeArgs = hookCalls.importBefore[0]!

        expect(beforeArgs.importDoc.id).toBe(importDoc.id)
        expect(beforeArgs.importDoc[batchRefFieldName]).toBe('SYNC-REF')

        await trackImportedPosts({ collection: postsWithHooksSlug, title: 'Sync ImportDoc' })
      })

      it('should pass importDoc to the after hook on the synchronous path', async () => {
        const importDoc = await createImportDoc({
          name: 'import-doc-sync-after.csv',
          batchRef: 'SYNC-AFTER-REF',
          importCollection: postsWithHooksImportSlug,
          rows: ['"Sync ImportDoc After","2"'],
          targetCollection: postsWithHooksSlug,
        })

        expect(hookCalls.importAfter).toHaveLength(1)

        const afterArgs = hookCalls.importAfter[0]!

        expect(afterArgs.importDoc.id).toBe(importDoc.id)
        expect(afterArgs.importDoc[batchRefFieldName]).toBe('SYNC-AFTER-REF')

        await trackImportedPosts({ collection: postsWithHooksSlug, title: 'Sync ImportDoc After' })
      })

      it('should pass importDoc to the before hook when run through the jobs queue', async () => {
        const importDoc = await createImportDoc({
          name: 'import-doc-jobs.csv',
          batchRef: 'JOBS-REF',
          importCollection: postsWithHooksJobsImportSlug,
          rows: ['"Jobs ImportDoc","3"'],
          targetCollection: postsWithHooksJobsSlug,
        })

        await payload.jobs.run()

        expect(hookCalls.importBefore).toHaveLength(1)

        const beforeArgs = hookCalls.importBefore[0]!

        expect(beforeArgs.importDoc.id).toBe(importDoc.id)
        expect(beforeArgs.importDoc[batchRefFieldName]).toBe('JOBS-REF')

        await trackImportedPosts({ collection: postsWithHooksJobsSlug, title: 'Jobs ImportDoc' })
      })

      it('should pass importDoc to the after hook when run through the jobs queue', async () => {
        const importDoc = await createImportDoc({
          name: 'import-doc-jobs-after.csv',
          batchRef: 'JOBS-AFTER-REF',
          importCollection: postsWithHooksJobsImportSlug,
          rows: ['"Jobs ImportDoc After","4"'],
          targetCollection: postsWithHooksJobsSlug,
        })

        await payload.jobs.run()

        expect(hookCalls.importAfter).toHaveLength(1)

        const afterArgs = hookCalls.importAfter[0]!

        expect(afterArgs.importDoc.id).toBe(importDoc.id)
        expect(afterArgs.importDoc[batchRefFieldName]).toBe('JOBS-AFTER-REF')

        await trackImportedPosts({
          collection: postsWithHooksJobsSlug,
          title: 'Jobs ImportDoc After',
        })
      })

      it('should pass the same importDoc to every batch', async () => {
        const importDoc = await createImportDoc({
          name: 'import-doc-batches.csv',
          batchRef: 'BATCH-REF',
          importCollection: postsWithHooksImportSlug,
          rows: [
            '"Batched One","1"',
            '"Batched Two","2"',
            '"Batched Three","3"',
            '"Batched Four","4"',
          ],
          targetCollection: postsWithHooksSlug,
        })

        // batchSize is 2 for this collection, so 4 rows produce 2 batches
        expect(hookCalls.importBefore).toHaveLength(2)

        hookCalls.importBefore.forEach((args) => {
          expect(args.importDoc.id).toBe(importDoc.id)
          expect(args.importDoc[batchRefFieldName]).toBe('BATCH-REF')
        })

        await trackImportedPosts({ collection: postsWithHooksSlug, title: 'Batched' })
      })

      it('should let the before hook apply an importDoc value to the documents it creates', async () => {
        await createImportDoc({
          name: 'import-doc-applied.csv',
          batchRef: 'APPLIED-REF',
          importCollection: postsWithHooksImportSlug,
          rows: ['"Applied ImportDoc","1"'],
          targetCollection: postsWithHooksSlug,
        })

        const docs = await trackImportedPosts({
          collection: postsWithHooksSlug,
          title: 'Applied ImportDoc',
        })

        expect(docs).toHaveLength(1)
        expect(docs[0]!.title).toBe('Applied ImportDoc_imported_APPLIED-REF')
      })
    })

    describe('export', () => {
      it('should pass exportDoc with an id to the before hook when run through the jobs queue', async () => {
        const post = await createTargetPost({
          collection: postsWithHooksJobsSlug,
          data: { count: 1, title: 'Jobs ExportDoc' },
        })

        const exportDoc = await createExportDoc({
          batchRef: 'JOBS-EXPORT-REF',
          exportCollection: postsWithHooksJobsExportSlug,
          targetCollection: postsWithHooksJobsSlug,
          where: { id: { equals: post.id } },
        })

        await payload.jobs.run()

        expect(hookCalls.exportBefore).toHaveLength(1)

        const beforeArgs = hookCalls.exportBefore[0]!

        expect(beforeArgs.exportDoc.id).toBe(exportDoc.id)
        expect(beforeArgs.exportDoc[batchRefFieldName]).toBe('JOBS-EXPORT-REF')
      })

      it('should pass exportDoc to the after hook when run through the jobs queue', async () => {
        const post = await createTargetPost({
          collection: postsWithHooksJobsSlug,
          data: { count: 2, title: 'Jobs ExportDoc After' },
        })

        const exportDoc = await createExportDoc({
          batchRef: 'JOBS-EXPORT-AFTER-REF',
          exportCollection: postsWithHooksJobsExportSlug,
          targetCollection: postsWithHooksJobsSlug,
          where: { id: { equals: post.id } },
        })

        await payload.jobs.run()

        expect(hookCalls.exportAfter).toHaveLength(1)

        const afterArgs = hookCalls.exportAfter[0]!

        expect(afterArgs.exportDoc.id).toBe(exportDoc.id)
        expect(afterArgs.exportDoc[batchRefFieldName]).toBe('JOBS-EXPORT-AFTER-REF')
      })

      it('should pass exportDoc carrying the submitted form values, without an id, to the before hook on the synchronous path', async () => {
        const post = await createTargetPost({
          collection: postsWithHooksSlug,
          data: { count: 3, secret: 'sync-secret', title: 'Sync ExportDoc' },
        })

        await createExportDoc({
          batchRef: 'SYNC-EXPORT-REF',
          exportCollection: postsWithHooksExportSlug,
          targetCollection: postsWithHooksSlug,
          where: { id: { equals: post.id } },
        })

        expect(hookCalls.exportBefore).toHaveLength(1)

        const beforeArgs = hookCalls.exportBefore[0]!

        expect(beforeArgs.exportDoc[batchRefFieldName]).toBe('SYNC-EXPORT-REF')
        // The export runs in beforeOperation, so the document is not saved yet
        expect(beforeArgs.exportDoc.id).toBeUndefined()
      })

      it('should pass exportDoc carrying the submitted form values, without an id, to the after hook on the synchronous path', async () => {
        const post = await createTargetPost({
          collection: postsWithHooksSlug,
          data: { count: 4, secret: 'sync-after-secret', title: 'Sync ExportDoc After' },
        })

        await createExportDoc({
          batchRef: 'SYNC-EXPORT-AFTER-REF',
          exportCollection: postsWithHooksExportSlug,
          targetCollection: postsWithHooksSlug,
          where: { id: { equals: post.id } },
        })

        expect(hookCalls.exportAfter).toHaveLength(1)

        const afterArgs = hookCalls.exportAfter[0]!

        expect(afterArgs.exportDoc[batchRefFieldName]).toBe('SYNC-EXPORT-AFTER-REF')
        expect(afterArgs.exportDoc.id).toBeUndefined()
      })

      it('should pass the same exportDoc to every batch', async () => {
        const titles = ['Batched Export One', 'Batched Export Two', 'Batched Export Three']

        for (const title of titles) {
          await createTargetPost({
            collection: postsWithHooksSlug,
            data: { count: 1, secret: 'batched-secret', title },
          })
        }

        await createExportDoc({
          batchRef: 'BATCH-EXPORT-REF',
          exportCollection: postsWithHooksExportSlug,
          targetCollection: postsWithHooksSlug,
          where: { title: { contains: 'Batched Export' } },
        })

        // batchSize is 2 for this collection, so 3 documents produce 2 batches
        expect(hookCalls.exportBefore).toHaveLength(2)

        hookCalls.exportBefore.forEach((args) => {
          expect(args.exportDoc[batchRefFieldName]).toBe('BATCH-EXPORT-REF')
        })
      })

      it('should let the before hook apply an exportDoc value to the rows it writes', async () => {
        const post = await createTargetPost({
          collection: postsWithHooksSlug,
          data: { count: 5, secret: 'applied-secret', title: 'Applied ExportDoc' },
        })

        const exportDoc = await createExportDoc({
          batchRef: 'APPLIED-EXPORT-REF',
          exportCollection: postsWithHooksExportSlug,
          targetCollection: postsWithHooksSlug,
          where: { id: { equals: post.id } },
        })

        const savedExportDoc = await payload.findByID({
          id: exportDoc.id,
          collection: postsWithHooksExportSlug,
        })

        const rows = await readCSV(path.join(dirname, 'uploads', savedExportDoc.filename as string))

        expect(rows).toHaveLength(1)
        expect(rows[0]![batchRefFieldName]).toBe('APPLIED-EXPORT-REF')
      })

      it('should pass exportDoc carrying the submitted form values, without an id, to the before hook on the download path', async () => {
        const post = await createTargetPost({
          collection: postsWithHooksSlug,
          data: { count: 6, secret: 'download-secret', title: 'Download ExportDoc' },
        })

        await requestDownload({ batchRef: 'DOWNLOAD-REF', postID: post.id })

        expect(hookCalls.exportBefore).toHaveLength(1)

        const beforeArgs = hookCalls.exportBefore[0]!

        expect(beforeArgs.exportDoc[batchRefFieldName]).toBe('DOWNLOAD-REF')
        // Nothing is ever persisted on the download path
        expect(beforeArgs.exportDoc.id).toBeUndefined()
      })

      it('should pass exportDoc carrying the submitted form values, without an id, to the after hook on the download path', async () => {
        const post = await createTargetPost({
          collection: postsWithHooksSlug,
          data: { count: 6, secret: 'download-after-secret', title: 'Download ExportDoc After' },
        })

        await requestDownload({ batchRef: 'DOWNLOAD-AFTER-REF', postID: post.id })

        expect(hookCalls.exportAfter).toHaveLength(1)

        const afterArgs = hookCalls.exportAfter[0]!

        expect(afterArgs.exportDoc[batchRefFieldName]).toBe('DOWNLOAD-AFTER-REF')
        expect(afterArgs.exportDoc.id).toBeUndefined()
      })

      it('should not let a submitted id make the download path look like a saved document', async () => {
        const post = await createTargetPost({
          collection: postsWithHooksSlug,
          data: { count: 7, secret: 'spoofed-secret', title: 'Spoofed ExportDoc' },
        })

        await requestDownload({
          id: 'not-a-real-export-id',
          batchRef: 'SPOOFED-REF',
          postID: post.id,
        })

        expect(hookCalls.exportBefore).toHaveLength(1)
        expect(hookCalls.exportBefore[0]!.exportDoc.id).toBeUndefined()
      })
    })

    describe('preview', () => {
      it('should pass exportDoc carrying the submitted form values, without an id, on the export preview path', async () => {
        const post = await payload.create({
          collection: postsWithHooksSlug,
          data: { count: 8, secret: 'preview-secret', title: 'Preview ExportDoc' },
        })

        createdHookPostIDs.push(post.id)

        const response = await restClient.POST(`/${postsWithHooksExportSlug}/export-preview`, {
          body: JSON.stringify({
            [batchRefFieldName]: 'EXPORT-PREVIEW-REF',
            collectionSlug: postsWithHooksSlug,
            format: 'csv',
            previewLimit: 10,
            previewPage: 1,
            where: { id: { equals: post.id } },
          }),
          headers: { 'Content-Type': 'application/json' },
        })

        expect(response.status).toBe(200)

        expect(hookCalls.exportBefore).toHaveLength(1)

        const beforeArgs = hookCalls.exportBefore[0]!

        expect(beforeArgs.exportDoc[batchRefFieldName]).toBe('EXPORT-PREVIEW-REF')
        // Preview runs against the open form, so nothing is saved
        expect(beforeArgs.exportDoc.id).toBeUndefined()
      })

      it('should pass importDoc carrying the submitted form values, without an id, on the import preview path', async () => {
        const fileData = Buffer.from(`title,count\n"Preview ImportDoc","9"\n`).toString('base64')

        const response = await restClient.POST(`/${postsWithHooksImportSlug}/preview-data`, {
          body: JSON.stringify({
            [batchRefFieldName]: 'IMPORT-PREVIEW-REF',
            collectionSlug: postsWithHooksSlug,
            fileData,
            format: 'csv',
            previewLimit: 10,
            previewPage: 1,
          }),
          headers: { 'Content-Type': 'application/json' },
        })

        expect(response.status).toBe(200)

        expect(hookCalls.importBefore).toHaveLength(1)

        const beforeArgs = hookCalls.importBefore[0]!

        expect(beforeArgs.importDoc[batchRefFieldName]).toBe('IMPORT-PREVIEW-REF')
        // Preview runs against the open form, so nothing is saved
        expect(beforeArgs.importDoc.id).toBeUndefined()
      })

      it('should not let a submitted id make the export preview path look like a saved document', async () => {
        const post = await payload.create({
          collection: postsWithHooksSlug,
          data: { count: 10, secret: 'spoofed-preview-secret', title: 'Spoofed Preview' },
        })

        createdHookPostIDs.push(post.id)

        const response = await restClient.POST(`/${postsWithHooksExportSlug}/export-preview`, {
          body: JSON.stringify({
            id: 'not-a-real-export-id',
            [batchRefFieldName]: 'SPOOFED-PREVIEW-REF',
            collectionSlug: postsWithHooksSlug,
            format: 'csv',
            where: { id: { equals: post.id } },
          }),
          headers: { 'Content-Type': 'application/json' },
        })

        expect(response.status).toBe(200)

        expect(hookCalls.exportBefore).toHaveLength(1)
        expect(hookCalls.exportBefore[0]!.exportDoc.id).toBeUndefined()
      })
    })
  })
})

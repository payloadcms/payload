import type { Payload } from 'payload'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { readCSV, readJSON } from './helpers.js'
import { hookCalls, resetHookSpies } from './hookSpies.js'
import { postsWithHooksSlug } from './shared.js'

let payload: Payload
let restClient: NextRESTClient
let user: any

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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

  afterEach(() => {
    resetHookSpies()
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

      await payload.delete({ collection: postsWithHooksSlug, id: post.id })
    })

    it('should call export.hooks.after with correct args after write', async () => {
      const post = await payload.create({
        collection: postsWithHooksSlug,
        data: { title: 'After Hook Test', secret: 'hidden', count: 2 },
      })

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

      await payload.delete({ collection: postsWithHooksSlug, id: post.id })
    })

    it('should call export.hooks.before for JSON exports with nested docs', async () => {
      const post = await payload.create({
        collection: postsWithHooksSlug,
        data: { title: 'JSON Hook Test', secret: 'json-secret', count: 3 },
      })

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

      await payload.delete({ collection: postsWithHooksSlug, id: post.id })
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

      // Use batchSize of 2 to force 3 batches for 5 docs
      let exportDoc = await payload.create({
        collection: 'posts-with-hooks-export',
        user,
        data: {
          collectionSlug: postsWithHooksSlug,
          format: 'csv',
          batchSize: 2,
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

      await Promise.all(
        posts.map((p) => payload.delete({ collection: postsWithHooksSlug, id: p.id })),
      )
    })

    it('should call export.hooks.before via streaming download', async () => {
      const post = await payload.create({
        collection: postsWithHooksSlug,
        data: { title: 'Download Hook Test', secret: 'streamed-secret', count: 4 },
      })

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

      await payload.delete({ collection: postsWithHooksSlug, id: post.id })
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

      await payload.delete({ collection: postsWithHooksSlug, id: importedDocs.docs[0]!.id })
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
      await Promise.all(
        imported.docs.map((d) => payload.delete({ collection: postsWithHooksSlug, id: d.id })),
      )
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

      await Promise.all(
        imported.docs.map((d) => payload.delete({ collection: postsWithHooksSlug, id: d.id })),
      )
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

      let importDoc = await payload.create({
        collection: 'posts-with-hooks-import',
        user,
        data: {
          collectionSlug: postsWithHooksSlug,
          importMode: 'create',
          batchSize: 2,
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
      await Promise.all(
        imported.docs.map((d) => payload.delete({ collection: postsWithHooksSlug, id: d.id })),
      )
    })
  })

  // ─────────────────────────────────────────────
  // Deprecation: toCSV/fromCSV still work
  // ─────────────────────────────────────────────

  describe('toCSV/fromCSV deprecation (still functional)', () => {
    it('should still apply field-level toCSV during export without error', async () => {
      // Pages collection has custom toCSV on its `custom` field per existing tests
      const page = await payload.create({
        collection: 'pages',
        data: { title: 'toCSV Deprecation Test', custom: 'raw-value' } as any,
      })

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          where: { id: { equals: page.id } },
        },
      })

      await payload.jobs.run()

      const doc = await payload.findByID({ collection: 'exports', id: exportDoc.id })
      expect(doc.filename).toBeDefined()

      await payload.delete({ collection: 'pages', id: page.id })
    })
  })
})

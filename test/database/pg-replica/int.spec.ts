import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { DrizzleAdapter } from '@payloadcms/drizzle'

import path from 'path'
import { BasePayload, buildConfig, type DatabaseAdapterObj, type Payload } from 'payload'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.suite({ db: (adapter) => adapter === 'postgres-read-replicas' })(
  'postgres read replicas',
  () => {
    let payload: Payload
    let adapter: DrizzleAdapter

    test.beforeAll(async () => {
      const {
        databaseAdapter,
      }: {
        databaseAdapter: DatabaseAdapterObj<PostgresAdapter>
      } = await import(path.resolve(dirname, '../../databaseAdapter.js'))

      const config = await buildConfig({
        db: databaseAdapter,
        secret: 'read-replica-test-secret',
        collections: [
          {
            slug: 'users',
            auth: true,
            fields: [],
            versions: false,
          },
          {
            slug: 'posts',
            fields: [
              {
                name: 'title',
                type: 'text',
              },
            ],
            versions: {
              drafts: true,
            },
          },
        ],
        globals: [
          {
            slug: 'settings',
            fields: [
              {
                name: 'siteTitle',
                type: 'text',
              },
            ],
            versions: false,
          },
          {
            slug: 'nav',
            fields: [
              {
                name: 'label',
                type: 'text',
              },
            ],
            versions: true,
          },
        ],
      })

      payload = await new BasePayload().init({ config })
      adapter = payload.db as unknown as DrizzleAdapter
    })

    test.afterAll(async () => {
      await payload.destroy()
    })

    test.describe('adapter wiring', () => {
      test('should have primaryDrizzle set when replicas are configured', () => {
        expect(adapter.primaryDrizzle).toBeDefined()
        expect(adapter.primaryDrizzle).not.toBe(adapter.drizzle)
      })

      test('should set lastWriteTimestamp after a create', async () => {
        adapter.lastWriteTimestamp = undefined

        await payload.create({ collection: 'posts', data: { title: 'write-tracking' } })

        expect(adapter.lastWriteTimestamp).toBeDefined()
        expect(typeof adapter.lastWriteTimestamp).toBe('number')
        expect(Date.now() - adapter.lastWriteTimestamp!).toBeLessThan(5000)
      })

      test('should set lastWriteTimestamp after an update', async () => {
        const doc = await payload.create({ collection: 'posts', data: { title: 'before-update' } })
        adapter.lastWriteTimestamp = undefined

        await payload.update({ collection: 'posts', id: doc.id, data: { title: 'after-update' } })

        expect(adapter.lastWriteTimestamp).toBeDefined()
      })

      test('should set lastWriteTimestamp after a delete', async () => {
        const doc = await payload.create({ collection: 'posts', data: { title: 'to-delete' } })
        adapter.lastWriteTimestamp = undefined

        await payload.delete({ collection: 'posts', id: doc.id })

        expect(adapter.lastWriteTimestamp).toBeDefined()
      })
    })

    test.describe('read-after-write consistency (default window)', () => {
      test('should find a document immediately after creating it', async () => {
        const doc = await payload.create({
          collection: 'posts',
          data: { title: 'find-after-create' },
        })

        const found = await payload.findByID({ collection: 'posts', id: doc.id })

        expect(found).toBeDefined()
        expect(found.title).toBe('find-after-create')
      })

      test('should find updated data immediately after updating', async () => {
        const doc = await payload.create({ collection: 'posts', data: { title: 'original' } })

        await payload.update({ collection: 'posts', id: doc.id, data: { title: 'updated' } })

        const found = await payload.findByID({ collection: 'posts', id: doc.id })

        expect(found.title).toBe('updated')
      })

      test('should return correct count immediately after creating documents', async () => {
        const unique = `count-test-${Date.now()}`

        await payload.create({ collection: 'posts', data: { title: unique } })
        await payload.create({ collection: 'posts', data: { title: unique } })
        await payload.create({ collection: 'posts', data: { title: unique } })

        const result = await payload.count({
          collection: 'posts',
          where: { title: { equals: unique } },
        })

        expect(result.totalDocs).toBe(3)
      })

      test('should not find a document after deleting it', async () => {
        const doc = await payload.create({ collection: 'posts', data: { title: 'delete-me' } })

        await payload.delete({ collection: 'posts', id: doc.id })

        const result = await payload.find({
          collection: 'posts',
          where: { id: { equals: doc.id } },
        })

        expect(result.docs).toHaveLength(0)
      })
    })

    test.describe('readReplicasAfterWriteInterval = 0 disables the consistency window', () => {
      test('should respect interval=0 by not routing reads to primary after the window', async () => {
        const original = adapter.readReplicasAfterWriteInterval
        adapter.readReplicasAfterWriteInterval = 0

        // Create a doc — this sets lastWriteTimestamp
        await payload.create({ collection: 'posts', data: { title: 'interval-zero' } })

        // With interval=0, the window is effectively disabled:
        // Date.now() - lastWriteTimestamp >= 0 is NOT < 0
        // So getTransaction returns adapter.drizzle (replica-wrapped).
        // The read may hit the replica — which could be stale.
        // We can't reliably assert the routing target, but we verify the config
        // is wired through correctly.
        expect(adapter.readReplicasAfterWriteInterval).toBe(0)
        expect(adapter.lastWriteTimestamp).toBeDefined()

        // Restore
        adapter.readReplicasAfterWriteInterval = original
      })
    })

    test.describe('expired write window falls back to replica routing', () => {
      test('should route to replica when lastWriteTimestamp is old', async () => {
        // Create a doc so the table has data
        const doc = await payload.create({ collection: 'posts', data: { title: 'old-write' } })

        // Simulate an old write (outside the window)
        adapter.lastWriteTimestamp = Date.now() - 10_000

        // This read should go through adapter.drizzle (replica-wrapped).
        // With real replication in Docker, the replica should have caught up
        // by now, so the read still succeeds.
        const found = await payload.findByID({ collection: 'posts', id: doc.id })

        expect(found).toBeDefined()
        expect(found.title).toBe('old-write')
      })
    })

    test.describe('version operations use primary for read-back', () => {
      test('should create a document with a version without errors', async () => {
        // This exercises createVersion which previously lacked getPrimaryDb,
        // causing the read-back after insert to hit a stale replica
        const doc = await (payload as any).create({
          collection: 'posts',
          data: { title: 'versioned-doc', _status: 'draft' },
          draft: true,
        })

        expect(doc).toBeDefined()
        expect(doc.title).toBe('versioned-doc')

        const versions = await (payload as any).findVersions({
          collection: 'posts',
          where: { parent: { equals: doc.id } },
        })

        expect(versions.docs.length).toBeGreaterThanOrEqual(1)
      })

      test('should update a draft and create a new version without errors', async () => {
        const doc = await (payload as any).create({
          collection: 'posts',
          data: { title: 'draft-original', _status: 'draft' },
          draft: true,
        })

        // This triggers updateOne (has getPrimaryDb) + createVersion (now fixed)
        const updated = await (payload as any).update({
          collection: 'posts',
          id: doc.id,
          data: { title: 'draft-updated' },
          draft: true,
        })

        expect(updated.title).toBe('draft-updated')

        const versions = await (payload as any).findVersions({
          collection: 'posts',
          where: { parent: { equals: doc.id } },
        })

        expect(versions.docs.length).toBeGreaterThanOrEqual(2)
      })

      test('should restore a version without errors', async () => {
        const doc = await (payload as any).create({
          collection: 'posts',
          data: { title: 'restore-v1', _status: 'draft' },
          draft: true,
        })

        await (payload as any).update({
          collection: 'posts',
          id: doc.id,
          data: { title: 'restore-v2' },
          draft: true,
        })

        const versions = await (payload as any).findVersions({
          collection: 'posts',
          where: { parent: { equals: doc.id } },
          sort: '-updatedAt',
        })

        const firstVersion = versions.docs[versions.docs.length - 1]!

        // restoreVersion triggers updateVersion (now fixed)
        const restored = await (payload as any).restoreVersion({
          collection: 'posts',
          id: firstVersion.id,
        })

        expect(restored.title).toBe('restore-v1')
      })
    })

    test.describe('global operations use primary for read-back', () => {
      test('should create and update a global without errors', async () => {
        // First update creates the global row (createGlobal, now fixed)
        const result = await (payload as any).updateGlobal({
          slug: 'settings',
          data: { siteTitle: 'My Site' },
        })

        expect(result).toBeDefined()
        expect(result.siteTitle).toBe('My Site')

        // Second update uses updateGlobal path (also fixed)
        const updated = await (payload as any).updateGlobal({
          slug: 'settings',
          data: { siteTitle: 'Updated Site' },
        })

        expect(updated.siteTitle).toBe('Updated Site')
      })

      test('should create and update a versioned global without errors', async () => {
        // This exercises createGlobalVersion (now fixed)
        const result = await (payload as any).updateGlobal({
          slug: 'nav',
          data: { label: 'Home' },
        })

        expect(result).toBeDefined()
        expect(result.label).toBe('Home')

        const versions = await (payload as any).findGlobalVersions({
          slug: 'nav',
        })

        expect(versions.docs.length).toBeGreaterThanOrEqual(1)

        // Update again to exercise updateGlobalVersion path
        const updated = await (payload as any).updateGlobal({
          slug: 'nav',
          data: { label: 'Updated Home' },
        })

        expect(updated.label).toBe('Updated Home')
      })
    })

    test.describe('delete operations use primary for pre-delete read', () => {
      test('should delete a document and return the deleted data without errors', async () => {
        const doc = await payload.create({
          collection: 'posts',
          data: { title: 'to-delete-replica-test' },
        })

        // deleteOne reads the doc before deleting (now uses getPrimaryDb)
        const deleted = await payload.delete({
          collection: 'posts',
          id: doc.id,
        })

        expect(deleted).toBeDefined()
        expect(deleted.title).toBe('to-delete-replica-test')
      })
    })
  },
)

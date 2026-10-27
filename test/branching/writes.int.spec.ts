import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import {
  branchChangesSlug,
  branchesSlug,
  categoriesSlug,
  localizedSlug,
  postsSlug,
  uniqueSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: writes', { config: './config.ts', resetBetweenTests: false }, () => {
  test.beforeAll(async ({ payloadInstance, restClientInstance }) => {
    payload = createTrustedPayload(payloadInstance)
    restClient = restClientInstance

    const login = await restClient
      .POST('/users/login', {
        body: JSON.stringify({ email: devUser.email, password: devUser.password }),
      })
      .then((res) => res.json())

    token = login.token
  })

  test.describe('Write path — copy-on-write updates', () => {
    let mainDocID: number | string
    const cleanup: (number | string)[] = []

    test.beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'cow' } },
      })

      if (!existing.docs.length) {
        await payload.create({ collection: branchesSlug, data: { name: 'COW', slug: 'cow' } })
      }
    })

    test.beforeEach(async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { order: 1, title: 'original on main' },
      })
      mainDocID = doc.id
      cleanup.push(doc.id)
    })

    test.afterEach(async () => {
      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { _branch: { not_equals: 'main' } },
      })

      for (const shadow of shadows.docs) {
        await payload.delete({ id: shadow.id, branch: false, collection: postsSlug })
      }

      for (const id of cleanup) {
        await payload.delete({ id, branch: false, collection: postsSlug })
      }
      cleanup.length = 0

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'cow' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    test('should leave the main document untouched when updating on a branch', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('original on main')
    })

    test('should refresh branch state across several writes on one request', async () => {
      const req = await createPayloadRequest({ branch: 'cow', payload })
      const beforeWrites = await payload.findByID({ id: mainDocID, collection: postsSlug, req })

      const created = await payload.create({
        collection: postsSlug,
        data: { title: 'created on branch' },
        req,
      })
      const afterCreate = await payload.findByID({ id: created.id, collection: postsSlug, req })

      await payload.update({
        id: mainDocID,
        collection: postsSlug,
        data: { title: 'edited on branch' },
        req,
      })
      const afterUpdate = await payload.findByID({ id: mainDocID, collection: postsSlug, req })

      await payload.delete({ id: mainDocID, collection: postsSlug, req })
      const afterDelete = await payload.findByID({
        id: mainDocID,
        collection: postsSlug,
        disableErrors: true,
        req,
      })

      expect(beforeWrites.title).toBe('original on main')
      expect(afterCreate.title).toBe('created on branch')
      expect(afterUpdate.title).toBe('edited on branch')
      expect(afterDelete).toBeNull()
    })

    test('should create exactly one shadow row on first branch edit', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      // `_branchDocID` is `hidden`, so it is stripped from API responses.
      // Inspecting it is exactly what `showHiddenFields` is for.
      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: { _branch: { equals: 'cow' } },
      })

      expect(shadows.docs).toHaveLength(1)
      expect(shadows.docs[0]).not.toHaveProperty('_branchOp')
      expect(shadows.docs[0]).toMatchObject({ title: 'edited on branch' })
      expect(String(shadows.docs[0]!._branchDocID)).toBe(String(mainDocID))
    })

    test('should reuse the existing shadow row on subsequent branch edits', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'first branch edit' },
      })
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'second branch edit' },
      })

      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { _branch: { equals: 'cow' } },
      })

      expect(shadows.docs).toHaveLength(1)
      expect(shadows.docs[0]!.title).toBe('second branch edit')
    })

    test('should return branch content when reading the branch by canonical ID', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const onBranch = await payload.findByID({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
      })

      expect(onBranch.title).toBe('edited on branch')
      expect(String(onBranch.id)).toBe(String(mainDocID))
    })

    // `select` narrows the row to the fields named, which used to drop
    // `_branchDocID` and leave the canonical-ID projection with nothing to map
    // from — so a branch read surfaced shadow-row primary keys. The admin list
    // view selects only its visible columns, so every row it rendered on a
    // branch linked to an ID that findByID could not resolve.
    test('should keep the canonical ID when a branch find narrows fields with select', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const result = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
        select: { title: true },
        where: { title: { equals: 'edited on branch' } },
      })

      expect(result.docs).toHaveLength(1)
      expect(String(result.docs[0]!.id)).toBe(String(mainDocID))
    })

    test('should keep the canonical ID when a branch findByID narrows fields with select', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const onBranch = await payload.findByID({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        select: { title: true },
      })

      expect(String(onBranch.id)).toBe(String(mainDocID))
    })

    test('should keep the canonical ID when a branch find excludes fields with select', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const result = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
        select: { order: false },
        where: { title: { equals: 'edited on branch' } },
      })

      expect(result.docs).toHaveLength(1)
      expect(String(result.docs[0]!.id)).toBe(String(mainDocID))
    })

    test('should return the canonical ID on the document an update returns', async () => {
      const updated = await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      expect(String(updated.id)).toBe(String(mainDocID))
    })

    test('should return the canonical ID from an atomic branch-row update', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'forked on branch' },
      })

      const shadow = await payload.db.findOne({
        branch: false,
        collection: postsSlug,
        req: await createPayloadRequest({ branch: false, payload }),
        where: { _branch: { equals: 'cow' } },
      })
      const req = await createPayloadRequest({ branch: 'cow', payload })
      const updated = await payload.db.updateOne({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'atomic branch edit' },
        options: { atomic: true },
        req,
        where: { id: { equals: shadow!.id } },
      })

      expect(String(updated.id)).toBe(String(mainDocID))
      expect(updated.title).toBe('atomic branch edit')
    })

    test('should sort on a branch-modified field using the branch value', async () => {
      const second = await payload.create({
        collection: postsSlug,
        data: { order: 2, title: 'b second on main' },
      })
      cleanup.push(second.id)

      // main order: 'original on main' (1), 'b second on main' (2).
      // On the branch the first document sorts last instead.
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { order: 99 },
      })

      const onBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
        sort: 'order',
      })
      const onMain = await payload.find({
        collection: postsSlug,
        pagination: false,
        sort: 'order',
      })

      const branchIDs = onBranch.docs.map((doc) => String(doc.id))
      const mainIDs = onMain.docs.map((doc) => String(doc.id))

      expect(branchIDs.indexOf(String(mainDocID))).toBeGreaterThan(
        branchIDs.indexOf(String(second.id)),
      )
      expect(mainIDs.indexOf(String(mainDocID))).toBeLessThan(mainIDs.indexOf(String(second.id)))
    })

    test('should populate a relationship with the branch version of the related document', async () => {
      const category = await payload.create({
        collection: categoriesSlug,
        data: { name: 'main category' },
      })

      await payload.update({
        id: mainDocID,
        collection: postsSlug,
        data: { category: category.id },
      })

      await payload.update({
        id: category.id,
        branch: 'cow',
        collection: categoriesSlug,
        data: { name: 'branch category' },
      })

      const onBranch = await payload.findByID({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        depth: 1,
      })
      const onMain = await payload.findByID({
        id: mainDocID,
        collection: postsSlug,
        depth: 1,
      })

      expect((onBranch.category as { name: string }).name).toBe('branch category')
      expect((onMain.category as { name: string }).name).toBe('main category')

      const shadows = await payload.find({
        branch: false,
        collection: categoriesSlug,
        pagination: false,
        where: { _branch: { not_equals: 'main' } },
      })

      for (const shadow of shadows.docs) {
        await payload.delete({ id: shadow.id, branch: false, collection: categoriesSlug })
      }

      await payload.delete({ id: category.id, branch: false, collection: categoriesSlug })
    })

    test('should not double-count a document edited on a branch', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const onBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
      })
      const onMain = await payload.find({ collection: postsSlug, pagination: false })

      expect(onBranch.docs).toHaveLength(onMain.docs.length)
      expect(onBranch.docs.filter((doc) => String(doc.id) === String(mainDocID))).toHaveLength(1)
    })

    test('should filter on a branch-modified field using the branch value', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'Halloween Sale' },
      })

      const onBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
        where: { title: { like: 'Halloween' } },
      })
      const onMain = await payload.find({
        collection: postsSlug,
        pagination: false,
        where: { title: { like: 'Halloween' } },
      })

      expect(onBranch.docs).toHaveLength(1)
      expect(onMain.docs).toHaveLength(0)
    })

    test('should hide a matching main document when its branch replacement does not match', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'does not match main' },
      })

      const onBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        limit: 1,
        page: 1,
        where: { title: { equals: 'original on main' } },
      })
      const count = await payload.count({
        branch: 'cow',
        collection: postsSlug,
        where: { title: { equals: 'original on main' } },
      })
      const onMain = await payload.find({
        collection: postsSlug,
        pagination: false,
        where: { title: { equals: 'original on main' } },
      })

      expect(onBranch.docs).toHaveLength(0)
      expect(onBranch.totalDocs).toBe(0)
      expect(onBranch.totalPages).toBe(1)
      expect(count.totalDocs).toBe(0)
      expect(onMain.docs).toHaveLength(1)
    })

    test('should hide a relationship-path match replaced by nonmatching branch content', async () => {
      const category = await payload.create({
        collection: categoriesSlug,
        data: { name: 'main relationship match' },
      })

      await payload.update({
        id: mainDocID,
        collection: postsSlug,
        data: { category: category.id },
      })
      await payload.update({
        id: category.id,
        branch: 'cow',
        collection: categoriesSlug,
        data: { name: 'branch relationship replacement' },
      })

      const mainValueOnBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
        where: { 'category.name': { equals: 'main relationship match' } },
      })
      const branchValueOnBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
        where: { 'category.name': { equals: 'branch relationship replacement' } },
      })

      expect(mainValueOnBranch.docs).toHaveLength(0)
      expect(branchValueOnBranch.docs.map((doc) => String(doc.id))).toContain(String(mainDocID))

      const categoryRows = await payload.find({
        branch: false,
        collection: categoriesSlug,
        pagination: false,
        where: {
          or: [{ id: { equals: category.id } }, { _branchDocID: { equals: category.id } }],
        },
      })

      for (const categoryRow of categoryRows.docs) {
        await payload.delete({
          id: categoryRow.id,
          branch: false,
          collection: categoriesSlug,
        })
      }
    })

    test('should record the update in the changeset registry', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'cow' } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]).toMatchObject({
        collectionSlug: postsSlug,
        documentID: String(mainDocID),
        operation: 'update',
      })
    })

    test('should tombstone rather than delete when deleting a main document on a branch', async () => {
      await payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug })

      const stillOnMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(stillOnMain.title).toBe('original on main')
    })

    test('should hide a document deleted on a branch from that branch only', async () => {
      await payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug })

      const onBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
      })
      const onMain = await payload.find({ collection: postsSlug, pagination: false })

      expect(onBranch.docs.map((doc) => String(doc.id))).not.toContain(String(mainDocID))
      expect(onMain.docs.map((doc) => String(doc.id))).toContain(String(mainDocID))
    })

    test('should store deletion state only in the delete change', async () => {
      await payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug })

      const rawReq = await createPayloadRequest({ branch: false, payload })
      const tombstone = await payload.db.findOne({
        branch: false,
        collection: postsSlug,
        req: rawReq,
        where: {
          and: [{ _branch: { equals: 'cow' } }, { _branchDocID: { equals: mainDocID } }],
        },
      })

      const onBranch = await payload.findByID({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        disableErrors: true,
      })
      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(tombstone).not.toHaveProperty('_branchOp')
      expect(onBranch).toBeNull()
      expect(onMain.title).toBe('original on main')
    })

    test('should record the delete in the changeset registry', async () => {
      await payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'cow' } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]).toMatchObject({ operation: 'delete' })
    })

    test('should hard-delete a document created on the same branch', async () => {
      const created = await payload.create({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'created then deleted on branch' },
      })

      await payload.delete({ id: created.id, branch: 'cow', collection: postsSlug })

      const rows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: created.id } },
      })

      expect(rows.docs).toHaveLength(0)
    })

    test('should use the create change to hard-delete a branch-created document', async () => {
      const created = await payload.create({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'created then deleted by change operation' },
      })
      const rawReq = await createPayloadRequest({ branch: false, payload })

      await payload.delete({ id: created.id, branch: 'cow', collection: postsSlug })

      const rows = await payload.db.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        req: rawReq,
        where: { id: { equals: created.id } },
      })
      const changes = await payload.db.find({
        collection: branchChangesSlug,
        pagination: false,
        req: rawReq,
        where: { documentID: { equals: String(created.id) } },
      })

      expect(rows.docs).toHaveLength(0)
      expect(changes.docs).toHaveLength(0)
    })

    test('should use the update change to tombstone an edited main document', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited before delete' },
      })

      const rawReq = await createPayloadRequest({ branch: false, payload })
      await payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug })

      const onBranch = await payload.findByID({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        disableErrors: true,
      })
      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })
      const changes = await payload.db.find({
        collection: branchChangesSlug,
        pagination: false,
        req: rawReq,
        where: { documentID: { equals: String(mainDocID) } },
      })

      expect(onBranch).toBeNull()
      expect(onMain.title).toBe('original on main')
      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]).toMatchObject({ operation: 'delete' })
    })

    test('should reject a delete when the branch row has no change record', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'orphaned branch edit' },
      })

      const rawReq = await createPayloadRequest({ branch: false, payload })
      const changes = await payload.db.find({
        collection: branchChangesSlug,
        pagination: false,
        req: rawReq,
        where: { documentID: { equals: String(mainDocID) } },
      })

      await payload.db.deleteOne({
        collection: branchChangesSlug,
        req: rawReq,
        where: { id: { equals: changes.docs[0]!.id } },
      })

      await expect(
        payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug }),
      ).rejects.toMatchObject({ status: 409 })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })
      const shadows = await payload.db.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        req: rawReq,
        where: {
          and: [{ _branch: { equals: 'cow' } }, { _branchDocID: { equals: mainDocID } }],
        },
      })

      expect(onMain.title).toBe('original on main')
      expect(shadows.docs).toHaveLength(1)
      expect(shadows.docs[0]!.title).toBe('orphaned branch edit')
    })

    test('should reject an update when the branch row has no change record', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'orphaned branch edit' },
      })

      const rawReq = await createPayloadRequest({ branch: false, payload })
      const changes = await payload.db.find({
        collection: branchChangesSlug,
        pagination: false,
        req: rawReq,
        where: { documentID: { equals: String(mainDocID) } },
      })

      await payload.db.deleteOne({
        collection: branchChangesSlug,
        req: rawReq,
        where: { id: { equals: changes.docs[0]!.id } },
      })

      await expect(
        payload.update({
          id: mainDocID,
          branch: 'cow',
          collection: postsSlug,
          data: { title: 'second branch edit' },
        }),
      ).rejects.toMatchObject({ status: 409 })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })
      const shadows = await payload.db.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        req: rawReq,
        where: {
          and: [{ _branch: { equals: 'cow' } }, { _branchDocID: { equals: mainDocID } }],
        },
      })

      expect(onMain.title).toBe('original on main')
      expect(shadows.docs).toHaveLength(1)
      expect(shadows.docs[0]!.title).toBe('orphaned branch edit')
    })

    test('should allow the same unique value on two different branches', async () => {
      const onMain = await payload.create({
        collection: uniqueSlug,
        data: { slug: 'shared' },
      })

      // The unique index is rewritten to `(slug, _branch)`, so each branch may hold
      // its own document claiming the value while main still holds one too.
      const onCow = await payload.create({
        branch: 'cow',
        collection: uniqueSlug,
        data: { slug: 'shared' },
      })
      const onQ4 = await payload.create({
        branch: 'q4',
        collection: uniqueSlug,
        data: { slug: 'shared' },
      })

      expect(String(onCow.id)).not.toBe(String(onMain.id))
      expect(String(onQ4.id)).not.toBe(String(onMain.id))

      // Still enforced within a single branch.
      await expect(
        payload.create({ branch: 'cow', collection: uniqueSlug, data: { slug: 'shared' } }),
      ).rejects.toThrow()

      for (const id of [onMain.id, onCow.id, onQ4.id]) {
        await payload.delete({ id, branch: false, collection: uniqueSlug })
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { collectionSlug: { equals: uniqueSlug } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    test('should enforce localized uniqueness per locale and branch', async () => {
      const onMain = await payload.create({
        collection: uniqueSlug,
        data: { localizedSlug: 'localized-shared' },
        locale: 'en',
      })

      await payload.update({
        id: onMain.id,
        collection: uniqueSlug,
        data: { localizedSlug: 'main-spanish' },
        locale: 'es',
      })

      const onCow = await payload.create({
        branch: 'cow',
        collection: uniqueSlug,
        data: { localizedSlug: 'localized-shared' },
        locale: 'en',
      })

      await expect(
        payload.create({
          collection: uniqueSlug,
          data: { localizedSlug: 'localized-shared' },
          locale: 'en',
        }),
      ).rejects.toThrow()
      await expect(
        payload.create({
          branch: 'cow',
          collection: uniqueSlug,
          data: { localizedSlug: 'localized-shared' },
          locale: 'en',
        }),
      ).rejects.toThrow()

      for (const id of [onMain.id, onCow.id]) {
        await payload.delete({ id, branch: false, collection: uniqueSlug })
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { collectionSlug: { equals: uniqueSlug } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    test('should allow a nested unique value on main and a branch', async () => {
      const onMain = await payload.create({
        collection: uniqueSlug,
        data: { metadata: { code: 'nested-shared' } },
      })
      const onBranch = await payload.create({
        branch: 'cow',
        collection: uniqueSlug,
        data: { metadata: { code: 'nested-shared' } },
      })

      expect(String(onBranch.id)).not.toBe(String(onMain.id))

      for (const id of [onMain.id, onBranch.id]) {
        await payload.delete({ id, branch: false, collection: uniqueSlug })
      }
    })

    test('should reject a duplicate nested unique value within one branch', async () => {
      const first = await payload.create({
        branch: 'cow',
        collection: uniqueSlug,
        data: { metadata: { code: 'nested-duplicate' } },
      })

      await expect(
        payload.create({
          branch: 'cow',
          collection: uniqueSlug,
          data: { metadata: { code: 'nested-duplicate' } },
        }),
      ).rejects.toThrow()

      await payload.delete({ id: first.id, branch: false, collection: uniqueSlug })
    })

    test('should allow a custom compound value on main and a branch', async () => {
      const onMain = await payload.create({
        collection: uniqueSlug,
        data: { customSlug: 'shared', site: 'example' },
      })
      const onBranch = await payload.create({
        branch: 'cow',
        collection: uniqueSlug,
        data: { customSlug: 'shared', site: 'example' },
      })

      expect(String(onBranch.id)).not.toBe(String(onMain.id))

      for (const id of [onMain.id, onBranch.id]) {
        await payload.delete({ id, branch: false, collection: uniqueSlug })
      }
    })

    test('should reject a duplicate custom compound value within one branch', async () => {
      const first = await payload.create({
        branch: 'cow',
        collection: uniqueSlug,
        data: { customSlug: 'duplicate', site: 'example' },
      })

      await expect(
        payload.create({
          branch: 'cow',
          collection: uniqueSlug,
          data: { customSlug: 'duplicate', site: 'example' },
        }),
      ).rejects.toThrow()

      await payload.delete({ id: first.id, branch: false, collection: uniqueSlug })
    })
  })
})

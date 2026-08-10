import type { Payload, SanitizedCollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import {
  branchChangesSlug,
  branchesSlug,
  excludedSlug,
  numericIDSlug,
  pagesSlug,
  postsSlug,
  uniqueSlug,
} from './shared.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const fieldNames = (collection: SanitizedCollectionConfig): string[] =>
  collection.flattenedFields.map((field) => field.name)

const collectionConfig = (slug: string): SanitizedCollectionConfig =>
  payload.collections[slug]!.config

describe('Branching', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('Schema', () => {
    it('should inject branch fields into a branch-enabled collection', () => {
      const names = fieldNames(collectionConfig(postsSlug))

      expect(names).toContain('_branch')
      expect(names).toContain('_branchDocID')
      expect(names).toContain('_branchOp')
    })

    it('should not inject branch fields into a collection opted out with branching: false', () => {
      const names = fieldNames(collectionConfig(excludedSlug))

      expect(names).not.toContain('_branch')
      expect(names).not.toContain('_branchDocID')
      expect(names).not.toContain('_branchOp')
    })

    it('should not inject branch fields into auth collections by default', () => {
      const names = fieldNames(collectionConfig('users'))

      expect(names).not.toContain('_branch')
    })

    it('should not inject branch fields into built-in Payload collections by default', () => {
      const names = fieldNames(collectionConfig('payload-preferences'))

      expect(names).not.toContain('_branch')
    })

    it('should default _branch to the main sentinel rather than null', () => {
      const branchField = collectionConfig(postsSlug).flattenedFields.find(
        (field) => field.name === '_branch',
      )

      expect(branchField).toMatchObject({ type: 'text', defaultValue: 'main' })
    })

    it('should type _branchDocID as a self-referential relationship so it inherits the ID type', () => {
      const docIDField = collectionConfig(numericIDSlug).flattenedFields.find(
        (field) => field.name === '_branchDocID',
      )

      expect(docIDField).toMatchObject({ type: 'relationship', relationTo: numericIDSlug })
    })

    it('should rewrite a unique field into a branch-scoped compound index', () => {
      const config = collectionConfig(uniqueSlug)
      const slugField = config.flattenedFields.find((field) => field.name === 'slug')

      expect(slugField).toMatchObject({ unique: false })
      expect(config.sanitizedIndexes).toContainEqual(
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({ path: 'slug' }),
            expect.objectContaining({ path: '_branch' }),
          ]),
          unique: true,
        }),
      )
    })
  })

  describe('Writes on main', () => {
    const createdIDs: (number | string)[] = []

    afterAll(async () => {
      for (const id of createdIDs) {
        await payload.delete({ collection: postsSlug, id })
      }
      createdIDs.length = 0
    })

    it('should stamp documents created without a branch as main', async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'on main' },
      })
      createdIDs.push(doc.id)

      const raw = await payload.db.findOne({
        collection: postsSlug,
        where: { id: { equals: doc.id } },
      })

      expect(raw?._branch).toBe('main')
    })

    it('should still enforce uniqueness within a branch after the index rewrite', async () => {
      const first = await payload.create({
        collection: uniqueSlug,
        data: { slug: 'about' },
      })

      await expect(
        payload.create({ collection: uniqueSlug, data: { slug: 'about' } }),
      ).rejects.toThrow()

      await payload.delete({ collection: uniqueSlug, id: first.id })
    })
  })

  /**
   * Remaining matrix from CONTENT_BRANCHING_PLAN.md §20. Declared here so the
   * suite is a complete map of the work rather than only of what exists.
   *
   * Everything below requires machinery not yet built: the internal branch
   * collections, `req.branch` resolution, the change manifest, the predicate
   * wired into the adapters, and copy-on-write writes.
   */
  describe('Read path — documents created on a branch', () => {
    const mainIDs: (number | string)[] = []
    const branchIDs: (number | string)[] = []

    beforeAll(async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Halloween', slug: 'halloween' },
      })
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Q4 Launch', slug: 'q4' },
      })

      for (let i = 0; i < 25; i++) {
        const doc = await payload.create({
          collection: postsSlug,
          data: { order: i, title: `main post ${i}` },
        })
        mainIDs.push(doc.id)
      }

      for (let i = 0; i < 5; i++) {
        const doc = await payload.create({
          branch: 'halloween',
          collection: postsSlug,
          data: { order: 100 + i, title: `halloween post ${i}` },
        })
        branchIDs.push(doc.id)
      }
    })

    afterAll(async () => {
      for (const id of [...mainIDs, ...branchIDs]) {
        await payload.delete({ branch: false, collection: postsSlug, id })
      }
      mainIDs.length = 0
      branchIDs.length = 0
    })

    it('should hide a document created on a branch from main', async () => {
      const result = await payload.find({ collection: postsSlug, pagination: false })
      const ids = result.docs.map((doc) => doc.id)

      expect(ids).toHaveLength(25)
      for (const branchID of branchIDs) {
        expect(ids).not.toContain(branchID)
      }
    })

    it('should return a document created on a branch when reading that branch', async () => {
      const result = await payload.find({
        branch: 'halloween',
        collection: postsSlug,
        pagination: false,
      })
      const ids = result.docs.map((doc) => doc.id)

      expect(ids).toHaveLength(30)
      for (const branchID of branchIDs) {
        expect(ids).toContain(branchID)
      }
    })

    it('should isolate two concurrent branches from each other', async () => {
      const result = await payload.find({
        branch: 'q4',
        collection: postsSlug,
        pagination: false,
      })
      const ids = result.docs.map((doc) => doc.id)

      expect(ids).toHaveLength(25)
      for (const branchID of branchIDs) {
        expect(ids).not.toContain(branchID)
      }
    })

    /**
     * The load-bearing test for the whole design. If the branch predicate were
     * applied after the query rather than inside it, totalDocs and page
     * boundaries would both be wrong and no post-processing could fix them.
     */
    it('should keep pagination and totalDocs correct on main', async () => {
      const page1 = await payload.find({ collection: postsSlug, limit: 10, page: 1 })

      expect(page1.totalDocs).toBe(25)
      expect(page1.totalPages).toBe(3)
      expect(page1.docs).toHaveLength(10)
    })

    it('should keep pagination and totalDocs correct on a branch', async () => {
      const page1 = await payload.find({
        branch: 'halloween',
        collection: postsSlug,
        limit: 10,
        page: 1,
      })

      expect(page1.totalDocs).toBe(30)
      expect(page1.totalPages).toBe(3)
      expect(page1.docs).toHaveLength(10)
    })

    it('should not return the same document on two pages of a branch read', async () => {
      const seen = new Set<number | string>()

      for (const page of [1, 2, 3]) {
        const result = await payload.find({
          branch: 'halloween',
          collection: postsSlug,
          limit: 10,
          page,
          sort: 'order',
        })

        for (const doc of result.docs) {
          expect(seen.has(doc.id)).toBe(false)
          seen.add(doc.id)
        }
      }

      expect(seen.size).toBe(30)
    })

    it('should agree between count and find on a branch', async () => {
      const counted = await payload.count({ branch: 'halloween', collection: postsSlug })
      const found = await payload.find({
        branch: 'halloween',
        collection: postsSlug,
        pagination: false,
      })

      expect(counted.totalDocs).toBe(found.docs.length)
      expect(counted.totalDocs).toBe(30)
    })

    it('should record branch-created documents in the changeset registry', async () => {
      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'halloween' } },
      })

      expect(changes.docs).toHaveLength(5)
      expect(changes.docs[0]).toMatchObject({
        collectionSlug: postsSlug,
        entityType: 'collection',
        operation: 'create',
      })
    })

    it('should leave a branching-disabled collection unaffected by branch context', async () => {
      const doc = await payload.create({
        branch: 'halloween',
        collection: excludedSlug,
        data: { title: 'excluded' },
      })

      const fromMain = await payload.find({ collection: excludedSlug, pagination: false })

      expect(fromMain.docs.map((each) => each.id)).toContain(doc.id)

      await payload.delete({ collection: excludedSlug, id: doc.id })
    })

    it.todo('should hide a document deleted on a branch, leaving main and other branches intact')
    it.todo('should filter on a branch-modified field using the branch value')
    it.todo('should sort on a branch-modified field using the branch value')
    it.todo('should resolve findByID by canonical ID to branch content on a branch')
    it.todo('should populate relationships to the branch version of the related document')
    it.todo('should leave query shapes unchanged when branching is disabled')
  })

  describe('Branch resolution', () => {
    it.todo(
      'should resolve the branch identically via Local API arg, query param, header and cookie',
    )
    it.todo('should error rather than fall back to main when the branch is unreadable')
    it.todo('should always resolve req.user from main, even on a branch')
  })

  describe('Write path — copy-on-write updates', () => {
    let mainDocID: number | string
    const cleanup: (number | string)[] = []

    beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'cow' } },
      })

      if (!existing.docs.length) {
        await payload.create({ collection: branchesSlug, data: { name: 'COW', slug: 'cow' } })
      }
    })

    beforeEach(async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { order: 1, title: 'original on main' },
      })
      mainDocID = doc.id
      cleanup.push(doc.id)
    })

    afterEach(async () => {
      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { _branch: { not_equals: 'main' } },
      })

      for (const shadow of shadows.docs) {
        await payload.delete({ branch: false, collection: postsSlug, id: shadow.id })
      }

      for (const id of cleanup) {
        await payload.delete({ branch: false, collection: postsSlug, id })
      }
      cleanup.length = 0

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'cow' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ collection: branchChangesSlug, id: change.id })
      }
    })

    it('should leave the main document untouched when updating on a branch', async () => {
      await payload.update({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
        id: mainDocID,
      })

      const onMain = await payload.findByID({ collection: postsSlug, id: mainDocID })

      expect(onMain.title).toBe('original on main')
    })

    it('should create exactly one shadow row on first branch edit', async () => {
      await payload.update({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
        id: mainDocID,
      })

      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { _branch: { equals: 'cow' } },
      })

      expect(shadows.docs).toHaveLength(1)
      expect(shadows.docs[0]).toMatchObject({ _branchOp: 'update', title: 'edited on branch' })
      expect(String(shadows.docs[0]!._branchDocID)).toBe(String(mainDocID))
    })

    it('should reuse the existing shadow row on subsequent branch edits', async () => {
      await payload.update({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'first branch edit' },
        id: mainDocID,
      })
      await payload.update({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'second branch edit' },
        id: mainDocID,
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

    it('should return branch content when reading the branch by canonical ID', async () => {
      await payload.update({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
        id: mainDocID,
      })

      const onBranch = await payload.findByID({
        branch: 'cow',
        collection: postsSlug,
        id: mainDocID,
      })

      expect(onBranch.title).toBe('edited on branch')
      expect(String(onBranch.id)).toBe(String(mainDocID))
    })

    it('should not double-count a document edited on a branch', async () => {
      await payload.update({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
        id: mainDocID,
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

    it('should filter on a branch-modified field using the branch value', async () => {
      await payload.update({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'Halloween Sale' },
        id: mainDocID,
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

    it('should record the update in the changeset registry', async () => {
      await payload.update({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
        id: mainDocID,
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'cow' } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]).toMatchObject({ collectionSlug: postsSlug, operation: 'update' })
    })

    it('should tombstone rather than delete when deleting a main document on a branch', async () => {
      await payload.delete({ branch: 'cow', collection: postsSlug, id: mainDocID })

      const stillOnMain = await payload.findByID({ collection: postsSlug, id: mainDocID })

      expect(stillOnMain.title).toBe('original on main')
    })

    it('should hide a document deleted on a branch from that branch only', async () => {
      await payload.delete({ branch: 'cow', collection: postsSlug, id: mainDocID })

      const onBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
      })
      const onMain = await payload.find({ collection: postsSlug, pagination: false })

      expect(onBranch.docs.map((doc) => String(doc.id))).not.toContain(String(mainDocID))
      expect(onMain.docs.map((doc) => String(doc.id))).toContain(String(mainDocID))
    })

    it('should record the delete in the changeset registry', async () => {
      await payload.delete({ branch: 'cow', collection: postsSlug, id: mainDocID })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'cow' } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]).toMatchObject({ operation: 'delete' })
    })

    it('should hard-delete a document created on the same branch', async () => {
      const created = await payload.create({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'created then deleted on branch' },
      })

      await payload.delete({ branch: 'cow', collection: postsSlug, id: created.id })

      const rows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: created.id } },
      })

      expect(rows.docs).toHaveLength(0)
    })
    it.todo('should allow the same unique value on two different branches')
  })

  describe('Drafts and publishing on a branch', () => {
    let pageID: number | string
    const cleanup: (number | string)[] = []

    beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'draftwork' } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Draft work', slug: 'draftwork' },
        })
      }
    })

    beforeEach(async () => {
      const page = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'published on main' },
      })
      pageID = page.id
      cleanup.push(page.id)
    })

    afterEach(async () => {
      const shadows = await payload.find({
        branch: false,
        collection: pagesSlug,
        pagination: false,
        where: { _branch: { not_equals: 'main' } },
      })

      for (const shadow of shadows.docs) {
        await payload.delete({ branch: false, collection: pagesSlug, id: shadow.id })
      }

      for (const id of cleanup) {
        await payload.delete({ branch: false, collection: pagesSlug, id })
      }
      cleanup.length = 0

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'draftwork' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ collection: branchChangesSlug, id: change.id })
      }
    })

    it('should hide a draft saved on a branch from main', async () => {
      await payload.update({
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
        id: pageID,
      })

      const mainDraft = await payload.findByID({
        collection: pagesSlug,
        draft: true,
        id: pageID,
      })

      expect(mainDraft.title).toBe('published on main')
    })

    it('should return the branch draft when reading drafts on the branch', async () => {
      await payload.update({
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
        id: pageID,
      })

      const branchDraft = await payload.findByID({
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
        id: pageID,
      })

      expect(branchDraft.title).toBe('draft on branch')
    })

    it('should not publish on main when publishing on a branch', async () => {
      await payload.update({
        branch: 'draftwork',
        collection: pagesSlug,
        data: { _status: 'published', title: 'published on branch' },
        id: pageID,
      })

      const onMain = await payload.findByID({ collection: pagesSlug, id: pageID })
      const onBranch = await payload.findByID({
        branch: 'draftwork',
        collection: pagesSlug,
        id: pageID,
      })

      expect(onMain.title).toBe('published on main')
      expect(onBranch.title).toBe('published on branch')
    })

    it('should keep version history isolated per branch', async () => {
      await payload.update({
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
        id: pageID,
      })

      const mainVersions = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })

      for (const version of mainVersions.docs) {
        expect(version.version.title).not.toBe('draft on branch')
      }
    })

    it('should list drafts on a branch without duplicating the main document', async () => {
      await payload.update({
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
        id: pageID,
      })

      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
        pagination: false,
      })

      const matching = onBranch.docs.filter((doc) => String(doc.id) === String(pageID))

      expect(matching).toHaveLength(1)
      expect(matching[0]!.title).toBe('draft on branch')
    })

    it.todo('should fork from main latest version, not the published row')
  })

  describe('Globals', () => {
    it.todo('should leave main untouched when editing a global on a branch')
    it.todo('should read through to main for a global never edited on the branch')
    it.todo('should not clear main latest flag when saving a global draft on a branch')
  })

  describe('Joins', () => {
    it.todo('should include branch-created documents in a join field on that branch')
    it.todo('should exclude branch-deleted documents from a join field on that branch')
  })

  describe('Access', () => {
    it.todo('should allow publishing on a branch when it is denied on main')
    it.todo('should block merge per-document when the merger lacks publish access')
    it.todo('should return dryRun preflight without mutating anything')
  })

  describe('Merge', () => {
    it.todo('should apply only the selected changes and leave the rest on an open branch')
    it.todo('should re-run before and after hooks on merge')
    it.todo('should target main rather than the branch when writing')
    it.todo('should preserve inbound relationship rows when merging a branch-created document')
    it.todo('should warn on broken references when discarding a referenced branch-created document')
  })
})

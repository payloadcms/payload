import type { Payload, SanitizedCollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import {
  branchChangesSlug,
  branchesSlug,
  excludedSlug,
  numericIDSlug,
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

  describe('Write path', () => {
    it.todo('should copy-on-write a main document into a shadow row on first branch edit')
    it.todo('should reuse the existing shadow row on subsequent branch edits')
    it.todo(
      'should write a tombstone rather than deleting when deleting a main document on a branch',
    )
    it.todo('should hard-delete when deleting a document that was created on the same branch')
    it.todo('should allow the same unique value on two different branches')
  })

  describe('Drafts', () => {
    it.todo('should hide a draft saved on a branch from main find({ draft: true })')
    it.todo('should not publish on main when publishing on a branch')
    it.todo('should keep version history isolated per branch')
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

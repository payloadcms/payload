import type { Payload, SanitizedCollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { hookSpy } from './hookSpy.js'
import {
  branchChangesSlug,
  branchesSlug,
  categoriesSlug,
  excludedSlug,
  headerGlobalSlug,
  homepageGlobalSlug,
  numericIDSlug,
  pagesSlug,
  postsSlug,
  restrictedSlug,
  uniqueSlug,
  whereAccessSlug,
} from './shared.js'

let payload: Payload
let restClient: NextRESTClient
let token: string

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const fieldNames = (collection: SanitizedCollectionConfig): string[] =>
  collection.flattenedFields.map((field) => field.name)

const collectionConfig = (slug: string): SanitizedCollectionConfig =>
  payload.collections[slug]!.config

describe('Branching', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    const login = await restClient
      .POST('/users/login', {
        body: JSON.stringify({ email: devUser.email, password: devUser.password }),
      })
      .then((res) => res.json())

    token = login.token
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
    beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'globalwork' } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Global work', slug: 'globalwork' },
        })
      }

      await payload.updateGlobal({
        data: { navLabel: 'main nav' },
        slug: headerGlobalSlug,
      })
    })

    it('should leave main untouched when editing a global on a branch', async () => {
      await payload.updateGlobal({
        branch: 'globalwork',
        data: { navLabel: 'branch nav' },
        slug: headerGlobalSlug,
      })

      const onMain = await payload.findGlobal({ slug: headerGlobalSlug })

      expect(onMain.navLabel).toBe('main nav')
    })

    it('should return the branch version when reading the global on that branch', async () => {
      await payload.updateGlobal({
        branch: 'globalwork',
        data: { navLabel: 'branch nav' },
        slug: headerGlobalSlug,
      })

      const onBranch = await payload.findGlobal({
        branch: 'globalwork',
        slug: headerGlobalSlug,
      })

      expect(onBranch.navLabel).toBe('branch nav')
    })

    it('should read through to main for a global never edited on the branch', async () => {
      const onOtherBranch = await payload.findGlobal({
        branch: 'halloween',
        slug: headerGlobalSlug,
      })

      expect(onOtherBranch.navLabel).toBe('main nav')
    })

    it('should keep two branches independent for the same global', async () => {
      await payload.updateGlobal({
        branch: 'globalwork',
        data: { navLabel: 'globalwork nav' },
        slug: headerGlobalSlug,
      })
      await payload.updateGlobal({
        branch: 'q4',
        data: { navLabel: 'q4 nav' },
        slug: headerGlobalSlug,
      })

      const a = await payload.findGlobal({ branch: 'globalwork', slug: headerGlobalSlug })
      const b = await payload.findGlobal({ branch: 'q4', slug: headerGlobalSlug })
      const main = await payload.findGlobal({ slug: headerGlobalSlug })

      expect(a.navLabel).toBe('globalwork nav')
      expect(b.navLabel).toBe('q4 nav')
      expect(main.navLabel).toBe('main nav')
    })

    /**
     * The corruption case. Global versions have no `parent` to scope `latest`
     * by, and the clearing statement in `createGlobalVersion` is unscoped — so
     * without a branch-scoped fix, saving a draft of a global on a branch
     * silently clears main's latest flag and main loses its draft.
     */
    it('should not clear main latest version flag when saving a global draft on a branch', async () => {
      await payload.updateGlobal({
        data: { _status: 'published', heroTitle: 'published on main' },
        slug: homepageGlobalSlug,
      })
      await payload.updateGlobal({
        data: { heroTitle: 'main draft' },
        draft: true,
        slug: homepageGlobalSlug,
      })

      await payload.updateGlobal({
        branch: 'globalwork',
        data: { heroTitle: 'branch draft' },
        draft: true,
        slug: homepageGlobalSlug,
      })

      const mainLatest = await payload.findGlobalVersions({
        pagination: false,
        slug: homepageGlobalSlug,
        where: { and: [{ latest: { equals: true } }, { _branch: { equals: 'main' } }] },
      })

      expect(mainLatest.docs).toHaveLength(1)
      expect(mainLatest.docs[0]!.version.heroTitle).toBe('main draft')
    })

    it('should hide a global draft saved on a branch from main', async () => {
      await payload.updateGlobal({
        branch: 'globalwork',
        data: { heroTitle: 'branch draft only' },
        draft: true,
        slug: homepageGlobalSlug,
      })

      const mainDraft = await payload.findGlobal({
        draft: true,
        slug: homepageGlobalSlug,
      })

      expect(mainDraft.heroTitle).not.toBe('branch draft only')
    })
  })

  describe('Joins', () => {
    let categoryID: number | string
    let mainPostID: number | string
    let branchPostID: number | string

    beforeEach(async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Join work', slug: 'joinwork' },
      })

      const category = await payload.create({
        collection: categoriesSlug,
        data: { name: 'News' },
      })
      categoryID = category.id

      const mainPost = await payload.create({
        collection: postsSlug,
        data: { category: categoryID, title: 'main post' },
      })
      mainPostID = mainPost.id

      const branchPost = await payload.create({
        branch: 'joinwork',
        collection: postsSlug,
        data: { category: categoryID, title: 'branch post' },
      })
      branchPostID = branchPost.id
    })

    afterEach(async () => {
      for (const slug of [postsSlug, categoriesSlug]) {
        const rows = await payload.find({ branch: false, collection: slug, pagination: false })

        for (const row of rows.docs) {
          await payload.delete({ branch: false, collection: slug, id: row.id })
        }
      }

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const rows = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'joinwork' } },
        })

        for (const row of rows.docs) {
          await payload.delete({ collection, id: row.id })
        }
      }
    })

    it('should exclude branch-created documents from a join read on main', async () => {
      const onMain = await payload.findByID({ collection: categoriesSlug, id: categoryID })
      const ids = (onMain.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))

      expect(ids).toContain(String(mainPostID))
      expect(ids).not.toContain(String(branchPostID))
    })

    it('should include branch-created documents in a join read on that branch', async () => {
      const onBranch = await payload.findByID({
        branch: 'joinwork',
        collection: categoriesSlug,
        id: categoryID,
      })
      const ids = (onBranch.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))

      expect(ids).toContain(String(mainPostID))
      expect(ids).toContain(String(branchPostID))
    })

    it('should exclude branch-deleted documents from a join read on that branch', async () => {
      await payload.delete({ branch: 'joinwork', collection: postsSlug, id: mainPostID })

      const onBranch = await payload.findByID({
        branch: 'joinwork',
        collection: categoriesSlug,
        id: categoryID,
      })
      const onMain = await payload.findByID({ collection: categoriesSlug, id: categoryID })

      const branchIDs = (onBranch.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))
      const mainIDs = (onMain.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))

      expect(branchIDs).not.toContain(String(mainPostID))
      expect(mainIDs).toContain(String(mainPostID))
    })

    it('should not surface a shadow row as a separate join entry', async () => {
      await payload.update({
        branch: 'joinwork',
        collection: postsSlug,
        data: { title: 'edited on branch' },
        id: mainPostID,
      })

      const onBranch = await payload.findByID({
        branch: 'joinwork',
        collection: categoriesSlug,
        id: categoryID,
      })
      const ids = (onBranch.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))

      expect(ids.filter((id) => id === String(mainPostID))).toHaveLength(1)
    })
  })

  describe('Merge access preflight', () => {
    let editorID: number | string
    let restrictedID: number | string
    let allowedID: number | string
    let deniedID: number | string

    beforeEach(async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Access work', slug: 'accesswork' },
      })

      const editor = await payload.create({
        collection: 'users',
        data: { email: 'editor@example.com', password: 'test' },
      })
      editorID = editor.id

      const restricted = await payload.create({
        collection: restrictedSlug,
        data: { title: 'restricted on main' },
      })
      restrictedID = restricted.id

      const allowed = await payload.create({
        collection: whereAccessSlug,
        data: { mergeable: true, title: 'allowed on main' },
      })
      allowedID = allowed.id

      const denied = await payload.create({
        collection: whereAccessSlug,
        data: { mergeable: false, title: 'denied on main' },
      })
      deniedID = denied.id

      for (const [collection, id] of [
        [restrictedSlug, restrictedID],
        [whereAccessSlug, allowedID],
        [whereAccessSlug, deniedID],
      ] as const) {
        await payload.update({
          branch: 'accesswork',
          collection,
          data: { title: 'edited on branch' },
          id,
        })
      }
    })

    afterEach(async () => {
      for (const slug of [restrictedSlug, whereAccessSlug]) {
        const rows = await payload.find({ branch: false, collection: slug, pagination: false })

        for (const row of rows.docs) {
          await payload.delete({ branch: false, collection: slug, id: row.id })
        }
      }

      await payload.delete({ collection: 'users', id: editorID })

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const rows = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'accesswork' } },
        })

        for (const row of rows.docs) {
          await payload.delete({ collection, id: row.id })
        }
      }
    })

    const asEditor = async () =>
      (
        await payload.find({
          collection: 'users',
          pagination: false,
          where: { id: { equals: editorID } },
        })
      ).docs[0]

    it('should block a document the merging user cannot update', async () => {
      const result = await payload.branches.merge({
        branch: 'accesswork',
        dryRun: true,
        overrideAccess: false,
        user: (await asEditor()) as never,
      })

      const blocked = result.blocked.find((each) => String(each.docID) === String(restrictedID))

      expect(blocked).toBeDefined()
      expect(blocked!.operation).toBe('update')
      expect(blocked!.reason).toBe('access')
      expect(blocked!.collectionSlug).toBe(restrictedSlug)
      expect(blocked!.message).toContain(restrictedSlug)
    })

    it('should allow the same document for a user who does have access', async () => {
      const result = await payload.branches.merge({
        branch: 'accesswork',
        dryRun: true,
        overrideAccess: false,
        user: (
          await payload.find({
            collection: 'users',
            pagination: false,
            where: { email: { equals: devUser.email } },
          })
        ).docs[0] as never,
      })

      expect(result.blocked.map((each) => String(each.docID))).not.toContain(String(restrictedID))
    })

    it('should resolve Where-returning access per document', async () => {
      const result = await payload.branches.merge({
        branch: 'accesswork',
        dryRun: true,
        overrideAccess: false,
        user: (await asEditor()) as never,
      })

      const blockedIDs = result.blocked.map((each) => String(each.docID))

      expect(blockedIDs).toContain(String(deniedID))
      expect(blockedIDs).not.toContain(String(allowedID))
    })

    it('should exclude blocked documents from mergeable rather than failing the whole merge', async () => {
      const result = await payload.branches.merge({
        branch: 'accesswork',
        dryRun: true,
        overrideAccess: false,
        user: (await asEditor()) as never,
      })

      const mergeableIDs = result.mergeable.map((each) => String(each.docID))

      expect(mergeableIDs).toContain(String(allowedID))
      expect(mergeableIDs).not.toContain(String(restrictedID))
      expect(result.canMerge).toBe(true)
    })

    it('should apply only the permitted changes and leave blocked ones on the branch', async () => {
      await payload.branches.merge({
        branch: 'accesswork',
        overrideAccess: false,
        user: (await asEditor()) as never,
      })

      const allowed = await payload.findByID({ collection: whereAccessSlug, id: allowedID })
      const restricted = await payload.findByID({ collection: restrictedSlug, id: restrictedID })
      const remaining = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'accesswork' } },
      })

      expect(allowed.title).toBe('edited on branch')
      expect(restricted.title).toBe('restricted on main')
      expect(remaining.docs.length).toBeGreaterThan(0)
    })

    it('should not mutate anything on a dryRun even when everything is permitted', async () => {
      await payload.branches.merge({ branch: 'accesswork', dryRun: true })

      const restricted = await payload.findByID({ collection: restrictedSlug, id: restrictedID })

      expect(restricted.title).toBe('restricted on main')
    })
  })

  describe('Merge', () => {
    let mainDocID: number | string
    let branchOnlyID: number | string
    const cleanup: (number | string)[] = []

    beforeEach(async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Merge me', slug: 'mergeme' },
      })

      const main = await payload.create({
        collection: postsSlug,
        data: { order: 1, title: 'original on main' },
      })
      mainDocID = main.id
      cleanup.push(main.id)

      const created = await payload.create({
        branch: 'mergeme',
        collection: postsSlug,
        data: { order: 2, title: 'created on branch' },
      })
      branchOnlyID = created.id

      await payload.update({
        branch: 'mergeme',
        collection: postsSlug,
        data: { title: 'edited on branch' },
        id: mainDocID,
      })
    })

    afterEach(async () => {
      const rows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
      })

      for (const row of rows.docs) {
        await payload.delete({ branch: false, collection: postsSlug, id: row.id })
      }
      cleanup.length = 0

      for (const slug of ['mergeme']) {
        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: slug } },
        })

        for (const change of changes.docs) {
          await payload.delete({ collection: branchChangesSlug, id: change.id })
        }

        const branches = await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: slug } },
        })

        for (const branchDoc of branches.docs) {
          await payload.delete({ collection: branchesSlug, id: branchDoc.id })
        }
      }
    })

    it('should report pending changes without mutating anything on dryRun', async () => {
      const result = await payload.branches.merge({ branch: 'mergeme', dryRun: true })

      expect(result.mergeable).toHaveLength(2)

      const onMain = await payload.findByID({ collection: postsSlug, id: mainDocID })

      expect(onMain.title).toBe('original on main')
    })

    it('should apply a branch edit to main', async () => {
      await payload.branches.merge({ branch: 'mergeme' })

      const onMain = await payload.findByID({ collection: postsSlug, id: mainDocID })

      expect(onMain.title).toBe('edited on branch')
    })

    it('should publish a branch-created document to main keeping its ID', async () => {
      await payload.branches.merge({ branch: 'mergeme' })

      const onMain = await payload.findByID({ collection: postsSlug, id: branchOnlyID })

      expect(onMain.title).toBe('created on branch')
      expect(String(onMain.id)).toBe(String(branchOnlyID))
    })

    it('should leave no shadow rows behind after merging', async () => {
      await payload.branches.merge({ branch: 'mergeme' })

      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { _branch: { not_equals: 'main' } },
      })

      expect(shadows.docs).toHaveLength(0)
    })

    it('should mark the branch merged and clear its changeset', async () => {
      await payload.branches.merge({ branch: 'mergeme' })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'mergeme' } },
      })
      const branchDoc = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'mergeme' } },
      })

      expect(changes.docs).toHaveLength(0)
      expect(branchDoc.docs[0]!.status).toBe('merged')
    })

    it('should apply only the selected changes and leave the rest on an open branch', async () => {
      const preflight = await payload.branches.merge({ branch: 'mergeme', dryRun: true })
      const editChange = preflight.mergeable.find(
        (change) => String(change.docID) === String(mainDocID),
      )

      await payload.branches.merge({ branch: 'mergeme', changes: [editChange!.changeID] })

      const onMain = await payload.findByID({ collection: postsSlug, id: mainDocID })
      const remaining = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'mergeme' } },
      })
      const branchDoc = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'mergeme' } },
      })

      expect(onMain.title).toBe('edited on branch')
      expect(remaining.docs).toHaveLength(1)
      expect(branchDoc.docs[0]!.status).toBe('open')
    })

    it('should apply a branch delete to main', async () => {
      await payload.delete({ branch: 'mergeme', collection: postsSlug, id: mainDocID })
      await payload.branches.merge({ branch: 'mergeme' })

      const onMain = await payload.find({
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: mainDocID } },
      })

      expect(onMain.docs).toHaveLength(0)
    })

    it('should warn when main moved after the document was branched', async () => {
      await payload.update({
        collection: postsSlug,
        data: { title: 'changed on main after fork' },
        id: mainDocID,
      })

      const result = await payload.branches.merge({ branch: 'mergeme', dryRun: true })
      const warning = result.warnings.find((each) => each.reason === 'main-moved')

      expect(warning).toBeDefined()
      expect(String(warning!.docID)).toBe(String(mainDocID))
    })

    it('should overwrite main even when main moved after the fork', async () => {
      await payload.update({
        collection: postsSlug,
        data: { title: 'changed on main after fork' },
        id: mainDocID,
      })

      await payload.branches.merge({ branch: 'mergeme' })

      const onMain = await payload.findByID({ collection: postsSlug, id: mainDocID })

      expect(onMain.title).toBe('edited on branch')
    })

    it('should fire afterChange hooks on merge with the right operation', async () => {
      const calls: { operation: string; title: unknown }[] = []

      hookSpy.afterChange = (args) => {
        calls.push({ operation: args.operation, title: args.doc.title })
      }

      await payload.branches.merge({ branch: 'mergeme' })

      hookSpy.afterChange = undefined

      expect(calls.some((c) => c.operation === 'create' && c.title === 'created on branch')).toBe(
        true,
      )
      expect(calls.some((c) => c.operation === 'update' && c.title === 'edited on branch')).toBe(
        true,
      )
    })

    it('should re-run beforeChange hooks on merge', async () => {
      let ran = 0

      hookSpy.beforeChange = () => {
        ran += 1
      }

      await payload.branches.merge({ branch: 'mergeme' })

      hookSpy.beforeChange = undefined

      expect(ran).toBeGreaterThan(0)
    })

    it('should not leave a shadow row behind from the merge writes themselves', async () => {
      await payload.branches.merge({ branch: 'mergeme' })

      const all = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const doc of all.docs) {
        expect(doc._branch).toBe('main')
      }
    })
  })

  describe('Merge REST endpoint', () => {
    let branchID: number | string
    let docID: number | string

    beforeEach(async () => {
      const branchDoc = await payload.create({
        collection: branchesSlug,
        data: { name: 'REST merge', slug: 'restmerge' },
      })
      branchID = branchDoc.id

      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'original on main' },
      })
      docID = doc.id

      await payload.update({
        branch: 'restmerge',
        collection: postsSlug,
        data: { title: 'edited on branch' },
        id: docID,
      })
    })

    afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ branch: false, collection: postsSlug, id: row.id })
      }

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'restmerge' } },
        })

        for (const row of found.docs) {
          await payload.delete({ collection, id: row.id })
        }
      }
    })

    it('should reject an unauthenticated merge', async () => {
      const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
        // NextRESTClient attaches its stored token unless auth is disabled.
        auth: false,
        body: JSON.stringify({}),
      })

      expect([401, 403]).toContain(res.status)

      const onMain = await payload.findByID({ collection: postsSlug, id: docID })

      expect(onMain.title).toBe('original on main')
    })

    it('should report the pending changes on a dryRun without mutating', async () => {
      const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
        body: JSON.stringify({ dryRun: true }),
        headers: { Authorization: `JWT ${token}` },
      })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.mergeable).toHaveLength(1)
      expect(String(data.mergeable[0].docID)).toBe(String(docID))

      const onMain = await payload.findByID({ collection: postsSlug, id: docID })

      expect(onMain.title).toBe('original on main')
    })

    it('should apply the merge when authenticated', async () => {
      const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
        body: JSON.stringify({}),
        headers: { Authorization: `JWT ${token}` },
      })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.merged).toHaveLength(1)

      const onMain = await payload.findByID({ collection: postsSlug, id: docID })

      expect(onMain.title).toBe('edited on branch')
    })

    it('should enforce access as the requesting user rather than overriding it', async () => {
      const editor = await payload.create({
        collection: 'users',
        data: { email: 'resteditor@example.com', password: 'test' },
      })

      const restricted = await payload.create({
        collection: restrictedSlug,
        data: { title: 'restricted on main' },
      })

      await payload.update({
        branch: 'restmerge',
        collection: restrictedSlug,
        data: { title: 'edited on branch' },
        id: restricted.id,
      })

      const login = await restClient
        .POST('/users/login', {
          body: JSON.stringify({ email: 'resteditor@example.com', password: 'test' }),
        })
        .then((res) => res.json())

      const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
        body: JSON.stringify({ dryRun: true }),
        headers: { Authorization: `JWT ${login.token}` },
      })
      const data = await res.json()

      expect(data.blocked.map((each: any) => String(each.docID))).toContain(String(restricted.id))

      const rows = await payload.find({
        branch: false,
        collection: restrictedSlug,
        pagination: false,
      })

      for (const row of rows.docs) {
        await payload.delete({ branch: false, collection: restrictedSlug, id: row.id })
      }

      await payload.delete({ collection: 'users', id: editor.id })
    })

    it('should return 404 for an unknown branch', async () => {
      const res = await restClient.POST(`/${branchesSlug}/999999/merge`, {
        body: JSON.stringify({}),
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(404)
    })
  })
})

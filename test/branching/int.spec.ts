import type { Payload, SanitizedCollectionConfig } from 'payload'

import path from 'path'
import {
  createLocalReq,
  isolateBranchState,
  isolateObjectProperty,
  resolveEffectiveOperations,
} from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { hookSpy } from './hookSpy.js'
import {
  autosaveSlug,
  branchChangesSlug,
  branchesSlug,
  branchMergesSlug,
  categoriesSlug,
  excludedSlug,
  headerGlobalSlug,
  homepageGlobalSlug,
  localizedSlug,
  maxVersionsSlug,
  mediaSlug,
  nestedSlug,
  numericIDSlug,
  pagesSlug,
  postsSlug,
  publicSlug,
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
        await payload.delete({ id, collection: postsSlug })
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

      await payload.delete({ id: first.id, collection: uniqueSlug })
    })
  })

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
        await payload.delete({ id, branch: false, collection: postsSlug })
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

      await payload.delete({ id: doc.id, collection: excludedSlug })
    })

    it.todo('should leave query shapes unchanged when branching is disabled')
  })

  describe('Branch resolution', () => {
    it.todo(
      'should resolve the branch identically via Local API arg, query param and stored preference',
    )
    it.todo('should always resolve req.user from main, even on a branch')
  })

  /**
   * The gaps a coverage audit turned up: behaviours that are implemented and load-bearing
   * but were never asserted, so a regression in any of them would have been silent.
   */
  describe('Audit gaps', () => {
    const branch = 'auditwork'

    beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: branch } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Audit work', slug: branch },
        })
      }
    })

    afterEach(async () => {
      for (const collection of [postsSlug, pagesSlug, categoriesSlug] as const) {
        const rows = await payload.find({ branch: false, collection, pagination: false })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, branch: false, collection }).catch(() => {})
        }
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }
    })

    // `withBranchVersionSelect` is the version-side twin of the collection guard: an
    // include-mode `select` narrows a row to exactly the fields named, which would drop
    // the injected columns the branch predicate and the canonical-ID projection depend
    // on. The three existing select tests all run against a collection with versions
    // off, so this guard was never exercised — and its failure mode is shadow-row
    // primary keys surfacing as document IDs in the admin drafts list.
    it('should keep canonical IDs when selecting fields on a branch drafts read', async () => {
      const doc = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'main title' },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: pagesSlug,
        data: { title: 'branch title' },
        draft: true,
      })

      const drafts = await payload.find({
        branch,
        collection: pagesSlug,
        draft: true,
        pagination: false,
        select: { title: true },
        where: { id: { equals: doc.id } },
      })

      expect(drafts.docs).toHaveLength(1)
      expect(String(drafts.docs[0]!.id)).toBe(String(doc.id))
      expect(drafts.docs[0]!.title).toBe('branch title')
    })

    it('should keep canonical IDs when selecting fields on a branch version read', async () => {
      const doc = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'main title' },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: pagesSlug,
        data: { _status: 'published', title: 'branch title' },
      })

      const versions = await payload.findVersions({
        branch,
        collection: pagesSlug,
        pagination: false,
        select: { parent: true, version: true },
        where: { parent: { equals: doc.id } },
      })

      // Every row reports the canonical parent, not the shadow row it hangs off.
      expect(versions.docs.length).toBeGreaterThan(0)

      for (const version of versions.docs) {
        expect(String(version.parent)).toBe(String(doc.id))
      }
    })

    // The bulk paths are what the admin list view's "edit many" and "delete many" use.
    it('should fork every matching document on a bulk update', async () => {
      const first = await payload.create({ collection: postsSlug, data: { title: 'first' } })
      const second = await payload.create({ collection: postsSlug, data: { title: 'second' } })

      await payload.update({
        branch,
        collection: postsSlug,
        data: { title: 'bulk edited' },
        where: { id: { in: [first.id, second.id] } },
      })

      const onBranch = await payload.find({ branch, collection: postsSlug, pagination: false })
      const onMain = await payload.find({ collection: postsSlug, pagination: false })

      expect(onBranch.docs.map((doc) => doc.title).sort()).toEqual(['bulk edited', 'bulk edited'])
      expect(onMain.docs.map((doc) => doc.title).sort()).toEqual(['first', 'second'])
    })

    it('should tombstone every matching document on a bulk delete', async () => {
      const first = await payload.create({ collection: postsSlug, data: { title: 'first' } })
      const second = await payload.create({ collection: postsSlug, data: { title: 'second' } })

      await payload.delete({
        branch,
        collection: postsSlug,
        where: { id: { in: [first.id, second.id] } },
      })

      const onBranch = await payload.find({ branch, collection: postsSlug, pagination: false })
      const onMain = await payload.find({ collection: postsSlug, pagination: false })

      expect(onBranch.docs).toHaveLength(0)
      expect(onMain.docs.map((doc) => doc.title).sort()).toEqual(['first', 'second'])
    })

    // The plan's own #1 risk. The merge-create promotion updates the shadow row in place
    // rather than recreating it *specifically* so inbound relationship rows survive —
    // deleting the row would cascade them away, and rebuilding it does not bring them
    // back. A regression here silently nulls relationships after a merge.
    it('should preserve inbound relationships when merging a branch-created document', async () => {
      const category = await payload.create({
        branch,
        collection: categoriesSlug,
        data: { name: 'branch category' },
      })

      const post = await payload.create({
        branch,
        collection: postsSlug,
        data: { category: category.id, title: 'points at branch category' },
      })

      await payload.branches.merge({ branch })

      const onMain = await payload.findByID({ id: post.id, collection: postsSlug, depth: 1 })
      const related = onMain.category as { id?: number | string; name?: string } | null

      // Populated, not a bare ID and not null: the relationship row survived the merge.
      expect(related).toBeTruthy()
      expect(typeof related).toBe('object')
      expect(related?.name).toBe('branch category')
    })

    // Plan §15's precedence contract. The general form of the bug this audit started
    // from: the Local API argument and the query param must resolve to the same branch,
    // or one entry point quietly reads production while the other reads the branch.
    it('should resolve the same branch from a Local API argument and a query param', async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'on main' },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: postsSlug,
        data: { title: 'on branch' },
      })

      const viaArgument = await payload.findByID({ id: doc.id, branch, collection: postsSlug })

      const viaQueryParam = await restClient.GET(
        `/${postsSlug}/${doc.id}?branch=${branch}&depth=0`,
        {
          headers: { Authorization: `JWT ${token}` },
        },
      )

      expect(viaArgument.title).toBe('on branch')
      expect((await viaQueryParam.json()).title).toBe(viaArgument.title)
    })
  })

  /**
   * Two shapes the suite could not reach before: a localized field, which forks per
   * locale, and array/block fields, which live in their own tables under Drizzle so a
   * fork has to copy child rows and re-parent them.
   */
  describe('Localized and nested fields', () => {
    const branch = 'shapework'

    beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: branch } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Shape work', slug: branch },
        })
      }
    })

    afterEach(async () => {
      for (const collection of [localizedSlug, nestedSlug] as const) {
        const rows = await payload.find({ branch: false, collection, pagination: false })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, branch: false, collection }).catch(() => {})
        }
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }
    })

    it('should fork one locale and leave the others reading main', async () => {
      const doc = await payload.create({
        collection: localizedSlug,
        data: { _status: 'published', title: 'main english' },
        locale: 'en',
      })

      await payload.update({
        id: doc.id,
        collection: localizedSlug,
        data: { _status: 'published', title: 'main spanish' },
        locale: 'es',
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: localizedSlug,
        data: { _status: 'published', title: 'branch spanish' },
        locale: 'es',
      })

      const branchES = await payload.findByID({
        id: doc.id,
        branch,
        collection: localizedSlug,
        locale: 'es',
      })
      const branchEN = await payload.findByID({
        id: doc.id,
        branch,
        collection: localizedSlug,
        locale: 'en',
      })
      const mainES = await payload.findByID({ id: doc.id, collection: localizedSlug, locale: 'es' })

      expect(branchES.title).toBe('branch spanish')
      // The untouched locale came along in the fork, so it still reads as main's.
      expect(branchEN.title).toBe('main english')
      expect(mainES.title).toBe('main spanish')
    })

    it('should merge a localized edit into the right locale only', async () => {
      const doc = await payload.create({
        collection: localizedSlug,
        data: { _status: 'published', title: 'main english' },
        locale: 'en',
      })

      await payload.update({
        id: doc.id,
        collection: localizedSlug,
        data: { _status: 'published', title: 'main spanish' },
        locale: 'es',
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: localizedSlug,
        data: { _status: 'published', title: 'branch spanish' },
        locale: 'es',
      })

      await payload.branches.merge({ branch })

      const mainES = await payload.findByID({ id: doc.id, collection: localizedSlug, locale: 'es' })
      const mainEN = await payload.findByID({ id: doc.id, collection: localizedSlug, locale: 'en' })

      expect(mainES.title).toBe('branch spanish')
      expect(mainEN.title).toBe('main english')
    })

    it('should fork array and block rows onto the branch', async () => {
      const doc = await payload.create({
        collection: nestedSlug,
        data: {
          items: [{ label: 'main one' }, { label: 'main two' }],
          layout: [{ blockType: 'hero', heading: 'main hero' }],
          title: 'nested on main',
        },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: nestedSlug,
        data: {
          items: [{ label: 'branch one' }],
          layout: [{ blockType: 'hero', heading: 'branch hero' }],
          title: 'nested on branch',
        },
      })

      const onBranch = await payload.findByID({ id: doc.id, branch, collection: nestedSlug })
      const onMain = await payload.findByID({ id: doc.id, collection: nestedSlug })

      // Child rows belong to the copy that owns them: replacing them on the branch must
      // not take main's with it, which is the failure a flat-field test cannot see.
      expect(onBranch.items).toHaveLength(1)
      expect(onBranch.items?.[0]?.label).toBe('branch one')
      expect((onBranch.layout?.[0] as { heading?: string })?.heading).toBe('branch hero')

      expect(onMain.items).toHaveLength(2)
      expect(onMain.items?.map((item) => item.label)).toEqual(['main one', 'main two'])
      expect((onMain.layout?.[0] as { heading?: string })?.heading).toBe('main hero')
    })

    it('should merge array and block rows into main', async () => {
      const doc = await payload.create({
        collection: nestedSlug,
        data: {
          items: [{ label: 'main one' }, { label: 'main two' }],
          layout: [{ blockType: 'hero', heading: 'main hero' }],
          title: 'nested on main',
        },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: nestedSlug,
        data: {
          items: [{ label: 'branch one' }],
          layout: [{ blockType: 'hero', heading: 'branch hero' }],
          title: 'nested on branch',
        },
      })

      await payload.branches.merge({ branch })

      const onMain = await payload.findByID({ id: doc.id, collection: nestedSlug })

      expect(onMain.title).toBe('nested on branch')
      expect(onMain.items).toHaveLength(1)
      expect(onMain.items?.[0]?.label).toBe('branch one')
      expect((onMain.layout?.[0] as { heading?: string })?.heading).toBe('branch hero')
    })
  })

  /**
   * §15's precedence contract, at the point it is easiest to get wrong: an operation handed
   * both a request and a branch. The branch is an argument, so the argument wins — the same
   * contract `locale` has.
   */
  describe('An explicit branch on a shared request', () => {
    const first = 'explicitfirst'
    const second = 'explicitsecond'
    let docID: number | string

    beforeAll(async () => {
      for (const slug of [first, second]) {
        const existing = await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: slug } },
        })

        if (!existing.docs.length) {
          await payload.create({ collection: branchesSlug, data: { name: slug, slug } })
        }
      }
    })

    beforeEach(async () => {
      const doc = await payload.create({ collection: postsSlug, data: { title: 'on main' } })

      docID = doc.id

      for (const [slug, title] of [
        [first, 'on first branch'],
        [second, 'on second branch'],
      ] as const) {
        await payload.update({ id: docID, branch: slug, collection: postsSlug, data: { title } })
      }
    })

    afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug }).catch(() => {})
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { in: [first, second] } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }
    })

    it('should read each branch a request is pointed at, in turn', async () => {
      const req = await createLocalReq({}, payload)

      // The first read resolves and memoizes a branch on this request; the second and third
      // name different ones, and used to be handed the first one's answer.
      const onFirst = await payload.findByID({
        id: docID,
        branch: first,
        collection: postsSlug,
        req,
      })
      const onSecond = await payload.findByID({
        id: docID,
        branch: second,
        collection: postsSlug,
        req,
      })
      const onMain = await payload.findByID({ id: docID, collection: postsSlug, req })

      expect(onFirst.title).toBe('on first branch')
      expect(onSecond.title).toBe('on second branch')
      // No branch named, so this one takes the request as it finds it.
      expect(onMain.title).toBe('on first branch')
    })

    it('should leave the caller request on its own branch', async () => {
      const req = await createLocalReq({ branch: first }, payload)

      await payload.findByID({ id: docID, branch: second, collection: postsSlug, req })

      // The operation ran somewhere else; this request is where it was.
      const after = await payload.findByID({ id: docID, collection: postsSlug, req })

      expect(after.title).toBe('on first branch')
    })

    it('should write to the branch it is told to, not the one the request resolved', async () => {
      const req = await createLocalReq({ branch: first }, payload)

      await payload.findByID({ id: docID, collection: postsSlug, req })

      await payload.update({
        id: docID,
        branch: second,
        collection: postsSlug,
        data: { title: 'written to second' },
        req,
      })

      const onSecond = await payload.findByID({ id: docID, branch: second, collection: postsSlug })
      const onFirst = await payload.findByID({ id: docID, branch: first, collection: postsSlug })
      const onMain = await payload.findByID({ id: docID, collection: postsSlug })

      expect(onSecond.title).toBe('written to second')
      expect(onFirst.title).toBe('on first branch')
      expect(onMain.title).toBe('on main')
    })

    it('should bypass branching when told to, on a branch-scoped request', async () => {
      const req = await createLocalReq({ branch: first }, payload)

      await payload.findByID({ id: docID, collection: postsSlug, req })

      // `branch: false` is the same contract pointed at production — what merge relies on.
      const onMain = await payload.findByID({
        id: docID,
        branch: false,
        collection: postsSlug,
        req,
      })

      expect(onMain.title).toBe('on main')
    })
  })

  /**
   * Depth-populated relationships. The dataloader batches population and caches by a key
   * that did not include the branch, so a document ID could resolve to the wrong branch's
   * copy — and the population read itself has to carry the branch to find a related
   * document that only exists on it.
   */
  describe('Populated relationships on a branch', () => {
    const branch = 'populatework'
    const other = 'populateother'

    beforeAll(async () => {
      for (const slug of [branch, other]) {
        const existing = await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: slug } },
        })

        if (!existing.docs.length) {
          await payload.create({
            collection: branchesSlug,
            data: { name: slug, slug },
          })
        }
      }
    })

    afterEach(async () => {
      for (const collection of [postsSlug, categoriesSlug] as const) {
        const rows = await payload.find({ branch: false, collection, pagination: false })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, branch: false, collection }).catch(() => {})
        }
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { in: [branch, other] } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }
    })

    it('should populate a related document that exists only on the branch', async () => {
      const category = await payload.create({
        branch,
        collection: categoriesSlug,
        data: { name: 'branch only category' },
      })

      const post = await payload.create({
        branch,
        collection: postsSlug,
        data: { category: category.id, title: 'points at branch-only category' },
      })

      const onBranch = await payload.findByID({
        id: post.id,
        branch,
        collection: postsSlug,
        depth: 1,
      })

      // Populated, not left as a bare ID: the population read carried the branch, so it
      // could see a document main has never heard of.
      expect(typeof onBranch.category).toBe('object')
      expect((onBranch.category as { name?: string })?.name).toBe('branch only category')
    })

    it('should populate the branch copy of a document that also exists on main', async () => {
      const category = await payload.create({
        collection: categoriesSlug,
        data: { name: 'main category' },
      })

      await payload.update({
        id: category.id,
        branch,
        collection: categoriesSlug,
        data: { name: 'branch category' },
      })

      const post = await payload.create({
        collection: postsSlug,
        data: { category: category.id, title: 'points at forked category' },
      })

      const onBranch = await payload.findByID({
        id: post.id,
        branch,
        collection: postsSlug,
        depth: 1,
      })
      const onMain = await payload.findByID({ id: post.id, collection: postsSlug, depth: 1 })

      expect((onBranch.category as { name?: string })?.name).toBe('branch category')
      expect((onMain.category as { name?: string })?.name).toBe('main category')
    })

    it('should not serve one branch a populated document cached for another', async () => {
      const category = await payload.create({
        collection: categoriesSlug,
        data: { name: 'main category' },
      })

      for (const [slug, name] of [
        [branch, 'first branch category'],
        [other, 'second branch category'],
      ] as const) {
        await payload.update({
          id: category.id,
          branch: slug,
          collection: categoriesSlug,
          data: { name },
        })
      }

      const post = await payload.create({
        collection: postsSlug,
        data: { category: category.id, title: 'read from two branches' },
      })

      // Two branch-scoped views of one request, each with its own branch state but sharing
      // the dataloader — which is exactly what a GraphQL request does, one field at a time.
      // A shared `req` on its own resolves a single branch by design (§15); this is the
      // shape that legitimately reads two, and the dataloader's cache key has to tell them
      // apart or the second field is served the first field's populated document.
      const base = await createLocalReq({}, payload)

      const readOn = async (slug: string) => {
        const scoped = isolateObjectProperty(base, ['branch', 'context'])

        scoped.branch = slug
        scoped.context = {}

        return payload.findByID({
          id: post.id,
          collection: postsSlug,
          depth: 1,
          req: scoped,
        })
      }

      const first = await readOn(branch)
      const second = await readOn(other)

      expect((first.category as { name?: string })?.name).toBe('first branch category')
      expect((second.category as { name?: string })?.name).toBe('second branch category')
    })
  })

  /**
   * GraphQL had no branch mechanism at all — not an argument anywhere in the schema — so
   * the only way to reach a branch was a query param on the POST URL, which nothing used
   * and nothing tested. `branch` is now an argument, resolved onto the request the same way
   * `locale` is.
   */
  describe('GraphQL', () => {
    const branch = 'graphqlwork'
    let docID: number | string

    beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: branch } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'GraphQL work', slug: branch },
        })
      }
    })

    beforeEach(async () => {
      const doc = await payload.create({ collection: postsSlug, data: { title: 'on main' } })

      docID = doc.id

      await payload.update({
        id: docID,
        branch,
        collection: postsSlug,
        data: { title: 'on branch' },
      })
    })

    afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug }).catch(() => {})
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }
    })

    // Numeric-ID adapters need a bare ID, string-ID adapters a quoted one, and GraphQL
    // rejects the wrong form outright.
    const gqlID = (id: number | string) =>
      payload.db.defaultIDType === 'number' ? String(id) : `"${id}"`

    const gql = async (query: string) =>
      restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
          headers: { Authorization: `JWT ${token}` },
        })
        .then((res) => res.json())

    it('should read a document on a branch', async () => {
      const onBranch = await gql(`query {
        Post(id: ${gqlID(docID)}, branch: "${branch}") { title }
      }`)

      const onMain = await gql(`query {
        Post(id: ${gqlID(docID)}) { title }
      }`)

      expect(onBranch.data.Post.title).toBe('on branch')
      expect(onMain.data.Post.title).toBe('on main')
    })

    it('should list documents on a branch', async () => {
      const result = await gql(`query {
        Posts(branch: "${branch}") { docs { id title } }
      }`)

      const matching = (result.data.Posts.docs as { id: string; title: string }[]).filter(
        (doc) => String(doc.id) === String(docID),
      )

      expect(matching).toHaveLength(1)
      expect(matching[0]!.title).toBe('on branch')
    })

    it('should fork onto the branch when updating through GraphQL', async () => {
      await gql(`mutation {
        updatePost(id: ${gqlID(docID)}, branch: "${branch}", data: { title: "written through graphql" }) {
          title
        }
      }`)

      const onBranch = await payload.findByID({ id: docID, branch, collection: postsSlug })
      const onMain = await payload.findByID({ id: docID, collection: postsSlug })

      expect(onBranch.title).toBe('written through graphql')
      expect(onMain.title).toBe('on main')
    })
  })

  /**
   * A global edited on a branch was recorded in the change registry and then ignored by
   * both merge and discard, which filtered the registry to collections — so the edit was
   * permanently stuck on the branch, visible in the changeset and impossible to act on.
   */
  describe('Globals through merge and discard', () => {
    const branch = 'globalwork'
    let branchID: number | string

    beforeEach(async () => {
      const branchDoc = await payload.create({
        collection: branchesSlug,
        data: { name: 'Global work', slug: branch },
      })

      branchID = branchDoc.id

      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'main label' },
      })

      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch,
        data: { navLabel: 'branch label' },
      })
    })

    afterEach(async () => {
      for (const collection of [branchChangesSlug, branchMergesSlug]) {
        const rows = await payload.find({
          collection,
          pagination: false,
          where: { branch: { equals: branch } },
        })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, collection }).catch(() => {})
        }
      }

      await payload.delete({ id: branchID, collection: branchesSlug }).catch(() => {})
    })

    it('should record the global edit as a pending change', async () => {
      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]!.entityType).toBe('global')
      expect(changes.docs[0]!.globalSlug).toBe(headerGlobalSlug)
    })

    it('should apply a global edit to main on merge', async () => {
      const result = await payload.branches.merge({ branch })

      expect(result.merged).toHaveLength(1)
      expect(result.merged[0]!.globalSlug).toBe(headerGlobalSlug)

      const onMain = await payload.findGlobal({ slug: headerGlobalSlug })

      expect(onMain.navLabel).toBe('branch label')
    })

    it('should read through to main again after merging a global', async () => {
      await payload.branches.merge({ branch })

      // The branch's copy is gone, so a later edit on main is visible on the branch —
      // which is the whole reason the copy has to be deleted rather than reset.
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'edited on main afterwards' },
      })

      const onBranch = await payload.findGlobal({ slug: headerGlobalSlug, branch })

      expect(onBranch.navLabel).toBe('edited on main afterwards')
    })

    it('should close the branch when the only change was a global', async () => {
      await payload.branches.merge({ branch, closeBranch: true })

      const branchDoc = await payload.findByID({ id: branchID, collection: branchesSlug })

      expect(branchDoc.status).toBe('closed')
    })

    it('should record the merged global in the ledger', async () => {
      await payload.branches.merge({ branch })

      const merges = await payload.find({
        collection: branchMergesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      expect(merges.docs).toHaveLength(1)

      const changes = merges.docs[0]!.changes as { globalSlug?: string }[]

      expect(changes).toHaveLength(1)
      expect(changes[0]!.globalSlug).toBe(headerGlobalSlug)
    })

    it('should return the global to main state on discard', async () => {
      const result = await payload.branches.discard({ branch })

      expect(result.discarded).toHaveLength(1)

      const onBranch = await payload.findGlobal({ slug: headerGlobalSlug, branch })
      const onMain = await payload.findGlobal({ slug: headerGlobalSlug })

      expect(onBranch.navLabel).toBe('main label')
      expect(onMain.navLabel).toBe('main label')

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      expect(changes.docs).toHaveLength(0)
    })
  })

  // `findDistinct` had no branch predicate in either adapter, so a branch's shadow rows
  // fed main's distinct values and the branch's own edits were missing from its own.
  describe('Distinct values on a branch', () => {
    const branch = 'distinctwork'
    const created: (number | string)[] = []

    beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: branch } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Distinct work', slug: branch },
        })
      }
    })

    afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug }).catch(() => {})
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }

      created.length = 0
    })

    it('should reflect a branch edit and hide it from main', async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'on main' },
      })

      created.push(doc.id)

      await payload.update({
        id: doc.id,
        branch,
        collection: postsSlug,
        data: { title: 'on branch' },
      })

      const onBranch = await payload.findDistinct({
        branch,
        collection: postsSlug,
        field: 'title',
      })
      const onMain = await payload.findDistinct({ collection: postsSlug, field: 'title' })

      const values = (result: { values: { title?: unknown }[] }) =>
        result.values.map((value) => value.title)

      // One value each, and not the same one: the branch sees its edit, main sees its own
      // document, and neither sees the other's row.
      expect(values(onBranch as never)).toEqual(['on branch'])
      expect(values(onMain as never)).toEqual(['on main'])
    })
  })

  /**
   * §12.5. The gate answers the one question a document's own access control cannot:
   * may this reader be looking at a proposal rather than production. Every case here
   * uses a collection whose read access is the canonical public-site rule, because a
   * branch's copy of a published document satisfies that rule too.
   */
  describe('Branch visibility', () => {
    let publicDocID: number | string

    beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'visibility' } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Visibility', slug: 'visibility' },
        })
      }
    })

    beforeEach(async () => {
      const doc = await payload.create({
        collection: publicSlug,
        data: { _status: 'published', title: 'live on main' },
      })

      publicDocID = doc.id

      await payload.update({
        id: doc.id,
        branch: 'visibility',
        collection: publicSlug,
        data: { _status: 'published', title: 'unreleased on branch' },
      })
    })

    afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: publicSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: publicSlug }).catch(() => {})
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'visibility' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }
    })

    it('should refuse an anonymous read that names a branch', async () => {
      const res = await restClient.GET(`/${publicSlug}/${publicDocID}?branch=visibility`, {
        auth: false,
      })

      expect(res.status).toBe(403)
    })

    it('should still serve main to an anonymous reader', async () => {
      // The gate must not cost anything to a request that never mentions a branch —
      // the public site is this request.
      const res = await restClient.GET(`/${publicSlug}/${publicDocID}`, { auth: false })

      expect(res.status).toBe(200)
      expect((await res.json()).title).toBe('live on main')
    })

    it('should refuse an anonymous list read that names a branch', async () => {
      const res = await restClient.GET(`/${publicSlug}?branch=visibility`, { auth: false })

      expect(res.status).toBe(403)
    })

    it('should serve the branch copy to a reader who can see the branch', async () => {
      const res = await restClient.GET(`/${publicSlug}/${publicDocID}?branch=visibility`, {
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(200)
      expect((await res.json()).title).toBe('unreleased on branch')
    })

    it('should refuse a branch that does not exist', async () => {
      // Same answer as an unreadable branch, deliberately: distinguishing them would
      // tell an anonymous caller which branch names exist.
      const res = await restClient.GET(`/${publicSlug}/${publicDocID}?branch=no-such-branch`, {
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(403)
    })

    it('should leave the Local API free to address any branch', async () => {
      // Server-side callers are trusted by default, as everywhere else in Payload. The
      // gate is about requests arriving from outside.
      const onBranch = await payload.findByID({
        id: publicDocID,
        branch: 'visibility',
        collection: publicSlug,
      })

      expect(onBranch.title).toBe('unreleased on branch')
    })
  })

  /**
   * The two version writes that are not branch-aware. Both destroy production history
   * rather than branch history, which is the worst direction for this to fail in.
   */
  describe('Version writes that must stay off main', () => {
    const branch = 'versionwrites'

    beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: branch } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Version writes', slug: branch },
        })
      }
    })

    afterEach(async () => {
      for (const collection of [maxVersionsSlug, autosaveSlug, pagesSlug] as const) {
        const rows = await payload.find({ branch: false, collection, pagination: false })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, branch: false, collection }).catch(() => {})
        }
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }
    })

    // `enforceMaxVersions` probes with a branch-aware read — so on a branch it counts
    // main's ancestry too — and then deletes by canonical `parent` with no `_branch`
    // scoping. Pruning on a branch therefore deleted main's version rows and left the
    // branch's own chain (which hangs off the shadow row) untouched.
    it('should prune only the branch chain when max versions is reached on a branch', async () => {
      const doc = await payload.create({
        collection: maxVersionsSlug,
        data: { _status: 'published', title: 'main v1' },
      })

      await payload.update({
        id: doc.id,
        collection: maxVersionsSlug,
        data: { _status: 'published', title: 'main v2' },
      })

      const mainVersionsBefore = await payload.countVersions({
        collection: maxVersionsSlug,
        where: { parent: { equals: doc.id } },
      })

      // Enough saves on the branch to trigger pruning there.
      for (const title of ['branch v1', 'branch v2', 'branch v3']) {
        await payload.update({
          id: doc.id,
          branch,
          collection: maxVersionsSlug,
          data: { _status: 'published', title },
        })
      }

      const mainVersionsAfter = await payload.countVersions({
        collection: maxVersionsSlug,
        where: { parent: { equals: doc.id } },
      })

      expect(mainVersionsAfter.totalDocs).toBe(mainVersionsBefore.totalDocs)

      // And main's document still reads as main's.
      const onMain = await payload.findByID({ id: doc.id, collection: maxVersionsSlug })

      expect(onMain.title).toBe('main v2')
    })

    // The same hazard reached through `unpublish` rather than autosave, which is where
    // it bites: the autosave path is protected by its `shouldUpdate` guard (main's
    // latest is not an autosave row, so it is left alone), but unpublish updates
    // whatever the latest row happens to be — and on a branch with no versions of its
    // own yet, that is main's.
    it('should not rewrite main latest version row when unpublishing on a branch', async () => {
      const doc = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'published on main' },
      })

      const before = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: doc.id } },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: pagesSlug,
        data: { _status: 'draft', title: 'unpublished on branch' },
        draft: true,
        unpublishAllLocales: true,
      })

      const after = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: doc.id } },
      })

      const titles = after.docs.map((version) => (version.version as { title?: string })?.title)

      expect(titles).not.toContain('unpublished on branch')
      expect(after.docs).toHaveLength(before.docs.length)

      // Main's document is still published, with main's content.
      const onMain = await payload.findByID({ id: doc.id, collection: pagesSlug, draft: true })

      expect(onMain.title).toBe('published on main')
      expect(onMain._status).toBe('published')
    })

    // `updateLatestVersion` finds by canonical `parent` — a branch-aware read, so it
    // returns main's latest row as part of the branch's ancestry — and then rewrites
    // that row through the branch-blind `db.updateVersion`.
    it('should not rewrite main latest version row when autosaving on a branch', async () => {
      const doc = await payload.create({
        collection: autosaveSlug,
        data: { _status: 'published', title: 'main published' },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: autosaveSlug,
        data: { title: 'autosaved on branch' },
        draft: true,
      })

      const mainVersions = await payload.findVersions({
        collection: autosaveSlug,
        pagination: false,
        where: { parent: { equals: doc.id } },
      })

      const titles = mainVersions.docs.map(
        (version) => (version.version as { title?: string })?.title,
      )

      expect(titles).not.toContain('autosaved on branch')

      const onMain = await payload.findByID({ id: doc.id, collection: autosaveSlug, draft: true })

      expect(onMain.title).toBe('main published')
    })
  })

  // What a diff does: the same document, read on two branches, to show what
  // merging one into the other would change.
  describe('Reading two branches in one request', () => {
    let docID: number | string

    beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'two-branch-read' } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Two branch read', slug: 'two-branch-read' },
        })
      }
    })

    beforeEach(async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'on main' },
      })

      docID = doc.id

      await payload.update({
        id: docID,
        branch: 'two-branch-read',
        collection: postsSlug,
        data: { title: 'on branch' },
      })
    })

    afterEach(async () => {
      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { _branch: { equals: 'two-branch-read' } },
      })

      for (const shadow of shadows.docs) {
        await payload.delete({ id: shadow.id, branch: false, collection: postsSlug })
      }

      await payload.delete({ id: docID, branch: false, collection: postsSlug })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'two-branch-read' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    it('should return each branch when every read isolates its branch state', async () => {
      const req = await createLocalReq({ user: null }, payload)

      const [fromMain, fromBranch] = await Promise.all([
        payload.findByID({
          id: docID,
          branch: 'main',
          collection: postsSlug,
          req: isolateBranchState(req),
        }),
        payload.findByID({
          id: docID,
          branch: 'two-branch-read',
          collection: postsSlug,
          req: isolateBranchState(req),
        }),
      ])

      expect(fromMain.title).toBe('on main')
      expect(fromBranch.title).toBe('on branch')
    })

    it('should leave the original request on its own branch after an isolated read', async () => {
      const req = await createLocalReq({ branch: 'two-branch-read' }, payload)

      // Resolve the branch on `req` itself before reading elsewhere, as any
      // operation would.
      const onBranch = await payload.findByID({ id: docID, collection: postsSlug, req })

      await payload.findByID({
        id: docID,
        branch: 'main',
        collection: postsSlug,
        req: isolateBranchState(req),
      })

      const stillOnBranch = await payload.findByID({ id: docID, collection: postsSlug, req })

      expect(onBranch.title).toBe('on branch')
      expect(stillOnBranch.title).toBe('on branch')
    })

    it('should follow an explicit branch even when the request already resolved another', async () => {
      const req = await createLocalReq({ branch: 'two-branch-read' }, payload)

      await payload.findByID({ id: docID, collection: postsSlug, req })

      // This used to be impossible: branch state is memoized per request, so a `branch`
      // argument could not redirect a request that had already resolved one, and the read
      // silently returned the first branch's document. An explicit argument now wins, the
      // same contract `locale` has — the operation runs on an isolated request.
      const onMain = await payload.findByID({
        id: docID,
        branch: 'main',
        collection: postsSlug,
        req,
      })

      expect(onMain.title).toBe('on main')

      // And the caller's request is still where it was, which is what "isolated" buys: the
      // read did not rewrite the request underneath whoever owns it.
      const again = await payload.findByID({ id: docID, collection: postsSlug, req })

      expect(again.title).toBe('on branch')
    })
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

    it('should leave the main document untouched when updating on a branch', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('original on main')
    })

    it('should create exactly one shadow row on first branch edit', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      // `_branchOp` and `_branchDocID` are `hidden`, so they are stripped from API
      // responses — inspecting them is exactly what `showHiddenFields` is for.
      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: { _branch: { equals: 'cow' } },
      })

      expect(shadows.docs).toHaveLength(1)
      expect(shadows.docs[0]).toMatchObject({ _branchOp: 'update', title: 'edited on branch' })
      expect(String(shadows.docs[0]!._branchDocID)).toBe(String(mainDocID))
    })

    it('should reuse the existing shadow row on subsequent branch edits', async () => {
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

    it('should return branch content when reading the branch by canonical ID', async () => {
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
    it('should keep the canonical ID when a branch find narrows fields with select', async () => {
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

    it('should keep the canonical ID when a branch findByID narrows fields with select', async () => {
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

    it('should keep the canonical ID when a branch find excludes fields with select', async () => {
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

    it('should return the canonical ID on the document an update returns', async () => {
      const updated = await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      expect(String(updated.id)).toBe(String(mainDocID))
    })

    it('should sort on a branch-modified field using the branch value', async () => {
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

    it('should populate a relationship with the branch version of the related document', async () => {
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

    it('should not double-count a document edited on a branch', async () => {
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

    it('should filter on a branch-modified field using the branch value', async () => {
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

    it('should record the update in the changeset registry', async () => {
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
      expect(changes.docs[0]).toMatchObject({ collectionSlug: postsSlug, operation: 'update' })
    })

    it('should tombstone rather than delete when deleting a main document on a branch', async () => {
      await payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug })

      const stillOnMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(stillOnMain.title).toBe('original on main')
    })

    it('should hide a document deleted on a branch from that branch only', async () => {
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

    it('should record the delete in the changeset registry', async () => {
      await payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug })

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

      await payload.delete({ id: created.id, branch: 'cow', collection: postsSlug })

      const rows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: created.id } },
      })

      expect(rows.docs).toHaveLength(0)
    })
    it('should allow the same unique value on two different branches', async () => {
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
        await payload.delete({ id: shadow.id, branch: false, collection: pagesSlug })
      }

      for (const id of cleanup) {
        await payload.delete({ id, branch: false, collection: pagesSlug })
      }
      cleanup.length = 0

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'draftwork' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    it('should hide a draft saved on a branch from main', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      const mainDraft = await payload.findByID({
        id: pageID,
        collection: pagesSlug,
        draft: true,
      })

      expect(mainDraft.title).toBe('published on main')
    })

    it('should return the branch draft when reading drafts on the branch', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      const branchDraft = await payload.findByID({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
      })

      expect(branchDraft.title).toBe('draft on branch')
    })

    it('should not publish on main when publishing on a branch', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { _status: 'published', title: 'published on branch' },
      })

      const onMain = await payload.findByID({ id: pageID, collection: pagesSlug })
      const onBranch = await payload.findByID({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
      })

      expect(onMain.title).toBe('published on main')
      expect(onBranch.title).toBe('published on branch')
    })

    it('should keep version history isolated per branch', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
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
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
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

    // Merging a published update applied it to main and dropped the branch's copy of
    // the row — but left the branch's *version* chain behind. The drafts list reads
    // through versions, so the branch went on listing the merged document a second
    // time alongside main's, as two identical published rows.
    it('should not duplicate a merged document in the branch drafts list', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { _status: 'published', title: 'published on branch' },
      })

      // Kept open, which is where the duplicate showed: closing the branch hides it
      // from the switcher, so nobody looked at its list again.
      await payload.branches.merge({ branch: 'draftwork' })

      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
        pagination: false,
      })

      const matching = onBranch.docs.filter((doc) => String(doc.id) === String(pageID))

      expect(matching).toHaveLength(1)
      expect(matching[0]!.title).toBe('published on branch')

      // And main has the merged content, exactly once.
      const onMain = await payload.find({
        collection: pagesSlug,
        draft: true,
        pagination: false,
        where: { id: { equals: pageID } },
      })

      expect(onMain.docs).toHaveLength(1)
      expect(onMain.docs[0]!.title).toBe('published on branch')
    })

    // The same hazard from the other direction: a document *created* on the branch
    // keeps its row through the merge — the row is promoted to main rather than
    // recreated — so its branch-scoped version rows had to stop being branch-scoped
    // with it, or the branch listed the promoted document twice.
    it('should not duplicate a document created on the branch after it merges', async () => {
      const created = await payload.create({
        branch: 'draftwork',
        collection: pagesSlug,
        data: { _status: 'published', title: 'created on branch' },
      })

      cleanup.push(created.id)

      await payload.branches.merge({ branch: 'draftwork' })

      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
        pagination: false,
      })

      const matching = onBranch.docs.filter((doc) => doc.title === 'created on branch')

      expect(matching).toHaveLength(1)

      // The other edge of the same fix: the promoted row's chain is cleared *before*
      // main's first version is written, not after, or clearing it would take that
      // version with it and drop a published document out of main's own drafts list.
      const onMain = await payload.find({
        collection: pagesSlug,
        draft: true,
        pagination: false,
        where: { title: { equals: 'created on branch' } },
      })

      expect(onMain.docs).toHaveLength(1)
    })

    // A tombstone is a flag on the collection row, which version rows know
    // nothing about — so a document deleted on a branch kept its branch version
    // chain, and a drafts-enabled collection went on listing it. The list view
    // reads drafts, so the row stayed put while every other read treated the
    // document as gone, including the edit view behind it.
    it('should hide a document deleted on a branch from that branch drafts list', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      await payload.delete({ id: pageID, branch: 'draftwork', collection: pagesSlug })

      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
        pagination: false,
      })

      expect(onBranch.docs.map((doc) => String(doc.id))).not.toContain(String(pageID))
    })

    it('should still list a document deleted on a branch when reading drafts on main', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      await payload.delete({ id: pageID, branch: 'draftwork', collection: pagesSlug })

      const onMain = await payload.find({
        collection: pagesSlug,
        draft: true,
        pagination: false,
      })

      expect(onMain.docs.map((doc) => String(doc.id))).toContain(String(pageID))
    })

    // The delete cascaded to versions by canonical ID before the tombstone was
    // decided, so main lost its version chain while keeping its row — production
    // history destroyed by a branch that is supposed to be isolated from it.
    it('should leave main version history intact when deleting on a branch', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      await payload.delete({ id: pageID, branch: 'draftwork', collection: pagesSlug })

      const mainVersions = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })

      expect(mainVersions.docs.length).toBeGreaterThan(0)

      const mainDraft = await payload.findByID({
        id: pageID,
        collection: pagesSlug,
        draft: true,
      })

      expect(mainDraft.title).toBe('published on main')
    })

    it('should hide a document deleted on a branch without a prior branch edit', async () => {
      await payload.delete({ id: pageID, branch: 'draftwork', collection: pagesSlug })

      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
        pagination: false,
      })

      expect(onBranch.docs.map((doc) => String(doc.id))).not.toContain(String(pageID))
    })

    // §7 originally said the fork should copy main's `latest` version into the
    // branch. It does not, and it should not: a branch's history reads as a
    // continuation of main's, so main's own rows are the ancestry and copying them
    // would duplicate every one.
    it('should show main history up to the fork point as the branch ancestry', async () => {
      await payload.update({
        id: pageID,
        collection: pagesSlug,
        data: { title: 'unpublished draft on main' },
        draft: true,
      })

      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'edited on branch' },
        draft: true,
      })

      const history = await payload.findVersions({
        branch: 'draftwork',
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })

      const titles = history.docs.map((doc) => doc.version?.title)

      expect(titles).toContain('edited on branch')
      expect(titles).toContain('unpublished draft on main')
      expect(titles).toContain('published on main')

      // Every row reports the document it belongs to, not the shadow row.
      for (const doc of history.docs) {
        const parent = (doc as { parent?: unknown }).parent

        expect(String((parent as { value?: unknown })?.value ?? parent)).toBe(String(pageID))
      }
    })

    /**
     * Versions main records *after* a branch forked are not that branch's past, so
     * its history should stop at the fork point. Blocked on there being a marker to
     * stop at: the registry stores `baseUpdatedAt`, which is main's *document*
     * `updatedAt` at fork, and version rows are written just after the document — so
     * comparing a version's `updatedAt` against it excludes main's latest version,
     * the one that matters most for ancestry. Needs a fork-time marker of its own;
     * `baseUpdatedAt` cannot be repurposed because §16's "main moved" warning depends
     * on its current meaning.
     */
    it.todo('should exclude main versions recorded after the branch forked')

    // The Versions tab count and the Versions list came from different queries, and
    // only the list was branch-aware — so the tab said 3 while 4 rows rendered.
    it('should count versions the same way it lists them on a branch', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'edited on branch' },
        draft: true,
      })

      const listed = await payload.findVersions({
        branch: 'draftwork',
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })
      const counted = await payload.countVersions({
        branch: 'draftwork',
        collection: pagesSlug,
        where: { parent: { equals: pageID } },
      })

      expect(counted.totalDocs).toBe(listed.docs.length)

      const listedOnMain = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })
      const countedOnMain = await payload.countVersions({
        collection: pagesSlug,
        where: { parent: { equals: pageID } },
      })

      expect(countedOnMain.totalDocs).toBe(listedOnMain.docs.length)
      expect(counted.totalDocs).toBeGreaterThan(countedOnMain.totalDocs)
    })

    it('should keep one branch out of another branch history', async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'otherwork' } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Other work', slug: 'otherwork' },
        })
      }

      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'edited on draftwork' },
        draft: true,
      })
      await payload.update({
        id: pageID,
        branch: 'otherwork',
        collection: pagesSlug,
        data: { title: 'edited on otherwork' },
        draft: true,
      })

      const onDraftwork = await payload.findVersions({
        branch: 'draftwork',
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })
      const onMain = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })

      const draftworkTitles = onDraftwork.docs.map((doc) => doc.version?.title)

      expect(draftworkTitles).toContain('edited on draftwork')
      expect(draftworkTitles).not.toContain('edited on otherwork')
      expect(onMain.docs.map((doc) => doc.version?.title)).not.toContain('edited on draftwork')

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'otherwork' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    it('should record a draft-only document created on a branch in the changeset registry', async () => {
      const created = await payload.create({
        branch: 'draftwork',
        collection: pagesSlug,
        data: { _status: 'draft', title: 'draft created on branch' },
        draft: true,
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'draftwork' } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]?.operation).toBe('create')
      expect(changes.docs[0]?.collectionSlug).toBe(pagesSlug)
      expect((changes.docs[0]?.doc as { value?: unknown })?.value).toBe(created.id)
    })

    it('should record a draft edit to a main document as an update in the changeset registry', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'draftwork' } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]?.operation).toBe('update')
      expect((changes.docs[0]?.doc as { value?: unknown })?.value).toBe(pageID)
    })

    it('should record a draft created through the REST API with a branch param', async () => {
      const res = await restClient.POST(`/${pagesSlug}?branch=draftwork&draft=true`, {
        body: JSON.stringify({ _status: 'draft', title: 'rest draft on branch' }),
        headers: { Authorization: `JWT ${token}` },
      })
      const { doc } = await res.json()

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'draftwork' } },
      })

      expect(res.status).toBe(201)
      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]?.operation).toBe('create')
      expect(String((changes.docs[0]?.doc as { value?: unknown })?.value)).toBe(String(doc.id))
    })

    // What the admin panel's API tab does: read one document by ID over REST with a
    // `branch` param. The tab showed main's copy while sitting on a branch.
    it('should return the branch copy when reading one document by ID over REST', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'updated on branch' },
      })

      const res = await restClient.GET(`/${pagesSlug}/${pageID}?branch=draftwork&depth=0`, {
        headers: { Authorization: `JWT ${token}` },
      })
      const doc = await res.json()

      expect(res.status).toBe(200)
      expect(doc.title).toBe('updated on branch')

      // And main is unaffected by the same read, so this is scoping and not leakage.
      const onMain = await restClient.GET(`/${pagesSlug}/${pageID}?depth=0`, {
        headers: { Authorization: `JWT ${token}` },
      })

      expect((await onMain.json()).title).toBe('published on main')
    })

    // Writes over REST had no branch coverage at all, and a write that silently lands
    // on main is strictly worse than a read that silently returns it.
    it('should fork onto the branch when updating through REST with a branch param', async () => {
      const res = await restClient.PATCH(`/${pagesSlug}/${pageID}?branch=draftwork&depth=0`, {
        body: JSON.stringify({ title: 'patched on branch' }),
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(200)

      const onBranch = await payload.findByID({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
      })
      const onMain = await payload.findByID({ id: pageID, collection: pagesSlug })

      expect(onBranch.title).toBe('patched on branch')
      expect(onMain.title).toBe('published on main')
    })

    it('should tombstone rather than delete when deleting through REST with a branch param', async () => {
      const res = await restClient.DELETE(`/${pagesSlug}/${pageID}?branch=draftwork&depth=0`, {
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(200)

      // Gone on the branch, still on main — the whole point of a tombstone.
      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        pagination: false,
        where: { id: { equals: pageID } },
      })
      const onMain = await payload.findByID({ id: pageID, collection: pagesSlug })

      expect(onBranch.docs).toHaveLength(0)
      expect(onMain.title).toBe('published on main')
    })

    // Listing was never broken — `find` hands the adapter the whole request, so the
    // query param was visible to it. Pinned anyway: the bug was the *divergence*
    // between the two reads, and a list that silently stopped agreeing with a
    // by-ID read would be the same defect wearing different clothes.
    it('should return the branch copy when listing documents over REST', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'updated on branch' },
      })

      const res = await restClient.GET(`/${pagesSlug}?branch=draftwork&depth=0`, {
        headers: { Authorization: `JWT ${token}` },
      })
      const { docs } = await res.json()

      const matching = docs.filter((doc: { id: number | string }) => {
        return String(doc.id) === String(pageID)
      })

      expect(matching).toHaveLength(1)
      expect(matching[0].title).toBe('updated on branch')
    })

    it('should keep a draft created on a branch off main', async () => {
      const created = await payload.create({
        branch: 'draftwork',
        collection: pagesSlug,
        data: { _status: 'draft', title: 'draft created on branch' },
        draft: true,
      })

      const onMain = await payload.find({
        collection: pagesSlug,
        draft: true,
        pagination: false,
        where: { id: { equals: created.id } },
      })
      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
        pagination: false,
        where: { id: { equals: created.id } },
      })

      expect(onMain.docs).toHaveLength(0)
      expect(onBranch.docs).toHaveLength(1)
    })
  })

  describe('Uploads on a branch', () => {
    const cleanup: (number | string)[] = []

    beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'uploadwork' } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Upload work', slug: 'uploadwork' },
        })
      }
    })

    afterEach(async () => {
      const shadows = await payload.find({
        branch: false,
        collection: mediaSlug,
        pagination: false,
        where: { _branch: { not_equals: 'main' } },
      })

      for (const shadow of shadows.docs) {
        await payload.delete({ id: shadow.id, branch: false, collection: mediaSlug })
      }

      for (const id of cleanup) {
        await payload.delete({ id, branch: false, collection: mediaSlug }).catch(() => {})
      }
      cleanup.length = 0

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'uploadwork' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    const createOnMain = async (name: string) => {
      const doc = await payload.create({
        collection: mediaSlug,
        data: { alt: 'on main' },
        file: {
          name,
          data: Buffer.from(`bytes for ${name}`),
          mimetype: 'text/plain',
          size: 32,
        },
      })
      cleanup.push(doc.id)

      return doc
    }

    // `filename` is unique on upload collections, and it is added after branch
    // field injection runs — so it kept a global unique index and a branch's copy
    // of the row collided with main's, failing validation outright.
    it('should allow forking an upload onto a branch despite the unique filename', async () => {
      const media = await createOnMain('fork-me.txt')

      await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'on branch' },
      })

      const onBranch = await payload.findByID({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
      })
      const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })

      expect(onBranch.alt).toBe('on branch')
      expect(onMain.alt).toBe('on main')
    })

    // `deleteAssociatedFiles` ran before `db.deleteOne` decided the delete was a
    // tombstone, so main lost the file its surviving row still points at.
    it('should keep the file on main when deleting an upload on a branch', async () => {
      const fs = await import('fs')
      const media = await createOnMain('keep-me.txt')
      const filePath = path.resolve(dirname, 'media', media.filename!)

      expect(fs.existsSync(filePath)).toBe(true)

      await payload.delete({ id: media.id, branch: 'uploadwork', collection: mediaSlug })

      expect(fs.existsSync(filePath)).toBe(true)

      const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })

      expect(onMain.alt).toBe('on main')
    })

    it('should hide an upload deleted on a branch from that branch only', async () => {
      const media = await createOnMain('hide-me.txt')

      await payload.delete({ id: media.id, branch: 'uploadwork', collection: mediaSlug })

      const onBranch = await payload.find({
        branch: 'uploadwork',
        collection: mediaSlug,
        pagination: false,
      })
      const onMain = await payload.find({ collection: mediaSlug, pagination: false })

      expect(onBranch.docs.map((doc) => String(doc.id))).not.toContain(String(media.id))
      expect(onMain.docs.map((doc) => String(doc.id))).toContain(String(media.id))
    })

    it('should delete the file when removing an upload created on that branch', async () => {
      const fs = await import('fs')

      const created = await payload.create({
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'branch only' },
        file: {
          name: 'branch-only.txt',
          data: Buffer.from('branch only bytes'),
          mimetype: 'text/plain',
          size: 17,
        },
      })

      const filePath = path.resolve(dirname, 'media', created.filename!)

      expect(fs.existsSync(filePath)).toBe(true)

      await payload.delete({ id: created.id, branch: 'uploadwork', collection: mediaSlug })

      expect(fs.existsSync(filePath)).toBe(false)
    })
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
        slug: headerGlobalSlug,
        data: { navLabel: 'main nav' },
      })
    })

    it('should leave main untouched when editing a global on a branch', async () => {
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: 'globalwork',
        data: { navLabel: 'branch nav' },
      })

      const onMain = await payload.findGlobal({ slug: headerGlobalSlug })

      expect(onMain.navLabel).toBe('main nav')
    })

    it('should return the branch version when reading the global on that branch', async () => {
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: 'globalwork',
        data: { navLabel: 'branch nav' },
      })

      const onBranch = await payload.findGlobal({
        slug: headerGlobalSlug,
        branch: 'globalwork',
      })

      expect(onBranch.navLabel).toBe('branch nav')
    })

    it('should read through to main for a global never edited on the branch', async () => {
      const onOtherBranch = await payload.findGlobal({
        slug: headerGlobalSlug,
        branch: 'halloween',
      })

      expect(onOtherBranch.navLabel).toBe('main nav')
    })

    it('should keep two branches independent for the same global', async () => {
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: 'globalwork',
        data: { navLabel: 'globalwork nav' },
      })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: 'q4',
        data: { navLabel: 'q4 nav' },
      })

      const a = await payload.findGlobal({ slug: headerGlobalSlug, branch: 'globalwork' })
      const b = await payload.findGlobal({ slug: headerGlobalSlug, branch: 'q4' })
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
        slug: homepageGlobalSlug,
        data: { _status: 'published', heroTitle: 'published on main' },
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        data: { heroTitle: 'main draft' },
        draft: true,
      })

      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch: 'globalwork',
        data: { heroTitle: 'branch draft' },
        draft: true,
      })

      const mainLatest = await payload.findGlobalVersions({
        slug: homepageGlobalSlug,
        pagination: false,
        where: { and: [{ latest: { equals: true } }, { _branch: { equals: 'main' } }] },
      })

      expect(mainLatest.docs).toHaveLength(1)
      expect(mainLatest.docs[0]!.version.heroTitle).toBe('main draft')
    })

    it('should hide a global draft saved on a branch from main', async () => {
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch: 'globalwork',
        data: { heroTitle: 'branch draft only' },
        draft: true,
      })

      const mainDraft = await payload.findGlobal({
        slug: homepageGlobalSlug,
        draft: true,
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
          await payload.delete({ id: row.id, branch: false, collection: slug })
        }
      }

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const rows = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'joinwork' } },
        })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    it('should exclude branch-created documents from a join read on main', async () => {
      const onMain = await payload.findByID({ id: categoryID, collection: categoriesSlug })
      const ids = (onMain.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))

      expect(ids).toContain(String(mainPostID))
      expect(ids).not.toContain(String(branchPostID))
    })

    it('should include branch-created documents in a join read on that branch', async () => {
      const onBranch = await payload.findByID({
        id: categoryID,
        branch: 'joinwork',
        collection: categoriesSlug,
      })
      const ids = (onBranch.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))

      expect(ids).toContain(String(mainPostID))
      expect(ids).toContain(String(branchPostID))
    })

    it('should exclude branch-deleted documents from a join read on that branch', async () => {
      await payload.delete({ id: mainPostID, branch: 'joinwork', collection: postsSlug })

      const onBranch = await payload.findByID({
        id: categoryID,
        branch: 'joinwork',
        collection: categoriesSlug,
      })
      const onMain = await payload.findByID({ id: categoryID, collection: categoriesSlug })

      const branchIDs = (onBranch.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))
      const mainIDs = (onMain.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))

      expect(branchIDs).not.toContain(String(mainPostID))
      expect(mainIDs).toContain(String(mainPostID))
    })

    it('should not surface a shadow row as a separate join entry', async () => {
      await payload.update({
        id: mainPostID,
        branch: 'joinwork',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const onBranch = await payload.findByID({
        id: categoryID,
        branch: 'joinwork',
        collection: categoriesSlug,
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
          id,
          branch: 'accesswork',
          collection,
          data: { title: 'edited on branch' },
        })
      }
    })

    afterEach(async () => {
      for (const slug of [restrictedSlug, whereAccessSlug]) {
        const rows = await payload.find({ branch: false, collection: slug, pagination: false })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, branch: false, collection: slug })
        }
      }

      await payload.delete({ id: editorID, collection: 'users' })

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const rows = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'accesswork' } },
        })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, collection })
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

      const allowed = await payload.findByID({ id: allowedID, collection: whereAccessSlug })
      const restricted = await payload.findByID({ id: restrictedID, collection: restrictedSlug })
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

      const restricted = await payload.findByID({ id: restrictedID, collection: restrictedSlug })

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
        id: mainDocID,
        branch: 'mergeme',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })
    })

    afterEach(async () => {
      const rows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
      })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug })
      }
      cleanup.length = 0

      for (const slug of ['mergeme']) {
        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: slug } },
        })

        for (const change of changes.docs) {
          await payload.delete({ id: change.id, collection: branchChangesSlug })
        }

        const branches = await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: slug } },
        })

        for (const branchDoc of branches.docs) {
          await payload.delete({ id: branchDoc.id, collection: branchesSlug })
        }
      }
    })

    it('should report pending changes without mutating anything on dryRun', async () => {
      const result = await payload.branches.merge({ branch: 'mergeme', dryRun: true })

      expect(result.mergeable).toHaveLength(2)

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('original on main')
    })

    it('should apply a branch edit to main', async () => {
      await payload.branches.merge({ branch: 'mergeme' })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('edited on branch')
    })

    it('should publish a branch-created document to main keeping its ID', async () => {
      await payload.branches.merge({ branch: 'mergeme' })

      const onMain = await payload.findByID({ id: branchOnlyID, collection: postsSlug })

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

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })
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
      await payload.delete({ id: mainDocID, branch: 'mergeme', collection: postsSlug })
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
        id: mainDocID,
        collection: postsSlug,
        data: { title: 'changed on main after fork' },
      })

      const result = await payload.branches.merge({ branch: 'mergeme', dryRun: true })
      const warning = result.warnings.find((each) => each.reason === 'main-moved')

      expect(warning).toBeDefined()
      expect(String(warning!.docID)).toBe(String(mainDocID))
    })

    it('should overwrite main even when main moved after the fork', async () => {
      await payload.update({
        id: mainDocID,
        collection: postsSlug,
        data: { title: 'changed on main after fork' },
      })

      await payload.branches.merge({ branch: 'mergeme' })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

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

      // `_branch` is `hidden`, so asserting on it needs `showHiddenFields`.
      const all = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
      })

      for (const doc of all.docs) {
        expect(doc._branch).toBe('main')
      }
    })
  })

  /**
   * §7's effective-operation table. A branch edit that was only ever saved as a
   * draft never touches the document row, so merge cannot read the row alone and
   * has to consult the branch's version chain to know what it is applying.
   */
  describe('Merging drafts and publishes', () => {
    let pageID: number | string

    beforeEach(async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Draft merge', slug: 'draftmerge' },
      })

      const page = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'published on main' },
      })

      pageID = page.id
    })

    afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: pagesSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: pagesSlug })
      }

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: {
            [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'draftmerge' },
          },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    it('should merge a draft-only branch edit as a draft, leaving main published state alone', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      await payload.branches.merge({ branch: 'draftmerge' })

      const published = await payload.findByID({ id: pageID, collection: pagesSlug })
      const latest = await payload.findByID({ id: pageID, collection: pagesSlug, draft: true })

      expect(published.title).toBe('published on main')
      expect(latest.title).toBe('draft on branch')
      expect(latest._status).toBe('draft')
    })

    it('should report a draft-only branch edit as an update rather than a publish', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      const resolved = await resolveEffectiveOperations({
        branch: 'draftmerge',
        changes: (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: { branch: { equals: 'draftmerge' } },
          })
        ).docs,
        payload,
        req: await createLocalReq({ branch: false }, payload),
      })

      expect(resolved).toHaveLength(1)
      expect(resolved[0]!.writes.map((write) => write.operation)).toEqual(['update'])
    })

    it('should merge a publish on a branch as a publish to main', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { _status: 'published', title: 'published on branch' },
      })

      await payload.branches.merge({ branch: 'draftmerge' })

      const published = await payload.findByID({ id: pageID, collection: pagesSlug })

      expect(published.title).toBe('published on branch')
      expect(published._status).toBe('published')
    })

    it('should apply both states when a branch published and then drafted on top', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { _status: 'published', title: 'published on branch' },
      })

      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { title: 'drafted after publishing' },
        draft: true,
      })

      await payload.branches.merge({ branch: 'draftmerge' })

      const published = await payload.findByID({ id: pageID, collection: pagesSlug })
      const latest = await payload.findByID({ id: pageID, collection: pagesSlug, draft: true })

      // Main goes through both transitions the branch went through, rather than
      // collapsing the publish into the draft above it.
      expect(published.title).toBe('published on branch')
      expect(latest.title).toBe('drafted after publishing')
      expect(latest._status).toBe('draft')
    })

    it('should merge a draft created on a branch as an unpublished document on main', async () => {
      const created = await payload.create({
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { _status: 'draft', title: 'draft created on branch' },
        draft: true,
      })

      await payload.branches.merge({ branch: 'draftmerge' })

      const onMain = await payload.find({
        collection: pagesSlug,
        draft: true,
        pagination: false,
        where: { id: { equals: created.id } },
      })

      expect(onMain.docs).toHaveLength(1)
      expect(onMain.docs[0]!._status).toBe('draft')
      expect(onMain.docs[0]!.title).toBe('draft created on branch')
    })

    it('should leave main published state untouched by a draft-only merge', async () => {
      const before = await payload.findByID({ id: pageID, collection: pagesSlug })

      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      await payload.branches.merge({ branch: 'draftmerge' })

      const after = await payload.findByID({ id: pageID, collection: pagesSlug })

      // Publishing state is main's own, so the row it lives on must be byte-identical.
      expect(after.updatedAt).toBe(before.updatedAt)
      expect(after.title).toBe('published on main')
    })

    it('should not leave a shadow row behind after merging a draft-only edit', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      await payload.branches.merge({ branch: 'draftmerge' })

      const rows = await payload.find({
        branch: false,
        collection: pagesSlug,
        pagination: false,
        showHiddenFields: true,
      })

      for (const row of rows.docs) {
        expect(row._branch).toBe('main')
      }
    })
  })

  /**
   * §16's branch lifecycle. A branch is the workspace and a merge is an event, so
   * merging does not end a branch — closing it does, and only when asked.
   */
  describe('Branch lifecycle after merging', () => {
    let mainDocID: number | string

    const branchStatus = async (slug: string) =>
      (
        await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: slug } },
        })
      ).docs[0]

    beforeEach(async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Life cycle', slug: 'lifecycle' },
      })

      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'original on main' },
      })

      mainDocID = doc.id

      await payload.update({
        id: mainDocID,
        branch: 'lifecycle',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })
    })

    afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug })
      }

      for (const collection of [branchChangesSlug, branchMergesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'lifecycle' } },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    it('should record a ledger entry naming what the merge applied', async () => {
      await payload.branches.merge({ branch: 'lifecycle' })

      const events = await payload.find({
        collection: branchMergesSlug,
        pagination: false,
        where: { branch: { equals: 'lifecycle' } },
      })

      expect(events.docs).toHaveLength(1)

      const event = events.docs[0]! as unknown as {
        changes: { collectionSlug: string; docID: string; docTitle: string; operation: string }[]
        mergedAt: string
      }

      expect(event.mergedAt).toBeTruthy()
      expect(event.changes).toHaveLength(1)
      // Snapshotted at merge time, so renaming the document later cannot rewrite
      // what the ledger says was merged.
      expect(event.changes[0]).toMatchObject({
        collectionSlug: postsSlug,
        docID: String(mainDocID),
        docTitle: 'edited on branch',
        operation: 'update',
      })
    })

    it('should snapshot both sides of each merged change so the diff survives', async () => {
      await payload.branches.merge({ branch: 'lifecycle' })

      const event = (
        await payload.find({
          collection: branchMergesSlug,
          pagination: false,
          where: { branch: { equals: 'lifecycle' } },
        })
      ).docs[0]! as unknown as {
        changes: { after?: Record<string, unknown>; before?: Record<string, unknown> }[]
      }

      // Both sides exist only in the moment of the merge: the branch's copy is
      // dropped and main then holds the merged values on the one remaining row.
      expect(event.changes[0]?.before?.title).toBe('original on main')
      expect(event.changes[0]?.after?.title).toBe('edited on branch')
    })

    it('should snapshot an empty before for a branch-created document', async () => {
      const created = await payload.create({
        branch: 'lifecycle',
        collection: postsSlug,
        data: { title: 'created on branch' },
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'lifecycle' } },
      })

      const createChange = changes.docs.find(
        (change) =>
          change.operation === 'create' &&
          String((change.doc as { value?: unknown })?.value) === String(created.id),
      )

      await payload.branches.merge({ branch: 'lifecycle', changes: [createChange!.id] })

      const event = (
        await payload.find({
          collection: branchMergesSlug,
          pagination: false,
          where: { branch: { equals: 'lifecycle' } },
        })
      ).docs[0]! as unknown as {
        changes: { after?: Record<string, unknown>; before?: null | Record<string, unknown> }[]
      }

      // Nothing stood on main before it, so there is no "before" to diff against.
      expect(event.changes[0]?.before).toBeFalsy()
      expect(event.changes[0]?.after?.title).toBe('created on branch')
    })

    it('should keep the branch open when only some changes are merged', async () => {
      const second = await payload.create({
        branch: 'lifecycle',
        collection: postsSlug,
        data: { title: 'created on branch' },
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'lifecycle' } },
      })

      const updateChange = changes.docs.find((change) => change.operation === 'update')

      await payload.branches.merge({ branch: 'lifecycle', changes: [updateChange!.id] })

      expect((await branchStatus('lifecycle'))?.status).toBe('open')

      // And it is still workable: the unmerged change is untouched.
      const onBranch = await payload.findByID({
        id: second.id,
        branch: 'lifecycle',
        collection: postsSlug,
      })

      expect(onBranch.title).toBe('created on branch')
    })

    it('should mark the branch merged but not closed when everything is applied', async () => {
      await payload.branches.merge({ branch: 'lifecycle' })

      const branch = await branchStatus('lifecycle')

      expect(branch?.status).toBe('merged')
      expect(branch?.mergedAt).toBeTruthy()
    })

    it('should reopen a merged branch as soon as it has a change again', async () => {
      await payload.branches.merge({ branch: 'lifecycle' })

      expect((await branchStatus('lifecycle'))?.status).toBe('merged')

      await payload.create({
        branch: 'lifecycle',
        collection: postsSlug,
        data: { title: 'more work after merging' },
      })

      // The branch is the workspace; merging it did not end it.
      const branch = await branchStatus('lifecycle')

      expect(branch?.status).toBe('open')
      expect(branch?.mergedAt).toBeFalsy()
    })

    it('should close the branch when the merge asks for it', async () => {
      await payload.branches.merge({ branch: 'lifecycle', closeBranch: true })

      const branch = await branchStatus('lifecycle')

      expect(branch?.status).toBe('closed')
      expect(branch?.mergedAt).toBeTruthy()
    })

    it('should leave the branch open when a partial merge asks to close it', async () => {
      await payload.create({
        branch: 'lifecycle',
        collection: postsSlug,
        data: { title: 'created on branch' },
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'lifecycle' } },
      })

      const updateChange = changes.docs.find((change) => change.operation === 'update')

      // Closing a branch that still holds work would abandon it.
      await payload.branches.merge({
        branch: 'lifecycle',
        changes: [updateChange!.id],
        closeBranch: true,
      })

      expect((await branchStatus('lifecycle'))?.status).toBe('open')
    })

    it('should refuse writes to a closed branch', async () => {
      await payload.branches.merge({ branch: 'lifecycle', closeBranch: true })

      await expect(
        payload.create({
          branch: 'lifecycle',
          collection: postsSlug,
          data: { title: 'work after closing' },
        }),
      ).rejects.toThrow()

      await expect(
        payload.update({
          id: mainDocID,
          branch: 'lifecycle',
          collection: postsSlug,
          data: { title: 'edit after closing' },
        }),
      ).rejects.toThrow()

      await expect(
        payload.delete({ id: mainDocID, branch: 'lifecycle', collection: postsSlug }),
      ).rejects.toThrow()

      // Main is untouched by any of the refusals.
      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('edited on branch')
    })

    it('should still allow reading a closed branch', async () => {
      await payload.branches.merge({ branch: 'lifecycle', closeBranch: true })

      // The archive has to remain readable, or the ledger would be unreachable.
      const onBranch = await payload.find({
        branch: 'lifecycle',
        collection: postsSlug,
        pagination: false,
      })

      expect(onBranch.docs.map((doc) => doc.title)).toContain('edited on branch')
    })

    it('should accumulate one ledger entry per merge across a reused branch', async () => {
      await payload.branches.merge({ branch: 'lifecycle' })

      await payload.update({
        id: mainDocID,
        branch: 'lifecycle',
        collection: postsSlug,
        data: { title: 'edited again on branch' },
      })

      await payload.branches.merge({ branch: 'lifecycle' })

      const events = await payload.find({
        collection: branchMergesSlug,
        pagination: false,
        sort: 'mergedAt',
        where: { branch: { equals: 'lifecycle' } },
      })

      expect(events.docs).toHaveLength(2)
    })
  })

  /**
   * Discard is merge's mirror: every operation reduces to dropping the branch's own
   * row, because that row *is* the change.
   */
  describe('Discarding changes', () => {
    let mainDocID: number | string
    let createdOnBranchID: number | string

    const pendingChanges = async () =>
      payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'discardwork' } },
      })

    beforeEach(async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Discard work', slug: 'discardwork' },
      })

      const doc = await payload.create({
        collection: postsSlug,
        data: { order: 1, title: 'original on main' },
      })

      mainDocID = doc.id

      await payload.update({
        id: mainDocID,
        branch: 'discardwork',
        collection: postsSlug,
        data: { order: 99, title: 'edited on branch' },
      })

      const created = await payload.create({
        branch: 'discardwork',
        collection: postsSlug,
        data: { title: 'created on branch' },
      })

      createdOnBranchID = created.id
    })

    afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug })
      }

      for (const collection of [branchChangesSlug, branchMergesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'discardwork' } },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    it('should revert a branch edit to main state', async () => {
      await payload.branches.discard({ branch: 'discardwork' })

      const onBranch = await payload.findByID({
        id: mainDocID,
        branch: 'discardwork',
        collection: postsSlug,
      })

      expect(onBranch.title).toBe('original on main')
      expect(onBranch.order).toBe(1)
    })

    it('should remove a document created on the branch', async () => {
      await payload.branches.discard({ branch: 'discardwork' })

      const rows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: createdOnBranchID } },
      })

      expect(rows.docs).toHaveLength(0)
    })

    it('should restore a document the branch had deleted', async () => {
      const doomed = await payload.create({
        collection: postsSlug,
        data: { title: 'doomed on main' },
      })

      await payload.delete({ id: doomed.id, branch: 'discardwork', collection: postsSlug })

      const hidden = await payload.find({
        branch: 'discardwork',
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: doomed.id } },
      })

      expect(hidden.docs).toHaveLength(0)

      const changes = await pendingChanges()
      const deleteChange = changes.docs.find((change) => change.operation === 'delete')

      await payload.branches.discard({ branch: 'discardwork', changes: [deleteChange!.id] })

      // Dropping the tombstone un-hides main's document on the branch.
      const restored = await payload.find({
        branch: 'discardwork',
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: doomed.id } },
      })

      expect(restored.docs).toHaveLength(1)
      expect(restored.docs[0]!.title).toBe('doomed on main')
    })

    it('should leave main untouched', async () => {
      await payload.branches.discard({ branch: 'discardwork' })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('original on main')
      expect(onMain.order).toBe(1)
    })

    it('should clear the changeset it discarded', async () => {
      await payload.branches.discard({ branch: 'discardwork' })

      expect((await pendingChanges()).docs).toHaveLength(0)
    })

    it('should discard only the selected changes', async () => {
      const changes = await pendingChanges()
      const updateChange = changes.docs.find((change) => change.operation === 'update')

      const result = await payload.branches.discard({
        branch: 'discardwork',
        changes: [updateChange!.id],
      })

      expect(result.discarded).toHaveLength(1)

      // The edit is reverted; the branch-created document is untouched.
      const reverted = await payload.findByID({
        id: mainDocID,
        branch: 'discardwork',
        collection: postsSlug,
      })
      const stillThere = await payload.findByID({
        id: createdOnBranchID,
        branch: 'discardwork',
        collection: postsSlug,
      })

      expect(reverted.title).toBe('original on main')
      expect(stillThere.title).toBe('created on branch')
      expect((await pendingChanges()).docs).toHaveLength(1)
    })

    it('should leave no shadow rows behind', async () => {
      await payload.branches.discard({ branch: 'discardwork' })

      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: { _branch: { not_equals: 'main' } },
      })

      expect(shadows.docs).toHaveLength(0)
    })

    it('should not mark the branch merged when everything is discarded', async () => {
      await payload.branches.discard({ branch: 'discardwork' })

      const branch = (
        await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: 'discardwork' } },
        })
      ).docs[0]

      // Nothing reached main, so the branch is simply empty again — not merged.
      expect(branch?.status).toBe('open')
    })

    it('should refuse to discard on a closed branch', async () => {
      await payload.branches.merge({ branch: 'discardwork', closeBranch: true })

      await expect(payload.branches.discard({ branch: 'discardwork' })).rejects.toThrow()
    })

    it('should discard through the REST endpoint', async () => {
      const branchDoc = (
        await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: 'discardwork' } },
        })
      ).docs[0]!

      const res = await restClient.POST(`/${branchesSlug}/${branchDoc.id}/discard`, {
        body: JSON.stringify({}),
        headers: { Authorization: `JWT ${token}` },
      })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.discarded).toHaveLength(2)
      expect((await pendingChanges()).docs).toHaveLength(0)
    })

    it('should reject an unauthenticated discard', async () => {
      const branchDoc = (
        await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: 'discardwork' } },
        })
      ).docs[0]!

      const res = await restClient.POST(`/${branchesSlug}/${branchDoc.id}/discard`, {
        auth: false,
        body: JSON.stringify({}),
      })

      expect([401, 403]).toContain(res.status)
      expect((await pendingChanges()).docs).toHaveLength(2)
    })
  })

  /**
   * Both merge and discard walk several changes in a loop and must apply either
   * all of them or none of them. A `req` supplied by an HTTP handler must not
   * change that: the transaction is owned by the operation, not by whoever
   * happens to have created the request object.
   */
  describe('Transactional integrity', () => {
    let branchSlug: string
    let deleteOneSpy: ReturnType<typeof vi.spyOn> | undefined

    afterEach(async () => {
      hookSpy.beforeChange = undefined
      deleteOneSpy?.mockRestore()
      deleteOneSpy = undefined

      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug })
      }

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: branchSlug } },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    it('should roll back every change in a non-streaming merge when a later change fails', async () => {
      branchSlug = 'txnmerge'

      const branchDoc = await payload.create({
        collection: branchesSlug,
        data: { name: 'Txn merge', slug: branchSlug },
      })

      const a = await payload.create({ collection: postsSlug, data: { title: 'A original' } })
      const b = await payload.create({ collection: postsSlug, data: { title: 'B original' } })
      const c = await payload.create({ collection: postsSlug, data: { title: 'C original' } })

      await payload.update({
        id: a.id,
        branch: 'txnmerge',
        collection: postsSlug,
        data: { title: 'A edited' },
      })
      await payload.update({
        id: b.id,
        branch: 'txnmerge',
        collection: postsSlug,
        data: { title: 'B edited' },
      })
      await payload.update({
        id: c.id,
        branch: 'txnmerge',
        collection: postsSlug,
        data: { title: 'C edited' },
      })

      hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
        if (data.title === 'B edited') {
          throw new Error('Simulated validation failure')
        }
      }

      const res = await restClient.POST(`/${branchesSlug}/${branchDoc.id}/merge`, {
        body: JSON.stringify({}),
        headers: { Authorization: `JWT ${token}` },
      })

      hookSpy.beforeChange = undefined

      expect(res.status).toBeGreaterThanOrEqual(400)

      const onMainA = await payload.findByID({ id: a.id, collection: postsSlug })
      const onMainB = await payload.findByID({ id: b.id, collection: postsSlug })
      const onMainC = await payload.findByID({ id: c.id, collection: postsSlug })

      // Not "B was rejected but A and C went through" — the batch is one unit.
      expect(onMainA.title).toBe('A original')
      expect(onMainB.title).toBe('B original')
      expect(onMainC.title).toBe('C original')

      const remainingChanges = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'txnmerge' } },
      })

      expect(remainingChanges.docs).toHaveLength(3)
    })

    it('should roll back every change in a discard when a later change fails', async () => {
      branchSlug = 'txndiscard'

      const branchDoc = await payload.create({
        collection: branchesSlug,
        data: { name: 'Txn discard', slug: branchSlug },
      })

      const a = await payload.create({ collection: postsSlug, data: { title: 'A original' } })
      const b = await payload.create({ collection: postsSlug, data: { title: 'B original' } })
      const c = await payload.create({ collection: postsSlug, data: { title: 'C original' } })

      await payload.update({
        id: a.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'A edited' },
      })
      await payload.update({
        id: b.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'B edited' },
      })
      await payload.update({
        id: c.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'C edited' },
      })

      const shadowRows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: { _branch: { equals: branchSlug } },
      })

      const bShadow = shadowRows.docs.find((row) => String(row._branchDocID) === String(b.id))!

      const originalDeleteOne = payload.db.deleteOne.bind(payload.db)

      deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
        if (args?.where?.id?.equals === bShadow.id) {
          throw new Error('Simulated database failure')
        }

        return originalDeleteOne(args)
      })

      const res = await restClient.POST(`/${branchesSlug}/${branchDoc.id}/discard`, {
        body: JSON.stringify({}),
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBeGreaterThanOrEqual(400)

      // A's shadow row was already dropped by the time B failed — the whole
      // batch is one transaction, so that drop must be undone too.
      const onBranchA = await payload.findByID({
        id: a.id,
        branch: branchSlug,
        collection: postsSlug,
      })

      expect(onBranchA.title).toBe('A edited')

      const remainingChanges = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branchSlug } },
      })

      expect(remainingChanges.docs).toHaveLength(3)
    })
  })

  /**
   * `forkDocument` (and the tombstone path in `resolveBranchDelete`) check
   * whether the branch already has a shadow row, then create one if not. Two
   * concurrent first-edits of the same document on the same branch can both
   * pass that check before either write lands, each creating its own row.
   */
  describe('Fork race safety', () => {
    afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug })
      }

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'racebranch' } },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    it('should create exactly one shadow row when two edits race to fork the same document', async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Race', slug: 'racebranch' },
      })

      const doc = await payload.create({ collection: postsSlug, data: { title: 'racer' } })

      await Promise.all([
        payload.update({
          id: doc.id,
          branch: 'racebranch',
          collection: postsSlug,
          data: { title: 'edit A' },
        }),
        payload.update({
          id: doc.id,
          branch: 'racebranch',
          collection: postsSlug,
          data: { title: 'edit B' },
        }),
      ])

      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: {
          and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
        },
      })

      expect(shadows.docs).toHaveLength(1)

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'racebranch' } },
      })

      expect(changes.docs).toHaveLength(1)
    })

    it('should create exactly one tombstone when two deletes race to remove the same never-forked document', async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Race', slug: 'racebranch' },
      })

      const doc = await payload.create({ collection: postsSlug, data: { title: 'doomed' } })

      // Whichever delete loses the DB-level race recovers gracefully (asserted
      // below by the row counts). Occasionally, though, one delete finishes
      // entirely — tombstoning the document and hiding it on this branch —
      // before the other's own lookup of the document to delete even runs;
      // that lookup then legitimately finds nothing, which is `NotFound`, not
      // a bug. Either outcome is acceptable here; a raw, unhandled database
      // error from the race itself is not.
      const results = await Promise.allSettled([
        payload.delete({ id: doc.id, branch: 'racebranch', collection: postsSlug }),
        payload.delete({ id: doc.id, branch: 'racebranch', collection: postsSlug }),
      ])

      const rejectedNames = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => (result.reason as { name?: string })?.name)

      expect(rejectedNames.every((name) => name === 'NotFound')).toBe(true)

      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: {
          and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
        },
      })

      expect(shadows.docs).toHaveLength(1)
      expect(shadows.docs[0]!._branchOp).toBe('delete')

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'racebranch' } },
      })

      expect(changes.docs).toHaveLength(1)
    })
  })

  /**
   * §16's scheduled merge. Shaped like scheduled publish — a `payload-jobs` row with
   * `waitUntil` and the queueing user — so these cover what merging adds to that: the
   * permission re-check at fire time, and a branch that moved in between.
   */
  describe('Scheduled merge', () => {
    let mainDocID: number | string
    // Captured rather than looked up by slug: `slug` de-duplicates against existing
    // branches, so a leftover row would silently rename this one and every assertion
    // would then be reading a different branch.
    let branchID: number | string
    let branchSlug: string

    /**
     * Queues a scheduled merge and fires it immediately.
     *
     * `waitUntil` is backdated rather than set to `new Date()`. The runner takes jobs
     * whose `waitUntil` is *strictly* less than now, so a job queued and run inside the
     * same millisecond is not due yet: `runByID` finds nothing, returns quietly, and
     * the assertion that follows reads a merge that never happened.
     */
    const runScheduledMerge = async (input: Record<string, unknown>) =>
      payload.jobs.runByID({
        id: (
          await payload.jobs.queue({
            input: { branch: branchSlug, ...input },
            task: 'scheduleMerge',
            waitUntil: new Date(Date.now() - 60_000),
          })
        ).id,
      })

    const readBranch = async () => payload.findByID({ id: branchID, collection: branchesSlug })

    /**
     * What the merge actually did, as one object.
     *
     * Asserted as a whole rather than field by field, because the interesting failures
     * are silent ones: a job that never ran and a merge that refused both leave main
     * untouched, and a status of `open` says the branch did not finish without saying
     * why. Failing on the whole object puts the pending changes and the job's own row
     * in the diff.
     */
    const mergeOutcome = async () => {
      const [branch, changes, jobs] = await Promise.all([
        payload.findByID({ id: branchID, collection: branchesSlug, disableErrors: true }),
        payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: branchSlug } },
        }),
        payload.find({
          collection: 'payload-jobs',
          pagination: false,
          where: { taskSlug: { equals: 'scheduleMerge' } },
        }),
      ])

      return {
        jobsRun: jobs.docs.map((job) => ({
          error: job.error,
          hasError: job.hasError,
          totalTried: job.totalTried,
        })),
        pendingChanges: changes.docs.map((change) => ({
          collectionSlug: change.collectionSlug,
          operation: change.operation,
        })),
        status: branch?.status,
      }
    }

    const asDevUser = async () =>
      (
        await payload.find({
          collection: 'users',
          pagination: false,
          where: { email: { equals: devUser.email } },
        })
      ).docs[0]!

    beforeEach(async () => {
      const branchDoc = await payload.create({
        collection: branchesSlug,
        data: { name: 'Scheduled', slug: 'scheduled' },
      })

      branchID = branchDoc.id
      branchSlug = branchDoc.slug

      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'original on main' },
      })

      mainDocID = doc.id

      await payload.update({
        id: mainDocID,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })
    })

    afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug })
      }

      for (const collection of [branchChangesSlug, branchMergesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { branch: { equals: branchSlug } },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }

      await payload.delete({ id: branchID, collection: branchesSlug })

      const jobs = await payload.find({ collection: 'payload-jobs', pagination: false })

      for (const job of jobs.docs) {
        await payload.delete({ id: job.id, collection: 'payload-jobs' })
      }
    })

    it('should register the scheduleMerge task when branching is enabled', () => {
      expect(payload.config.jobs.tasks.map((task) => task.slug)).toContain('scheduleMerge')
    })

    it('should apply the branch when the job runs', async () => {
      const user = await asDevUser()

      await runScheduledMerge({ user: user.id })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('edited on branch')
    })

    it('should close the branch when the schedule asked for it', async () => {
      const user = await asDevUser()

      await runScheduledMerge({ closeBranch: true, user: user.id })

      // Nothing pending is what earns the close, so both are asserted together: a
      // status of `open` with a change still listed is a merge that did not run.
      expect(await mergeOutcome()).toMatchObject({ pendingChanges: [], status: 'closed' })
    })

    it('should refuse to merge when the queueing user no longer resolves', async () => {
      // Scheduled publish falls back to `overrideAccess` here. A merge writes across
      // production, so the same fallback would turn a deleted account into an
      // unchecked one — this fails instead.
      const job = await payload.jobs.queue({
        input: { branch: branchSlug, user: 999999 },
        task: 'scheduleMerge',
        waitUntil: new Date(Date.now() - 60_000),
      })

      await payload.jobs.runByID({ id: job.id })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('original on main')

      // Asserted explicitly: "nothing was merged" is also what a job that never ran
      // looks like, so without this the test passes whether or not it fired.
      const ran = await payload.findByID({ id: job.id, collection: 'payload-jobs' })

      expect(ran.hasError).toBe(true)
      expect(ran.totalTried).toBeGreaterThan(0)
    })

    it('should skip queued changes that no longer exist', async () => {
      const user = await asDevUser()

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branchSlug } },
      })

      const realChangeID = String(changes.docs[0]!.id)

      // A change discarded between queueing and firing simply does not match.
      await runScheduledMerge({ changes: [realChangeID, '999999'], user: user.id })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('edited on branch')
    })

    it('should clear the branch progress marker when the job finishes', async () => {
      const user = await asDevUser()

      await runScheduledMerge({ user: user.id })

      // A stale "1/1" outlives the run and reads as a merge still in flight.
      expect((await readBranch()).mergeProgress).toBeFalsy()
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
        id: docID,
        branch: 'restmerge',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })
    })

    afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug })
      }

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'restmerge' } },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    // A merge is a write to main performed on a branch's behalf, so it has to bypass
    // branch resolution — including when the request that triggered it names a branch.
    // The create-promotion write went through `updateByIDOperation`, which takes no
    // `branch` argument and reads the request, so with `?branch=` the promotion resolved
    // against the branch it was merging and silently did nothing.
    it('should merge even when the triggering request names the branch', async () => {
      const created = await payload.create({
        branch: 'restmerge',
        collection: postsSlug,
        data: { title: 'created on branch' },
      })

      const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge?branch=restmerge`, {
        body: JSON.stringify({}),
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(200)

      // Both operations the merge performs: the promotion of a branch-created document,
      // and the update of a document that already existed on main.
      const promoted = await payload.findByID({ id: created.id, collection: postsSlug })
      const updated = await payload.findByID({ id: docID, collection: postsSlug })

      expect(promoted.title).toBe('created on branch')
      expect(updated.title).toBe('edited on branch')
    })

    it('should reject an unauthenticated merge', async () => {
      const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
        // NextRESTClient attaches its stored token unless auth is disabled.
        auth: false,
        body: JSON.stringify({}),
      })

      expect([401, 403]).toContain(res.status)

      const onMain = await payload.findByID({ id: docID, collection: postsSlug })

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

      const onMain = await payload.findByID({ id: docID, collection: postsSlug })

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

      const onMain = await payload.findByID({ id: docID, collection: postsSlug })

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
        id: restricted.id,
        branch: 'restmerge',
        collection: restrictedSlug,
        data: { title: 'edited on branch' },
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
        await payload.delete({ id: row.id, branch: false, collection: restrictedSlug })
      }

      await payload.delete({ id: editor.id, collection: 'users' })
    })

    it('should return 404 for an unknown branch', async () => {
      const res = await restClient.POST(`/${branchesSlug}/999999/merge`, {
        body: JSON.stringify({}),
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(404)
    })

    /**
     * A merge walks an arbitrary number of documents one at a time, so the panel
     * needs to report where it is. Streaming the loop it already runs avoids
     * inventing a job and a polling endpoint to carry that state.
     */
    describe('streamed progress', () => {
      /** Parses the NDJSON body into the events the client would see. */
      const readEvents = (body: string) =>
        body
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line) as Record<string, any>)

      it('should stream one progress event per change and finish with the result', async () => {
        const second = await payload.create({
          branch: 'restmerge',
          collection: postsSlug,
          data: { title: 'created on branch' },
        })

        const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
          body: JSON.stringify({ stream: true }),
          headers: { Authorization: `JWT ${token}` },
        })

        expect(res.status).toBe(200)
        expect(res.headers.get('content-type')).toContain('application/x-ndjson')

        const events = readEvents(await res.text())
        const progress = events.filter((event) => event.type === 'progress')
        const complete = events.find((event) => event.type === 'complete')

        expect(progress).toHaveLength(2)
        expect(progress.map((event) => event.current)).toEqual([1, 2])
        progress.forEach((event) => expect(event.total).toBe(2))

        expect(complete).toBeDefined()
        expect(complete!.result.merged).toHaveLength(2)

        // The stream is the whole response: the writes really happened.
        const onMain = await payload.findByID({ id: docID, collection: postsSlug })
        const created = await payload.findByID({ id: second.id, collection: postsSlug })

        expect(onMain.title).toBe('edited on branch')
        expect(created.title).toBe('created on branch')
      })

      it('should stream only the selected changes', async () => {
        await payload.create({
          branch: 'restmerge',
          collection: postsSlug,
          data: { title: 'created on branch' },
        })

        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'restmerge' } },
        })

        const updateChange = changes.docs.find((change) => change.operation === 'update')

        const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
          body: JSON.stringify({ changes: [updateChange!.id], stream: true }),
          headers: { Authorization: `JWT ${token}` },
        })

        const events = readEvents(await res.text())
        const complete = events.find((event) => event.type === 'complete')

        expect(events.filter((event) => event.type === 'progress')).toHaveLength(1)
        expect(complete!.result.merged).toHaveLength(1)

        // The unselected change keeps the branch open.
        const remaining = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'restmerge' } },
        })

        expect(remaining.docs).toHaveLength(1)
        expect(remaining.docs[0]!.operation).toBe('create')
      })

      it('should enforce access on the streamed path too', async () => {
        const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
          auth: false,
          body: JSON.stringify({ stream: true }),
        })

        expect([401, 403]).toContain(res.status)

        const onMain = await payload.findByID({ id: docID, collection: postsSlug })

        expect(onMain.title).toBe('original on main')
      })

      it('should fall back to a plain JSON response for a dryRun', async () => {
        const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
          body: JSON.stringify({ dryRun: true, stream: true }),
          headers: { Authorization: `JWT ${token}` },
        })

        expect(res.headers.get('content-type')).toContain('application/json')

        const data = await res.json()

        expect(data.mergeable).toHaveLength(1)

        const onMain = await payload.findByID({ id: docID, collection: postsSlug })

        expect(onMain.title).toBe('original on main')
      })
    })
  })
})

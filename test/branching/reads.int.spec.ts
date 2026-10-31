import type { Payload } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import {
  branchChangesSlug,
  branchesSlug,
  categoriesSlug,
  excludedSlug,
  headerGlobalSlug,
  pagesSlug,
  postsSlug,
  publicSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: reads', { config: './config.ts', resetBetweenTests: false }, () => {
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

  test.describe('Read path — documents created on a branch', () => {
    const mainIDs: (number | string)[] = []
    const branchIDs: (number | string)[] = []

    test.beforeAll(async () => {
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

    test.afterAll(async () => {
      for (const id of [...mainIDs, ...branchIDs]) {
        await payload.delete({ id, branch: false, collection: postsSlug })
      }
      mainIDs.length = 0
      branchIDs.length = 0
    })

    test('should hide a document created on a branch from main', async () => {
      const result = await payload.find({ collection: postsSlug, pagination: false })
      const ids = result.docs.map((doc) => doc.id)

      expect(ids).toHaveLength(25)
      for (const branchID of branchIDs) {
        expect(ids).not.toContain(branchID)
      }
    })

    test('should return a document created on a branch when reading that branch', async () => {
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

    test('should isolate two concurrent branches from each other', async () => {
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
    test('should keep pagination and totalDocs correct on main', async () => {
      const page1 = await payload.find({ collection: postsSlug, limit: 10, page: 1 })

      expect(page1.totalDocs).toBe(25)
      expect(page1.totalPages).toBe(3)
      expect(page1.docs).toHaveLength(10)
    })

    test('should keep pagination and totalDocs correct on a branch', async () => {
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

    test('should not return the same document on two pages of a branch read', async () => {
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

    test('should agree between count and find on a branch', async () => {
      const counted = await payload.count({ branch: 'halloween', collection: postsSlug })
      const found = await payload.find({
        branch: 'halloween',
        collection: postsSlug,
        pagination: false,
      })

      expect(counted.totalDocs).toBe(found.docs.length)
      expect(counted.totalDocs).toBe(30)
    })

    test('should record branch-created documents in the changeset registry', async () => {
      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'halloween' } },
      })

      expect(changes.docs).toHaveLength(5)
      expect(changes.docs[0]).toMatchObject({
        collectionSlug: postsSlug,
        documentID: String(changes.docs[0]!.doc?.value),
        entityType: 'collection',
        operation: 'create',
      })
    })

    test('should leave a branching-disabled collection unaffected by branch context', async () => {
      const doc = await payload.create({
        branch: 'halloween',
        collection: excludedSlug,
        data: { title: 'excluded' },
      })

      const fromMain = await payload.find({ collection: excludedSlug, pagination: false })

      expect(fromMain.docs.map((each) => each.id)).toContain(doc.id)

      await payload.delete({ id: doc.id, collection: excludedSlug })
    })

    test.todo('should leave query shapes unchanged when branching is disabled')
  })

  test.describe('Branch resolution', () => {
    test.todo(
      'should resolve the branch identically via Local API arg, query param and stored preference',
    )
    test.todo('should always resolve req.user from main, even on a branch')
  })

  /**
   * The gaps a coverage audit turned up: behaviours that are implemented and load-bearing
   * but were never asserted, so a regression in any of them would have been silent.
   */
  test.describe('Audit gaps', () => {
    const branch = 'auditwork'

    test.beforeAll(async () => {
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

    test.afterEach(async () => {
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
    test('should keep canonical IDs when selecting fields on a branch drafts read', async () => {
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

    test('should keep canonical IDs when selecting fields on a branch version read', async () => {
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
    test('should fork every matching document on a bulk update', async () => {
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

    test('should tombstone every matching document on a bulk delete', async () => {
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

    // Plan §15's precedence contract. The general form of the bug this audit started
    // from: the Local API argument and the query param must resolve to the same branch,
    // or one entry point quietly reads production while the other reads the branch.
    test('should resolve the same branch from a Local API argument and a query param', async () => {
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

  // `findDistinct` had no branch predicate in either adapter, so a branch's shadow rows
  // fed main's distinct values and the branch's own edits were missing from its own.
  test.describe('Distinct values on a branch', () => {
    const branch = 'distinctwork'
    const created: (number | string)[] = []

    test.beforeAll(async () => {
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

    test.afterEach(async () => {
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

    test('should reflect a branch edit and hide it from main', async () => {
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
  test.describe('Branch visibility', () => {
    let publicDocID: number | string
    const privateBranch = 'private-visibility'

    test.beforeAll(async () => {
      for (const branch of ['visibility', privateBranch]) {
        const existing = await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: branch } },
        })

        if (!existing.docs.length) {
          await payload.create({
            collection: branchesSlug,
            data: {
              name: branch === privateBranch ? 'Private visibility' : 'Visibility',
              slug: branch,
            },
          })
        }
      }
    })

    test.beforeEach(async () => {
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

      await payload.update({
        id: doc.id,
        branch: privateBranch,
        collection: publicSlug,
        data: { _status: 'published', title: 'private unreleased content' },
      })

      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'main navigation' },
      })
    })

    test.afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: publicSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: publicSlug }).catch(() => {})
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { in: ['visibility', privateBranch] } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }
    })

    test('should refuse an anonymous read that names a branch', async () => {
      const res = await restClient.GET(`/${publicSlug}/${publicDocID}?branch=visibility`, {
        auth: false,
      })

      expect(res.status).toBe(403)
    })

    test('should still serve main to an anonymous reader', async () => {
      // The gate must not cost anything to a request that never mentions a branch —
      // the public site is this request.
      const res = await restClient.GET(`/${publicSlug}/${publicDocID}`, { auth: false })

      expect(res.status).toBe(200)
      expect((await res.json()).title).toBe('live on main')
    })

    test('should refuse an anonymous list read that names a branch', async () => {
      const res = await restClient.GET(`/${publicSlug}?branch=visibility`, { auth: false })

      expect(res.status).toBe(403)
    })

    test('should refuse collection document access checks on an unreadable branch', async () => {
      const res = await restClient.POST(
        `/${publicSlug}/access/${publicDocID}?branch=${privateBranch}`,
        { auth: false, body: JSON.stringify({}) },
      )

      expect(res.status).toBe(403)
    })

    test('should refuse global document access checks on an unreadable branch', async () => {
      const res = await restClient.POST(
        `/globals/${headerGlobalSlug}/access?branch=${privateBranch}`,
        {
          auth: false,
          body: JSON.stringify({}),
        },
      )

      expect(res.status).toBe(403)
    })

    test('should serve the branch copy to a reader who can see the branch', async () => {
      const res = await restClient.GET(`/${publicSlug}/${publicDocID}?branch=visibility`, {
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(200)
      expect((await res.json()).title).toBe('unreleased on branch')
    })

    test('should refuse a branch that does not exist', async () => {
      // Same answer as an unreadable branch, deliberately: distinguishing them would
      // tell an anonymous caller which branch names exist.
      const res = await restClient.GET(`/${publicSlug}/${publicDocID}?branch=no-such-branch`, {
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(403)
    })

    test('should let a trusted Local API caller override branch access', async () => {
      const onBranch = await payload.findByID({
        id: publicDocID,
        branch: privateBranch,
        collection: publicSlug,
        overrideAccess: true,
      })

      expect(onBranch.title).toBe('private unreleased content')
    })

    test('should enforce branch access for the Local API by default', async () => {
      await expect(
        payload.findByID({
          id: publicDocID,
          branch: privateBranch,
          collection: publicSlug,
          overrideAccess: false,
          user: {
            id: 'restricted-user',
            collection: 'users',
            email: 'restricted@example.com',
          } as never,
        }),
      ).rejects.toThrow()
    })

    test('should enforce branch access for Local API global reads', async () => {
      await expect(
        payload.findGlobal({
          slug: headerGlobalSlug,
          branch: privateBranch,
          overrideAccess: false,
          user: {
            id: 'restricted-user',
            collection: 'users',
            email: 'restricted@example.com',
          } as never,
        }),
      ).rejects.toThrow()
    })
  })
})

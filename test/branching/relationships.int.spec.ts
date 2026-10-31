import type { Payload, PayloadRequest } from 'payload'

import { createDataloaderCacheKey, createPayloadRequest, isolateObjectProperty } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import {
  branchChangesSlug,
  branchesSlug,
  categoriesSlug,
  numericIDSlug,
  pagesSlug,
  postsSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: relationships', { config: './config.ts', resetBetweenTests: false }, () => {
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

  /**
   * Depth-populated relationships. The dataloader batches population and caches by a key
   * that did not include the branch, so a document ID could resolve to the wrong branch's
   * copy — and the population read itself has to carry the branch to find a related
   * document that only exists on it.
   */
  test.describe('Populated relationships on a branch', () => {
    const branch = 'populatework'
    const other = 'populateother'

    test.beforeAll(async () => {
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

    test.afterEach(async () => {
      for (const collection of [postsSlug, categoriesSlug, numericIDSlug] as const) {
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

    test.each([
      [
        'single',
        ({ categoryID, req }: { categoryID: number | string; req: PayloadRequest }) =>
          payload.update({
            id: categoryID,
            collection: categoriesSlug,
            data: { name: 'branch category' },
            req,
          }),
      ],
      [
        'bulk',
        ({ categoryID, req }: { categoryID: number | string; req: PayloadRequest }) =>
          payload.update({
            collection: categoriesSlug,
            data: { name: 'branch category' },
            req,
            where: { id: { equals: categoryID } },
          }),
      ],
    ] as const)(
      'should refresh populated relationships after a %s branch update on the same request',
      async (_operation, updateCategory) => {
        const category = await payload.create({
          collection: categoriesSlug,
          data: { name: 'main category' },
        })
        const post = await payload.create({
          collection: postsSlug,
          data: { category: category.id, title: 'points at updated category' },
        })
        const req = await createPayloadRequest({ branch, payload })
        const beforeUpdate = await payload.findByID({
          id: post.id,
          collection: postsSlug,
          depth: 1,
          req,
        })

        await updateCategory({ categoryID: category.id, req })

        const afterUpdate = await payload.findByID({
          id: post.id,
          collection: postsSlug,
          depth: 1,
          req,
        })

        expect((beforeUpdate.category as { name?: string })?.name).toBe('main category')
        expect((afterUpdate.category as { name?: string })?.name).toBe('branch category')
      },
    )

    test('should populate a related document that exists only on the branch', async () => {
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

    test('should populate the branch copy of a document that also exists on main', async () => {
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

    test('should refresh populated relationships after a branch delete on the same request', async () => {
      const category = await payload.create({
        collection: categoriesSlug,
        data: { name: 'main category' },
      })
      const post = await payload.create({
        collection: postsSlug,
        data: { category: category.id, title: 'points at deleted category' },
      })
      const req = await createPayloadRequest({ branch, payload })
      const beforeDelete = await payload.findByID({
        id: post.id,
        collection: postsSlug,
        depth: 1,
        req,
      })

      await payload.delete({ id: category.id, collection: categoriesSlug, req })

      const afterDelete = await payload.findByID({
        id: post.id,
        collection: postsSlug,
        depth: 1,
        req,
      })

      expect((beforeDelete.category as { name?: string })?.name).toBe('main category')
      expect(String(afterDelete.category)).toBe(String(category.id))
    })

    test('should refresh populated relationships after a branch create on the same request', async () => {
      const req = await createPayloadRequest({ branch, payload })
      const documentID = 9_812_345
      const cacheKey = createDataloaderCacheKey({
        branch,
        collectionSlug: numericIDSlug,
        currentDepth: 0,
        depth: 1,
        docID: documentID,
        draft: false,
        fallbackLocale: req.fallbackLocale!,
        locale: req.locale!,
        overrideAccess: true,
        showHiddenFields: false,
        transactionID: req.transactionID!,
      })
      const beforeCreate = await req.payloadDataLoader.load(cacheKey)

      await payload.create({
        collection: numericIDSlug,
        data: { id: documentID, title: 'created on branch' },
        req,
      })

      const afterCreate = await req.payloadDataLoader.load(cacheKey)

      expect(beforeCreate).toBeNull()
      expect(afterCreate).toMatchObject({ id: documentID, title: 'created on branch' })
    })

    test('should not serve one branch a populated document cached for another', async () => {
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
      const base = await createPayloadRequest({ payload })

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

  test.describe('Joins', () => {
    let categoryID: number | string
    let mainPostID: number | string
    let branchPostID: number | string

    test.beforeEach(async () => {
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

    test.afterEach(async () => {
      for (const slug of [postsSlug, pagesSlug, categoriesSlug]) {
        const rows = await payload.find({
          branch: false,
          collection: slug,
          pagination: false,
        })

        for (const row of rows.docs) {
          await payload.delete({
            id: row.id,
            branch: false,
            collection: slug,
          })
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

    test('should exclude branch-created documents from a join read on main', async () => {
      const onMain = await payload.findByID({ id: categoryID, collection: categoriesSlug })
      const ids = (onMain.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))

      expect(ids).toContain(String(mainPostID))
      expect(ids).not.toContain(String(branchPostID))
    })

    test('should include branch-created documents in a join read on that branch', async () => {
      const onBranch = await payload.findByID({
        id: categoryID,
        branch: 'joinwork',
        collection: categoriesSlug,
      })
      const ids = (onBranch.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))

      expect(ids).toContain(String(mainPostID))
      expect(ids).toContain(String(branchPostID))
    })

    test('should exclude branch-deleted documents from a join read on that branch', async () => {
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

    test('should not surface a shadow row as a separate join entry', async () => {
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

    test('should filter join paths with the active branch content', async () => {
      await payload.update({
        id: mainPostID,
        branch: 'joinwork',
        collection: postsSlug,
        data: { title: 'edited join title' },
      })

      const mainTitleOnBranch = await payload.find({
        branch: 'joinwork',
        collection: categoriesSlug,
        where: { 'posts.title': { equals: 'main post' } },
      })
      const branchTitleOnBranch = await payload.find({
        branch: 'joinwork',
        collection: categoriesSlug,
        where: { 'posts.title': { equals: 'edited join title' } },
      })
      const mainTitleCount = await payload.count({
        branch: 'joinwork',
        collection: categoriesSlug,
        where: { 'posts.title': { equals: 'main post' } },
      })

      expect(mainTitleOnBranch.docs).toHaveLength(0)
      expect(mainTitleOnBranch.totalDocs).toBe(0)
      expect(mainTitleCount.totalDocs).toBe(0)
      expect(branchTitleOnBranch.docs.map((doc) => String(doc.id))).toContain(String(categoryID))
    })

    test('should use the active branch draft in a join read', async () => {
      const page = await payload.create({
        collection: pagesSlug,
        data: { _status: 'draft', category: categoryID, title: 'main draft' },
        draft: true,
      })

      await payload.update({
        id: page.id,
        branch: 'joinwork',
        collection: pagesSlug,
        data: { title: 'branch draft' },
        draft: true,
      })

      const onBranch = await payload.findByID({
        id: categoryID,
        branch: 'joinwork',
        collection: categoriesSlug,
        draft: true,
      })
      const onMain = await payload.findByID({
        id: categoryID,
        collection: categoriesSlug,
        draft: true,
      })
      const branchDraft = (onBranch as any).pages?.docs[0]
      const mainDraft = (onMain as any).pages?.docs[0]

      expect(branchDraft?.title).toBe('branch draft')
      expect(mainDraft?.title).toBe('main draft')
    })

    test('should return a canonical document ID from a branch draft join', async () => {
      const page = await payload.create({
        collection: pagesSlug,
        data: { _status: 'draft', category: categoryID, title: 'main draft' },
        draft: true,
      })

      await payload.update({
        id: page.id,
        branch: 'joinwork',
        collection: pagesSlug,
        data: { title: 'branch draft' },
        draft: true,
      })

      const onBranch = await payload.findByID({
        id: categoryID,
        branch: 'joinwork',
        collection: categoriesSlug,
        draft: true,
      })
      const branchDraft = (onBranch as any).pages?.docs[0]

      expect(String(branchDraft?.id ?? branchDraft)).toBe(String(page.id))
    })

    test('should scope every polymorphic join target to the active branch', async () => {
      const mainPage = await payload.create({
        collection: pagesSlug,
        data: { category: categoryID, title: 'main page' },
      })
      const branchPage = await payload.create({
        branch: 'joinwork',
        collection: pagesSlug,
        data: { category: categoryID, title: 'branch page' },
      })

      await payload.update({
        id: mainPostID,
        branch: 'joinwork',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })
      await payload.delete({ id: mainPage.id, branch: 'joinwork', collection: pagesSlug })

      const onBranch = await payload.findByID({
        id: categoryID,
        branch: 'joinwork',
        collection: categoriesSlug,
      })
      const onMain = await payload.findByID({ id: categoryID, collection: categoriesSlug })
      const getReferences = (
        docs: Array<{ relationTo: string; value: { id: number | string } | number | string }>,
      ) =>
        docs.map(
          ({ relationTo, value }) =>
            `${relationTo}:${String(typeof value === 'object' ? value.id : value)}`,
        )
      const branchReferences = getReferences(onBranch.content?.docs ?? [])
      const mainReferences = getReferences(onMain.content?.docs ?? [])

      expect(
        branchReferences.filter((reference) => reference === `${postsSlug}:${mainPostID}`),
      ).toHaveLength(1)
      expect(branchReferences).toContain(`${pagesSlug}:${branchPage.id}`)
      expect(branchReferences).not.toContain(`${pagesSlug}:${mainPage.id}`)
      expect(mainReferences).toContain(`${postsSlug}:${mainPostID}`)
      expect(mainReferences).toContain(`${pagesSlug}:${mainPage.id}`)
      expect(mainReferences).not.toContain(`${pagesSlug}:${branchPage.id}`)
    })
  })
})

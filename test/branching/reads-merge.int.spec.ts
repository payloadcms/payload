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
  headerGlobalSlug,
  pagesSlug,
  postsSlug,
  publicSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: reads-merge', { config: './config.ts', resetBetweenTests: false }, () => {
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

    // The plan's own #1 risk. The merge-create promotion updates the shadow row in place
    // rather than recreating it *specifically* so inbound relationship rows survive —
    // deleting the row would cascade them away, and rebuilding it does not bring them
    // back. A regression here silently nulls relationships after a merge.
    test('should preserve inbound relationships when merging a branch-created document', async () => {
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

      const result = await payload.branches.merge({ branch })

      expect(result.blocked).toEqual([])
      expect(result.validationErrors).toEqual([])
      expect(result.merged).toHaveLength(2)

      const rawPost = await payload.db.findOne({
        branch: false,
        collection: postsSlug,
        req: await createPayloadRequest({ branch: false, payload }),
        where: { id: { equals: post.id } },
      })

      expect(rawPost).toMatchObject({ _branch: 'main' })

      const onMain = await payload.findByID({ id: post.id, collection: postsSlug, depth: 1 })
      const related = onMain.category as { id?: number | string; name?: string } | null

      // Populated, not a bare ID and not null: the relationship row survived the merge.
      expect(related).toBeTruthy()
      expect(typeof related).toBe('object')
      expect(related?.name).toBe('branch category')
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

    test('should enforce branch access for Local API merges by default', async () => {
      await expect(
        payload.branches.merge({
          branch: privateBranch,
          dryRun: true,
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

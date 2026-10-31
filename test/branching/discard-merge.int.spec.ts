import type { Payload } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { hookSpy } from './hookSpy.js'

import { branchChangesSlug, branchesSlug, branchMergesSlug, postsSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: discard-merge', { config: './config.ts', resetBetweenTests: false }, () => {
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
   * Discard is merge's mirror: every operation reduces to dropping the branch's own
   * row, because that row *is* the change.
   */
  test.describe('Discarding changes', () => {
    let mainDocID: number | string
    let createdOnBranchID: number | string

    const pendingChanges = async () =>
      payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'discardwork' } },
      })

    const asDevUser = async () =>
      (
        await payload.find({
          collection: 'users',
          pagination: false,
          where: { email: { equals: devUser.email } },
        })
      ).docs[0]!

    test.beforeEach(async () => {
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

    test.afterEach(async () => {
      hookSpy.discardBranchAccess = undefined

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

    test('should refuse to discard on a closed branch', async () => {
      await payload.branches.merge({ branch: 'discardwork', closeBranch: true })

      await expect(payload.branches.discard({ branch: 'discardwork' })).rejects.toThrow()
    })
  })
})

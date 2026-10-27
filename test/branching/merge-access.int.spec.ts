import type { Payload } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { hookSpy } from './hookSpy.js'

import { branchChangesSlug, branchesSlug, postsSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: merge-access', { config: './config.ts', resetBetweenTests: false }, () => {
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

  test.describe('Merge branch action access', () => {
    const branchSlug = 'merge-action-access'
    let mainDocID: number | string

    const pendingChanges = () =>
      payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branchSlug } },
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
        data: { name: 'Merge action access', slug: branchSlug },
      })
      const mainDoc = await payload.create({
        collection: postsSlug,
        data: { title: 'original on main' },
      })

      mainDocID = mainDoc.id

      await payload.update({
        id: mainDocID,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })
    })

    test.afterEach(async () => {
      hookSpy.mergeBranchAccess = undefined

      const branches = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: branchSlug } },
      })

      for (const branch of branches.docs) {
        await payload.delete({ id: branch.id, collection: branchesSlug })
      }

      const posts = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
      })

      for (const post of posts.docs) {
        await payload.delete({ id: post.id, branch: false, collection: postsSlug })
      }
    })

    test('should deny a Local API dry run when mergeBranch returns false', async () => {
      const user = await asDevUser()

      hookSpy.mergeBranchAccess = () => false

      await expect(
        payload.branches.merge({
          branch: branchSlug,
          dryRun: true,
          overrideAccess: false,
          user: { ...user, collection: 'users' },
        }),
      ).rejects.toThrow()

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('original on main')
      expect((await pendingChanges()).docs).toHaveLength(1)
    })

    test('should deny a Local API merge when mergeBranch returns a non-matching query', async () => {
      const user = await asDevUser()

      hookSpy.mergeBranchAccess = () => ({ slug: { equals: 'another-branch' } })

      await expect(
        payload.branches.merge({
          branch: branchSlug,
          overrideAccess: false,
          user: { ...user, collection: 'users' },
        }),
      ).rejects.toThrow()

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('original on main')
      expect((await pendingChanges()).docs).toHaveLength(1)
    })

    test('should allow a dry run when mergeBranch returns a matching query', async () => {
      const user = await asDevUser()

      hookSpy.mergeBranchAccess = () => ({ slug: { equals: branchSlug } })

      const result = await payload.branches.merge({
        branch: branchSlug,
        dryRun: true,
        overrideAccess: false,
        user: { ...user, collection: 'users' },
      })

      expect(result.canMerge).toBe(true)
      expect(result.mergeable).toHaveLength(1)
      expect((await pendingChanges()).docs).toHaveLength(1)
    })

    test('should bypass mergeBranch when overrideAccess is true', async () => {
      hookSpy.mergeBranchAccess = () => false

      await payload.branches.merge({ branch: branchSlug, overrideAccess: true })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('edited on branch')
      expect((await pendingChanges()).docs).toHaveLength(0)
    })
  })
})

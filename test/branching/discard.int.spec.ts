import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { hookSpy } from './hookSpy.js'

import {
  branchChangesSlug,
  branchesSlug,
  branchMergesSlug,
  postsSlug,
  restrictedSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: discard', { config: './config.ts', resetBetweenTests: false }, () => {
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

    test('should discard every change and restore an open, clean branch', async () => {
      await payload.branches.discard({ branch: 'discardwork' })

      const onBranch = await payload.findByID({
        id: mainDocID,
        branch: 'discardwork',
        collection: postsSlug,
      })
      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })
      const branchCreatedRows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: createdOnBranchID } },
      })
      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: { _branch: { not_equals: 'main' } },
      })
      const branch = (
        await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: 'discardwork' } },
        })
      ).docs[0]

      expect(onBranch.title).toBe('original on main')
      expect(onBranch.order).toBe(1)
      expect(onMain.title).toBe('original on main')
      expect(onMain.order).toBe(1)
      expect(branchCreatedRows.docs).toHaveLength(0)
      expect(shadows.docs).toHaveLength(0)
      expect((await pendingChanges()).docs).toHaveLength(0)
      expect(branch?.status).toBe('open')
    })

    test('should refresh the caller request after discarding a change', async () => {
      const req = await createPayloadRequest({ branch: 'discardwork', payload })
      const beforeDiscard = await payload.findByID({ id: mainDocID, collection: postsSlug, req })
      const changes = await pendingChanges()
      const updateChange = changes.docs.find((change) => change.operation === 'update')

      await payload.branches.discard({
        branch: 'discardwork',
        changes: [updateChange!.id],
        overrideAccess: true,
        req,
      })

      const afterDiscard = await payload.findByID({ id: mainDocID, collection: postsSlug, req })

      expect(beforeDiscard.title).toBe('edited on branch')
      expect(afterDiscard.title).toBe('original on main')
    })

    test('should restore a document the branch had deleted', async () => {
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

    test('should discard only the selected changes', async () => {
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

    test('should discard through the REST endpoint', async () => {
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

    test('should reject an unauthenticated discard', async () => {
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

    test('should enforce branch delete access in the Local API by default', async () => {
      await expect(
        payload.branches.discard({
          branch: 'discardwork',
          overrideAccess: false,
          user: {
            id: 'restricted-user',
            collection: 'users',
            email: 'restricted@example.com',
          } as never,
        }),
      ).rejects.toThrow()

      expect((await pendingChanges()).docs).toHaveLength(2)
    })

    test('should deny a Local API discard when discardBranch returns false', async () => {
      const user = await asDevUser()

      hookSpy.discardBranchAccess = () => false

      await expect(
        payload.branches.discard({
          branch: 'discardwork',
          overrideAccess: false,
          user: { ...user, collection: 'users' },
        }),
      ).rejects.toThrow()

      expect((await pendingChanges()).docs).toHaveLength(2)
    })

    test('should deny a discard when discardBranch returns a non-matching query', async () => {
      const user = await asDevUser()

      hookSpy.discardBranchAccess = () => ({ slug: { equals: 'another-branch' } })

      await expect(
        payload.branches.discard({
          branch: 'discardwork',
          overrideAccess: false,
          user: { ...user, collection: 'users' },
        }),
      ).rejects.toThrow()

      expect((await pendingChanges()).docs).toHaveLength(2)
    })

    test('should allow a discard when discardBranch returns a matching query', async () => {
      hookSpy.discardBranchAccess = () => ({ slug: { equals: 'discardwork' } })

      const result = await payload.branches.discard({
        branch: 'discardwork',
        overrideAccess: false,
        user: {
          id: 'restricted-user',
          collection: 'users',
          email: 'restricted@example.com',
        } as never,
      })

      expect(result.discarded).toHaveLength(2)
      expect((await pendingChanges()).docs).toHaveLength(0)
    })

    test('should discard changes when the user cannot edit the underlying content', async () => {
      const editor = await payload.create({
        collection: 'users',
        data: { email: 'editor@example.com', password: 'test' },
      })
      const restricted = await payload.create({
        collection: restrictedSlug,
        data: { title: 'restricted on main' },
      })
      const user = { ...editor, collection: 'users' as const }

      await payload.update({
        id: restricted.id,
        branch: 'discardwork',
        collection: restrictedSlug,
        data: { title: 'edited on branch' },
      })

      await expect(
        payload.update({
          id: restricted.id,
          collection: restrictedSlug,
          data: { title: 'edited on branch' },
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow()

      hookSpy.discardBranchAccess = () => true

      await payload.branches.discard({
        branch: 'discardwork',
        overrideAccess: false,
        user,
      })

      const onMain = await payload.findByID({ id: restricted.id, collection: restrictedSlug })

      expect(onMain.title).toBe('restricted on main')
      expect((await pendingChanges()).docs).toHaveLength(0)

      await payload.delete({ id: restricted.id, collection: restrictedSlug })
      await payload.delete({ id: editor.id, collection: 'users' })
    })

    test('should bypass discardBranch when overrideAccess is true', async () => {
      hookSpy.discardBranchAccess = () => false

      const result = await payload.branches.discard({
        branch: 'discardwork',
        overrideAccess: true,
      })

      expect(result.discarded).toHaveLength(2)
      expect((await pendingChanges()).docs).toHaveLength(0)
    })

    test('should deny a REST discard when discardBranch returns false', async () => {
      hookSpy.discardBranchAccess = () => false

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

      expect(res.status).toBe(403)
      expect((await pendingChanges()).docs).toHaveLength(2)
    })
  })
})

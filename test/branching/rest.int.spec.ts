import type { Payload, PayloadRequest } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { hookSpy } from './hookSpy.js'

import { branchChangesSlug, branchesSlug, postsSlug, restrictedSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: rest', { config: './config.ts', resetBetweenTests: false }, () => {
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

  test.describe('Merge REST endpoint', () => {
    let branchID: number | string
    let docID: number | string

    test.beforeEach(async () => {
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

    test.afterEach(async () => {
      hookSpy.beforeMerge = undefined
      hookSpy.mergeBranchAccess = undefined

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
    test('should merge even when the triggering request names the branch', async () => {
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

    test('should reject an unauthenticated merge', async () => {
      const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
        // NextRESTClient attaches its stored token unless auth is disabled.
        auth: false,
        body: JSON.stringify({}),
      })

      expect([401, 403]).toContain(res.status)

      const onMain = await payload.findByID({ id: docID, collection: postsSlug })

      expect(onMain.title).toBe('original on main')
    })

    test('should deny a REST merge when mergeBranch returns false', async () => {
      hookSpy.mergeBranchAccess = () => false

      const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
        body: JSON.stringify({ dryRun: true }),
        headers: { Authorization: `JWT ${token}` },
      })
      const pendingChanges = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'restmerge' } },
      })
      const onMain = await payload.findByID({ id: docID, collection: postsSlug })

      expect(res.status).toBe(403)
      expect(onMain.title).toBe('original on main')
      expect(pendingChanges.docs).toHaveLength(1)
    })

    test('should report the pending changes on a dryRun without mutating', async () => {
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

    test('should apply the merge when authenticated', async () => {
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

    test('should enforce access as the requesting user rather than overriding it', async () => {
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

    test('should return 404 for an unknown branch', async () => {
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
    test.describe('streamed progress', () => {
      /** Parses the NDJSON body into the events the client would see. */
      const readEvents = (body: string) =>
        body
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line) as Record<string, any>)

      test('should stream one progress event per change and finish with the result', async () => {
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

      test('should report an error when mergeBranch denies a streamed merge', async () => {
        hookSpy.mergeBranchAccess = () => false

        const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
          body: JSON.stringify({ stream: true }),
          headers: { Authorization: `JWT ${token}` },
        })
        const events = readEvents(await res.text())
        const pendingChanges = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'restmerge' } },
        })
        const onMain = await payload.findByID({ id: docID, collection: postsSlug })

        expect(events.some((event) => event.type === 'error')).toBe(true)
        expect(events.some((event) => event.type === 'complete')).toBe(false)
        expect(onMain.title).toBe('original on main')
        expect(pendingChanges.docs).toHaveLength(1)
      })

      test('should preserve REST request details for a streamed merge', async () => {
        let mergeRequest:
          | {
              header: null | string
              payloadAPI: string
            }
          | undefined

        hookSpy.beforeMerge = ({ req }: { req: PayloadRequest }) => {
          mergeRequest = {
            header: req.headers.get('x-merge-request'),
            payloadAPI: req.payloadAPI,
          }
        }

        const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
          body: JSON.stringify({ stream: true }),
          headers: { Authorization: `JWT ${token}`, 'x-merge-request': 'retained' },
        })
        const events = readEvents(await res.text())

        expect(events.some((event) => event.type === 'complete')).toBe(true)
        expect(mergeRequest).toEqual({ header: 'retained', payloadAPI: 'REST' })
      })

      test('should stream only the selected changes', async () => {
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

      test('should enforce access on the streamed path too', async () => {
        const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
          auth: false,
          body: JSON.stringify({ stream: true }),
        })

        expect([401, 403]).toContain(res.status)

        const onMain = await payload.findByID({ id: docID, collection: postsSlug })

        expect(onMain.title).toBe('original on main')
      })

      test('should fall back to a plain JSON response for a dryRun', async () => {
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

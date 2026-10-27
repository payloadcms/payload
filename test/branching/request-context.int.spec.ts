import type { Payload } from 'payload'

import { assertBranchReadable, createPayloadRequest, isolateBranchState } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { branchChangesSlug, branchesSlug, postsSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite(
  'Branching: request-context',
  { config: './config.ts', resetBetweenTests: false },
  () => {
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
     * §15's precedence contract, at the point it is easiest to get wrong: an operation handed
     * both a request and a branch. The branch is an argument, so the argument wins — the same
     * contract `locale` has.
     */
    test.describe('An explicit branch on a shared request', () => {
      const first = 'explicitfirst'
      const second = 'explicitsecond'
      let docID: number | string

      test.beforeAll(async () => {
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

      test.beforeEach(async () => {
        const doc = await payload.create({ collection: postsSlug, data: { title: 'on main' } })

        docID = doc.id

        for (const [slug, title] of [
          [first, 'on first branch'],
          [second, 'on second branch'],
        ] as const) {
          await payload.update({ id: docID, branch: slug, collection: postsSlug, data: { title } })
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
          where: { branch: { in: [first, second] } },
        })

        for (const change of changes.docs) {
          await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
        }
      })

      test('should read each branch a request is pointed at, in turn', async () => {
        const req = await createPayloadRequest({ payload })

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

      test('should leave the caller request on its own branch', async () => {
        const req = await createPayloadRequest({ branch: first, payload })

        await payload.findByID({ id: docID, branch: second, collection: postsSlug, req })

        // The operation ran somewhere else; this request is where it was.
        const after = await payload.findByID({ id: docID, collection: postsSlug, req })

        expect(after.title).toBe('on first branch')
      })

      test('should write to the branch it is told to, not the one the request resolved', async () => {
        const req = await createPayloadRequest({ branch: first, payload })

        await payload.findByID({ id: docID, collection: postsSlug, req })

        await payload.update({
          id: docID,
          branch: second,
          collection: postsSlug,
          data: { title: 'written to second' },
          req,
        })

        const onSecond = await payload.findByID({
          id: docID,
          branch: second,
          collection: postsSlug,
        })
        const onFirst = await payload.findByID({ id: docID, branch: first, collection: postsSlug })
        const onMain = await payload.findByID({ id: docID, collection: postsSlug })

        expect(onSecond.title).toBe('written to second')
        expect(onFirst.title).toBe('on first branch')
        expect(onMain.title).toBe('on main')
      })

      test('should bypass branching when told to, on a branch-scoped request', async () => {
        const req = await createPayloadRequest({ branch: first, payload })

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

    // What a diff does: the same document, read on two branches, to show what
    // merging one into the other would change.
    test.describe('Reading two branches in one request', () => {
      let docID: number | string

      test.beforeAll(async () => {
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

      test.beforeEach(async () => {
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

      test.afterEach(async () => {
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

      test('should return each branch when every read isolates its branch state', async () => {
        const req = await createPayloadRequest({ payload, user: null })

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

      test('should leave the original request on its own branch after an isolated read', async () => {
        const req = await createPayloadRequest({ branch: 'two-branch-read', payload })

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

      test('should follow an explicit branch even when the request already resolved another', async () => {
        const req = await createPayloadRequest({ branch: 'two-branch-read', payload })

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

      test('should recheck branch access when an isolated request changes branch and user', async () => {
        const admin = (
          await payload.find({
            collection: 'users',
            pagination: false,
            where: { email: { equals: devUser.email } },
          })
        ).docs[0]
        const req = await createPayloadRequest({
          branch: 'two-branch-read',
          payload,
          user: admin as never,
        })

        await assertBranchReadable({ req })

        const isolatedReq = isolateBranchState(req)
        isolatedReq.branch = 'unreadable-branch'
        isolatedReq.user = null

        await expect(assertBranchReadable({ req: isolatedReq })).rejects.toThrow()
      })
    })
  },
)

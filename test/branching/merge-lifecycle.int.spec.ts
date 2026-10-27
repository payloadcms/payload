import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'

import { expect, vi } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { readCollectionMergeSnapshot } from '../../packages/payload/src/branching/readMergeSnapshot.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { hookSpy } from './hookSpy.js'

import {
  branchChangesSlug,
  branchesSlug,
  branchMergesSlug,
  pagesSlug,
  postsSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite(
  'Branching: merge-lifecycle',
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
     * §16's branch lifecycle. A branch is the workspace and a merge is an event, so
     * merging does not end a branch — closing it does, and only when asked.
     */
    test.describe('Branch lifecycle after merging', () => {
      let mainDocID: number | string

      const branchStatus = async (slug: string) =>
        (
          await payload.find({
            collection: branchesSlug,
            pagination: false,
            where: { slug: { equals: slug } },
          })
        ).docs[0]

      test.beforeEach(async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Life cycle', slug: 'lifecycle' },
        })

        const doc = await payload.create({
          collection: postsSlug,
          data: {
            confidential: 'main secret',
            internalNote: 'hidden main value',
            order: 1,
            title: 'original on main',
          },
        })

        mainDocID = doc.id

        await payload.update({
          id: mainDocID,
          branch: 'lifecycle',
          collection: postsSlug,
          data: { title: 'edited on branch' },
        })
      })

      test.afterEach(async () => {
        hookSpy.beforeMerge = undefined
        hookSpy.postBeforeRead = undefined
        hookSpy.postDefaultValueCount = undefined
        hookSpy.postTitleAfterReadCount = undefined
        hookSpy.restrictLedgerSnapshotEntityRead = undefined
        hookSpy.restrictLedgerSnapshotGlobalRead = undefined

        for (const collection of [pagesSlug, postsSlug]) {
          const rows = await payload.find({ branch: false, collection, pagination: false })

          for (const row of rows.docs) {
            await payload.delete({ id: row.id, branch: false, collection })
          }
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

        const ledgerReaders = await payload.find({
          collection: 'users',
          pagination: false,
          where: { email: { equals: 'ledger-reader@example.com' } },
        })

        for (const ledgerReader of ledgerReaders.docs) {
          await payload.delete({ id: ledgerReader.id, collection: 'users' })
        }
      })

      test('should allow only one concurrent merge while the branch status is merging', async () => {
        let beforeMergeCalls = 0
        let statusDuringFirstMerge: string | undefined
        let markFirstMergeReady!: () => void
        let markSecondMergeStarted!: () => void
        let releaseFirstMerge!: () => void
        const firstMergeReady = new Promise<void>((resolve) => {
          markFirstMergeReady = resolve
        })
        const secondMergeStarted = new Promise<'started'>((resolve) => {
          markSecondMergeStarted = () => resolve('started')
        })
        const firstMergeReleased = new Promise<void>((resolve) => {
          releaseFirstMerge = resolve
        })

        hookSpy.beforeMerge = async () => {
          beforeMergeCalls += 1

          if (beforeMergeCalls === 1) {
            statusDuringFirstMerge = (await branchStatus('lifecycle'))?.status
            markFirstMergeReady()
            await firstMergeReleased
          } else {
            markSecondMergeStarted()
            throw new Error('A second merge reached the merge hook')
          }
        }

        const firstMerge = payload.branches.merge({ branch: 'lifecycle' })

        await firstMergeReady

        const secondMerge = payload.branches.merge({ branch: 'lifecycle' })
        const secondOutcome = await Promise.race([
          secondMerge.then(
            () => 'fulfilled' as const,
            (error: unknown) => error,
          ),
          secondMergeStarted,
        ])

        releaseFirstMerge()

        const [firstResult] = await Promise.all([firstMerge, secondMerge.catch(() => undefined)])
        const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

        expect(secondOutcome).toMatchObject({ status: 409 })
        expect(beforeMergeCalls).toBe(1)
        expect(statusDuringFirstMerge).toBe('merging')
        expect(firstResult.merged).toHaveLength(1)
        expect(onMain.title).toBe('edited on branch')
      })

      test('should reject writes while a branch is merging', async () => {
        const branch = await branchStatus('lifecycle')

        await payload.update({
          id: branch!.id,
          collection: branchesSlug,
          data: { status: 'merging' },
          overrideAccess: true,
        })

        await expect(
          payload.update({
            id: mainDocID,
            branch: 'lifecycle',
            collection: postsSlug,
            data: { title: 'write during merge' },
          }),
        ).rejects.toThrow()

        const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

        expect(onMain.title).toBe('original on main')
      })

      test('should restore an open branch when a merge hook fails', async () => {
        hookSpy.beforeMerge = () => {
          throw new Error('Simulated merge hook failure')
        }

        await expect(payload.branches.merge({ branch: 'lifecycle' })).rejects.toThrow(
          'Simulated merge hook failure',
        )

        expect((await branchStatus('lifecycle'))?.status).toBe('open')
      })

      test('should record a ledger entry naming what the merge applied', async () => {
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

      test('should checkpoint large merge events with bounded database writes', async () => {
        for (let index = 0; index < 100; index += 1) {
          await payload.create({
            branch: 'lifecycle',
            collection: postsSlug,
            data: { title: `checkpoint document ${index}` },
          })
        }

        const updateOne = payload.db.updateOne.bind(payload.db)
        let mergeEventUpdateCount = 0
        const updateOneSpy = vi.spyOn(payload.db, 'updateOne').mockImplementation(async (args) => {
          if (args.collection === branchMergesSlug) {
            mergeEventUpdateCount += 1
          }

          return updateOne(args)
        })

        try {
          await payload.branches.merge({ branch: 'lifecycle' })
        } finally {
          updateOneSpy.mockRestore()
        }

        const mergeEvent = (
          await payload.find({
            collection: branchMergesSlug,
            pagination: false,
            where: { branch: { equals: 'lifecycle' } },
          })
        ).docs[0] as unknown as {
          changes: { applicationOutcome: string; cleanupOutcome: string }[]
        }

        expect(mergeEvent.changes).toHaveLength(101)
        expect(
          mergeEvent.changes.every(
            ({ applicationOutcome, cleanupOutcome }) =>
              applicationOutcome === 'committed' && cleanupOutcome === 'completed',
          ),
        ).toBe(true)
        expect(mergeEventUpdateCount).toBeLessThan(20)
      })

      test('should not store full document snapshots in a merge event', async () => {
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

        expect(event.changes[0]?.before == null).toBe(true)
        expect(event.changes[0]?.after == null).toBe(true)
      })

      test('should record the exact target version before and after a versioned merge', async () => {
        const page = await payload.create({
          collection: pagesSlug,
          data: { title: 'version reference before' },
        })

        try {
          const beforeVersions = await payload.db.findVersions({
            branch: false,
            collection: pagesSlug,
            limit: 1,
            pagination: false,
            req: await createPayloadRequest({ branch: false, payload }),
            sort: '-updatedAt',
            where: { parent: { equals: page.id } },
          })

          await payload.update({
            id: page.id,
            branch: 'lifecycle',
            collection: pagesSlug,
            data: { title: 'version reference after' },
          })
          await payload.branches.merge({ branch: 'lifecycle' })

          const afterVersions = await payload.db.findVersions({
            branch: false,
            collection: pagesSlug,
            limit: 1,
            pagination: false,
            req: await createPayloadRequest({ branch: false, payload }),
            sort: '-updatedAt',
            where: { parent: { equals: page.id } },
          })
          const mergeEvent = (
            await payload.find({
              collection: branchMergesSlug,
              pagination: false,
              where: { branch: { equals: 'lifecycle' } },
            })
          ).docs[0] as unknown as {
            changes: {
              afterVersionID?: string
              beforeVersionID?: string
              collectionSlug?: string
            }[]
          }
          const pageChange = mergeEvent.changes.find(
            ({ collectionSlug }) => collectionSlug === pagesSlug,
          )

          expect(pageChange?.beforeVersionID).toBe(String(beforeVersions.docs[0]?.id))
          expect(pageChange?.afterVersionID).toBe(String(afterVersions.docs[0]?.id))
          expect(pageChange?.afterVersionID).not.toBe(pageChange?.beforeVersionID)
        } finally {
          await payload.delete({ id: page.id, branch: false, collection: pagesSlug })
        }
      })

      test('should expose a merge ledger entry only to the user who created it', async () => {
        const mergingUser = (
          await payload.find({
            collection: 'users',
            pagination: false,
            where: { email: { equals: devUser.email } },
          })
        ).docs[0]!
        const otherUser = await payload.create({
          collection: 'users',
          data: { email: 'ledger-reader@example.com', password: 'test' },
        })

        await payload.branches.merge({
          branch: 'lifecycle',
          overrideAccess: false,
          user: { ...mergingUser, collection: 'users' } as never,
        })

        await payload.create({
          collection: branchMergesSlug,
          data: {
            branch: 'lifecycle',
            changes: [],
            mergedAt: new Date().toISOString(),
            mergedByID: String(mergingUser.id),
          },
        })

        const ownEvents = await payload.find({
          collection: branchMergesSlug,
          overrideAccess: false,
          pagination: false,
          user: { ...mergingUser, collection: 'users' } as never,
          where: { branch: { equals: 'lifecycle' } },
        })
        const otherEvents = await payload.find({
          collection: branchMergesSlug,
          overrideAccess: false,
          pagination: false,
          user: { ...otherUser, collection: 'users' } as never,
          where: { branch: { equals: 'lifecycle' } },
        })
        const collidingAuthCollectionEvents = await payload.find({
          collection: branchMergesSlug,
          overrideAccess: false,
          pagination: false,
          user: { ...mergingUser, collection: 'secondary-users' } as never,
          where: { branch: { equals: 'lifecycle' } },
        })

        expect(ownEvents.docs).toHaveLength(2)
        expect(otherEvents.docs).toHaveLength(0)
        expect(collidingAuthCollectionEvents.docs).toHaveLength(0)
      })

      test('should enforce field read rules when recording a merge-event title', async () => {
        const mergingUser = await payload.create({
          collection: 'users',
          data: { email: 'ledger-reader@example.com', password: 'test' },
        })

        await payload.branches.merge({
          branch: 'lifecycle',
          overrideAccess: true,
          user: { ...mergingUser, collection: 'users' } as never,
        })

        const event = (
          await payload.find({
            collection: branchMergesSlug,
            pagination: false,
            where: { branch: { equals: 'lifecycle' } },
          })
        ).docs[0]! as unknown as {
          changes: {
            after?: Record<string, unknown>
            before?: Record<string, unknown>
            docTitle?: string
          }[]
        }

        expect(event.changes[0]?.before == null).toBe(true)
        expect(event.changes[0]?.after == null).toBe(true)
        expect(event.changes[0]?.docTitle).toBe(String(mainDocID))
      })

      test('should apply collection read constraints to a merge-event title', async () => {
        const mergingUser = await payload.create({
          collection: 'users',
          data: { email: 'ledger-reader@example.com', password: 'test' },
        })

        hookSpy.restrictLedgerSnapshotEntityRead = true

        await payload.update({
          id: mainDocID,
          branch: 'lifecycle',
          collection: postsSlug,
          data: { order: 2 },
        })

        await payload.branches.merge({
          branch: 'lifecycle',
          overrideAccess: true,
          user: { ...mergingUser, collection: 'users' } as never,
        })

        const event = (
          await payload.find({
            collection: branchMergesSlug,
            pagination: false,
            where: { branch: { equals: 'lifecycle' } },
          })
        ).docs[0]! as unknown as {
          changes: {
            after?: null | Record<string, unknown>
            before?: Record<string, unknown>
            docTitle?: string
          }[]
        }

        expect(event.changes[0]?.before == null).toBe(true)
        expect(event.changes[0]?.after == null).toBe(true)
        expect(event.changes[0]?.docTitle).toBe(String(mainDocID))
      })

      test('should not evaluate field defaults while resolving a merge-event title', async () => {
        const req = await createPayloadRequest({ branch: false, payload })

        hookSpy.postDefaultValueCount = 0

        const snapshot = await readCollectionMergeSnapshot({
          collectionSlug: postsSlug,
          docID: mainDocID,
          payload,
          req,
        })

        expect(hookSpy.postDefaultValueCount).toBe(0)
        expect(snapshot).not.toHaveProperty('computedDefault')
      })

      test('should not run field read hooks while resolving a merge-event title', async () => {
        const req = await createPayloadRequest({ branch: false, payload })

        hookSpy.postTitleAfterReadCount = 0

        const snapshot = await readCollectionMergeSnapshot({
          collectionSlug: postsSlug,
          docID: mainDocID,
          payload,
          req,
        })

        expect(snapshot?.title).toBe('original on main')
        expect(hookSpy.postTitleAfterReadCount).toBe(0)
      })

      test('should not let a collection read hook failure abort a merge', async () => {
        hookSpy.postBeforeRead = () => {
          throw new Error('snapshot read hook must not run')
        }

        const result = await payload.branches.merge({
          branch: 'lifecycle',
          overrideAccess: true,
        })

        expect(result.merged).toHaveLength(1)
      })

      test('should keep merge ledger writes server-owned', async () => {
        const user = (
          await payload.find({
            collection: 'users',
            pagination: false,
            where: { email: { equals: devUser.email } },
          })
        ).docs[0]!

        await payload.branches.merge({ branch: 'lifecycle' })

        const event = (
          await payload.find({
            collection: branchMergesSlug,
            pagination: false,
            where: { branch: { equals: 'lifecycle' } },
          })
        ).docs[0]!
        const createResult = await payload
          .create({
            collection: branchMergesSlug,
            data: { branch: 'lifecycle', changes: [], mergedAt: new Date().toISOString() },
            overrideAccess: false,
            user: { ...user, collection: 'users' } as never,
          })
          .then(
            () => 'fulfilled',
            () => 'rejected',
          )
        const deleteResult = await payload
          .delete({
            id: event.id,
            collection: branchMergesSlug,
            overrideAccess: false,
            user: { ...user, collection: 'users' } as never,
          })
          .then(
            () => 'fulfilled',
            () => 'rejected',
          )

        expect({ createResult, deleteResult }).toEqual({
          createResult: 'rejected',
          deleteResult: 'rejected',
        })
      })

      test('should record a branch-created title without full document snapshots', async () => {
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

        expect(event.changes[0]?.before == null).toBe(true)
        expect(event.changes[0]?.after == null).toBe(true)
        expect((event.changes[0] as { docTitle?: string })?.docTitle).toBe('created on branch')
      })

      test('should return a partially merged branch to open', async () => {
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

      test('should mark the branch merged but not closed when everything is applied', async () => {
        await payload.branches.merge({ branch: 'lifecycle' })

        const branch = await branchStatus('lifecycle')

        expect(branch?.status).toBe('merged')
        expect(branch?.mergedAt).toBeTruthy()
      })

      test('should reopen a merged branch as soon as it has a change again', async () => {
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

      test('should close the branch when the merge asks for it', async () => {
        await payload.branches.merge({ branch: 'lifecycle', closeBranch: true })

        const branch = await branchStatus('lifecycle')

        expect(branch?.status).toBe('closed')
        expect(branch?.mergedAt).toBeTruthy()
      })

      test('should leave the branch open when a partial merge asks to close it', async () => {
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

      test('should refuse writes to a closed branch', async () => {
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

      test('should still allow reading a closed branch', async () => {
        await payload.branches.merge({ branch: 'lifecycle', closeBranch: true })

        // The archive has to remain readable, or the ledger would be unreachable.
        const onBranch = await payload.find({
          branch: 'lifecycle',
          collection: postsSlug,
          pagination: false,
        })

        expect(onBranch.docs.map((doc) => doc.title)).toContain('edited on branch')
      })

      test('should accumulate one ledger entry per merge across a reused branch', async () => {
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
  },
)

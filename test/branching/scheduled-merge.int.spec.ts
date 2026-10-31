import type { Payload, PayloadRequest } from 'payload'

import { createPayloadRequest } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { scheduleMergeHandler } from '../../packages/ui/src/utilities/scheduleMergeHandler.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { hookSpy } from './hookSpy.js'

import { branchChangesSlug, branchesSlug, branchMergesSlug, postsSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite(
  'Branching: scheduled-merge',
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
     * §16's scheduled merge. Shaped like scheduled publish — a `payload-jobs` row with
     * `waitUntil` and the queueing user — so these cover what merging adds to that: the
     * permission re-check at fire time, and a branch that moved in between.
     */
    test.describe('Scheduled merge', () => {
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
              overrideAccess: true,
              task: 'scheduleMerge',
              waitUntil: new Date(Date.now() - 60_000),
            })
          ).id,
          overrideAccess: true,
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

      const createLifecycleRestrictedUser = async () =>
        payload.create({
          collection: 'users',
          data: { email: 'lifecycle-reader@example.com', password: 'test' },
        })

      test.beforeEach(async () => {
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

      test.afterEach(async () => {
        hookSpy.mergeBranchAccess = undefined

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

        const privateBranches = await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: 'private-visibility' } },
        })

        for (const privateBranch of privateBranches.docs) {
          await payload.delete({ id: privateBranch.id, collection: branchesSlug })
        }

        const restrictedUsers = await payload.find({
          collection: 'users',
          pagination: false,
          where: {
            email: { in: ['lifecycle-reader@example.com', 'restricted-canceller@example.com'] },
          },
        })

        for (const restrictedUser of restrictedUsers.docs) {
          await payload.delete({ id: restrictedUser.id, collection: 'users' })
        }
      })

      test('should register the scheduleMerge task when branching is enabled', () => {
        expect(payload.config.jobs.tasks.map((task) => task.slug)).toContain('scheduleMerge')
      })

      test.options(
        'should complete a scheduled merge while recording progress in MongoDB',
        { db: 'mongo' },
        async () => {
          const user = await asDevUser()

          await runScheduledMerge({ user: { relationTo: 'users', value: user.id } })

          expect(await mergeOutcome()).toMatchObject({
            jobsRun: [],
            pendingChanges: [],
            status: 'merged',
          })
          expect((await readBranch()).mergeProgress).toBeFalsy()
        },
      )

      test.options(
        'should clear scheduled merge progress without replacing the merge error',
        { db: 'mongo' },
        async () => {
          const user = await asDevUser()
          const expectedError = 'Scheduled merge failed after progress was recorded'
          let didObserveProgressBeforeFailure = false

          await payload.update({
            id: branchID,
            collection: branchesSlug,
            data: { mergeProgress: 'stale' },
            overrideAccess: true,
          })
          expect((await readBranch()).mergeProgress).toBe('stale')

          const job = await payload.jobs.queue({
            input: { branch: branchSlug, user: { relationTo: 'users', value: user.id } },
            overrideAccess: true,
            task: 'scheduleMerge',
            waitUntil: new Date(Date.now() - 60_000),
          })

          hookSpy.beforeChange = async ({
            data,
            req,
          }: {
            data: Record<string, unknown>
            req: PayloadRequest
          }) => {
            if (data.title === 'edited on branch') {
              const branchDuringMerge = await req.payload.findByID({
                id: branchID,
                collection: branchesSlug,
              })

              expect(branchDuringMerge.mergeProgress).toBe('running')
              didObserveProgressBeforeFailure = true
              throw new Error(expectedError)
            }
          }

          try {
            await payload.jobs.runByID({ id: job.id, overrideAccess: true })

            const [branch, onMain, pendingChanges, ran] = await Promise.all([
              readBranch(),
              payload.findByID({ id: mainDocID, collection: postsSlug }),
              payload.find({
                collection: branchChangesSlug,
                pagination: false,
                where: { branch: { equals: branchSlug } },
              }),
              payload.findByID({ id: job.id, collection: 'payload-jobs' }),
            ])

            expect(branch.mergeProgress).toBeFalsy()
            expect(branch.status).toBe('open')
            expect(didObserveProgressBeforeFailure).toBe(true)
            expect(onMain.title).toBe('original on main')
            expect(pendingChanges.docs).toHaveLength(1)
            expect(ran.error?.message).toBe(expectedError)
            expect(ran.hasError).toBe(true)
          } finally {
            hookSpy.beforeChange = undefined
          }
        },
      )

      test('should apply the branch when the job runs', async () => {
        const user = await asDevUser()

        await runScheduledMerge({ user: { relationTo: 'users', value: user.id } })

        const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

        expect(onMain.title).toBe('edited on branch')
      })

      test('should close the branch when the schedule asked for it', async () => {
        const user = await asDevUser()

        await runScheduledMerge({
          closeBranch: true,
          user: { relationTo: 'users', value: user.id },
        })

        // Nothing pending is what earns the close, so both are asserted together: a
        // status of `open` with a change still listed is a merge that did not run.
        expect(await mergeOutcome()).toMatchObject({ pendingChanges: [], status: 'closed' })
      })

      test('should deny closeBranch when updateBranch access fails', async () => {
        const user = await createLifecycleRestrictedUser()

        await expect(
          payload.branches.merge({
            branch: branchSlug,
            closeBranch: true,
            overrideAccess: false,
            user: { ...user, collection: 'users' },
          }),
        ).rejects.toThrow()

        const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

        expect(onMain.title).toBe('original on main')
        expect(await mergeOutcome()).toMatchObject({
          pendingChanges: [{ collectionSlug: postsSlug, operation: 'update' }],
          status: 'open',
        })
      })

      test('should deny scheduling when updateBranch access fails', async () => {
        const user = await createLifecycleRestrictedUser()
        const req = await createPayloadRequest({
          payload,
          user: { ...user, collection: 'users' },
        })

        const result = await scheduleMergeHandler({
          branchID,
          date: new Date(Date.now() + 60_000),
          req,
        })
        const jobs = await payload.find({
          collection: 'payload-jobs',
          pagination: false,
          where: { 'input.branch': { equals: branchSlug } },
        })

        expect(result).toHaveProperty('error')
        expect(jobs.docs).toHaveLength(0)
      })

      test('should deny cancellation when updateBranch access fails', async () => {
        const user = await createLifecycleRestrictedUser()
        const job = await payload.jobs.queue({
          input: { branch: branchSlug },
          overrideAccess: true,
          task: 'scheduleMerge',
          waitUntil: new Date(Date.now() + 60_000),
        })
        const req = await createPayloadRequest({
          payload,
          user: { ...user, collection: 'users' },
        })

        const result = await scheduleMergeHandler({ deleteID: job.id, req })
        const retainedJob = await payload.findByID({
          id: job.id,
          collection: 'payload-jobs',
          disableErrors: true,
        })

        expect(result).toHaveProperty('error')
        expect(retainedJob).not.toBeNull()
      })

      test('should deny scheduling when mergeBranch access fails', async () => {
        const user = await asDevUser()
        const req = await createPayloadRequest({ payload, user })

        hookSpy.mergeBranchAccess = () => false

        const result = await scheduleMergeHandler({
          branchID,
          date: new Date(Date.now() + 60_000),
          req,
        })
        const jobs = await payload.find({
          collection: 'payload-jobs',
          pagination: false,
          where: { 'input.branch': { equals: branchSlug } },
        })

        expect(result).toHaveProperty('error')
        expect(jobs.docs).toHaveLength(0)
      })

      test('should deny cancellation when mergeBranch access fails', async () => {
        const user = await asDevUser()
        const job = await payload.jobs.queue({
          input: { branch: branchSlug },
          overrideAccess: true,
          task: 'scheduleMerge',
          waitUntil: new Date(Date.now() + 60_000),
        })
        const req = await createPayloadRequest({ payload, user })

        hookSpy.mergeBranchAccess = () => false

        const result = await scheduleMergeHandler({ deleteID: job.id, req })
        const retainedJob = await payload.findByID({
          id: job.id,
          collection: 'payload-jobs',
          disableErrors: true,
        })

        expect(result).toHaveProperty('error')
        expect(retainedJob).not.toBeNull()
      })

      test('should recheck mergeBranch access when the scheduled job runs', async () => {
        const user = await asDevUser()
        const req = await createPayloadRequest({ payload, user })

        const result = await scheduleMergeHandler({
          branchID,
          date: new Date(Date.now() - 60_000),
          req,
        })
        const jobs = await payload.find({
          collection: 'payload-jobs',
          pagination: false,
          where: { 'input.branch': { equals: branchSlug } },
        })

        expect(result).not.toHaveProperty('error')
        expect(jobs.docs).toHaveLength(1)

        hookSpy.mergeBranchAccess = () => false

        await payload.jobs.runByID({ id: jobs.docs[0]!.id, overrideAccess: true })

        const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

        expect(onMain.title).toBe('original on main')
        expect(await mergeOutcome()).toMatchObject({
          jobsRun: [{ hasError: true, totalTried: 1 }],
          pendingChanges: [{ collectionSlug: postsSlug, operation: 'update' }],
          status: 'open',
        })
      })

      test('should refuse to merge when the queueing user no longer resolves', async () => {
        // Scheduled publish falls back to `overrideAccess` here. A merge writes across
        // production, so the same fallback would turn a deleted account into an
        // unchecked one — this fails instead.
        const job = await payload.jobs.queue({
          input: { branch: branchSlug, user: { relationTo: 'users', value: 999999 } },
          overrideAccess: true,
          task: 'scheduleMerge',
          waitUntil: new Date(Date.now() - 60_000),
        })

        await payload.jobs.runByID({ id: job.id, overrideAccess: true })

        const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

        expect(onMain.title).toBe('original on main')

        // Asserted explicitly: "nothing was merged" is also what a job that never ran
        // looks like, so without this the test passes whether or not it fired.
        const ran = await payload.findByID({ id: job.id, collection: 'payload-jobs' })

        expect(ran.hasError).toBe(true)
        expect(ran.totalTried).toBeGreaterThan(0)
      })

      test('should not cancel a scheduled merge for an inaccessible branch', async () => {
        const privateBranch = await payload.create({
          collection: branchesSlug,
          data: { name: 'Private visibility', slug: 'private-visibility' },
        })
        const restrictedUser = await payload.create({
          collection: 'users',
          data: { email: 'restricted-canceller@example.com', password: 'test' },
        })
        const job = await payload.jobs.queue({
          input: {
            branch: privateBranch.slug,
            user: { relationTo: 'users', value: restrictedUser.id },
          },
          overrideAccess: true,
          task: 'scheduleMerge',
          waitUntil: new Date(Date.now() + 60_000),
        })
        const req = await createPayloadRequest({
          payload,
          user: { ...restrictedUser, collection: 'users' },
        })

        await scheduleMergeHandler({ deleteID: job.id, req })

        const retainedJob = await payload.findByID({
          id: job.id,
          collection: 'payload-jobs',
          disableErrors: true,
        })

        expect(retainedJob).not.toBeNull()
      })

      test('should not cancel a job that is not a scheduled merge', async () => {
        const user = await asDevUser()
        const unrelatedJob = await payload.db.create({
          collection: 'payload-jobs',
          data: { input: {}, taskSlug: 'inline' },
        })
        const req = await createPayloadRequest({ payload, user })

        await scheduleMergeHandler({ deleteID: unrelatedJob.id, req })

        const retainedJob = await payload.findByID({
          id: unrelatedJob.id,
          collection: 'payload-jobs',
          disableErrors: true,
        })

        expect(retainedJob).not.toBeNull()
      })

      test('should skip queued changes that no longer exist', async () => {
        const user = await asDevUser()

        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: branchSlug } },
        })

        const realChangeID = String(changes.docs[0]!.id)

        // A change discarded between queueing and firing simply does not match.
        await runScheduledMerge({
          changes: [realChangeID, '999999'],
          user: { relationTo: 'users', value: user.id },
        })

        const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

        expect(onMain.title).toBe('edited on branch')
      })

      test('should clear the branch progress marker when the job finishes', async () => {
        const user = await asDevUser()

        await runScheduledMerge({ user: { relationTo: 'users', value: user.id } })

        // A stale "running" outlives the run and reads as a merge still in flight.
        expect((await readBranch()).mergeProgress).toBeFalsy()
      })
    })
  },
)

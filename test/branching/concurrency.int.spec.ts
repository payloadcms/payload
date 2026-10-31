import type { Payload } from 'payload'

import { commitTransaction, createPayloadRequest, initTransaction, killTransaction } from 'payload'

import { expect, vi } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { databaseAdapterSupportsTransactions } from '../__helpers/shared/databaseAdapterCapabilities.js'

import { mongooseList } from '../__helpers/shared/isMongoose.js'

import { devUser } from '../credentials.js'

import { hookSpy } from './hookSpy.js'

import {
  branchChangesSlug,
  branchesSlug,
  excludedSlug,
  headerGlobalSlug,
  postsSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

const expectedConcurrentOperationAttemptCounts = databaseAdapterSupportsTransactions({
  adapter: process.env.PAYLOAD_DATABASE ?? 'mongodb',
})
  ? [[1, 2]]
  : [
      [1, 1],
      [1, 2],
    ]

const transactionCapableMongooseAdapters = new Set(
  mongooseList.filter((adapter) => databaseAdapterSupportsTransactions({ adapter })),
)

test.suite('Branching: concurrency', { config: './config.ts', resetBetweenTests: false }, () => {
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
   * `forkDocument` (and the tombstone path in `resolveBranchDelete`) check
   * whether the branch already has a shadow row, then create one if not. Two
   * concurrent first-edits of the same document on the same branch can both
   * pass that check before either write lands, each creating its own row.
   */
  test.describe('Fork race safety', () => {
    test.afterEach(async () => {
      hookSpy.postAfterDelete = undefined
      hookSpy.postBeforeOperation = undefined

      await payload.db.deleteBranchGlobal?.({
        branch: 'racebranch',
        globalSlug: headerGlobalSlug,
        req: await createPayloadRequest({ branch: false, payload }),
      })

      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug })
      }

      const hookWriteRows = await payload.find({
        collection: excludedSlug,
        pagination: false,
        where: { title: { contains: 'race hook ' } },
      })

      for (const row of hookWriteRows.docs) {
        await payload.delete({ id: row.id, collection: excludedSlug })
      }

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'racebranch' } },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    test('should create exactly one shadow row when two edits race to fork the same document', async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Race', slug: 'racebranch' },
      })

      const doc = await payload.create({ collection: postsSlug, data: { title: 'racer' } })
      const hookAttempts = new Map<string, number>()
      const requestStateAtAttemptStart: {
        context: unknown
        query: unknown
        routeParams: unknown
      }[] = []
      const create = payload.db.create.bind(payload.db)
      let releaseShadowCreates!: () => void
      let waitingShadowCreates = 0
      const shadowCreatesReady = new Promise<void>((resolve) => {
        releaseShadowCreates = resolve
      })
      const createSpy = vi.spyOn(payload.db, 'create').mockImplementation(async (args) => {
        if (
          args.collection === postsSlug &&
          args.data?._branch === 'racebranch' &&
          String(args.data?._branchDocID) === String(doc.id)
        ) {
          waitingShadowCreates += 1

          if (waitingShadowCreates === 2) {
            releaseShadowCreates()
          }

          await shadowCreatesReady
        }

        return create(args)
      })

      hookSpy.postBeforeOperation = async ({ args, req }) => {
        const title = args.data?.title

        if (
          typeof title !== 'string' ||
          (!title.startsWith('edit A') && !title.startsWith('edit B'))
        ) {
          return
        }

        const operationTitle = title.replace(/!+$/, '')

        hookAttempts.set(operationTitle, (hookAttempts.get(operationTitle) ?? 0) + 1)
        requestStateAtAttemptStart.push({
          context: req.context.raceMutation,
          query: req.query.raceMutation,
          routeParams: req.routeParams?.raceMutation,
        })
        args.data!.title = `${title}!`
        req.context.raceMutation = operationTitle
        req.query.raceMutation = operationTitle
        req.routeParams ??= {}
        req.routeParams.raceMutation = operationTitle

        await req.payload.db.create({
          collection: excludedSlug,
          data: { title: `race hook ${operationTitle}` },
          req,
        })
      }

      try {
        await Promise.all([
          payload.update({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            data: { title: 'edit A' },
          }),
          payload.update({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            data: { title: 'edit B' },
          }),
        ])
      } finally {
        releaseShadowCreates()
        createSpy.mockRestore()
      }

      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: {
          and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
        },
      })

      expect(shadows.docs).toHaveLength(1)
      expect(['edit A!', 'edit B!']).toContain(shadows.docs[0]!.title)
      expect(expectedConcurrentOperationAttemptCounts).toContainEqual(
        [...hookAttempts.values()].sort(),
      )

      for (const requestState of requestStateAtAttemptStart) {
        expect(requestState).toEqual({
          context: undefined,
          query: undefined,
          routeParams: undefined,
        })
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'racebranch' } },
      })

      expect(changes.docs).toHaveLength(1)

      const hookWrites = await payload.find({
        collection: excludedSlug,
        pagination: false,
        where: { title: { contains: 'race hook ' } },
      })

      expect(hookWrites.docs.map(({ title }) => title).sort()).toEqual([
        'race hook edit A',
        'race hook edit B',
      ])
    })

    test.options(
      'should retry a first branch edit when its final transaction commit is transient',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Race', slug: 'racebranch' },
        })

        const doc = await payload.create({ collection: postsSlug, data: { title: 'commit racer' } })
        const commitTransaction = payload.db.commitTransaction.bind(payload.db)
        const commitError = Object.assign(new Error('Simulated first final commit conflict'), {
          errorLabels: ['TransientTransactionError'],
        })
        let hookAttempts = 0
        let commitAttempts = 0

        hookSpy.postBeforeOperation = async ({ args, req }) => {
          if (typeof args.data?.title !== 'string' || !args.data.title.startsWith('commit retry')) {
            return
          }

          hookAttempts += 1
          args.data.title = `${args.data.title}!`

          await req.payload.db.create({
            collection: excludedSlug,
            data: { title: 'race hook final commit' },
            req,
          })
        }

        const commitSpy = vi
          .spyOn(payload.db, 'commitTransaction')
          .mockImplementation(async (transactionID) => {
            commitAttempts += 1

            if (commitAttempts === 1) {
              throw commitError
            }

            return commitTransaction(transactionID)
          })

        try {
          const result = await payload.update({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            data: { title: 'commit retry' },
          })

          expect(result.title).toBe('commit retry!')
        } finally {
          commitSpy.mockRestore()
        }

        expect(commitAttempts).toBe(2)
        expect(hookAttempts).toBe(2)

        const hookWrites = await payload.find({
          collection: excludedSlug,
          pagination: false,
          where: { title: { equals: 'race hook final commit' } },
        })

        expect(hookWrites.docs).toHaveLength(1)
      },
    )

    test('should create exactly one global row when first writes race', async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Race', slug: 'racebranch' },
      })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'main before race' },
      })

      await Promise.all(
        Array.from({ length: 10 }, (_, index) =>
          payload.updateGlobal({
            slug: headerGlobalSlug,
            branch: 'racebranch',
            data: { navLabel: `race edit ${index}` },
          }),
        ),
      )

      const adapter = payload.db as any
      const branchRows =
        adapter.name === 'mongoose'
          ? await adapter.globals
              .find({ _branch: 'racebranch', globalType: headerGlobalSlug })
              .lean()
          : (
              await adapter.drizzle.query[adapter.tableNameMap.get(headerGlobalSlug)].findMany()
            ).filter((row: Record<string, unknown>) => row._branch === 'racebranch')

      expect(branchRows).toHaveLength(1)

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'racebranch' } },
      })

      expect(changes.docs).toHaveLength(1)
    })

    test.options(
      'should preserve disjoint scalar global changes when first writes race',
      { db: 'drizzle' },
      async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Race', slug: 'racebranch' },
        })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          data: {
            navigationBlocks: [{ blockType: 'navigation-block', label: 'main navigation block' }],
            navItems: [{ label: 'main item' }],
            navLabel: 'main label',
            secondaryLabel: 'main secondary',
          },
        })

        const updateGlobal = payload.db.updateGlobal.bind(payload.db)
        let releaseWrites!: () => void
        const writesReady = new Promise<void>((resolve) => {
          releaseWrites = resolve
        })
        let waitingWrites = 0
        const updateGlobalSpy = vi
          .spyOn(payload.db, 'updateGlobal')
          .mockImplementation(async (args) => {
            waitingWrites += 1
            if (waitingWrites === 2) {
              releaseWrites()
            }

            await writesReady

            return updateGlobal(args)
          })

        try {
          await Promise.all([
            payload.updateGlobal({
              slug: headerGlobalSlug,
              branch: 'racebranch',
              data: { navLabel: 'branch label' },
            }),
            payload.updateGlobal({
              slug: headerGlobalSlug,
              branch: 'racebranch',
              data: { secondaryLabel: 'branch secondary' },
            }),
          ])
        } finally {
          updateGlobalSpy.mockRestore()
        }

        const onBranch = await payload.findGlobal({
          slug: headerGlobalSlug,
          branch: 'racebranch',
        })

        expect(onBranch).toMatchObject({
          navigationBlocks: [{ blockType: 'navigation-block', label: 'main navigation block' }],
          navItems: [{ label: 'main item' }],
          navLabel: 'branch label',
          secondaryLabel: 'branch secondary',
        })
      },
    )

    test.options(
      'should roll back a first branch tombstone when an afterDelete hook fails',
      { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
      async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Race', slug: 'racebranch' },
        })

        const doc = await payload.create({ collection: postsSlug, data: { title: 'hook failure' } })
        const hookError = new Error('Simulated afterDelete failure')

        hookSpy.postAfterDelete = () => {
          throw hookError
        }

        try {
          await expect(
            payload.delete({ id: doc.id, branch: 'racebranch', collection: postsSlug }),
          ).rejects.toBe(hookError)
        } finally {
          hookSpy.postAfterDelete = undefined
        }

        const shadows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: {
            and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
          },
        })
        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'racebranch' } },
        })
        const onBranch = await payload.findByID({
          id: doc.id,
          branch: 'racebranch',
          collection: postsSlug,
        })

        expect(shadows.docs).toHaveLength(0)
        expect(changes.docs).toHaveLength(0)
        expect(onBranch.title).toBe('hook failure')
      },
    )

    test.options(
      'should reject a first branch delete inside a caller-owned transaction',
      { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
      async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Race', slug: 'racebranch' },
        })

        const doc = await payload.create({
          collection: postsSlug,
          data: { title: 'caller delete' },
        })
        const req = await createPayloadRequest({ branch: 'racebranch', payload })
        const didStartTransaction = await initTransaction(req)
        const callerTransactionID = await req.transactionID

        expect(didStartTransaction).toBe(true)

        try {
          await expect(
            payload.delete({
              id: doc.id,
              branch: 'racebranch',
              collection: postsSlug,
              req,
            }),
          ).rejects.toMatchObject({
            message: 'Cannot delete an untouched branch document within an existing transaction.',
            status: 409,
          })

          expect(req.transactionID).toBe(callerTransactionID)

          const shadows = await payload.find({
            branch: false,
            collection: postsSlug,
            pagination: false,
            showHiddenFields: true,
            where: {
              and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
            },
          })
          const changes = await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: { branch: { equals: 'racebranch' } },
          })

          expect(shadows.docs).toHaveLength(0)
          expect(changes.docs).toHaveLength(0)
        } finally {
          if (req.transactionID) {
            await killTransaction(req)
          }
        }
      },
    )

    test('should create exactly one tombstone when two deletes race to remove the same never-forked document', async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Race', slug: 'racebranch' },
      })

      const doc = await payload.create({ collection: postsSlug, data: { title: 'doomed' } })
      const deleteHookAttempts = new Map<string, number>()
      const create = payload.db.create.bind(payload.db)
      let releaseShadowCreates!: () => void
      let waitingShadowCreates = 0
      const shadowCreatesReady = new Promise<void>((resolve) => {
        releaseShadowCreates = resolve
      })
      const createSpy = vi.spyOn(payload.db, 'create').mockImplementation(async (args) => {
        if (
          args.collection === postsSlug &&
          args.data?._branch === 'racebranch' &&
          String(args.data?._branchDocID) === String(doc.id)
        ) {
          waitingShadowCreates += 1

          if (waitingShadowCreates === 2) {
            releaseShadowCreates()
          }

          await shadowCreatesReady
        }

        return create(args)
      })

      hookSpy.postBeforeOperation = async ({ args, req }) => {
        const raceOperation = req.context.raceOperation

        if (String(args.id) !== String(doc.id) || typeof raceOperation !== 'string') {
          return
        }

        deleteHookAttempts.set(raceOperation, (deleteHookAttempts.get(raceOperation) ?? 0) + 1)

        await req.payload.db.create({
          collection: excludedSlug,
          data: { title: `race hook delete ${raceOperation}` },
          req,
        })
      }

      const firstReq = await createPayloadRequest({
        branch: 'racebranch',
        context: { raceOperation: 'A' },
        payload,
      })
      const secondReq = await createPayloadRequest({
        branch: 'racebranch',
        context: { raceOperation: 'B' },
        payload,
      })

      try {
        await Promise.all([
          payload.delete({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            req: firstReq,
          }),
          payload.delete({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            req: secondReq,
          }),
        ])
      } finally {
        releaseShadowCreates()
        createSpy.mockRestore()
      }

      expect(waitingShadowCreates).toBe(2)
      expect(expectedConcurrentOperationAttemptCounts).toContainEqual(
        [...deleteHookAttempts.values()].sort(),
      )

      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: {
          and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
        },
      })

      expect(shadows.docs).toHaveLength(1)
      expect(shadows.docs[0]).not.toHaveProperty('_branchOp')

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'racebranch' } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]).toMatchObject({ operation: 'delete' })

      const hookWrites = await payload.find({
        collection: excludedSlug,
        pagination: false,
        where: { title: { contains: 'race hook delete ' } },
      })

      expect(hookWrites.docs.map(({ title }) => title).sort()).toEqual([
        'race hook delete A',
        'race hook delete B',
      ])
    })

    test.options(
      'should replace a concurrent delete winner that is removed before the retry consumes it',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Race', slug: 'racebranch' },
        })

        const doc = await payload.create({
          collection: postsSlug,
          data: { title: 'removed winner' },
        })
        const deleteHookAttempts = new Map<string, number>()
        const create = payload.db.create.bind(payload.db)
        const findOne = payload.db.findOne.bind(payload.db)
        let releaseShadowCreates!: () => void
        let waitingShadowCreates = 0
        const shadowCreatesReady = new Promise<void>((resolve) => {
          releaseShadowCreates = resolve
        })
        const createSpy = vi.spyOn(payload.db, 'create').mockImplementation(async (args) => {
          if (
            args.collection === postsSlug &&
            args.data?._branch === 'racebranch' &&
            String(args.data?._branchDocID) === String(doc.id)
          ) {
            waitingShadowCreates += 1

            if (waitingShadowCreates === 2) {
              releaseShadowCreates()
            }

            await shadowCreatesReady
          }

          return create(args)
        })
        let observedDeleteWinner: Record<string, unknown> | undefined
        let reportRetryRevalidation!: (winner: Record<string, unknown>) => void
        let releaseRetryRevalidation!: () => void
        let didReachRetryRevalidation = false
        const retryRevalidationReached = new Promise<Record<string, unknown>>((resolve) => {
          reportRetryRevalidation = resolve
        })
        const retryRevalidationReleased = new Promise<void>((resolve) => {
          releaseRetryRevalidation = resolve
        })
        const findOneSpy = vi.spyOn(payload.db, 'findOne').mockImplementation(async (args) => {
          const conditions = (args.where as { and?: Record<string, unknown>[] } | undefined)?.and
          const isRetryRevalidation = Boolean(
            conditions?.some((condition) => '_branchDocID' in condition) &&
            conditions.some((condition) => 'id' in condition),
          )

          if (isRetryRevalidation && !didReachRetryRevalidation) {
            didReachRetryRevalidation = true

            if (!observedDeleteWinner) {
              throw new Error('The competing delete winner was not observed before revalidation.')
            }

            reportRetryRevalidation(observedDeleteWinner)
            await retryRevalidationReleased
          }

          const result = await findOne(args)
          const branchResult = result as null | Record<string, unknown>

          if (
            !isRetryRevalidation &&
            branchResult?._branch === 'racebranch' &&
            String(branchResult._branchDocID) === String(doc.id)
          ) {
            observedDeleteWinner = branchResult
          }

          return result
        })

        hookSpy.postBeforeOperation = ({ args, req }) => {
          const raceOperation = req.context.raceOperation

          if (String(args.id) === String(doc.id) && typeof raceOperation === 'string') {
            deleteHookAttempts.set(raceOperation, (deleteHookAttempts.get(raceOperation) ?? 0) + 1)
          }
        }

        const firstReq = await createPayloadRequest({
          branch: 'racebranch',
          context: { raceOperation: 'A' },
          payload,
        })
        const secondReq = await createPayloadRequest({
          branch: 'racebranch',
          context: { raceOperation: 'B' },
          payload,
        })
        const deletes = Promise.all([
          payload.delete({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            req: firstReq,
          }),
          payload.delete({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            req: secondReq,
          }),
        ])

        try {
          const winner = await retryRevalidationReached
          const rawReq = await createPayloadRequest({ branch: false, payload })

          await payload.db.deleteOne({
            branch: false,
            collection: postsSlug,
            req: rawReq,
            where: { id: { equals: winner.id as number | string } },
          })
          await payload.db.deleteMany({
            collection: branchChangesSlug,
            req: rawReq,
            where: { branch: { equals: 'racebranch' } },
          })
          releaseRetryRevalidation()

          const results = await deletes

          expect(results.map(({ id }) => id)).toEqual([doc.id, doc.id])
        } finally {
          releaseShadowCreates()
          releaseRetryRevalidation()
          createSpy.mockRestore()
          findOneSpy.mockRestore()
          await deletes.catch(() => undefined)
        }

        expect([...deleteHookAttempts.values()].sort()).toEqual([1, 3])

        const shadows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: {
            and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
          },
        })
        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'racebranch' } },
        })

        expect(shadows.docs).toHaveLength(1)
        expect(shadows.docs[0]).not.toHaveProperty('_branchOp')
        expect(changes.docs).toHaveLength(1)
        expect(changes.docs[0]).toMatchObject({
          documentID: String(doc.id),
          operation: 'delete',
        })
      },
    )

    test.options(
      'should complete a delete that starts before a competing first edit commits',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Race', slug: 'racebranch' },
        })

        const doc = await payload.create({ collection: postsSlug, data: { title: 'mixed race' } })
        const create = payload.db.create.bind(payload.db)
        let releaseDeleteShadow!: () => void
        let markDeleteShadowReady!: () => void
        const deleteShadowReleased = new Promise<void>((resolve) => {
          releaseDeleteShadow = resolve
        })
        const deleteShadowReady = new Promise<void>((resolve) => {
          markDeleteShadowReady = resolve
        })
        let hasPausedDeleteShadow = false
        const createSpy = vi.spyOn(payload.db, 'create').mockImplementation(async (args) => {
          if (
            !hasPausedDeleteShadow &&
            args.collection === postsSlug &&
            args.data?._branch === 'racebranch' &&
            String(args.data?._branchDocID) === String(doc.id)
          ) {
            hasPausedDeleteShadow = true
            markDeleteShadowReady()
            await deleteShadowReleased
          }

          return create(args)
        })
        const deletePromise = payload.delete({
          id: doc.id,
          branch: 'racebranch',
          collection: postsSlug,
        })

        try {
          await deleteShadowReady

          const updateResult = await payload.update({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            data: { title: 'edit committed while delete waits' },
          })

          releaseDeleteShadow()

          const deleteResult = await deletePromise

          expect(updateResult.title).toBe('edit committed while delete waits')
          expect(deleteResult.id).toBe(doc.id)
        } finally {
          releaseDeleteShadow()
          createSpy.mockRestore()
          await deletePromise.catch(() => undefined)
        }

        const shadows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: {
            and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
          },
        })
        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'racebranch' } },
        })

        expect(shadows.docs).toHaveLength(1)
        expect(shadows.docs[0]).not.toHaveProperty('_branchOp')
        expect(changes.docs).toHaveLength(1)
        expect(changes.docs[0]).toMatchObject({
          documentID: String(doc.id),
          operation: 'delete',
        })
      },
    )
  })
})

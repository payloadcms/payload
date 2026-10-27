import type { Payload, PayloadRequest } from 'payload'

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
  branchMergesSlug,
  headerGlobalSlug,
  homepageGlobalSlug,
  pagesSlug,
  postsSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

type BranchMergeTestChange = {
  afterVersionID?: string
  applicationOutcome?: string
  beforeVersionID?: string
  cleanupError?: string
  cleanupOutcome?: string
  collectionSlug?: string
  error?: string
  globalSlug?: string
  operation?: string
  recoveryError?: string
  recoveryOutcome?: string
  sourceID?: string
  sourceRevision?: string
  sourceUpdatedAt?: string
  sourceVersionIDs?: string[]
}

type BranchMergeTestEvent = {
  changes: BranchMergeTestChange[]
  error?: null | string
  status: string
}

const transactionCapableMongooseAdapters = new Set(
  mongooseList.filter((adapter) => databaseAdapterSupportsTransactions({ adapter })),
)

const createBranchRecord = ({ name, slug }: { name: string; slug: string }) =>
  payload.create({ collection: branchesSlug, data: { name, slug } })

const findBranchChanges = ({ branch }: { branch: string }) =>
  payload.find({
    collection: branchChangesSlug,
    pagination: false,
    where: { branch: { equals: branch } },
  })

const findBranchMergeEvent = async ({
  branch,
}: {
  branch: string
}): Promise<BranchMergeTestEvent> => {
  const mergeEvents = await payload.find({
    collection: branchMergesSlug,
    pagination: false,
    where: { branch: { equals: branch } },
  })

  expect(mergeEvents.docs).toHaveLength(1)

  return mergeEvents.docs[0] as unknown as BranchMergeTestEvent
}

test.suite(
  'Branching: transactions-merge',
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
     * Both merge and discard walk several changes in a loop and must apply either
     * all of them or none of them. A `req` supplied by an HTTP handler must not
     * change that: the transaction is owned by the operation, not by whoever
     * happens to have created the request object.
     */
    test.describe('Transactional integrity', () => {
      let branchSlug: string
      let deleteOneSpy: ReturnType<typeof vi.spyOn> | undefined

      test.afterEach(async () => {
        hookSpy.beforeChange = undefined
        hookSpy.headerBeforeOperation = undefined
        deleteOneSpy?.mockRestore()
        deleteOneSpy = undefined

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
            where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: branchSlug } },
          })

          for (const row of found.docs) {
            await payload.delete({ id: row.id, collection })
          }
        }
      })

      test.options(
        'should keep a branch merging when its transaction commit result is unknown',
        { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
        async () => {
          branchSlug = 'unknown-commit-merge'

          await createBranchRecord({ name: 'Unknown commit merge', slug: branchSlug })
          const mainDocument = await payload.create({
            collection: postsSlug,
            data: { title: 'Unknown commit original' },
          })

          await payload.update({
            id: mainDocument.id,
            branch: branchSlug,
            collection: postsSlug,
            data: { title: 'Unknown commit edited' },
          })

          const beginTransaction = payload.db.beginTransaction.bind(payload.db)
          const commitTransaction = payload.db.commitTransaction.bind(payload.db)
          const commitError = Object.assign(new Error('Simulated unknown merge commit result'), {
            errorLabels: ['UnknownTransactionCommitResult'],
          })
          let mergeTransactionID: number | string | undefined
          let transactionStarts = 0
          const beginSpy = vi.spyOn(payload.db, 'beginTransaction').mockImplementation(async () => {
            const transactionID = await beginTransaction()

            transactionStarts += 1

            if (transactionStarts === 2) {
              mergeTransactionID = transactionID ?? undefined
            }

            return transactionID
          })
          const commitSpy = vi
            .spyOn(payload.db, 'commitTransaction')
            .mockImplementation(async (transactionID) => {
              await commitTransaction(transactionID)

              if ((await transactionID) === mergeTransactionID) {
                throw commitError
              }
            })

          try {
            await expect(
              payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
            ).rejects.toBe(commitError)

            const branch = (
              await payload.find({
                collection: branchesSlug,
                pagination: false,
                where: { slug: { equals: branchSlug } },
              })
            ).docs[0]
            const remainingChanges = await findBranchChanges({ branch: branchSlug })
            const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

            expect(remainingChanges.docs).toHaveLength(1)
            expect({
              applicationOutcome: mergeEvent.changes[0]?.applicationOutcome,
              branchStatus: branch?.status,
              cleanupOutcome: mergeEvent.changes[0]?.cleanupOutcome,
              error: mergeEvent.error,
              mergeStatus: mergeEvent.status,
            }).toEqual({
              applicationOutcome: 'unknown',
              branchStatus: 'merging',
              cleanupOutcome: 'unknown',
              error: 'Simulated unknown merge commit result',
              mergeStatus: 'failed',
            })

            await expect(
              payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
            ).rejects.toMatchObject({ status: 409 })
          } finally {
            commitSpy.mockRestore()
            beginSpy.mockRestore()
          }
        },
      )

      test('should retain source state when a later non-transactional merge write fails', async () => {
        branchSlug = 'non-transactional-merge'

        await createBranchRecord({ name: 'Non-transactional merge', slug: branchSlug })

        const first = await payload.create({
          collection: postsSlug,
          data: { title: 'First original' },
        })
        const second = await payload.create({
          collection: postsSlug,
          data: { title: 'Second original' },
        })

        await payload.update({
          id: first.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'First edited' },
        })
        await payload.update({
          id: second.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Second edited' },
        })

        const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)

        hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
          if (data.title === 'Second edited') {
            throw new Error('Simulated non-transactional merge failure')
          }
        }

        try {
          await expect(
            payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
          ).rejects.toThrow('Simulated non-transactional merge failure')

          const sourceRows = await payload.find({
            branch: false,
            collection: postsSlug,
            pagination: false,
            showHiddenFields: true,
            where: { _branch: { equals: branchSlug } },
          })
          const remainingChanges = await findBranchChanges({ branch: branchSlug })
          const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

          expect(sourceRows.docs).toHaveLength(2)
          expect(remainingChanges.docs).toHaveLength(2)
          expect(mergeEvent.status).toBe('failed')
          expect(mergeEvent.error).toContain('Simulated non-transactional merge failure')
          expect(mergeEvent.changes.map(({ applicationOutcome }) => applicationOutcome)).toEqual([
            'applied',
            'failed',
          ])
          expect(mergeEvent.changes[1]?.error).toContain(
            'Simulated non-transactional merge failure',
          )
        } finally {
          beginTransactionSpy.mockRestore()
        }
      })

      test('should restore an earlier versioned target after a later non-transactional failure', async () => {
        branchSlug = 'non-transactional-version-recovery'

        await createBranchRecord({ name: 'Non-transactional version recovery', slug: branchSlug })
        const versionedDocument = await payload.create({
          collection: pagesSlug,
          data: { title: 'Versioned original' },
        })
        const failingDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Failure original' },
        })

        await payload.update({
          id: versionedDocument.id,
          branch: branchSlug,
          collection: pagesSlug,
          data: { title: 'Versioned edited' },
        })
        await payload.update({
          id: failingDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Failure edited' },
        })

        const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)

        hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
          if (data.title === 'Failure edited') {
            throw new Error('Simulated failure after versioned write')
          }
        }

        try {
          await expect(
            payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
          ).rejects.toThrow('Simulated failure after versioned write')

          const onMain = await payload.findByID({
            id: versionedDocument.id,
            collection: pagesSlug,
            draft: true,
          })
          const onBranch = await payload.findByID({
            id: versionedDocument.id,
            branch: branchSlug,
            collection: pagesSlug,
            draft: true,
          })
          const remainingChanges = await findBranchChanges({ branch: branchSlug })
          const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
          const recoveredChange = mergeEvent.changes.find(
            ({ collectionSlug }) => collectionSlug === pagesSlug,
          )

          expect(onMain.title).toBe('Versioned original')
          expect(onBranch.title).toBe('Versioned edited')
          expect(remainingChanges.docs).toHaveLength(2)
          expect(mergeEvent.status).toBe('failed')
          expect(recoveredChange).toMatchObject({
            applicationOutcome: 'applied',
            recoveryOutcome: 'restored',
          })
          expect(recoveredChange?.beforeVersionID).toBeTruthy()
          expect(recoveredChange?.afterVersionID).toBeTruthy()
        } finally {
          beginTransactionSpy.mockRestore()
        }
      })

      test('should restore an earlier versioned global after a later non-transactional failure', async () => {
        branchSlug = 'non-transactional-global-version-recovery'

        await createBranchRecord({ name: 'Non-transactional global recovery', slug: branchSlug })
        await payload.updateGlobal({
          slug: homepageGlobalSlug,
          data: { _status: 'published', heroTitle: 'Global versioned original' },
        })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          data: { navLabel: 'Global failure original' },
        })
        await payload.updateGlobal({
          slug: homepageGlobalSlug,
          branch: branchSlug,
          data: { heroTitle: 'Global versioned edited' },
          draft: true,
        })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          branch: branchSlug,
          data: { navLabel: 'Global failure edited' },
        })

        const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)

        hookSpy.headerBeforeOperation = () => {
          throw new Error('Simulated failure after versioned global write')
        }

        try {
          await expect(
            payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
          ).rejects.toThrow('Simulated failure after versioned global write')

          const onMain = await payload.findGlobal({
            slug: homepageGlobalSlug,
            draft: true,
          })
          const onBranch = await payload.findGlobal({
            slug: homepageGlobalSlug,
            branch: branchSlug,
            draft: true,
          })
          const remainingChanges = await findBranchChanges({ branch: branchSlug })
          const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
          const recoveredChange = mergeEvent.changes.find(
            ({ globalSlug }) => globalSlug === homepageGlobalSlug,
          )

          expect(onMain.heroTitle).toBe('Global versioned original')
          expect(onBranch.heroTitle).toBe('Global versioned edited')
          expect(remainingChanges.docs).toHaveLength(2)
          expect(mergeEvent.status).toBe('failed')
          expect(recoveredChange).toMatchObject({
            applicationOutcome: 'applied',
            recoveryOutcome: 'restored',
          })
          expect(recoveredChange?.beforeVersionID).toBeTruthy()
          expect(recoveredChange?.afterVersionID).toBeTruthy()
        } finally {
          hookSpy.headerBeforeOperation = undefined
          beginTransactionSpy.mockRestore()

          const req = await createPayloadRequest({ branch: false, payload })

          await payload.db.deleteBranchGlobal?.({
            branch: branchSlug,
            globalSlug: homepageGlobalSlug,
            req,
          })
          await payload.db.deleteBranchGlobal?.({
            branch: branchSlug,
            globalSlug: headerGlobalSlug,
            req,
          })
          await payload.updateGlobal({
            slug: homepageGlobalSlug,
            data: { _status: 'published', heroTitle: 'main published' },
          })
          await payload.updateGlobal({
            slug: headerGlobalSlug,
            data: { navLabel: 'main label' },
          })
        }
      })

      test('should remove a branch-created target after a later non-transactional failure', async () => {
        branchSlug = 'non-transactional-create-recovery'

        await createBranchRecord({ name: 'Non-transactional create recovery', slug: branchSlug })
        const createdOnBranch = await payload.create({
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Created on branch' },
        })
        const failingDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Failure original' },
        })

        await payload.update({
          id: failingDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Failure edited' },
        })

        const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)

        hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
          if (data.title === 'Failure edited') {
            throw new Error('Simulated failure after branch create')
          }
        }

        try {
          await expect(
            payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
          ).rejects.toThrow('Simulated failure after branch create')

          const onMain = await payload.find({
            branch: false,
            collection: postsSlug,
            pagination: false,
            where: {
              and: [{ id: { equals: createdOnBranch.id } }, { _branch: { equals: 'main' } }],
            },
          })
          const onBranch = await payload.findByID({
            id: createdOnBranch.id,
            branch: branchSlug,
            collection: postsSlug,
          })
          const remainingChanges = await findBranchChanges({ branch: branchSlug })
          const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
          const recoveredChange = mergeEvent.changes.find(
            ({ collectionSlug, operation }) =>
              collectionSlug === postsSlug && operation === 'create',
          )

          expect(onMain.docs).toHaveLength(0)
          expect(onBranch.title).toBe('Created on branch')
          expect(remainingChanges.docs).toHaveLength(2)
          expect(mergeEvent.status).toBe('failed')
          expect(recoveredChange).toMatchObject({
            applicationOutcome: 'applied',
            recoveryOutcome: 'deleted',
          })
        } finally {
          beginTransactionSpy.mockRestore()
        }
      })

      test('should record an unknown outcome when application progress cannot be persisted', async () => {
        branchSlug = 'non-transactional-unknown-application'

        await createBranchRecord({
          name: 'Non-transactional unknown application',
          slug: branchSlug,
        })
        const versionedDocument = await payload.create({
          collection: pagesSlug,
          data: { title: 'Unknown application original' },
        })

        await payload.update({
          id: versionedDocument.id,
          branch: branchSlug,
          collection: pagesSlug,
          data: { title: 'Unknown application edited' },
        })

        const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)
        const updateOne = payload.db.updateOne.bind(payload.db)
        const updateOneSpy = vi.spyOn(payload.db, 'updateOne').mockImplementation(async (args) => {
          const changes = (args.data as { changes?: { applicationOutcome?: string }[] }).changes

          if (
            args.collection === branchMergesSlug &&
            changes?.some(({ applicationOutcome }) => applicationOutcome === 'applied')
          ) {
            updateOneSpy.mockImplementation(updateOne)
            throw new Error('Simulated application progress failure')
          }

          return updateOne(args)
        })

        try {
          await expect(
            payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
          ).rejects.toThrow('Simulated application progress failure')

          const onMain = await payload.findByID({
            id: versionedDocument.id,
            collection: pagesSlug,
            draft: true,
          })
          const onBranch = await payload.findByID({
            id: versionedDocument.id,
            branch: branchSlug,
            collection: pagesSlug,
            draft: true,
          })
          const remainingChanges = await findBranchChanges({ branch: branchSlug })
          const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

          expect(onMain.title).toBe('Unknown application edited')
          expect(onBranch.title).toBe('Unknown application edited')
          expect(remainingChanges.docs).toHaveLength(1)
          expect(mergeEvent.status).toBe('failed')
          expect(mergeEvent.error).toContain('Simulated application progress failure')
          expect(mergeEvent.changes[0]).toMatchObject({
            applicationOutcome: 'unknown',
            recoveryOutcome: 'unknown',
          })
          expect(mergeEvent.changes[0]?.error).toContain('Simulated application progress failure')
        } finally {
          updateOneSpy.mockRestore()
          beginTransactionSpy.mockRestore()
        }
      })

      test('should preserve the merge error when recovery progress cannot be persisted', async () => {
        branchSlug = 'non-transactional-unknown-recovery'

        await createBranchRecord({ name: 'Non-transactional unknown recovery', slug: branchSlug })
        const versionedDocument = await payload.create({
          collection: pagesSlug,
          data: { title: 'Unknown recovery original' },
        })
        const failingDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Unknown recovery failure original' },
        })

        await payload.update({
          id: versionedDocument.id,
          branch: branchSlug,
          collection: pagesSlug,
          data: { title: 'Unknown recovery edited' },
        })
        await payload.update({
          id: failingDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Unknown recovery failure edited' },
        })

        const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)
        const updateOne = payload.db.updateOne.bind(payload.db)
        const updateOneSpy = vi.spyOn(payload.db, 'updateOne').mockImplementation(async (args) => {
          const changes = (args.data as { changes?: { recoveryOutcome?: string }[] }).changes

          if (
            args.collection === branchMergesSlug &&
            changes?.some(({ recoveryOutcome }) => recoveryOutcome === 'pending')
          ) {
            updateOneSpy.mockImplementation(updateOne)
            throw new Error('Simulated recovery progress failure')
          }

          return updateOne(args)
        })

        hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
          if (data.title === 'Unknown recovery failure edited') {
            throw new Error('Simulated original merge failure')
          }
        }

        try {
          await expect(
            payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
          ).rejects.toThrow('Simulated original merge failure')

          const onMain = await payload.findByID({
            id: versionedDocument.id,
            collection: pagesSlug,
            draft: true,
          })
          const onBranch = await payload.findByID({
            id: versionedDocument.id,
            branch: branchSlug,
            collection: pagesSlug,
            draft: true,
          })
          const remainingChanges = await findBranchChanges({ branch: branchSlug })
          const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
          const unresolvedChange = mergeEvent.changes.find(
            ({ collectionSlug }) => collectionSlug === pagesSlug,
          )

          expect(onMain.title).toBe('Unknown recovery edited')
          expect(onBranch.title).toBe('Unknown recovery edited')
          expect(remainingChanges.docs).toHaveLength(2)
          expect(mergeEvent.status).toBe('failed')
          expect(mergeEvent.error).toContain('Simulated original merge failure')
          expect(unresolvedChange).toMatchObject({
            applicationOutcome: 'applied',
            recoveryOutcome: 'unknown',
          })
          expect(unresolvedChange?.recoveryError).toContain('Simulated recovery progress failure')
        } finally {
          updateOneSpy.mockRestore()
          beginTransactionSpy.mockRestore()
        }
      })

      test('should report recovery as unavailable when the target version was pruned', async () => {
        branchSlug = 'non-transactional-pruned-recovery'

        await createBranchRecord({ name: 'Non-transactional pruned recovery', slug: branchSlug })
        const versionedDocument = await payload.create({
          collection: pagesSlug,
          data: { title: 'Pruned recovery original' },
        })
        const failingDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Pruned recovery failure original' },
        })
        const req = await createPayloadRequest({ branch: false, payload })
        const beforeVersions = await payload.db.findVersions({
          branch: false,
          collection: pagesSlug,
          limit: 1,
          pagination: false,
          req,
          sort: '-updatedAt',
          where: { parent: { equals: versionedDocument.id } },
        })
        const beforeVersionID = beforeVersions.docs[0]!.id

        await payload.update({
          id: versionedDocument.id,
          branch: branchSlug,
          collection: pagesSlug,
          data: { title: 'Pruned recovery edited' },
        })
        await payload.update({
          id: failingDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Pruned recovery failure edited' },
        })

        const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)

        hookSpy.beforeChange = async ({ data }: { data: Record<string, unknown> }) => {
          if (data.title === 'Pruned recovery failure edited') {
            await payload.db.deleteVersions({
              collection: pagesSlug,
              req,
              where: { id: { equals: beforeVersionID } },
            })
            throw new Error('Simulated failure after pruning the recovery version')
          }
        }

        try {
          await expect(
            payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
          ).rejects.toThrow('Simulated failure after pruning the recovery version')

          const onMain = await payload.findByID({
            id: versionedDocument.id,
            collection: pagesSlug,
            draft: true,
          })
          const onBranch = await payload.findByID({
            id: versionedDocument.id,
            branch: branchSlug,
            collection: pagesSlug,
            draft: true,
          })
          const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
          const unresolvedChange = mergeEvent.changes.find(
            ({ collectionSlug }) => collectionSlug === pagesSlug,
          )

          expect(onMain.title).toBe('Pruned recovery edited')
          expect(onBranch.title).toBe('Pruned recovery edited')
          expect(mergeEvent.status).toBe('failed')
          expect(mergeEvent.error).toContain('Simulated failure after pruning the recovery version')
          expect(unresolvedChange).toMatchObject({
            applicationOutcome: 'applied',
            recoveryOutcome: 'unavailable',
          })
          expect(unresolvedChange?.recoveryError == null).toBe(true)
        } finally {
          beginTransactionSpy.mockRestore()
        }
      })

      test('should report that recovery restored over an intervening target edit', async () => {
        branchSlug = 'non-transactional-intervening-target-recovery'

        await createBranchRecord({ name: 'Intervening target recovery', slug: branchSlug })
        const versionedDocument = await payload.create({
          collection: pagesSlug,
          data: { title: 'Intervening recovery original' },
        })
        const failingDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Intervening recovery failure original' },
        })

        await payload.update({
          id: versionedDocument.id,
          branch: branchSlug,
          collection: pagesSlug,
          data: { title: 'Intervening recovery branch edit' },
        })
        await payload.update({
          id: failingDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Intervening recovery failure edit' },
        })

        const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)

        hookSpy.beforeChange = async ({ data }: { data: Record<string, unknown> }) => {
          if (data.title === 'Intervening recovery failure edit') {
            await payload.update({
              id: versionedDocument.id,
              collection: pagesSlug,
              data: { title: 'Intervening main edit' },
              draft: true,
            })
            throw new Error('Simulated failure after intervening target edit')
          }
        }

        try {
          await expect(
            payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
          ).rejects.toThrow('Simulated failure after intervening target edit')

          const onMain = await payload.findByID({
            id: versionedDocument.id,
            collection: pagesSlug,
            draft: true,
          })
          const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
          const recoveredChange = mergeEvent.changes.find(
            ({ collectionSlug }) => collectionSlug === pagesSlug,
          )

          expect(onMain.title).toBe('Intervening recovery original')
          expect(mergeEvent.status).toBe('failed')
          expect(mergeEvent.error).toContain('Simulated failure after intervening target edit')
          expect(recoveredChange).toMatchObject({
            applicationOutcome: 'applied',
            recoveryOutcome: 'restored',
          })
        } finally {
          hookSpy.beforeChange = undefined
          beginTransactionSpy.mockRestore()
        }
      })

      test('should retain the original merge error when target recovery fails', async () => {
        branchSlug = 'non-transactional-target-recovery-failure'

        await createBranchRecord({ name: 'Target recovery failure', slug: branchSlug })
        const versionedDocument = await payload.create({
          collection: pagesSlug,
          data: { title: 'Recovery failure original' },
        })
        const failingDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Later failure original' },
        })

        await payload.update({
          id: versionedDocument.id,
          branch: branchSlug,
          collection: pagesSlug,
          data: { title: 'Recovery failure branch edit' },
        })
        await payload.update({
          id: failingDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Later failure branch edit' },
        })

        const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)
        const restoreVersionSpy = vi
          .spyOn(payload, 'restoreVersion')
          .mockRejectedValueOnce(new Error('Simulated target recovery failure'))

        hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
          if (data.title === 'Later failure branch edit') {
            throw new Error('Simulated original merge failure before recovery')
          }
        }

        try {
          await expect(
            payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
          ).rejects.toThrow('Simulated original merge failure before recovery')

          const onMain = await payload.findByID({
            id: versionedDocument.id,
            collection: pagesSlug,
            draft: true,
          })
          const remainingChanges = await findBranchChanges({ branch: branchSlug })
          const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
          const failedRecovery = mergeEvent.changes.find(
            ({ collectionSlug }) => collectionSlug === pagesSlug,
          )

          expect(onMain.title).toBe('Recovery failure branch edit')
          expect(remainingChanges.docs).toHaveLength(2)
          expect(mergeEvent.status).toBe('failed')
          expect(mergeEvent.error).toContain('Simulated original merge failure before recovery')
          expect(failedRecovery).toMatchObject({
            applicationOutcome: 'applied',
            recoveryOutcome: 'failed',
          })
          expect(failedRecovery?.recoveryError).toContain('Simulated target recovery failure')
        } finally {
          hookSpy.beforeChange = undefined
          restoreVersionSpy.mockRestore()
          beginTransactionSpy.mockRestore()
        }
      })

      test('should retain committed target content when post-commit source cleanup fails', async () => {
        branchSlug = 'post-commit-cleanup-failure'

        await createBranchRecord({ name: 'Post-commit cleanup failure', slug: branchSlug })
        const mainDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Cleanup original' },
        })

        await payload.update({
          id: mainDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Cleanup edited' },
        })

        const shadow = (
          await payload.find({
            branch: false,
            collection: postsSlug,
            pagination: false,
            showHiddenFields: true,
            where: { _branch: { equals: branchSlug } },
          })
        ).docs[0]!
        const originalDeleteOne = payload.db.deleteOne.bind(payload.db)

        deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
          if (args?.where?.id?.equals === shadow.id) {
            throw new Error('Simulated post-commit source cleanup failure')
          }

          return originalDeleteOne(args)
        })

        const result = await payload.branches.merge({
          branch: branchSlug,
          overrideAccess: true,
        })

        expect(result.merged).toHaveLength(1)

        const onMain = await payload.findByID({ id: mainDocument.id, collection: postsSlug })
        const sourceRows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: { _branch: { equals: branchSlug } },
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(onMain.title).toBe('Cleanup edited')
        expect(sourceRows.docs).toHaveLength(1)
        expect(remainingChanges.docs).toHaveLength(1)
        expect(mergeEvent.status).toBe('cleanupFailed')
        expect(mergeEvent.error).toContain('Simulated post-commit source cleanup failure')
        expect(mergeEvent.changes[0]).toMatchObject({
          applicationOutcome: 'committed',
          cleanupOutcome: 'failed',
        })
        expect(mergeEvent.changes[0]?.cleanupError).toContain(
          'Simulated post-commit source cleanup failure',
        )
      })

      test('should retry failed source cleanup without repeating the committed target write', async () => {
        branchSlug = 'post-commit-cleanup-retry'

        await createBranchRecord({ name: 'Post-commit cleanup retry', slug: branchSlug })
        const mainDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Cleanup retry original' },
        })

        await payload.update({
          id: mainDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Cleanup retry edited' },
        })

        const shadow = (
          await payload.find({
            branch: false,
            collection: postsSlug,
            pagination: false,
            showHiddenFields: true,
            where: { _branch: { equals: branchSlug } },
          })
        ).docs[0]!
        const originalDeleteOne = payload.db.deleteOne.bind(payload.db)
        let cleanupAttempts = 0
        let targetWriteCount = 0

        deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
          if (args?.where?.id?.equals === shadow.id && cleanupAttempts++ === 0) {
            throw new Error('Simulated retryable source cleanup failure')
          }

          return originalDeleteOne(args)
        })
        hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
          if (data.title === 'Cleanup retry edited') {
            targetWriteCount += 1
          }
        }

        await payload.branches.merge({ branch: branchSlug, overrideAccess: true })

        expect(targetWriteCount).toBeGreaterThan(0)

        const targetWriteCountAfterFirstMerge = targetWriteCount

        const failedEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(failedEvent).toMatchObject({
          changes: [
            {
              applicationOutcome: 'committed',
              cleanupOutcome: 'failed',
              sourceID: String(shadow.id),
              sourceUpdatedAt: shadow.updatedAt,
            },
          ],
          status: 'cleanupFailed',
        })

        await payload.branches.merge({ branch: branchSlug, overrideAccess: true })

        const onMain = await payload.findByID({ id: mainDocument.id, collection: postsSlug })
        const sourceRows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: { _branch: { equals: branchSlug } },
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(onMain.title).toBe('Cleanup retry edited')
        expect(targetWriteCount).toBe(targetWriteCountAfterFirstMerge)
        expect(sourceRows.docs).toHaveLength(0)
        expect(remainingChanges.docs).toHaveLength(0)
        expect(mergeEvent.status).toBe('succeeded')
        expect(mergeEvent.error).toBeNull()
        expect(mergeEvent.changes[0]).toMatchObject({
          applicationOutcome: 'committed',
          cleanupOutcome: 'completed',
        })
      })

      test('should claim the branch before retrying failed source cleanup', async () => {
        branchSlug = 'post-commit-cleanup-retry-claim'

        const branchDocument = await createBranchRecord({
          name: 'Cleanup retry claim',
          slug: branchSlug,
        })
        const mainDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Cleanup retry claim original' },
        })

        await payload.update({
          id: mainDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Cleanup retry claim edited' },
        })

        const shadow = (
          await payload.find({
            branch: false,
            collection: postsSlug,
            pagination: false,
            showHiddenFields: true,
            where: { _branch: { equals: branchSlug } },
          })
        ).docs[0]!
        const originalDeleteOne = payload.db.deleteOne.bind(payload.db)
        let cleanupAttempts = 0

        deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
          if (args?.where?.id?.equals === shadow.id && cleanupAttempts++ === 0) {
            throw new Error('Simulated cleanup failure before claimed retry')
          }

          return originalDeleteOne(args)
        })

        await payload.branches.merge({ branch: branchSlug, overrideAccess: true })

        deleteOneSpy.mockRestore()

        const originalUpdate = payload.update.bind(payload)
        let statusWhenCleanupRetryStarted: string | undefined
        const updateSpy = vi.spyOn(payload, 'update').mockImplementation(async (args: any) => {
          if (!statusWhenCleanupRetryStarted && args.collection === branchMergesSlug) {
            statusWhenCleanupRetryStarted = (
              await payload.findByID({
                id: branchDocument.id,
                collection: branchesSlug,
                overrideAccess: true,
              })
            ).status
          }

          return originalUpdate(args)
        })
        const retryResult = await payload.branches
          .merge({
            branch: branchSlug,
            overrideAccess: true,
          })
          .finally(() => {
            updateSpy.mockRestore()
          })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })

        expect(statusWhenCleanupRetryStarted).toBe('merging')
        expect(retryResult.merged).toHaveLength(1)
        expect(remainingChanges.docs).toHaveLength(0)
      })

      test('should preserve newer source work during a failed cleanup retry', async () => {
        branchSlug = 'post-commit-cleanup-retry-newer-source'

        await createBranchRecord({ name: 'Cleanup retry with newer source', slug: branchSlug })
        const mainDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Cleanup retry original' },
        })

        await payload.update({
          id: mainDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'First merged source' },
        })

        const shadow = (
          await payload.find({
            branch: false,
            collection: postsSlug,
            pagination: false,
            showHiddenFields: true,
            where: { _branch: { equals: branchSlug } },
          })
        ).docs[0]!
        const originalDeleteOne = payload.db.deleteOne.bind(payload.db)
        let cleanupAttempts = 0

        deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
          if (args?.where?.id?.equals === shadow.id && cleanupAttempts++ === 0) {
            throw new Error('Simulated source cleanup failure before newer work')
          }

          return originalDeleteOne(args)
        })

        await payload.branches.merge({ branch: branchSlug, overrideAccess: true })
        await payload.update({
          id: mainDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Newer source work' },
        })

        const retryResult = await payload.branches.merge({
          branch: branchSlug,
          overrideAccess: true,
        })
        const onMain = await payload.findByID({ id: mainDocument.id, collection: postsSlug })
        const onBranch = await payload.findByID({
          id: mainDocument.id,
          branch: branchSlug,
          collection: postsSlug,
        })
        const sourceRows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: { _branch: { equals: branchSlug } },
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(retryResult.merged).toHaveLength(0)
        expect(onMain.title).toBe('First merged source')
        expect(onBranch.title).toBe('Newer source work')
        expect(sourceRows.docs).toHaveLength(1)
        expect(remainingChanges.docs).toHaveLength(1)
        expect(mergeEvent.status).toBe('succeeded')
        expect(mergeEvent.error).toBeNull()
        expect(mergeEvent.changes[0]).toMatchObject({
          applicationOutcome: 'committed',
          cleanupOutcome: 'superseded',
        })
      })

      test('should retry branch-created version cleanup without repeating the target write', async () => {
        branchSlug = 'post-commit-created-version-cleanup-retry'

        await createBranchRecord({ name: 'Branch-created version cleanup retry', slug: branchSlug })
        const createdOnBranch = await payload.create({
          branch: branchSlug,
          collection: pagesSlug,
          data: { title: 'Created version cleanup retry' },
        })
        const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)
        const originalDeleteVersions = payload.db.deleteVersions.bind(payload.db)
        let sourceVersionCleanupAttempts = 0
        let targetWriteCount = 0
        const deleteVersionsSpy = vi
          .spyOn(payload.db, 'deleteVersions')
          .mockImplementation(async (args) => {
            if (args.collection === pagesSlug && sourceVersionCleanupAttempts++ === 0) {
              throw new Error('Simulated branch-created source version cleanup failure')
            }

            return originalDeleteVersions(args)
          })

        hookSpy.pageBeforeChange = () => {
          targetWriteCount += 1
        }

        try {
          await payload.branches.merge({ branch: branchSlug, overrideAccess: true })

          const targetWriteCountAfterFirstMerge = targetWriteCount
          const failedEvent = await findBranchMergeEvent({ branch: branchSlug })

          expect(failedEvent.status).toBe('cleanupFailed')
          expect(failedEvent.changes[0]?.sourceVersionIDs?.length).toBeGreaterThan(0)

          const retryResult = await payload.branches.merge({
            branch: branchSlug,
            overrideAccess: true,
          })
          const onMain = await payload.findByID({
            id: createdOnBranch.id,
            collection: pagesSlug,
            draft: true,
          })
          const remainingChanges = await findBranchChanges({ branch: branchSlug })
          const eventAfterRetry = await findBranchMergeEvent({ branch: branchSlug })

          expect(retryResult.merged).toHaveLength(1)
          expect(onMain.title).toBe('Created version cleanup retry')
          expect(targetWriteCount).toBe(targetWriteCountAfterFirstMerge)
          expect(remainingChanges.docs).toHaveLength(0)
          expect(eventAfterRetry.status).toBe('succeeded')
          expect(eventAfterRetry.error).toBeNull()
          expect(eventAfterRetry.changes[0]).toMatchObject({
            applicationOutcome: 'committed',
            cleanupOutcome: 'completed',
          })
        } finally {
          hookSpy.pageBeforeChange = undefined
          deleteVersionsSpy.mockRestore()
          beginTransactionSpy.mockRestore()
        }
      })

      test('should retry failed deletion-marker cleanup without repeating the deletion', async () => {
        branchSlug = 'post-commit-deletion-cleanup-failure'

        await createBranchRecord({ name: 'Post-commit deletion cleanup failure', slug: branchSlug })
        const mainDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Delete after commit' },
        })

        await payload.delete({
          id: mainDocument.id,
          branch: branchSlug,
          collection: postsSlug,
        })

        const deletionMarker = (
          await payload.find({
            branch: false,
            collection: postsSlug,
            pagination: false,
            showHiddenFields: true,
            where: { _branch: { equals: branchSlug } },
          })
        ).docs[0]!
        const originalDeleteOne = payload.db.deleteOne.bind(payload.db)
        let cleanupAttempts = 0

        deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
          if (args?.where?.id?.equals === deletionMarker.id && cleanupAttempts++ === 0) {
            throw new Error('Simulated deletion-marker cleanup failure')
          }

          return originalDeleteOne(args)
        })

        const result = await payload.branches.merge({
          branch: branchSlug,
          overrideAccess: true,
        })

        const onMain = await payload.find({
          collection: postsSlug,
          pagination: false,
          where: { id: { equals: mainDocument.id } },
        })
        const sourceRows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: { _branch: { equals: branchSlug } },
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(result.merged).toHaveLength(1)
        expect(onMain.docs).toHaveLength(0)
        expect(sourceRows.docs).toHaveLength(1)
        expect(remainingChanges.docs).toHaveLength(1)
        expect(mergeEvent.status).toBe('cleanupFailed')
        expect(mergeEvent.changes[0]).toMatchObject({
          applicationOutcome: 'committed',
          cleanupOutcome: 'failed',
        })

        const retryResult = await payload.branches.merge({
          branch: branchSlug,
          overrideAccess: true,
        })
        const sourceRowsAfterRetry = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: { _branch: { equals: branchSlug } },
        })
        const changesAfterRetry = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: branchSlug } },
        })
        const eventAfterRetry = await findBranchMergeEvent({ branch: branchSlug })

        expect(retryResult.merged).toHaveLength(1)
        expect(sourceRowsAfterRetry.docs).toHaveLength(0)
        expect(changesAfterRetry.docs).toHaveLength(0)
        expect(eventAfterRetry.status).toBe('succeeded')
        expect(eventAfterRetry.error).toBeNull()
        expect(eventAfterRetry.changes[0]).toMatchObject({
          applicationOutcome: 'committed',
          cleanupOutcome: 'completed',
        })
      })

      test('should retry failed global cleanup without repeating the committed target write', async () => {
        branchSlug = 'post-commit-global-cleanup-failure'

        await createBranchRecord({ name: 'Post-commit global cleanup failure', slug: branchSlug })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          data: { navLabel: 'Global cleanup original' },
        })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          branch: branchSlug,
          data: { navLabel: 'Global cleanup edited' },
        })

        const deleteBranchGlobalSpy = vi
          .spyOn(payload.db, 'deleteBranchGlobal')
          .mockRejectedValueOnce(new Error('Simulated global source cleanup failure'))
        let targetWriteCount = 0

        hookSpy.headerBeforeOperation = () => {
          targetWriteCount += 1
        }

        try {
          const result = await payload.branches.merge({
            branch: branchSlug,
            overrideAccess: true,
          })
          const onMain = await payload.findGlobal({ slug: headerGlobalSlug })
          const onBranch = await payload.findGlobal({ slug: headerGlobalSlug, branch: branchSlug })
          const remainingChanges = await findBranchChanges({ branch: branchSlug })
          const failedEvent = await findBranchMergeEvent({ branch: branchSlug })

          expect(result.merged).toHaveLength(1)
          expect(onMain.navLabel).toBe('Global cleanup edited')
          expect(onBranch.navLabel).toBe('Global cleanup edited')
          expect(remainingChanges.docs).toHaveLength(1)
          expect(failedEvent.status).toBe('cleanupFailed')
          expect(failedEvent.changes[0]).toMatchObject({
            applicationOutcome: 'committed',
            cleanupOutcome: 'failed',
          })
          expect(failedEvent.changes[0]?.sourceRevision).toBeTruthy()

          const targetWriteCountAfterFirstMerge = targetWriteCount
          const retryResult = await payload.branches.merge({
            branch: branchSlug,
            overrideAccess: true,
          })
          const changesAfterRetry = await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: { branch: { equals: branchSlug } },
          })
          const eventAfterRetry = await findBranchMergeEvent({ branch: branchSlug })

          expect(retryResult.merged).toHaveLength(1)
          expect(targetWriteCount).toBe(targetWriteCountAfterFirstMerge)
          expect(changesAfterRetry.docs).toHaveLength(0)
          expect(eventAfterRetry.status).toBe('succeeded')
          expect(eventAfterRetry.error).toBeNull()
          expect(eventAfterRetry.changes[0]).toMatchObject({
            applicationOutcome: 'committed',
            cleanupOutcome: 'completed',
          })
        } finally {
          deleteBranchGlobalSpy.mockRestore()

          await payload.db.deleteBranchGlobal?.({
            branch: branchSlug,
            globalSlug: headerGlobalSlug,
            req: await createPayloadRequest({ branch: false, payload }),
          })
          await payload.updateGlobal({
            slug: headerGlobalSlug,
            data: { navLabel: 'main label' },
          })
        }
      })

      test('should preserve newer global source work during a failed cleanup retry', async () => {
        branchSlug = 'post-commit-global-cleanup-newer-source'

        await createBranchRecord({
          name: 'Global cleanup retry with newer source',
          slug: branchSlug,
        })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          data: { navLabel: 'Global cleanup retry original' },
        })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          branch: branchSlug,
          data: { navLabel: 'First global merged source' },
        })

        const deleteBranchGlobalSpy = vi
          .spyOn(payload.db, 'deleteBranchGlobal')
          .mockRejectedValueOnce(new Error('Simulated global cleanup failure before newer work'))

        try {
          await payload.branches.merge({ branch: branchSlug, overrideAccess: true })
          await payload.updateGlobal({
            slug: headerGlobalSlug,
            branch: branchSlug,
            data: { navLabel: 'Newer global source work' },
          })

          const retryResult = await payload.branches.merge({
            branch: branchSlug,
            overrideAccess: true,
          })
          const onMain = await payload.findGlobal({ slug: headerGlobalSlug })
          const onBranch = await payload.findGlobal({
            slug: headerGlobalSlug,
            branch: branchSlug,
          })
          const remainingChanges = await findBranchChanges({ branch: branchSlug })
          const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

          expect(retryResult.merged).toHaveLength(0)
          expect(onMain.navLabel).toBe('First global merged source')
          expect(onBranch.navLabel).toBe('Newer global source work')
          expect(remainingChanges.docs).toHaveLength(1)
          expect(mergeEvent.status).toBe('succeeded')
          expect(mergeEvent.error).toBeNull()
          expect(mergeEvent.changes[0]).toMatchObject({
            applicationOutcome: 'committed',
            cleanupOutcome: 'superseded',
          })
        } finally {
          deleteBranchGlobalSpy.mockRestore()

          await payload.db.deleteBranchGlobal?.({
            branch: branchSlug,
            globalSlug: headerGlobalSlug,
            req: await createPayloadRequest({ branch: false, payload }),
          })
          await payload.updateGlobal({
            slug: headerGlobalSlug,
            data: { navLabel: 'main label' },
          })
        }
      })

      test('should batch registry cleanup after ordered target lifecycle writes', async () => {
        branchSlug = 'batched-registry-cleanup'

        await createBranchRecord({ name: 'Batched registry cleanup', slug: branchSlug })
        const firstDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Batch cleanup first original' },
        })
        const secondDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Batch cleanup second original' },
        })

        await payload.update({
          id: firstDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Batch cleanup first edited' },
        })
        await payload.update({
          id: secondDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Batch cleanup second edited' },
        })

        const pendingChanges = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          sort: 'createdAt',
          where: { branch: { equals: branchSlug } },
        })
        const batchProcessing = payload.db.batchProcessing.bind(payload.db)
        const batchProcessingSpy = vi
          .spyOn(payload.db, 'batchProcessing')
          .mockImplementation((args) => batchProcessing(args))
        const targetHookTitles: string[] = []
        let earlierTitleObservedBySecondHook: string | undefined

        hookSpy.beforeChange = async ({
          data,
          req,
        }: {
          data: Record<string, unknown>
          req: PayloadRequest
        }) => {
          if (typeof data.title === 'string') {
            targetHookTitles.push(data.title)
          }

          if (data.title === 'Batch cleanup second edited') {
            const earlierTarget = await payload.findByID({
              id: firstDocument.id,
              collection: postsSlug,
              req,
            })

            earlierTitleObservedBySecondHook = earlierTarget.title
          }
        }

        try {
          await payload.branches.merge({ branch: branchSlug, overrideAccess: true })

          expect(batchProcessingSpy).toHaveBeenCalledWith({
            operations: pendingChanges.docs.map(({ id }) => ({
              args: {
                branch: false,
                collection: branchChangesSlug,
                returning: false,
                where: { id: { equals: id } },
              },
              operation: 'deleteOne',
            })),
            req: expect.any(Object),
          })
          expect(targetHookTitles.indexOf('Batch cleanup first edited')).toBeLessThan(
            targetHookTitles.indexOf('Batch cleanup second edited'),
          )
          expect(earlierTitleObservedBySecondHook).toBe('Batch cleanup first edited')

          const onMain = await payload.find({
            collection: postsSlug,
            pagination: false,
            sort: 'createdAt',
            where: { id: { in: [firstDocument.id, secondDocument.id] } },
          })

          expect(onMain.docs.map(({ title }) => title)).toEqual([
            'Batch cleanup first edited',
            'Batch cleanup second edited',
          ])
        } finally {
          batchProcessingSpy.mockRestore()
        }
      })

      test('should preserve failed and unattempted outcomes from registry cleanup batches', async () => {
        branchSlug = 'partial-registry-cleanup-batch'

        await createBranchRecord({ name: 'Partial registry cleanup batch', slug: branchSlug })
        const firstDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Partial batch first original' },
        })
        const secondDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Partial batch second original' },
        })

        await payload.update({
          id: firstDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Partial batch first edited' },
        })
        await payload.update({
          id: secondDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Partial batch second edited' },
        })

        const deleteOne = payload.db.deleteOne.bind(payload.db)
        let hasFailedRegistryDelete = false
        const registryDeleteSpy = vi
          .spyOn(payload.db, 'deleteOne')
          .mockImplementation(async (args) => {
            if (args.collection === branchChangesSlug && !hasFailedRegistryDelete) {
              hasFailedRegistryDelete = true
              throw new Error('Simulated registry cleanup operation failure')
            }

            return deleteOne(args)
          })

        try {
          const result = await payload.branches.merge({
            branch: branchSlug,
            overrideAccess: true,
          })
          const remainingChanges = await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            sort: 'createdAt',
            where: { branch: { equals: branchSlug } },
          })
          const failedEvent = await findBranchMergeEvent({ branch: branchSlug })

          expect(result.merged).toHaveLength(2)
          expect(remainingChanges.docs).toHaveLength(2)
          expect(failedEvent.status).toBe('cleanupFailed')
          expect(failedEvent.changes).toMatchObject([
            {
              cleanupError: 'Simulated registry cleanup operation failure',
              cleanupOutcome: 'failed',
            },
            {
              cleanupError: 'Branch change registry cleanup was not attempted.',
              cleanupOutcome: 'failed',
            },
          ])

          const retryResult = await payload.branches.merge({
            branch: branchSlug,
            overrideAccess: true,
          })
          const changesAfterRetry = await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: { branch: { equals: branchSlug } },
          })

          expect(retryResult.merged).toHaveLength(2)
          expect(changesAfterRetry.docs).toHaveLength(0)
        } finally {
          registryDeleteSpy.mockRestore()
        }
      })

      test('should retry a rejected registry cleanup batch without repeating target writes', async () => {
        branchSlug = 'rejected-registry-cleanup-batch'

        await createBranchRecord({ name: 'Rejected registry cleanup batch', slug: branchSlug })
        const mainDocument = await payload.create({
          collection: postsSlug,
          data: { title: 'Rejected batch original' },
        })

        await payload.update({
          id: mainDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Rejected batch edited' },
        })

        const batchProcessing = payload.db.batchProcessing.bind(payload.db)
        const batchProcessingSpy = vi
          .spyOn(payload.db, 'batchProcessing')
          .mockRejectedValueOnce(new Error('Simulated registry cleanup batch rejection'))
          .mockImplementation((args) => batchProcessing(args))
        let targetWriteCount = 0

        hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
          if (data.title === 'Rejected batch edited') {
            targetWriteCount += 1
          }
        }

        try {
          const firstResult = await payload.branches.merge({
            branch: branchSlug,
            overrideAccess: true,
          })
          const targetWriteCountAfterFirstMerge = targetWriteCount
          const failedEvent = await findBranchMergeEvent({ branch: branchSlug })

          expect(firstResult.merged).toHaveLength(1)
          expect(failedEvent.status).toBe('cleanupFailed')
          expect(failedEvent.error).toContain('Simulated registry cleanup batch rejection')
          expect(failedEvent.changes[0]).toMatchObject({
            cleanupError: 'Simulated registry cleanup batch rejection',
            cleanupOutcome: 'failed',
          })

          const retryResult = await payload.branches.merge({
            branch: branchSlug,
            overrideAccess: true,
          })
          const remainingChanges = await findBranchChanges({ branch: branchSlug })
          const eventAfterRetry = await findBranchMergeEvent({ branch: branchSlug })

          expect(retryResult.merged).toHaveLength(1)
          expect(targetWriteCount).toBe(targetWriteCountAfterFirstMerge)
          expect(remainingChanges.docs).toHaveLength(0)
          expect(eventAfterRetry.status).toBe('succeeded')
          expect(eventAfterRetry.error).toBeNull()
          expect(eventAfterRetry.changes[0]).toMatchObject({ cleanupOutcome: 'completed' })
        } finally {
          hookSpy.beforeChange = undefined
          batchProcessingSpy.mockRestore()
        }
      })

      test('should leave a caller-owned transaction open when merge fails', async () => {
        branchSlug = 'caller-owned-merge'

        await createBranchRecord({ name: 'Caller-owned merge', slug: branchSlug })
        const mainDoc = await payload.create({
          collection: postsSlug,
          data: { title: 'Caller-owned original' },
        })

        await payload.update({
          id: mainDoc.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Caller-owned edited' },
        })

        const req = await createPayloadRequest({ branch: false, payload })
        req.transactionID = 'caller-owned-merge-transaction'
        const rollbackTransactionSpy = vi.spyOn(payload.db, 'rollbackTransaction')

        hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
          if (data.title === 'Caller-owned edited') {
            throw new Error('Simulated caller-owned merge failure')
          }
        }

        try {
          await expect(
            payload.branches.merge({ branch: branchSlug, overrideAccess: true, req }),
          ).rejects.toThrow('Simulated caller-owned merge failure')

          expect(rollbackTransactionSpy).not.toHaveBeenCalled()
          expect(req.transactionID).toBe('caller-owned-merge-transaction')
        } finally {
          hookSpy.beforeChange = undefined
          rollbackTransactionSpy.mockRestore()
          delete req.transactionID
        }
      })

      test.options(
        'should finalise a successful merge only after its caller-owned transaction commits',
        { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
        async () => {
          branchSlug = 'caller-owned-successful-merge'

          await createBranchRecord({ name: 'Caller-owned successful merge', slug: branchSlug })
          const mainDocument = await payload.create({
            collection: postsSlug,
            data: { title: 'Caller-owned success original' },
          })

          await payload.update({
            id: mainDocument.id,
            branch: branchSlug,
            collection: postsSlug,
            data: { title: 'Caller-owned success edited' },
          })

          const req = await createPayloadRequest({ branch: false, payload })

          expect(await initTransaction(req)).toBe(true)

          try {
            await payload.branches.merge({ branch: branchSlug, overrideAccess: true, req })

            const beforeCommit = await findBranchMergeEvent({ branch: branchSlug })

            expect(beforeCommit.status).toBe('awaitingCommit')
            expect(beforeCommit.changes[0]?.applicationOutcome).toBe('applied')
            expect(beforeCommit.changes[0]?.cleanupOutcome).toBe('pending')

            await commitTransaction(req)

            const afterCommit = await findBranchMergeEvent({ branch: branchSlug })

            expect(afterCommit.status).toBe('succeeded')
            expect(afterCommit.changes[0]?.applicationOutcome).toBe('committed')
            expect(afterCommit.changes[0]?.cleanupOutcome).toBe('completed')
          } finally {
            if (req.transactionID) {
              await killTransaction(req)
            }
          }
        },
      )

      test.options(
        'should reject newer source work before caller-owned cleanup',
        { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
        async () => {
          branchSlug = 'caller-owned-newer-source-work'

          await createBranchRecord({ name: 'Caller-owned newer source work', slug: branchSlug })
          const mainDocument = await payload.create({
            collection: postsSlug,
            data: { title: 'Newer source original' },
          })

          await payload.update({
            id: mainDocument.id,
            branch: branchSlug,
            collection: postsSlug,
            data: { title: 'Merge candidate' },
          })

          const req = await createPayloadRequest({ branch: false, payload })

          expect(await initTransaction(req)).toBe(true)

          try {
            await payload.branches.merge({ branch: branchSlug, overrideAccess: true, req })

            await expect(
              payload.update({
                id: mainDocument.id,
                branch: branchSlug,
                collection: postsSlug,
                data: { title: 'Newer branch work' },
              }),
            ).rejects.toMatchObject({ status: 403 })

            await commitTransaction(req)

            const onMain = await payload.findByID({ id: mainDocument.id, collection: postsSlug })
            const onBranch = await payload.findByID({
              id: mainDocument.id,
              branch: branchSlug,
              collection: postsSlug,
            })
            const remainingChanges = await findBranchChanges({ branch: branchSlug })
            const branch = (
              await payload.find({
                collection: branchesSlug,
                pagination: false,
                where: { slug: { equals: branchSlug } },
              })
            ).docs[0]
            const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

            expect(onMain.title).toBe('Merge candidate')
            expect(onBranch.title).toBe('Merge candidate')
            expect(remainingChanges.docs).toHaveLength(0)
            expect(branch?.status).toBe('merged')
            expect(mergeEvent.status).toBe('succeeded')
            expect(mergeEvent.changes[0]).toMatchObject({
              applicationOutcome: 'committed',
              cleanupOutcome: 'completed',
            })
          } finally {
            if (req.transactionID) {
              await killTransaction(req)
            }
          }
        },
      )

      test.options(
        'should reject newer global work before caller-owned cleanup',
        { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
        async () => {
          branchSlug = 'caller-owned-newer-global-work'

          await createBranchRecord({ name: 'Caller-owned newer global work', slug: branchSlug })
          await payload.updateGlobal({
            slug: headerGlobalSlug,
            data: { navLabel: 'Global source original' },
          })
          await payload.updateGlobal({
            slug: headerGlobalSlug,
            branch: branchSlug,
            data: { navLabel: 'Global merge candidate' },
          })

          const req = await createPayloadRequest({ branch: false, payload })

          expect(await initTransaction(req)).toBe(true)

          try {
            await payload.branches.merge({ branch: branchSlug, overrideAccess: true, req })

            await expect(
              payload.updateGlobal({
                slug: headerGlobalSlug,
                branch: branchSlug,
                data: { navLabel: 'Newer global branch work' },
              }),
            ).rejects.toMatchObject({ status: 403 })

            await commitTransaction(req)

            const onMain = await payload.findGlobal({ slug: headerGlobalSlug })
            const onBranch = await payload.findGlobal({
              slug: headerGlobalSlug,
              branch: branchSlug,
            })
            const remainingChanges = await findBranchChanges({ branch: branchSlug })
            const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

            expect(onMain.navLabel).toBe('Global merge candidate')
            expect(onBranch.navLabel).toBe('Global merge candidate')
            expect(remainingChanges.docs).toHaveLength(0)
            expect(mergeEvent.status).toBe('succeeded')
            expect(mergeEvent.changes[0]).toMatchObject({
              applicationOutcome: 'committed',
              cleanupOutcome: 'completed',
            })
          } finally {
            if (req.transactionID) {
              await killTransaction(req)
            }

            await payload.db.deleteBranchGlobal?.({
              branch: branchSlug,
              globalSlug: headerGlobalSlug,
              req: await createPayloadRequest({ branch: false, payload }),
            })
            await payload.updateGlobal({
              slug: headerGlobalSlug,
              data: { navLabel: 'main label' },
            })
          }
        },
      )

      test.options(
        'should record a successful merge as rolled back when its caller-owned transaction rolls back',
        { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
        async () => {
          branchSlug = 'caller-owned-rolled-back-merge'

          await createBranchRecord({ name: 'Caller-owned rolled-back merge', slug: branchSlug })
          const mainDocument = await payload.create({
            collection: postsSlug,
            data: { title: 'Caller-owned rollback original' },
          })

          await payload.update({
            id: mainDocument.id,
            branch: branchSlug,
            collection: postsSlug,
            data: { title: 'Caller-owned rollback edited' },
          })

          const req = await createPayloadRequest({ branch: false, payload })

          expect(await initTransaction(req)).toBe(true)

          try {
            await payload.branches.merge({ branch: branchSlug, overrideAccess: true, req })
            await killTransaction(req)

            const onMain = await payload.findByID({ id: mainDocument.id, collection: postsSlug })
            const onBranch = await payload.findByID({
              id: mainDocument.id,
              branch: branchSlug,
              collection: postsSlug,
            })
            const remainingChanges = await findBranchChanges({ branch: branchSlug })
            const branch = (
              await payload.find({
                collection: branchesSlug,
                pagination: false,
                where: { slug: { equals: branchSlug } },
              })
            ).docs[0]
            const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

            expect(onMain.title).toBe('Caller-owned rollback original')
            expect(onBranch.title).toBe('Caller-owned rollback edited')
            expect(remainingChanges.docs).toHaveLength(1)
            expect(branch?.status).toBe('open')
            expect(mergeEvent.status).toBe('failed')
            expect(mergeEvent.error).toContain('Caller-owned transaction rolled back')
            expect(mergeEvent.changes[0]).toMatchObject({
              applicationOutcome: 'rolledBack',
              cleanupOutcome: 'pending',
            })
          } finally {
            if (req.transactionID) {
              await killTransaction(req)
            }
          }
        },
      )

      test('should leave a caller-owned transaction open when a global merge fails', async () => {
        branchSlug = 'caller-owned-global-merge'

        await createBranchRecord({ name: 'Caller-owned global merge', slug: branchSlug })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          data: { navLabel: 'Caller-owned global original' },
        })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          branch: branchSlug,
          data: { navLabel: 'Caller-owned global edited' },
        })

        const req = await createPayloadRequest({ branch: false, payload })
        req.transactionID = 'caller-owned-global-merge-transaction'
        const rollbackTransactionSpy = vi.spyOn(payload.db, 'rollbackTransaction')

        hookSpy.headerBeforeOperation = () => {
          throw new Error('Simulated caller-owned global merge failure')
        }

        try {
          await expect(
            payload.branches.merge({ branch: branchSlug, overrideAccess: true, req }),
          ).rejects.toThrow('Simulated caller-owned global merge failure')

          expect(rollbackTransactionSpy).not.toHaveBeenCalled()
          expect(req.transactionID).toBe('caller-owned-global-merge-transaction')
        } finally {
          hookSpy.headerBeforeOperation = undefined
          rollbackTransactionSpy.mockRestore()
          delete req.transactionID

          await payload.db.deleteBranchGlobal?.({
            branch: branchSlug,
            globalSlug: headerGlobalSlug,
            req: await createPayloadRequest({ branch: false, payload }),
          })
          await payload.updateGlobal({
            slug: headerGlobalSlug,
            data: { navLabel: 'main label' },
          })
        }
      })

      test('should leave a caller-owned transaction open when a delete merge fails', async () => {
        branchSlug = 'caller-owned-delete-merge'

        await createBranchRecord({ name: 'Caller-owned delete merge', slug: branchSlug })
        const mainDoc = await payload.create({
          collection: postsSlug,
          data: { title: 'Caller-owned delete original' },
        })

        await payload.delete({ id: mainDoc.id, branch: branchSlug, collection: postsSlug })

        const req = await createPayloadRequest({ branch: false, payload })
        req.transactionID = 'caller-owned-delete-merge-transaction'
        const originalDeleteOne = payload.db.deleteOne.bind(payload.db)

        deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
          if (args?.collection === postsSlug && args?.where?.id?.equals === mainDoc.id) {
            throw new Error('Simulated caller-owned delete merge failure')
          }

          return originalDeleteOne(args)
        })

        const rollbackTransactionSpy = vi.spyOn(payload.db, 'rollbackTransaction')

        try {
          await expect(
            payload.branches.merge({ branch: branchSlug, overrideAccess: true, req }),
          ).rejects.toThrow('Simulated caller-owned delete merge failure')

          expect(rollbackTransactionSpy).not.toHaveBeenCalled()
          expect(req.transactionID).toBe('caller-owned-delete-merge-transaction')
        } finally {
          rollbackTransactionSpy.mockRestore()
          delete req.transactionID
        }
      })
    })
  },
)

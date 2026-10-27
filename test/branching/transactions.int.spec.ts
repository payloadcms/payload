import type { Payload } from 'payload'

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
  pagesSlug,
  postsSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

const transactionCapableMongooseAdapters = new Set(
  mongooseList.filter((adapter) => databaseAdapterSupportsTransactions({ adapter })),
)

const findBranchChanges = ({ branch }: { branch: string }) =>
  payload.find({
    collection: branchChangesSlug,
    pagination: false,
    where: { branch: { equals: branch } },
  })

test.suite('Branching: transactions', { config: './config.ts', resetBetweenTests: false }, () => {
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
      'should roll back every change in a non-streaming merge when a later change fails',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        branchSlug = 'txnmerge'

        const branchDoc = await payload.create({
          collection: branchesSlug,
          data: { name: 'Txn merge', slug: branchSlug },
        })

        const a = await payload.create({ collection: postsSlug, data: { title: 'A original' } })
        const b = await payload.create({ collection: postsSlug, data: { title: 'B original' } })
        const c = await payload.create({ collection: postsSlug, data: { title: 'C original' } })

        await payload.update({
          id: a.id,
          branch: 'txnmerge',
          collection: postsSlug,
          data: { title: 'A edited' },
        })
        await payload.update({
          id: b.id,
          branch: 'txnmerge',
          collection: postsSlug,
          data: { title: 'B edited' },
        })
        await payload.update({
          id: c.id,
          branch: 'txnmerge',
          collection: postsSlug,
          data: { title: 'C edited' },
        })

        hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
          if (data.title === 'B edited') {
            throw new Error('Simulated validation failure')
          }
        }

        const res = await restClient.POST(`/${branchesSlug}/${branchDoc.id}/merge`, {
          body: JSON.stringify({}),
          headers: { Authorization: `JWT ${token}` },
        })

        hookSpy.beforeChange = undefined

        expect(res.status).toBeGreaterThanOrEqual(400)

        const onMainA = await payload.findByID({ id: a.id, collection: postsSlug })
        const onMainB = await payload.findByID({ id: b.id, collection: postsSlug })
        const onMainC = await payload.findByID({ id: c.id, collection: postsSlug })

        // Not "B was rejected but A and C went through" — the batch is one unit.
        expect(onMainA.title).toBe('A original')
        expect(onMainB.title).toBe('B original')
        expect(onMainC.title).toBe('C original')

        const remainingChanges = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'txnmerge' } },
        })
        const mergeEvents = await payload.find({
          collection: branchMergesSlug,
          pagination: false,
          where: { branch: { equals: 'txnmerge' } },
        })
        const mergeEvent = mergeEvents.docs[0] as unknown as {
          changes: { applicationOutcome: string }[]
          status: string
        }

        expect(remainingChanges.docs).toHaveLength(3)
        expect(mergeEvents.docs).toHaveLength(1)
        expect(mergeEvent.status).toBe('failed')
        expect(mergeEvent.changes.map(({ applicationOutcome }) => applicationOutcome)).toEqual([
          'rolledBack',
          'failed',
          'unattempted',
        ])
      },
    )

    test.options(
      'should roll back every change in a discard when a later change fails',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        branchSlug = 'txndiscard'

        const branchDoc = await payload.create({
          collection: branchesSlug,
          data: { name: 'Txn discard', slug: branchSlug },
        })

        const a = await payload.create({ collection: postsSlug, data: { title: 'A original' } })
        const b = await payload.create({ collection: postsSlug, data: { title: 'B original' } })
        const c = await payload.create({ collection: postsSlug, data: { title: 'C original' } })

        await payload.update({
          id: a.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'A edited' },
        })
        await payload.update({
          id: b.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'B edited' },
        })
        await payload.update({
          id: c.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'C edited' },
        })

        const shadowRows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: { _branch: { equals: branchSlug } },
        })

        const bShadow = shadowRows.docs.find((row) => String(row._branchDocID) === String(b.id))!

        const originalDeleteOne = payload.db.deleteOne.bind(payload.db)

        deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
          if (args?.where?.id?.equals === bShadow.id) {
            throw new Error('Simulated database failure')
          }

          return originalDeleteOne(args)
        })

        const res = await restClient.POST(`/${branchesSlug}/${branchDoc.id}/discard`, {
          body: JSON.stringify({}),
          headers: { Authorization: `JWT ${token}` },
        })

        expect(res.status).toBeGreaterThanOrEqual(400)

        // A's shadow row was already dropped by the time B failed — the whole
        // batch is one transaction, so that drop must be undone too.
        const onBranchA = await payload.findByID({
          id: a.id,
          branch: branchSlug,
          collection: postsSlug,
        })

        expect(onBranchA.title).toBe('A edited')

        const remainingChanges = await findBranchChanges({ branch: branchSlug })

        expect(remainingChanges.docs).toHaveLength(3)
      },
    )
  })
})

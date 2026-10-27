import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'

import { expect, vi } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

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

const createBranchRecord = ({ name, slug }: { name: string; slug: string }) =>
  payload.create({ collection: branchesSlug, data: { name, slug } })

test.suite(
  'Branching: transactions-discard',
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

      test('should leave a caller-owned transaction open when discard fails', async () => {
        branchSlug = 'caller-owned-discard'

        await createBranchRecord({ name: 'Caller-owned discard', slug: branchSlug })
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

        const shadow = (
          await payload.find({
            branch: false,
            collection: postsSlug,
            pagination: false,
            showHiddenFields: true,
            where: { _branch: { equals: branchSlug } },
          })
        ).docs[0]!
        const req = await createPayloadRequest({ branch: false, payload })
        req.transactionID = 'caller-owned-discard-transaction'
        const originalDeleteOne = payload.db.deleteOne.bind(payload.db)

        deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
          if (args?.where?.id?.equals === shadow.id) {
            throw new Error('Simulated caller-owned discard failure')
          }

          return originalDeleteOne(args)
        })

        const rollbackTransactionSpy = vi.spyOn(payload.db, 'rollbackTransaction')

        try {
          await expect(
            payload.branches.discard({ branch: branchSlug, overrideAccess: true, req }),
          ).rejects.toThrow('Simulated caller-owned discard failure')

          expect(rollbackTransactionSpy).not.toHaveBeenCalled()
          expect(req.transactionID).toBe('caller-owned-discard-transaction')
        } finally {
          rollbackTransactionSpy.mockRestore()
          delete req.transactionID
        }
      })
    })
  },
)

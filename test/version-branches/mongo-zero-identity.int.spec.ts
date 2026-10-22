/* eslint-disable payload/no-relative-monorepo-imports -- Verify numeric zero through native branch storage. */
import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { bootstrapBranchProjectionPage } from '../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import { queryBranchContent } from '../../packages/payload/src/versions/branches/queries/queryBranchContent.js'
import {
  readBranchHeadToken,
  writeBranchHead,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import { initializeBranchVersion } from '../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { test } from '../__helpers/int/vitest.js'
import { mongooseList } from '../__helpers/shared/isMongoose.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import { fractionalIDsSlug } from './slugs.js'

test.suite('Mongo numeric zero identity', { config: './config.ts' }, () => {
  test.options(
    'should preserve zero through public create, reads, version parents and branch bootstrap',
    {
      db: (adapter) => mongooseList.includes(adapter) && nativeBranchDatabaseOptions.db(adapter),
    },
    async ({ payload }) => {
      const created = await payload.create({
        collection: fractionalIDsSlug,
        data: { id: 0, title: 'Zero identity' },
        depth: 0,
      })
      const read = await payload.findByID({ collection: fractionalIDsSlug, id: 0, depth: 0 })
      const versions = await payload.findVersions({
        collection: fractionalIDsSlug,
        depth: 0,
        where: { parent: { equals: 0 } },
      })

      expect(created.id).toBe(0)
      expect(read.id).toBe(0)
      expect(versions.docs).toHaveLength(1)
      expect(versions.docs[0]!.parent).toBe(0)

      const req = await createPayloadRequest({ payload })
      const transactionID = await payload.db.beginTransaction()

      if (transactionID === null) {
        throw new Error('Native transaction required.')
      }

      req.transactionID = transactionID

      try {
        const heads = payload.collections[fractionalIDsSlug]!.config.custom.branchStorage.heads
        const target = { collection: heads, parentID: created.id }
        const reference = await initializeBranchVersion({
          branchID: 'main',
          isFrozen: false,
          req,
          target,
          versionID: versions.docs[0]!.id,
        })

        for (const scope of [
          { type: 'shared' as const },
          { type: 'locale' as const, locale: 'en' },
          { type: 'locale' as const, locale: 'fr' },
        ]) {
          const expected = await readBranchHeadToken({ branchID: 'main', req, scope, target })

          expect(
            await writeBranchHead({
              expected,
              nextState: {
                type: 'version',
                structure: scope.type === 'locale' ? reference : null,
                version: reference,
              },
              req,
              target,
            }),
          ).not.toBeNull()
        }

        for (const branchID of ['main', 'zero-review']) {
          const bootstrap = await bootstrapBranchProjectionPage({
            branchID,
            collection: heads,
            req,
          })
          const effective = await queryBranchContent({
            branchID,
            collection: fractionalIDsSlug,
            joins: false,
            req,
            where: { id: { equals: 0 } },
          })

          expect(bootstrap).toEqual({ isComplete: true, processed: 1 })
          expect(effective.totalDocs).toBe(1)
          expect(effective.docs).toMatchObject([{ id: 0, title: 'Zero identity' }])
        }
      } finally {
        await payload.db.rollbackTransaction(transactionID)
      }
    },
  )
})

/* eslint-disable payload/no-relative-monorepo-imports -- Verify native private graph targeting against released ID semantics. */
import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect, vi } from 'vitest'

import { encodeBranchProjectionID } from '../../packages/payload/src/versions/branches/queries/branchProjectionCodec.js'
import { bootstrapBranchProjectionPage } from '../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import { queryBranchContent } from '../../packages/payload/src/versions/branches/queries/queryBranchContent.js'
import { queryBranchContentGraph } from '../../packages/payload/src/versions/branches/queries/queryBranchContentGraph.js'
import {
  readBranchHeadToken,
  writeBranchHead,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import { initializeBranchVersion } from '../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { test } from '../__helpers/int/vitest.js'
import { mongooseList } from '../__helpers/shared/isMongoose.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import { fractionalIDsSlug, wideIDsSlug } from './slugs.js'

const branchID = 'targeted-graph'

test.suite('Native Mongo bounded graph targeting', { config: './config.ts' }, () => {
  test.options(
    'should preserve zero and fractional targets through the existing primary key index',
    {
      db: (adapter) => mongooseList.includes(adapter) && nativeBranchDatabaseOptions.db(adapter),
    },
    async ({ payload }) => {
      await seed({ payload, collection: fractionalIDsSlug, ids: [0, 1.5, 2.5] })
      const req = await createPayloadRequest({ payload })
      const control = payload.collections[fractionalIDsSlug]!.config.custom.branchQueryStorage
      const model = (payload.db as any).collections[control.projection]
      const aggregate = vi.spyOn(model, 'aggregate')
      try {
        const { graph } = await queryBranchContentGraph({
          branchID,
          collection: fractionalIDsSlug,
          depth: 2,
          req,
          joins: false,
          where: { id: { equals: 2.5 } },
        })

        expect(graph.get({ collection: fractionalIDsSlug, id: 0 })).toMatchObject({
          id: 0,
          related: 1.5,
        })
        expect(graph.get({ collection: fractionalIDsSlug, id: 1.5 })).toMatchObject({
          id: 1.5,
          related: 2.5,
        })
        expect(graph.get({ collection: fractionalIDsSlug, id: 2.5 })).toMatchObject({
          id: 2.5,
          related: 0,
        })
        expect(
          aggregate.mock.calls.some(([pipeline]: any) =>
            pipeline.some((stage: any) =>
              stage.$match?._id?.$in?.includes(
                encodeBranchProjectionID({ branchID, logicalID: 0 }),
              ),
            ),
          ),
        ).toBe(true)
      } finally {
        aggregate.mockRestore()
      }
    },
  )

  test.options(
    'should preserve numeric text and wide Unicode targets and disable exact hashing under collation',
    {
      db: (adapter) => mongooseList.includes(adapter) && nativeBranchDatabaseOptions.db(adapter),
    },
    async ({ payload }) => {
      const wideID = '界💡'.repeat(440)
      await seed({ payload, collection: wideIDsSlug, ids: ['root', '1', wideID] })
      const req = await createPayloadRequest({ payload })
      const control = payload.collections[wideIDsSlug]!.config.custom.branchQueryStorage
      const adapter = payload.db as any
      const aggregate = vi.spyOn(adapter.collections[control.projection], 'aggregate')
      const originalCollation = adapter.collation
      try {
        const { graph } = await queryBranchContentGraph({
          branchID,
          collection: wideIDsSlug,
          depth: 2,
          req,
          joins: false,
          where: { id: { equals: 'root' } },
        })

        expect(graph.get({ collection: wideIDsSlug, id: '1' })).toMatchObject({
          id: '1',
          related: wideID,
        })
        expect(graph.get({ collection: wideIDsSlug, id: wideID })).toMatchObject({
          id: wideID,
          related: 'root',
        })
        expect(
          aggregate.mock.calls.some(([pipeline]: any) =>
            pipeline.some((stage: any) => stage.$match?._id?.$in),
          ),
        ).toBe(true)
        aggregate.mockClear()
        adapter.collation = { strength: 1 }
        const equivalent = await queryBranchContent({
          branchID,
          collection: wideIDsSlug,
          graphTargetIDs: ['ROOT'],
          req,
          joins: false,
          where: { id: { equals: 'ROOT' } },
        })

        expect(equivalent.docs).toMatchObject([{ id: 'root' }])
        expect(
          aggregate.mock.calls.some(([pipeline]: any) =>
            pipeline.some((stage: any) => stage.$match?._id?.$in),
          ),
        ).toBe(false)
      } finally {
        adapter.collation = originalCollation
        aggregate.mockRestore()
      }
    },
  )
})

const seed = async ({
  collection,
  ids,
  payload,
}: {
  collection: string
  ids: (number | string)[]
  payload: Payload
}) => {
  for (const [index, id] of ids.entries()) {
    await payload.create({
      collection,
      data: { id, title: `Target ${index}`, related: ids[(index + 1) % ids.length] },
      depth: 0,
    })
  }
  const req = await createPayloadRequest({ payload })
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) {
    throw new Error('Native transaction required.')
  }
  req.transactionID = transactionID
  const heads = payload.collections[collection]!.config.custom.branchStorage.heads
  try {
    for (const id of ids) {
      const versions = await payload.db.findVersions({
        collection,
        req,
        locale: 'all',
        limit: 1,
        where: { parent: { equals: id } },
      })
      if (!versions.docs.length) {
        throw new Error(
          `Missing native create version for typed ID ${JSON.stringify([typeof id, id])}`,
        )
      }
      const target = { collection: heads, parentID: id }
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
        await writeBranchHead({
          expected,
          nextState: {
            type: 'version',
            version: reference,
            structure: scope.type === 'locale' ? reference : null,
          },
          req,
          target,
        })
      }
    }
    await bootstrapBranchProjectionPage({ branchID, collection: heads, req })
    if (collection === wideIDsSlug) {
      await bootstrapBranchProjectionPage({
        branchID,
        collection: payload.collections[fractionalIDsSlug]!.config.custom.branchStorage.heads,
        req,
      })
    }
    await payload.db.commitTransaction(transactionID)
  } finally {
    if (payload.db.sessions?.[transactionID]) {
      await payload.db.rollbackTransaction(transactionID)
    }
  }
}

/* eslint-disable payload/no-relative-monorepo-imports -- Verify existing Mongo numeric identities in experimental native branch storage. */
import type { Payload, PayloadRequest } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { compileBranchScopeFields } from '../../packages/payload/src/versions/branches/compileBranchScopeFields.js'
import { planLegacyBranchHeads } from '../../packages/payload/src/versions/branches/migrations/planLegacyBranchHeads.js'
import {
  decodeBranchProjectionDocument,
  encodeBranchProjectionID,
} from '../../packages/payload/src/versions/branches/queries/branchProjectionCodec.js'
import { bootstrapBranchProjectionPage } from '../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import {
  readBranchHeadToken,
  writeBranchHead,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import { createBranchIdentityVisibility } from '../../packages/payload/src/versions/branches/storage/branchIdentityStore.js'
import { initializeBranchVersion } from '../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { test } from '../__helpers/int/vitest.js'
import { fractionalIDsSlug } from './slugs.js'

test.suite('Existing fractional numeric identities', { config: './config.ts' }, () => {
  test.options(
    'should preserve fractional Mongo custom IDs in ordinary reads and version parents',
    { db: 'mongo' },
    async ({ payload }) => {
      const doc = await payload.create({
        collection: fractionalIDsSlug,
        data: { id: 1.5, title: 'Fractional legacy ID' },
      })
      const read = await payload.findByID({ collection: fractionalIDsSlug, id: 1.5 })
      const versions = await payload.findVersions({
        collection: fractionalIDsSlug,
        where: { parent: { equals: 1.5 } },
      })

      expect(doc.id).toBe(1.5)
      expect(read.id).toBe(1.5)
      expect(versions.docs).toHaveLength(1)
      expect(versions.docs[0]!.parent).toBe(1.5)
    },
  )
  test.options(
    'should preserve fractional logical IDs through head adoption and effective projection relationships',
    { db: 'mongo' },
    async ({ payload }) => {
      await payload.create({ collection: fractionalIDsSlug, data: { id: 2.5, title: 'Related' } })
      const doc = await payload.create({
        collection: fractionalIDsSlug,
        data: {
          id: 1.5,
          title: 'Fractional branch ID',
          related: 2.5,
          rows: [{ id: 1.5, label: 'Fractional row', translation: 'English' }],
        },
      })
      const versions = await payload.findVersions({
        collection: fractionalIDsSlug,
        where: { parent: { equals: doc.id } },
      })
      expect(
        (await payload.findByID({ collection: fractionalIDsSlug, id: 1.5 })).rows?.[0]?.id,
      ).toBe(1.5)
      expect(versions.docs[0].version.rows?.[0]?.id).toBe(1.5)
      const scopeFields = compileBranchScopeFields({
        fields: payload.collections[fractionalIDsSlug].config.fields,
      })
      const legacyData = versions.docs[0].version
      expect(() =>
        planLegacyBranchHeads({
          fields: scopeFields,
          locales: ['en', 'fr'],
          materialized: {
            data: { ...legacyData, _status: 'published' },
            version: { id: versions.docs[0].id, generation: 1 },
          },
          working: {
            data: {
              ...legacyData,
              rows: [{ id: 1.5, label: 'Fractional row', translation: { en: 'Changed' } }],
            },
            version: { id: 'new-working', generation: 1 },
          },
          statusMode: 'scalar',
        }),
      ).not.toThrow()
      const storage = payload.collections[fractionalIDsSlug]!.config.custom.branchStorage
      const control = payload.collections[fractionalIDsSlug]!.config.custom.branchQueryStorage
      const target = { collection: storage.heads, parentID: doc.id }

      await transaction({
        payload,
        run: async ({ req }) => {
          const reference = await initializeBranchVersion({
            branchID: 'main',
            isFrozen: false,
            req,
            target,
            versionID: versions.docs[0]!.id,
          })
          const scope = { type: 'shared' as const }
          const expected = await readBranchHeadToken({ branchID: 'main', req, scope, target })

          await createBranchIdentityVisibility({
            branchID: 'main',
            isLegacyDraftVisible: true,
            req,
            target,
          })
          expect(
            await writeBranchHead({
              expected,
              nextState: { type: 'version', version: reference, structure: null },
              req,
              target,
            }),
          ).not.toBeNull()
          await bootstrapBranchProjectionPage({ branchID: 'main', collection: storage.heads, req })
          const row = await payload.db.findOne({
            collection: control.projection,
            locale: 'all',
            req,
            where: {
              id: { equals: encodeBranchProjectionID({ branchID: 'main', logicalID: doc.id }) },
            },
          })
          const decoded = decodeBranchProjectionDocument({
            branchID: 'main',
            blocks: payload.config.blocks,
            data: row!,
            fields: payload.collections[fractionalIDsSlug]!.config.fields,
            projectionSlugs: { [fractionalIDsSlug]: control.projection },
          })

          expect(decoded.id).toBe(1.5)
          expect(decoded.related).toBe(2.5)
          expect(decoded.rows).toMatchObject([{ id: 1.5, label: 'Fractional row' }])
        },
      })
    },
  )
})

const transaction = async ({
  payload,
  run,
}: {
  payload: Payload
  run: (args: { req: PayloadRequest }) => Promise<void>
}): Promise<void> => {
  const req = await createPayloadRequest({ payload })
  const id = await payload.db.beginTransaction()
  if (id === null) {
    throw new Error('Native transaction required.')
  }
  req.transactionID = id
  try {
    await run({ req })
    await payload.db.commitTransaction(id)
  } finally {
    if (payload.db.sessions?.[id]) {
      await payload.db.rollbackTransaction(id)
    }
  }
}

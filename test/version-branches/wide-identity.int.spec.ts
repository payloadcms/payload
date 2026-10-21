/* eslint-disable payload/no-relative-monorepo-imports -- Preserve existing custom ID widths throughout experimental branch storage. */
import type { Payload, PayloadRequest } from 'payload'

import { createHash } from 'node:crypto'
import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import {
  decodeBranchProjectionDocument,
  encodeBranchProjectionID,
} from '../../packages/payload/src/versions/branches/queries/branchProjectionCodec.js'
import { invalidateBranchProjection } from '../../packages/payload/src/versions/branches/queries/branchProjectionGuard.js'
import {
  bootstrapBranchProjectionPage,
  rebuildBranchProjection,
} from '../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import {
  discardBranchHead,
  readBranchHeadToken,
  writeBranchHead,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import { createBranchIdentityVisibility } from '../../packages/payload/src/versions/branches/storage/branchIdentityStore.js'
import {
  initializeBranchVersion,
  pinBranchVersion,
} from '../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import { articleHeadsSlug, articlesSlug, fractionalIDsSlug, wideIDsSlug } from './slugs.js'

const scopes = [
  { type: 'shared' as const },
  { type: 'locale' as const, locale: 'en' },
  { type: 'locale' as const, locale: 'fr' },
]
const makeWideID = ({ seed }: { seed: string }): string =>
  Array.from({ length: 83 }, (_, index) =>
    createHash('sha256').update(`${seed}:${index}`).digest('base64url'),
  )
    .join('')
    .slice(0, 2640)

test.suite(
  'Existing wide custom identity compatibility',
  { config: './config.ts', ...nativeBranchDatabaseOptions },
  () => {
    test('should preserve full custom IDs through heads, pins, visibility, invalidation, and projection relationships', async ({
      payload,
    }) => {
      const id = makeWideID({ seed: 'source' })
      const relatedID = makeWideID({ seed: 'related' })
      const related = await payload.create({
        collection: wideIDsSlug,
        data: { id: relatedID, title: 'Related' },
      })
      await payload.create({
        collection: fractionalIDsSlug,
        data: { id: 1, title: 'Numeric target' },
      })
      const indexedText = makeWideID({ seed: 'index-tuple' })
      const doc = await payload.create({
        collection: wideIDsSlug,
        data: {
          id,
          title: 'Original',
          related: related.id,
          indexedText,
          relatedNumber: 1,
          details: { relatedNumber: 1 },
          rowsWithAnOrdinarilyValidCustomDatabaseNameThatMustRemainSupported: [{ choice: 'first' }],
        },
      })
      const storage = payload.collections[wideIDsSlug]!.config.custom.branchStorage
      const target = { collection: storage.heads, parentID: doc.id }
      const control = payload.collections[wideIDsSlug]!.config.custom.branchQueryStorage
      const versions = await payload.findVersions({
        collection: wideIDsSlug,
        where: { parent: { equals: id } },
      })

      expect(doc.id).toBe(id)
      expect(id.length).toBe(2640)
      await transaction({
        payload,
        run: async ({ req }) => {
          const ref = await initializeBranchVersion({
            branchID: 'main',
            isFrozen: false,
            req,
            target,
            versionID: versions.docs[0]!.id,
          })
          await createBranchIdentityVisibility({
            branchID: 'main',
            isLegacyDraftVisible: true,
            req,
            target,
          })
          await pinBranchVersion({
            reference: ref,
            req,
            target,
            rootKey: makeWideID({ seed: 'root' }),
          })
          for (const scope of scopes) {
            const expected = await readBranchHeadToken({ branchID: 'main', req, scope, target })
            expect(
              await writeBranchHead({
                expected,
                nextState: {
                  type: 'version',
                  version: ref,
                  structure: scope.type === 'locale' ? ref : null,
                },
                req,
                target,
              }),
            ).not.toBeNull()
          }
          await bootstrapBranchProjectionPage({ branchID: 'main', collection: storage.heads, req })
          const dirty = await invalidateBranchProjection({
            branchID: 'main',
            control,
            logicalID: id,
            req,
            scope: scopes[0]!,
          })
          expect(dirty.logicalID).toBe(id)
          expect(dirty.identityKey).toHaveLength(64)
          await rebuildBranchProjection({ branchID: 'main', req, target })
          await bootstrapBranchProjectionPage({ branchID: 'main', collection: storage.heads, req })
          const row = await payload.db.findOne({
            collection: control.projection,
            locale: 'all',
            req,
            where: {
              id: { equals: encodeBranchProjectionID({ branchID: 'main', logicalID: id }) },
            },
          })
          expect(row).not.toBeNull()
          const decoded = decodeBranchProjectionDocument({
            branchID: 'main',
            blocks: payload.config.blocks,
            data: row!,
            fields: payload.collections[wideIDsSlug]!.config.fields,
            projectionSlugs: {
              [wideIDsSlug]: control.projection,
              [fractionalIDsSlug]:
                payload.collections[fractionalIDsSlug].config.custom.branchQueryStorage.projection,
            },
          })
          expect(decoded.id).toBe(id)
          expect(decoded.related).toBe(relatedID)
          expect(decoded.indexedText).toBe(indexedText)
          expect(decoded.relatedNumber).toBe(1)
          expect(decoded.details).toMatchObject({ relatedNumber: 1 })
          expect(
            decoded.rowsWithAnOrdinarilyValidCustomDatabaseNameThatMustRemainSupported,
          ).toMatchObject([{ choice: 'first' }])
          const scope = scopes[1]!
          const original = await readBranchHeadToken({ branchID: 'main', req, scope, target })
          expect(
            await writeBranchHead({
              expected: original,
              nextState: { type: 'version', version: ref, structure: ref },
              req,
              target,
            }),
          ).toMatchObject({ generation: 2 })
          const before = await readBranchHeadToken({ branchID: 'main', req, scope, target })
          const absent = await discardBranchHead({ expected: before, req, target })
          expect(absent?.incarnation).toBe(1)
          expect(
            await writeBranchHead({
              expected: absent!,
              nextState: { type: 'version', version: ref, structure: ref },
              req,
              target,
            }),
          ).toMatchObject({ incarnation: 1, generation: 1 })
        },
      })
      await transaction({
        payload,
        shouldCommit: false,
        run: async ({ req }) => {
          const expected = await readBranchHeadToken({
            branchID: 'main',
            req,
            scope: scopes[1]!,
            target,
          })
          await discardBranchHead({ expected, req, target })
        },
      })
      const req = await createPayloadRequest({ payload })
      expect(
        await readBranchHeadToken({ branchID: 'main', req, scope: scopes[1]!, target }),
      ).toMatchObject({ incarnation: 1, generation: 1, state: { type: 'version' } })
    })
    test.options(
      'should reject string aliases for numeric source IDs before head, pin, or visibility writes',
      { db: 'drizzle' },
      async ({ payload }) => {
        if (payload.db.defaultIDType !== 'number') {
          return
        }
        const doc = await payload.create({
          collection: articlesSlug,
          data: { title: 'Typed identity' },
        })
        const versions = await payload.findVersions({
          collection: articlesSlug,
          where: { parent: { equals: doc.id } },
        })
        const target = { collection: articleHeadsSlug, parentID: String(doc.id) }

        await transaction({
          payload,
          run: async ({ req }) => {
            await expect(
              readBranchHeadToken({ branchID: 'main', req, scope: scopes[0]!, target }),
            ).rejects.toThrow('source collection ID type')
            await expect(
              createBranchIdentityVisibility({
                branchID: 'main',
                isLegacyDraftVisible: true,
                req,
                target,
              }),
            ).rejects.toThrow('source collection ID type')
            await expect(
              pinBranchVersion({
                reference: { id: versions.docs[0]!.id, generation: 1 },
                req,
                rootKey: 'typed-alias',
                target,
              }),
            ).rejects.toThrow('source collection ID type')
            await expect(
              writeBranchHead({
                expected: {
                  branchID: 'main',
                  scope: scopes[0]!,
                  generation: null,
                  incarnation: 0,
                  state: null,
                },
                nextState: { type: 'withdrawn' },
                req,
                target,
              }),
            ).rejects.toThrow('source collection ID type')
            expect((await payload.db.count({ collection: articleHeadsSlug, req })).totalDocs).toBe(
              0,
            )
            const storage = payload.collections[articlesSlug]!.config.custom.branchStorage
            expect((await payload.db.count({ collection: storage.pins, req })).totalDocs).toBe(0)
            expect(
              (await payload.db.count({ collection: storage.identities, req })).totalDocs,
            ).toBe(0)
          },
        })
      },
    )
  },
)

const transaction = async ({
  payload,
  run,
  shouldCommit = true,
}: {
  payload: Payload
  run: (args: { req: PayloadRequest }) => Promise<void>
  shouldCommit?: boolean
}): Promise<void> => {
  const req = await createPayloadRequest({ payload })
  const id = await payload.db.beginTransaction()
  if (id === null) {
    throw new Error('Native transaction required.')
  }
  req.transactionID = id
  try {
    await run({ req })
    if (shouldCommit) {
      await payload.db.commitTransaction(id)
    } else {
      await payload.db.rollbackTransaction(id)
    }
  } finally {
    if (payload.db.sessions?.[id]) {
      await payload.db.rollbackTransaction(id)
    }
  }
}

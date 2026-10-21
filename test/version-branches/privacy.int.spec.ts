/* eslint-disable payload/no-relative-monorepo-imports -- Verify private adapter metadata never becomes an accidental legacy API. */
import type { Payload, PayloadRequest } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import {
  initializeBranchVersion,
  saveBranchAutosave,
} from '../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import { articleHeadsSlug, articlesSlug, settingsHeadsSlug, settingsSlug } from './slugs.js'

const metadata = ['branchFrozen', 'branchGeneration', 'branchOnly', 'branchOwnerKey']

test.suite('Private branch adapter metadata', { config: './config.ts' }, () => {
  test.options(
    'should exclude private snapshots when version access inherits the collection read policy',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      const article = await payload.create({
        collection: articlesSlug,
        data: { title: 'Legacy' },
        draft: true,
      })
      const versions = await payload.db.findVersions({
        collection: articlesSlug,
        where: { parent: { equals: article.id } },
      })
      const target = { collection: articleHeadsSlug, parentID: article.id }
      const snapshot = await transaction({
        payload,
        run: async ({ req }) => {
          const reference = await initializeBranchVersion({
            branchID: 'drafts',
            isFrozen: true,
            req,
            target,
            versionID: versions.docs[0]!.id,
          })

          return saveBranchAutosave({
            branchID: 'staging',
            data: { title: { en: 'Private staged content' } },
            expected: reference,
            req,
            target,
          })
        },
      })

      await expect(
        payload.findVersionByID({
          collection: articlesSlug,
          id: String(snapshot.id),
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toMatchObject({ status: 404 })
      expect(
        (
          await payload.findVersionByID({
            collection: articlesSlug,
            id: String(versions.docs[0]!.id),
            overrideAccess: false,
            user: null,
          })
        ).version.title,
      ).toBe('Legacy')
    },
  )

  test.options(
    'should retain native collection metadata while stripping legacy history and by-ID responses',
    nativeBranchDatabaseOptions,
    async ({ payload, restClient }) => {
      const article = await payload.create({
        collection: articlesSlug,
        data: { title: 'Legacy history' },
        draft: true,
      })
      const versions = await payload.db.findVersions({
        collection: articlesSlug,
        where: { parent: { equals: article.id } },
      })
      const versionID = versions.docs[0]!.id

      await transaction({
        payload,
        run: ({ req }) =>
          initializeBranchVersion({
            branchID: 'drafts',
            isFrozen: true,
            req,
            target: { collection: articleHeadsSlug, parentID: article.id },
            versionID,
          }),
      })

      const raw = await payload.db.findVersions({
        collection: articlesSlug,
        where: { id: { equals: versionID } },
      })
      const history = await payload.findVersions({
        collection: articlesSlug,
        where: { parent: { equals: article.id } },
      })
      const version = await payload.findVersionByID({
        collection: articlesSlug,
        id: String(versionID),
        overrideAccess: false,
        user: null,
      })
      const response = await restClient.GET(`/${articlesSlug}/versions/${versionID}`, {
        auth: false,
      })

      expect(response.status).toBe(200)
      expect(raw.docs[0]).toMatchObject({
        branchFrozen: true,
        branchGeneration: 1,
        branchOwnerKey: 'string:drafts',
      })
      for (const item of [...history.docs, version, await response.json()]) {
        for (const key of metadata) {
          expect(item).not.toHaveProperty(key)
        }
      }
    },
  )

  test.options(
    'should retain native global metadata while stripping legacy history and by-ID responses',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Global history' },
        draft: true,
      })
      const versions = await payload.db.findGlobalVersions({ global: settingsSlug })
      const versionID = versions.docs[0]!.id

      await transaction({
        payload,
        run: ({ req }) =>
          initializeBranchVersion({
            branchID: 'drafts',
            isFrozen: true,
            req,
            target: { collection: settingsHeadsSlug },
            versionID,
          }),
      })

      const raw = await payload.db.findGlobalVersions({
        global: settingsSlug,
        where: { id: { equals: versionID } },
      })
      const history = await payload.findGlobalVersions({ slug: settingsSlug })
      const version = await payload.findGlobalVersionByID({
        slug: settingsSlug,
        id: String(versionID),
      })

      expect(raw.docs[0]).toMatchObject({
        branchFrozen: true,
        branchGeneration: 1,
        branchOwnerKey: 'string:drafts',
      })
      for (const item of [...history.docs, version]) {
        for (const key of metadata) {
          expect(item).not.toHaveProperty(key)
        }
      }
    },
  )

  test('should keep private branch metadata out of collection and global GraphQL schemas', async ({
    restClient,
  }) => {
    const response = await restClient.GRAPHQL_POST({
      auth: false,
      body: JSON.stringify({
        query: '{ __schema { types { name fields { name } inputFields { name } } } }',
      }),
    })
    const result = (await response.json()) as {
      data?: {
        __schema: {
          types: {
            fields: { name: string }[] | null
            inputFields: { name: string }[] | null
            name: string
          }[]
        }
      }
      errors?: unknown
    }
    const types = result.data?.__schema.types.filter(
      ({ name }) => name.includes('BranchHead') && name.includes('Version'),
    )

    expect(result.errors).toBeUndefined()
    expect(types?.length).toBeGreaterThanOrEqual(2)
    for (const type of types!) {
      for (const field of [...(type.fields ?? []), ...(type.inputFields ?? [])]) {
        expect(metadata).not.toContain(field.name)
      }
    }
  })
})

const transaction = async <T>({
  payload,
  run,
}: {
  payload: Payload
  run: (args: { req: PayloadRequest }) => Promise<T>
}): Promise<T> => {
  const req = await createPayloadRequest({ payload })

  req.transactionID = (await payload.db.beginTransaction())!

  try {
    const result = await run({ req })

    await payload.db.commitTransaction(req.transactionID)

    return result
  } catch (error) {
    await payload.db.rollbackTransaction(req.transactionID)
    throw error
  }
}

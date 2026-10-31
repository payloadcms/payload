/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */

import type { Payload } from 'payload'

import fs from 'fs'
import path from 'path'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  richTextMediaDirectory,
  richTextMediaSlug,
  richTextNumericOtherTargetsSlug,
  richTextNumericTargetsSlug,
  richTextOwnersSlug,
  richTextRelationshipBlockSlug,
  richTextTargetsSlug,
  richTextUploadInlineBlockSlug,
} from './richtext-reference-safety.config.js'
import { branchChangesSlug, branchesSlug } from './shared.js'

const branchReferenceErrorMessage =
  'Branch-created content cannot be deleted while a surviving document or version references it.'

const createBranch = ({ payload }: { payload: Payload }) =>
  payload.create({
    collection: branchesSlug,
    data: { name: 'Rich text reference safety' },
    overrideAccess: true,
  })

const richTextWithNode = (node: Record<string, unknown>) => ({
  root: {
    type: 'root',
    children: [node],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
})

const getRelationshipID = (value: unknown): unknown =>
  value && typeof value === 'object' && 'id' in value ? (value as { id: unknown }).id : value

const findBranchChange = async ({
  branch,
  collectionSlug,
  docID,
  payload,
}: {
  branch: string
  collectionSlug: string
  docID: number | string
  payload: Payload
}) => {
  const changes = await payload.find({
    collection: branchChangesSlug,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { branch: { equals: branch } },
        { collectionSlug: { equals: collectionSlug } },
        { 'doc.value': { equals: docID } },
      ],
    },
  })

  return changes.docs[0]!
}

test.suite(
  'Branch rich text reference safety',
  { config: './richtext-reference-safety.config.ts' },
  () => {
    test.afterEach(async () => {
      await fs.promises.rm(richTextMediaDirectory, { force: true, recursive: true })
    })

    test('should block discard when surviving rich text has a relationship to branch-created content', async ({
      payload,
    }) => {
      const branch = await createBranch({ payload })
      const target = await payload.create({
        branch: branch.slug,
        collection: richTextTargetsSlug as never,
        data: { title: 'branch target' },
        overrideAccess: true,
      })

      await payload.create({
        collection: richTextOwnersSlug as never,
        data: {
          content: richTextWithNode({
            type: 'relationship',
            format: '',
            relationTo: richTextTargetsSlug,
            value: target.id,
            version: 2,
          }),
        } as never,
        overrideAccess: true,
      })

      await expect(
        payload.branches.discard({ branch: branch.slug, overrideAccess: true }),
      ).rejects.toMatchObject({ message: branchReferenceErrorMessage, status: 409 })
    })

    test('should block discard when surviving rich text has an upload to branch-created media', async ({
      payload,
    }) => {
      const branch = await createBranch({ payload })
      const media = await payload.create({
        branch: branch.slug,
        collection: richTextMediaSlug as never,
        data: { alt: 'branch upload' },
        file: {
          name: 'branch-upload.txt',
          data: Buffer.from('branch upload bytes'),
          mimetype: 'text/plain',
          size: 19,
        },
        overrideAccess: true,
      })
      const mediaPath = path.resolve(richTextMediaDirectory, media.filename as string)

      await payload.create({
        collection: richTextOwnersSlug as never,
        data: {
          content: richTextWithNode({
            id: 'upload-node',
            type: 'upload',
            fields: {},
            format: '',
            relationTo: richTextMediaSlug,
            value: media.id,
            version: 2,
          }),
        } as never,
        overrideAccess: true,
      })

      await expect(
        payload.branches.discard({ branch: branch.slug, overrideAccess: true }),
      ).rejects.toMatchObject({ message: branchReferenceErrorMessage, status: 409 })
      expect(fs.existsSync(mediaPath)).toBe(true)
    })
  },
)

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

    test('should block a selected merge when a relationship refers to an unselected branch create', async ({
      payload,
    }) => {
      const branch = await createBranch({ payload })
      const owner = await payload.create({
        collection: richTextOwnersSlug as never,
        data: {} as never,
        overrideAccess: true,
      })
      const target = await payload.create({
        branch: branch.slug,
        collection: richTextTargetsSlug as never,
        data: { title: 'unselected relationship target' },
        overrideAccess: true,
      })

      await payload.update({
        id: owner.id,
        branch: branch.slug,
        collection: richTextOwnersSlug as never,
        data: { target: target.id } as never,
        overrideAccess: true,
      })

      const ownerChange = await findBranchChange({
        branch: branch.slug,
        collectionSlug: richTextOwnersSlug,
        docID: owner.id,
        payload,
      })
      const result = await payload.branches.merge({
        branch: branch.slug,
        changes: [ownerChange.id],
        overrideAccess: true,
      })
      const mainOwner = await payload.findByID({
        id: owner.id,
        collection: richTextOwnersSlug as never,
        overrideAccess: true,
      })

      expect(result.blocked).toContainEqual(
        expect.objectContaining({
          changeID: ownerChange.id,
          collectionSlug: richTextOwnersSlug,
          docID: owner.id,
          reason: 'dependency',
        }),
      )
      expect(result.merged).toHaveLength(0)
      expect(mainOwner.target).toBeNull()
    })

    test('should block a selected merge when rich text refers to an unselected branch create', async ({
      payload,
    }) => {
      const branch = await createBranch({ payload })
      const owner = await payload.create({
        collection: richTextOwnersSlug as never,
        data: {} as never,
        overrideAccess: true,
      })
      const target = await payload.create({
        branch: branch.slug,
        collection: richTextTargetsSlug as never,
        data: { title: 'unselected rich text target' },
        overrideAccess: true,
      })

      await payload.update({
        id: owner.id,
        branch: branch.slug,
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

      const ownerChange = await findBranchChange({
        branch: branch.slug,
        collectionSlug: richTextOwnersSlug,
        docID: owner.id,
        payload,
      })
      const result = await payload.branches.merge({
        branch: branch.slug,
        changes: [ownerChange.id],
        overrideAccess: true,
      })
      const mainOwner = await payload.findByID({
        id: owner.id,
        collection: richTextOwnersSlug as never,
        overrideAccess: true,
      })

      expect(result.blocked).toContainEqual(
        expect.objectContaining({
          changeID: ownerChange.id,
          collectionSlug: richTextOwnersSlug,
          docID: owner.id,
          reason: 'dependency',
        }),
      )
      expect(result.merged).toHaveLength(0)
      expect(mainOwner.content).toBeNull()
    })

    test('should block a selected merge when a rich text block relationship refers to an unselected branch create', async ({
      payload,
    }) => {
      const branch = await createBranch({ payload })
      const owner = await payload.create({
        collection: richTextOwnersSlug as never,
        data: {} as never,
        overrideAccess: true,
      })
      const target = await payload.create({
        branch: branch.slug,
        collection: richTextTargetsSlug as never,
        data: { title: 'unselected rich text block target' },
        overrideAccess: true,
      })

      await payload.update({
        id: owner.id,
        branch: branch.slug,
        collection: richTextOwnersSlug as never,
        data: {
          content: richTextWithNode({
            type: 'block',
            fields: {
              id: 'relationship-block-node',
              blockName: '',
              blockType: richTextRelationshipBlockSlug,
              target: target.id,
            },
            format: '',
            version: 2,
          }),
        } as never,
        overrideAccess: true,
      })

      const ownerChange = await findBranchChange({
        branch: branch.slug,
        collectionSlug: richTextOwnersSlug,
        docID: owner.id,
        payload,
      })
      const result = await payload.branches.merge({
        branch: branch.slug,
        changes: [ownerChange.id],
        overrideAccess: true,
      })
      const mainOwner = await payload.findByID({
        id: owner.id,
        collection: richTextOwnersSlug as never,
        overrideAccess: true,
      })

      expect(result.blocked).toContainEqual(
        expect.objectContaining({ changeID: ownerChange.id, reason: 'dependency' }),
      )
      expect(result.merged).toHaveLength(0)
      expect(mainOwner.content).toBeNull()
    })

    test('should block a selected merge when a rich text inline-block upload refers to an unselected branch create', async ({
      payload,
    }) => {
      const branch = await createBranch({ payload })
      const owner = await payload.create({
        collection: richTextOwnersSlug as never,
        data: {} as never,
        overrideAccess: true,
      })
      const media = await payload.create({
        branch: branch.slug,
        collection: richTextMediaSlug as never,
        data: { alt: 'unselected rich text inline-block upload' },
        file: {
          name: 'inline-block-upload.txt',
          data: Buffer.from('inline block upload bytes'),
          mimetype: 'text/plain',
          size: 25,
        },
        overrideAccess: true,
      })

      await payload.update({
        id: owner.id,
        branch: branch.slug,
        collection: richTextOwnersSlug as never,
        data: {
          content: richTextWithNode({
            type: 'inlineBlock',
            fields: {
              id: 'upload-inline-block-node',
              blockType: richTextUploadInlineBlockSlug,
              media: media.id,
            },
            version: 1,
          }),
        } as never,
        overrideAccess: true,
      })

      const ownerChange = await findBranchChange({
        branch: branch.slug,
        collectionSlug: richTextOwnersSlug,
        docID: owner.id,
        payload,
      })
      const result = await payload.branches.merge({
        branch: branch.slug,
        changes: [ownerChange.id],
        overrideAccess: true,
      })
      const mainOwner = await payload.findByID({
        id: owner.id,
        collection: richTextOwnersSlug as never,
        overrideAccess: true,
      })

      expect(result.blocked).toContainEqual(
        expect.objectContaining({ changeID: ownerChange.id, reason: 'dependency' }),
      )
      expect(result.merged).toHaveLength(0)
      expect(mainOwner.content).toBeNull()
    })

    test('should block a selected owner when its selected dependency is blocked by access', async ({
      payload,
    }) => {
      const branch = await createBranch({ payload })
      const editor = await payload.create({
        collection: 'users',
        data: { email: 'dependency-editor@example.com', password: 'test' },
        overrideAccess: true,
      })
      const owner = await payload.create({
        collection: richTextOwnersSlug as never,
        data: {} as never,
        overrideAccess: true,
      })
      const target = await payload.create({
        branch: branch.slug,
        collection: richTextTargetsSlug as never,
        data: { title: 'blocked merge target' },
        overrideAccess: true,
      })

      await payload.update({
        id: owner.id,
        branch: branch.slug,
        collection: richTextOwnersSlug as never,
        data: { target: target.id } as never,
        overrideAccess: true,
      })

      const ownerChange = await findBranchChange({
        branch: branch.slug,
        collectionSlug: richTextOwnersSlug,
        docID: owner.id,
        payload,
      })
      const targetChange = await findBranchChange({
        branch: branch.slug,
        collectionSlug: richTextTargetsSlug,
        docID: target.id,
        payload,
      })
      const result = await payload.branches.merge({
        branch: branch.slug,
        changes: [targetChange.id, ownerChange.id],
        overrideAccess: false,
        user: { ...editor, collection: 'users' },
      })

      expect(result.blocked).toContainEqual(
        expect.objectContaining({ changeID: targetChange.id, reason: 'access' }),
      )
      expect(result.blocked).toContainEqual(
        expect.objectContaining({ changeID: ownerChange.id, reason: 'dependency' }),
      )
      expect(JSON.stringify(result.blocked)).not.toContain('blocked merge target')
      expect(result.merged).toHaveLength(0)
    })

    test('should allow an owner and its branch-created dependency to merge together', async ({
      payload,
    }) => {
      const branch = await createBranch({ payload })
      const owner = await payload.create({
        collection: richTextOwnersSlug as never,
        data: {} as never,
        overrideAccess: true,
      })
      const target = await payload.create({
        branch: branch.slug,
        collection: richTextTargetsSlug as never,
        data: { title: 'selected relationship target' },
        overrideAccess: true,
      })

      await payload.update({
        id: owner.id,
        branch: branch.slug,
        collection: richTextOwnersSlug as never,
        data: { target: target.id } as never,
        overrideAccess: true,
      })

      const ownerChange = await findBranchChange({
        branch: branch.slug,
        collectionSlug: richTextOwnersSlug,
        docID: owner.id,
        payload,
      })
      const targetChange = await findBranchChange({
        branch: branch.slug,
        collectionSlug: richTextTargetsSlug,
        docID: target.id,
        payload,
      })
      const result = await payload.branches.merge({
        branch: branch.slug,
        changes: [targetChange.id, ownerChange.id],
        overrideAccess: true,
      })
      const mainOwner = await payload.findByID({
        id: owner.id,
        collection: richTextOwnersSlug as never,
        overrideAccess: true,
      })

      expect(result.blocked).toHaveLength(0)
      expect(result.merged).toHaveLength(2)
      expect(getRelationshipID(mainOwner.target)).toBe(target.id)
    })

    test('should not reorder a change for a same-ID relationship owned by another block type', async ({
      payload,
    }) => {
      const branch = await createBranch({ payload })

      await payload.create({
        collection: richTextNumericOtherTargetsSlug as never,
        data: { id: 42, title: 'main other target' } as never,
        overrideAccess: true,
      })

      const owner = await payload.create({
        collection: richTextOwnersSlug as never,
        data: { title: 'main block owner' } as never,
        overrideAccess: true,
      })

      await payload.update({
        id: owner.id,
        branch: branch.slug,
        collection: richTextOwnersSlug as never,
        data: {
          layout: [{ blockType: 'numeric-other-target-link', target: 42 }],
          title: 'branch block owner',
        } as never,
        overrideAccess: true,
      })

      const target = await payload.create({
        branch: branch.slug,
        collection: richTextNumericTargetsSlug as never,
        data: { id: 42, title: 'branch target with same ID' } as never,
        overrideAccess: true,
      })
      const result = await payload.branches.merge({
        branch: branch.slug,
        overrideAccess: true,
      })
      const mainOwner = await payload.findByID({
        id: owner.id,
        collection: richTextOwnersSlug as never,
        depth: 0,
        overrideAccess: true,
      })
      const layout = mainOwner.layout as Array<Record<string, unknown>>

      expect(result.blocked).toHaveLength(0)
      expect(result.merged.map(({ docID }) => docID)).toEqual([owner.id, target.id])
      expect(getRelationshipID(layout[0]?.target)).toBe(42)
    })

    test('should block a merge that refers to a create pending on another branch', async ({
      payload,
    }) => {
      const targetBranch = await createBranch({ payload })
      const ownerBranch = await createBranch({ payload })
      const owner = await payload.create({
        collection: richTextOwnersSlug as never,
        data: {} as never,
        overrideAccess: true,
      })
      const target = await payload.create({
        branch: targetBranch.slug,
        collection: richTextTargetsSlug as never,
        data: { title: 'other branch target' },
        overrideAccess: true,
      })

      await payload.update({
        id: owner.id,
        branch: ownerBranch.slug,
        collection: richTextOwnersSlug as never,
        data: { target: target.id } as never,
        overrideAccess: true,
      })

      const ownerChange = await findBranchChange({
        branch: ownerBranch.slug,
        collectionSlug: richTextOwnersSlug,
        docID: owner.id,
        payload,
      })
      const result = await payload.branches.merge({
        branch: ownerBranch.slug,
        changes: [ownerChange.id],
        overrideAccess: true,
      })

      expect(result.blocked).toContainEqual(
        expect.objectContaining({ changeID: ownerChange.id, reason: 'dependency' }),
      )
      expect(result.merged).toHaveLength(0)
    })
  },
)

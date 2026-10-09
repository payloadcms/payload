/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */

import type { Payload, PayloadRequest } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { localizedCategoryBlockSlug } from './config.js'
import { hookSpy } from './hookSpy.js'
import { branchChangesSlug, branchesSlug, categoriesSlug, postsSlug } from './shared.js'

const createBranch = ({ name, payload }: { name: string; payload: Payload }) =>
  payload.create({
    collection: branchesSlug,
    data: { name },
    overrideAccess: true,
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

const updateBranchPostDirectly = async ({
  branch,
  data,
  docID,
  req,
}: {
  branch: string
  data: Record<string, unknown>
  docID: number | string
  req: PayloadRequest
}) => {
  const shadow = await req.payload.db.findOne({
    branch: false,
    collection: postsSlug,
    req,
    where: {
      and: [{ _branch: { equals: branch } }, { _branchDocID: { equals: docID } }],
    },
  })

  if (!shadow) {
    throw new Error(`Branch shadow for post ${String(docID)} was not found`)
  }

  await req.payload.db.updateOne({
    branch: false,
    collection: postsSlug,
    data,
    req,
    where: { id: { equals: shadow.id } },
  })
}

test.suite('Branch merge dependency preflight', { config: './config.ts' }, () => {
  test.afterEach(() => {
    hookSpy.beforeMerge = undefined
  })

  test('should recheck dependencies after beforeMerge changes selected branch data', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Dependency recheck', payload })
    const owner = await payload.create({
      collection: postsSlug,
      data: { title: 'main owner' },
      overrideAccess: true,
    })
    const target = await payload.create({
      branch: branch.slug,
      collection: categoriesSlug,
      data: { name: 'unselected target' },
      overrideAccess: true,
    })

    await payload.update({
      id: owner.id,
      branch: branch.slug,
      collection: postsSlug,
      data: { title: 'safe branch owner' },
      overrideAccess: true,
    })

    const ownerChange = await findBranchChange({
      branch: branch.slug,
      collectionSlug: postsSlug,
      docID: owner.id,
      payload,
    })

    hookSpy.beforeMerge = async ({ req }) => {
      await updateBranchPostDirectly({
        branch: branch.slug,
        data: { category: target.id },
        docID: owner.id,
        req,
      })
    }

    const result = await payload.branches.merge({
      branch: branch.slug,
      changes: [ownerChange.id],
      overrideAccess: true,
    })

    const mainOwner = await payload.findByID({
      id: owner.id,
      collection: postsSlug,
      depth: 0,
      overrideAccess: true,
    })
    const pendingOwnerChange = await payload.findByID({
      id: ownerChange.id,
      collection: branchChangesSlug,
      disableErrors: true,
      overrideAccess: true,
    })

    expect(result.canMerge).toBe(false)
    expect(result.blocked).toContainEqual(
      expect.objectContaining({
        changeID: ownerChange.id,
        reason: 'dependency',
      }),
    )
    expect(mainOwner.category === null || mainOwner.category === undefined).toBe(true)
    expect(pendingOwnerChange).not.toBeNull()
  })

  test('should apply selected branch creates before changes that depend on them', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Dependency ordering', payload })
    const owner = await payload.create({
      collection: postsSlug,
      data: { title: 'main owner' },
      overrideAccess: true,
    })

    await payload.update({
      id: owner.id,
      branch: branch.slug,
      collection: postsSlug,
      data: { title: 'branch owner' },
      overrideAccess: true,
    })

    const target = await payload.create({
      branch: branch.slug,
      collection: categoriesSlug,
      data: { name: 'selected target' },
      overrideAccess: true,
    })

    await payload.update({
      id: owner.id,
      branch: branch.slug,
      collection: postsSlug,
      data: { category: target.id },
      overrideAccess: true,
    })

    const originalBeginTransaction = payload.db.beginTransaction
    const progressDocumentIDs: (number | string)[] = []

    payload.db.beginTransaction = () => Promise.resolve(null)

    try {
      await expect(
        payload.branches.merge({
          branch: branch.slug,
          onProgress: ({ docID }) => {
            progressDocumentIDs.push(docID)

            if (String(docID) === String(target.id)) {
              throw new Error('Stop before the dependency is promoted')
            }
          },
          overrideAccess: true,
        }),
      ).rejects.toThrow('Stop before the dependency is promoted')
    } finally {
      payload.db.beginTransaction = originalBeginTransaction
    }

    const mainOwner = await payload.findByID({
      id: owner.id,
      collection: postsSlug,
      depth: 0,
      overrideAccess: true,
    })

    expect(progressDocumentIDs[0]).toBe(target.id)
    expect(mainOwner.category === null || mainOwner.category === undefined).toBe(true)
  })

  test('should apply a selected create before its localized owner', async ({ payload }) => {
    const branch = await createBranch({ name: 'Localized dependency ordering', payload })
    const owner = await payload.create({
      collection: postsSlug,
      data: { title: 'main localized owner' },
      overrideAccess: true,
    })

    await payload.update({
      id: owner.id,
      branch: branch.slug,
      collection: postsSlug,
      data: { title: 'branch localized owner' },
      overrideAccess: true,
    })

    const target = await payload.create({
      branch: branch.slug,
      collection: categoriesSlug,
      data: { name: 'selected localized target' },
      overrideAccess: true,
    })

    await payload.update({
      id: owner.id,
      branch: branch.slug,
      collection: postsSlug,
      data: { localizedCategory: target.id } as never,
      locale: 'en',
      overrideAccess: true,
    })

    const result = await payload.branches.merge({
      branch: branch.slug,
      overrideAccess: true,
    })
    const mainOwner = (await payload.findByID({
      id: owner.id,
      collection: postsSlug,
      depth: 0,
      locale: 'en',
      overrideAccess: true,
    })) as Record<string, unknown>

    expect(result.merged.map(({ docID }) => docID)).toEqual([target.id, owner.id])
    expect(mainOwner.localizedCategory).toBe(target.id)
  })

  test('should apply a selected create before its localized reusable-block owner', async ({
    payload,
  }) => {
    const branch = await createBranch({
      name: 'Localized reusable-block dependency ordering',
      payload,
    })
    const owner = await payload.create({
      collection: postsSlug,
      data: {
        sharedLayout: [{ blockType: localizedCategoryBlockSlug, category: null }],
        title: 'main reusable-block owner',
      } as never,
      overrideAccess: true,
    })

    await payload.update({
      id: owner.id,
      branch: branch.slug,
      collection: postsSlug,
      data: { title: 'branch reusable-block owner' },
      overrideAccess: true,
    })

    const target = await payload.create({
      branch: branch.slug,
      collection: categoriesSlug,
      data: { name: 'selected reusable-block target' },
      overrideAccess: true,
    })

    await payload.update({
      id: owner.id,
      branch: branch.slug,
      collection: postsSlug,
      data: {
        sharedLayout: [{ blockType: localizedCategoryBlockSlug, category: target.id }],
      } as never,
      locale: 'en',
      overrideAccess: true,
    })

    const result = await payload.branches.merge({
      branch: branch.slug,
      overrideAccess: true,
    })
    const mainOwner = (await payload.findByID({
      id: owner.id,
      collection: postsSlug,
      depth: 0,
      locale: 'en',
      overrideAccess: true,
    })) as Record<string, unknown>
    const sharedLayout = mainOwner.sharedLayout as Array<Record<string, unknown>>

    expect(result.merged.map(({ docID }) => docID)).toEqual([target.id, owner.id])
    expect(getRelationshipID(sharedLayout[0]?.category)).toBe(target.id)
  })

  test('should recheck dependencies after onProgress changes selected branch data', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Dependency at use', payload })
    const owner = await payload.create({
      collection: postsSlug,
      data: { title: 'main owner' },
      overrideAccess: true,
    })
    const target = await payload.create({
      branch: branch.slug,
      collection: categoriesSlug,
      data: { name: 'late target' },
      overrideAccess: true,
    })

    await payload.update({
      id: owner.id,
      branch: branch.slug,
      collection: postsSlug,
      data: { title: 'safe branch owner' },
      overrideAccess: true,
    })

    const ownerChange = await findBranchChange({
      branch: branch.slug,
      collectionSlug: postsSlug,
      docID: owner.id,
      payload,
    })
    let mergeRequest: PayloadRequest | undefined
    let branchUpdateCompleted = false

    hookSpy.beforeMerge = ({ req }) => {
      mergeRequest = req
    }

    await expect(
      payload.branches.merge({
        branch: branch.slug,
        changes: [ownerChange.id],
        onProgress: async () => {
          if (!mergeRequest) {
            throw new Error('Merge request was not captured')
          }

          await updateBranchPostDirectly({
            branch: branch.slug,
            data: { category: target.id },
            docID: owner.id,
            req: mergeRequest,
          })
          branchUpdateCompleted = true
        },
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ status: 409 })

    const mainOwner = await payload.findByID({
      id: owner.id,
      collection: postsSlug,
      depth: 0,
      overrideAccess: true,
    })
    const pendingOwnerChange = await payload.findByID({
      id: ownerChange.id,
      collection: branchChangesSlug,
      disableErrors: true,
      overrideAccess: true,
    })

    expect(branchUpdateCompleted).toBe(true)
    expect(mainOwner.category === null || mainOwner.category === undefined).toBe(true)
    expect(pendingOwnerChange).not.toBeNull()
  })
})

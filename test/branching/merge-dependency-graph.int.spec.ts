/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */

import type { Payload } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  deletionSafetyBranchGlobalSlug,
  deletionSafetyOwnersSlug,
  deletionSafetyTargetsSlug,
} from './deletion-safety.config.js'
import { deletionSafetySpy, resetDeletionSafetySpy } from './deletionSafetySpy.js'
import { branchChangesSlug, branchesSlug } from './shared.js'

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

test.suite('Branch merge dependency graph', { config: './deletion-safety.config.ts' }, () => {
  test.beforeEach(() => {
    resetDeletionSafetySpy()
  })

  test('should merge an acyclic chain of selected branch creates', async ({ payload }) => {
    const branch = await createBranch({ name: 'Acyclic dependency chain', payload })
    const root = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      data: { title: 'root' },
      overrideAccess: true,
    })
    const middle = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      data: { title: 'middle' },
      overrideAccess: true,
    })
    const leaf = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      data: { title: 'leaf' },
      overrideAccess: true,
    })

    await payload.update({
      id: root.id,
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      data: { relatedTarget: middle.id },
      overrideAccess: true,
    })
    await payload.update({
      id: middle.id,
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      data: { relatedTarget: leaf.id },
      overrideAccess: true,
    })

    const result = await payload.branches.merge({
      branch: branch.slug,
      overrideAccess: true,
    })
    const mainRoot = await payload.findByID({
      id: root.id,
      branch: false,
      collection: deletionSafetyTargetsSlug,
      depth: 0,
      overrideAccess: true,
    })
    const mainMiddle = await payload.findByID({
      id: middle.id,
      branch: false,
      collection: deletionSafetyTargetsSlug,
      depth: 0,
      overrideAccess: true,
    })
    const mainLeaf = await payload.findByID({
      id: leaf.id,
      branch: false,
      collection: deletionSafetyTargetsSlug,
      depth: 0,
      overrideAccess: true,
    })

    expect(result.blocked).toHaveLength(0)
    expect(result.merged.map(({ docID }) => docID)).toEqual([leaf.id, middle.id, root.id])
    expect(getRelationshipID(mainRoot.relatedTarget)).toBe(middle.id)
    expect(getRelationshipID(mainMiddle.relatedTarget)).toBe(leaf.id)
    expect(mainLeaf.title).toBe('leaf')
  })

  test('should reject cyclic selected branch creates before writing main', async ({ payload }) => {
    const branch = await createBranch({ name: 'Cyclic dependency', payload })
    const first = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      data: { title: 'first' },
      overrideAccess: true,
    })
    const second = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      data: { title: 'second' },
      overrideAccess: true,
    })

    await payload.update({
      id: first.id,
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      data: { relatedTarget: second.id },
      overrideAccess: true,
    })
    await payload.update({
      id: second.id,
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      data: { relatedTarget: first.id },
      overrideAccess: true,
    })

    await expect(
      payload.branches.merge({ branch: branch.slug, overrideAccess: true }),
    ).rejects.toMatchObject({ status: 409 })

    const firstOnMain = await payload.db.findOne({
      collection: deletionSafetyTargetsSlug,
      where: {
        and: [{ id: { equals: first.id } }, { _branch: { equals: 'main' } }],
      },
    })
    const secondOnMain = await payload.db.findOne({
      collection: deletionSafetyTargetsSlug,
      where: {
        and: [{ id: { equals: second.id } }, { _branch: { equals: 'main' } }],
      },
    })
    const pendingChanges = await payload.find({
      collection: branchChangesSlug,
      overrideAccess: true,
      pagination: false,
      where: { branch: { equals: branch.slug } },
    })

    expect(firstOnMain).toBeNull()
    expect(secondOnMain).toBeNull()
    expect(pendingChanges.docs).toHaveLength(2)
  })

  test('should merge a global after its selected branch-created dependency', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Global dependency', payload })
    const target = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      data: { title: 'global target' },
      overrideAccess: true,
    })

    await payload.updateGlobal({
      slug: deletionSafetyBranchGlobalSlug,
      branch: branch.slug,
      data: { target: target.id },
      overrideAccess: true,
    })

    const result = await payload.branches.merge({
      branch: branch.slug,
      overrideAccess: true,
    })
    const mainTarget = await payload.findByID({
      id: target.id,
      branch: false,
      collection: deletionSafetyTargetsSlug,
      overrideAccess: true,
    })
    const mainGlobal = await payload.findGlobal({
      slug: deletionSafetyBranchGlobalSlug,
      branch: false,
      depth: 0,
      overrideAccess: true,
    })

    expect(result.blocked).toHaveLength(0)
    expect(result.merged.map(({ entityType }) => entityType)).toEqual(['collection', 'global'])
    expect(mainTarget.title).toBe('global target')
    expect(getRelationshipID(mainGlobal.target)).toBe(target.id)
  })

  test('should reject a collection dependency added by a hook before the main write', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Collection hook dependency', payload })
    const owner = await payload.create({
      collection: deletionSafetyOwnersSlug,
      data: { title: 'main owner' },
      overrideAccess: true,
    })
    const target = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      data: { title: 'unselected target' },
      overrideAccess: true,
    })

    await payload.update({
      id: owner.id,
      branch: branch.slug,
      collection: deletionSafetyOwnersSlug,
      data: { title: 'branch owner' },
      overrideAccess: true,
    })

    const ownerChange = await findBranchChange({
      branch: branch.slug,
      collectionSlug: deletionSafetyOwnersSlug,
      docID: owner.id,
      payload,
    })
    const originalBeginTransaction = payload.db.beginTransaction

    deletionSafetySpy.mainMergeCollectionDependencyTargetID = target.id
    payload.db.beginTransaction = () => Promise.resolve(null)

    try {
      await expect(
        payload.branches.merge({
          branch: branch.slug,
          changes: [ownerChange.id],
          overrideAccess: true,
        }),
      ).rejects.toMatchObject({ status: 409 })
    } finally {
      payload.db.beginTransaction = originalBeginTransaction
    }

    const mainOwner = await payload.db.findOne({
      collection: deletionSafetyOwnersSlug,
      where: {
        and: [{ id: { equals: owner.id } }, { _branch: { equals: 'main' } }],
      },
    })
    const pendingOwnerChange = await payload.findByID({
      id: ownerChange.id,
      collection: branchChangesSlug,
      disableErrors: true,
      overrideAccess: true,
    })

    expect(mainOwner?.title).toBe('main owner')
    expect(mainOwner?.target ?? null).toBeNull()
    expect(pendingOwnerChange).not.toBeNull()
  })

  test('should reject a global dependency added by a hook before the main write', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Global hook dependency', payload })
    const target = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      data: { title: 'unselected global target' },
      overrideAccess: true,
    })

    await payload.updateGlobal({
      slug: deletionSafetyBranchGlobalSlug,
      branch: false,
      data: { target: null, title: 'main global' },
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: deletionSafetyBranchGlobalSlug,
      branch: branch.slug,
      data: { target: null, title: 'branch global' },
      overrideAccess: true,
    })

    const globalChanges = await payload.find({
      collection: branchChangesSlug,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { branch: { equals: branch.slug } },
          { globalSlug: { equals: deletionSafetyBranchGlobalSlug } },
        ],
      },
    })
    const globalChange = globalChanges.docs[0]!
    const originalBeginTransaction = payload.db.beginTransaction

    deletionSafetySpy.mainMergeGlobalDependencyTargetID = target.id
    payload.db.beginTransaction = () => Promise.resolve(null)

    try {
      await expect(
        payload.branches.merge({
          branch: branch.slug,
          changes: [globalChange.id],
          overrideAccess: true,
        }),
      ).rejects.toMatchObject({ status: 409 })
    } finally {
      payload.db.beginTransaction = originalBeginTransaction
    }

    const mainGlobal = await payload.findGlobal({
      slug: deletionSafetyBranchGlobalSlug,
      branch: false,
      depth: 0,
      overrideAccess: true,
    })
    const pendingGlobalChange = await payload.findByID({
      id: globalChange.id,
      collection: branchChangesSlug,
      disableErrors: true,
      overrideAccess: true,
    })

    expect(mainGlobal.title).toBe('main global')
    expect(mainGlobal.target).toBeNull()
    expect(pendingGlobalChange).not.toBeNull()
  })
})
